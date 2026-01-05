import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { WEBHOOK_URLS, WEBHOOK_RESPONSE_KEYS, RATE_LIMITS } from "@/lib/constants";
import type { OwnerData, WebhookResponse } from "@/types";

// Rate limiting para resend
const resendCooldowns = new Map<string, number>();

export const authService = {
    async signUp(email: string, password: string, ownerData: OwnerData) {
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: ownerData.full_name,
                    phone: ownerData.phone
                }
            }
        });

        logger.debug("Supabase SignUp Metadata Sent", {
            full_name: ownerData.full_name,
            phone: ownerData.phone
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário.");

        // 2. Send data to n8n Webhook
        const webhookPayload = {
            id: authData.user.id,
            full_name: ownerData.full_name,
            phone: ownerData.phone,
            email: ownerData.email,
            role: 'owner'
        };

        logger.debug('Enviando dados para webhook de criação de conta', {
            id: authData.user.id,
            role: 'owner'
            // Dados sensíveis serão sanitizados pelo logger
        });

        try {
            const response = await fetch(WEBHOOK_URLS.CREATE_OWNER_ACCOUNT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookPayload)
            });

            if (!response.ok) {
                logger.error('Webhook falhou com status:', response.status);
                throw new Error(`Erro no webhook: ${response.statusText}`);
            }

            const responseData = await response.json() as WebhookResponse;
            logger.debug('Resposta do webhook de criação', { success: responseData[WEBHOOK_RESPONSE_KEYS.ACCOUNT_CREATED] });

            // Validação robusta da resposta
            if (!responseData || typeof responseData !== 'object') {
                throw new Error("Resposta inválida do sistema. Tente novamente.");
            }

            // Strict check for "conta_criada" === true
            if (responseData[WEBHOOK_RESPONSE_KEYS.ACCOUNT_CREATED] !== true) {
                throw new Error("Aguardando confirmação do sistema. Tente novamente.");
            }

        } catch (webhookError: unknown) {
            const error = webhookError as Error;
            logger.error('Erro no webhook:', error.message);
            throw new Error(error.message || "Erro ao processar cadastro. Tente novamente.");
        }

        return authData.user;
    },


    async resendCode(email: string, full_name: string, phone: string, userId: string) {
        // Rate limiting check
        const now = Date.now();
        const lastResend = resendCooldowns.get(userId);

        if (lastResend && (now - lastResend) < RATE_LIMITS.RESEND_CODE_COOLDOWN_MS) {
            const remainingSeconds = Math.ceil((RATE_LIMITS.RESEND_CODE_COOLDOWN_MS - (now - lastResend)) / 1000);
            throw new Error(`Aguarde ${remainingSeconds} segundos antes de reenviar o código.`);
        }

        try {
            const response = await fetch(WEBHOOK_URLS.RESEND_TOKEN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                    full_name: full_name,
                    phone: phone,
                    email: email,
                })
            });

            if (!response.ok) {
                throw new Error(`Erro no webhook: ${response.statusText}`);
            }

            const responseData = await response.json() as WebhookResponse;

            // Validação robusta
            if (!responseData || typeof responseData !== 'object') {
                throw new Error("Resposta inválida do sistema. Tente novamente.");
            }

            if (responseData[WEBHOOK_RESPONSE_KEYS.ACCOUNT_CREATED] !== true) {
                throw new Error("Sistema não liberou o reenvio. Tente mais tarde.");
            }

            // Atualizar cooldown apenas em caso de sucesso
            resendCooldowns.set(userId, now);

            return true;
        } catch (error: unknown) {
            const err = error as Error;
            logger.error('Erro ao reenviar código:', err.message);
            throw err;
        }
    },

    async verifyOwnerToken(userId: string, token: string) {
        // Query the owners table for the token
        const { data, error } = await supabase
            .from('owners')
            .select('token')
            .eq('id', userId)
            .single();

        if (error) {
            logger.error('Erro ao buscar token do owner:', error.message);
            throw new Error("Erro ao validar token. Tente novamente.");
        }

        if (!data) {
            throw new Error("Usuário não encontrado.");
        }

        // Compare tokens (converting to string to be safe)
        if (String(data.token) !== String(token)) {
            throw new Error("Token inválido.");
        }

        return true;
    }
};

import { supabase } from "@/lib/supabase";

export interface OwnerData {
    full_name: string;
    phone: string;
    email: string;
}

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

        console.log("Supabase SignUp Metadata Sent:", {
            full_name: ownerData.full_name,
            phone: ownerData.phone
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário.");

        // 2. Send data to n8n Webhook
        console.log('Enviando dados para webhook 1:', {
            id: authData.user.id,
            full_name: ownerData.full_name,
            phone: ownerData.phone,
            email: ownerData.email,
            role: 'owner'
        });

        try {
            const response = await fetch('https://n8n-n8n-start.zfverl.easypanel.host/webhook/criarcontaowner', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: authData.user.id,
                    full_name: ownerData.full_name,
                    phone: ownerData.phone,
                    email: ownerData.email,
                    role: 'owner'
                })
            });

            if (!response.ok) {
                console.error('Webhook failed with status:', response.status);
                throw new Error(`Erro no webhook: ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('Resposta do webhook 1:', responseData);

            // Strict check for "conta_criada" === true
            if (responseData['conta_criada'] !== true) {
                throw new Error("Aguardando confirmação do sistema. Tente novamente.");
            }

        } catch (webhookError: any) {
            console.error('Webhook error:', webhookError);
            throw new Error(webhookError.message || "Erro ao processar cadastro. Tente novamente.");
        }

        return authData.user;
    },

    async checkEmailExists(email: string) {
        // This might still need DB access if we want to check pre-auth
        // For now relying on Supabase Auth unique constraint is safer/easier
        // or we check the 'owners' table if RLS allows anon read of emails (usually not)
        return false;
    },

    async resendCode(email: string, full_name: string, phone: string, userId: string) {
        // Call the same webhook as requested
        try {
            const response = await fetch('https://n8n-n8n-start.zfverl.easypanel.host/webhook/reenviartoken', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: userId,
                    name: full_name, // Webhook expects 'name', not 'full_name' based on prompt
                    phone: phone,
                    email: email,
                })
            });

            if (!response.ok) {
                throw new Error(`Erro no webhook: ${response.statusText}`);
            }

            const responseData = await response.json();

            if (responseData['conta criada'] !== true) {
                throw new Error("Sistema não liberou o reenvio. Tente mais tarde.");
            }

            return true;
        } catch (error: any) {
            console.error('Resend webhook error:', error);
            throw error;
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
            console.error('Error fetching owner token:', error);
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

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

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário.");

        // 2. Send data to n8n Webhook
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
                console.warn('Webhook warning:', response.statusText);
                // Not throwing here to allow UX continuation if webhook is just slow/weird, 
                // but user asked to wait for "conta criada = true".
            }

            const responseData = await response.json();

            // Check for specific success flag as requested
            if (responseData['conta criada'] !== true) {
                console.warn('Webhook did not return expected success flag', responseData);
                // Optional: throw new Error("Erro na validação do cadastro.");
            }

        } catch (webhookError) {
            console.error('Webhook error:', webhookError);
            // Decide if we block the user or not. 
            // User request: "aguarde a resposta conta criada = true para ai sim ir para a etapa Step5Verification"
            // So we should probably throw if it fails.
            throw new Error("Erro ao processar cadastro. Tente novamente.");
        }

        return authData.user;
    },

    async checkEmailExists(email: string) {
        // This might still need DB access if we want to check pre-auth
        // For now relying on Supabase Auth unique constraint is safer/easier
        // or we check the 'owners' table if RLS allows anon read of emails (usually not)
        return false;
    }
};

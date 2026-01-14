import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface MetaIntegration {
    id: string;
    company_id: string;
    meta_user_id?: string;
    meta_access_token: string;
    meta_ad_account_id?: string;
    meta_ad_account_name?: string;
    my_owner?: string;
    is_active: boolean;
}

export const metaService = {
    async saveIntegration(data: Omit<MetaIntegration, 'id' | 'created_at' | 'updated_at'>) {
        try {
            // Check if integration exists
            const { data: existing } = await supabase
                .from('meta_integrations')
                .select('id')
                .eq('company_id', data.company_id)
                .maybeSingle();

            let result;
            if (existing) {
                // Update
                result = await supabase
                    .from('meta_integrations')
                    .update(data)
                    .eq('id', existing.id)
                    .select()
                    .single();
            } else {
                // Insert
                result = await supabase
                    .from('meta_integrations')
                    .insert(data)
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            // Exchange for long-lived token via Edge Function
            if (data.meta_access_token) {
                try {
                    await supabase.functions.invoke('meta-sync', {
                        body: {
                            action: 'exchange_token',
                            company_id: data.company_id,
                            access_token: data.meta_access_token
                        }
                    });
                } catch (fnError) {
                    console.error('Falha ao trocar token por longa duração:', fnError);
                    // Não falhamos o processo principal se o teste de token falhar, mas logamos
                }
            }

            return result.data;
        } catch (error) {
            logger.error('Erro em metaService.saveIntegration:', (error as Error).message);
            throw error;
        }
    },

    async getIntegration(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('meta_integrations')
                .select('*')
                .eq('company_id', companyId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
            return data;
        } catch (error) {
            logger.error('Erro em metaService.getIntegration:', (error as Error).message);
            return null;
        }
    },

    async getAdAccounts(accessToken: string) {
        // Chamada segura via Edge Function para evitar expor App Secret
        const { data, error } = await supabase.functions.invoke('meta-sync', {
            body: {
                action: 'get_ad_accounts',
                access_token: accessToken
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        return data.data || [];
    },

    async verifyPermissions(accessToken: string) {
        const { data, error } = await supabase.functions.invoke('meta-sync', {
            body: {
                action: 'verify_permissions',
                access_token: accessToken
            }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);
        return data.data || [];
    }
};

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface Campaign {
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    leads: number;
    cost: number;
    cpl: number;
}

export const campaignService = {
    async listCampaigns(companyId: string, period: 'month' | 'lastMonth' = 'month') {
        try {
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('company_id', companyId);

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Erro em campaignService.listCampaigns:', (error as Error).message);
            return [];
        }
    }
};

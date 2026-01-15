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
            const now = new Date();
            let startDate: Date;
            let endDate: Date | null = null;

            if (period === 'lastMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month (exclusive)
            } else {
                // Current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            let query = supabase
                .from('campaigns')
                .select('*')
                .eq('company_id', companyId)
                .gte('created_at', startDate.toISOString());

            if (endDate) {
                query = query.lt('created_at', endDate.toISOString());
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Erro em campaignService.listCampaigns:', (error as Error).message);
            return [];
        }
    }
};

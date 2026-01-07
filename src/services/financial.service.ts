import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface FinancialTransaction {
    id: string;
    date: string;
    description: string;
    type: 'sale' | 'rental' | 'commission' | 'expense' | 'other';
    total_amount: number;
    status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
    due_date: string;
}

export const financialService = {
    async listTransactions(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('company_id', companyId)
                .order('due_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Erro em financialService.listTransactions:', (error as Error).message);
            return [];
        }
    }
};

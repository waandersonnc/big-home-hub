import { supabase } from "@/lib/supabase";

export interface TeamMemberData {
    email: string;
    full_name: string;
    phone: string;
    user_type: 'manager' | 'broker';
    manager_id?: string;
    real_estate_company_id: string;
    owner_id: string;
}

export const teamService = {
    async listManagers(companyId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('user_type', 'manager')
            .eq('real_estate_company_id', companyId);

        if (error) throw error;
        return data;
    },

    async listBrokers(companyId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*, manager:manager_id(full_name)')
            .eq('user_type', 'broker')
            .eq('real_estate_company_id', companyId);

        if (error) throw error;
        return data;
    },

    async createMember(data: TeamMemberData) {
        // Note: Creating user in Auth requires Admin API (Service Role Key)
        // For standard clients, we simulate the flow via an Edge Function OR
        // direct DB insertion if Auth is handled separately.
        // HERE we assume an Edge Function 'create-user' exists for security.

        const { data: result, error } = await supabase.functions.invoke('create-team-user', {
            body: data
        });

        if (error) throw error;
        return result;
    },

    async updateManager(brokerId: string, newManagerId: string) {
        const { error } = await supabase
            .from('users')
            .update({ manager_id: newManagerId })
            .eq('id', brokerId);

        if (error) throw error;
    }
};

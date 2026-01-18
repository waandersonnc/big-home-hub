import { supabase } from "@/lib/supabase";

export interface TeamMemberData {
    email: string;
    full_name: string;
    phone: string;
    user_type: 'manager' | 'broker';
    manager_id?: string;
    company_id: string;
    owner_id: string;
}

export const teamService = {
    async listManagers(companyId: string) {
        const { data, error } = await supabase
            .from('managers')
            .select('*')
            .eq('company_id', companyId);

        if (error) throw error;
        return (data || []).map(u => ({
            ...u,
            full_name: u.name, // map name to full_name for frontend
            role: 'manager'
        }));
    },

    async listBrokers(companyId: string) {
        const { data, error } = await supabase
            .from('brokers')
            .select('*')
            .eq('company_id', companyId);

        if (error) throw error;
        return (data || []).map(u => ({
            ...u,
            full_name: u.name, // map name to full_name for frontend
            role: 'broker',
            manager_id: u.my_manager
        }));
    },

    async createMember(data: TeamMemberData) {
        // Note: Creating user in Auth requires Admin API (Service Role Key)
        // For standard clients, we simulate the flow via an Edge Function OR
        // direct DB insertion if Auth is handled separately.
        // HERE we assume an Edge Function 'create-team-user' exists for security.

        const { data: result, error } = await supabase.functions.invoke('create-team-user', {
            body: data
        });

        if (error) throw error;
        return result;
    },

    async updateManager(brokerId: string, newManagerId: string) {
        const { error } = await supabase
            .from('brokers')
            .update({ my_manager: newManagerId })
            .eq('id', brokerId);

        if (error) throw error;
    },

    async deleteBroker(brokerId: string) {
        // 1. Redistribute leads: Reset leads assigned to this broker
        const { error: updateError } = await supabase
            .from('leads')
            .update({ 
                my_broker: null, 
                my_manager: null,
                stage: 'novo',
                updated_at: new Date().toISOString()
            })
            .eq('my_broker', brokerId);

        if (updateError) throw updateError;

        // 2. Delete the user from Auth and public tables via Edge Function
        const { error: deleteError } = await supabase.functions.invoke('delete-team-user', {
            body: { userId: brokerId }
        });

        if (deleteError) throw deleteError;

        return { success: true };
    }
};

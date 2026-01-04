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
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Falha ao criar usuário.");

        // 2. Insert into owners table
        const { error: dbError } = await supabase
            .from("owners")
            .insert({
                id: authData.user.id,
                full_name: ownerData.full_name,
                phone: ownerData.phone,
                email: ownerData.email,
            });

        if (dbError) {
            // If DB insert fails, we might want to delete the auth user in a real app
            // but Supabase doesn't easily allow that from client side for security.
            throw dbError;
        }

        return authData.user;
    },

    async checkEmailExists(email: string) {
        const { data, error } = await supabase
            .from("owners")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    }
};

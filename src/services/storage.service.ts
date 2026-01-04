import { supabase } from "@/lib/supabase";

export const storageService = {
    async uploadProfilePhoto(userId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `profiles/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    },

    async uploadCompanyLogo(ownerId: string, companyId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${ownerId}-${companyId}-${Math.random()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('company-logos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from('company-logos')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }
};

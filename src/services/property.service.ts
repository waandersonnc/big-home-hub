import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export interface Property {
    id: string;
    title: string;
    property_type: string;
    address: string;
    neighborhood: string;
    city: string;
    state: string;
    price: number;
    status: 'available' | 'reserved' | 'sold' | 'rented';
    bedrooms?: number;
    bathrooms?: number;
    parking_spaces?: number;
    area_total?: number;
    description?: string;
    images?: string[];
}

export const propertyService = {
    async listProperties(companyId: string) {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('company_id', companyId)
                .eq('active', true);

            if (error) throw error;
            return data || [];
        } catch (error) {
            logger.error('Erro em propertyService.listProperties:', (error as Error).message);
            return [];
        }
    }
};

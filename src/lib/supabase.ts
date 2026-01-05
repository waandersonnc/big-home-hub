import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn('Supabase URL ou Anon Key não configuradas! Verifique o arquivo .env.local')

    // Em desenvolvimento, apenas avisar. Em produção, poderia throw error
    if (import.meta.env.PROD) {
        throw new Error('Configuração do Supabase ausente. Verifique as variáveis de ambiente.')
    }
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

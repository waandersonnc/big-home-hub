import { createClient } from '@supabase/supabase-js'

// Support both Vite (import.meta.env) and Node (process.env)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Please check .env.local')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      presets: {
        Row: { id: string; user_id: string; start_time: string; end_time: string; daily_count: number; updated_at: string }
        Insert: { user_id: string; start_time: string; end_time: string; daily_count: number }
        Update: { start_time?: string; end_time?: string; daily_count?: number }
      }
      daily_plans: {
        Row: { id: string; user_id: string; date: string; planned_time: string; actual_time: string | null; sort_order: number; created_at: string }
        Insert: { user_id: string; date: string; planned_time: string; sort_order: number }
        Update: { planned_time?: string; actual_time?: string | null }
      }
    }
  }
}

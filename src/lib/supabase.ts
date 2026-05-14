import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl?.startsWith('https://') && supabaseAnonKey?.startsWith('eyJ')) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  console.warn('Supabase credentials not configured. Using mock client for UI preview.')

  // Return a mock client that returns empty/null results for preview
  const noop = () => {}
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
      signInWithPassword: () => Promise.resolve({ data: {}, error: new Error('Supabase not configured') }),
      signUp: () => Promise.resolve({ data: {}, error: new Error('Supabase not configured') }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: () => ({
              lte: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
              order: () => Promise.resolve({ data: [], error: null }),
            }),
            single: () => Promise.resolve({ data: null, error: null }),
            order: () => Promise.resolve({ data: [], error: null }),
          }),
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
      upsert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

export const supabase = createSupabaseClient()

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

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const defaultUrl = 'https://lqcfvyjlhfsloqsxrklh.supabase.co'
const defaultKey = 'sb_publishable_HPh2j8gVFtN6miV2_1MRSQ_HVAC0K5W'

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || defaultUrl
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || defaultKey

export const isSupabaseConfigured = Boolean(
  url &&
  key &&
  url.startsWith('https://') &&
  !url.includes('YOUR_PROJECT') &&
  !key.includes('YOUR_PUBLIC')
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

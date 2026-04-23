import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_LOVABLE_URL as string
const anonKey = import.meta.env.VITE_LOVABLE_ANON_KEY as string

export const lovable = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

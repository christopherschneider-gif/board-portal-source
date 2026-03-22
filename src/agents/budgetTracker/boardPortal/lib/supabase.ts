import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_BOARD_PORTAL_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_BOARD_PORTAL_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Missing Board Portal Supabase credentials. Add VITE_BOARD_PORTAL_SUPABASE_URL and VITE_BOARD_PORTAL_SUPABASE_ANON_KEY to .env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

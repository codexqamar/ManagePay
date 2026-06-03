import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabase: SupabaseClient | null = null

export function getSupabaseBrowserClient() {
  if (supabase) {
    return supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase configuration is missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    )
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey)
  return supabase
}

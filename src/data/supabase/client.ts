import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Only the project URL and the publishable (anon) key belong in the browser. Never a service-role key. */
export function createSupabaseClient(url: string, publishableKey: string): SupabaseClient {
  return createClient(url, publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  })
}

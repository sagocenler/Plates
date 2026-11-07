import type { Repos } from './interfaces'
import { createLocalRepos } from './local/repos'
import { createSupabaseClient } from './supabase/client'
import { createSupabaseRepos } from './supabase/repos'

/**
 * `npm run dev` / default: everything local (IndexedDB, any-email sign-in).
 * `npm run dev:supabase` (mode "supabase"): real backend, configured in .env.supabase.local.
 * Drafts stay on-device in both modes.
 */
export function createRepos(): Repos {
  const local = createLocalRepos()
  if (import.meta.env.VITE_DATA_BACKEND !== 'supabase') return local
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  if (!url || !key) throw new Error('VITE_DATA_BACKEND=supabase needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see .env.example)')
  return { ...createSupabaseRepos(createSupabaseClient(url, key)), drafts: local.drafts }
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase admin client using the SERVICE_ROLE key.
 * NEVER use this in client components or expose to the browser.
 * The typeof window guard provides runtime protection.
 */
let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function getAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('getAdminClient() called from browser context. This is a server-only function.')
  }
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    adminClient = createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return adminClient
}

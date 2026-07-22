'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function listTokensAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('api_tokens')
    .select('id, name, last_used_at, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function generateTokenAction(name: string) {
  if (!name || !name.trim()) throw new Error('Token name is required')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Generate secure random string
  const rawToken = 'gw_pat_' + crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  const { data, error } = await supabase
    .from('api_tokens')
    .insert({
      user_id: user.id,
      token_hash: tokenHash,
      name: name.trim()
    })
    .select()

  if (error) throw new Error(error.message)
  return { rawToken, id: data[0].id }
}

export async function revokeTokenAction(tokenId: string) {
  if (!tokenId) throw new Error('Token ID is required')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('api_tokens')
    .delete()
    .eq('id', tokenId)

  if (error) throw new Error(error.message)
  return { success: true }
}

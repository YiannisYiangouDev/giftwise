import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(7)
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { wishlist_id, product_name, product_url, image_url, target_price } = body

  if (!wishlist_id || !product_name) {
    return NextResponse.json({ error: 'wishlist_id and product_name are required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const parsedPrice = target_price ? parseFloat(parseFloat(target_price).toFixed(2)) : null

  const { data, error } = await supabase.rpc('add_extension_item', {
    token_hash_input: tokenHash,
    wishlist_id_input: wishlist_id,
    product_name_input: product_name,
    product_url_input: product_url || null,
    image_url_input: image_url || null,
    target_price_input: parsedPrice
  })

  if (error) {
    console.error('Error clipping item for extension:', error)
    if (error.message.includes('Invalid token')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, item: data })
}

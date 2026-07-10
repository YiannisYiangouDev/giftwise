import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'GiftWise <alerts@giftwise.app>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function sendPriceDropEmail({
  to, productName, oldPrice, newPrice, storeUrl, imageUrl, targetPrice
}: {
  to: string; productName: string; oldPrice: number; newPrice: number
  storeUrl: string; imageUrl?: string; targetPrice: number
}) {
  const pctOff = Math.round(((oldPrice - newPrice) / oldPrice) * 100)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `📉 Price drop! ${productName} is now €${newPrice}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#f97316">🎁 Price Drop Alert</h2>
          ${imageUrl ? `<img src="${imageUrl}" width="200" style="border-radius:8px;margin-bottom:16px" />` : ''}
          <h3 style="margin:0 0 8px">${productName}</h3>
          <p style="font-size:28px;font-weight:bold;margin:0">€${newPrice}</p>
          <p style="color:#9ca3af;margin:4px 0 16px">
            <s>€${oldPrice}</s> &nbsp; ↓ ${pctOff}% off &nbsp;·&nbsp; Your target: €${targetPrice}
          </p>
          <a href="${storeUrl}" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Product</a>
          <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb" />
          <p style="font-size:12px;color:#9ca3af">You're receiving this because you set a target price on GiftWise. <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
        </div>
      `,
    }),
  })
}

serve(async (_req) => {
  // Get all items with target_price and a product_url
  const { data: items } = await supabase
    .from('wishlist_items')
    .select(`
      id, product_name, product_url, image_url,
      current_best_price, target_price,
      wishlist:wishlists(user_id)
    `)
    .not('target_price', 'is', null)
    .not('product_url', 'is', null)

  if (!items?.length) return new Response('No items', { status: 200 })

  let sent = 0
  for (const item of items) {
    const current = parseFloat(item.current_best_price)
    const target = parseFloat(item.target_price)
    if (!current || !target || current > target) continue

    // Get previous alert to avoid duplicate emails
    const { data: lastAlert } = await supabase
      .from('price_alerts')
      .select('new_price, triggered_at')
      .eq('item_id', item.id)
      .order('triggered_at', { ascending: false })
      .limit(1)
      .single()

    if (lastAlert && parseFloat(lastAlert.new_price) === current) continue // already alerted at this price

    // @ts-ignore
    const userId = item.wishlist?.user_id
    if (!userId) continue

    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    // Check user notification preferences
    const { data: prefs } = await supabase
      .from('user_settings')
      .select('email_price_drops')
      .eq('user_id', userId)
      .single()

    if (prefs?.email_price_drops === false) continue

    const oldPrice = lastAlert ? parseFloat(lastAlert.new_price) : current + 1
    await sendPriceDropEmail({
      to: user.email,
      productName: item.product_name,
      oldPrice,
      newPrice: current,
      storeUrl: item.product_url,
      imageUrl: item.image_url,
      targetPrice: target,
    })

    // Insert price_alert row
    await supabase.from('price_alerts').insert({
      item_id: item.id,
      old_price: oldPrice,
      new_price: current,
    })

    sent++
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})

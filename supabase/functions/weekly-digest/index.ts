import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'GiftWise <digest@giftwise.app>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (_req) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Get all price changes in last 7 days grouped by user
  const { data: alerts } = await supabase
    .from('price_alerts')
    .select(`
      id, old_price, new_price, triggered_at,
      wishlist_item:wishlist_items(product_name, product_url, image_url, wishlist:wishlists(user_id))
    `)
    .gte('triggered_at', sevenDaysAgo)
    .order('triggered_at', { ascending: false })

  if (!alerts?.length) return new Response('No alerts this week', { status: 200 })

  // Group by user_id
  const byUser: Record<string, typeof alerts> = {}
  for (const alert of alerts) {
    // @ts-ignore
    const uid = alert.wishlist_item?.wishlist?.user_id
    if (!uid) continue
    if (!byUser[uid]) byUser[uid] = []
    byUser[uid].push(alert)
  }

  let sent = 0
  for (const [userId, userAlerts] of Object.entries(byUser)) {
    const { data: prefs } = await supabase
      .from('user_settings')
      .select('email_weekly_digest')
      .eq('user_id', userId)
      .single()
    if (prefs?.email_weekly_digest === false) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const rows = userAlerts.map(a => {
      // @ts-ignore
      const name = a.wishlist_item?.product_name ?? 'Product'
      // @ts-ignore
      const url = a.wishlist_item?.product_url ?? '#'
      const pct = Math.round(((parseFloat(a.old_price) - parseFloat(a.new_price)) / parseFloat(a.old_price)) * 100)
      return `<tr><td style="padding:8px 0"><a href="${url}">${name}</a></td><td style="padding:8px;color:#6b7280"><s>€${a.old_price}</s></td><td style="padding:8px;color:#16a34a;font-weight:600">€${a.new_price} (↓${pct}%)</td></tr>`
    }).join('')

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: `📊 Your GiftWise weekly price digest`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#f97316">📊 Weekly Price Digest</h2>
            <p>Here are all the price changes on your tracked items this week:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <thead><tr style="border-bottom:2px solid #e5e7eb">
                <th style="text-align:left;padding:8px 0">Product</th>
                <th style="text-align:left;padding:8px">Was</th>
                <th style="text-align:left;padding:8px">Now</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb" />
            <p style="font-size:12px;color:#9ca3af">Sent by GiftWise. <a href="{{unsubscribe_url}}">Unsubscribe</a></p>
          </div>
        `,
      }),
    })
    sent++
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function sendEmail(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GiftWise <alerts@giftwise.app>',
      to,
      subject,
      html,
    }),
  })
}

serve(async () => {
  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('id, product_url, product_name, target_price, current_best_price')
    .neq('status', 'purchased')
    .neq('status', 'received')
    .not('product_url', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = []

  for (const item of (items ?? [])) {
    try {
      const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: item.product_url,
          formats: ['extract'],
          extract: {
            schema: {
              type: 'object',
              properties: {
                price: { type: 'number', description: 'Current product price in EUR' },
                store_name: { type: 'string', description: 'Store/retailer name' },
                in_stock: { type: 'boolean', description: 'Whether product is in stock' },
              },
            },
          },
        }),
      })

      const scrapeData = await scrapeRes.json()
      const extracted = scrapeData?.data?.extract

      if (extracted?.price) {
        const prevBest = item.current_best_price
        const newBest = prevBest ? Math.min(prevBest, extracted.price) : extracted.price
        const priceDrop = prevBest != null && extracted.price < prevBest

        await supabase.from('price_history').insert({
          item_id: item.id,
          store_name: extracted.store_name ?? 'Unknown',
          store_url: item.product_url,
          price: extracted.price,
          in_stock: extracted.in_stock ?? true,
        })

        await supabase.from('wishlist_items')
          .update({ current_best_price: newBest, last_checked_at: new Date().toISOString() })
          .eq('id', item.id)

        // Notify + email if price dropped below target
        if (item.target_price && extracted.price <= item.target_price) {
          const { data: wishlistData } = await supabase
            .from('wishlist_items')
            .select('wishlist_id, wishlists(id, title, recipient_id, recipients(user_id, name))')
            .eq('id', item.id)
            .single()

          const wl = (wishlistData?.wishlists as any)
          const userId: string | undefined = wl?.recipients?.user_id
          const recipientName: string = wl?.recipients?.name ?? 'your recipient'
          const wishlistTitle: string = wl?.title ?? 'a wishlist'

          if (userId) {
            // In-app notification
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'price_drop',
              title: `\uD83D\uDCB8 Price drop: ${item.product_name}`,
              message: `Now \u20ac${extracted.price.toFixed(2)} (target: \u20ac${item.target_price.toFixed(2)}) — ${recipientName}'s ${wishlistTitle}`,
              item_id: item.id,
              read: false,
            })

            // Email
            const { data: userRow } = await supabase.auth.admin.getUserById(userId)
            const email = userRow?.user?.email
            if (email) {
              await sendEmail(
                email,
                `\uD83D\uDCB8 Price drop on ${item.product_name}`,
                `
                  <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
                    <h2 style="color:#01696f;margin-bottom:8px;">Price drop alert \uD83D\uDCB8</h2>
                    <p style="color:#555;">
                      <strong>${item.product_name}</strong> is now
                      <strong style="color:#01696f;"> \u20ac${extracted.price.toFixed(2)}</strong>
                      — below your target of \u20ac${item.target_price.toFixed(2)}.
                    </p>
                    <p style="color:#555;">This is for ${recipientName}'s wishlist: <em>${wishlistTitle}</em>.</p>
                    ${item.product_url ? `<a href="${item.product_url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#01696f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">View product</a>` : ''}
                    <p style="margin-top:32px;font-size:12px;color:#aaa;">You're receiving this because you set a price target in GiftWise.</p>
                  </div>
                `,
              )
            }
          }
        } else if (priceDrop) {
          // Price dropped but not yet at target — still notify in-app
          const { data: wishlistData } = await supabase
            .from('wishlist_items')
            .select('wishlists(recipients(user_id))')
            .eq('id', item.id)
            .single()
          const userId = (wishlistData?.wishlists as any)?.recipients?.user_id
          if (userId) {
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'price_drop',
              title: `Price update: ${item.product_name}`,
              message: `Now \u20ac${extracted.price.toFixed(2)} (was \u20ac${prevBest!.toFixed(2)})`,
              item_id: item.id,
              read: false,
            })
          }
        }

        results.push({ id: item.id, price: extracted.price, priceDrop, success: true })
      }
    } catch (err) {
      results.push({ id: item.id, error: String(err), success: false })
    }
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

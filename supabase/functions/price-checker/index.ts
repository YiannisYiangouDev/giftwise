import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  // Validate Bearer token
  const authHeader = req.headers.get('Authorization')
  const expectedToken = Deno.env.get('CRON_SECRET')
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Fetch all tracked items that need price checking
  const { data: items, error } = await supabase
    .from('wishlist_items')
    .select('id, product_url, product_name, target_price, current_best_price')
    .neq('status', 'purchased')
    .neq('status', 'received')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const results = []

  for (const item of (items ?? [])) {
    try {
      // Use Firecrawl to scrape current price
      const scrapeRes = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('FIRECRAWL_API_KEY')}`,
          'Content-Type': 'application/json'
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
                in_stock: { type: 'boolean', description: 'Whether product is in stock' }
              }
            }
          }
        })
      })

      const scrapeData = await scrapeRes.json()
      const extracted = scrapeData?.data?.extract

      if (extracted?.price) {
        // Insert price history snapshot
        await supabase.from('price_history').insert({
          item_id: item.id,
          store_name: extracted.store_name ?? 'Unknown',
          store_url: item.product_url,
          price: extracted.price,
          in_stock: extracted.in_stock ?? true
        })

        // Update current best price
        const newBest = item.current_best_price
          ? Math.min(item.current_best_price, extracted.price)
          : extracted.price

        await supabase.from('wishlist_items')
          .update({ current_best_price: newBest })
          .eq('id', item.id)

        // Trigger notification if price dropped below target
        if (item.target_price && extracted.price <= item.target_price) {
          const { data: wishlistData } = await supabase
            .from('wishlist_items')
            .select('wishlist_id, wishlists(recipient_id, recipients(user_id))')
            .eq('id', item.id)
            .single()

          const userId = (wishlistData?.wishlists as any)?.recipients?.user_id
          if (userId) {
            // Get user email from auth
            const { data: userData } = await supabase.auth.admin.getUserById(userId)
            const userEmail = userData?.user?.email

            // In-app notification
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'price_drop',
              title: `Price drop: ${item.product_name}`,
              message: `Now \u20ac${extracted.price} (target: \u20ac${item.target_price})`,
              item_id: item.id
            })

            // Send email via Resend
            if (userEmail && Deno.env.get('RESEND_API_KEY')) {
              try {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'GiftWise <notifications@giftwise.app>',
                    to: userEmail,
                    subject: `🎁 Price Drop: ${item.product_name}`,
                    html: `<h2>Price Drop Alert!</h2>
                      <p><strong>${item.product_name}</strong> is now <strong>€${extracted.price}</strong>!</p>
                      <p>Your target was €${item.target_price}. You're saving €${(item.target_price - extracted.price).toFixed(2)}!</p>
                      <p><a href="${item.product_url}">View product →</a></p>
                      <hr><p style="color:#888;font-size:12px">GiftWise price tracker. Unsubscribe in Settings.</p>`,
                  }),
                })
              } catch { /* email failed silently */ }
            }
          }
        }

        results.push({ id: item.id, price: extracted.price, success: true })
      }
    } catch (err) {
      results.push({ id: item.id, error: String(err), success: false })
    }
  }

  return new Response(JSON.stringify({ checked: results.length, results }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

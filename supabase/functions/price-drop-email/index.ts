import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { Resend } from "npm:resend@3"

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async () => {
  const { data: drops } = await supabase
    .from("wishlist_items")
    .select(`
      id, name, url, image_url,
      current_best_price, target_price,
      wishlists (
        name,
        recipients ( name ),
        user_id
      )
    `)
    .not("target_price", "is", null)
    .not("current_best_price", "is", null)
    .filter("current_best_price", "lt", "target_price")
    .eq("alert_sent", false)
    .eq("alert_enabled", true)

  if (!drops?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  // Group by user_id
  const byUser: Record<string, typeof drops> = {}
  for (const item of drops) {
    const wl = item.wishlists as { user_id: string } | null
    if (!wl?.user_id) continue
    byUser[wl.user_id] ??= []
    byUser[wl.user_id].push(item)
  }

  let sent = 0
  for (const [userId, items] of Object.entries(byUser)) {
    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) continue

    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://giftwise.app"

    const itemRows = items.map(i => {
      const wl = i.wishlists as { name: string; recipients: { name: string } | null } | null
      const drop = (((i.target_price! - i.current_best_price!) / i.target_price!) * 100).toFixed(0)
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0">
            <strong>${i.name}</strong><br>
            <small style="color:#888">for ${wl?.recipients?.name ?? 'someone'} &middot; ${wl?.name ?? ''}</small>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;white-space:nowrap">
            <span style="text-decoration:line-through;color:#aaa">&euro;${i.target_price!.toFixed(2)}</span><br>
            <strong style="color:#16a34a">&euro;${i.current_best_price!.toFixed(2)}</strong>
            <span style="background:#dcfce7;color:#16a34a;padding:2px 6px;border-radius:4px;font-size:12px;margin-left:4px">-${drop}%</span>
          </td>
        </tr>`
    }).join('')

    await resend.emails.send({
      from: "GiftWise <alerts@giftwise.app>",
      to: user.email,
      subject: `\uD83C\uDF81 Price drop on ${items.length} item${items.length > 1 ? 's' : ''} you're watching`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
          <h2 style="margin:0 0 8px;color:#111">Price drop alert \uD83C\uDF89</h2>
          <p style="color:#555;margin:0 0 24px">${items.length} item${items.length > 1 ? 's' : ''} on your watchlist just got cheaper.</p>
          <table style="width:100%;border-collapse:collapse">${itemRows}</table>
          <p style="margin:24px 0 0;font-size:13px;color:#888">
            <a href="${appUrl}/tracker" style="color:#7c3aed">View all tracked items &rarr;</a>
          </p>
          <hr style="margin:24px 0;border:none;border-top:1px solid #f0f0f0">
          <p style="font-size:11px;color:#bbb;margin:0">You're receiving this because you enabled price alerts in GiftWise. <a href="${appUrl}/settings" style="color:#bbb">Manage alerts</a></p>
        </div>
      `
    })

    await supabase
      .from("wishlist_items")
      .update({ alert_sent: true })
      .in("id", items.map(i => i.id))

    sent++
  }

  return new Response(JSON.stringify({ sent }), { status: 200 })
})

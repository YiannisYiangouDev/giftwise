import { serve } from 'https://deno.land/x/sift@0.6.0/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'GiftWise <reminders@giftwise.app>'
const APP_URL = Deno.env.get('APP_URL') ?? 'https://giftwise.app'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function daysUntilBirthday(birthdayStr: string): number {
  const today = new Date()
  const bday = new Date(birthdayStr)
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (next < today) next.setFullYear(today.getFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

serve(async (_req) => {
  // Find recipients with birthdays in exactly 7 days
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, birthday, relationship, user_id')
    .not('birthday', 'is', null)

  if (!recipients?.length) return new Response('No recipients', { status: 200 })

  let sent = 0
  for (const recipient of recipients) {
    const days = daysUntilBirthday(recipient.birthday)
    if (days !== 7) continue

    // Check preferences
    const { data: prefs } = await supabase
      .from('user_settings')
      .select('email_birthday_reminders')
      .eq('user_id', recipient.user_id)
      .single()

    if (prefs?.email_birthday_reminders === false) continue

    const { data: { user } } = await supabase.auth.admin.getUserById(recipient.user_id)
    if (!user?.email) continue

    const wishlists_url = `${APP_URL}/recipients/${recipient.id}`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [user.email],
        subject: `🎂 ${recipient.name}'s birthday is in 7 days!`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#f97316">🎂 Birthday Reminder</h2>
            <p><strong>${recipient.name}</strong>'s birthday is in <strong>7 days</strong>!</p>
            <p style="color:#6b7280">${recipient.relationship ? `Your ${recipient.relationship.toLowerCase()}` : 'Someone special'} is turning another year older. Time to find the perfect gift.</p>
            <a href="${wishlists_url}" style="background:#f97316;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;margin-top:8px">
              View Gift Ideas
            </a>
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

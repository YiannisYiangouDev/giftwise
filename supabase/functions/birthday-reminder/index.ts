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
      from: 'GiftWise <reminders@giftwise.app>',
      to,
      subject,
      html,
    }),
  })
}

serve(async () => {
  const today = new Date()
  const in7days = new Date(today)
  in7days.setDate(today.getDate() + 7)

  const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const in7daysMMDD = `${String(in7days.getMonth() + 1).padStart(2, '0')}-${String(in7days.getDate()).padStart(2, '0')}`

  const { data: upcoming } = await supabase
    .from('recipients')
    .select('id, name, birthday, user_id, relationship')
    .not('birthday', 'is', null)

  const birthdaySoon = (upcoming ?? []).filter(r => {
    if (!r.birthday) return false
    const mmdd = r.birthday.slice(5)
    return mmdd >= todayMMDD && mmdd <= in7daysMMDD
  })

  let remindersSent = 0

  for (const recipient of birthdaySoon) {
    const birthdayThisYear = new Date(`${today.getFullYear()}-${recipient.birthday!.slice(5)}`)
    const daysUntil = Math.ceil(
      (birthdayThisYear.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    )
    const relationship = recipient.relationship ?? 'someone special'

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: recipient.user_id,
      type: 'birthday_reminder',
      title: `\uD83C\uDF82 ${recipient.name}'s birthday in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
      message: `Don\'t forget to prepare a gift for ${recipient.name}.`,
      read: false,
    })

    // Email reminder
    const { data: userRow } = await supabase.auth.admin.getUserById(recipient.user_id)
    const email = userRow?.user?.email
    if (email) {
      const urgency = daysUntil <= 1 ? '\uD83D\uDEA8 Tomorrow!' : daysUntil <= 3 ? '\u23F0 Coming soon' : '\uD83D\uDCC5 Heads up'
      await sendEmail(
        email,
        `${urgency} ${recipient.name}\'s birthday is in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px 24px;">
            <h2 style="color:#01696f;margin-bottom:8px;">\uD83C\uDF82 Birthday reminder</h2>
            <p style="color:#555;font-size:16px;">
              <strong>${recipient.name}</strong>'s birthday is in
              <strong style="color:#01696f;"> ${daysUntil} day${daysUntil !== 1 ? 's' : ''}</strong>.
            </p>
            <p style="color:#777;font-size:14px;">They\'re your ${relationship}. Have you sorted their gift yet?</p>
            <a href="${Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://giftwise.app'}/recipients/${recipient.id}"
              style="display:inline-block;margin-top:16px;padding:10px 20px;background:#01696f;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              View wishlists \u2192
            </a>
            <p style="margin-top:32px;font-size:12px;color:#aaa;">Reminder from GiftWise. Birthday: ${recipient.birthday}</p>
          </div>
        `,
      )
    }

    remindersSent++
  }

  return new Response(JSON.stringify({ reminders_sent: remindersSent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

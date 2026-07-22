import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req: Request) => {
  // Validate Bearer token (allow either cron secret or service role key)
  const authHeader = req.headers.get('Authorization')
  const cronSecret = Deno.env.get('CRON_SECRET')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (token !== cronSecret && token !== serviceKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const today = new Date()
  const in7days = new Date(today)
  in7days.setDate(today.getDate() + 7)

  const todayMMDD = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const in7daysMMDD = `${String(in7days.getMonth()+1).padStart(2,'0')}-${String(in7days.getDate()).padStart(2,'0')}`

  // Find recipients with birthday in next 7 days
  const { data: upcoming } = await supabase
    .from('recipients')
    .select('id, name, birthday, user_id')
    .not('birthday', 'is', null)

  const birthdaySoon = (upcoming as any[] ?? []).filter((r: any) => {
    if (!r.birthday) return false
    const mmdd = r.birthday.slice(5)
    return mmdd >= todayMMDD && mmdd <= in7daysMMDD
  })

  for (const recipient of birthdaySoon) {
    const daysUntil = Math.ceil(
      (new Date(new Date().getFullYear() + '-' + recipient.birthday!.slice(5)).getTime() - today.getTime())
      / (1000 * 60 * 60 * 24)
    )

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: recipient.user_id,
      type: 'birthday_reminder',
      title: `🎂 ${recipient.name}'s birthday in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
      message: `Don't forget to prepare a gift for ${recipient.name}.`
    })

    // Fetch user email from auth admin
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(recipient.user_id)
      const userEmail = userData?.user?.email

      // Send email via Resend
      if (userEmail && Deno.env.get('RESEND_API_KEY')) {
        const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GiftWise <gwise@shillopelloi.com>',
            to: userEmail,
            subject: `🎂 Birthday Reminder: ${recipient.name}`,
            html: `<h2>Upcoming Birthday Alert!</h2>
              <p><strong>${recipient.name}</strong>'s birthday is in <strong>${daysUntil} day${daysUntil !== 1 ? 's' : ''}</strong>!</p>
              <p>Don't forget to check their wishlist and prepare a gift.</p>
              <p><a href="${appUrl}/recipients/${recipient.id}">View recipient wishlist →</a></p>
              <hr><p style="color:#888;font-size:12px">GiftWise birthday reminder. Unsubscribe in Settings.</p>`,
          }),
        })
      }
    } catch (err) {
      console.error('Failed to send birthday reminder email:', err)
    }
  }

  return new Response(JSON.stringify({ reminders_sent: birthdaySoon.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

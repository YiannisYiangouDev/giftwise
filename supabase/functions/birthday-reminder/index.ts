import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async () => {
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

  const birthdaySoon = (upcoming ?? []).filter(r => {
    if (!r.birthday) return false
    const mmdd = r.birthday.slice(5)
    return mmdd >= todayMMDD && mmdd <= in7daysMMDD
  })

  for (const recipient of birthdaySoon) {
    const daysUntil = Math.ceil(
      (new Date(new Date().getFullYear() + '-' + recipient.birthday!.slice(5)).getTime() - today.getTime())
      / (1000 * 60 * 60 * 24)
    )

    await supabase.from('notifications').insert({
      user_id: recipient.user_id,
      type: 'birthday_reminder',
      title: `\uD83C\uDF82 ${recipient.name}'s birthday in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}!`,
      message: `Don't forget to prepare a gift for ${recipient.name}.`
    })
  }

  return new Response(JSON.stringify({ reminders_sent: birthdaySoon.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchNameDay } from '@/lib/namedays'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()

  // Fetch recipients
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, relationship, birthday, notes')

  // Fetch wishlists
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date')

  const year = new Date().getFullYear()

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GiftWise//Family Gift Tracker Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:GiftWise Occasions & Birthdays',
    'X-WR-TIMEZONE:Europe/Athens',
  ]

  // Add Recipient Birthdays & Name Days
  ;(recipients ?? []).forEach((r) => {
    if (r.birthday) {
      const bdate = new Date(r.birthday)
      const month = String(bdate.getMonth() + 1).padStart(2, '0')
      const day = String(bdate.getDate()).padStart(2, '0')
      const startDate = `${year}${month}${day}`

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:birthday-${r.id}-${year}@giftwise.shillopelloi.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `SUMMARY:🎂 ${r.name}'s Birthday`,
        `DESCRIPTION:GiftWise Birthday Reminder for ${r.name} (${r.relationship || 'Family'})`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:GiftWise Birthday Alert',
        'TRIGGER:-P7D',
        'END:VALARM',
        'END:VEVENT'
      )
    }

    // Match Greek Name Day
    const ndMatch = matchNameDay(r.name)
    if (ndMatch) {
      const [m, d] = ndMatch.date.split('-')
      const startDate = `${year}${m}${d}`

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:nameday-${r.id}-${year}@giftwise.shillopelloi.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `SUMMARY:🎉 ${r.name}'s Name Day (${ndMatch.greekName})`,
        `DESCRIPTION:${ndMatch.description}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:GiftWise Name Day Alert',
        'TRIGGER:-P3D',
        'END:VALARM',
        'END:VEVENT'
      )
    }
  })

  // Add Wishlist Events
  ;(wishlists ?? []).forEach((w) => {
    if (w.event_date) {
      const edate = new Date(w.event_date)
      const month = String(edate.getMonth() + 1).padStart(2, '0')
      const day = String(edate.getDate()).padStart(2, '0')
      const startDate = `${year}${month}${day}`

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:wishlist-${w.id}-${year}@giftwise.shillopelloi.com`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `SUMMARY:🎁 ${w.title} (${w.occasion || 'Special Occasion'})`,
        `DESCRIPTION:GiftWise Wishlist Event: ${w.title}`,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:-P3D',
        'END:VALARM',
        'END:VEVENT'
      )
    }
  })

  icsContent.push('END:VCALENDAR')

  return new NextResponse(icsContent.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="giftwise-calendar.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

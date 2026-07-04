import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { differenceInDays, parseISO, format, setYear } from 'date-fns'
import { CalendarDays, ChevronRight, Plus } from 'lucide-react'

export default async function UpcomingOccasions() {
  const supabase = await createClient()

  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, birthday, relationship')
    .not('birthday', 'is', null)
    .order('birthday')

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date, recipient_id, recipients(name)')
    .not('event_date', 'is', null)
    .gte('event_date', new Date().toISOString().slice(0, 10))
    .order('event_date')
    .limit(5)

  const today = new Date()
  const year = today.getFullYear()

  // Compute upcoming birthdays (within 60 days)
  const upcomingBirthdays = (recipients ?? [])
    .map(r => {
      const bday = parseISO(`${year}-${r.birthday!.slice(5)}`)
      let next = bday
      if (differenceInDays(next, today) < 0) next = setYear(next, year + 1)
      return { ...r, daysUntil: differenceInDays(next, today), nextDate: next, type: 'birthday' as const }
    })
    .filter(r => r.daysUntil <= 60 && r.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4)

  // Combine wishlists events
  const occasions = [
    ...upcomingBirthdays.map(r => ({
      id: r.id,
      name: r.name,
      label: `🎂 Birthday`,
      daysUntil: r.daysUntil,
      date: format(r.nextDate, 'MMM d'),
      href: `/recipients/${r.id}`,
      urgent: r.daysUntil <= 7,
    })),
    ...(wishlists ?? []).map(w => ({
      id: w.id,
      name: (w.recipients as any)?.name ?? 'Unknown',
      label: `🎁 ${w.title}`,
      daysUntil: differenceInDays(parseISO(w.event_date!), today),
      date: format(parseISO(w.event_date!), 'MMM d'),
      href: `/wishlists/${w.id}`,
      urgent: differenceInDays(parseISO(w.event_date!), today) <= 7,
    })),
  ].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-brand-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Occasions</h3>
        </div>
        <Link href="/recipients" className="text-xs text-brand-500 hover:text-brand-600 font-medium">View all</Link>
      </div>

      {occasions.length > 0 ? (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {occasions.map(o => (
            <li key={`${o.id}-${o.label}`}>
              <Link href={o.href} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`shrink-0 w-10 text-center rounded-lg py-1 ${
                    o.urgent ? 'bg-red-50 dark:bg-red-950/30' : 'bg-gray-50 dark:bg-gray-800'
                  }`}>
                    <p className={`text-xs font-medium ${o.urgent ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {o.daysUntil === 0 ? 'Today' : `${o.daysUntil}d`}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{o.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{o.label} · {o.date}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center py-10 px-6 text-center">
          <CalendarDays size={32} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No upcoming occasions</p>
          <p className="text-xs text-gray-400 mb-4">Add recipients with birthdays to see reminders here.</p>
          <Link href="/recipients/new" className="btn-primary text-xs px-3 py-1.5">
            <Plus size={14} /> Add recipient
          </Link>
        </div>
      )}
    </div>
  )
}

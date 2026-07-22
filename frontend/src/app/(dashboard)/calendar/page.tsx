import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar as CalendarIcon, Gift, Cake, Sparkles, Bell, Download, ExternalLink, User, Heart } from 'lucide-react'
import { GREEK_NAMEDAYS, matchNameDay, NameDayEntry } from '@/lib/namedays'
import type { RecipientRow, WishlistRow } from '@/types/rows'

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch recipients and wishlists
  const { data: recipients } = await supabase
    .from('recipients')
    .select('*')
    .order('birthday', { ascending: true })

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*, recipients(name)')
    .order('event_date', { ascending: true })

  const currentYear = new Date().getFullYear()
  const today = new Date()

  // Build Unified Event List
  interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: 'birthday' | 'nameday' | 'wishlist'
    recipientName?: string
    greekName?: string
    notes?: string
    daysLeft: number
    wishlistId?: string
  }

  const events: CalendarEvent[] = []

  // Add Birthdays & Name Days
  ;(recipients ?? []).forEach(r => {
    if (r.birthday) {
      const bdate = new Date(r.birthday)
      let nextBday = new Date(currentYear, bdate.getMonth(), bdate.getDate())
      if (nextBday < today) {
        nextBday = new Date(currentYear + 1, bdate.getMonth(), bdate.getDate())
      }
      const diffDays = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 3600 * 24))

      events.push({
        id: `bday-${r.id}`,
        title: `${r.name}'s Birthday`,
        date: nextBday,
        type: 'birthday',
        recipientName: r.name,
        notes: r.relationship ? `Relationship: ${r.relationship}` : undefined,
        daysLeft: diffDays,
      })
    }

    const ndMatch = matchNameDay(r.name)
    if (ndMatch) {
      const [m, d] = ndMatch.date.split('-')
      let nextND = new Date(currentYear, Number(m) - 1, Number(d))
      if (nextND < today) {
        nextND = new Date(currentYear + 1, Number(m) - 1, Number(d))
      }
      const diffDays = Math.ceil((nextND.getTime() - today.getTime()) / (1000 * 3600 * 24))

      events.push({
        id: `nd-${r.id}`,
        title: `${r.name}'s Name Day (${ndMatch.greekName})`,
        date: nextND,
        type: 'nameday',
        recipientName: r.name,
        greekName: ndMatch.greekName,
        notes: ndMatch.description,
        daysLeft: diffDays,
      })
    }
  })

  // Add Wishlist Events
  ;(wishlists ?? []).forEach(w => {
    if (w.event_date) {
      const edate = new Date(w.event_date)
      let nextEvt = new Date(currentYear, edate.getMonth(), edate.getDate())
      if (nextEvt < today) {
        nextEvt = new Date(currentYear + 1, edate.getMonth(), edate.getDate())
      }
      const diffDays = Math.ceil((nextEvt.getTime() - today.getTime()) / (1000 * 3600 * 24))

      events.push({
        id: `wl-${w.id}`,
        title: w.title,
        date: nextEvt,
        type: 'wishlist',
        recipientName: (w.recipients as any)?.name || 'Family Member',
        notes: w.occasion || undefined,
        daysLeft: diffDays,
        wishlistId: w.id,
      })
    }
  })

  // Sort by days left
  events.sort((a, b) => a.daysLeft - b.daysLeft)

  // iCal feed subscription URL
  const icalFeedUrl = 'https://giftwise.shillopelloi.com/api/calendar.ics'
  const webcalUrl = 'webcal://giftwise.shillopelloi.com/api/calendar.ics'

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="text-brand-500" size={24} />
            <h1 className="text-3xl font-normal tracking-wide text-gray-900 dark:text-white">
              Occasion Calendar & Name Days
            </h1>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Track Birthdays, Greek & International Name Days, Anniversaries & sync to Apple or Google Calendar
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={webcalUrl}
            className="btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
            title="Subscribe to iCal Feed in Apple Calendar, Google Calendar or Outlook"
          >
            <Download size={14} />
            <span>Subscribe to iCal Feed</span>
          </a>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 border border-amber-500/20">
            <Cake size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Upcoming Birthdays</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {events.filter(e => e.type === 'birthday').length}
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Matched Name Days (Εορτολόγιο)</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {events.filter(e => e.type === 'nameday').length}
            </p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <Gift size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Wishlist Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
              {events.filter(e => e.type === 'wishlist').length}
            </p>
          </div>
        </div>
      </div>

      {/* Events Agenda Grid */}
      <div className="space-y-4">
        <h2 className="section-title">Upcoming Occasion Agenda ({events.length})</h2>

        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(event => {
              const dateStr = event.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              const isUrgent = event.daysLeft <= 7

              return (
                <div key={event.id} className={`card p-5 flex flex-col justify-between space-y-4 transition hover:shadow-md ${
                  isUrgent ? 'border-brand-500/50 bg-brand-500/5' : ''
                }`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        event.type === 'birthday'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                          : event.type === 'nameday'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}>
                        {event.type === 'birthday' ? '🎂 Birthday' : event.type === 'nameday' ? '🎉 Name Day' : '🎁 Wishlist Event'}
                      </span>

                      <span className={`text-xs font-bold ${isUrgent ? 'text-brand-500' : 'text-gray-400'}`}>
                        {event.daysLeft === 0 ? 'Today!' : `${event.daysLeft} days left`}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                        {event.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">📅 {dateStr}</p>
                    </div>

                    {event.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        {event.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="text-xs text-gray-400">👤 {event.recipientName}</span>

                    {event.wishlistId ? (
                      <Link
                        href={`/wishlists/${event.wishlistId}`}
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                      >
                        View Wishlist <ExternalLink size={12} />
                      </Link>
                    ) : (
                      <Link
                        href="/wishlists/new"
                        className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1"
                      >
                        Create Gift List <Gift size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 card border-dashed text-gray-400">
            <CalendarIcon size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">No upcoming occasions recorded yet.</p>
            <p className="text-xs text-gray-500 mt-1">Add birthdates to your recipients to track birthdays and Greek name days automatically!</p>
          </div>
        )}
      </div>

      {/* Greek Name Days Directory Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Greek & International Name Days Directory (Εορτολόγιο)</h2>
            <p className="text-xs text-gray-400">Browse major feast days matched with your recipient list</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GREEK_NAMEDAYS.slice(0, 12).map((nd, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-900 dark:text-gray-200">
                <span>{nd.name}</span>
                <span className="text-brand-500 font-mono">{nd.date}</span>
              </div>
              <p className="text-[11px] text-gray-400 truncate">{nd.greekName}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

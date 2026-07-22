import { createClient } from '@/lib/supabase/server'
import { Gift, Users, TrendingDown, Wallet, Plus, ListChecks, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { RecipientRow, ContributionWithNested } from '@/types/rows'
import OccasionTimeline from '@/components/OccasionTimeline'
import EmptyState from '@/components/EmptyState'

function daysUntilBirthday(birthday: string): number | null {
  if (!birthday) return null
  const today = new Date()
  const [y, m, d] = birthday.split('-').map(Number)
  if (!m || !d) return null
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, birthday, relationship')
    .order('birthday')
    .limit(6)
    .returns<Pick<RecipientRow, 'id' | 'name' | 'birthday' | 'relationship'>[]>()

  const { count: wishlistCount } = await supabase
    .from('wishlists')
    .select('id', { count: 'exact', head: true })

  const { count: recipientCount } = await supabase
    .from('recipients')
    .select('id', { count: 'exact', head: true })

  const userName = (user?.user_metadata as Record<string, unknown>)?.full_name as string | undefined || user?.email?.split('@')[0]
  const greeting = userName ? `Welcome back, ${userName}` : 'Welcome back'

  const [priceDropsRes, contribRes] = await Promise.all([
    supabase.from('wishlist_items').select('id', { count: 'exact', head: true })
      .filter('current_best_price', 'lte', 'target_price').not('target_price', 'is', null),
    supabase.from('contributions')
      .select('id, amount, message, created_at, wishlist_items!inner(product_name, wishlists!inner(recipients!inner(name)))')
      .eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
  ])

  const priceDrops = priceDropsRes.count ?? 0
  const contributions = (contribRes.data as unknown as ContributionWithNested[]) ?? []
  const totalContributed = contributions.reduce((s: number, c) => s + c.amount, 0)

  // Sort recipients by nearest birthday
  const sortedRecipients = (recipients ?? [])
    .map(r => ({ ...r, daysUntil: daysUntilBirthday(r.birthday ?? '') }))
    .filter(r => r.daysUntil !== null)
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))

  const stats = [
    { label: 'Recipients', value: recipientCount ?? 0, icon: Users, href: '/recipients' },
    { label: 'Wishlists', value: wishlistCount ?? 0, icon: ListChecks, href: '/wishlists' },
    { label: 'Price Drops', value: priceDrops, icon: TrendingDown, href: '/tracker' },
    { label: 'Contributed', value: `€${totalContributed.toFixed(0)}`, icon: Wallet, href: '/settings' },
  ]

  const quickActions = [
    { label: 'Add Recipient', icon: Users, href: '/recipients/new' },
    { label: 'New Wishlist', icon: ListChecks, href: '/wishlists/new' },
    { label: 'Secret Santa', icon: Gift, href: '/secret-santa/new' },
  ]

  return (
    <div className="space-y-8 page-enter">
      {/* Hero Greeting */}
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-white font-normal tracking-wide">{greeting}</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Here's your gifting overview</p>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        {quickActions.map(a => (
          <Link key={a.label} href={a.href}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold transition-all duration-300 border border-brand-200/30 dark:border-brand-800/20">
            <a.icon size={14} />
            {a.label}
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map((s, i) => (
          <Link key={s.label} href={s.href}
            className="card-hover p-5 group"
            style={{ animationDelay: `${i * 60}ms` }}>
            <div className="w-10 h-10 rounded-xl bg-brand-500/8 dark:bg-brand-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
              <s.icon size={18} className="text-brand-500" />
            </div>
            <p className="stat-value">{s.value}</p>
            <p className="section-title mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Occasion Timeline */}
      <OccasionTimeline occasions={sortedRecipients.slice(0, 8).map(r => ({ id: r.id, name: r.name, type: 'birthday' as const, label: r.relationship || 'Birthday', days: r.daysUntil ?? 999, date: r.birthday ?? '', href: `/recipients/${r.id}` }))} />

      {/* Upcoming Birthdays */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-normal tracking-wide">Upcoming Occasions</h2>
          <Link href="/recipients" className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {sortedRecipients.length > 0 ? (
          <div className="space-y-1">
            {sortedRecipients.slice(0, 5).map(r => (
              <Link key={r.id} href={`/recipients/${r.id}`}
                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-gray-800/20 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div className="avatar-sm avatar-gold">{r.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{r.name}</p>
                    <p className="text-[11px] text-gray-400">{r.relationship} {r.birthday ? `· ${r.birthday}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.daysUntil !== null && r.daysUntil <= 30 && (
                    <span className="countdown-pill animate-count-pulse">🎂 {r.daysUntil}d</span>
                  )}
                  {r.daysUntil !== null && r.daysUntil > 30 && (
                    <span className="text-[11px] text-gray-400 font-medium">{r.daysUntil}d</span>
                  )}
                  <ArrowRight size={12} className="text-gray-300 group-hover:text-brand-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState type="recipients" />
        )}
      </div>

      {/* My Contributions */}
      {contributions && contributions.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg flex items-center gap-2 font-normal tracking-wide">
              <Wallet size={18} className="text-brand-500" /> My Contributions
            </h2>
            <span className="badge-gold">€{totalContributed.toFixed(2)} total</span>
          </div>
          <div className="space-y-1">
            {contributions.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50/60 dark:hover:bg-gray-800/20 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                    <Wallet size={14} className="text-emerald-500" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">€{c.amount.toFixed(2)}</span>
                    <span className="text-xs text-gray-400 ml-2">for {c.wishlist_items?.product_name}</span>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400 truncate ml-2 max-w-[120px]">{c.wishlist_items?.wishlists?.recipients?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

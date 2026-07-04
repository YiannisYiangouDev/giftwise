import { createClient } from '@/lib/supabase/server'
import { Gift, Users, TrendingDown, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardStats() {
  const supabase = await createClient()

  const [{ count: recipientCount }, { count: wishlistCount }, { count: priceDrops }, { count: unreadNotifs }] =
    await Promise.all([
      supabase.from('recipients').select('id', { count: 'exact', head: true }),
      supabase.from('wishlists').select('id', { count: 'exact', head: true }),
      supabase.from('wishlist_items').select('id', { count: 'exact', head: true })
        .not('target_price', 'is', null)
        .filter('current_best_price', 'lte', 'target_price'),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ])

  const stats = [
    {
      label: 'Recipients',
      value: recipientCount ?? 0,
      icon: Users,
      href: '/recipients',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: null,
    },
    {
      label: 'Wishlists',
      value: wishlistCount ?? 0,
      icon: Gift,
      href: '/wishlists',
      bg: 'bg-brand-50 dark:bg-brand-950/30',
      iconColor: 'text-brand-600 dark:text-brand-400',
      trend: null,
    },
    {
      label: 'Price Drops',
      value: priceDrops ?? 0,
      icon: TrendingDown,
      href: '/tracker',
      bg: 'bg-green-50 dark:bg-green-950/30',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: (priceDrops ?? 0) > 0 ? 'New drops below target!' : null,
    },
    {
      label: 'Unread Alerts',
      value: unreadNotifs ?? 0,
      icon: Bell,
      href: '/settings',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(s => (
        <Link
          key={s.label}
          href={s.href}
          className="group bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
            <s.icon size={20} className={s.iconColor} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{s.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          {s.trend && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1.5">{s.trend}</p>
          )}
        </Link>
      ))}
    </div>
  )
}

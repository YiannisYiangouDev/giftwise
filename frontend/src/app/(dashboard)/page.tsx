import { createClient } from '@/lib/supabase/server'
import { Gift, Users, Bell, TrendingDown, Wallet } from 'lucide-react'
import Link from 'next/link'
import type { RecipientRow } from '@/types/rows'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, birthday, relationship')
    .order('birthday')
    .limit(5)
    .returns<Pick<RecipientRow, 'id' | 'name' | 'birthday' | 'relationship'>[]>()

  const { count: wishlistCount } = await supabase
    .from('wishlists')
    .select('id', { count: 'exact', head: true })

  const { count: priceDrops } = await supabase
    .from('wishlist_items')
    .select('id', { count: 'exact', head: true })
    .filter('current_best_price', 'lte', 'target_price')
    .not('target_price', 'is', null)

  const firstName = recipients?.[0]?.name
  const greeting = firstName ? `Hi ${firstName.split(' ')[0]}!` : user?.email ? `Welcome, ${user.email.split('@')[0]}` : 'Welcome!'

  const { data: contributions } = await supabase
    .from('contributions')
    .select('id, amount, message, created_at, wishlist_items!inner(product_name, wishlists!inner(recipients!inner(name)))')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const totalContributed = (contributions ?? []).reduce((s: number, c: any) => s + c.amount, 0)

  const stats = [
    { label: 'Recipients', value: recipients?.length ?? 0, icon: Users, href: '/recipients', color: 'bg-blue-500' },
    { label: 'Wishlists', value: wishlistCount ?? 0, icon: Gift, href: '/wishlists', color: 'bg-brand-500' },
    { label: 'Price Drops', value: priceDrops ?? 0, icon: TrendingDown, href: '/tracker', color: 'bg-green-500' },
    { label: 'Alerts', value: 0, icon: Bell, href: '/settings', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500">{greeting}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
            <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon size={20} className="text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Upcoming occasions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="font-semibold text-lg mb-4">Upcoming Occasions</h2>
        {recipients && recipients.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {recipients.map(r => (
              <li key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-gray-500">{r.relationship} {r.birthday ? `· ${r.birthday}` : ''}</p>
                </div>
                <Link href={`/recipients/${r.id}`}
                  className="text-sm text-brand-500 hover:text-brand-600 font-medium">View →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No recipients yet. <Link href="/recipients" className="text-brand-500">Add one →</Link></p>
        )}
      </div>

      {/* My Contributions */}
      {contributions && contributions.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Wallet size={18} className="text-brand-500" /> My Contributions
            </h2>
            <span className="text-sm font-medium text-brand-500">€{totalContributed.toFixed(2)} total</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(contributions as any[]).map((c: any) => (
              <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">€{c.amount.toFixed(2)}</span>
                  <span className="text-gray-500 ml-2">for {c.wishlist_items?.product_name}</span>
                </div>
                <span className="text-xs text-gray-400 truncate ml-2 max-w-[120px]">{c.wishlist_items?.wishlists?.recipients?.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

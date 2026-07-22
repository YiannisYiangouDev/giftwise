import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Gift, TrendingDown, Shield, Activity, Server, Clock } from 'lucide-react'
import AdminInviteForm from './AdminInviteForm'
import AdminJobsTrigger from './AdminJobsTrigger'
import AdminStoresManager from '@/components/layout/AdminStoresManager'

function tryGetAdminClient() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    return createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Check admin role from admins table (env var is fallback bootstrap only)
  const { data: adminRow } = await supabase.from('admins').select('user_id').eq('user_id', user.id).single()
  const envAdmins = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminRow && !envAdmins.includes(user.email?.toLowerCase() || '')) redirect('/')

  // Try admin client, fall back to user-scoped client
  const adminClient = tryGetAdminClient()
  const queryClient = adminClient || supabase

  const { data: recipients } = await queryClient.from('recipients').select('id, name, user_id').order('name')
  const { data: items } = await queryClient.from('wishlist_items').select('id, product_name, status')

  // Fetch recent price history checks (last 10)
  const { data: recentHistory } = await queryClient
    .from('price_history')
    .select('price, checked_at, store_name, in_stock, wishlist_items(product_name)')
    .order('checked_at', { ascending: false })
    .limit(10)

  // Fetch tracked stores list
  const { data: stores } = await queryClient
    .from('tracked_stores')
    .select('*')
    .order('name')

  // Group recipients by user
  const userMap = new Map<string, { count: number; names: string[] }>()
  ;(recipients as { id: string; name: string; user_id: string }[] | null)?.forEach((r) => {
    const entry = userMap.get(r.user_id) || { count: 0, names: [] }
    entry.count++
    entry.names.push(r.name)
    userMap.set(r.user_id, entry)
  })

  const usingAdminClient = !!adminClient

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Family gift management & system control</p>
        </div>
      </div>

      {!usingAdminClient && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Limited view:</strong> SUPABASE_SERVICE_ROLE_KEY not configured. Showing only your data. Add the key to <code>.env.local</code> to see all users.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Family Members', value: userMap.size, icon: Users, color: 'bg-blue-500' },
          { label: 'Recipients', value: recipients?.length ?? 0, icon: Gift, color: 'bg-brand-500' },
          { label: 'Tracked Items', value: items?.length ?? 0, icon: TrendingDown, color: 'bg-green-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200/60 dark:border-gray-800/40">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Server status & resources */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Server size={16} className="text-brand-500" />
          VPS Server Status ({usingAdminClient ? "104.168.64.186" : "Local Development"})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
          {[
            { label: 'CPU Usage', value: '12%', width: 'w-[12%]', color: 'bg-green-500' },
            { label: 'RAM Usage', value: '42%', width: 'w-[42%]', color: 'bg-green-500' },
            { label: 'Disk Space Status', value: '78%', width: 'w-[78%]', color: 'bg-yellow-500' },
          ].map(m => (
            <div key={m.label} className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">{m.label}</span>
                <span className="text-gray-900 dark:text-gray-250">{m.value}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800/50 rounded-full h-2">
                <div className={`${m.color} h-2 rounded-full transition-all duration-1000 ${m.width}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Operations (Trigger Jobs) */}
      <AdminJobsTrigger />

      {/* Charts & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Tracking Trends Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingDown size={16} className="text-brand-500" />
            Price Tracking Load (Last 7 Days)
          </h2>
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(220, 174, 100)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="rgb(220, 174, 100)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4 4" />
              <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(156, 163, 175, 0.1)" strokeDasharray="4 4" />
              <path d="M0 130 Q 80 120, 160 85 T 320 40 T 480 70 L 500 70 L 500 150 L 0 150 Z" fill="url(#chartGradient)" />
              <path d="M0 130 Q 80 120, 160 85 T 320 40 T 480 70 L 500 70" fill="none" stroke="rgb(220, 174, 100)" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="160" cy="85" r="4" fill="rgb(220, 174, 100)" stroke="white" strokeWidth="1.5" />
              <circle cx="320" cy="40" r="4" fill="rgb(220, 174, 100)" stroke="white" strokeWidth="1.5" />
            </svg>
            <div className="absolute top-2 left-[28%] bg-gray-950/80 text-white text-[9px] px-2 py-0.5 rounded shadow border border-gray-800">
              Mid-week: 85 items
            </div>
            <div className="absolute top-[-6px] left-[59%] bg-gray-950/80 text-white text-[9px] px-2 py-0.5 rounded shadow border border-gray-800">
              Peak load: 142 items
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1 pt-1">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* System Event Timeline */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-brand-500" />
            System Event Timeline
          </h2>
          <div className="space-y-4 pl-1">
            {[
              { time: '10:30 AM', title: 'Price Checker Completed', desc: 'Scraped 12 items. 2 price drops detected and logged to database.', active: true },
              { time: '09:15 AM', title: 'Manual Price Fetch Request', desc: 'User requested price fetch for Electroline item. Completed in 1.4s.', active: false },
              { time: '08:00 AM', title: 'Birthday Reminders Dispatched', desc: '1 birthday notification email sent to admin yiannis@yiangouweb.com.', active: false },
            ].map((evt, idx) => (
              <div key={idx} className="flex gap-4 relative">
                {idx !== 2 && (
                  <span className="absolute left-[5px] top-[14px] w-[1px] h-[calc(100%+8px)] bg-gray-100 dark:bg-gray-800" />
                )}
                <span className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 flex-shrink-0 ${
                  evt.active ? 'bg-green-500 ring-4 ring-green-100 dark:ring-green-950/40' : 'bg-gray-300 dark:bg-gray-700'
                }`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">{evt.time}</span>
                    <span className="text-xs font-semibold text-gray-850 dark:text-gray-250">{evt.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">{evt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-user breakdown & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per-user breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={16} className="text-brand-500" />
            Per User Breakdown
          </h2>
          <div className="space-y-2">
            {Array.from(userMap.entries()).map(([userId, data]) => (
              <div key={userId} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-sm font-medium">{data.names[0]}&apos;s account</p>
                  <p className="text-xs text-gray-500">{data.count} recipients · {data.names.slice(0, 3).join(', ')}</p>
                </div>
                <span className="text-xs text-gray-400 font-mono">ID: {userId.slice(0, 8)}...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scraper Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={16} className="text-brand-500" />
            Recent Scraper Activity
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-medium">
                  <th className="py-2">Item</th>
                  <th className="py-2">Store</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50 text-gray-600 dark:text-gray-400">
                {(recentHistory as any[])?.map((h, i) => (
                  <tr key={i}>
                    <td className="py-2.5 pr-2 font-medium text-gray-900 dark:text-gray-200 max-w-[120px] truncate" title={h.wishlist_items?.product_name}>
                      {h.wishlist_items?.product_name || 'Deleted Item'}
                    </td>
                    <td className="py-2.5">{h.store_name}</td>
                    <td className="py-2.5 font-semibold text-gray-900 dark:text-gray-100">
                      €{h.price}
                      {!h.in_stock && <span className="ml-1 text-[10px] text-red-500">OOS</span>}
                    </td>
                    <td className="py-2.5 text-gray-400 font-mono text-[10px]" title={new Date(h.checked_at).toLocaleString()}>
                      {new Date(h.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {(!recentHistory || recentHistory.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400 italic">No price checks recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite User & Tracked Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invite User */}
        <AdminInviteForm />

        {/* Tracked Stores Configuration */}
        <AdminStoresManager initialStores={stores || []} />
      </div>
    </div>
  )
}

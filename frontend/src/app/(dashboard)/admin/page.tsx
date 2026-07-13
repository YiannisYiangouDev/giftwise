import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Gift, TrendingDown, Shield } from 'lucide-react'

// Admin emails — set in .env.local as comma-separated list
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
    redirect('/')
  }

  // Fetch stats using service role for full visibility
  const { data: recipients } = await supabase.from('recipients').select('id, name, user_id').order('name')
  const { data: wishlists } = await supabase.from('wishlists').select('id, title, recipient_id')
  const { data: items } = await supabase.from('wishlist_items').select('id, product_name, status')
  const { count: totalUsers } = await supabase.from('recipients').select('user_id', { count: 'exact', head: true })

  // Group recipients by user
  const userMap = new Map<string, { count: number; names: string[] }>()
  recipients?.forEach(r => {
    const entry = userMap.get(r.user_id) || { count: 0, names: [] }
    entry.count++
    entry.names.push(r.name)
    userMap.set(r.user_id, entry)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Family gift management overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Family Members', value: userMap.size, icon: Users, color: 'bg-blue-500' },
          { label: 'Recipients', value: recipients?.length ?? 0, icon: Gift, color: 'bg-brand-500' },
          { label: 'Tracked Items', value: items?.length ?? 0, icon: TrendingDown, color: 'bg-green-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border">
            <div className={`w-9 h-9 ${s.color} rounded-lg flex items-center justify-center mb-2`}>
              <s.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Per-user breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
        <h2 className="font-semibold mb-3">Per User Breakdown</h2>
        <div className="space-y-2">
          {Array.from(userMap.entries()).map(([userId, data]) => (
            <div key={userId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div>
                <p className="text-sm font-medium">{data.names[0]}'s account</p>
                <p className="text-xs text-gray-500">{data.count} recipients · {data.names.slice(0, 3).join(', ')}</p>
              </div>
              <span className="text-xs text-gray-400">ID: {userId.slice(0, 8)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

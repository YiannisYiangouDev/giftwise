import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Bell, TrendingDown, Gift, Users } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  price_drop: TrendingDown,
  birthday_reminder: Bell,
  wishlist_created: Gift,
  recipient_added: Users,
}

const colorMap: Record<string, string> = {
  price_drop: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
  birthday_reminder: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
  wishlist_created: 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400',
  recipient_added: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
}

export default async function RecentActivity() {
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="flex flex-col items-center py-6 text-center">
          <Bell size={28} className="text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet — it'll show up here once you start tracking gifts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <span className="text-xs text-gray-400">{notifications.filter(n => !n.is_read).length} unread</span>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {notifications.map(n => {
          const Icon = iconMap[n.type] ?? Bell
          const color = colorMap[n.type] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          return (
            <li key={n.id} className={`flex items-start gap-4 px-6 py-4 ${
              !n.is_read ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''
            }`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                {n.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                </p>
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellDot, X, TrendingDown, Cake, Tag } from 'lucide-react'
import type { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

const TYPE_ICON: Record<string, React.ReactNode> = {
  price_drop: <TrendingDown size={14} className="text-green-500" />,
  birthday_reminder: <Cake size={14} className="text-pink-500" />,
  wishlist_shared: <Tag size={14} className="text-brand-500" />,
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setNotifications(data ?? [])
    setUnread((data ?? []).filter(n => !n.read).length)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ read: true }).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  async function dismiss(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    setUnread(prev => Math.max(0, prev - 1))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        {unread > 0 ? <BellDot size={20} className="text-brand-500" /> : <Bell size={20} className="text-gray-400" />}
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-500 hover:underline">Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              <Bell size={28} className="mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
              {notifications.map(n => (
                <li key={n.id} className={`flex items-start gap-3 px-4 py-3 ${
                  !n.read ? 'bg-brand-50 dark:bg-brand-900/10' : ''
                }`}>
                  <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? <Bell size={14} className="text-gray-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.read ? 'font-semibold' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                    {n.message && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                      {n.created_at ? new Date(n.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <button onClick={() => dismiss(n.id)} aria-label="Dismiss" className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5">
                    <X size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

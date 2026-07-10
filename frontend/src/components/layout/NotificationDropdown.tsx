'use client'
import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Alert = {
  id: string
  new_price: number
  old_price: number
  triggered_at: string
  seen_at: string | null
  wishlist_item: { product_name: string } | null
}

export default function NotificationDropdown() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const ref = useRef<HTMLDivElement>(null)

  async function fetchAlerts() {
    const { data } = await supabase
      .from('price_alerts')
      .select('id, new_price, old_price, triggered_at, seen_at, wishlist_item:wishlist_items(product_name)')
      .order('triggered_at', { ascending: false })
      .limit(15)
    setAlerts((data as Alert[]) ?? [])
  }

  async function markAllRead() {
    const now = new Date().toISOString()
    await supabase.from('price_alerts').update({ seen_at: now }).is('seen_at', null)
    setAlerts(prev => prev.map(a => ({ ...a, seen_at: a.seen_at ?? now })))
  }

  // Initial fetch
  useEffect(() => { fetchAlerts() }, [])

  // Supabase Realtime — live updates
  useEffect(() => {
    const channel = supabase
      .channel('price-alerts-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'price_alerts',
      }, () => fetchAlerts())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = alerts.filter(a => !a.seen_at).length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 relative"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <span className="font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {alerts.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No notifications yet</p>
            )}
            {alerts.map(alert => (
              <div key={alert.id}
                className={`px-4 py-3 flex gap-3 items-start hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${
                  !alert.seen_at ? 'bg-brand-50/40 dark:bg-brand-900/10' : ''
                }`}>
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">📉</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.wishlist_item?.product_name ?? 'Product'}</p>
                  <p className="text-xs text-gray-500">
                    <span className="line-through">€{alert.old_price}</span> → <span className="text-green-600 font-semibold">€{alert.new_price}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(alert.triggered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {!alert.seen_at && <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <Link href="/tracker" onClick={() => setOpen(false)}
              className="text-xs text-brand-500 hover:text-brand-600 font-medium">
              View all in tracker →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Plus, ListChecks } from 'lucide-react'
import type { WishlistRow, WishlistWithRecipient } from '@/types/rows'
import EmptyState from '@/components/EmptyState'

function daysUntilEvent(date: string): number | null {
  if (!date) return null
  const today = new Date()
  const event = new Date(date)
  if (event < today) return null
  return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function WishlistsPage() {
  const supabase = await createClient()
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*, recipients(name)')
    .order('created_at', { ascending: false })
    .returns<(WishlistRow & { recipients: { name: string } | null })[]>()

  return (
    <div className="space-y-8 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-wide">Wishlists</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">All gift wishlists</p>
        </div>
        <Link href="/wishlists/new" className="btn-primary !py-2.5 !px-5 !text-xs">
          <Plus size={14} /> New Wishlist
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {wishlists?.map((w, i) => {
          const days = daysUntilEvent(w.event_date ?? '')
          return (
            <Link key={w.id} href={`/wishlists/${w.id}`}
              className="card-hover p-5 group"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/8 dark:bg-brand-500/10 flex items-center justify-center">
                    <ListChecks size={16} className="text-brand-500" />
                  </div>
                  <p className="font-semibold text-[15px] text-gray-800 dark:text-gray-200">{w.title}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 dark:text-gray-700 group-hover:text-brand-500 transition-colors" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  👤 {(w as WishlistWithRecipient).recipients?.name ?? 'Unknown'}
                </span>
                {w.occasion && (
                  <span className="text-[11px] text-gray-400">🎯 {w.occasion}</span>
                )}
                {days !== null && (
                  <span className="countdown-pill">📅 {days}d</span>
                )}
                {w.is_public ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 border border-brand-100 dark:border-brand-900/20 flex items-center gap-1">
                    🌐 Shared
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border border-gray-100 dark:border-gray-800 flex items-center gap-1">
                    🔒 Private
                  </span>
                )}
              </div>
            </Link>
          )
        })}

        {(!wishlists || wishlists.length === 0) && (
          <div className="col-span-full">
            <EmptyState type="wishlists" />
          </div>
        )}
      </div>
    </div>
  )
}
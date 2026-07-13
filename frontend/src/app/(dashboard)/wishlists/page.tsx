import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ListChecks, Plus, User } from 'lucide-react'
import type { WishlistRow } from '@/types/rows'

export default async function WishlistsPage() {
  const supabase = await createClient()
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*, recipients(name)')
    .order('created_at', { ascending: false })
    .returns<(WishlistRow & { recipients: { name: string } | null })[]>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlists</h1>
          <p className="text-gray-500 text-sm">All gift wishlists</p>
        </div>
        <Link href="/wishlists/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium">
          <Plus size={16} /> New Wishlist
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlists?.map(w => (
          <Link key={w.id} href={`/wishlists/${w.id}`}
            className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks size={18} className="text-brand-500" />
              <p className="font-semibold">{w.title}</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <User size={12} />
              {(w.recipients as any)?.name ?? 'Unknown'}
            </div>
            {w.occasion && <p className="text-xs text-gray-400">{w.occasion}</p>}
            {w.event_date && <p className="text-xs text-gray-400">📅 {w.event_date}</p>}
          </Link>
        ))}

        {(!wishlists || wishlists.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <ListChecks size={48} className="mx-auto mb-3 opacity-30" />
            <p>No wishlists yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  )
}
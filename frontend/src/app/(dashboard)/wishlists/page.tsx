import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ListChecks } from 'lucide-react'

export default async function WishlistsPage() {
  const supabase = await createClient()

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date, is_public, recipient:recipients(name)')
    .order('event_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlists</h1>
          <p className="text-sm text-gray-500">Gift lists organised by recipient and occasion</p>
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
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold">{w.title}</p>
                <p className="text-xs text-gray-500">
                  {/* @ts-ignore */}
                  {w.recipient?.name} &middot; {w.occasion ?? 'General'}
                </p>
              </div>
              {w.is_public && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Public</span>
              )}
            </div>
            {w.event_date && (
              <p className="text-xs text-gray-400 mt-2">📅 {w.event_date}</p>
            )}
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

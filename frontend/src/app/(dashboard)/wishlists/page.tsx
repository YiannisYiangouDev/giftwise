import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Gift } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default async function WishlistsPage() {
  const supabase = await createClient()
  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date, is_public, recipients(name)')
    .order('event_date', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wishlists</h1>
          <p className="text-gray-500 text-sm">Gift lists for every occasion</p>
        </div>
        <Link href="/wishlists/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium">
          <Plus size={16} /> New Wishlist
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlists?.map(w => {
          const recipient = w.recipients as { name: string } | null
          return (
            <Link key={w.id} href={`/wishlists/${w.id}`}
              className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 bg-brand-100 dark:bg-brand-900 rounded-lg flex items-center justify-center shrink-0">
                  <Gift size={18} className="text-brand-500" />
                </div>
                {w.is_public && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full">Shared</span>
                )}
              </div>
              <p className="font-semibold leading-snug">{w.title}</p>
              {recipient && <p className="text-xs text-gray-400 mt-0.5">For {recipient.name}</p>}
              {w.event_date && (
                <p className="text-xs text-gray-400 mt-2">
                  📅 {format(parseISO(w.event_date as string), 'MMM d, yyyy')}
                </p>
              )}
            </Link>
          )
        })}

        {(!wishlists || wishlists.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Gift size={48} className="mx-auto mb-3 opacity-30" />
            <p>No wishlists yet. Create your first one!</p>
          </div>
        )}
      </div>
    </div>
  )
}

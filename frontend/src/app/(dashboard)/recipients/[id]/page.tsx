import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { User, Edit, Gift, Plus, Wallet } from 'lucide-react'
import type { RecipientRow, WishlistRow } from '@/types/rows'

export default async function RecipientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('recipients')
    .select('*')
    .eq('id', id)
    .single()
  const recipient = data as RecipientRow | null
  if (!recipient) notFound()

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('*')
    .eq('recipient_id', id)
    .order('created_at', { ascending: false })
    .returns<WishlistRow[]>()

  // Calculate budget: sum of all items' best prices across their wishlists
  const wishlistIds = wishlists?.map(w => w.id) ?? []
  const { data: items } = wishlistIds.length > 0 ? await supabase
    .from('wishlist_items')
    .select('current_best_price, status')
    .in('wishlist_id', wishlistIds)
    .not('status', 'in', '("purchased","received")') : { data: [] }

  const totalSpent = (items ?? [])
    .filter(i => i.current_best_price)
    .reduce((s, i) => s + (i.current_best_price ?? 0), 0)
  const budget = recipient.budget_max || recipient.budget_min || 0
  const budgetPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={28} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{recipient.name}</h1>
            <p className="text-gray-500">{recipient.relationship ?? 'No relationship set'}</p>
          </div>
        </div>
        <Link href={`/recipients/${id}/edit`}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Edit size={16} /> Edit
        </Link>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {recipient.birthday && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Birthday</p>
            <p className="font-medium">🎂 {recipient.birthday}</p>
          </div>
        )}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Budget Range</p>
          <p className="font-medium">€{recipient.budget_min} – €{recipient.budget_max}</p>
        </div>
        {recipient.notes && (
          <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm">{recipient.notes}</p>
          </div>
        )}
      </div>

      {/* Budget tracking bar */}
      {budget > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Wallet size={16} className="text-brand-500" /> Budget Tracker
            </p>
            <p className="text-xs text-gray-500">
              {items?.length ?? 0} active items
            </p>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>€{totalSpent.toFixed(2)} of €{budget}</span>
            <span className={`font-medium ${budgetPct > 100 ? 'text-red-500' : budgetPct > 80 ? 'text-yellow-500' : 'text-green-500'}`}>
              {budgetPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-yellow-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min(budgetPct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Wishlists */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Gift size={18} /> Wishlists
          </h2>
          <Link href={`/wishlists/new?recipient=${id}`}
            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium">
            <Plus size={14} /> New Wishlist
          </Link>
        </div>

        {wishlists && wishlists.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {wishlists.map(w => (
              <Link key={w.id} href={`/wishlists/${w.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
                <p className="font-medium">{w.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {w.occasion ?? 'No occasion'} {w.event_date && `· ${w.event_date}`}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">No wishlists yet.</p>
        )}
      </div>
    </div>
  )
}
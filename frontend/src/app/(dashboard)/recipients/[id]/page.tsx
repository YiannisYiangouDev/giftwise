import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Edit, Gift, Plus, Wallet } from 'lucide-react'
import type { RecipientRow, WishlistRow } from '@/types/rows'
import BudgetRing from '@/components/BudgetRing'

function daysUntilBirthday(birthday: string): number | null {
  if (!birthday) return null
  const today = new Date()
  const [y, m, d] = birthday.split('-').map(Number)
  if (!m || !d) return null
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

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

  const wishlistIds = wishlists?.map(w => w.id) ?? []
  const { data: items } = wishlistIds.length > 0 ? await supabase
    .from('wishlist_items')
    .select('current_best_price, status')
    .in('wishlist_id', wishlistIds)
    .not('status', 'in', '(purchased,received)') : { data: [] }

  const totalSpent = (items ?? [])
    .filter(i => i.current_best_price)
    .reduce((s, i) => s + (i.current_best_price ?? 0), 0)
  const budget = recipient.budget_max || recipient.budget_min || 0
  const budgetPct = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0
  const days = daysUntilBirthday(recipient.birthday ?? '')

  return (
    <div className="space-y-8 page-enter">
      {/* Hero Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="avatar-lg avatar-gold text-xl">{recipient.name.charAt(0)}</div>
          <div>
            <h1 className="text-3xl font-normal tracking-wide">{recipient.name}</h1>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-0.5">{recipient.relationship ?? 'No relationship set'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {days !== null && days <= 30 && (
            <span className="countdown-pill text-xs animate-count-pulse">🎂 in {days} days</span>
          )}
          <Link href={`/recipients/${id}/edit`} className="btn-secondary !py-2 !px-4 !text-xs">
            <Edit size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3 stagger-children">
        {recipient.birthday && (
          <div className="card p-5">
            <p className="section-title mb-2">Birthday</p>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300">🎂 {recipient.birthday}</p>
            {days !== null && (
              <p className="text-xs text-brand-500 mt-1 font-medium">{days} days away</p>
            )}
          </div>
        )}
        <div className="card p-5">
          <p className="section-title mb-2">Budget Range</p>
          <p className="text-base font-medium text-gray-700 dark:text-gray-300">€{recipient.budget_min} – €{recipient.budget_max}</p>
        </div>
        {recipient.notes && (
          <div className="card p-5">
            <p className="section-title mb-2">Notes</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{recipient.notes}</p>
          </div>
        )}
      </div>

      {/* Budget Tracker */}
      {budget > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Wallet size={16} className="text-brand-500" /> Budget Tracker
            </p>
            <BudgetRing spent={budget} budget={recipient.budget_max} size={60} />
            <p className="text-[11px] text-gray-400">{items?.length ?? 0} active items</p>
          </div>
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="font-medium">€{totalSpent.toFixed(2)} <span className="text-gray-400 font-normal">of €{budget}</span></span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              budgetPct > 100 ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
              budgetPct > 80 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
              'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
            }`}>
              {budgetPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ease-out ${
              budgetPct > 100 ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-400 to-brand-500'
            }`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
          </div>
        </div>
      )}

      {/* Wishlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-normal tracking-wide flex items-center gap-2">
            <Gift size={18} className="text-brand-500" /> Wishlists
          </h2>
          <Link href={`/wishlists/new?recipient=${id}`}
            className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors">
            <Plus size={13} /> New Wishlist
          </Link>
        </div>

        {wishlists && wishlists.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {wishlists.map(w => (
              <Link key={w.id} href={`/wishlists/${w.id}`} className="card-hover p-4 group">
                <p className="font-medium text-sm text-gray-700 dark:text-gray-300">{w.title}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {w.occasion ?? 'No occasion'} {w.event_date && `· ${w.event_date}`}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">No wishlists yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
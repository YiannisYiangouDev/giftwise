import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

function pct(spent: number, budget: number) {
  if (!budget) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

export default async function TrackerPage() {
  const supabase = await createClient()

  // All recipients with budget info
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, relationship, budget_min, budget_max')
    .order('name')

  // All purchased/received items with price data
  const { data: purchasedItems } = await supabase
    .from('wishlist_items')
    .select('wishlist_id, current_best_price, target_price, status, wishlists(recipient_id)')
    .in('status', ['purchased', 'received'])

  // Build per-recipient spend map
  const spendMap: Record<string, number> = {}
  for (const item of purchasedItems ?? []) {
    const wl = item.wishlists as { recipient_id: string } | null
    if (!wl) continue
    const price = item.current_best_price ?? item.target_price ?? 0
    spendMap[wl.recipient_id] = (spendMap[wl.recipient_id] ?? 0) + price
  }

  const totalBudgetMax = (recipients ?? []).reduce((s, r) => s + (r.budget_max ?? 0), 0)
  const totalSpent = Object.values(spendMap).reduce((s, v) => s + v, 0)
  const totalSaved = (recipients ?? []).reduce((s, r) => {
    const spent = spendMap[r.id] ?? 0
    const budget = r.budget_max ?? 0
    return s + Math.max(0, budget - spent)
  }, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Budget Tracker</h1>
        <p className="text-sm text-gray-500">Track what you've spent per person</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total spent"
          value={`€${totalSpent.toFixed(2)}`}
          icon={<Wallet size={20} className="text-brand-500" />}
          sub={totalBudgetMax ? `of €${totalBudgetMax.toFixed(2)} total budget` : undefined}
        />
        <KpiCard
          label="Remaining budget"
          value={`€${totalSaved.toFixed(2)}`}
          icon={<TrendingDown size={20} className="text-green-500" />}
          sub="across all recipients"
        />
        <KpiCard
          label="Recipients tracked"
          value={String(recipients?.length ?? 0)}
          icon={<TrendingUp size={20} className="text-amber-500" />}
          sub="with budget set"
        />
      </div>

      {/* Per-recipient rows */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-sm">Per person</h2>
        </div>
        {recipients && recipients.length > 0 ? (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800">
            {recipients.map(r => {
              const spent = spendMap[r.id] ?? 0
              const budget = r.budget_max ?? 0
              const progress = pct(spent, budget)
              const over = budget > 0 && spent > budget
              return (
                <li key={r.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
                      {r.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <Link href={`/recipients/${r.id}`} className="font-medium text-sm hover:text-brand-500 transition">
                        {r.name}
                      </Link>
                      <div className="text-xs text-gray-500 shrink-0 ml-2">
                        <span className={over ? 'text-red-500 font-semibold' : 'font-medium'}>
                          €{spent.toFixed(2)}
                        </span>
                        {budget > 0 && (
                          <span className="text-gray-400"> / €{budget.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    {budget > 0 ? (
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            over
                              ? 'bg-red-400'
                              : progress > 80
                              ? 'bg-amber-400'
                              : 'bg-brand-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No budget set</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-16 text-center text-gray-400">
            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add recipients with budgets to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

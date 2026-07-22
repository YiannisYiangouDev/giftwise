import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PiggyBank, Target, Calendar, Plus, Wallet, Sparkles, TrendingUp, CheckCircle2, ArrowRight } from 'lucide-react'

export default async function SavingsPage() {
  const supabase = await createClient()

  // Fetch recipients and wishlists for smart savings calculation
  const { data: recipients } = await supabase
    .from('recipients')
    .select('id, name, budget_max')

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date')

  const { data: wishlistItems } = await supabase
    .from('wishlist_items')
    .select('target_price, current_best_price, status')

  // Calculate annual gift commitment
  const totalRecipientBudget = (recipients ?? []).reduce((sum, r) => sum + (r.budget_max || 100), 0)
  const pendingWishlistTotal = (wishlistItems ?? [])
    .filter(i => i.status === 'wanted')
    .reduce((sum, i) => sum + (i.current_best_price || i.target_price || 0), 0)

  // Default Preset Savings Goals
  const currentYear = new Date().getFullYear()
  const christmasDate = new Date(`${currentYear}-12-25`)
  const today = new Date()
  const monthsUntilChristmas = Math.max(1, Math.ceil((christmasDate.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30.4)))

  const goals = [
    {
      id: 'g-1',
      title: 'Christmas & New Year Gifts 🎄',
      targetAmount: totalRecipientBudget > 0 ? totalRecipientBudget : 600,
      currentSaved: 240,
      deadline: `${currentYear}-12-25`,
      category: 'Holiday',
    },
    {
      id: 'g-2',
      title: 'Family Weddings & Anniversaries 💍',
      targetAmount: 350,
      currentSaved: 175,
      deadline: `${currentYear}-09-15`,
      category: 'Celebration',
    },
    {
      id: 'g-3',
      title: 'Birthdays & Name Days Pool 🎂',
      targetAmount: 400,
      currentSaved: 310,
      deadline: `${currentYear}-11-30`,
      category: 'Recurring',
    },
  ]

  const totalPool = goals.reduce((sum, g) => sum + g.currentSaved, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const monthlyNeededTotal = goals.reduce((sum, g) => {
    const dDate = new Date(g.deadline)
    const mLeft = Math.max(1, Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30.4)))
    const remaining = Math.max(0, g.targetAmount - g.currentSaved)
    return sum + (remaining / mLeft)
  }, 0)

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="text-brand-500" size={24} />
            <h1 className="text-3xl font-normal tracking-wide text-gray-900 dark:text-white">
              Gift Savings Pool & Calculator
            </h1>
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            Set aside monthly funds for Christmas, family weddings, and major gift celebrations
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 border border-brand-500/20">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Savings Pool Saved</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">€{totalPool.toFixed(2)}</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Required Monthly Deposit</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">€{monthlyNeededTotal.toFixed(2)}/mo</p>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
            <Target size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Target Commitments</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">€{totalTarget.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Smart Auto-Recommendation Card */}
      <div className="card p-6 bg-gradient-to-r from-brand-500/10 via-amber-500/5 to-transparent border border-brand-500/20 space-y-3">
        <div className="flex items-center gap-2 text-brand-500 font-semibold text-sm">
          <Sparkles size={18} />
          <span>Smart Budget Savings Recommendation</span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Based on your <strong>{recipients?.length || 0} recipients</strong> and active wishlist items worth <strong>€{pendingWishlistTotal.toFixed(2)}</strong>, we recommend setting aside <strong>€{(totalRecipientBudget / 12).toFixed(2)}/month</strong> to comfortably cover all holiday gifts without December budget stress.
        </p>
        <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-500">
          <span>🎯 Annual Target: €{totalRecipientBudget.toFixed(2)}</span>
          <span>·</span>
          <span>📅 Christmas Target in {monthsUntilChristmas} months: €{(totalRecipientBudget / monthsUntilChristmas).toFixed(2)}/mo</span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Active Savings Goals ({goals.length})</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => {
            const pct = Math.min(100, Math.round((goal.currentSaved / goal.targetAmount) * 100))
            const remaining = Math.max(0, goal.targetAmount - goal.currentSaved)
            const dDate = new Date(goal.deadline)
            const monthsLeft = Math.max(1, Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 3600 * 24 * 30.4)))
            const monthlyNeeded = (remaining / monthsLeft).toFixed(2)

            return (
              <div key={goal.id} className="card p-5 flex flex-col justify-between space-y-4 transition hover:shadow-md">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300">
                      {goal.category}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Deadline: {goal.deadline}</span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100">
                      {goal.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Target: <span className="font-bold text-gray-800 dark:text-gray-200">€{goal.targetAmount.toFixed(2)}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-brand-500">€{goal.currentSaved.toFixed(2)} saved</span>
                      <span className="text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Monthly Contribution:</span>
                    <span className="font-bold text-gray-900 dark:text-white">€{monthlyNeeded}/mo</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Remaining: €{remaining.toFixed(2)}</span>
                  <button type="button" className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1">
                    <Plus size={12} /> Log Deposit
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

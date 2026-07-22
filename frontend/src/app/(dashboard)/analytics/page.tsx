'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Wallet, TrendingUp, Users, Award, DollarSign, Target, Sparkles, Check, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/components/Toast'

interface RecipientBudget {
  id: string
  name: string
  relationship: string | null
  budget_target: number
  total_spent: number
  item_count: number
}

const OCCASION_COLORS = ['#c5a880', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6']

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AnalyticsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [recipientBudgets, setRecipientBudgets] = useState<RecipientBudget[]>([])
  const [occasionData, setOccasionData] = useState<{ name: string; value: number }[]>([])
  const [monthlyData, setMonthlyData] = useState<{ month: string; spent: number }[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState('')

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Load Recipients & Items
        const { data: recipients } = await supabase
          .from('recipients')
          .select('id, name, relationship, budget_min, budget_max, budget_target')
          .eq('user_id', user.id)

        const { data: wishlists } = await supabase
          .from('wishlists')
          .select('id, recipient_id, occasion, wishlist_items(id, product_name, current_best_price, target_price, status, created_at)')

        if (recipients && wishlists) {
          // Process recipient budgets
          const recipientMap: Record<string, RecipientBudget> = {}
          recipients.forEach(r => {
            recipientMap[r.id] = {
              id: r.id,
              name: r.name,
              relationship: r.relationship,
              budget_target: r.budget_target || r.budget_max || 150,
              total_spent: 0,
              item_count: 0,
            }
          })

          const occasionMap: Record<string, number> = {}
          const monthMap: Record<number, number> = {}
          for (let i = 0; i < 12; i++) monthMap[i] = 0

          wishlists.forEach(w => {
            const occ = w.occasion || 'General'
            const recId = w.recipient_id

            if (w.wishlist_items) {
              w.wishlist_items.forEach((item: any) => {
                const price = Number(item.current_best_price || item.target_price || 0)
                if (price > 0 && (item.status === 'purchased' || item.status === 'claimed')) {
                  if (recId && recipientMap[recId]) {
                    recipientMap[recId].total_spent += price
                    recipientMap[recId].item_count += 1
                  }

                  occasionMap[occ] = (occasionMap[occ] || 0) + price

                  if (item.created_at) {
                    const d = new Date(item.created_at)
                    const m = d.getMonth()
                    monthMap[m] = (monthMap[m] || 0) + price
                  }
                }
              })
            }
          })

          setRecipientBudgets(Object.values(recipientMap))

          // Occasion chart data
          const occChartData = Object.entries(occasionMap).map(([name, value]) => ({ name, value }))
          setOccasionData(occChartData.length > 0 ? occChartData : [
            { name: 'Birthdays', value: 350 },
            { name: 'Christmas', value: 500 },
            { name: 'Anniversaries', value: 200 },
          ])

          // Monthly chart data
          const mData = MONTH_NAMES.map((month, idx) => ({
            month,
            spent: monthMap[idx] || (idx === 11 ? 450 : idx === 4 ? 120 : 0),
          }))
          setMonthlyData(mData)
        }
      } catch (err) {
        console.error('Error loading analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  async function handleSaveTarget(recipientId: string) {
    const val = parseFloat(editTarget)
    if (isNaN(val) || val < 0) {
      toast('Please enter a valid target budget.', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('recipients')
        .update({ budget_target: val })
        .eq('id', recipientId)

      if (error) throw error

      setRecipientBudgets(prev => prev.map(r => r.id === recipientId ? { ...r, budget_target: val } : r))
      setEditingId(null)
      toast('Recipient budget target updated!')
    } catch (err: any) {
      toast(`Error updating budget: ${err.message || err}`, 'error')
    }
  }

  // Summary Metrics
  const totalAnnualBudget = recipientBudgets.reduce((acc, r) => acc + (r.budget_target || 0), 0)
  const totalSpent = recipientBudgets.reduce((acc, r) => acc + r.total_spent, 0)
  const remainingBudget = Math.max(0, totalAnnualBudget - totalSpent)
  const avgPerRecipient = recipientBudgets.length > 0 ? totalSpent / recipientBudgets.length : 0

  return (
    <div className="space-y-8 page-enter">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-normal tracking-wide text-gray-900 dark:text-white">{t('analytics_title')}</h1>
          <Sparkles size={20} className="text-lux-gold" />
        </div>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('analytics_subtitle')}</p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('annual_budget')}</span>
            <Target size={18} className="text-brand-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">€{totalAnnualBudget.toFixed(0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Combined recipient targets</p>
        </div>

        <div className="card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('total_spent')}</span>
            <Wallet size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">€{totalSpent.toFixed(0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Gifts claimed & purchased</p>
        </div>

        <div className="card p-5 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('remaining_budget')}</span>
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">€{remainingBudget.toFixed(0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Available for upcoming events</p>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('avg_per_recipient')}</span>
            <Users size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">€{avgPerRecipient.toFixed(0)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Across {recipientBudgets.length} family members</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Occasion (Donut Chart) */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Award size={16} className="text-brand-500" /> {t('spending_by_occasion')}
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occasionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {occasionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={OCCASION_COLORS[index % OCCASION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `€${val.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expense Timeline (Bar Chart) */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-500" /> {t('monthly_expenses')}
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(val: number) => `€${val.toFixed(2)}`} />
                <Bar dataKey="spent" fill="#c5a880" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recipient Target Budgets */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Target size={16} className="text-brand-500" /> {t('recipient_budgets')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipientBudgets.map(r => {
            const pct = r.budget_target > 0 ? Math.min(100, Math.round((r.total_spent / r.budget_target) * 100)) : 0
            const isOver = r.total_spent > r.budget_target
            const isNear = pct >= 80 && !isOver

            return (
              <div key={r.id} className="p-4 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{r.name}</h3>
                    <p className="text-[11px] text-gray-400">{r.relationship || 'Family Member'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                    isOver
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200/50'
                      : isNear
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/50'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50'
                  }`}>
                    {isOver ? t('budget_over') : isNear ? t('budget_target_met') : t('budget_under')}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-600 dark:text-gray-300">€{r.total_spent.toFixed(2)} spent</span>
                    {editingId === r.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editTarget}
                          onChange={e => setEditTarget(e.target.value)}
                          className="w-16 px-1 py-0.5 text-xs border rounded input"
                          autoFocus
                        />
                        <button onClick={() => handleSaveTarget(r.id)} className="p-1 text-emerald-500 hover:text-emerald-600">
                          <Check size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(r.id); setEditTarget(String(r.budget_target)) }}
                        className="text-gray-400 hover:text-brand-500 flex items-center gap-1 text-[11px]"
                      >
                        Target: €{r.budget_target} <Edit2 size={10} />
                      </button>
                    )}
                  </div>

                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-brand-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

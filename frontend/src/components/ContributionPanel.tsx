'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Users, Plus } from 'lucide-react'

interface Contribution {
  id: string
  user_id: string
  amount: number
  message: string | null
  created_at: string
}

export default function ContributionPanel({ itemId, totalContributed, isGroupGift }: {
  itemId: string
  totalContributed: number
  isGroupGift: boolean
}) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    supabase.from('contributions').select('*').eq('item_id', itemId).order('created_at', { ascending: false })
      .then(({ data }) => setContributions((data as Contribution[]) ?? []))
  }, [itemId])

  async function contribute() {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    await supabase.from('contributions').insert({
      item_id: itemId,
      amount: parseFloat(amount),
      message: message || null,
    } as any)
    // Refresh
    const { data } = await supabase.from('contributions').select('*').eq('item_id', itemId).order('created_at', { ascending: false })
    setContributions((data as Contribution[]) ?? [])
    setAmount('')
    setMessage('')
    setShowForm(false)
    setLoading(false)
    router.refresh()
    toast(`Contributed €${parseFloat(amount || '0').toFixed(2)}!`)
  }

  const total = contributions.reduce((sum, c) => sum + c.amount, 0)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Users size={14} />
          <span>{contributions.length} contributor{contributions.length !== 1 ? 's' : ''}</span>
          {total > 0 && <span>· €{total.toFixed(2)} pooled</span>}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600 font-medium">
          <Plus size={12} /> Contribute
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 mb-2">
          <input type="number" step="0.01" min="1" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="€" className="w-20 px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
          <input type="text" value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Message (optional)" className="flex-1 px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
          <button onClick={contribute} disabled={loading}
            className="px-3 py-1 bg-brand-500 text-white text-xs rounded-lg hover:bg-brand-600 disabled:opacity-40">
            Add
          </button>
        </div>
      )}

      {contributions.slice(0, 5).map(c => (
        <div key={c.id} className="flex items-center gap-2 text-xs text-gray-500 py-0.5">
          <span className="font-medium text-gray-700 dark:text-gray-300">€{c.amount.toFixed(2)}</span>
          {c.message && <span className="truncate">— {c.message}</span>}
        </div>
      ))}
    </div>
  )
}

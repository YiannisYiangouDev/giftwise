'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Sparkles, Plus, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Idea {
  name: string
  description: string
  price: number
  reasoning: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  recipient: {
    name: string
    relationship: string | null
    birthday: string | null
    notes: string | null
    budget_min: number
    budget_max: number
  }
  wishlistId: string
  onItemAdded?: () => void
}

export default function GiftIdeasModal({ isOpen, onClose, recipient, wishlistId, onItemAdded }: Props) {
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({})
  const supabase = createClient()
  const { toast } = useToast()

  if (!isOpen) return null

  async function fetchIdeas() {
    setLoading(true)
    setIdeas([])
    try {
      const response = await fetch('/api/gift-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship: recipient.relationship,
          notes: recipient.notes,
          age: recipient.birthday ? `Born on ${recipient.birthday}` : 'Unknown age',
          budgetMin: recipient.budget_min,
          budgetMax: recipient.budget_max,
        })
      })
      const data = await response.json()
      if (data.ideas) {
        setIdeas(data.ideas)
      } else {
        toast(data.error || 'Failed to fetch suggestions', 'error')
      }
    } catch (err) {
      toast('Failed to reach AI helper', 'error')
    }
    setLoading(false)
  }

  async function addToList(item: Idea) {
    try {
      const { error } = await supabase.from('wishlist_items').insert({
        wishlist_id: wishlistId,
        product_name: item.name,
        target_price: Math.min(999999.99, Math.max(0, parseFloat(item.price.toFixed(2)))),
        notes: `${item.description}\n\nMatch Reason: ${item.reasoning}`,
        status: 'wanted',
      })

      if (error) throw error

      setAddedItems(prev => ({ ...prev, [item.name]: true }))
      toast(`Added "${item.name}" to wishlist!`)
      if (onItemAdded) onItemAdded()
    } catch (err) {
      toast('Failed to add item to wishlist', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#121212] w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-lux-gold animate-pulse" />
            <h2 className="text-lg font-normal serif-heading text-gray-800 dark:text-gray-100">
              AI Gift Ideas for {recipient.name}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {ideas.length === 0 && !loading && (
            <div className="py-12 text-center space-y-4">
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Let Gemini analyze {recipient.name}&apos;s profile (budget, relationship, and notes) to recommend customized gift suggestions.
              </p>
              <button
                onClick={fetchIdeas}
                className="btn-primary"
              >
                <Sparkles size={16} /> Generate Suggestions
              </button>
            </div>
          )}

          {/* Shimmer Loading State */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border border-gray-100 dark:border-gray-800/60 rounded-xl space-y-2">
                  <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 w-4/6 bg-gray-100 dark:bg-gray-800 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Ideas List */}
          {ideas.length > 0 && (
            <div className="space-y-4">
              {ideas.map((item, idx) => {
                const isAdded = addedItems[item.name]
                return (
                  <div
                    key={idx}
                    className="p-5 border border-gray-100 dark:border-gray-800/60 rounded-xl bg-gray-50/50 dark:bg-gray-950/20 flex items-start justify-between gap-4 hover:border-lux-gold/30 transition duration-300 animate-slide-up"
                  >
                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{item.name}</span>
                        <span className="text-xs font-semibold text-lux-gold">€{item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.description}</p>
                      <p className="text-[10px] text-lux-gold bg-lux-gold/5 dark:bg-lux-gold/10 px-2.5 py-1 rounded-md border border-lux-gold/10 leading-relaxed inline-block">
                        💡 {item.reasoning}
                      </p>
                    </div>

                    <button
                      onClick={() => addToList(item)}
                      disabled={isAdded}
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition duration-300 ${
                        isAdded
                          ? 'bg-green-500 text-white'
                          : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-lux-gold text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {isAdded ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const OCCASIONS = ['Birthday', 'Christmas', 'Name Day', 'Anniversary', 'Graduation', 'Other']

const OCCASION_TEMPLATES: Record<string, string[]> = {
  Birthday: ['Perfume', 'Jewellery', 'Experience voucher', 'Book', 'Tech gadget'],
  Christmas: ['Cosy homeware', 'Candles', 'Games', 'Clothing', 'Subscription box'],
  'Name Day': ['Flowers', 'Chocolates', 'Personalised gift', 'Wine', 'Spa voucher'],
  Anniversary: ['Jewellery', 'Weekend getaway', 'Engraved keepsake', 'Fine dining', 'Photo book'],
  Graduation: ['Laptop bag', 'Planner', 'Luggage', 'Watch', 'Professional attire'],
  Other: [],
}

export default function NewWishlistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    recipient_id: searchParams.get('recipient') ?? '',
    title: '',
    occasion: '',
    event_date: '',
  })

  useEffect(() => {
    supabase.from('recipients').select('id, name').order('name')
      .then(({ data }) => setRecipients(data ?? []))
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'occasion' && value && !form.title) {
      const recipient = recipients.find(r => r.id === form.recipient_id)
      setForm(prev => ({ ...prev, occasion: value, title: recipient ? `${recipient.name}'s ${value}` : value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: insertError } = await supabase.from('wishlists').insert({
      recipient_id: form.recipient_id,
      title: form.title.trim(),
      occasion: form.occasion || null,
      event_date: form.event_date || null,
    }).select('id').single()

    if (insertError || !data) {
      setError(insertError?.message ?? 'Failed to create wishlist')
      setLoading(false)
      return
    }

    router.push(`/wishlists/${data.id}`)
    router.refresh()
  }

  const suggestions = OCCASION_TEMPLATES[form.occasion] ?? []

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/wishlists" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Wishlist</h1>
          <p className="text-sm text-gray-500">Create a gift list for an occasion</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recipient *</label>
          <select
            required
            value={form.recipient_id}
            onChange={e => set('recipient_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select recipient</option>
            {recipients.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map(o => (
              <button key={o} type="button"
                onClick={() => set('occasion', o)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  form.occasion === o
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="bg-brand-50 dark:bg-brand-900/10 rounded-lg p-3">
            <p className="text-xs font-medium text-brand-700 dark:text-brand-400 mb-1">💡 Popular {form.occasion} gift ideas</p>
            <p className="text-xs text-gray-500">{suggestions.join(' · ')}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Maria's Birthday 2026"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
          <input
            type="date"
            value={form.event_date}
            onChange={e => set('event_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/wishlists"
            className="flex-1 text-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Wishlist'}
          </button>
        </div>
      </form>
    </div>
  )
}

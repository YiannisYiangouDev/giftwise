'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { sanitize, sanitizeOptional } from '@/lib/sanitize'
import { useToast } from '@/components/Toast'

interface WishlistFormProps {
  initial?: {
    recipient_id: string
    title: string
    occasion: string
    event_date: string
  } | null
  wishlistId?: string
}

export default function WishlistForm({ initial, wishlistId }: WishlistFormProps) {
  const searchParams = useSearchParams()
  const preselectedRecipient = searchParams.get('recipient')

  const [recipients, setRecipients] = useState<{ id: string; name: string }[]>([])
  const [recipientId, setRecipientId] = useState(initial?.recipient_id ?? preselectedRecipient ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [occasion, setOccasion] = useState(initial?.occasion ?? '')
  const [eventDate, setEventDate] = useState(initial?.event_date ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('recipients').select('id, name').order('name')
      setRecipients(data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      recipient_id: recipientId,
      title: sanitize(title),
      occasion: sanitizeOptional(occasion),
      event_date: eventDate || null,
    }

    let result
    if (wishlistId) {
      result = await supabase.from('wishlists').update(data).eq('id', wishlistId)
    } else {
      result = await supabase.from('wishlists').insert(data)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      toast(wishlistId ? 'Wishlist updated!' : 'Wishlist created!')
      router.push('/wishlists')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Recipient <span className="text-red-500">*</span>
        </label>
        <select
          value={recipientId} onChange={e => setRecipientId(e.target.value)} required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="">Select a person…</option>
          {recipients.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Wishlist Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)} required
          placeholder="e.g. Christmas 2026, Birthday Ideas"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Occasion</label>
          <select
            value={occasion} onChange={e => setOccasion(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
          >
            <option value="">Select…</option>
            <option value="Birthday">Birthday</option>
            <option value="Christmas">Christmas</option>
            <option value="Name Day">Name Day</option>
            <option value="Anniversary">Anniversary</option>
            <option value="Graduation">Graduation</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Date</label>
          <input
            type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium disabled:opacity-50">
          {loading ? 'Saving…' : wishlistId ? 'Update' : 'Create Wishlist'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          Cancel
        </button>
      </div>
    </form>
  )
}
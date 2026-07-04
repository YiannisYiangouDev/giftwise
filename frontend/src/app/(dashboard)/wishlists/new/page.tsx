'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const OCCASIONS = ['Birthday', 'Christmas', 'Name Day', 'Anniversary', 'Wedding', 'Baby Shower', 'Graduation', 'Other']

export default function NewWishlistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillRecipient = searchParams.get('recipient') ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    recipient_id: prefillRecipient,
    title: '',
    occasion: '',
    event_date: '',
  })

  // Auto-fill title when occasion + recipient selected
  useEffect(() => {
    const recipient = recipients.find(r => r.id === form.recipient_id)
    if (recipient && form.occasion && !form.title) {
      set('title', `${recipient.name}'s ${form.occasion}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.occasion, form.recipient_id])

  useEffect(() => {
    async function loadRecipients() {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipients')
        .select('id, name')
        .order('name')
      setRecipients(data ?? [])
    }
    loadRecipients()
  }, [])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data: wishlist, error: insertError } = await supabase
      .from('wishlists')
      .insert({
        recipient_id: form.recipient_id,
        title: form.title.trim(),
        occasion: form.occasion || null,
        event_date: form.event_date || null,
        is_public: false,
      })
      .select('id')
      .single()

    if (insertError || !wishlist) {
      setError(insertError?.message ?? 'Failed to create wishlist')
      setLoading(false)
      return
    }

    router.push(`/wishlists/${wishlist.id}`)
    router.refresh()
  }

  const backHref = prefillRecipient ? `/recipients/${prefillRecipient}` : '/wishlists'

  return (
    <div className="max-w-lg">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft size={15} /> Back
      </Link>

      <h1 className="text-2xl font-bold mb-1">New Wishlist</h1>
      <p className="text-sm text-gray-500 mb-8">Create a gift list for an occasion</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Recipient */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="recipient">
            For <span className="text-red-500">*</span>
          </label>
          <select
            id="recipient" required
            value={form.recipient_id}
            onChange={e => set('recipient_id', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a person…</option>
            {recipients.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          {recipients.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">
              No recipients yet. 
              <Link href="/recipients/new" className="text-brand-500 hover:underline">Add one first →</Link>
            </p>
          )}
        </div>

        {/* Occasion */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="occasion">Occasion</label>
          <select
            id="occasion"
            value={form.occasion}
            onChange={e => set('occasion', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select…</option>
            {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title" required
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Maria's Birthday 2026"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Event Date */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="event_date">Event Date</label>
          <input
            id="event_date" type="date"
            value={form.event_date}
            onChange={e => set('event_date', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.title.trim() || !form.recipient_id}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Wishlist'}
          </button>
        </div>
      </form>
    </div>
  )
}

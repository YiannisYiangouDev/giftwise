'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const RELATIONSHIPS = ['Partner', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Colleague', 'Other']

export default function NewRecipientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    birthday: '',
    budget_min: '',
    budget_max: '',
    notes: '',
  })

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

    const { error: insertError } = await supabase.from('recipients').insert({
      user_id: user.id,
      name: form.name.trim(),
      relationship: form.relationship || null,
      birthday: form.birthday || null,
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      notes: form.notes.trim() || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/recipients')
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <Link href="/recipients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6">
        <ArrowLeft size={15} /> Back to Recipients
      </Link>

      <h1 className="text-2xl font-bold mb-1">Add a Person</h1>
      <p className="text-sm text-gray-500 mb-8">Someone you want to track gifts for</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name <span className="text-red-500">*</span></label>
          <input
            id="name" required
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Maria"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="relationship">Relationship</label>
          <select
            id="relationship"
            value={form.relationship} onChange={e => set('relationship', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select…</option>
            {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Birthday */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="birthday">Birthday</label>
          <input
            id="birthday" type="date"
            value={form.birthday} onChange={e => set('birthday', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-1">Budget (€)</label>
          <div className="flex gap-3">
            <input
              type="number" min="0" placeholder="Min"
              value={form.budget_min} onChange={e => set('budget_min', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="number" min="0" placeholder="Max"
              value={form.budget_max} onChange={e => set('budget_max', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="notes">Notes</label>
          <textarea
            id="notes" rows={3}
            value={form.notes} onChange={e => set('notes', e.target.value)}
            placeholder="Interests, sizes, things they already have…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/recipients')}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit" disabled={loading || !form.name.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save Person'}
          </button>
        </div>
      </form>
    </div>
  )
}

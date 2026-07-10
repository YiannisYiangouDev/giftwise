'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditRecipientPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    birthday: '',
    budget_min: '0',
    budget_max: '100',
    notes: '',
  })

  useEffect(() => {
    supabase.from('recipients').select('*').eq('id', id).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name ?? '',
            relationship: data.relationship ?? '',
            birthday: data.birthday ?? '',
            budget_min: String(data.budget_min ?? 0),
            budget_max: String(data.budget_max ?? 100),
            notes: data.notes ?? '',
          })
        }
        setFetching(false)
      })
  }, [id])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: updateError } = await supabase.from('recipients').update({
      name: form.name.trim(),
      relationship: form.relationship.trim() || null,
      birthday: form.birthday || null,
      budget_min: parseInt(form.budget_min) || 0,
      budget_max: parseInt(form.budget_max) || 100,
      notes: form.notes.trim() || null,
    }).eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push(`/recipients/${id}`)
    router.refresh()
  }

  if (fetching) return <div className="text-gray-400 text-sm p-6">Loading…</div>

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/recipients/${id}`} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Recipient</h1>
          <p className="text-sm text-gray-500">Update details for this person</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
          <select
            value={form.relationship}
            onChange={e => set('relationship', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select relationship</option>
            {['Partner', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Other'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birthday</label>
          <input
            type="date"
            value={form.birthday}
            onChange={e => set('birthday', e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Budget (€)</label>
            <input
              type="number" min="0"
              value={form.budget_min}
              onChange={e => set('budget_min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Budget (€)</label>
            <input
              type="number" min="0"
              value={form.budget_max}
              onChange={e => set('budget_max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href={`/recipients/${id}`}
            className="flex-1 text-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

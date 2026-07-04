'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const RELATIONSHIPS = ['Partner', 'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Colleague', 'Other']

export default function EditRecipientPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    birthday: '',
    budget_min: '',
    budget_max: '',
    notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('recipients')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setForm({
          name: data.name ?? '',
          relationship: data.relationship ?? '',
          birthday: data.birthday ?? '',
          budget_min: data.budget_min != null ? String(data.budget_min) : '',
          budget_max: data.budget_max != null ? String(data.budget_max) : '',
          notes: (data.notes as string) ?? '',
        })
      }
      setFetching(false)
    }
    load()
  }, [id])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('recipients')
      .update({
        name: form.name.trim(),
        relationship: form.relationship || null,
        birthday: form.birthday || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        notes: form.notes.trim() || null,
      })
      .eq('id', id)
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    router.push(`/recipients/${id}`)
    router.refresh()
  }

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('recipients').delete().eq('id', id)
    router.push('/recipients')
    router.refresh()
  }

  if (fetching) {
    return (
      <div className="max-w-lg space-y-4 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <Link
        href={`/recipients/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft size={15} /> Back to Profile
      </Link>

      <h1 className="text-2xl font-bold mb-1">Edit Person</h1>
      <p className="text-sm text-gray-500 mb-8">Update details for {form.name}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name" required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="relationship">Relationship</label>
          <select
            id="relationship"
            value={form.relationship}
            onChange={e => set('relationship', e.target.value)}
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
            value={form.birthday}
            onChange={e => set('birthday', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium mb-1">Budget (€)</label>
          <div className="flex gap-3">
            <input
              type="number" min="0" placeholder="Min"
              value={form.budget_min}
              onChange={e => set('budget_min', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="number" min="0" placeholder="Max"
              value={form.budget_max}
              onChange={e => set('budget_max', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="notes">Notes</label>
          <textarea
            id="notes" rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
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
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.name.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Delete zone */}
      <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition"
          >
            <Trash2 size={15} /> Delete this person
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Delete {form.name}? This will also remove all their wishlists.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

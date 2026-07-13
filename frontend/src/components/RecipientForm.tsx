'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { sanitize, sanitizeOptional } from '@/lib/sanitize'
import { useToast } from '@/components/Toast'

interface RecipientFormProps {
  initial?: {
    name: string
    relationship: string
    birthday: string
    notes: string
    budget_min: number
    budget_max: number
  } | null
  recipientId?: string
}

export default function RecipientForm({ initial, recipientId }: RecipientFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [relationship, setRelationship] = useState(initial?.relationship ?? '')
  const [birthday, setBirthday] = useState(initial?.birthday ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [budgetMin, setBudgetMin] = useState(initial?.budget_min ?? 0)
  const [budgetMax, setBudgetMax] = useState(initial?.budget_max ?? 100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be signed in.')
      setLoading(false)
      return
    }

    const data = {
      user_id: user.id,
      name: sanitize(name),
      relationship: sanitizeOptional(relationship),
      birthday: birthday || null,
      notes: sanitizeOptional(notes),
      budget_min: budgetMin,
      budget_max: budgetMax,
    }

    let result
    if (recipientId) {
      const { user_id, ...updateData } = data
      result = await supabase.from('recipients').update(updateData as any).eq('id', recipientId)
    } else {
      result = await supabase.from('recipients').insert(data as any)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      toast(recipientId ? 'Recipient updated!' : 'Recipient added!')
      router.push('/recipients')
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
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text" value={name} onChange={e => setName(e.target.value)} required
          placeholder="e.g. Maria"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
        <select
          value={relationship} onChange={e => setRelationship(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          <option value="">Select…</option>
          <option value="Partner">Partner</option>
          <option value="Child">Child</option>
          <option value="Parent">Parent</option>
          <option value="Sibling">Sibling</option>
          <option value="Friend">Friend</option>
          <option value="Colleague">Colleague</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Birthday</label>
        <input
          type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (min €)</label>
          <input
            type="number" min="0" value={budgetMin} onChange={e => setBudgetMin(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget (max €)</label>
          <input
            type="number" min="0" value={budgetMax} onChange={e => setBudgetMax(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Sizes, preferences, ideas…"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium disabled:opacity-50">
          {loading ? 'Saving…' : recipientId ? 'Update' : 'Add Person'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          Cancel
        </button>
      </div>
    </form>
  )
}
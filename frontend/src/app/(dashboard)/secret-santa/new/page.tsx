'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewSecretSantaPage() {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.from('secret_santa_groups').insert({
      name,
      budget: budget ? parseFloat(budget) : null,
      event_date: eventDate || null,
    } as any).select('id').single()
    if (!error && data) {
      router.push(`/secret-santa/${data.id}`)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">New Secret Santa</h1>
        <p className="text-gray-500 text-sm">Create a gift exchange group</p>
      </div>
      <form onSubmit={handleCreate} className="space-y-4 bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
        <div>
          <label className="block text-sm font-medium mb-1">Group Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder="e.g. Christmas 2026 Family" className="w-full px-4 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Budget (€)</label>
          <input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Optional spending limit" className="w-full px-4 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Event Date</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="w-full px-4 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 text-sm font-medium disabled:opacity-40">
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Gift } from 'lucide-react'

export default function NewSecretSantaPage() {
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast('You must be logged in to create a group.', 'error')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from('secret_santa_groups').insert({
      creator_id: user.id,
      name,
      budget: budget ? Math.min(999999.99, Math.max(0, parseFloat(parseFloat(budget).toFixed(2)))) : null,
      event_date: eventDate || null,
    }).select('id').single()

    if (error) {
      console.error('Error creating Secret Santa group:', error)
      toast(error.message || 'Failed to create Secret Santa group.', 'error')
      setLoading(false)
      return
    }

    if (data) {
      const { error: partError } = await supabase.from('secret_santa_participants').insert({
        group_id: data.id,
        user_id: user.id,
      })

      if (partError) {
        console.error('Error adding participant:', partError)
        toast(partError.message || 'Failed to add creator as participant.', 'error')
      } else {
        toast('Secret Santa group created successfully!')
        router.push(`/secret-santa/${data.id}`)
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8 page-enter max-w-lg">
      <div>
        <h1 className="text-3xl font-normal tracking-wide">New Secret Santa</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create a gift exchange group</p>
      </div>

      <form onSubmit={handleCreate} className="glass p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100/60 dark:border-gray-800/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-500/10 flex items-center justify-center">
            <Gift size={18} className="text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Group Details</p>
            <p className="text-[11px] text-gray-400">Fill in the basics to get started</p>
          </div>
        </div>

        <div>
          <label className="label">Group Name <span className="text-red-500">*</span></label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder="e.g. Christmas 2026 Family"
            className="input" />
        </div>

        <div>
          <label className="label">Budget (€)</label>
          <input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Optional spending limit"
            className="input" />
        </div>

        <div>
          <label className="label">Event Date</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
            className="input" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating...' : 'Create Group'}
        </button>
      </form>
    </div>
  )
}

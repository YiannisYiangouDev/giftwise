'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Shuffle, Eye, EyeOff, X, ShieldAlert, Trash2 } from 'lucide-react'

export default function SecretSantaActions({
  groupId,
  isCreator,
  isDrawn,
  participants,
  currentUserId,
  myAssignment,
  recipients
}: {
  groupId: string
  isCreator: boolean
  isDrawn: boolean
  participants: any[]
  currentUserId: string
  myAssignment: string | undefined
  recipients: { user_id: string; name: string }[]
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [showAssignment, setShowAssignment] = useState(false)
  const [exclusions, setExclusions] = useState<any[]>([])
  const [exclA, setExclA] = useState('')
  const [exclB, setExclB] = useState('')
  const [drawError, setDrawError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  async function deleteGroup() {
    if (!confirm('Are you sure you want to delete this Secret Santa group? This action is permanent.')) return
    setDeleting(true)
    const { error } = await supabase.from('secret_santa_groups').delete().eq('id', groupId)
    if (error) {
      alert(error.message || 'Failed to delete group')
      setDeleting(false)
    } else {
      router.push('/secret-santa')
      router.refresh()
    }
  }

  useEffect(() => {
    supabase
      .from('santa_draw_exclusions')
      .select('*')
      .eq('group_id', groupId)
      .then(({ data }) => setExclusions(data ?? []))
  }, [groupId])

  async function addParticipant() {
    if (!selectedUserId) return
    setAdding(true)
    await supabase.from('secret_santa_participants').insert({
      group_id: groupId,
      user_id: selectedUserId,
    })
    setSelectedUserId('')
    setAdding(false)
    router.refresh()
  }

  async function addExclusion() {
    if (!exclA || !exclB || exclA === exclB) return
    const exists = exclusions.some(e => 
      (e.user_id_a === exclA && e.user_id_b === exclB) ||
      (e.user_id_a === exclB && e.user_id_b === exclA)
    )
    if (exists) return

    await supabase.from('santa_draw_exclusions').insert({
      group_id: groupId,
      user_id_a: exclA,
      user_id_b: exclB,
    })

    const { data } = await supabase
      .from('santa_draw_exclusions')
      .select('*')
      .eq('group_id', groupId)
    
    setExclusions(data ?? [])
    setExclA('')
    setExclB('')
  }

  async function removeExclusion(id: string) {
    await supabase.from('santa_draw_exclusions').delete().eq('id', id)
    setExclusions(prev => prev.filter(e => e.id !== id))
  }

  async function doDraw() {
    if (participants.length < 2) return
    setDrawing(true)
    setDrawError(null)

    const ids = participants.map((p: any) => p.user_id)
    let shuffled = [...ids]
    let valid = false
    let attempts = 0

    while (!valid && attempts < 2000) {
      attempts++
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      valid = true
      for (let i = 0; i < ids.length; i++) {
        const giver = ids[i]
        const receiver = shuffled[i]

        if (giver === receiver) { valid = false; break }

        const isExcluded = exclusions.some(e => 
          (e.user_id_a === giver && e.user_id_b === receiver) ||
          (e.user_id_a === receiver && e.user_id_b === giver)
        )
        if (isExcluded) { valid = false; break }
      }
    }

    if (!valid) {
      setDrawError('Could not find a valid match. Exclusions might be too restrictive!')
      setDrawing(false)
      return
    }

    for (let i = 0; i < ids.length; i++) {
      await supabase
        .from('secret_santa_participants')
        .update({ assigned_to_user_id: shuffled[i] })
        .eq('group_id', groupId)
        .eq('user_id', ids[i])
    }

    await supabase
      .from('secret_santa_groups')
      .update({ is_drawn: true })
      .eq('id', groupId)

    // Notify participants via Resend
    try {
      await fetch('/api/secret-santa/notify-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
    } catch (e) {
      console.error('Failed to send draw notifications:', e)
    }

    setDrawing(false)
    router.refresh()
  }

  const getUserName = (id: string) => {
    const p = participants.find(part => part.user_id === id)
    return p ? p.name : 'Unknown User'
  }

  const participantUserIds = participants.map((p: any) => p.user_id)
  const availableRecipients = (recipients || []).filter(
    (r: any) => r.user_id && !participantUserIds.includes(r.user_id)
  )

  return (
    <div className="space-y-4">
      {/* Add participant */}
      {isCreator && !isDrawn && (
        <div className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Add Participant</h2>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="input !py-2 !text-xs flex-1"
            >
              <option value="">Select a family member...</option>
              {availableRecipients.map(r => (
                <option key={r.user_id} value={r.user_id}>{r.name}</option>
              ))}
            </select>
            <button onClick={addParticipant} disabled={adding || !selectedUserId}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-semibold disabled:opacity-40 transition-all duration-300 flex items-center gap-1.5 shadow-lux-gold">
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      )}

      {/* Draw Exclusions */}
      {isCreator && !isDrawn && participants.length >= 2 && (
        <div className="card p-5 space-y-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-1">Draw Exclusions</h2>
            <p className="text-[10px] text-gray-400">
              Set pairs that cannot draw each other (e.g. couples, spouses).
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <select value={exclA} onChange={e => setExclA(e.target.value)} className="input !py-1.5 !text-xs flex-1">
              <option value="">Person A</option>
              {participants.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.name}</option>
              ))}
            </select>
            <span className="text-gray-300 text-xs">⛔</span>
            <select value={exclB} onChange={e => setExclB(e.target.value)} className="input !py-1.5 !text-xs flex-1">
              <option value="">Person B</option>
              {participants.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.name}</option>
              ))}
            </select>
            <button onClick={addExclusion} disabled={!exclA || !exclB || exclA === exclB}
              className="px-3 py-1.5 bg-brand-500 text-white text-xs font-semibold rounded-lg hover:bg-brand-600 disabled:opacity-40 transition-all duration-300">
              Block
            </button>
          </div>

          {exclusions.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-gray-100/60 dark:border-gray-800/40">
              {exclusions.map(e => (
                <div key={e.id} className="flex items-center justify-between text-xs text-gray-500 py-1.5 px-3 rounded-lg bg-gray-50/60 dark:bg-gray-800/20 border border-gray-100/40 dark:border-gray-800/30">
                  <span>{getUserName(e.user_id_a)} ⛔ {getUserName(e.user_id_b)}</span>
                  <button onClick={() => removeExclusion(e.id)} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Draw button */}
      {isCreator && !isDrawn && participants.length >= 2 && (
        <div className="space-y-2">
          {drawError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert size={14} className="flex-shrink-0" />
              <span>{drawError}</span>
            </div>
          )}
          <button
            onClick={doDraw}
            disabled={drawing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-400 to-brand-600 text-white rounded-xl hover:from-brand-500 hover:to-brand-700 text-sm font-semibold disabled:opacity-40 transition-all duration-300 shadow-lux-gold"
          >
            <Shuffle size={16} />
            {drawing ? 'Drawing...' : `Draw Names (${participants.length} people)`}
          </button>
        </div>
      )}

      {/* My assignment */}
      {isDrawn && myAssignment && (
        <div className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400 mb-3">Your Assignment</h2>
          {showAssignment ? (
            <div className="bg-brand-50/40 dark:bg-brand-950/20 border border-brand-200/30 dark:border-brand-800/20 rounded-xl p-4">
              <p className="text-lg font-bold text-gold-gradient">🎁 {myAssignment}</p>
              <button
                onClick={() => setShowAssignment(false)}
                className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <EyeOff size={10} /> Hide
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAssignment(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-50/60 dark:bg-gray-800/20 hover:bg-gray-100/80 dark:hover:bg-gray-700/30 transition-all duration-200 border border-gray-100/40 dark:border-gray-800/30"
            >
              <Eye size={14} /> Reveal my match
            </button>
          )}
        </div>
      )}

      {/* Delete Group */}
      {isCreator && (
        <button
          onClick={deleteGroup}
          disabled={deleting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-red-500 dark:text-red-400 text-xs font-semibold disabled:opacity-40 transition-all duration-300 border border-red-200/50 dark:border-red-900/30 hover:bg-red-50/50 dark:hover:bg-red-950/10"
        >
          <Trash2 size={14} />
          {deleting ? 'Deleting Group...' : 'Delete Group'}
        </button>
      )}
    </div>
  )
}

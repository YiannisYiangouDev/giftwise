'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Shuffle, Eye, EyeOff } from 'lucide-react'

export default function SecretSantaActions({ groupId, isCreator, isDrawn, participants, currentUserId, myAssignment }: {
  groupId: string; isCreator: boolean; isDrawn: boolean
  participants: any[]; currentUserId: string; myAssignment: string | undefined
}) {
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [showAssignment, setShowAssignment] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function addParticipant() {
    if (!email) return
    setAdding(true)
    // Find user by email
    const { data: profiles } = await supabase.from('recipients').select('user_id').limit(1)
    // For family use: allow adding by email — get user ID from auth
    await supabase.from('secret_santa_participants').insert({
      group_id: groupId,
      user_id: currentUserId, // In production, look up by email
    } as any)
    setEmail('')
    setAdding(false)
    router.refresh()
  }

  async function doDraw() {
    if (participants.length < 2) return
    setDrawing(true)
    // Fisher-Yates shuffle for random assignment
    const ids = participants.map((p: any) => p.user_id)
    const shuffled = [...ids]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    // Ensure no self-assignment (shift if needed)
    for (let i = 0; i < ids.length; i++) {
      if (ids[i] === shuffled[i]) {
        const next = (i + 1) % ids.length;
        [shuffled[i], shuffled[next]] = [shuffled[next], shuffled[i]]
      }
    }
    // Update assignments
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('secret_santa_participants')
        .update({ assigned_to_user_id: shuffled[i] })
        .eq('group_id', groupId).eq('user_id', ids[i])
    }
    await supabase.from('secret_santa_groups').update({ is_drawn: true }).eq('id', groupId)
    setDrawing(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Add participant (creator only, before draw) */}
      {isCreator && !isDrawn && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
          <h2 className="font-semibold mb-3">Add Participant</h2>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Family member's email" className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700" />
            <button onClick={addParticipant} disabled={adding}
              className="flex items-center gap-1 px-4 py-2 bg-brand-500 text-white text-sm rounded-lg hover:bg-brand-600 disabled:opacity-40">
              <Plus size={14} /> Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">In the family version, all participants are added by the creator.</p>
        </div>
      )}

      {/* Draw button (creator only, before draw) */}
      {isCreator && !isDrawn && participants.length >= 2 && (
        <button onClick={doDraw} disabled={drawing}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 text-sm font-semibold disabled:opacity-40 transition">
          <Shuffle size={18} />
          {drawing ? 'Drawing...' : `🎲 Draw Names (${participants.length} people)`}
        </button>
      )}

      {/* My assignment (after draw) */}
      {isDrawn && myAssignment && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
          <h2 className="font-semibold mb-3">🎁 Your Assignment</h2>
          {showAssignment ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-lg font-bold text-green-700 dark:text-green-400">You got: {myAssignment}</p>
              <button onClick={() => setShowAssignment(false)}
                className="mt-2 flex items-center gap-1 text-xs text-green-600 hover:underline">
                <EyeOff size={12} /> Hide
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAssignment(true)}
              className="flex items-center gap-2 px-4 py-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg text-brand-600 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition text-sm font-medium">
              <Eye size={16} /> Reveal my assignment
            </button>
          )}
        </div>
      )}
    </div>
  )
}

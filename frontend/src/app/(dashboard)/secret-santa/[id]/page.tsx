import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Users, Calendar } from 'lucide-react'
import SecretSantaActions from './SecretSantaActions'
import SecretSantaChat from '@/components/SecretSantaChat'
import SantaQA from '@/components/SantaQA'

function daysUntilEvent(date: string): number | null {
  if (!date) return null
  const today = new Date()
  const event = new Date(date)
  if (event < today) return null
  return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function SecretSantaGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: group } = await supabase.from('secret_santa_groups').select('*').eq('id', id).single()
  if (!group) notFound()

  const { data: recipients } = await supabase.from('recipients').select('user_id, name')

  const { data: participants } = await supabase
    .from('secret_santa_participants')
    .select('*')
    .eq('group_id', id)
    .order('created_at')

  const isCreator = group.creator_id === user!.id
  const myParticipantRow = participants?.find(p => p.user_id === user!.id)
  const myAssignment = myParticipantRow?.assigned_to_user_id
  const assignedRecipient = myAssignment ? recipients?.find(r => r.user_id === myAssignment) : null
  const days = daysUntilEvent(group.event_date ?? '')

  const participantsWithNames = participants?.map(p => {
    const isMe = p.user_id === user!.id
    const rec = recipients?.find(r => r.user_id === p.user_id)
    return {
      ...p,
      name: isMe ? 'You' : (rec?.name || `User ${p.user_id.split('-')[0]}`)
    }
  }) ?? []

  return (
    <div className="space-y-8 page-enter">
      {/* Hero Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-wide">{group.name}</h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-sm text-gray-400">
              {participants?.length ?? 0} participant{(participants?.length ?? 0) !== 1 ? 's' : ''}
            </span>
            {group.budget && <span className="text-sm text-gray-400">· €{group.budget}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {days !== null && (
            <span className="countdown-pill text-xs animate-count-pulse">
              <Calendar size={11} /> {days}d left
            </span>
          )}
          <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${
            group.is_drawn
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20'
              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20'
          }`}>
            {group.is_drawn ? '✅ Drawn' : '⏳ Pending'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Participants */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <Users size={16} className="text-brand-500" /> Participants
            </h2>
            <div className="space-y-1">
              {participantsWithNames.map(p => {
                const isMe = p.user_id === user!.id
                return (
                  <div key={p.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isMe ? 'bg-brand-50/40 dark:bg-brand-950/15' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className="avatar-sm avatar-gold text-[10px]">
                        {isMe ? '✨' : p.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                    </div>
                    {group.is_drawn && isMe && p.assigned_to_user_id && (
                      <span className="badge-gold">🎁 Assigned</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Anonymous Q&A */}
          {group.is_drawn && (
            <SantaQA
              groupId={group.id}
              userId={user!.id}
              assignedToUserId={myAssignment ?? null}
              assignedName={assignedRecipient?.name || 'Your Match'}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SecretSantaActions
            groupId={group.id}
            isCreator={isCreator}
            isDrawn={group.is_drawn}
            participants={participantsWithNames}
            currentUserId={user!.id}
            myAssignment={assignedRecipient?.name}
            recipients={recipients || []}
          />

          <SecretSantaChat groupId={group.id} userId={user!.id} />
        </div>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gift, Users, Shuffle, Eye, EyeOff } from 'lucide-react'
import SecretSantaActions from './SecretSantaActions'

export default async function SecretSantaGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: group } = await supabase.from('secret_santa_groups').select('*').eq('id', id).single()
  if (!group) notFound()

  const { data: participants } = await supabase
    .from('secret_santa_participants')
    .select('*')
    .eq('group_id', id)
    .order('created_at')

  const isCreator = group.creator_id === user!.id
  const myAssignment = participants?.find(p => p.user_id === user!.id)?.assigned_to_user_id

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-500 text-sm">
            {participants?.length ?? 0} participant{(participants?.length ?? 0) !== 1 ? 's' : ''}
            {group.budget && ` · Budget: €${group.budget}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          group.is_drawn ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {group.is_drawn ? '✅ Drawn' : '⏳ Pending'}
        </span>
      </div>

      {/* Participants */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Users size={18} /> Participants</h2>
        <div className="space-y-2">
          {participants?.map(p => {
            const isMe = p.user_id === user!.id
            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${isMe ? 'bg-brand-50 dark:bg-brand-900/20' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                    {isMe ? 'You' : '👤'}
                  </div>
                  <span className="text-sm">{isMe ? 'You' : 'Participant'}</span>
                </div>
                {group.is_drawn && isMe && p.assigned_to_user_id && (
                  <span className="text-xs text-brand-500 font-medium">🎁 You have an assignment!</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <SecretSantaActions
        groupId={group.id}
        isCreator={isCreator}
        isDrawn={group.is_drawn}
        participants={participants ?? []}
        currentUserId={user!.id}
        myAssignment={myAssignment}
      />
    </div>
  )
}

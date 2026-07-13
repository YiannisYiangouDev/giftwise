import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Gift, Plus, Users } from 'lucide-react'

export default async function SecretSantaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: groups } = await supabase
    .from('secret_santa_groups')
    .select('*, secret_santa_participants(count)')
    .or(`creator_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎅 Secret Santa</h1>
          <p className="text-gray-500 text-sm">Organize gift exchanges with family</p>
        </div>
        <Link href="/secret-santa/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium">
          <Plus size={16} /> New Group
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {groups?.map(g => (
          <Link key={g.id} href={`/secret-santa/${g.id}`}
            className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={18} className="text-brand-500" />
              <p className="font-semibold">{g.name}</p>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1"><Users size={12} /> {g.secret_santa_participants?.[0]?.count ?? 0} participants</p>
              {g.budget && <p>💰 Budget: €{g.budget}</p>}
              {g.event_date && <p>📅 {g.event_date}</p>}
              <p>{g.is_drawn ? '✅ Drawn' : '⏳ Not drawn yet'}</p>
            </div>
          </Link>
        ))}
        {(!groups || groups.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Gift size={48} className="mx-auto mb-3 opacity-30" />
            <p>No Secret Santa groups yet. Create one!</p>
          </div>
        )}
      </div>
    </div>
  )
}

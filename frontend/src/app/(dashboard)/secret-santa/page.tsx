import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Gift, Plus, Users, ArrowRight } from 'lucide-react'
import EmptyState from '@/components/EmptyState'

function daysUntilEvent(date: string): number | null {
  if (!date) return null
  const today = new Date()
  const event = new Date(date)
  if (event < today) return null
  return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function SecretSantaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: groups } = await supabase
    .from('secret_santa_groups')
    .select('*, secret_santa_participants(count)')
    .or(`creator_id.eq.${user!.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-wide">Secret Santa</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Organize gift exchanges with family & friends</p>
        </div>
        <Link href="/secret-santa/new" className="btn-primary !py-2.5 !px-5 !text-xs">
          <Plus size={14} /> New Group
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 stagger-children">
        {groups?.map((g, i) => {
          const days = daysUntilEvent(g.event_date ?? '')
          return (
            <Link key={g.id} href={`/secret-santa/${g.id}`}
              className="card-hover p-5 group border-brand-100/30 dark:border-brand-900/20"
              style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400/20 to-brand-500/10 flex items-center justify-center">
                    <Gift size={18} className="text-brand-500" />
                  </div>
                  <p className="font-semibold text-[15px] text-gray-800 dark:text-gray-200">{g.name}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 dark:text-gray-700 group-hover:text-brand-500 transition-colors" />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Users size={11} /> {g.secret_santa_participants?.[0]?.count ?? 0} participants
                </span>
                {g.budget && <span className="text-[11px] text-gray-400">€{g.budget}</span>}
                {days !== null && (
                  <span className="countdown-pill">📅 {days}d</span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  g.is_drawn
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                }`}>
                  {g.is_drawn ? '✅ Drawn' : '⏳ Pending'}
                </span>
              </div>
            </Link>
          )
        })}

        {(!groups || groups.length === 0) && (
          <div className="col-span-full">
            <EmptyState type="secret-santa" />
          </div>
        )}
      </div>
    </div>
  )
}

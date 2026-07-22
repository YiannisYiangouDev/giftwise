import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import type { RecipientRow } from '@/types/rows'
import EmptyState from '@/components/EmptyState'

function daysUntilBirthday(birthday: string): number | null {
  if (!birthday) return null
  const today = new Date()
  const [y, m, d] = birthday.split('-').map(Number)
  if (!m || !d) return null
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function RecipientsPage() {
  const supabase = await createClient()
  const { data: recipients } = await supabase
    .from('recipients')
    .select('*')
    .order('name')
    .returns<RecipientRow[]>()

  return (
    <div className="space-y-8 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal tracking-wide">Recipients</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">People you buy gifts for</p>
        </div>
        <Link href="/recipients/new" className="btn-primary !py-2.5 !px-5 !text-xs">
          <Plus size={14} /> Add Person
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        {recipients?.map((r, i) => {
          const days = daysUntilBirthday(r.birthday ?? '')
          return (
            <Link key={r.id} href={`/recipients/${r.id}`}
              className="card-hover p-5 group"
              style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="avatar-md avatar-gold text-sm">{r.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-gray-800 dark:text-gray-200 truncate">{r.name}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">{r.relationship ?? 'No relationship'}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 dark:text-gray-700 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {r.birthday && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    🎂 {r.birthday}
                  </span>
                )}
                {days !== null && days <= 30 && (
                  <span className="countdown-pill">in {days}d</span>
                )}
                {(r.budget_min || r.budget_max) && (
                  <span className="text-[11px] text-gray-400">€{r.budget_min}–€{r.budget_max}</span>
                )}
              </div>
            </Link>
          )
        })}

        {(!recipients || recipients.length === 0) && (
          <div className="col-span-full">
            <EmptyState type="recipients" />
          </div>
        )}
      </div>
    </div>
  )
}

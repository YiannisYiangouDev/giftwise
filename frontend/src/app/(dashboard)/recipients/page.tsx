import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, User } from 'lucide-react'
import type { RecipientRow } from '@/types/rows'

export default async function RecipientsPage() {
  const supabase = await createClient()
  const { data: recipients } = await supabase
    .from('recipients')
    .select('*')
    .order('name')
    .returns<RecipientRow[]>()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipients</h1>
          <p className="text-gray-500 text-sm">People you buy gifts for</p>
        </div>
        <Link href="/recipients/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium">
          <Plus size={16} /> Add Person
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipients?.map(r => (
          <Link key={r.id} href={`/recipients/${r.id}`}
            className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center">
                <User size={20} className="text-brand-500" />
              </div>
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-gray-500">{r.relationship ?? 'Friend'}</p>
              </div>
            </div>
            {r.birthday && (
              <p className="text-xs text-gray-400">🎂 {r.birthday}</p>
            )}
            {(r.budget_min || r.budget_max) && (
              <p className="text-xs text-gray-400 mt-1">💰 Budget: €{r.budget_min}–€{r.budget_max}</p>
            )}
          </Link>
        ))}

        {(!recipients || recipients.length === 0) && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <User size={48} className="mx-auto mb-3 opacity-30" />
            <p>No recipients yet. Add your first person!</p>
          </div>
        )}
      </div>
    </div>
  )
}

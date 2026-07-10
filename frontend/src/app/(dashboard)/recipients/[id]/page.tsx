import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Gift, Calendar, Banknote } from 'lucide-react'
import DeleteRecipientButton from './DeleteRecipientButton'

export default async function RecipientProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: recipient } = await supabase
    .from('recipients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!recipient) notFound()

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date')
    .eq('recipient_id', params.id)
    .order('event_date', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/recipients" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{recipient.name}</h1>
          <p className="text-sm text-gray-500">{recipient.relationship ?? 'Friend'}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/recipients/${params.id}/edit`}
            className="px-4 py-2 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Edit
          </Link>
          <DeleteRecipientButton id={params.id} />
        </div>
      </div>

      {/* Details card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 grid sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <Calendar size={18} className="text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Birthday</p>
            <p className="text-sm font-medium">{recipient.birthday ?? '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Banknote size={18} className="text-gray-400 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Budget</p>
            <p className="text-sm font-medium">€{recipient.budget_min ?? 0}–€{recipient.budget_max ?? 100}</p>
          </div>
        </div>
        {recipient.notes && (
          <div className="sm:col-span-3">
            <p className="text-xs text-gray-500 mb-0.5">Notes</p>
            <p className="text-sm">{recipient.notes}</p>
          </div>
        )}
      </div>

      {/* Wishlists */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Wishlists</h2>
          <Link
            href={`/wishlists/new?recipient=${params.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition">
            <Gift size={14} /> New Wishlist
          </Link>
        </div>
        {wishlists && wishlists.length > 0 ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {wishlists.map(w => (
              <li key={w.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{w.title}</p>
                  <p className="text-xs text-gray-500">{w.occasion}{w.event_date ? ` · ${w.event_date}` : ''}</p>
                </div>
                <Link href={`/wishlists/${w.id}`} className="text-sm text-brand-500 hover:text-brand-600 font-medium">View →</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No wishlists yet for {recipient.name}.</p>
        )}
      </div>
    </div>
  )
}

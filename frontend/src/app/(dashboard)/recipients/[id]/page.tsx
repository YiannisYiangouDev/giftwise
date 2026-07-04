import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Gift, Pencil, User } from 'lucide-react'
import { format, differenceInDays, parseISO } from 'date-fns'
import type { PageProps } from '@/types/next'

export default async function RecipientProfilePage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  const supabase = await createClient()

  const { data: recipient } = await supabase
    .from('recipients')
    .select('*')
    .eq('id', id)
    .single()

  if (!recipient) notFound()

  const { data: wishlists } = await supabase
    .from('wishlists')
    .select('id, title, occasion, event_date, created_at')
    .eq('recipient_id', id)
    .order('event_date', { ascending: true })

  const daysUntilBirthday = recipient.birthday
    ? (() => {
        const today = new Date()
        const bday = parseISO(recipient.birthday as string)
        const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
        if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1)
        return differenceInDays(nextBday, today)
      })()
    : null

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link href="/recipients" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <ArrowLeft size={15} /> All Recipients
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center shrink-0">
            <User size={32} className="text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{recipient.name}</h1>
            <p className="text-sm text-gray-500">{recipient.relationship ?? 'Friend'}</p>
            {recipient.birthday && (
              <p className="text-xs text-gray-400 mt-1">
                🎂 {format(parseISO(recipient.birthday as string), 'MMM d')}
                {daysUntilBirthday !== null && (
                  <span className="ml-2 text-brand-500 font-medium">
                    {daysUntilBirthday === 0 ? '🎉 Today!' : `in ${daysUntilBirthday} days`}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/recipients/${id}/edit`}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Pencil size={14} /> Edit
        </Link>
      </div>

      {/* Budget */}
      {(recipient.budget_min || recipient.budget_max) && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Budget</p>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
            €{recipient.budget_min ?? '?'} – €{recipient.budget_max ?? '?'}
          </p>
        </div>
      )}

      {/* Notes */}
      {recipient.notes && (
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-5 border border-amber-100 dark:border-amber-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{recipient.notes as string}</p>
        </div>
      )}

      {/* Wishlists */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Wishlists</h2>
          <Link
            href={`/wishlists/new?recipient=${id}`}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition"
          >
            <Gift size={14} /> New Wishlist
          </Link>
        </div>

        {wishlists && wishlists.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {wishlists.map(w => (
              <Link
                key={w.id}
                href={`/wishlists/${w.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:shadow-md transition"
              >
                <p className="font-semibold">{w.title}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {w.occasion ? `${w.occasion} · ` : ''}
                  {w.event_date ? format(parseISO(w.event_date as string), 'MMM d, yyyy') : 'No date set'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Gift size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No wishlists yet.</p>
            <Link href={`/wishlists/new?recipient=${id}`} className="text-brand-500 text-sm hover:underline mt-1 inline-block">
              Create the first one →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

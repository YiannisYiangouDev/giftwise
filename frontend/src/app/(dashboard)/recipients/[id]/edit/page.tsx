import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RecipientForm from '@/components/RecipientForm'
import type { RecipientRow } from '@/types/rows'

export default async function EditRecipientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('recipients')
    .select('*')
    .eq('id', id)
    .single()
  const recipient = data as RecipientRow | null
  if (!recipient) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit {recipient.name}</h1>
        <p className="text-gray-500 text-sm">Update recipient details</p>
      </div>
      <RecipientForm
        recipientId={recipient.id}
        initial={{
          name: recipient.name,
          relationship: recipient.relationship ?? '',
          birthday: recipient.birthday ?? '',
          notes: recipient.notes ?? '',
          budget_min: recipient.budget_min,
          budget_max: recipient.budget_max,
        }}
      />
    </div>
  )
}
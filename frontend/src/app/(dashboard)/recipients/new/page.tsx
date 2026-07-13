import RecipientForm from '@/components/RecipientForm'

export default function NewRecipientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Recipient</h1>
        <p className="text-gray-500 text-sm">Add someone you buy gifts for</p>
      </div>
      <RecipientForm />
    </div>
  )
}
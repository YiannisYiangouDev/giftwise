'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function DeleteRecipientButton({ id }: { id: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await supabase.from('recipients').delete().eq('id', id)
    router.push('/recipients')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button onClick={() => setConfirming(false)}
          className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          Cancel
        </button>
        <button onClick={handleDelete} disabled={loading}
          className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50">
          {loading ? 'Deleting…' : 'Confirm Delete'}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:border-red-300 transition">
      <Trash2 size={16} />
    </button>
  )
}

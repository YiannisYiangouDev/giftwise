'use client'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from '@/components/Toast'

export default function DeleteItemButton({ itemId, productName }: { itemId: string; productName: string }) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('wishlist_items').delete().eq('id', itemId)
    router.refresh()
    toast('Item deleted')
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)}
        className="text-gray-400 hover:text-red-500 flex-shrink-0 transition"
        title="Delete item">
        <Trash2 size={16} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      <button onClick={handleDelete} disabled={deleting}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-40">
        {deleting ? '...' : 'Delete'}
      </button>
      <button onClick={() => setConfirm(false)}
        className="text-xs text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </div>
  )
}

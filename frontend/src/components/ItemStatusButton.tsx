'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ShoppingCart, CheckCircle, Gift } from 'lucide-react'

export default function ItemStatusButton({ itemId, currentStatus }: {
  itemId: string; currentStatus: string
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function setStatus(status: string) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const updateData: any = { status }
      
      if (status === 'claimed' || status === 'purchased') {
        if (user) {
          updateData.claimed_by = user.id
          updateData.claimed_by_name = user.user_metadata?.full_name || user.email?.split('@')[0]
        }
        updateData.claimed_at = new Date().toISOString()
      } else if (status === 'wanted') {
        updateData.claimed_by = null
        updateData.claimed_by_name = null
        updateData.claimed_at = null
      }

      await supabase.from('wishlist_items').update(updateData).eq('id', itemId)
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'purchased' || currentStatus === 'received') return null

  return (
    <div className="flex gap-1 flex-shrink-0">
      {currentStatus === 'wanted' && (
        <button onClick={() => setStatus('claimed')} disabled={loading}
          className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30 transition disabled:opacity-40"
          title="Mark as claimed — I'm buying this">
          <Gift size={12} className="inline mr-1" />Claim
        </button>
      )}
      {currentStatus === 'claimed' && (
        <button onClick={() => setStatus('purchased')} disabled={loading}
          className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition disabled:opacity-40"
          title="Mark as purchased">
          <CheckCircle size={12} className="inline mr-1" />Purchased
        </button>
      )}
    </div>
  )
}

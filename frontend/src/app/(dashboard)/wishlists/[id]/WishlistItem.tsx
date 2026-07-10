'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Trash2, Target } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  wanted: 'Wanted',
  claimed: 'Claimed',
  purchased: 'Purchased',
  received: 'Received',
}

const STATUS_COLORS: Record<string, string> = {
  wanted: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  claimed: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  purchased: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  received: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WishlistItem({ item }: { item: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)

  const belowTarget = item.current_best_price && item.target_price
    && parseFloat(item.current_best_price) <= parseFloat(item.target_price)

  async function updateStatus(status: string) {
    await supabase.from('wishlist_items').update({ status }).eq('id', item.id)
    router.refresh()
  }

  async function deleteItem() {
    setDeleting(true)
    await supabase.from('wishlist_items').delete().eq('id', item.id)
    router.refresh()
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex gap-4 items-start">
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.product_name}
          className="w-16 h-16 object-cover rounded-lg border border-gray-100 dark:border-gray-800 flex-shrink-0"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm truncate">{item.product_name}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {item.product_url && (
              <a href={item.product_url} target="_blank" rel="noopener noreferrer"
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600">
                <ExternalLink size={14} />
              </a>
            )}
            <button onClick={deleteItem} disabled={deleting}
              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {item.current_best_price && (
            <span className={`text-xs font-medium ${
              belowTarget ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              €{item.current_best_price}
              {belowTarget && ' ✓ Below target'}
            </span>
          )}
          {item.target_price && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <Target size={11} /> €{item.target_price}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <button key={val}
              onClick={() => updateStatus(val)}
              className={`text-xs px-2 py-0.5 rounded-full transition ${
                item.status === val
                  ? STATUS_COLORS[val] + ' font-medium'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

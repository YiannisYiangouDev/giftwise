'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ClaimButton({ itemId }: { itemId: string }) {
  const supabase = createClient()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [name, setName] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleClaim() {
    if (!name.trim()) return
    setClaiming(true)
    await supabase.from('wishlist_items').update({
      status: 'claimed',
      claimed_at: new Date().toISOString(),
    }).eq('id', itemId)
    setClaimed(true)
    setClaiming(false)
  }

  if (claimed) {
    return <span className="text-xs text-green-600 font-medium">✓ Reserved!</span>
  }

  if (showInput) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleClaim()}
          placeholder="Your name"
          className="w-28 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button onClick={handleClaim} disabled={claiming || !name.trim()}
          className="px-3 py-1 bg-brand-500 text-white rounded text-xs font-medium hover:bg-brand-600 transition disabled:opacity-50">
          {claiming ? '…' : 'Confirm'}
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setShowInput(true)}
      className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600 transition">
      I&apos;ll buy this
    </button>
  )
}

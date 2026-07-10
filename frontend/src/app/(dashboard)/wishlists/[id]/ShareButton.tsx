'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Share2, Check, Copy } from 'lucide-react'

export default function ShareButton({
  wishlistId, shareToken, isPublic
}: { wishlistId: string; shareToken: string | null; isPublic: boolean }) {
  const supabase = createClient()
  const [pub, setPub] = useState(isPublic)
  const [copied, setCopied] = useState(false)

  async function togglePublic() {
    const next = !pub
    await supabase.from('wishlists').update({ is_public: next }).eq('id', wishlistId)
    setPub(next)
  }

  async function copyLink() {
    const url = `${window.location.origin}/wishlists/${wishlistId}/share`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePublic}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
          pub
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 text-green-700 dark:text-green-400'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-brand-300'
        }`}>
        {pub ? 'Public' : 'Private'}
      </button>
      {pub && shareToken && (
        <button onClick={copyLink}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand-500 hover:border-brand-300 transition">
          {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
        </button>
      )}
      <Share2 size={18} className="text-gray-400" />
    </div>
  )
}

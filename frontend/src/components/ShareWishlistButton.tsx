'use client'
import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ShareWishlistButton({ wishlistId, shareToken, isPublic }: {
  wishlistId: string; shareToken: string | null; isPublic: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [token, setToken] = useState(shareToken)
  const supabase = createClient()
  const router = useRouter()

  async function handleShare() {
    let t = token
    if (!t) {
      // Generate and save a share token
      const { data } = await supabase
        .from('wishlists')
        .update({ is_public: true })
        .eq('id', wishlistId)
        .select('share_token')
        .single()
      t = data?.share_token ?? null
      setToken(t)
      router.refresh()
    }
    if (t) {
      const url = `${window.location.origin}/s/${t}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button onClick={handleShare}
      className="flex items-center gap-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      {copied ? 'Copied!' : token ? 'Copy Link' : 'Share'}
    </button>
  )
}

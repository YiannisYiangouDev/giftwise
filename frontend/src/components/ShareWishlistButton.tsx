'use client'
import { useState } from 'react'
import { Share2, Check, Copy, ExternalLink, X, Globe, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'

export default function ShareWishlistButton({ wishlistId, shareToken, isPublic }: {
  wishlistId: string; shareToken: string | null; isPublic: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPublicState, setIsPublicState] = useState(isPublic)
  const [token, setToken] = useState(shareToken)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const publicUrl = token ? `${window.location.origin}/s/${token}` : ''

  async function togglePublic() {
    setLoading(true)
    const newPublicState = !isPublicState

    try {
      if (newPublicState) {
        // Enable sharing (and generate token if not present)
        const { data, error } = await supabase
          .from('wishlists')
          .update({ is_public: true })
          .eq('id', wishlistId)
          .select('share_token')
          .single()

        if (error) throw error

        setIsPublicState(true)
        if (data?.share_token) {
          setToken(data.share_token)
        }
        toast('Public sharing enabled!')
      } else {
        // Disable sharing
        const { error } = await supabase
          .from('wishlists')
          .update({ is_public: false })
          .eq('id', wishlistId)

        if (error) throw error

        setIsPublicState(false)
        toast('Public sharing disabled!')
      }
      router.refresh()
    } catch (err: any) {
      toast(`Error: ${err.message || 'Failed to update sharing settings'}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (publicUrl) {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast('Link copied to clipboard!')
    }
  }

  async function regenerateToken() {
    setLoading(true)
    const newToken = crypto.randomUUID().replace(/-/g, '')

    try {
      const { data, error } = await supabase
        .from('wishlists')
        .update({ share_token: newToken })
        .eq('id', wishlistId)
        .select('share_token')
        .single()

      if (error) throw error

      if (data?.share_token) {
        setToken(data.share_token)
      }
      toast('Link rotated successfully!')
      router.refresh()
    } catch (err: any) {
      toast(`Error: ${err.message || 'Failed to rotate link'}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition shadow-sm"
      >
        <Share2 size={14} />
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Share2 className="text-brand-500" size={20} />
              Share Wishlist
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Configure visibility settings for this wishlist.
            </p>

            <div className="space-y-6">
              {/* Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex gap-3">
                  {isPublicState ? (
                    <Globe className="text-brand-500 mt-0.5" size={20} />
                  ) : (
                    <Lock className="text-gray-400 mt-0.5" size={20} />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {isPublicState ? 'Publicly Shared' : 'Private (Disabled)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isPublicState
                        ? 'Anyone with the link can view and claim gifts.'
                        : 'Only you can view and edit this wishlist.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={togglePublic}
                  disabled={loading}
                  className={`${
                    isPublicState ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50`}
                >
                  <span
                    className={`${
                      isPublicState ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>

              {/* Public Link Box */}
              {isPublicState && publicUrl && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Shareable Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={publicUrl}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center"
                      title="Copy link"
                    >
                      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                    <a
                      href={`/s/${token}`}
                      onClick={(e) => {
                        e.preventDefault()
                        window.open(`/s/${token}`, '_blank')
                      }}
                      className="px-3 py-2 border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg transition flex items-center justify-center"
                      title="Preview public page"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                      Want to revoke access? Rotate the link to generate a new URL.
                    </p>
                    <button
                      onClick={regenerateToken}
                      disabled={loading}
                      type="button"
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition whitespace-nowrap ml-2"
                    >
                      {loading ? 'Rotating...' : 'Rotate Link'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


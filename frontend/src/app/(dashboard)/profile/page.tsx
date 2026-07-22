'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { User, Image as ImageIcon, Camera, Loader2 } from 'lucide-react'
import SafeImage from '@/components/SafeImage'

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Buddy',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Gizmo',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cookie'
]

export default function ProfilePage() {
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '')
        setFullName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '')
        setAvatarUrl(user.user_metadata?.avatar_url ?? '')
      }
      setFetching(false)
    })
  }, [])

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim()
      }
    })

    if (error) {
      toast(error.message, 'error')
    } else {
      toast('Profile updated successfully!')
      router.refresh()
      // Refresh page to propagate auth metadata changes across sidebar/topbar
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (fetching) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 page-enter max-w-lg">
      <div>
        <h1 className="text-3xl font-normal tracking-wide">My Profile</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Manage your account details and avatar</p>
      </div>

      <form onSubmit={handleUpdate} className="glass p-6 space-y-6">
        {/* Avatar Preview & Selection */}
        <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-100/60 dark:border-gray-800/40">
          <div className="relative group">
            {avatarUrl ? (
              <SafeImage 
                src={avatarUrl} 
                alt="Profile Preview" 
                width={96}
                height={96}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-brand-200/50 dark:ring-brand-800/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 dark:from-brand-900 dark:to-brand-800 dark:text-brand-300 flex items-center justify-center text-3xl font-light uppercase ring-4 ring-brand-200/50 dark:ring-brand-800/30">
                {fullName.charAt(0) || '?'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="w-full text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Select a Fun Avatar</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${
                    avatarUrl === preset ? 'border-brand-500 scale-105' : 'border-transparent hover:scale-105'
                  }`}
                >
                  <SafeImage src={preset} alt="" width={40} height={40} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <input 
              type="text" 
              value={email} 
              disabled 
              className="input bg-gray-50 dark:bg-gray-900/50 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="label">Username / Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required
                placeholder="e.g. Yiannis Yiangou"
                className="input pl-10"
              />
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="label">Custom Avatar URL</label>
            <div className="relative">
              <input 
                type="url" 
                value={avatarUrl} 
                onChange={e => setAvatarUrl(e.target.value)} 
                placeholder="https://example.com/avatar.jpg"
                className="input pl-10"
              />
              <ImageIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading || !fullName.trim()} className="btn-primary w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-red-500 dark:text-red-400 text-xs font-semibold border border-red-200/50 dark:border-red-900/30 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all duration-300 mt-2"
        >
          Sign Out
        </button>
      </form>
    </div>
  )
}

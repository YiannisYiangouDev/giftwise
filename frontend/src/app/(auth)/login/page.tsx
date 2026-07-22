'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import GiftWiseLogo from '@/components/GiftWiseLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfa] dark:bg-[#111110] relative overflow-hidden">
      {/* Background ambient luxury glow */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#c5a880]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#c5a880]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-sm p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <GiftWiseLogo size={36} variant="icon" />
          </div>
          <h1 className="text-3xl font-normal tracking-wide text-gray-900 dark:text-white serif-heading">GiftWise</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mt-1">
            Family gift tracker
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 focus:ring-1 focus:ring-lux-gold outline-none transition duration-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 focus:ring-1 focus:ring-lux-gold outline-none transition duration-300 text-sm"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition duration-300 text-sm disabled:opacity-40 shadow-sm"
          >
            {loading ? 'Please wait...' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-6">
          Access by invitation only
        </p>
      </div>
    </div>
  )
}

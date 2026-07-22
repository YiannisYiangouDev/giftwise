'use client'
import { useState } from 'react'
import { UserPlus, Check, AlertCircle } from 'lucide-react'

export default function AdminInviteForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: fullName || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Failed to create user' })
      } else {
        setResult({ type: 'success', message: `User ${email} created successfully!` })
        setEmail('')
        setPassword('')
        setFullName('')
      }
    } catch {
      setResult({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <UserPlus size={16} className="text-white" />
        </div>
        <h2 className="font-semibold">Invite Family Member</h2>
      </div>

      <form onSubmit={handleInvite} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            Full Name <span className="text-gray-300 dark:text-gray-600 normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Full name"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="family@example.com"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
            Password <span className="text-red-400">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Min 6 characters"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 focus:ring-1 focus:ring-brand-500 outline-none transition text-sm"
          />
        </div>

        {result && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
            result.type === 'success' 
              ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {result.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            {result.message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition text-sm disabled:opacity-40"
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  )
}

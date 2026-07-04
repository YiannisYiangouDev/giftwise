'use client'
import { useState } from 'react'
import { Bell, Moon, Sun, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [inAppNotifs, setInAppNotifs] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSignOut() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Manage your preferences</p>
      </div>

      {/* Notifications */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} className="text-brand-500" />
            <h2 className="font-semibold text-sm">Notifications</h2>
          </div>
          <p className="text-xs text-gray-400">Choose how you want to be notified</p>
        </div>
        <Toggle
          label="Email price alerts"
          description="Get an email when a tracked item drops below your target"
          value={emailNotifs}
          onChange={setEmailNotifs}
        />
        <Toggle
          label="In-app notifications"
          description="See alerts in the notification bell"
          value={inAppNotifs}
          onChange={setInAppNotifs}
        />
      </section>

      {/* Theme */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <Sun size={16} className="text-brand-500" />
            <h2 className="font-semibold text-sm">Appearance</h2>
          </div>
          <p className="text-xs text-gray-400">Theme is controlled by the toggle in the top bar</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-gray-400">Use the <Moon size={11} className="inline" /> icon in the header to switch</p>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-sm mb-3">Account</h2>
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition disabled:opacity-50"
          >
            <LogOut size={15} />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </section>
    </div>
  )
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
          value ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

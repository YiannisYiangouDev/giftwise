'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

type Prefs = {
  email_price_drops: boolean
  email_birthday_reminders: boolean
  email_weekly_digest: boolean
  inapp_price_drops: boolean
  inapp_birthday_reminders: boolean
  push_enabled: boolean
}

const SETTINGS: { key: keyof Prefs; label: string; description: string; group: string }[] = [
  { key: 'email_price_drops',         label: 'Price drop emails',       description: 'Get an email when a tracked item hits your target price', group: 'Email' },
  { key: 'email_birthday_reminders',  label: 'Birthday reminder emails', description: 'Reminder 7 days before a recipient\'s birthday',           group: 'Email' },
  { key: 'email_weekly_digest',       label: 'Weekly digest',            description: 'Summary of all price changes every Monday morning',        group: 'Email' },
  { key: 'inapp_price_drops',         label: 'In-app price alerts',      description: 'Bell icon badge when a price drops below target',          group: 'In-App' },
  { key: 'inapp_birthday_reminders',  label: 'In-app birthday alerts',   description: 'Notification when a birthday is 7 days away',             group: 'In-App' },
  { key: 'push_enabled',              label: 'Browser push notifications', description: 'Enable push notifications in this browser (optional)',   group: 'Push' },
]

const GROUPS = ['Email', 'In-App', 'Push']

export default function NotificationSettings({
  userId, initialPrefs
}: { userId: string; initialPrefs: Prefs }) {
  const supabase = createClient()
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function toggle(key: keyof Prefs) {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setSaving(true)
    await supabase.from('user_settings').upsert({ user_id: userId, ...updated })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="space-y-6">
      {GROUPS.map(group => (
        <div key={group} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold">{group} Notifications</h2>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {SETTINGS.filter(s => s.group === group).map(s => (
              <div key={s.key} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                </div>
                <button
                  onClick={() => toggle(s.key)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    prefs[s.key] ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    prefs[s.key] ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="h-6 flex items-center">
        {saving && <p className="text-xs text-gray-400">Saving…</p>}
        {saved && !saving && (
          <p className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> Saved</p>
        )}
      </div>
    </div>
  )
}

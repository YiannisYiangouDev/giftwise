import { createClient } from '@/lib/supabase/server'
import NotificationSettings from './NotificationSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  // Create default settings row if it doesn't exist
  const defaults = {
    email_price_drops: true,
    email_birthday_reminders: true,
    email_weekly_digest: true,
    inapp_price_drops: true,
    inapp_birthday_reminders: true,
    push_enabled: false,
  }

  const prefs = settings ?? defaults

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500">Manage your notification preferences</p>
      </div>
      <NotificationSettings userId={user!.id} initialPrefs={prefs} />
    </div>
  )
}

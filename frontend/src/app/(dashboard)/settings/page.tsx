'use client'
import { useState } from 'react'
import { Bell, Mail, Smartphone, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(false)
  const [priceDropThreshold, setPriceDropThreshold] = useState(10)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    await fetch('/api/account/delete', { method: 'DELETE' })
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Notification preferences & account</p>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Bell size={18} className="text-brand-500" /> Notifications
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium">Email alerts</p>
              <p className="text-xs text-gray-500">Price drops, birthday reminders</p>
            </div>
          </div>
          <button onClick={() => setEmailAlerts(!emailAlerts)}
            className={`w-10 h-6 rounded-full transition ${emailAlerts ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'} relative`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${emailAlerts ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone size={18} className="text-gray-400" />
            <div>
              <p className="text-sm font-medium">Push notifications</p>
              <p className="text-xs text-gray-500">Browser push (requires permission)</p>
            </div>
          </div>
          <button onClick={() => setPushAlerts(!pushAlerts)}
            className={`w-10 h-6 rounded-full transition ${pushAlerts ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'} relative`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition ${pushAlerts ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Price drop threshold</label>
          <p className="text-xs text-gray-500 mb-2">Alert when price drops by this % or more</p>
          <div className="flex items-center gap-2">
            <input
              type="range" min="1" max="50" value={priceDropThreshold}
              onChange={e => setPriceDropThreshold(Number(e.target.value))}
              className="flex-1 accent-brand-500"
            />
            <span className="text-sm font-medium w-12 text-right">{priceDropThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Trash2 size={18} className="text-red-500" /> Account
        </h2>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition text-sm text-red-600 dark:text-red-400">
            <Trash2 size={18} />
            <div className="text-left">
              <p className="font-medium">Delete my account</p>
              <p className="text-xs opacity-75">Permanently remove all data</p>
            </div>
          </button>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">This cannot be undone.</p>
            </div>
            <p className="text-xs text-red-500">All recipients, wishlists, contributions and account will be permanently deleted.</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full px-3 py-2 text-sm border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none" />
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleteConfirm !== 'DELETE' || deleting}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-red-700 transition">
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
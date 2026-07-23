'use client'
import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Trash2, AlertTriangle, Calendar, Copy, Check, Globe, Key, Download, ShieldAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { listTokensAction, generateTokenAction, revokeTokenAction } from '@/app/actions/tokenActions'
import { ApiTokenRow } from '@/types/rows'

export default function SettingsPage() {
  const { t } = useLanguage()
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [pushAlerts, setPushAlerts] = useState(false)
  const [priceDropThreshold, setPriceDropThreshold] = useState(10)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tokens, setTokens] = useState<Pick<ApiTokenRow, 'id' | 'name' | 'last_used_at' | 'created_at'>[]>([])
  const [newTokenName, setNewTokenName] = useState('')
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [generatingToken, setGeneratingToken] = useState(false)
  const [copiedToken, setCopiedToken] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        loadTokens()
      }
    })

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushAlerts(Notification.permission === 'granted')
    }
  }, [])

  async function handleTogglePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      toast('This browser does not support push notifications.', 'error')
      return
    }

    if (Notification.permission === 'granted' && pushAlerts) {
      setPushAlerts(false)
      toast('Push notifications disabled for this device.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      try {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (vapidKey) {
          const reg = await navigator.serviceWorker.ready
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
          const subJson = sub.toJSON()
          if (subJson && subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: subJson }),
            })
          }
        }
        setPushAlerts(true)
        toast('Push notifications activated!')
      } catch (err: any) {
        toast(`Push subscription failed: ${err.message || err}`, 'error')
      }
    } else {
      setPushAlerts(false)
      toast('Permission denied for push notifications.', 'error')
    }
  }

  async function handleSendTestPush() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      toast('Please enable push notification permissions first.', 'error')
      return
    }

    try {
      const reg = await navigator.serviceWorker.ready
      reg.showNotification('🎁 GiftWise Test Notification', {
        body: 'Push notifications are working perfectly on your device!',
        icon: '/web-app-manifest-192x192.png',
        badge: '/web-app-manifest-192x192.png',
        data: { url: '/settings' },
        tag: 'test-push',
      } as any)
      toast('Test push notification dispatched!')
    } catch (err: any) {
      toast(`Failed to send test push: ${err.message || err}`, 'error')
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  async function handleDelete() {
    if (deleteConfirm !== 'DELETE') return
    setDeleting(true)
    await fetch('/api/account/delete', { method: 'DELETE' })
    await supabase.auth.signOut()
    router.push('/login')
  }

  const calendarUrl = userId && typeof window !== 'undefined'
    ? `${window.location.origin}/api/calendar.ics?token=${userId}`
    : ''

  const [isStandalone, setIsStandalone] = useState(false)
  const [badgeEnabled, setBadgeEnabled] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
      setIsStandalone(standalone)
    }
  }, [])

  async function handleClearCache() {
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations()
          for (const reg of regs) {
            await reg.unregister()
          }
        }
        toast('PWA cache cleared! Reloading page...')
        setTimeout(() => window.location.reload(), 1200)
      } catch (err: any) {
        toast(`Error clearing cache: ${err.message || err}`, 'error')
      }
    }
  }

  function copyCalendarLink() {
    if (!calendarUrl) return
    navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    toast('Calendar link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  async function loadTokens() {
    try {
      const data = await listTokensAction()
      setTokens(data)
    } catch (err: any) {
      toast(err.message || 'Failed to load API tokens', 'error')
    }
  }

  async function handleGenerateToken(e: React.FormEvent) {
    e.preventDefault()
    if (!newTokenName.trim() || generatingToken) return
    setGeneratingToken(true)

    try {
      const res = await generateTokenAction(newTokenName)
      setGeneratedToken(res.rawToken)
      setNewTokenName('')
      setShowTokenModal(true)
      await loadTokens()
      toast('API token generated!')
    } catch (err: any) {
      toast(err.message || 'Failed to generate token', 'error')
    } finally {
      setGeneratingToken(false)
    }
  }

  async function handleRevokeToken(id: string) {
    if (!confirm('Are you sure you want to revoke this API token? Any client using it will lose access.')) return
    try {
      await revokeTokenAction(id)
      await loadTokens()
      toast('API token revoked.')
    } catch (err: any) {
      toast(err.message || 'Failed to revoke token', 'error')
    }
  }

  function copyNewToken() {
    if (!generatedToken) return
    navigator.clipboard.writeText(generatedToken)
    setCopiedToken(true)
    toast('Token copied to clipboard!')
    setTimeout(() => setCopiedToken(false), 2000)
  }

  return (
    <div className="space-y-8 page-enter max-w-lg">
      <div>
        <h1 className="text-3xl font-normal tracking-wide">{t('settings_title')}</h1>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t('settings_subtitle')}</p>
      </div>

      {/* Language Selection */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Globe size={16} className="text-brand-500" /> {t('language_label')}
        </h2>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">GiftWise Language</p>
            <p className="text-[11px] text-gray-400">Select preferred language for Cyprus & Greece</p>
          </div>
          <LanguageSwitcher />
        </div>
      </div>

      {/* PWA App Status & Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Smartphone size={16} className="text-brand-500" /> Progressive Web App (PWA)
        </h2>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
              {isStandalone ? '📱 App Installed (Standalone Mode)' : '🌐 Running in Web Browser'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isStandalone
                ? 'GiftWise is running as a native home screen app.'
                : 'Install GiftWise to access full offline wishlists & app shortcuts.'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${
            isStandalone
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200/50'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/50'
          }`}>
            {isStandalone ? 'Installed' : 'Web Browser'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">App Badge Counter</p>
            <p className="text-[11px] text-gray-400">Display unread alert count on PWA home screen icon</p>
          </div>
          <button onClick={() => setBadgeEnabled(!badgeEnabled)}
            className={`lux-toggle ${badgeEnabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`lux-toggle-dot ${badgeEnabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClearCache}
            className="w-full text-xs font-semibold py-2 px-3 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            Clear Offline Cache & Refresh App
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-5">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Bell size={16} className="text-brand-500" /> Notifications
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800/30 flex items-center justify-center">
              <Mail size={16} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email alerts</p>
              <p className="text-[11px] text-gray-400">Price drops, birthday reminders & Secret Santa</p>
            </div>
          </div>
          <button onClick={() => setEmailAlerts(!emailAlerts)}
            className={`lux-toggle ${emailAlerts ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`lux-toggle-dot ${emailAlerts ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        <div className="divider" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800/30 flex items-center justify-center">
                <Smartphone size={16} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Push notifications</p>
                <p className="text-[11px] text-gray-400">Browser & device push alerts</p>
              </div>
            </div>
            <button onClick={handleTogglePush}
              className={`lux-toggle ${pushAlerts ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <span className={`lux-toggle-dot ${pushAlerts ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {pushAlerts && (
            <div className="pt-2">
              <button
                onClick={handleSendTestPush}
                className="w-full text-xs font-semibold py-2 px-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 border border-brand-200/50 dark:border-brand-800/30 rounded-xl hover:bg-brand-100/60 transition"
              >
                Send Test Push Notification
              </button>
            </div>
          )}
        </div>

        <div className="divider" />

        <div>
          <label className="label">Price drop threshold</label>
          <p className="text-[11px] text-gray-400 mb-3">Alert when price drops by this % or more</p>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="50" value={priceDropThreshold}
              onChange={e => setPriceDropThreshold(Number(e.target.value))}
              className="flex-1 accent-brand-500 h-1"
            />
            <span className="text-sm font-medium w-12 text-right text-gray-600 dark:text-gray-400">{priceDropThreshold}%</span>
          </div>
        </div>
      </div>

      {/* Calendar Sync */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Calendar size={16} className="text-brand-500" /> Calendar Sync (iCal)
        </h2>
        <p className="text-[11px] text-gray-400">
          Subscribe to your family birthdays and wishlist events in Google Calendar, Apple Calendar, or Outlook.
        </p>

        {calendarUrl ? (
          <div className="flex gap-2">
            <input
              type="text" readOnly value={calendarUrl}
              className="input !py-2 !text-[11px] flex-1 text-gray-400 select-all"
            />
            <button onClick={copyCalendarLink}
              className="px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lux-gold">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic">Generating feed URL...</p>
        )}
      </div>

      {/* API & Extensions */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Key size={16} className="text-brand-500" /> API & Browser Extension
        </h2>
        <p className="text-[11px] text-gray-400">
          Generate secure Personal Access Tokens (PATs) to connect the GiftWise Quick Clip browser extension and add items from any website.
        </p>

        {/* Generate Token Form */}
        <form onSubmit={handleGenerateToken} className="flex gap-2">
          <input
            type="text"
            required
            value={newTokenName}
            onChange={e => setNewTokenName(e.target.value)}
            placeholder="e.g. My Chrome Extension"
            className="input !py-2 !text-xs flex-1"
          />
          <button
            type="submit"
            disabled={generatingToken || !newTokenName.trim()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-300 shadow-lux-gold"
          >
            Generate PAT
          </button>
        </form>

        {/* Tokens List */}
        {tokens.length > 0 ? (
          <div className="space-y-2 pt-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active Tokens ({tokens.length})</p>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/30 dark:bg-gray-900/10">
              {tokens.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 text-xs">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{t.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Created: {new Date(t.created_at).toLocaleDateString()}
                      {t.last_used_at && ` · Last used: ${new Date(t.last_used_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeToken(t.id)}
                    className="text-red-500 hover:text-red-600 font-semibold text-[11px] px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 italic pt-1">No active API tokens generated.</p>
        )}

        <div className="divider" />

        {/* Download Section */}
        <div className="p-4 bg-brand-500/5 dark:bg-brand-950/10 border border-brand-200/40 dark:border-brand-800/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Quick Clip Chrome Extension</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Download and install to clip gifts with one click.</p>
          </div>
          <a
            href="/api/extension/download"
            className="px-4 py-2 border border-brand-500 hover:bg-brand-500/10 text-brand-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-300"
          >
            <Download size={13} /> Download ZIP
          </a>
        </div>

        {/* Installation Instructions */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl text-[11px] text-gray-500 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-gray-700 dark:text-gray-300">How to Install:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Download the extension ZIP file above and extract it.</li>
            <li>Open Chrome/Edge and go to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">chrome://extensions</code>.</li>
            <li>Enable <strong>Developer mode</strong> (top-right toggle switch).</li>
            <li>Click <strong>Load unpacked</strong> (top-left button) and select the extracted extension folder.</li>
            <li>Open the extension popup on any store page, insert your PAT, and start clipping!</li>
          </ol>
        </div>
      </div>

      {/* Generated Token Modal Overlay */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card max-w-md w-full p-6 space-y-4 animate-scale-up border border-brand-500/30">
            <div className="flex items-center gap-2 text-brand-500">
              <Key size={20} />
              <h3 className="text-lg font-bold">Your Personal Access Token</h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-amber-600 dark:text-amber-400 text-xs">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <p>Make sure to copy this token now. It will not be shown again for security reasons!</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={generatedToken}
                className="input !py-2.5 !text-xs flex-1 font-mono bg-black text-brand-400 select-all"
              />
              <button
                onClick={copyNewToken}
                className="px-4 bg-brand-500 hover:bg-brand-600 text-white rounded-xl flex items-center justify-center transition-all duration-300 shadow-lux-gold"
              >
                {copiedToken ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => { setShowTokenModal(false); setGeneratedToken('') }}
                className="btn-secondary !py-2 !px-4 !text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Trash2 size={16} className="text-red-500" /> Account
        </h2>

        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-200/50 dark:border-red-900/30 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all duration-300 text-sm text-red-600 dark:text-red-400">
            <Trash2 size={16} />
            <div className="text-left">
              <p className="font-medium text-sm">Delete my account</p>
              <p className="text-[11px] opacity-75">Permanently remove all data</p>
            </div>
          </button>
        ) : (
          <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">This cannot be undone.</p>
            </div>
            <p className="text-[11px] text-red-500/80">All recipients, wishlists, contributions and account will be permanently deleted.</p>
            <input type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="input !border-red-300 dark:!border-red-800 focus:!ring-red-500 !text-sm" />
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={deleteConfirm !== 'DELETE' || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40 hover:bg-red-700 transition-all duration-300">
                {deleting ? 'Deleting…' : 'Delete Everything'}
              </button>
              <button onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className="btn-secondary !py-2 !px-4 !text-xs">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
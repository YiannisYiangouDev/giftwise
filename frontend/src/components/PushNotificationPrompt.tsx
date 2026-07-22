'use client'
import { useState, useEffect } from 'react'
import { Bell, X, Check, Sparkles } from 'lucide-react'

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

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribedSuccess, setSubscribedSuccess] = useState(false)

  useEffect(() => {
    // Check if push notifications are supported and permission is 'default'
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    const permission = Notification.permission
    if (permission !== 'default') {
      return
    }

    const dismissedAt = localStorage.getItem('giftwise_push_dismissed')
    const now = Date.now()
    // Show prompt if not dismissed within last 7 days
    if (dismissedAt && now - parseInt(dismissedAt, 10) < 7 * 24 * 60 * 60 * 1000) {
      return
    }

    const timer = setTimeout(() => setShowPrompt(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  const handleSubscribe = async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.warn('VAPID public key missing')
      return
    }

    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setShowPrompt(false)
        setLoading(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const subJson = subscription.toJSON()
      if (!subJson || !subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        console.warn('Incomplete push subscription payload', subJson)
        setLoading(false)
        return
      }

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subJson }),
      })

      if (res.ok) {
        setShowPrompt(false)
        setSubscribedSuccess(true)
        setTimeout(() => setSubscribedSuccess(false), 4000)
      }
    } catch (err) {
      console.error('Failed to subscribe to Web Push:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('giftwise_push_dismissed', Date.now().toString())
  }

  return (
    <>
      {/* Subscribed Success Toast */}
      {subscribedSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl bg-gray-900/90 dark:bg-gray-900/90 border border-lux-gold/30 text-white backdrop-blur-md animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-lux-gold/20 flex items-center justify-center text-lux-gold">
            <Check size={18} />
          </div>
          <div className="text-xs">
            <p className="font-semibold">Push Notifications Enabled!</p>
            <p className="text-[11px] text-gray-300">You will receive instant alerts for price drops & Secret Santa.</p>
          </div>
        </div>
      )}

      {/* Permission Banner Prompt */}
      {showPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-white/95 dark:bg-gray-900/95 border border-brand-500/30 dark:border-brand-500/20 shadow-2xl rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition"
              aria-label="Dismiss prompt"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-brand-500/15 rounded-xl flex-shrink-0 text-brand-500 border border-brand-500/20">
                <Bell size={24} className="animate-pulse" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Enable Instant Alerts</h4>
                  <Sparkles size={12} className="text-lux-gold" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  Never miss price drops on wishlist gifts or Secret Santa Q&A replies.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="btn-primary !py-1.5 !px-3.5 !text-xs shadow-md shadow-brand-500/20"
                  >
                    {loading ? 'Enabling...' : 'Enable Notifications'}
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium px-2 py-1 transition"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

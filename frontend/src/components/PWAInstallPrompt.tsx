'use client'
import { useState, useEffect } from 'react'
import { Download, X, Share, PlusSquare, WifiOff, Wifi, Sparkles, Check } from 'lucide-react'
import GiftWiseLogo from '@/components/GiftWiseLogo'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [showOfflineNotice, setShowOfflineNotice] = useState(false)
  const [installedSuccess, setInstalledSuccess] = useState(false)

  useEffect(() => {
    // 1. Check if running as installed PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }
    checkStandalone()

    // 2. Online/Offline detection
    const handleOnline = () => {
      setIsOffline(false)
      setShowOfflineNotice(true)
      setTimeout(() => setShowOfflineNotice(false), 3000)
    }
    const handleOffline = () => {
      setIsOffline(true)
      setShowOfflineNotice(true)
    }

    if (!navigator.onLine) {
      setIsOffline(true)
      setShowOfflineNotice(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 3. iOS Detection
    const ua = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(ua)
    setIsIOS(isIOSDevice)

    // Check dismissal state
    const dismissedAt = localStorage.getItem('giftwise_pwa_dismissed')
    const now = Date.now()
    // Don't show banner if dismissed within last 7 days
    const isDismissedRecently = dismissedAt && now - parseInt(dismissedAt, 10) < 7 * 24 * 60 * 60 * 1000

    // 4. Chrome/Android/Edge beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      if (!isDismissedRecently) {
        setShowBanner(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 5. App installed listener
    const handleAppInstalled = () => {
      setIsInstallable(false)
      setShowBanner(false)
      setDeferredPrompt(null)
      setInstalledSuccess(true)
      setTimeout(() => setInstalledSuccess(false), 5000)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // Show iOS banner if on iOS and not standalone and not dismissed
    if (isIOSDevice && !isStandalone && !isDismissedRecently) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setShowBanner(true), 2500)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.error('Install prompt failed:', err)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem('giftwise_pwa_dismissed', Date.now().toString())
  }

  return (
    <>
      {/* Offline Status Toast */}
      {showOfflineNotice && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
          isOffline
            ? 'bg-amber-950/90 border-amber-800/60 text-amber-200 dark:bg-amber-950/90 dark:border-amber-800/60 dark:text-amber-200'
            : 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200 dark:bg-emerald-950/90 dark:border-emerald-800/60 dark:text-emerald-200'
        }`}>
          {isOffline ? <WifiOff size={18} className="animate-pulse text-amber-400" /> : <Wifi size={18} className="text-emerald-400" />}
          <div className="text-xs">
            <p className="font-semibold">{isOffline ? 'Offline Mode Active' : 'Back Online'}</p>
            <p className="text-[11px] opacity-80">
              {isOffline ? 'Viewing cached family wishlists' : 'Connected to live updates'}
            </p>
          </div>
        </div>
      )}

      {/* Installed Success Toast */}
      {installedSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl bg-gray-900/90 dark:bg-gray-900/90 border border-lux-gold/30 text-white backdrop-blur-md animate-in fade-in">
          <div className="w-8 h-8 rounded-xl bg-lux-gold/20 flex items-center justify-center text-lux-gold">
            <Check size={18} />
          </div>
          <div className="text-xs">
            <p className="font-semibold">GiftWise App Installed!</p>
            <p className="text-[11px] text-gray-300">Access your wishlists right from your home screen.</p>
          </div>
        </div>
      )}

      {/* Bottom PWA Install Banner */}
      {showBanner && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white/95 dark:bg-gray-900/95 border border-lux-gold/30 dark:border-lux-gold/20 shadow-2xl rounded-2xl p-4 backdrop-blur-md relative overflow-hidden">
            {/* Ambient Gold Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-lux-gold/15 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition"
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-gradient-to-br from-brand-500/15 to-lux-gold/20 rounded-xl flex-shrink-0 border border-lux-gold/30">
                <GiftWiseLogo size={28} variant="icon" />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Install GiftWise</h4>
                  <Sparkles size={12} className="text-lux-gold" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">
                  Get fast home screen access, instant price drop alerts & full offline support.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="btn-primary !py-1.5 !px-3.5 !text-xs shadow-md shadow-brand-500/20"
                  >
                    <Download size={14} />
                    {isIOS ? 'Install on iPhone' : 'Add to Home Screen'}
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium px-2 py-1 transition"
                  >
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-brand-50 dark:bg-brand-950/40 rounded-2xl border border-brand-200/50 dark:border-brand-800/30">
                <GiftWiseLogo size={32} variant="icon" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Install on Safari (iOS)</h3>
                <p className="text-xs text-gray-500">Add GiftWise to your home screen in 2 quick steps:</p>
              </div>
            </div>

            <div className="space-y-3 my-5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Share size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">1. Tap the Share button</p>
                  <p className="text-[11px] text-gray-400">Located in the bottom Safari toolbar.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                  <PlusSquare size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">2. Select &apos;Add to Home Screen&apos;</p>
                  <p className="text-[11px] text-gray-400">Scroll down the share menu list and tap Add.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="btn-secondary !py-2 !px-4 !text-xs"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

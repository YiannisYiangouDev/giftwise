'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, ListChecks, TrendingDown, Settings, LayoutDashboard, X, LogOut, User, Download, BarChart3, History, CalendarDays, PiggyBank } from 'lucide-react'
import { clsx } from 'clsx'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/context/LanguageContext'
import { TranslationKeys } from '@/locales/en'
import GiftWiseLogo from '@/components/GiftWiseLogo'
import SafeImage from '@/components/SafeImage'

const nav: { href: string; key: TranslationKeys; icon: any }[] = [
  { href: '/', key: 'nav_dashboard', icon: LayoutDashboard },
  { href: '/recipients', key: 'nav_recipients', icon: Users },
  { href: '/wishlists', key: 'nav_wishlists', icon: ListChecks },
  { href: '/secret-santa', key: 'nav_secret_santa', icon: Users },
  { href: '/tracker', key: 'nav_price_tracker', icon: TrendingDown },
  { href: '/calendar', key: 'nav_calendar', icon: CalendarDays },
  { href: '/analytics', key: 'nav_analytics', icon: BarChart3 },
  { href: '/savings', key: 'nav_savings', icon: PiggyBank },
  { href: '/history', key: 'nav_history', icon: History },
  { href: '/profile', key: 'nav_my_profile', icon: User },
  { href: '/settings', key: 'nav_settings', icon: Settings },
]

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const { t } = useLanguage()
  const pathname = usePathname()
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)
  const [userInitial, setUserInitial] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isStandalone, setIsStandalone] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
      setIsStandalone(standalone)
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? '')
        const meta = user.user_metadata || {}
        const name = meta.full_name || user.email?.split('@')[0] || ''
        setDisplayName(name)
        setUserInitial(name.charAt(0).toUpperCase())
        setAvatar(meta.avatar_url ?? '')
      }
    })
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname, setMobileOpen])

  const linkClasses = (href: string) => clsx(
    'group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 relative',
    isActive(href)
      ? 'text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/30'
      : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-gray-800/30'
  )

  const iconClasses = (href: string) => clsx(
    'transition-colors duration-300',
    isActive(href)
      ? 'text-brand-500'
      : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400'
  )

  const links = nav.map(item => (
    <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
      {isActive(item.href) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full" />
      )}
      <item.icon size={16} className={iconClasses(item.href)} />
      <span>{t(item.key)}</span>
    </Link>
  ))

  const brandMark = (
    <div className="flex items-center gap-3 px-2">
      <GiftWiseLogo size={28} variant="icon" />
      <span className="text-lg tracking-wide text-gray-900 dark:text-white serif-heading">GiftWise</span>
    </div>
  )

  const userSection = (
    <div className="px-2 pt-4 border-t border-gray-100/60 dark:border-gray-800/40 space-y-2">
      {!isStandalone && (
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/40 dark:border-brand-800/30 rounded-xl hover:bg-brand-100/60 transition"
        >
          <Download size={14} />
          <span>{t('nav_install_app')}</span>
        </Link>
      )}

      <Link href="/profile" className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-900/30 rounded-xl transition-all duration-200">
        {avatar ? (
          <SafeImage src={avatar} alt="User Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200/50 dark:ring-brand-700/30" />
        ) : (
          <div className="avatar-sm avatar-gold">{userInitial || '?'}</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{displayName || 'My Profile'}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
        </div>
      </Link>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-[#0e0e0e]/95 backdrop-blur-xl border-r border-gray-100/60 dark:border-gray-800/40 py-7 px-4 transform transition-all duration-300 ease-out md:hidden flex flex-col',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between mb-8">
          {brandMark}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close Sidebar"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 space-y-1">{links}</nav>
        {userSection}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white/80 dark:bg-[#0e0e0e]/80 backdrop-blur-xl border-r border-gray-100/40 dark:border-gray-800/30 py-8 px-4 flex-shrink-0">
        <div className="mb-10">{brandMark}</div>
        <nav className="flex-1 space-y-1">{links}</nav>
        {userSection}
      </aside>
    </>
  )
}

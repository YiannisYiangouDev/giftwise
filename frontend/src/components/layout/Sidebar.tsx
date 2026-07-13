'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Users, ListChecks, TrendingDown, Settings, LayoutDashboard, X } from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '/wishlists', label: 'Wishlists', icon: ListChecks },
  { href: '/secret-santa', label: 'Secret Santa', icon: '🎅' },
  { href: '/tracker', label: 'Price Tracker', icon: TrendingDown },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href)

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Expose toggle function globally so TopBar can trigger it
  useEffect(() => {
    (window as any).__toggleSidebar = () => setMobileOpen(v => !v)
    return () => { delete (window as any).__toggleSidebar }
  }, [])

  const linkClasses = (href: string) => clsx(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
    isActive(href)
      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
  )

  const links = nav.map(item => (
    <Link key={item.href} href={item.href} className={linkClasses(item.href)}>
      {typeof item.icon === 'string' ? <span className="text-lg">{item.icon}</span> : <item.icon size={18} />}
      {item.label}
    </Link>
  ))

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-6 transform transition-transform duration-200 md:hidden',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="px-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Gift size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">GiftWise</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-2 space-y-1">{links}</nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-6">
        <div className="px-4 mb-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Gift size={16} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">GiftWise</span>
        </div>
        <nav className="flex-1 px-2 space-y-1">{links}</nav>
      </aside>
    </>
  )
}

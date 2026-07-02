'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Users, ListChecks, TrendingDown, Settings, LayoutDashboard } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recipients', label: 'Recipients', icon: Users },
  { href: '/wishlists', label: 'Wishlists', icon: ListChecks },
  { href: '/tracker', label: 'Price Tracker', icon: TrendingDown },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 py-6">
      <div className="px-4 mb-8 flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Gift size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white">GiftWise</span>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {nav.map(item => (
          <Link key={item.href} href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition',
              pathname === item.href
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

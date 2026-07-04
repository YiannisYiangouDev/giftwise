'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Users, LayoutDashboard, TrendingDown, Settings } from 'lucide-react'
import { clsx } from 'clsx'

const nav = [
  { href: '/',           label: 'Home',       icon: LayoutDashboard },
  { href: '/recipients', label: 'People',     icon: Users },
  { href: '/wishlists',  label: 'Wishlists',  icon: Gift },
  { href: '/tracker',    label: 'Tracker',    icon: TrendingDown },
  { href: '/settings',   label: 'Settings',   icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex z-50">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link key={href} href={href} className={clsx(
            'flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors',
            active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-500'
          )}>
            <Icon size={20} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

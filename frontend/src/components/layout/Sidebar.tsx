'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gift, Users, LayoutDashboard, TrendingDown, Bell, Settings, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

const nav = [
  { href: '/',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/recipients',  label: 'Recipients', icon: Users },
  { href: '/wishlists',   label: 'Wishlists',  icon: Gift },
  { href: '/tracker',     label: 'Tracker',    icon: TrendingDown },
  { href: '/settings',    label: 'Settings',   icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-60 flex-col h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
          <Gift size={16} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-white tracking-tight">GiftWise</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4">
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

'use client'
import { Bell, Menu, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/':            'Dashboard',
  '/recipients':  'Recipients',
  '/wishlists':   'Wishlists',
  '/tracker':     'Price Tracker',
  '/settings':    'Settings',
}

export default function TopBar() {
  const pathname = usePathname()
  const [dark, setDark] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }

  const title = Object.entries(pageTitles).find(([key]) =>
    key === '/' ? pathname === '/' : pathname.startsWith(key)
  )?.[1] ?? 'GiftWise'

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-semibold text-gray-900 dark:text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}

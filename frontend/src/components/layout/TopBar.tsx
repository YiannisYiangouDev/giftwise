'use client'
import { Bell, Moon, Sun, Menu, Search, Command } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

import LanguageSwitcher from '@/components/LanguageSwitcher'

interface TopBarProps {
  onToggleSidebar: () => void
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const [dark, setDark] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userInitial, setUserInitial] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata || {}
        const name = meta.full_name || user.email?.split('@')[0] || ''
        setUserInitial(name.charAt(0).toUpperCase())
        setAvatarUrl(meta.avatar_url ?? '')
      }
    })
  }, [])

  useEffect(() => {
    async function load() {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false)
      setUnreadCount(count ?? 0)
    }
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  function toggleDark() {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <header className="h-14 bg-white/70 dark:bg-[#0e0e0e]/70 backdrop-blur-xl border-b border-gray-100/40 dark:border-gray-800/20 px-4 sm:px-6 flex items-center justify-between gap-3">
      <button onClick={onToggleSidebar}
        aria-label="Toggle Sidebar"
        className="md:hidden p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/40 text-gray-400 transition-all duration-200">
        <Menu size={18} />
      </button>

      {/* ⌘K Quick Search trigger */}
      <button
        onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { metaKey: true, key: 'k' }))}
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
      >
        <Search size={13} />
        <span className="hidden lg:inline">Quick search...</span>
        <kbd className="text-[10px] font-mono text-gray-400 bg-gray-200/50 dark:bg-gray-700 px-1 rounded hidden lg:inline">
          {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <LanguageSwitcher />

        <button onClick={toggleDark}
          aria-label="Toggle Theme"
          className="p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/40 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-300">
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button 
          aria-label="Notifications"
          className="p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/40 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 relative transition-all duration-300">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <Link href="/profile"
          className="ml-1 flex items-center justify-center transition-all duration-300"
          title="My Profile">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="User Avatar" width={32} height={32} className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200/50 dark:ring-brand-700/30 hover:scale-105 transition-transform" />
          ) : (
            <div className="avatar-sm avatar-gold hover:ring-brand-400/50 text-[11px]">{userInitial || '?'}</div>
          )}
        </Link>
      </div>
    </header>
  )
}

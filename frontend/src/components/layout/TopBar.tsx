'use client'
import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'
import AlertBadge from '@/components/AlertBadge'

export default function TopBar() {
  const [dark, setDark] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDark(!dark)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-end gap-3">
      <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      {/* AlertBadge is an async server component — wrap in Suspense so TopBar stays a client component */}
      <Suspense fallback={<span className="w-8 h-8" />}>
        {/* @ts-expect-error async server component in client tree */}
        <AlertBadge />
      </Suspense>
      <button onClick={signOut} className="text-sm text-gray-500 hover:text-red-500 transition px-2">
        Sign out
      </button>
    </header>
  )
}

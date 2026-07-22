'use client'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import ProgressBar from '@/components/ProgressBar'
import CommandPalette from '@/components/CommandPalette'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteItems, setPaletteItems] = useState<{ id: string; label: string; href: string; icon?: string; group: string }[]>([])

  useEffect(() => {
    async function loadPaletteItems() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [recipients, wishlists] = await Promise.all([
        supabase.from('recipients').select('id, name').eq('user_id', user.id).limit(20),
        supabase.from('wishlists').select('id, title, recipients!inner(name)').eq('recipients.user_id', user.id).limit(20),
      ])

      const items = [
        // Static routes
        { id: 'home', label: 'Dashboard', href: '/', icon: '🏠', group: 'Pages' },
        { id: 'recipients-page', label: 'Recipients', href: '/recipients', icon: '👥', group: 'Pages' },
        { id: 'wishlists-page', label: 'Wishlists', href: '/wishlists', icon: '🎀', group: 'Pages' },
        { id: 'tracker-page', label: 'Price Tracker', href: '/tracker', icon: '📊', group: 'Pages' },
        { id: 'santa-page', label: 'Secret Santa', href: '/secret-santa', icon: '🎅', group: 'Pages' },
        { id: 'settings-page', label: 'Settings', href: '/settings', icon: '⚙️', group: 'Pages' },
        // Dynamic: recipients
        ...(recipients.data ?? []).map(r => ({
          id: `recipient-${r.id}`, label: r.name, href: `/recipients/${r.id}`, icon: '👤', group: 'Recipients',
        })),
        // Dynamic: wishlists
        ...(wishlists.data ?? []).map((w: any) => ({
          id: `wishlist-${w.id}`, label: `${(w.recipients as any)?.name}: ${w.title}`, href: `/wishlists/${w.id}`, icon: '🎁', group: 'Wishlists',
        })),
      ]
      setPaletteItems(items)
    }
    loadPaletteItems()
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <ProgressBar />
      <CommandPalette items={paletteItems} />
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setMobileOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto flex flex-col justify-between">
          <div className="p-4 sm:p-6 flex-1">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'
import Link from 'next/link'

export default async function AlertBadge() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('price_alerts')
    .select('id', { count: 'exact', head: true })
    .is('seen_at', null)

  if (!count || count === 0) return null

  return (
    <Link href="/tracker" className="relative inline-flex items-center">
      <Bell size={20} className="text-gray-500" />
      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </Link>
  )
}

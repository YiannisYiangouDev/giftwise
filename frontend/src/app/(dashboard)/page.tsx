import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import DashboardStats from '@/components/dashboard/DashboardStats'
import UpcomingOccasions from '@/components/dashboard/UpcomingOccasions'
import PriceAlerts from '@/components/dashboard/PriceAlerts'
import RecentActivity from '@/components/dashboard/RecentActivity'
import StatsSkeleton from '@/components/dashboard/StatsSkeleton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const name = user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {getGreeting()}, {name} 👋
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Here's what's happening with your gifts today.
        </p>
      </div>

      {/* Stats row */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Two-column grid on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<CardSkeleton title="Upcoming Occasions" />}>
          <UpcomingOccasions />
        </Suspense>
        <Suspense fallback={<CardSkeleton title="Price Alerts" />}>
          <PriceAlerts />
        </Suspense>
      </div>

      {/* Activity feed */}
      <Suspense fallback={<CardSkeleton title="Recent Activity" />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function CardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800/60 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

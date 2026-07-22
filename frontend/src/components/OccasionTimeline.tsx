import Link from 'next/link'
import { Gift, ArrowRight, Cake, Sparkles } from 'lucide-react'

interface Occasion {
  id: string
  name: string
  type: 'birthday' | 'event' | 'holiday'
  label: string
  days: number
  date: string
  href: string
}

function occasionIcon(type: string) {
  switch (type) {
    case 'birthday': return '🎂'
    case 'holiday': return '🎄'
    default: return '🎉'
  }
}

function urgencyColor(days: number) {
  if (days <= 7) return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
  if (days <= 30) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
  return 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-950/20 dark:border-brand-900/30 dark:text-brand-400'
}

export default function OccasionTimeline({ occasions }: { occasions: Occasion[] }) {
  if (occasions.length === 0) return null

  return (
    <div className="space-y-2">
      {/* Horizontal scroll on mobile, wrap on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide sm:flex-wrap sm:overflow-visible">
        {occasions.map(o => (
          <Link
            key={o.id}
            href={o.href}
            className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl border snap-start transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${urgencyColor(o.days)}`}
          >
            <span className="text-xl">{occasionIcon(o.type)}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate max-w-[100px]">{o.name}</p>
              <p className="text-[10px] opacity-75">
                {o.label} · {o.days}d
              </p>
            </div>
            <ArrowRight size={12} className="opacity-50 flex-shrink-0" />
          </Link>
        ))}

        {/* Add occasion CTA */}
        <Link
          href="/recipients/new"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 text-gray-400 hover:text-brand-500 transition-all snap-start"
        >
          <Sparkles size={16} />
          <span className="text-xs font-medium">Add</span>
        </Link>
      </div>
    </div>
  )
}

import { TrendingDown } from 'lucide-react'

export function PriceDropBadge({
  currentPrice,
  targetPrice,
}: {
  currentPrice: number
  targetPrice: number
}) {
  if (currentPrice >= targetPrice) return null
  const pct = Math.round(((targetPrice - currentPrice) / targetPrice) * 100)

  return (
    <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
      <TrendingDown size={11} />
      -{pct}% below target
    </span>
  )
}

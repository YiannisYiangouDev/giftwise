'use client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { PriceHistoryRow } from '@/types/rows'

interface Props {
  history: PriceHistoryRow[]
  targetPrice: number | null
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white/95 dark:bg-gray-900/95 border border-gray-100 dark:border-gray-800 p-3 rounded-xl shadow-lg backdrop-blur-sm text-left">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{data.date}</p>
        <p className="text-base font-bold text-brand-500 mt-1">€{data.price.toFixed(2)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Store: {data.store}</p>
      </div>
    )
  }
  return null
}

export default function PriceHistoryChart({ history, targetPrice }: Props) {
  // Sort history chronologically and map to chart format
  const chartData = [...history]
    .sort((a, b) => new Date(a.checked_at).getTime() - new Date(b.checked_at).getTime())
    .map(h => ({
      date: new Date(h.checked_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      price: Number(h.price),
      store: h.store_name,
    }))

  if (chartData.length < 2) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">Need at least 2 price checks to display history trend.</p>
      </div>
    )
  }

  // Calculate chart boundaries
  const prices = chartData.map(d => d.price)
  if (targetPrice !== null) prices.push(targetPrice)
  const minPrice = Math.max(0, Math.min(...prices) * 0.95)
  const maxPrice = Math.max(...prices) * 1.05

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-gray-100 dark:stroke-gray-800/80"
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            dy={8}
            className="text-[10px] fill-gray-400 font-medium"
          />
          <YAxis
            domain={[minPrice, maxPrice]}
            tickLine={false}
            axisLine={false}
            dx={-8}
            tickFormatter={(tick) => `€${tick}`}
            className="text-[10px] fill-gray-400 font-medium"
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Target Price Guide Line */}
          {targetPrice !== null && (
            <ReferenceLine
              y={targetPrice}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Target: €${targetPrice}`,
                position: 'top',
                fill: '#22c55e',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}

          <Area
            type="monotone"
            dataKey="price"
            stroke="#a855f7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#chartGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

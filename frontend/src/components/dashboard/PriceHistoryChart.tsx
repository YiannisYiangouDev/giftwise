'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

type Point = { recorded_at: string; price: number }

export function PriceHistoryChart({
  data,
  targetPrice,
}: {
  data: Point[]
  targetPrice?: number | null
}) {
  const formatted = data.map(p => ({
    date: new Date(p.recorded_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    price: Number(p.price),
  }))

  const prices = data.map(d => Number(d.price))
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const yMin = Math.floor(min * 0.95)
  const yMax = Math.ceil(max * 1.05)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[yMin, yMax]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `\u20AC${v}`}
        />
        <Tooltip
          formatter={(v: number) => [`\u20AC${v.toFixed(2)}`, 'Price']}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 13,
          }}
        />
        {targetPrice != null && (
          <ReferenceLine
            y={targetPrice}
            stroke="#16a34a"
            strokeDasharray="4 2"
            label={{
              value: 'Target',
              position: 'insideTopRight',
              fontSize: 11,
              fill: '#16a34a',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#7c3aed"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

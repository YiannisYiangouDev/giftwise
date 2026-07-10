'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'

interface DataPoint { date: string; price: number; store: string }

export default function PriceHistoryChart({
  data, targetPrice
}: { data: DataPoint[]; targetPrice: number | null }) {
  const min = Math.min(...data.map(d => d.price))
  const max = Math.max(...data.map(d => d.price))
  const padding = (max - min) * 0.15 || 5

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `€${v}`}
          width={52}
        />
        <Tooltip
          formatter={(value: number) => [`€${value}`, 'Price']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
        {targetPrice && (
          <ReferenceLine
            y={targetPrice}
            stroke="#6366f1"
            strokeDasharray="5 5"
            label={{ value: `Target €${targetPrice}`, position: 'insideTopRight', fontSize: 11, fill: '#6366f1' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#f97316"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function BudgetRing({ spent, budget, size = 80 }: { spent: number; budget: number; size?: number }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const pct = Math.min(spent / budget, 1)
  const remaining = budget - spent
  const strokeWidth = 6
  const center = size / 2

  // Color based on budget usage
  const color = pct > 0.9 ? '#ef4444' : pct > 0.7 ? '#f59e0b' : '#10b981'

  return (
    <div className="flex flex-col items-center gap-2" style={{ width: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100 dark:text-gray-800"
        />
        {/* Progress arc */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        {/* Center text */}
        <text
          x={center} y={center + 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold"
          fill="currentColor"
        >
          €{spent.toFixed(0)}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-[10px] text-gray-400 font-medium">
          of €{budget}
        </p>
        {remaining > 0 && (
          <p className="text-[10px] font-semibold" style={{ color }}>
            €{remaining.toFixed(0)} left
          </p>
        )}
      </div>
    </div>
  )
}

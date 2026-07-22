/**
 * GiftWise wordmark logo — the 'i' in "Wise" is a gift box with ribbon and bow.
 * Gold gradient on cream/minimal background. Clean serif typography.
 */
export default function GiftWiseLogo({ size = 40, variant = 'full' }: { size?: number; variant?: 'full' | 'icon' }) {
  // Icon variant: standalone gift box (for favicon, PWA, tight spaces)
  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gold-grad-icon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C5A880" />
            <stop offset="50%" stopColor="#DFC9A4" />
            <stop offset="100%" stopColor="#B5966D" />
          </linearGradient>
        </defs>
        <rect x="8" y="16" width="24" height="18" rx="3" fill="url(#gold-grad-icon)" />
        <rect x="6" y="12" width="28" height="6" rx="2" fill="#DFC9A4" />
        <rect x="17" y="10" width="6" height="26" rx="1" fill="#B5966D" opacity="0.5" />
        <rect x="8" y="22" width="24" height="4" rx="1" fill="#B5966D" opacity="0.5" />
        <ellipse cx="14" cy="10" rx="6" ry="4.5" fill="#DFC9A4" transform="rotate(-20, 14, 10)" />
        <ellipse cx="26" cy="10" rx="6" ry="4.5" fill="#DFC9A4" transform="rotate(20, 26, 10)" />
        <circle cx="20" cy="11" r="2.5" fill="#B5966D" />
      </svg>
    )
  }

  // Full wordmark: the 'i' in "Wise" is the gift box — ribbon wrapping + bow on top

  return (
    <svg width={size * 3.5} height={size} viewBox={`0 0 ${size * 3.5} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C5A880" />
          <stop offset="50%" stopColor="#DFC9A4" />
          <stop offset="100%" stopColor="#B5966D" />
        </linearGradient>
        <linearGradient id="gold-grad-2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B5966D" />
          <stop offset="50%" stopColor="#DFC9A4" />
          <stop offset="100%" stopColor="#C5A880" />
        </linearGradient>
      </defs>

      {/* "Gift" — dark brown/charcoal serif */}
      <text
        x="0"
        y={size * 0.78}
        fontSize={size * 0.64}
        fontWeight="800"
        fill="#3d3226"
        fontFamily="'Playfair Display', Georgia, serif"
        letterSpacing="0"
      >
        Gift
      </text>

      {/* "W" — gold gradient, starts after "Gift" */}
      <text
        x={size * 1.38}
        y={size * 0.78}
        fontSize={size * 0.64}
        fontWeight="800"
        fill="url(#gold-grad)"
        fontFamily="'Playfair Display', Georgia, serif"
        letterSpacing="0"
      >
        W
      </text>

      {/* The 'i' as a gift box — positioned between 'W' and 'se' */}
      <g transform={`translate(${size * 1.85}, ${size * 0.1})`}>
        {/* Gift box body (the 'i' stem) */}
        <rect x="2" y="20" width={size * 0.22} height={size * 0.55} rx="3" fill="url(#gold-grad-2)" />
        {/* Ribbon wrapping vertically */}
        <rect x={size * 0.09} y="14" width={size * 0.08} height={size * 0.65} rx="2" fill="#B5966D" opacity="0.4" />
        {/* Ribbon wrapping horizontally */}
        <rect x="0" y={size * 0.38} width={size * 0.26} height={size * 0.08} rx="2" fill="#B5966D" opacity="0.4" />
        {/* Bow left loop */}
        <ellipse
          cx={size * 0.04} cy="10" rx={size * 0.08} ry={size * 0.07}
          fill="#DFC9A4" transform={`rotate(-25, ${size * 0.04}, 10)`}
        />
        {/* Bow right loop */}
        <ellipse
          cx={size * 0.22} cy="10" rx={size * 0.08} ry={size * 0.07}
          fill="#DFC9A4" transform={`rotate(25, ${size * 0.22}, 10)`}
        />
        {/* Bow center knot */}
        <circle cx={size * 0.13} cy="11" r={size * 0.035} fill="#B5966D" />
      </g>

      {/* "se" — gold gradient, after the 'i' gift box */}
      <text
        x={size * 2.12}
        y={size * 0.78}
        fontSize={size * 0.64}
        fontWeight="800"
        fill="url(#gold-grad-2)"
        fontFamily="'Playfair Display', Georgia, serif"
        letterSpacing="0"
      >
        se
      </text>
    </svg>
  )
}

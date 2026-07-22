'use client'
import { useLinkStatus } from 'next/link'

/**
 * Progress bar for route transitions using Next.js 16 useLinkStatus.
 * Shows a thin gold bar at the top of the page during navigation.
 * Drop this into your layout — no dependencies needed.
 */
export default function ProgressBar() {
  const { pending } = useLinkStatus()

  return (
    <div
      role="progressbar"
      aria-hidden={!pending}
      aria-label="Page loading"
      className="fixed top-0 left-0 z-[200] h-[2px] w-full pointer-events-none"
    >
      <div
        className={`h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-all duration-300 ease-out ${
          pending ? 'opacity-100 animate-shimmer' : 'opacity-0'
        }`}
      />
    </div>
  )
}

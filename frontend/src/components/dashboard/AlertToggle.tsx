'use client'
import { useState, useTransition } from 'react'

export function AlertToggle({
  itemId,
  enabled,
}: {
  itemId: string
  enabled: boolean
}) {
  const [on, setOn] = useState(enabled)
  const [pending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const next = !on
      setOn(next)
      await fetch('/api/price-alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, alert_enabled: next }),
      })
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={on ? 'Disable price alert' : 'Enable price alert'}
      className={[
        'relative w-11 h-6 rounded-full transition-colors',
        on ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700',
        pending ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

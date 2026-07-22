'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  href: string
  icon?: string
  group: string
}

/**
 * ⌘K Command Palette — quick-jump to any page, recipient, or wishlist.
 * Press ⌘K (Mac) or Ctrl+K (Windows) to open.
 * Type to fuzzy-filter. Enter to navigate. Esc to close.
 */
export default function CommandPalette({ items }: { items: PaletteItem[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const router = useRouter()

  const filtered = items.filter(
    i => i.label.toLowerCase().includes(query.toLowerCase())
  )

  // Reset on close
  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setSelected(0)
  }, [])

  // Navigate
  const navigate = useCallback((href: string) => {
    close()
    router.push(href)
  }, [close, router])

  // Keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape' && open) {
        close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  // Arrow key navigation
  useEffect(() => {
    function handleArrow(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected(s => Math.min(s + 1, filtered.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected(s => Math.max(s - 1, 0))
      }
      if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault()
        navigate(filtered[selected].href)
      }
    }
    window.addEventListener('keydown', handleArrow)
    return () => window.removeEventListener('keydown', handleArrow)
  }, [open, filtered, selected, navigate])

  if (!open) return null

  const groups = [...new Set(filtered.map(i => i.group))]

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] bg-black/30 backdrop-blur-sm animate-in fade-in duration-200" onClick={close}>
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Jump to a page, recipient, or wishlist..."
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none placeholder-gray-400"
          />
          <kbd className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No results for "{query}"</p>
          )}

          {groups.map(group => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-4 py-2">{group}</p>
              {filtered.filter(i => i.group === group).map((item, idx) => {
                const globalIdx = filtered.indexOf(item)
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left ${
                      globalIdx === selected
                        ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="text-base">{item.icon || '📄'}</span>
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{item.href}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-400">
          <span><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">↑↓</kbd> Navigate</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">↵</kbd> Open</span>
          <span><kbd className="bg-gray-100 dark:bg-gray-800 px-1 rounded">esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}

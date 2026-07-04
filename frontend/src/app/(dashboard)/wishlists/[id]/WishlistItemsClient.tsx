'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Package, Plus, Trash2, ExternalLink, Loader2, ImageOff, ChevronDown, TrendingDown, History, X } from 'lucide-react'
import type { Database } from '@/types/database'

type Item = Database['public']['Tables']['wishlist_items']['Row']
type Status = Item['status']
type PriceHistory = Database['public']['Tables']['price_history']['Row']

const STATUS_LABELS: Record<Status, string> = {
  wanted: 'Wanted',
  claimed: 'Claimed',
  purchased: 'Purchased',
  received: 'Received',
}
const STATUS_COLORS: Record<Status, string> = {
  wanted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  claimed: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  purchased: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export default function WishlistItemsClient({
  wishlistId,
  initialItems,
}: {
  wishlistId: string
  initialItems: Item[]
}) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-6">
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={id => setItems(prev => prev.filter(i => i.id !== id))}
              onStatusChange={(id, status) =>
                setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i))
              }
            />
          ))}
        </div>
      ) : (
        !showAdd && (
          <div className="text-center py-16 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-30"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <p className="text-sm">No items yet.</p>
            <button onClick={() => setShowAdd(true)} className="text-brand-500 text-sm hover:underline mt-1 inline-block">
              Add your first item →
            </button>
          </div>
        )
      )}

      {showAdd ? (
        <AddItemForm
          wishlistId={wishlistId}
          onAdd={item => { setItems(prev => [...prev, item]); setShowAdd(false) }}
          onCancel={() => setShowAdd(false)}
        />
      ) : (
        items.length > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-brand-400 hover:text-brand-500 transition w-full justify-center"
          >
            <Plus size={16} /> Add item
          </button>
        )
      )}
    </div>
  )
}

// ─── Item Card ───────────────────────────────────────────────────────────────
function ItemCard({ item, onDelete, onStatusChange }: {
  item: Item
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Status) => void
}) {
  const [imgError, setImgError] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<PriceHistory[] | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('wishlist_items').delete().eq('id', item.id)
    onDelete(item.id)
  }

  async function handleStatusChange(status: Status) {
    setUpdatingStatus(true)
    const supabase = createClient()
    await supabase.from('wishlist_items').update({ status }).eq('id', item.id)
    onStatusChange(item.id, status)
    setUpdatingStatus(false)
  }

  async function handleOpenHistory() {
    if (history !== null) { setShowHistory(true); return }
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_id', item.id)
      .order('checked_at', { ascending: false })
      .limit(10)
    setHistory(data ?? [])
    setLoadingHistory(false)
    setShowHistory(true)
  }

  const belowTarget =
    item.target_price != null &&
    item.current_best_price != null &&
    item.current_best_price <= item.target_price

  // Detect price drop: compare last two history entries (only if history loaded)
  const lastChecked = (item as any).last_checked_at as string | null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col relative">
      {/* Price drop banner */}
      {belowTarget && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold">
          <TrendingDown size={13} /> Price at target!
        </div>
      )}

      {/* Image */}
      <div className="aspect-video bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        {item.image_url && !imgError ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-full h-full object-contain p-2"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff size={32} className="text-gray-300 dark:text-gray-600" />
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="font-medium text-sm leading-snug line-clamp-2">{item.product_name}</p>

        {/* Prices */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.current_best_price != null && (
            <span className={`text-sm font-bold tabular-nums ${
              belowTarget ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'
            }`}>
              €{item.current_best_price.toFixed(2)}
            </span>
          )}
          {item.target_price != null && (
            <span className="text-xs text-gray-400">target €{item.target_price.toFixed(2)}</span>
          )}
        </div>

        {/* Status dropdown */}
        <div className="relative mt-auto pt-2">
          <div className="flex items-center gap-2">
            <select
              value={item.status}
              disabled={updatingStatus}
              onChange={e => handleStatusChange(e.target.value as Status)}
              className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none pr-6 ${STATUS_COLORS[item.status]}`}
            >
              {(Object.keys(STATUS_LABELS) as Status[]).map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <ChevronDown size={10} className="-ml-5 pointer-events-none text-gray-400" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between gap-2 border-t border-gray-50 dark:border-gray-800 pt-2">
        <div className="flex items-center gap-3">
          {item.product_url ? (
            <a href={item.product_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-brand-500 hover:underline">
              View store <ExternalLink size={11} />
            </a>
          ) : <span />}
          {item.product_url && (
            <button
              onClick={handleOpenHistory}
              disabled={loadingHistory}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              aria-label="Price history"
            >
              {loadingHistory ? <Loader2 size={11} className="animate-spin" /> : <History size={11} />}
              History
            </button>
          )}
        </div>
        <button onClick={handleDelete} disabled={deleting} aria-label="Delete item"
          className="text-gray-300 hover:text-red-400 transition disabled:opacity-50">
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>

      {/* Price history drawer */}
      {showHistory && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-xl p-4 flex flex-col gap-3 z-10 overflow-auto">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Price history</p>
            <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <X size={15} />
            </button>
          </div>
          {history && history.length > 0 ? (
            <ul className="space-y-2">
              {history.map(h => (
                <li key={h.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{h.store_name}</p>
                    <p className="text-gray-400">
                      {h.checked_at ? new Date(h.checked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold tabular-nums ${
                      item.target_price && h.price <= item.target_price
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      €{h.price.toFixed(2)}
                    </p>
                    {!h.in_stock && <p className="text-red-400">Out of stock</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 text-center py-4">
              No price history yet. Prices are checked daily.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add Item Form ───────────────────────────────────────────────────────────
function AddItemForm({ wishlistId, onAdd, onCancel }: {
  wishlistId: string
  onAdd: (item: Item) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeError, setScrapeError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ product_name: '', product_url: '', image_url: '', target_price: '', notes: '' })
  const urlRef = useRef<HTMLInputElement>(null)

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleScrape() {
    if (!url.trim()) return
    setScraping(true)
    setScrapeError(null)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${supabaseUrl}/functions/v1/scrape-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scrape failed')
      setForm({ product_name: data.product_name ?? '', product_url: url.trim(), image_url: data.image_url ?? '', target_price: data.price != null ? String(data.price) : '', notes: '' })
    } catch (err) {
      setScrapeError(String(err))
      setForm(prev => ({ ...prev, product_url: url.trim() }))
    } finally {
      setScraping(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.product_name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: inserted, error } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlistId,
        product_name: form.product_name.trim(),
        product_url: form.product_url.trim() || url.trim(),
        image_url: form.image_url.trim() || null,
        target_price: form.target_price ? Number(form.target_price) : null,
        notes: form.notes.trim() || null,
        status: 'wanted',
        currency: 'EUR',
      })
      .select('*')
      .single()
    if (error || !inserted) { setScrapeError(error?.message ?? 'Failed to save'); setSaving(false); return }
    onAdd(inserted)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-brand-200 dark:border-brand-800 p-5 space-y-4">
      <h3 className="font-semibold text-sm">Add item</h3>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Product URL</label>
        <div className="flex gap-2">
          <input ref={urlRef} type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://www.skroutz.cy/…"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="button" onClick={handleScrape} disabled={scraping || !url.trim()}
            className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0">
            {scraping ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}
            {scraping ? 'Fetching…' : 'Fetch'}
          </button>
        </div>
        {scrapeError && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Couldn’t auto-fill — fill in manually below.</p>}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
          <input required value={form.product_name} onChange={e => setField('product_name', e.target.value)}
            placeholder="e.g. Sony WH-1000XM5"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {form.image_url && (
          <div className="flex items-center gap-3">
            <img src={form.image_url} alt="" className="w-14 h-14 object-contain rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800" />
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
              <input value={form.image_url} onChange={e => setField('image_url', e.target.value)}
                className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target price (€)</label>
          <input type="number" min="0" step="0.01" value={form.target_price} onChange={e => setField('target_price', e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
          <input value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Colour, size, variant…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving || !form.product_name.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Saving…' : 'Add to list'}
          </button>
        </div>
      </form>
    </div>
  )
}

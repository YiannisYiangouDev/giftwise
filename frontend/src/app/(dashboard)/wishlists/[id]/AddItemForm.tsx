'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Link2, Plus, Loader2 } from 'lucide-react'

export default function AddItemForm({ wishlistId }: { wishlistId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [url, setUrl] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped] = useState<{ product_name: string; image_url: string; current_best_price: string } | null>(null)
  const [targetPrice, setTargetPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function scrapeUrl() {
    if (!url.trim()) return
    setScraping(true)
    setError(null)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Scrape failed')
      setScraped(data)
      setTargetPrice(data.current_best_price ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to scrape URL')
    } finally {
      setScraping(false)
    }
  }

  async function addItem() {
    if (!scraped) return
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('wishlist_items').insert({
      wishlist_id: wishlistId,
      product_name: scraped.product_name,
      product_url: url,
      image_url: scraped.image_url || null,
      current_best_price: parseFloat(scraped.current_best_price) || null,
      target_price: parseFloat(targetPrice) || null,
      currency: 'EUR',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setUrl('')
    setScraped(null)
    setTargetPrice('')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
      <h2 className="font-semibold">Add Product by URL</h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="flex gap-2">
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && scrapeUrl()}
          placeholder="Paste a product URL (Skroutz, Electroline, Stephanis…)"
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button onClick={scrapeUrl} disabled={scraping || !url.trim()}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2">
          {scraping ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
          {scraping ? 'Fetching…' : 'Fetch'}
        </button>
      </div>

      {scraped && (
        <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 flex gap-4 items-start">
          {scraped.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scraped.image_url} alt={scraped.product_name} className="w-16 h-16 object-cover rounded-lg border border-gray-100 dark:border-gray-800" />
          )}
          <div className="flex-1 space-y-2">
            <p className="font-medium text-sm">{scraped.product_name}</p>
            {scraped.current_best_price && (
              <p className="text-xs text-gray-500">Current price: €{scraped.current_best_price}</p>
            )}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Target price (€):</label>
              <input
                type="number"
                value={targetPrice}
                onChange={e => setTargetPrice(e.target.value)}
                className="w-24 px-2 py-1 border border-gray-200 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <button onClick={addItem} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition disabled:opacity-50 self-center">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
      )}
    </div>
  )
}

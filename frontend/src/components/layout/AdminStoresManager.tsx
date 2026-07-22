'use client'
import { useState } from 'react'
import { Store, Plus, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface TrackedStore {
  id: string
  name: string
  base_url: string
  country: string
  scraper_type: string
  scraper_config: any
  is_active: boolean
}

export default function AdminStoresManager({ initialStores }: { initialStores: TrackedStore[] }) {
  const [stores, setStores] = useState<TrackedStore[]>(initialStores)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState<string | null>(null) // store ID
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [country, setCountry] = useState('CY')
  const [scraperType, setScraperType] = useState('playwright')
  const [scraperConfig, setScraperConfig] = useState('')

  const { toast } = useToast()

  async function handleToggle(id: string, currentStatus: boolean) {
    setLoading(id)
    setError(null)
    const newStatus = !currentStatus

    try {
      const res = await fetch('/api/admin/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: newStatus })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update store status')
      }

      setStores(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s))
      toast(`Store status updated to ${newStatus ? 'Active' : 'Inactive'}!`)
    } catch (err: any) {
      setError(err.message)
      toast(err.message || 'Error updating store status')
    } finally {
      setLoading(null)
    }
  }

  async function handleAddStore(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !baseUrl.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          base_url: baseUrl,
          country,
          scraper_type: scraperType,
          scraper_config: scraperConfig
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add store')
      }

      setStores(prev => [...prev, data.store].sort((a, b) => a.name.localeCompare(b.name)))
      toast('E-Commerce store added successfully!')

      // Reset form
      setName('')
      setBaseUrl('')
      setCountry('CY')
      setScraperType('playwright')
      setScraperConfig('')
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-200/60 dark:border-gray-800/40 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Store size={16} className="text-brand-500" />
          Tracked E-Commerce Stores
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/85 dark:bg-brand-950/40 dark:hover:bg-brand-900/60 px-2 py-1 rounded transition"
        >
          <Plus size={13} />
          {showAddForm ? 'Cancel' : 'Add Store'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2.5 flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Store Form */}
      {showAddForm && (
        <form onSubmit={handleAddStore} className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 rounded-xl space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Store Name</label>
              <input
                type="text" required placeholder="e.g. Electroline" value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Base URL</label>
              <input
                type="url" required placeholder="e.g. https://www.electroline.com.cy" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Country / Region</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="CY">Cyprus (CY)</option>
                <option value="GR">Greece (GR)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Scraper Engine</label>
              <select value={scraperType} onChange={e => setScraperType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none">
                <option value="playwright">Playwright SSR (Static/Dynamic)</option>
                <option value="woocommerce">WooCommerce (REST API)</option>
                <option value="shopify">Shopify (Products JSON)</option>
                <option value="apify">Apify Cloud Agent</option>
                <option value="firecrawl">Firecrawl (AI Parsing)</option>
                <option value="custom">Custom CSS Selectors</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">
              Scraper Config (JSON / Selectors - Optional)
            </label>
            <textarea
              placeholder='e.g. {"selectors": {"price": ".product-price", "name": "h1"}}'
              value={scraperConfig} onChange={e => setScraperConfig(e.target.value)} rows={2}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="px-4 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={12} className="animate-spin" />}
            Save E-Commerce Store
          </button>
        </form>
      )}

      {/* Stores List */}
      <div className="overflow-x-auto max-h-[340px] overflow-y-auto pr-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-medium">
              <th className="py-2">Store</th>
              <th className="py-2">Region</th>
              <th className="py-2">Engine</th>
              <th className="py-2 text-right">Status / Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50 dark:divide-gray-800/50 text-gray-600 dark:text-gray-400">
            {stores.map((s, i) => (
              <tr key={s.id || i} className="group">
                <td className="py-2.5 font-medium text-gray-900 dark:text-gray-200">
                  <a href={s.base_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                    {s.name}
                  </a>
                </td>
                <td className="py-2.5 font-mono">{s.country || 'CY'}</td>
                <td className="py-2.5 font-mono text-[10px] bg-gray-50 dark:bg-gray-800/30 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-800 inline-block mt-1">
                  {s.scraper_type}
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                      s.is_active 
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-150 dark:border-green-800/40' 
                        : 'bg-gray-100 dark:bg-gray-850 text-gray-450 dark:text-gray-500'
                    }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      disabled={loading === s.id}
                      onClick={() => handleToggle(s.id, s.is_active)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition ${
                        s.is_active 
                          ? 'border-red-200 dark:border-red-900/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
                          : 'border-green-200 dark:border-green-900/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20'
                      }`}
                    >
                      {loading === s.id ? (
                        <Loader2 size={10} className="animate-spin inline" />
                      ) : s.is_active ? (
                        'Disable'
                      ) : (
                        'Enable'
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400 italic">No tracked stores found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SafeImage from '@/components/SafeImage'
import { Loader2, Search, Link2, ShoppingBag, ExternalLink, Image as ImageIcon, Upload, Camera, Sparkles } from 'lucide-react'
import { sanitize, sanitizeOptional } from '@/lib/sanitize'
import { useToast } from '@/components/Toast'

function generatePresetGiftImage(productName: string): string {
  const colors = [
    ['#c5a880', '#533e2d'],
    ['#8b5cf6', '#4c1d95'],
    ['#10b981', '#064e3b'],
    ['#3b82f6', '#1e3a8a'],
    ['#ec4899', '#831843'],
  ]
  const idx = Math.abs(productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length
  const [c1, c2] = colors[idx]
  const initial = (productName.trim().charAt(0) || 'G').toUpperCase()
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="200" height="200" rx="40" fill="url(#g)"/><circle cx="100" cy="100" r="70" fill="white" fill-opacity="0.12"/><text x="100" y="118" font-family="system-ui, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">${initial}</text></svg>`
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface ProductResult {
  name: string
  price: number | null
  currency: string
  url: string
  image: string | null
  store: string
}

export default function AddItemForm({ wishlistId }: { wishlistId: string }) {
  const [mode, setMode] = useState<'url' | 'search'>('search')
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [targetPrice, setTargetPrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  async function handleFetch() {
    if (!url.trim()) return
    setFetching(true)
    setError(null)

    // Clean URL if shared text was pasted
    const match = url.match(/https?:\/\/[^\s"'<>\(\)]+/i)
    const cleanUrl = match ? match[0] : url.trim()
    setUrl(cleanUrl)

    let productName = ''
    let price: number | null = null
    let imgUrl: string | null = null

    try {
      const res = await fetch(`/api/fetch-product?url=${encodeURIComponent(cleanUrl)}`)
      if (res.ok) {
        const data = await res.json()
        productName = data.name || ''
        if (data.price) price = data.price
        if (data.image_url) imgUrl = data.image_url
      }
    } catch {
      // Fallback — extract slug from URL
      try {
        const pathParts = new URL(url).pathname.split('/')
        productName = pathParts[pathParts.length - 1].replace(/[-_]/g, ' ').slice(0, 200) || productName
      } catch {}
    }

    if (productName) setName(productName)
    if (imgUrl) setImageUrl(imgUrl)
    if (price && !targetPrice) setTargetPrice(price.toString())
    setFetching(false)
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)
    setResults([])

    try {
      // Search via our own API route (avoids CORS)
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        const suggestions = data?.suggestions || data || []
        const sr: ProductResult[] = suggestions.slice(0, 8).map((s: any) => ({
          name: s.name || s.title || s.label || s,
          price: s.price ? parseFloat(s.price) : null,
          currency: 'EUR',
          url: s.url || `https://www.skroutz.${s.store?.toLowerCase()?.includes('gr') ? 'gr' : 'cy'}/search?keyphrase=${encodeURIComponent(s.name || s)}`,
          image: s.image_url || s.image || null,
          store: s.store || s.shop_name || s.shop || 'Skroutz.cy',
        }))
        setResults(sr)
      }
    } catch {
      // Skroutz API down — provide a manual entry option
    }

    // Always add a "manual entry" result
    setResults(prev => [...prev, {
      name: searchQuery,
      price: null,
      currency: 'EUR',
      url: '',
      image: null,
      store: 'Manual entry',
    }])

    setSearching(false)
  }

  function pickResult(r: ProductResult) {
    setName(r.name)
    setUrl(r.url)
    setImageUrl(r.image)
    if (r.price && !targetPrice) setTargetPrice(r.price.toString())
    setMode('url')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase.from('wishlist_items').insert({
      wishlist_id: wishlistId,
      product_name: sanitize(name),
      product_url: url || null,
      image_url: imageUrl,
      target_price: targetPrice ? Math.min(999999.99, Math.max(0, parseFloat(parseFloat(targetPrice).toFixed(2)))) : null,
      current_best_price: null,
    })

    if (insertError) {
      setError(insertError.message)
    } else {
      setUrl('')
      setName('')
      setImageUrl(null)
      setTargetPrice('')
      setSearchQuery('')
      setResults([])
      router.refresh()
      toast('Item added!')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button type="button" onClick={() => setMode('search')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
            mode === 'search' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600' : 'text-gray-500'
          }`}>
          <Search size={13} className="inline mr-1" /> Search by name
        </button>
        <button type="button" onClick={() => setMode('url')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
            mode === 'url' ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-600' : 'text-gray-500'
          }`}>
          <Link2 size={13} className="inline mr-1" /> Paste URL
        </button>
      </div>

      {/* Search mode */}
      {mode === 'search' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Search product on Skroutz.cy…"
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button type="button" onClick={handleSearch} disabled={searching || !searchQuery}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium disabled:opacity-40 flex items-center gap-1.5">
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>

          {/* Search results */}
          {results.length > 0 && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {results.map((r, i) => (
                <button key={i} type="button" onClick={() => pickResult(r)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition group">
                  {r.image ? (
                    <SafeImage src={r.image} alt={r.name} width={40} height={40} className="object-cover rounded flex-shrink-0" />
                  ) : (
                    <ShoppingBag size={18} className="text-gray-300 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.store}
                      {r.price ? ` · €${r.price}` : ''}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-gray-300 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* URL mode / final form */}
      {(mode === 'url' || name) && (
        <form onSubmit={handleAdd} className="space-y-3">
          {mode === 'url' && (
            <div className="flex gap-2">
              <input
                type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="Paste product URL from any store…"
                className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <button type="button" onClick={handleFetch} disabled={fetching || !url}
                className="px-4 py-2 border border-brand-500 text-brand-500 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition text-sm font-medium disabled:opacity-40 flex items-center gap-1.5">
                {fetching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Fetch
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="Product name"
              className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <input
              type="number" step="0.01" min="0" value={targetPrice} onChange={e => setTargetPrice(e.target.value)}
              placeholder="Target €"
              className="w-28 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={imageUrl || ''}
                onChange={e => setImageUrl(e.target.value || null)}
                placeholder="Image URL (or upload photo)"
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500 outline-none text-gray-600 dark:text-gray-300"
              />
              <ImageIcon className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            </div>
            
            <label className="p-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer text-gray-500 hover:text-brand-500 transition flex items-center justify-center flex-shrink-0" title="Upload Photo from Device">
              <Upload size={14} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 5 * 1024 * 1024) {
                    toast('Image file must be under 5MB', 'error')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setImageUrl(reader.result)
                    }
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  toast('Enter a product title first to generate AI gift art.', 'error')
                  return
                }
                const presetImg = generatePresetGiftImage(name)
                setImageUrl(presetImg)
                toast('Generated luxury AI gift art image!')
              }}
              className="p-2 border border-brand-500/30 bg-brand-50/50 dark:bg-brand-950/20 text-brand-500 hover:bg-brand-100/50 rounded-lg transition flex items-center justify-center flex-shrink-0"
              title="Generate Luxury AI Gift Art"
            >
              <Sparkles size={14} />
            </button>

            {imageUrl && (
              <SafeImage
                src={imageUrl}
                alt="Image Preview"
                width={36}
                height={36}
                className="object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            )}
          </div>
          <button type="submit" disabled={loading}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Adding…' : 'Add Item'}
          </button>
        </form>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
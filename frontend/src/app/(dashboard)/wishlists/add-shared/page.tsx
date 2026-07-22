'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import SafeImage from '@/components/SafeImage'
import { Share2, Gift, Plus, Loader2, Check, ExternalLink, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/Toast'

function SharedProductContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [rawUrl, setRawUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [wishlists, setWishlists] = useState<any[]>([])
  const [selectedWishlistId, setSelectedWishlistId] = useState('')
  
  // Form fields
  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // 1. Parse query parameters and extract valid product URL
  useEffect(() => {
    const paramUrl = searchParams.get('url') || ''
    const paramText = searchParams.get('text') || ''
    const paramTitle = searchParams.get('title') || ''

    const combinedText = `${paramUrl} ${paramText} ${paramTitle}`.trim()
    const urlMatch = combinedText.match(/https?:\/\/[^\s"']+/i)

    if (urlMatch && urlMatch[0]) {
      const extracted = urlMatch[0]
      setTargetUrl(extracted)
      setRawUrl(extracted)
      fetchProductDetails(extracted)
    }
  }, [searchParams])

  // 2. Fetch user wishlists
  useEffect(() => {
    async function loadWishlists() {
      const { data } = await supabase
        .from('wishlists')
        .select('id, title, recipients(name)')
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setWishlists(data)
        setSelectedWishlistId(data[0].id)
      }
    }
    loadWishlists()
  }, [])

  // Fetch product metadata via backend FlareSolverr scraper
  async function fetchProductDetails(urlToFetch: string) {
    setFetching(true)
    try {
      const res = await fetch(`/api/fetch-product?url=${encodeURIComponent(urlToFetch)}`)
      const data = await res.json()

      if (data.name) setProductName(data.name)
      if (data.price) setProductPrice(String(data.price))
      if (data.image_url) setImageUrl(data.image_url)
    } catch (err) {
      console.error('Error fetching shared product:', err)
    } finally {
      setFetching(false)
    }
  }

  // Handle Save Gift
  async function handleAddGift() {
    if (!selectedWishlistId) {
      toast('Please select a wishlist.', 'error')
      return
    }

    if (!productName.trim()) {
      toast('Please enter a product name.', 'error')
      return
    }

    setSaving(true)
    try {
      const priceNum = productPrice ? parseFloat(productPrice) : null
      const targetNum = targetPrice ? parseFloat(targetPrice) : null

      const { error } = await supabase.from('wishlist_items').insert({
        wishlist_id: selectedWishlistId,
        product_name: productName.trim(),
        product_url: targetUrl || null,
        image_url: imageUrl || null,
        current_best_price: priceNum,
        target_price: targetNum,
        notes: notes.trim() || null,
        status: 'wanted',
      })

      if (error) throw error

      toast(`Added "${productName}" to wishlist!`)
      router.push(`/wishlists/${selectedWishlistId}`)
    } catch (err: any) {
      toast(`Error adding gift: ${err.message || err}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500 border border-brand-500/20">
          <Share2 size={24} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Shared Gift</h1>
            <Sparkles size={16} className="text-lux-gold" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Save product links directly from Skroutz, Electroline, Amazon & other stores.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
        {fetching && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs z-10 flex flex-col items-center justify-center gap-3 animate-in fade-in">
            <Loader2 size={32} className="animate-spin text-brand-500" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Scraping gift details & image...</p>
          </div>
        )}

        {/* Product Preview Thumbnail */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-md">
            <SafeImage src={imageUrl} alt={productName || 'Product Preview'} fill className="object-cover" />
          </div>
        </div>

        {/* Target URL */}
        {targetUrl && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 truncate mr-2">{targetUrl}</span>
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600 flex items-center gap-1 font-medium flex-shrink-0">
              <ExternalLink size={12} /> Visit
            </a>
          </div>
        )}

        {/* Wishlist Dropdown */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
            Assign to Wishlist
          </label>
          <select
            value={selectedWishlistId}
            onChange={e => setSelectedWishlistId(e.target.value)}
            className="input !py-2.5 !text-sm w-full"
          >
            {wishlists.map(w => (
              <option key={w.id} value={w.id}>
                {w.title} {w.recipients?.name ? `(${w.recipients.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Product Name */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
            Product Title
          </label>
          <input
            type="text"
            value={productName}
            onChange={e => setProductName(e.target.value)}
            placeholder="e.g. Sony PlayStation 5 Pro"
            className="input !py-2.5 !text-sm w-full"
          />
        </div>

        {/* Price & Target Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
              Current Price (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={productPrice}
              onChange={e => setProductPrice(e.target.value)}
              placeholder="e.g. 799.00"
              className="input !py-2 !text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
              Target Price (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              placeholder="e.g. 749.00"
              className="input !py-2 !text-sm w-full"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
            Notes / Size / Color
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Preferred color: Black"
            className="input !py-2 !text-sm w-full"
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/wishlists')}
            className="btn-secondary !py-2.5 !px-4 !text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddGift}
            disabled={saving || fetching}
            className="btn-primary !py-2.5 !px-5 !text-xs shadow-md shadow-brand-500/20"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Plus size={14} /> Add Gift to Wishlist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SharedProductPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 size={24} className="animate-spin text-brand-500" />
      </div>
    }>
      <SharedProductContent />
    </Suspense>
  )
}

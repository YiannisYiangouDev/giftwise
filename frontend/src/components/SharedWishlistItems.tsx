'use client'
import { useState, useEffect } from 'react'
import { Gift, CheckCircle, ExternalLink, X, User, Undo, HelpCircle, Search, SlidersHorizontal } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { WishlistItemRow } from '@/types/rows'
import { useToast } from '@/components/Toast'
import SafeImage from '@/components/SafeImage'

interface Props {
  initialItems: WishlistItemRow[]
  wishlistId: string
}

export default function SharedWishlistItems({ initialItems, wishlistId }: Props) {
  const [items, setItems] = useState<WishlistItemRow[]>(initialItems)
  const [selectedItem, setSelectedItem] = useState<WishlistItemRow | null>(null)
  const [claimName, setClaimName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null) // Item ID currently updating
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; name?: string } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'wanted' | 'claimed' | 'purchased'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')

  const supabase = createClient()
  const { toast } = useToast()

  // Load current user on mount to pre-fill their name
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0],
        })
      }
    }
    getUser()
  }, [])

  // Subscribe to realtime item changes (claims/unclaims)
  useEffect(() => {
    const channel = supabase
      .channel(`realtime_wishlist_items:${wishlistId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wishlist_items',
          filter: `wishlist_id=eq.${wishlistId}`,
        },
        (payload) => {
          const updatedItem = payload.new as WishlistItemRow
          setItems(prev =>
            prev.map(i =>
              i.id === updatedItem.id ? { ...i, ...updatedItem } : i
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [wishlistId])

  // Open claim modal
  function openClaimModal(item: WishlistItemRow) {
    setSelectedItem(item)
    // Pre-fill name from logged-in user or localStorage
    const savedName = localStorage.getItem('giftwise_claimant_name') || ''
    setClaimName(currentUser?.name || savedName || '')
    setIsModalOpen(true)
  }

  // Handle Confirm Claim
  async function handleConfirmClaim() {
    if (!selectedItem) return
    const name = claimName.trim()
    if (!name) {
      toast('Please enter your name.')
      return
    }

    setLoading(selectedItem.id)
    setIsModalOpen(false)

    // Save name to localStorage for future claims
    localStorage.setItem('giftwise_claimant_name', name)

    try {
      const updateData: any = {
        status: 'claimed',
        claimed_by_name: name,
        claimed_at: new Date().toISOString(),
      }

      if (currentUser) {
        updateData.claimed_by = currentUser.id
      } else {
        updateData.claimed_by = null
      }

      const { error } = await supabase
        .from('wishlist_items')
        .update(updateData)
        .eq('id', selectedItem.id)

      if (error) throw error

      setItems(prev =>
        prev.map(item =>
          item.id === selectedItem.id
            ? { ...item, ...updateData }
            : item
        )
      )
      toast(`Gift "${selectedItem.product_name}" claimed successfully!`)
    } catch (err: any) {
      toast(`Error claiming gift: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(null)
      setSelectedItem(null)
    }
  }

  // Handle Unclaim / Release
  async function handleReleaseClaim(item: WishlistItemRow) {
    if (!confirm(`Are you sure you want to release the claim on "${item.product_name}"?`)) return

    setLoading(item.id)
    try {
      const updateData = {
        status: 'wanted' as const,
        claimed_by: null,
        claimed_by_name: null,
        claimed_at: null,
      }

      const { error } = await supabase
        .from('wishlist_items')
        .update(updateData)
        .eq('id', item.id)

      if (error) throw error

      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, ...updateData }
            : i
        )
      )
      toast(`Released claim on "${item.product_name}".`)
    } catch (err: any) {
      toast(`Error: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(null)
    }
  }

  // Handle Purchase
  async function handleMarkAsPurchased(item: WishlistItemRow) {
    setLoading(item.id)
    try {
      const updateData = {
        status: 'purchased' as const,
      }

      const { error } = await supabase
        .from('wishlist_items')
        .update(updateData)
        .eq('id', item.id)

      if (error) throw error

      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'purchased' as const }
            : i
        )
      )
      toast(`Marked "${item.product_name}" as purchased! Thank you!`)
    } catch (err: any) {
      toast(`Error: ${err.message || 'Unknown error'}`)
    } finally {
      setLoading(null)
    }
  }

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      const priceA = a.current_best_price ?? 0
      const priceB = b.current_best_price ?? 0
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Search and Filters Controls */}
      <div className="glass p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="input pl-10 !py-2 !text-xs w-full"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>

        <div className="flex w-full md:w-auto gap-3 items-center justify-end">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <SlidersHorizontal size={14} />
            <span>Filter:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="input !py-1.5 !px-3 !text-xs !w-auto bg-transparent border-gray-200"
          >
            <option value="all">All Statuses</option>
            <option value="wanted">Wanted</option>
            <option value="claimed">Claimed</option>
            <option value="purchased">Purchased</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="input !py-1.5 !px-3 !text-xs !w-auto bg-transparent border-gray-200"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredItems.map(item => {
          const isUpdating = loading === item.id
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition hover:shadow-md"
            >
              {/* Product Image */}
              <SafeImage
                src={item.image_url}
                alt={item.product_name}
                width={80}
                height={80}
                className="object-cover rounded-xl border border-gray-100 dark:border-gray-800 flex-shrink-0"
              />

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base leading-tight">
                  {item.product_name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-gray-500">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-200">
                    {item.current_best_price ? `€${item.current_best_price}` : 'Price not tracked'}
                  </span>
                  {item.target_price && (
                    <span className="text-brand-500 dark:text-brand-400">Target: €{item.target_price}</span>
                  )}
                  {/* Status Badges */}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'wanted'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : item.status === 'claimed'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                        : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    }`}
                  >
                    {item.status === 'wanted' && 'Wanted'}
                    {item.status === 'claimed' && `Claimed by ${item.claimed_by_name || 'Guest'}`}
                    {item.status === 'purchased' && `Purchased${item.claimed_by_name ? ` by ${item.claimed_by_name}` : ''}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end items-center border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0 flex-shrink-0">
                {/* Product link */}
                {item.product_url && (
                  <a
                    href={item.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    title="View Store Page"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}

                {/* Status Actions */}
                {item.status === 'wanted' && (
                  <button
                    onClick={() => openClaimModal(item)}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-sm"
                  >
                    <Gift size={14} />
                    Claim Gift
                  </button>
                )}

                {item.status === 'claimed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAsPurchased(item)}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition shadow-sm"
                    >
                      <CheckCircle size={14} />
                      Mark Purchased
                    </button>
                    <button
                      onClick={() => handleReleaseClaim(item)}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 rounded-lg text-sm font-medium transition"
                    >
                      <Undo size={14} />
                      Release
                    </button>
                  </div>
                )}

                {item.status === 'purchased' && (
                  <button
                    onClick={() => handleReleaseClaim(item)}
                    disabled={isUpdating}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 rounded-lg text-sm font-medium transition"
                  >
                    <Undo size={14} />
                    Release
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400">
            <HelpCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-sm">
              {searchQuery || statusFilter !== 'all' ? 'No items match your filters.' : 'No items in this wishlist yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Claim Dialog Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Gift className="text-brand-500" size={20} />
              Claim Gift
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Enter your name so the family knows you are purchasing{' '}
              <strong className="text-gray-900 dark:text-gray-100 font-semibold">
                "{selectedItem.product_name}"
              </strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={claimName}
                  onChange={e => setClaimName(e.target.value)}
                  placeholder="Family members or friends"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClaim}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
                >
                  Confirm Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

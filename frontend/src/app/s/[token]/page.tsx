import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gift, ExternalLink } from 'lucide-react'

interface Props { params: Promise<{ token: string }> }

export default async function SharedWishlistPage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipients(name, relationship)')
    .eq('share_token', token)
    .eq('is_public', true)
    .single()

  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', wishlist.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl mb-4">
            <Gift size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{wishlist.title}</h1>
          <p className="text-gray-500">
            {(wishlist.recipients as any)?.name}&apos;s Wishlist
            {wishlist.occasion && ` · ${wishlist.occasion}`}
          </p>
        </div>

        <div className="space-y-3">
          {items?.map(item => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border flex items-center gap-4">
              {item.image_url && <img src={item.image_url} alt={item.product_name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.product_name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{item.current_best_price ? `€${item.current_best_price}` : '—'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${
                    item.status === 'wanted' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'claimed' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'purchased' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{item.status}</span>
                </div>
              </div>
              {item.product_url && (
                <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-500 flex-shrink-0">
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          ))}
          {(!items || items.length === 0) && <p className="text-center py-16 text-gray-400">No items yet.</p>}
        </div>
      </div>
    </div>
  )
}

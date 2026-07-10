import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Gift } from 'lucide-react'
import ClaimButton from './ClaimButton'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('wishlists')
    .select('title, recipient:recipients(name)')
    .eq('id', params.id)
    .eq('is_public', true)
    .single()
  if (!data) return {}
  return {
    title: data.title,
    // @ts-ignore
    description: `Gift wishlist for ${data.recipient?.name}`,
    openGraph: {
      title: data.title,
      // @ts-ignore
      description: `Help ${data.recipient?.name} get the perfect gifts`,
    },
  }
}

export default async function SharePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipient:recipients(name)')
    .eq('id', params.id)
    .eq('is_public', true)
    .single()

  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('id, product_name, image_url, current_best_price, target_price, status, product_url')
    .eq('wishlist_id', params.id)
    .order('created_at')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center mx-auto">
            <Gift size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">{wishlist.title}</h1>
          {/* @ts-ignore */}
          <p className="text-gray-500 text-sm">Gift wishlist for {wishlist.recipient?.name}</p>
          {wishlist.event_date && (
            <p className="text-xs text-gray-400">📅 {wishlist.event_date}</p>
          )}
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items?.map(item => (
            <div key={item.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex gap-4 items-center">
              {item.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image_url} alt={item.product_name}
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                  onError={() => {}}
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.product_name}</p>
                {item.current_best_price && (
                  <p className="text-xs text-gray-500 mt-0.5">€{item.current_best_price}</p>
                )}
                {item.status === 'claimed' && (
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                    Reserved
                  </span>
                )}
              </div>
              {item.status === 'wanted' && (
                <ClaimButton itemId={item.id} />
              )}
            </div>
          ))}

          {(!items || items.length === 0) && (
            <p className="text-center text-gray-400 py-10 text-sm">This wishlist is empty.</p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">Powered by GiftWise</p>
      </div>
    </div>
  )
}

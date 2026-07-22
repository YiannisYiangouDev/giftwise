import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WishlistForm from '@/components/WishlistForm'
import type { WishlistRow } from '@/types/rows'
import { Suspense } from 'react'

export default async function EditWishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('wishlists')
    .select('*')
    .eq('id', id)
    .single()
  const wishlist = data as WishlistRow | null
  if (!wishlist) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Wishlist</h1>
        <p className="text-gray-500 text-sm">{wishlist.title}</p>
      </div>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading form...</div>}>
        <WishlistForm
          wishlistId={wishlist.id}
          initial={{
            recipient_id: wishlist.recipient_id,
            title: wishlist.title,
            occasion: wishlist.occasion ?? '',
            event_date: wishlist.event_date ?? '',
          }}
        />
      </Suspense>
    </div>
  )
}
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Gift, Share2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { PageProps } from '@/types/next'
import WishlistItemsClient from './WishlistItemsClient'

export default async function WishlistDetailPage({ params }: PageProps<{ id: string }>) {
  const { id } = await params
  const supabase = await createClient()

  const { data: wishlist } = await supabase
    .from('wishlists')
    .select('*, recipients(id, name)')
    .eq('id', id)
    .single()

  if (!wishlist) notFound()

  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('wishlist_id', id)
    .order('created_at', { ascending: true })

  const recipient = wishlist.recipients as { id: string; name: string } | null

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href={recipient ? `/recipients/${recipient.id}` : '/wishlists'}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      >
        <ArrowLeft size={15} />
        {recipient ? recipient.name : 'Wishlists'}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {wishlist.occasion && (
              <span className="text-xs px-2 py-0.5 bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-full font-medium">
                {wishlist.occasion as string}
              </span>
            )}
            {wishlist.is_public && (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-full">
                Shared
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{wishlist.title as string}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {recipient && (
              <Link href={`/recipients/${recipient.id}`} className="hover:text-brand-500 transition">
                For {recipient.name}
              </Link>
            )}
            {wishlist.event_date && (
              <span>· {format(parseISO(wishlist.event_date as string), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>

        {/* Share button */}
        <ShareButton wishlistId={id} shareToken={wishlist.share_token as string | null} isPublic={wishlist.is_public as boolean} />
      </div>

      {/* Items — client component handles add/delete/status/scraping */}
      <WishlistItemsClient wishlistId={id} initialItems={items ?? []} />
    </div>
  )
}

// Small server-rendered share button that becomes interactive on client
function ShareButton({ wishlistId, shareToken, isPublic }: { wishlistId: string; shareToken: string | null; isPublic: boolean }) {
  if (!isPublic || !shareToken) {
    return (
      <form action={`/api/wishlists/${wishlistId}/share`} method="POST">
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Share2 size={14} /> Share
        </button>
      </form>
    )
  }
  return (
    <Link
      href={`/wishlists/${wishlistId}/share`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
    >
      <ExternalLink size={14} /> View public link
    </Link>
  )
}

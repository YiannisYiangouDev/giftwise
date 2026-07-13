import WishlistForm from '@/components/WishlistForm'

export default function NewWishlistPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Wishlist</h1>
        <p className="text-gray-500 text-sm">Create a wishlist for a recipient</p>
      </div>
      <WishlistForm />
    </div>
  )
}
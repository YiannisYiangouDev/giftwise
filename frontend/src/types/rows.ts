/** Explicit row types for Supabase queries (needed due to @supabase/ssr v0.6 limitation) */
export interface RecipientRow {
  id: string
  user_id: string
  name: string
  relationship: string | null
  birthday: string | null
  photo_url: string | null
  notes: string | null
  budget_min: number
  budget_max: number
  created_at: string
}

export interface WishlistRow {
  id: string
  recipient_id: string
  title: string
  occasion: string | null
  event_date: string | null
  share_token: string | null
  is_public: boolean
  created_at: string
}

export interface WishlistItemRow {
  id: string
  wishlist_id: string
  product_name: string
  product_url: string | null
  image_url: string | null
  target_price: number | null
  current_best_price: number | null
  currency: string
  status: 'wanted' | 'claimed' | 'purchased' | 'received'
  claimed_by: string | null
  claimed_at: string | null
  notes: string | null
  created_at: string
}

export interface PriceHistoryRow {
  id: string
  item_id: string
  store_name: string
  store_url: string
  price: number
  currency: string
  in_stock: boolean
  checked_at: string
}

export interface NotificationRow {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  item_id: string | null
  is_read: boolean
  created_at: string
}

export interface ContributionRow {
  id: string
  item_id: string
  user_id: string
  amount: number
  message: string | null
  created_at: string
}

export interface SecretSantaGroupRow {
  id: string
  creator_id: string
  name: string
  budget: number | null
  event_date: string | null
  is_drawn: boolean
  created_at: string
}

export interface SecretSantaParticipantRow {
  id: string
  group_id: string
  user_id: string
  assigned_to_user_id: string | null
  wishlist_url: string | null
  created_at: string
}

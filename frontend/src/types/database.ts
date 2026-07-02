export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      recipients: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['recipients']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['recipients']['Insert']>
      }
      wishlists: {
        Row: {
          id: string
          recipient_id: string
          title: string
          occasion: string | null
          event_date: string | null
          share_token: string | null
          is_public: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['wishlists']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>
      }
      wishlist_items: {
        Row: {
          id: string
          wishlist_id: string
          product_name: string
          product_url: string
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
        Insert: Omit<Database['public']['Tables']['wishlist_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['wishlist_items']['Insert']>
      }
      price_history: {
        Row: {
          id: string
          item_id: string
          store_name: string
          store_url: string
          price: number
          currency: string
          in_stock: boolean
          checked_at: string
        }
        Insert: Omit<Database['public']['Tables']['price_history']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['price_history']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

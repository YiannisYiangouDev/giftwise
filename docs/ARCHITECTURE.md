# GiftWise — Architecture

```
User
 ↓
Next.js App (Vercel)
 ├─ Dashboard (recipients, events, price drops)
 ├─ Recipient profiles
 ├─ Wishlist pages (shareable links)
 └─ Price alerts
       ↓
Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
 ├─ Database: recipients, wishlists, items, price_history
 ├─ Auth: JWT + RLS policies
 └─ Edge Functions (scheduled via pg_cron):
     ├─ price-checker  → scrape all tracked items daily
     ├─ birthday-reminder → check upcoming birthdays
     └─ notify → send email via Resend on price drop
           ↓
     Scraper Layer
     ├─ Skroutz.cy / Skroutz.gr  (Apify API)
     ├─ WooCommerce stores        (wp-json/wc/v3)
     ├─ Shopify stores            (/products.json)
     └─ Custom CY stores          (Python + Playwright)
```

## Auth Flow
1. User logs in → Supabase issues JWT (httpOnly cookie)
2. Next.js middleware protects routes
3. RLS policies enforce data ownership at DB level

## Price Tracking Flow
1. User adds product URL
2. Firecrawl scrapes title, image, price immediately
3. Daily pg_cron triggers price-checker Edge Function
4. New snapshot inserted into price_history
5. If price ≤ target_price → notification sent via Resend

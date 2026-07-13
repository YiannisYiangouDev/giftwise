# 🎁 GiftWise

> Family gift tracker with wishlist management, group gifting, Secret Santa draws, and live price tracking across Cyprus & Greece.

## Features
- 👥 **Recipient management** — track people, birthdays, relationships, budgets
- 🎀 **Wishlists** — multiple wishlists per person, shareable public links, claim/purchase flow
- 💰 **Group Gifts** — pool money with family members on wishlist items
- 🎅 **Secret Santa** — create groups, draw names (Fisher-Yates, no self-assign), reveal assignments
- 🔍 **Product Search** — search Skroutz.cy by name, see results with images
- 📊 **Price tracker** — monitors 16 stores across Cyprus/Greece with price history charts
- 🔓 **Cloudflare bypass** — scrapes Cloudflare-protected stores (Skroutz.cy, Public, IKEA, etc.)
- 🔔 **Alerts** — in-app notifications + email via Resend for price drops & birthdays
- 📱 **Mobile-ready** — hamburger sidebar, responsive design, dark mode
- 🛡 **Family-only** — private household tool, no public signups

## Tech Stack
- **Frontend**: Next.js 15.5 (App Router) + React 19 + Tailwind CSS 3.4
- **State**: React Query v5 + server components
- **Charts**: Recharts 2.15 + custom CSS bar charts
- **Database & Auth**: Supabase (PostgreSQL 17, Ireland eu-west-2) — email/password, RLS, Realtime
- **Scraping**: Python 3.12 + cloudscraper (Cloudflare bypass) — 6 engine types, robots.txt compliance
- **Search**: Skroutz.cy scraping via Python subprocess bridge
- **Edge Functions**: Deno/TypeScript (price-checker, birthday-reminder)
- **Cron**: Supabase pg_cron + pg_net (daily scheduled jobs)
- **Email**: Resend (transactional email for price drop alerts)
- **Deployment**: Vercel (frontend) + Supabase (backend) + Cloudflare Pages option

## Project Structure
```
giftwise/
├── frontend/              # Next.js 15.5 app
│   ├── src/
│   │   ├── app/           # 18+ routes (auth, dashboard, marketing, API, share)
│   │   ├── components/    # 12 shared components
│   │   ├── lib/           # Supabase clients, sanitization
│   │   └── types/         # Database + row type definitions
│   └── scripts/           # Python bridge for Cloudflare bypass
├── scraper/               # Python price scraper (6 engines, 16 stores)
├── supabase/              # DB migrations (5) + Edge Functions (2)
└── docs/                  # Planning, architecture
```

## Routes
```
/                          Dashboard — stats, upcoming occasions
/login                     Auth — sign in / sign up (family-only)
/recipients[/new, /[id], /[id]/edit]  CRUD — people you buy for
/wishlists[/new, /[id], /[id]/edit]   CRUD — gift lists
/secret-santa[/new, /[id]]            Groups + draw + reveal
/tracker[/[id]]             Price tracker + per-item history chart
/admin                     Admin panel (email-gated)
/s/[token]                 Public shareable wishlist (no login)
/settings                  Notification preferences, dark mode
```

## API Routes
```
/api/search?q=                  Skroutz.cy product search
/api/fetch-product?url=         Extract product name + price + image from URL
/api/account/export             GDPR: JSON export of all user data
/api/account/delete             GDPR: cascade delete account
```

## Database
9 tables with Row Level Security: `recipients`, `wishlists`, `wishlist_items`, `price_history`, `tracked_stores`, `notifications`, `contributions`, `secret_santa_groups`, `secret_santa_participants`

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=your-email@example.com
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Scraper (`scraper/.env`)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Edge Functions (set in Supabase Dashboard)
```
RESEND_API_KEY=your-resend-key
FIRECRAWL_API_KEY=your-firecrawl-key
```

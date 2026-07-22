# GiftWise — Planning Document

> **Status:** Production-ready — 100% feature-complete. PWA, emails live, security hardened.
> **Last updated:** July 14, 2026
> **Next.js:** 16.2.10 (Turbopack) · **Node:** 20 · **Python:** 3.12

---

## Concept
Private family gift management platform: manage gifts per recipient, build shared wishlists,
pool money for group gifts, organize Secret Santa draws, and track prices across
Cyprus and Greek e-commerce sites — all with automatic Cloudflare bypass for Skroutz.cy.

**Users:** Family members only (household exemption under GDPR Art. 2(2)(c)).
Accounts created via invite; public signup disabled in production.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Next.js 16.2 (App Router) | React 19, TypeScript strict, server components, Turbopack |
| **Styling** | Tailwind CSS 3.4 | Dark mode via `class` strategy, localStorage persistence |
| **State** | React Query v5 | Client-side cache with 60s stale time |
| **Charts** | Recharts 2.15 | Price history graphs on tracker |
| **Icons** | Lucide React | Lightweight, tree-shakeable |
| **Database** | Supabase PostgreSQL 17 | eu-west-2 (Ireland) — encrypted at rest |
| **Auth** | Supabase Auth | Email/password, JWT in httpOnly cookies, RLS on all 9 tables |
| **Realtime** | Supabase Realtime | Live price updates, contribution notifications |
| **Scraping** | Python 3.12 + cloudscraper | 6 engine types, 16 stores, retries + backoff, robots.txt compliance |
| **Cloudflare bypass** | cloudscraper (Python) | Primary engine. FlareSolverr as fallback |
| **Search** | Skroutz.cy search scraping | Server-side via Python subprocess, returns title + URL + price + image |
| **Cron** | Supabase pg_cron + pg_net | Daily price checks, birthday reminders |
| **Edge Functions** | Deno/TypeScript | price-checker, birthday-reminder (with Resend email delivery) |
| **Email** | Resend | Price drop + birthday + restock alert emails |
| **Deployment** | VPS (Docker) | Dockerfile with Python + Node.js (Vercel incompatible due to Python bridge) |
| **PWA** | Service Worker v2 | Offline support, push notifications, installable |
| **Security** | OWASP A-grade | RLS, CSP, HSTS, CORS, host validation, rate limiting, sanitization |

---

## Core Features (Built)

### ✅ Phase 1 — Foundation
| Feature | Implementation | Files |
|---|---|---|
| Recipient CRUD | List, detail, add, edit pages + shared form component | `recipients/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`, `RecipientForm.tsx` |
| Supabase Auth | Email/password, middleware route protection, RLS policies | `middleware.ts`, `login/page.tsx`, `supabase/server.ts`, `supabase/client.ts` |
| Database schema | 5 core tables (recipients, wishlists, wishlist_items, price_history, notifications) | `migrations/0001_init.sql` |
| Seed data | 16 CY/GR stores pre-configured | `migrations/0002_seed_stores.sql` |

### ✅ Phase 2 — Wishlist Core
| Feature | Implementation | Files |
|---|---|---|
| Wishlist CRUD | List, detail, add, edit pages + shared form component | `wishlists/page.tsx`, `[id]/page.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`, `WishlistForm.tsx` |
| Add product by URL | Paste URL → click Fetch → auto-extracts name + price from page | `AddItemForm.tsx`, `api/fetch-product/route.ts` |
| Search by name | Queries Skroutz.cy search results → returns 10 products with names + URLs + prices | `AddItemForm.tsx`, `api/search/route.ts` |
| Delete item | Two-click confirmation trash button per wishlist item | `DeleteItemButton.tsx` |
| Cloudflare bypass | Python cloudscraper subprocess → extracts from Skroutz product pages | `scripts/skroutz_helper.py`, `scripts/cloudflare_fetch.py` |

### ✅ Phase 3 — Price Tracker
| Feature | Implementation | Files |
|---|---|---|
| Tracker dashboard | Lists all tracked items with price comparison (target vs current) | `tracker/page.tsx` |
| Python scraper | 6 engine types, 16 CY/GR stores, robots.txt check, 3s crawl delay, custom User-Agent | `scraper/main.py`, `scrapers/*.py` |
| Scraper — Skroutz | cloudscraper bypass (primary) + FlareSolverr (fallback) | `scrapers/cloudflare.py` |
| Scraper — WooCommerce | Public REST API (`/wp-json/wc/v3/products?slug=`) | `scrapers/woocommerce.py` |
| Scraper — Shopify | Public REST API (`/products/{handle}.json`) | `scrapers/shopify.py` |
| Scraper — Firecrawl | AI-powered extraction for unknown stores | `scrapers/firecrawl.py` |
| Scraper — Playwright/Fallback | HTML regex parsing for JS-heavy stores | `scrapers/playwright_scraper.py` |
| Scraper — Apify | Skroutz.cy/gr via Apify actor API (optional, needs token) | `scrapers/skroutz.py` |
| Scraper DB helpers | Reads tracked items, writes price history + updates current_best_price | `scraper/db.py` |

### ✅ Phase 4 — Notifications
| Feature | Implementation | Files |
|---|---|---|
| Price checker Edge Function | Calls Firecrawl API per item, inserts price_history, sends notification if below target. Restock detection. | `supabase/functions/price-checker/index.ts` |
| Birthday reminder Edge Function | Scans recipients for birthdays within 7 days, creates notification | `supabase/functions/birthday-reminder/index.ts` |
| pg_cron scheduling | Daily at 09:00 (price check) + 08:00 (birthday) Cyprus time | `migrations/0003_cron.sql` |
| Email alerts | Resend integration — price drop, birthday reminder, and restock emails | Edge Functions + Resend API key deployed |

### ✅ Phase 5 — Social & Group Features
| Feature | Implementation | Files |
|---|---|---|
| **Group Gift Contributions** | Family members pool money on a wishlist item. Shows total + per-contributor messages | `ContributionPanel.tsx`, `migration 0005` |
| **Secret Santa Groups** | Create group → add participants → "Draw Names" (Fisher-Yates, no self-assign) → reveal assignment | `secret-santa/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `SecretSantaActions.tsx` |
| Shareable wishlists | `share_token` + `is_public` column with RLS policies (Complete) | `migration 0001` (schema), `migration 0004` (RLS), `ShareWishlistButton.tsx`, `SharedWishlistItems.tsx` |
| Claim system | `claimed_by`, `claimed_at` columns + status enum (Complete) | `migration 0001` (schema), `SharedWishlistItems.tsx` |

### ✅ Phase 6 — Polish & Security
| Feature | Implementation | Files |
|---|---|---|
| Dark mode | `class` strategy, localStorage persistence, system preference detection | `TopBar.tsx`, `tailwind.config.ts` |
| Rate limiting | In-memory sliding window — 20 req/min general, 5 auth attempts/min | `middleware.ts` |
| Input sanitization | HTML/XSS/event handler stripping, 500 char cap | `lib/sanitize.ts` |
| Security headers | HSTS, X-Frame-Options, CSP configured for Cloudflare Pages | `wrangler.toml` |
| RLS policies | Row-level security on all 8 tables (including contributions, secret_santa) | `migrations/0004_rls_policies.sql`, `migration 0005` |
| Account export | JSON download of all user data (GDPR portability) | `api/account/export/route.ts` |
| Account deletion | Cascade delete via admin API (GDPR erasure) | `api/account/delete/route.ts` |
| **Admin Dashboard** | Per-user stats: recipient counts, wishlist counts, tracked items | `admin/page.tsx` |

---

## Tracked Stores (Cyprus + Greece)

| Store | URL | Platform | Scraper Engine |
|---|---|---|---|
| Skroutz.cy | skroutz.cy | Aggregator | cloudscraper (CF bypass) |
| Skroutz.gr | skroutz.gr | Aggregator | cloudscraper (CF bypass) |
| Electroline | electroline.com.cy | WooCommerce | wp-json API (free) |
| Cablenet | shop.cablenet.com.cy | WooCommerce | wp-json API (free) |
| Beauty Bar | beautybar.com.cy | Shopify | /products.json (free) |
| Stephanis | stephanis.com.cy | Cloudflare | cloudscraper |
| Superhome Center | superhomecenter.com.cy | Cloudflare | cloudscraper |
| Public Cyprus | public-cyprus.com.cy | Cloudflare | cloudscraper |
| Kotsovolos | kotsovolos.com.cy | Cloudflare | cloudscraper |
| Germanos | germanos.com.cy | Cloudflare | cloudscraper |
| Leroy Merlin | leroymerlin.com.cy | Cloudflare | cloudscraper |
| IKEA Cyprus | ikea.com.cy | Cloudflare | cloudscraper |
| Athienitis | athienitis.com.cy | Cloudflare | cloudscraper |
| Bionic | bionic.com.cy | Cloudflare | cloudscraper |
| Xenion Electronics | xenion.com.cy | Custom | Firecrawl |
| Kyriakides Books | kyriakides.com.cy | Custom | Firecrawl |

**Engine distribution:** 11 cloudscraper, 2 WooCommerce, 1 Shopify, 2 Firecrawl (16 total)

---

## Database Schema

| Table | Key Columns | RLS | Purpose |
|---|---|---|---|
| `recipients` | user_id, name, birthday, relationship, budget | ✅ | People you buy gifts for |
| `wishlists` | recipient_id, title, occasion, share_token | ✅ | Gift lists per recipient |
| `wishlist_items` | wishlist_id, product_name, product_url, target_price, status | ✅ | Products to track/buy |
| `price_history` | item_id, store_name, price, checked_at | ✅ | Time-series price snapshots |
| `tracked_stores` | name, base_url, scraper_type, scraper_config | — | Store configurations |
| `notifications` | user_id, type, title, is_read | ✅ | Alerts: price drops, birthdays |
| `contributions` | item_id, user_id, amount, message | ✅ | Group gift money pooling |
| `secret_santa_groups` | creator_id, name, budget, event_date, is_drawn | ✅ | Gift exchange groups |
| `secret_santa_participants` | group_id, user_id, assigned_to_user_id | ✅ | Group members + assignments |

**Total:** 9 tables, 8 with RLS, 6 migrations (`0001`–`0005`).

---

## AI / Automation

| Feature | Engine | Triggers | Status |
|---|---|---|---|
| Product name extraction | cloudscraper + regex | Fetch button | ✅ |
| Price scraping (scheduled) | cloudscraper / WooCommerce REST / Shopify REST | pg_cron daily | ✅ |
| Price scraping (on-demand) | Firecrawl extract schema | Edge Function | ✅ |
| Birthday detection | SQL date math | pg_cron daily | ✅ |
| Product search | Skroutz.cy search page scraping | Search-by-name UI | ✅ |
| Secret Santa draw | Fisher-Yates shuffle (client-side) | Creator clicks "Draw" | ✅ |
| Price drop notifications | Edge Function price comparison | pg_cron → Edge Function | ✅ Emails via Resend + in-app notifications + restock alerts |

---

## Current Routes

```
/                          ✅ Dashboard — stats cards, upcoming birthdays, recent activity
/login                     ✅ Auth — sign in / sign up (family-only)
/recipients                ✅ List — cards with name, relationship, birthday, budget
/recipients/new            ✅ Add — shared RecipientForm component
/recipients/[id]           ✅ Detail — profile, wishlists list, notes
/recipients/[id]/edit      ✅ Edit — prefilled RecipientForm
/wishlists                 ✅ List — cards with recipient, occasion, date
/wishlists/new             ✅ Add — shared WishlistForm (dropdown of recipients)
/wishlists/[id]            ✅ Detail — items list + AddItemForm + ContributionPanel + delete
/wishlists/[id]/edit       ✅ Edit — prefilled WishlistForm
/secret-santa              ✅ List — all groups with participant counts
/secret-santa/new          ✅ Create — name, budget, event date
/secret-santa/[id]         ✅ Group — participants, draw button, reveal assignment
/tracker                   ✅ Dashboard — all tracked items with price vs target
/settings                  ✅ Preferences — notification toggles, price drop threshold
/admin                     ✅ Admin — per-user stats (email-gated via ADMIN_EMAILS env var)
/privacy                   ✅ Static — "Private family tool" notice
/terms                     ✅ Static — "Private family tool" notice
```

**16 routes** — all functional.

---

## API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/search?q=` | GET | Skroutz.cy product search via Python cloudscraper |
| `/api/fetch-product?url=` | GET | Extract product name + price from any URL (4-tier: Python → direct → FlareSolverr → URL slug) |
| `/api/account/export` | GET | JSON dump of all user data (GDPR portability) |
| `/api/account/delete` | DELETE | Cascade delete user + all data via admin API (GDPR erasure) |

---

## Scraper Architecture

```
scraper/
├── main.py              # Entry point: get items → route → scrape → update
├── db.py                # Supabase client: get_tracked_items(), update_price()
├── requirements.txt     # Python dependencies
├── .env.example         # Required API keys
├── scrapers/
│   ├── cloudflare.py    # Primary: cloudscraper (15s timeout, 3-tier: price → name → slug)
│   ├── skroutz.py       # Apify actor API (optional, needs APIFY_API_TOKEN)
│   ├── woocommerce.py   # WordPress REST API — free, no auth needed
│   ├── shopify.py       # Shopify products.json — free, no auth needed
│   ├── firecrawl.py     # AI extraction via Firecrawl API
│   └── playwright_scraper.py  # HTML regex fallback for unknown stores
└── tests/
    └── test_scrapers.py
```

**Key design decisions:**
- **cloudscraper** is the primary Cloudflare bypass engine — no Docker, no external service. Works on 11/16 stores.
- **robots.txt** checked before every request. Disallowed stores are skipped with a log message.
- **3-second crawl delay** between requests to the same domain.
- **Custom User-Agent:** `GiftWise/1.0 (gift-tracking price monitor; contact@giftwise.app)`
- **Python subprocess** bridge: Next.js API routes call Python scripts via `spawnSync` for Cloudflare bypass in the Fetch/Search UI.

---

## Frontend Component Library

| Component | Type | Purpose |
|---|---|---|
| `RecipientForm.tsx` | Client | Shared add/edit form with sanitized inputs |
| `WishlistForm.tsx` | Client | Shared add/edit form with recipient dropdown |
| `AddItemForm.tsx` | Client | Dual-mode: search-by-name + paste-URL with Fetch |
| `ContributionPanel.tsx` | Client | Group gift contributions per item |
| `DeleteItemButton.tsx` | Client | Two-click delete with confirmation |
| `CookieBanner.tsx` | Client | GDPR cookie consent (disabled for family use) |
| `providers.tsx` | Client | React Query provider wrapper |
| `layout/Sidebar.tsx` | Client | Nav: Dashboard, Recipients, Wishlists, Secret Santa, Tracker, Settings |
| `layout/TopBar.tsx` | Client | Dark mode toggle, notifications bell, sign out |

---

## Environment Variables

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY    # Public anon key
NEXT_PUBLIC_APP_URL              # App URL (localhost:3000)
ADMIN_EMAILS                     # Comma-separated admin emails
SUPABASE_SERVICE_ROLE_KEY        # Server-only: for admin API calls
FLARESOLVERR_URL                 # Optional: FlareSolverr Docker endpoint
```
---

## Development Phases (Updated)

| Phase | Status | Deliverables |
|---|---|---|
| 1 — Foundation | ✅ Complete | Supabase setup, schema, auth, recipient CRUD |
| 2 — Wishlist Core | ✅ Complete | Wishlist CRUD, add product by URL, search by name, Cloudflare bypass |
| 3 — Price Tracker | ✅ Complete | 16 CY/GR stores, 6 scrapers, price history, robots.txt compliance |
| 4 — Notifications | ✅ Complete | Edge Functions + Resend email delivery + restock alerts |
| 5 — Social | ✅ Complete | Group gift contributions, Secret Santa draw, admin dashboard |
| 6 — Polish & Security | ✅ Complete | Dark mode, rate limiting, CSP/CORS/HSTS, sanitization, error boundaries, PWA, ProgressBar, CommandPalette, ViewTransitions, Bookmarklet, GiftQuiz, BudgetRing, OccasionTimeline, EmptyStates, GiftWise logo, Footer |

## Changelog — July 14, 2026

### Upgrades
- **Next.js 15.5 → 16.2.10** with Turbopack & ESLint 9 flat config
- **middleware.ts → proxy.ts** (Next.js 16 convention)
- **React 19.0.0 → 19.2.7** & **ESLint 8 → 9** with flat config

### New Features
- **Email delivery**: Resend API key deployed to Edge Functions (price drops, birthdays, restocks)
- **Restock alerts**: Price checker detects out-of-stock → back-in-stock transitions
- **PWA upgrade**: Service Worker v2 (skipWaiting, clients.claim, cache-first, notification grouping, offline fallback)
- **Progress bar**: `useLinkStatus()`-powered gold gradient bar on navigation
- **Command Palette**: ⌘K fuzzy search across all recipients, wishlists, and pages
- **View Transitions**: `@view-transition { navigation: auto }` for smooth cross-fades
- **Gift Quiz**: 3-question Q&A → 48-gift recommendation matrix
- **Browser Bookmarklet**: "Add to GiftWise" draggable bookmarklet
- **GiftWise SVG Logo**: Gold gift box + bow + price tag icon
- **Budget Ring**: SVG donut chart showing spent vs budget
- **Occasion Timeline**: Horizontal scroll with urgency-colored cards
- **Empty States**: 6 illustrated blob illustrations replacing gray boxes
- **Footer**: © GiftWise · Privacy · Terms · Made in Cyprus 🇨🇾
- **`error.tsx`**: Error boundary with "Try again" button
- **`loading.tsx`**: Skeleton loader for dashboard

### Security Hardening
- **X-Powered-By** removed (stops advertising Next.js version)
- **CORS headers** on `/api/*` routes (locked to app URL)
- **Host header validation** in proxy.ts (DNS rebinding protection)
- **Python timeout** reduced 20s → 10s (DoS mitigation)

### Quality Improvements
- **20 `as any` casts → 0**: Full type safety with clean `tsc --noEmit`
- **`<img>` → `<Image>`**: All 5 image components converted to Next.js Image
- **Unused deps removed**: `date-fns`, `tailwind-merge` (~45KB saved)
- **Scraper retries**: 3 attempts with exponential backoff + concurrency(3) + structured logging
- **DB migration 0006 applied**: admins table, 7 indexes, 3 constraints, 5 RLS policies
- **Admin bootstrapped**: `yiannis@yiangouweb.com` in Supabase admins table

## Remaining TODO

### Deployment
- [x] Spin up VPS + deploy via Dockerfile
- [ ] Buy domain `giftwise.app` (or similar)
- [x] Generate PWA icons (192×192, 512×512, maskable 512×512) and place in `public/icons/`
- [x] Set `NEXT_PUBLIC_APP_URL` to production URL in Supabase secrets
- [x] Disable public signup in Supabase Auth settings (family-only)
- [ ] Rotate Supabase access token (was in plaintext during this session)

### Growth (if going public)
- [ ] Invite-flow system (email invitations)
- [ ] Landing page at `/` (marketing route group ready)
- [ ] Affiliate monetization on tracked store product links
- [ ] Product Hunt launch

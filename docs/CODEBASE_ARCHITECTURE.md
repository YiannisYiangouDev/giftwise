# GiftWise — Complete Architecture & File Map

> Generated: July 13, 2026 | Audited by senior full-stack review

---

## 1. SYSTEM OVERVIEW

GiftWise is a **Next.js 15.5 App Router** application backed by **Supabase** (PostgreSQL 17, Auth, Edge Functions, pg_cron). A **Python 3.12 scraper** subsystem monitors 16 e-commerce stores with **cloudscraper** Cloudflare bypass. The app is a private family tool — no public registration, GDPR household exemption.

```
┌──────────────────────────────────────────────────────────┐
│                      USER (Browser)                      │
└──────────┬───────────────────────────────────────────────┘
           │ HTTPS
┌──────────▼───────────────────────────────────────────────┐
│               Next.js 15.5 (Vercel / localhost:3000)     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │
│  │ Server       │  │ Client      │  │ API Routes (4)   │ │
│  │ Components   │  │ Components  │  │ search, fetch,   │ │
│  │ (dashboard,  │  │ (forms,     │  │ account/delete,  │ │
│  │ recipients,  │  │  panels,    │  │ account/export   │ │
│  │ wishlists,   │  │  buttons)   │  │                  │ │
│  │ tracker, SS) │  │             │  │ Python bridge    │ │
│  └──────┬───────┘  └──────┬──────┘  └───────┬──────────┘ │
│         │                 │                  │            │
│    middleware.ts (rate limit, auth, route protect)        │
└─────────┼─────────────────┼──────────────────┼────────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│            Supabase (eu-west-2, Ireland)                  │
│  ┌──────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ PostgreSQL 17│  │ Auth (JWT)  │  │ Edge Functions │  │
│  │ 9 tables    │  │ RLS on 8   │  │ price-checker  │  │
│  │ 6 migrations │  │ httpOnly    │  │ birthday-rem   │  │
│  │ pg_cron      │  │ cookies     │  │                │  │
│  └──────────────┘  └─────────────┘  └───────┬────────┘  │
│                                              │            │
│                    ┌─────────────────────────┘            │
│                    ▼                                      │
│          ┌──────────────────┐                             │
│          │  pg_cron jobs    │                             │
│          │  daily @ 06:00   │                             │
│          │  daily @ 05:00   │                             │
│          └──────────────────┘                             │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 Scraper Layer (Python)                    │
│  ┌───────────────────────────────────────────────────┐   │
│  │ main.py → router → 6 engines                      │   │
│  │  ├── cloudflare.py (cloudscraper + FlareSolverr)  │   │
│  │  ├── woocommerce.py (REST API)                    │   │
│  │  ├── shopify.py (/products.json)                  │   │
│  │  ├── firecrawl.py (AI extraction)                 │   │
│  │  ├── playwright_scraper.py (HTML fallback)        │   │
│  │  └── skroutz.py (Apify actor)                     │   │
│  │                                                    │   │
│  │ Robots.txt compliance ✓  3s delay ✓  User-Agent ✓ │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  Next.js Python bridge: spawnSync('python3', [script])    │
│  └── scripts/skroutz_helper.py ← search + fetch actions   │
│  └── scripts/cloudflare_fetch.py ← simple cloudscraper    │
└──────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND ARCHITECTURE

### 2.1 Route Map (18 routes)

| Route | Type | Auth | File |
|---|---|---|---|
| `/` | Server Component | ✅ | `(dashboard)/page.tsx` |
| `/login` | Client Component | ❌ | `(auth)/login/page.tsx` |
| `/recipients` | Server | ✅ | `recipients/page.tsx` |
| `/recipients/new` | Server | ✅ | `recipients/new/page.tsx` |
| `/recipients/[id]` | Server | ✅ | `recipients/[id]/page.tsx` |
| `/recipients/[id]/edit` | Server | ✅ | `recipients/[id]/edit/page.tsx` |
| `/wishlists` | Server | ✅ | `wishlists/page.tsx` |
| `/wishlists/new` | Client | ✅ | `wishlists/new/page.tsx` |
| `/wishlists/[id]` | Server | ✅ | `wishlists/[id]/page.tsx` |
| `/wishlists/[id]/edit` | Server | ✅ | `wishlists/[id]/edit/page.tsx` |
| `/secret-santa` | Server | ✅ | `secret-santa/page.tsx` |
| `/secret-santa/new` | Client | ✅ | `secret-santa/new/page.tsx` |
| `/secret-santa/[id]` | Server+Client | ✅ | `secret-santa/[id]/page.tsx` |
| `/tracker` | Server | ✅ | `tracker/page.tsx` |
| `/tracker/[id]` | Server | ✅ | `tracker/[id]/page.tsx` |
| `/settings` | Client | ✅ | `settings/page.tsx` |
| `/admin` | Server | ✅ | `admin/page.tsx` |
| `/s/[token]` | Server | ❌ Public | `s/[token]/page.tsx` |
| `/privacy` | Static | ❌ | `(marketing)/privacy/page.tsx` |
| `/terms` | Static | ❌ | `(marketing)/terms/page.tsx` |

### 2.2 Component Dependency Graph

```
RootLayout
├── Providers (QueryClient + ToastProvider)
├── CookieBanner (disabled, retained for completeness)
└── children
    ├── LoginPage (no layout)
    ├── MarketingLayout → privacy/terms pages
    ├── DashboardLayout
    │   ├── Sidebar (nav: 6 links)
    │   ├── TopBar (hamburger, dark, bell, signout)
    │   └── main → page content
    │       ├── DashboardPage
    │       │   └── stats cards + occasions + contributions
    │       ├── RecipientsPage → RecipientForm
    │       ├── RecipientDetailPage → budget bar
    │       ├── EditRecipientPage → RecipientForm (prefilled)
    │       ├── NewRecipientPage → RecipientForm
    │       ├── WishlistsPage
    │       ├── WishlistDetailPage
    │       │   ├── AddItemForm
    │       │   │   ├── search mode (Skroutz API)
    │       │   │   └── url mode (Fetch)
    │       │   ├── ItemStatusButton (claim/purchase)
    │       │   ├── DeleteItemButton (two-click)
    │       │   └── ContributionPanel (group gifts)
    │       ├── EditWishlistPage → WishlistForm
    │       ├── NewWishlistPage → WishlistForm
    │       ├── SecretSantaPage
    │       ├── SecretSantaGroupPage → SecretSantaActions
    │       ├── NewSecretSantaPage
    │       ├── TrackerPage → linked items
    │       ├── TrackerItemPage → price chart + history table
    │       ├── SettingsPage → delete account
    │       └── AdminPage → per-user stats
    └── SharedWishlistPage (public, /s/[token])
```

### 2.3 Data Flow

```
User Action → Client Component (useState + supabase client)
  → POST/GET to Supabase REST API (auto-handled by supabase-js)
    → RLS check → DB write
  → router.refresh() → Server Component re-renders with fresh data
  → Toast notification on success

Search/Fetch:
  User types → Client → fetch('/api/search') or fetch('/api/fetch-product')
    → API route → spawnSync('python3', [script, arg])
      → Python cloudscraper → Skroutz.cy → extract data
    → JSON response → Client renders results
```

---

## 3. DATABASE ARCHITECTURE

### 3.1 Tables & Relationships

```
auth.users (Supabase managed)
  │
  ├─── recipients (user_id FK)
  │     ├── wishlists (recipient_id FK, CASCADE)
  │     │     └── wishlist_items (wishlist_id FK, CASCADE)
  │     │           ├── price_history (item_id FK, CASCADE)
  │     │           ├── contributions (item_id FK, CASCADE, user_id FK)
  │     │           └── notifications (item_id FK nullable)
  │     └── notifications (user_id FK)
  │
  ├─── secret_santa_groups (creator_id FK)
  │     └── secret_santa_participants (group_id FK CASCADE, user_id FK, assigned_to_user_id FK)
  │
  └─── tracked_stores (no FK, reference table)

```

### 3.2 Migrations (applied in order)

| Migration | Tables Created | Key Changes |
|---|---|---|
| `0001_init.sql` | recipients, wishlists, wishlist_items, price_history, tracked_stores, notifications | Core schema, RLS on 5 tables |
| `0002_seed_stores.sql` | (data only) | 16 CY/GR stores seeded |
| `0003_cron.sql` | (extensions) | pg_cron + pg_net + 2 schedules |
| `0004_rls_policies.sql` | (policies) | RLS for wishlist_items, price_history, notifications; nullable product_url |
| `0005_group_gifts_secret_santa.sql` | contributions, secret_santa_groups, secret_santa_participants | Group gifts + SS; ALTER wishlist_items |

---

## 4. SCRAPER ARCHITECTURE

### 4.1 Engine Routing

```
URL → detect_scraper(url) → STORE_ROUTING dict
  ├── "skroutz" in URL        → cloudflare  (11 stores share this)
  ├── "electroline.com.cy"    → woocommerce
  ├── "cablenet.com.cy"       → woocommerce
  ├── "beautybar.com.cy"      → shopify
  ├── "xenion.com.cy"         → firecrawl
  ├── "kyriakides.com.cy"     → firecrawl
  └── default                 → firecrawl
```

### 4.2 CloudflareScraper Tiers

```
scrape(url)
  ├── Tier 1: cloudscraper (Python lib, no Docker)
  │   └── If price found → return
  ├── Tier 2: FlareSolverr (Docker, http://localhost:8191)
  │   └── If price found → return
  └── Tier 3: cloudscraper (name only, no price requirement)
```

### 4.3 Frontend-to-Python Bridge

```
Next.js API Route (TypeScript)
  → child_process.spawnSync('python3', ['/abs/path/script.py', action, arg])
    → Python cloudscraper → target site → extract name/price/image
    → stdout JSON → parse in Node.js → return NextResponse.json()
```

---

## 5. AUTHENTICATION FLOW

```
1. User signs up/in → Supabase Auth (email/password)
2. Supabase returns JWT → stored in httpOnly cookie (sb-*-auth-token)
3. middleware.ts runs on every request:
   a. Creates Supabase server client with cookies
   b. Calls supabase.auth.getUser() to validate token
   c. Protected routes → 302 redirect to /login if no user
   d. /login with user → 302 redirect to /
   e. /s/[token] → exempt (public share route)
4. Server Components: createClient() reads cookies, queries DB via RLS
5. Client Components: createBrowserClient() returns client, queries via anon key
   - Server-side inserts include user_id (from auth.getUser())
   - RLS enforces ownership at DB level even if client token is leaked
```

---

## 6. EXTERNAL INTEGRATIONS

| Service | Purpose | Auth Method | Status |
|---|---|---|---|
| **Supabase** | DB, Auth, Edge Functions, Cron | Anon key (public) + Service Role key (server) | ✅ |
| **Skroutz.cy** | Product search + fetch | cloudscraper (bypasses Cloudflare) | ✅ |
| **Apify** | Skroutz scraper actor | API Token (`APPIFY_API_TOKEN`) | 🔴 Not configured |
| **Firecrawl** | AI-powered product extraction | API Key (`FIRECRAWL_API_KEY`) | 🔴 Not configured |
| **FlareSolverr** | Cloudflare bypass (Docker) | None (localhost) | 🔴 Not running |
| **Resend** | Transactional email | API Key (in Edge Function env) | 🟡 Code ready, key missing |
| **Vercel** | Frontend hosting | Automated via GitHub | 🟡 Not deployed |
| **Cloudflare Pages** | Alternative deployment | wrangler.toml ready | 🟡 Not deployed |

---

## 7. FILE-BY-FILE EXPLANATIONS

### Frontend Core

| File | Responsibility | Dependencies |
|---|---|---|
| `middleware.ts` | Rate limiting, auth check, route protection, cookie management | `@supabase/ssr`, `next/server` |
| `app/layout.tsx` | Root HTML, font, providers wrapper | `providers.tsx` |
| `lib/supabase/server.ts` | Server-side Supabase client with cookie handling | `@supabase/ssr`, `next/headers` |
| `lib/supabase/client.ts` | Browser Supabase client | `@supabase/ssr` |
| `lib/sanitize.ts` | XSS prevention: strips HTML, javascript:, event handlers, caps 500 chars | None |
| `types/database.ts` | Supabase Database type definition | None |
| `types/rows.ts` | Explicit row types for query returns | None |

### Components

| Component | Lines | Dependencies | Key States |
|---|---|---|---|
| `AddItemForm.tsx` | ~200 | supabase, router, Toast, sanitize | search mode/url mode, loading, searching, fetching, error, results list, manual fallback |
| `RecipientForm.tsx` | ~130 | supabase, router, Toast, sanitize | add/edit mode, loading, error, relationship dropdown |
| `WishlistForm.tsx` | ~140 | supabase, router, Toast, sanitize | add/edit mode, loading, error, recipient dropdown |
| `ContributionPanel.tsx` | ~90 | supabase, router, Toast | show/hide form, contributions list, total |
| `ItemStatusButton.tsx` | ~35 | supabase, router | wanted→claimed, claimed→purchased |
| `DeleteItemButton.tsx` | ~45 | supabase, router, Toast | confirm state, deleting |
| `ShareWishlistButton.tsx` | ~45 | supabase, router | copied state, token generation |
| `Sidebar.tsx` | ~95 | next/navigation, lucide | mobile open/close, 6 nav items, active state |
| `TopBar.tsx` | ~65 | supabase, router | dark mode, unread notification count polling |
| `Toast.tsx` | ~45 | React context | success/error variants, 3s auto-dismiss |
| `CookieBanner.tsx` | ~40 | lucide | visible/hidden, localStorage |
| `providers.tsx` | ~20 | react-query, Toast | QueryClient config (60s stale, no refetch on focus) |

---

## 8. CRITICAL FILE DEPENDENCIES

```
api/fetch-product/route.ts
  → child_process.spawnSync('python3')
    → scripts/skroutz_helper.py
      → import cloudscraper (pip install)
      → Skroutz.cy (HTTPS)
  ← stdout JSON → NextResponse.json()

api/search/route.ts
  → child_process.spawnSync('python3')
    → scripts/skroutz_helper.py
      → Skroutz.cy search page scraping
  ← stdout JSON → NextResponse.json()

scraper/main.py
  → db.py
    → supabase-py client
      → Supabase REST API (service role key)
  → scrapers/*.py
    → httpx / cloudscraper / apify-client
      → Target stores (HTTPS)
  ← price_history INSERT + wishlist_items UPDATE

supabase/functions/price-checker/index.ts
  → @supabase/supabase-js (Deno)
    → Supabase REST API
  → Firecrawl API (fetch)
    → Target store URLs
  → Resend API (fetch)
    → Email delivery
  ← price_history INSERT + notifications INSERT
```

---

## 9. ENVIRONMENT REQUIREMENTS

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL          ← Required for both server & client
NEXT_PUBLIC_SUPABASE_ANON_KEY     ← Required (exposed to browser — this is by design)
NEXT_PUBLIC_APP_URL               ← Required for share links
ADMIN_EMAILS                      ← Required for /admin access
SUPABASE_SERVICE_ROLE_KEY         ← Required for account deletion (server-only, never exposed)
FLARESOLVERR_URL                  ← Optional (Docker FlareSolverr)
```

### Scraper (.env)
```
SUPABASE_URL                      ← Required
SUPABASE_SERVICE_ROLE_KEY         ← Required (server-side, never exposed)
APPIFY_API_TOKEN                  ← Optional (Apify Skroutz scraper)
FIRECRAWL_API_KEY                 ← Optional (Firecrawl AI extraction)
FLARESOLVERR_URL                  ← Optional (Docker)
```

### Edge Functions (set in Supabase Dashboard per function)
```
SUPABASE_URL                  ← Auto-injected by Supabase
SUPABASE_SERVICE_ROLE_KEY     ← Auto-injected by Supabase
RESEND_API_KEY                ← Required for email (not yet set)
FIRECRAWL_API_KEY             ← Required for price checker (not yet set)
```

---

This architecture document covers every file and system dependency in the GiftWise application. Use it as the definitive reference for onboarding, debugging, and production deployment.

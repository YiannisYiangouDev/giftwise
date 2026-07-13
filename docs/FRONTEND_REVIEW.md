# GiftWise — Frontend Production Review

> **Review Date:** July 13, 2026 | **Framework:** Next.js 15.5 | **State:** React Query, Tailwind CSS 3.4

---

## 1. ARCHITECTURE REVIEW

### 1.1 App Router Usage: ✅ Strong

GiftWise correctly uses the App Router pattern:
- **Server Components** for data fetching pages (dashboard, recipients, wishlists, tracker, admin)
- **Client Components** for interactive elements (forms, buttons, toasts, sidebar)
- **API Routes** for server-side operations (search, fetch, account management)
- **Route Groups** `(auth)`, `(dashboard)`, `(marketing)` for layout separation

**Pattern:** This is the recommended Next.js architecture. No hybrid pages/router mixing.

### 1.2 Server/Client Split: ✅ Balanced

| Page Count | Server | Client | Mixed |
|---|---|---|---|
| Pages | 12 | 4 | 2 |

The split is appropriate: data-fetching pages stay server-side, interactive forms go client-side.

---

## 2. PERFORMANCE ANALYSIS

### 2.1 Bundle Size

| Concern | File | Size Driver |
|---|---|---|
| `lucide-react` icons | `Sidebar.tsx`, `TopBar.tsx` | Tree-shakeable ✅ — imports only used icons |
| `recharts` | Not currently used in active pages | Unused import ⚠️ — package is installed but not actively used in any page. The tracker detail page uses CSS bar charts instead. Consider removing from package.json. |
| `date-fns` | Not imported in any component | Unused dependency — safe to remove |
| `clsx` + `tailwind-merge` | `Sidebar.tsx` | `clsx` used, `tailwind-merge` not used — remove from deps |

**Recommendation:** Run `npx depcheck` to find unused dependencies and trim ~50KB from the bundle.

### 2.2 Data Fetching

| Pattern | Where | Optimization |
|---|---|---|
| `supabase.from().select()` | 12 server components | Fine — one query per page |
| `supabase.from().select('*, nested(select)')` | 3 pages | Nested select with joins — efficient single queries |
| `router.refresh()` | 8 client components | Soft navigation — no full page reload ✅ |
| `useEffect` fetch | `ContributionPanel.tsx`, `TopBar.tsx` | Client-side fetch for interactive updates ✅ |

### 2.3 Re-rendering

| Issue | Where | Fix |
|---|---|---|
| `setInterval` in `TopBar.tsx` | Polls notifications every 30s | Replace with Supabase Realtime subscription (see SEC-010) |
| `useEffect` with [] dep | `Sidebar.tsx` | Registers `window.__toggleSidebar` — fine, only on mount |
| `useEffect` with [] dep | `WishlistForm.tsx` | Fetches recipients list once — fine |

### 2.4 Images

| Issue | Where | Status |
|---|---|---|
| Next.js `<Image>` component | Not used anywhere | ⚠️ All images use raw `<img>` tags. For production, convert to `next/image` for automatic optimization, lazy loading, and WebP conversion. |
| External image domains | `next.config.ts` | ✅ skroutz.gr, skroutz.cy, scdn.gr, supabase.co configured |
| Image dimensions | All `<img>` tags | ⚠️ No width/height specified — causes layout shift (CLS) |

**Fix:**
```tsx
// Replace <img src={...} className="w-14 h-14" />
// With <Image src={...} width={56} height={56} className="rounded-lg" alt={...} />
// Import from 'next/image'
```

### 2.5 Caching

| Cache | Status |
|---|---|
| React Query | 60s stale time, no refetch on window focus ✅ |
| Next.js data cache | Not configured — defaults to no cache for dynamic routes ✅ |
| Static pages | `/privacy` and `/terms` could be statically generated at build time |

---

## 3. UX REVIEW

### 3.1 Mobile Responsiveness ✅

| Feature | Implementation | Status |
|---|---|---|
| Sidebar | Hamburger menu + slide-over with overlay | ✅ |
| Grid layouts | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | ✅ |
| Touch targets | Buttons are 36-44px | ✅ |
| Forms | Stack vertically on mobile | ✅ |

### 3.2 Loading States

| Page | Loading State | Status |
|---|---|---|
| Server components | Next.js built-in loading | 🟡 No `loading.tsx` files created — shows blank until data arrives |
| Client forms | `loading` state disables buttons | ✅ |
| Search/Fetch | `searching`/`fetching` states show spinner | ✅ |

**Fix:** Add `loading.tsx` skeleton files for data-fetching pages:
```
src/app/(dashboard)/loading.tsx  ← Skeleton for dashboard
src/app/(dashboard)/recipients/[id]/loading.tsx ← Skeleton for recipient detail
src/app/(dashboard)/wishlists/[id]/loading.tsx  ← Skeleton for wishlist detail
```

### 3.3 Empty States ✅

All list pages have empty states with icons and guidance text:
- Recipients: "No recipients yet. Add your first person!"
- Wishlists: "No wishlists yet. Create your first one!"
- Tracker: "No tracked items yet."
- Secret Santa: "No Secret Santa groups yet."

### 3.4 Error States ⚠️

| Scenario | Current Behavior | Fix |
|---|---|---|
| Supabase connection fails | Uncaught error, blank page | Add `error.tsx` error boundaries |
| API route fails (search/fetch) | Silent fallback to manual entry | Adequate for MVP |
| Form validation fails | Database returns error, shown as red text | ✅ |

**Fix:** Add `error.tsx` files:
```tsx
// src/app/(dashboard)/error.tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button onClick={reset} className="btn-primary">Try again</button>
    </div>
  )
}
```

### 3.5 Accessibility

| Issue | Severity | Fix |
|---|---|---|
| No `aria-label` on icon buttons | Medium | Add to TopBar, Sidebar, delete buttons |
| Form labels are properly associated | ✅ | `label htmlFor` / `input id` used |
| Color contrast in dark mode | 🟡 | Brand-500 on dark backgrounds may have low contrast |
| No skip-to-content link | Low | Add for keyboard navigation |
| No `role` attributes on custom interactive elements | Low | Sidebar, modals should have appropriate roles |

---

## 4. CODE QUALITY

### 4.1 TypeScript Strictness: ✅ Strong

```json
// tsconfig.json
{
  "strict": true,
  "noEmit": true
}
```

All files pass `npx tsc --noEmit` with zero errors.

### 4.2 Code Patterns

| Pattern | Frequency | Assessment |
|---|---|---|
| `as any` casts on Supabase writes | 8 occurrences | ⚠️ Known limitation of `@supabase/ssr` v0.6.1 — see SEC-008 |
| `as any` casts on nested selects | 5 occurrences | ⚠️ Nested join results are untyped — acceptable for MVP |
| `use client` directive | 12 files | Appears where needed for interactivity ✅ |
| Server Component data fetching | 12 pages | Standard pattern ✅ |

### 4.3 Component Size

| Size | Components |
|---|---|
| Small (<50 lines) | Toast, CookieBanner, ItemStatusButton, DeleteItemButton, ShareWishlistButton, providers |
| Medium (50-150) | TopBar, Sidebar, ContributionPanel, RecipientForm, WishlistForm |
| Large (150-250) | AddItemForm ✅ (justified by dual-mode complexity) |

No component is excessively large. `AddItemForm` could be split into `SearchMode` and `UrlMode` sub-components if it grows further.

---

## 5. SEO & METADATA

### 5.1 Current State

| Page | Metadata | Status |
|---|---|---|
| Root layout | `title: 'GiftWise'` | ✅ |
| Root layout | `description: 'Family gift tracking & price alerts'` | ✅ |
| Login page | Inherits from root | 🟡 No unique title |
| Dashboard | Inherits from root | 🟡 No unique title |
| Privacy/Terms | `title: 'GiftWise'` | ✅ (intentionally minimal) |

### 5.2 Recommendations

For a private family app, SEO is not critical. The robots meta tag is currently missing:
```tsx
// In layout.tsx
export const metadata: Metadata = {
  title: 'GiftWise',
  description: 'Family gift tracking & price alerts',
  robots: 'noindex, nofollow', // Private app — don't index
}
```

---

## 6. CSS & STYLING

### 6.1 Tailwind Usage: ✅ Good

- Utility classes throughout — no custom CSS files (beyond globals.css)
- Custom utility classes defined in `@layer components`:
  - `.btn-primary`, `.btn-secondary` — reusable button styles
  - `.card` — consistent card appearance
  - `.input`, `.label` — form consistency
  - `.badge-*` — status indicators
- Dark mode via `class` strategy with `localStorage` persistence

### 6.2 globals.css Quality

- ✅ CSS variables for theming (`--foreground`, `--background`, `--brand`)
- ✅ `@apply` used for consistent base styles
- ✅ Animation defined for toast notifications (`slideUp`)
- 🟡 `h1`, `h2`, `h3` base styles might conflict with Tailwind's typography plugin if added later

---

## 7. FRONTEND CHECKLIST

```
☐ Remove unused dependencies (recharts, date-fns, tailwind-merge)
☐ Add loading.tsx skeleton pages for 3 main data-fetching routes
☐ Add error.tsx error boundaries
☐ Replace <img> with next/image for automatic optimization
☐ Add width/height to all images to prevent CLS
☐ Add aria-labels to icon-only buttons
☐ Add robots: 'noindex' to metadata (private app)
☐ Replace TopBar polling with Supabase Realtime
☐ Consider splitting AddItemForm into SearchMode/UrlMode at 300+ lines
☐ Add loading spinner for initial page loads (suspense boundary)
☐ Test on real mobile devices (iPhone, Android)
☐ Run Lighthouse audit — target 90+ Performance
☐ Fix lockfile warnings (orphaned package-lock.json in root)
```

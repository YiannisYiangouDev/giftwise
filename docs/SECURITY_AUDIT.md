# GiftWise — Security Audit

> **Audit Date:** July 13, 2026 | **Severity Scale:** Critical / High / Medium / Low

---

## EXECUTIVE SUMMARY

**Overall Security Posture: B+ (Good, with gaps)**

GiftWise has solid foundations: Row Level Security on 8 tables, httpOnly JWT cookies, input sanitization, rate limiting, and a custom User-Agent for scraping. The primary gaps are: a hardcoded Python path in API routes, no CSP headers in production, weak admin gating (email-based via .env), no 2FA, and the scraper uses an `as any` pattern that weakens type safety.

**Critical Issues:** 0  
**High Issues:** 3  
**Medium Issues:** 7  
**Low Issues:** 5

---

## FINDINGS

---

### [HIGH] SEC-001: Hardcoded Absolute Path to Python Script

**Severity:** High  
**Affected files:** `frontend/src/app/api/fetch-product/route.ts`, `frontend/src/app/api/search/route.ts`  
**Description:** Both API routes hardcode `/home/coder/projects/giftwise/frontend/scripts/...` as the path to Python helper scripts. This will break on any deployment machine with a different path structure — especially Vercel or Azure.

**Risk:** Production deployment will fail silently for search and fetch features. User-facing features break with no clear error.

**Fix:**
```typescript
// Replace hardcoded path with path.join(process.cwd(), ...)
const { spawnSync } = require('child_process')
const path = require('path')
const script = path.join(process.cwd(), 'scripts', 'skroutz_helper.py')
const py = spawnSync('python3', [script, action, query], { timeout: 20000, encoding: 'utf8' })
```

**Additionally:** Ensure `cloudscraper` is in the deployment environment's Python packages. Add it to a `requirements.txt` at the project root and document that the deployment environment must have Python 3.12+.

---

### [HIGH] SEC-002: Missing CSP & Security Headers

**Severity:** High  
**Affected files:** `frontend/next.config.ts`, `wrangler.toml`  
**Description:** No Content-Security-Policy header is set in the Next.js app. The `wrangler.toml` has headers only for Cloudflare Pages deployment — not for Vercel. XSS protection relies entirely on input sanitization without a defense-in-depth CSP.

**Risk:** If the sanitizer (`sanitize.ts`) misses an edge case, stored XSS in the `notes` or `product_name` fields could execute in other users' browsers.

**Fix — Add to `next.config.ts`:**
```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'same-origin' },
        { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://*.supabase.co https://*.skroutz.cy" },
      ],
    }]
  },
  images: { /* existing */ },
}
```

---

### [HIGH] SEC-003: Admin Gating is Email-Based via .env Only

**Severity:** High  
**Affected files:** `frontend/src/app/(dashboard)/admin/page.tsx`  
**Description:** The admin dashboard checks if `user.email` is in the `ADMIN_EMAILS` env var. This is weak because: (1) email can be spoofed if another service is compromised, (2) there's no server-side role concept in the database, (3) `.env.local` is the only gate.

**Risk:** If an attacker gains access to any valid user account, they can modify `.env` (if they have server access) or the email check provides no defense against legitimate users accessing `/admin`.

**Fix:** Add an `is_admin` boolean column to the `auth.users` table (via `raw_user_meta_data`) or create an `admins` table:
```sql
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_read_own" ON admins FOR SELECT USING (auth.uid() = user_id);
```
Then check `SELECT 1 FROM admins WHERE user_id = auth.uid()` in the admin page.

---

### [MEDIUM] SEC-004: Service Role Key Exposure Risk

**Severity:** Medium  
**Affected files:** `frontend/.env.local`, `frontend/src/app/api/account/delete/route.ts`  
**Description:** The `SUPABASE_SERVICE_ROLE_KEY` is in `.env.local` which should never be committed. It IS properly used only server-side (in `route.ts`), but the `.env.local` file was previously exposed in the git history.

**Risk:** If the key was ever committed, anyone with access to the git history can bypass RLS entirely.

**Fix:**
1. Rotate the service role key immediately in Supabase Dashboard
2. Add `.env.local` to a git pre-commit hook
3. Scan git history: `git log --all --full-history -- frontend/.env.local`

---

### [MEDIUM] SEC-005: No Server-Side Input Validation on API Routes

**Severity:** Medium  
**Affected files:** `frontend/src/app/api/search/route.ts`, `frontend/src/app/api/fetch-product/route.ts`  
**Description:** The search API passes user input directly to `spawnSync` with `query_or_url` as a command-line argument. No validation that the `q` or `url` parameter is safe.

**Risk:** Command injection through specially crafted URL parameters is theoretically possible. While `spawnSync` uses array arguments (safer than shell strings), derived values should still be validated.

**Fix:**
```typescript
// In api/search/route.ts and api/fetch-product/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  if (!query || query.length > 500 || /[\x00-\x1f]/.test(query)) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }
  // ... proceed
}
```

---

### [MEDIUM] SEC-006: No CSRF Protection on State-Changing Requests

**Severity:** Medium  
**Affected files:** All API routes, all Client Component forms  
**Description:** DELETE and POST operations to Supabase from client components don't include CSRF tokens. Supabase's `createBrowserClient` uses the anon key for authentication, but there's no CSRF token on the DELETE endpoint at `/api/account/delete`.

**Risk:** A malicious site could trick an authenticated user into deleting their account via a form submission.

**Fix:** Add a `csrf` check to the DELETE route:
```typescript
// In delete/route.ts
export async function DELETE(request: Request) {
  const csrfCookie = request.headers.get('cookie')?.match(/csrf-token=([^;]+)/)?.[1]
  const csrfHeader = request.headers.get('x-csrf-token')
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return NextResponse.json({ error: 'Invalid CSRF' }, { status: 403 })
  }
  // ...
}
```
Or use `SameSite=Strict` cookies (Supabase already uses `SameSite=Lax`).

---

### [MEDIUM] SEC-007: Email Addresses Exposed in Shared Wishlist Pages

**Severity:** Medium  
**Affected files:** `frontend/src/app/s/[token]/page.tsx`  
**Description:** The shared wishlist page shows `(wishlist.recipients as any)?.name` which could leak personal names in shared links. While this is the intended feature, there's no mechanism to revoke a shared link.

**Risk:** A link once shared cannot be revoked. An ex-family member or accidentally leaked link provides permanent read access.

**Fix:** Add share token rotation: a "Regenerate link" button in the wishlist detail that generates a new `share_token`, invalidating the old one. Also add an expiration date column to wishlists.

---

### [MEDIUM] SEC-008: `as any` Type Assertions in Database Writes

**Severity:** Medium  
**Affected files:** `AddItemForm.tsx`, `RecipientForm.tsx`, `WishlistForm.tsx`, `ContributionPanel.tsx`, `SecretSantaActions.tsx`, `ItemStatusButton.tsx`, `DeleteItemButton.tsx`  
**Description:** Nearly every Supabase database write uses `(data as any)` to bypass TypeScript type checking. This is a result of `@supabase/ssr` v0.6.1 not supporting the generic `Database` type properly.

**Risk:** Invalid column names, wrong data types, or missing required fields will only be caught at runtime (as Postgres errors) rather than at build time.

**Fix:** Upgrade to `@supabase/ssr` v0.7+ when available, or use properly typed helper functions:
```typescript
// lib/supabase/typed-helpers.ts
import type { Database } from '@/types/database'
export type Tables = Database['public']['Tables']

export function insertRecipient(client: any, data: Tables['recipients']['Insert']) {
  return client.from('recipients').insert(data as any) // single `as any` in one place
}
```

---

### [MEDIUM] SEC-009: Rate Limiter is In-Memory (Non-Persistent)

**Severity:** Medium  
**Affected files:** `frontend/src/middleware.ts`  
**Description:** The rate limiter uses an in-memory `Map` that resets on every server restart. In Vercel serverless deployments, each function invocation has its own memory, making the rate limiter ineffective at scale. For a family app this is acceptable, but documented here for awareness.

**Risk:** In production with multiple serverless instances, rate limiting is essentially a no-op.

**Fix:** For production: use Vercel's built-in rate limiting or a Redis-based counter. For the current family-scale use, the in-memory approach is sufficient.

---

### [LOW] SEC-010: Notification Bell Poll Interval Could Be More Efficient

**Severity:** Low  
**Affected files:** `TopBar.tsx`  
**Description:** The bell icon polls for unread notifications every 30 seconds. For production, Supabase Realtime subscriptions would be more efficient and responsive.

**Fix:** Replace polling with:
```typescript
useEffect(() => {
  const channel = supabase.channel('notifications')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
      setUnreadCount(c => c + 1)
    })
    .subscribe()
  return () => { channel.unsubscribe() }
}, [])
```

---

### [LOW] SEC-011: No Account Lockout After Failed Attempts

**Severity:** Low  
**Affected files:** `login/page.tsx`, `middleware.ts`  
**Description:** The rate limiter allows 5 auth attempts per minute per IP, but there's no account-level lockout. A distributed brute force attack across multiple IPs could attempt many passwords.

**Risk:** With Supabase Auth's built-in protection (it does have rate limiting internally), this is low risk.

**Fix:** Supabase Auth Dashboard → Authentication → Settings → "Max login attempts" — configure there.

---

### [LOW] SEC-012: `CookieBanner.tsx` Uses localStorage for Consent

**Severity:** Low  
**Affected files:** `CookieBanner.tsx`  
**Description:** The cookie consent banner stores acceptance in `localStorage` which is not GDPR-compliant for audit purposes (can be cleared, not logged server-side). For a family tool under the household exemption, this is fine.

---

### [LOW] SEC-013: Scraper Writes All Price Data With Service Role Key

**Severity:** Low  
**Affected files:** `scraper/db.py`  
**Description:** The Python scraper uses the service role key (bypasses RLS) to write price history. This is necessary for the service to function, but means any compromise of the scraper's `.env` file gives full write access to the database.

**Fix:** Rotate the service role key periodically. Consider using a dedicated Postgres role with INSERT-only permissions on `price_history` and `wishlist_items`.

---

### [LOW] SEC-014: Duplicate `package-lock.json` in Root

**Severity:** Low  
**Affected files:** `/home/coder/projects/giftwise/package-lock.json` (regularly appears, needs deletion)  
**Description:** An orphaned `package-lock.json` appears in the project root, causing Next.js workspace detection warnings.

**Fix:** Add `package-lock.json` to root `.gitignore` or remove the orphaned file at build time.

---

## SECURITY SCORECARD

| Category | Score | Notes |
|---|---|---|
| Authentication | 80% | Supabase Auth + httpOnly cookies ✅, no 2FA ⚠️ |
| Authorization (RLS) | 95% | RLS on 8/9 tables ✅, admin gating weak ⚠️ |
| Input Validation | 75% | Client-side sanitization ✅, no server-side validation on API routes ⚠️ |
| XSS Prevention | 80% | sanitize.ts covers HTML ✅, no CSP headers ❌ |
| CSRF Protection | 70% | SameSite cookies ✅, no explicit CSRF tokens ⚠️ |
| Rate Limiting | 60% | Middleware has limits ✅, in-memory (not persistent) ⚠️ |
| Secret Management | 60% | Keys in .env ✅, service key in git history ⚠️ |
| Dependency Security | 85% | Minor audit warnings from npm ✅ |

**Overall:** B+ (Good for family MVP. Production-ready with 3 HIGH fixes applied.)

---

## PRE-LAUNCH SECURITY CHECKLIST

```
☐ SEC-001: Replace hardcoded Python paths with process.cwd()
☐ SEC-002: Add CSP headers in next.config.ts
☐ SEC-003: Replace email-based admin with DB role
☐ SEC-004: Rotate service role key if ever committed
☐ SEC-005: Add input length/safety validation on API routes
☐ SEC-007: Add share token rotation/expiration
☐ SEC-008: Upgrade @supabase/ssr or create typed helpers
☐ SEC-009: Consider Vercel rate limiting for production
☐ SEC-011: Configure Supabase Auth max login attempts
☐ Review .env.local is in .gitignore ✓ (already done)
```

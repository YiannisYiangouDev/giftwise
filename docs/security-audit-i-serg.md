**Assessor:** Authorized Penetration Test (Passive + Authenticated)  
**Scope:** `https://www.i-serg.org` + Backend API (`https://i-serg.azurewebsites.net/api/v1`)  
**Test Account:** `yiannis@yiangouweb.com` (role: `tester`, permissions: `publications.view`, `training.view`, `repositories.view`, `suppliers.view`)

---

## Executive Summary

**i-SERG** is a "Digital Management Platform for the Sustainable Energy Research Group" — a React SPA frontend hosted on **Azure Static Web Apps**, with a REST API backend at **Azure App Service (Windows)**. The platform includes authentication, role-based access control, infrastructure management, research publications, training, and supplier management modules.

The assessment was conducted in three phases: (1) unauthenticated passive reconnaissance, (2) authenticated API testing, and (3) a dependency audit against the GitHub Advisory Database.

**Key strengths:** Strong backend authorization (RBAC), proper JWT validation, CSRF/Origin protection, Zod input validation, rate limiting, and account enumeration prevention. **Dependency audit confirmed Axios 1.18.1 (latest) is in use — all 18 recent CVEs are patched.**

**Concerns:** Frontend lacks CSP and X-Frame-Options headers, JWT stored in localStorage (XSS-vulnerable), and PII leakage through API responses.

---

## Risk Rating: **MEDIUM-HIGH**

---

## Critical Vulnerabilities

**None found.**

---

## High Severity Findings

### H-1: Missing Content-Security-Policy Header (Frontend)
- **Severity:** HIGH
- **Location:** `https://www.i-serg.org` (all responses)
- **Description:** The frontend (Azure Static Web Apps) does not return a `Content-Security-Policy` header. This is the most important defense against Cross-Site Scripting (XSS), data injection, and clickjacking attacks.
- **Impact:** Without CSP, any XSS vulnerability (stored, reflected, or DOM-based) can execute arbitrary JavaScript in the user's browser, potentially stealing JWT tokens from localStorage, hijacking sessions, or defacing the application.
- **Evidence:**
  ```
  curl -sI https://www.i-serg.org/ | grep -i "content-security-policy"
  (no output)
  ```
- **Recommended Fix:** Implement a strict CSP header. Minimum baseline:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://i-serg.azurewebsites.net; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  ```
  **Note:** The backend (`i-serg.azurewebsites.net`) already implements a well-formed CSP — use it as a reference.

### H-2: Missing X-Frame-Options Header (Frontend)
- **Severity:** HIGH
- **Location:** `https://www.i-serg.org` (all responses)
- **Description:** The frontend does not return an `X-Frame-Options` header, nor does it have `frame-ancestors` in a CSP.
- **Impact:** The application can be embedded in an invisible iframe on a malicious website (clickjacking attack), tricking users into performing unintended actions.
- **Evidence:**
  ```
  curl -sI https://www.i-serg.org/ | grep -i "x-frame-options\|frame-ancestors"
  (no output)
  ```
- **Recommended Fix:** Add `X-Frame-Options: DENY` or `X-Frame-Options: SAMEORIGIN` header. When CSP is implemented, use `frame-ancestors 'none'` or `frame-ancestors 'self'`.

### H-3: JWT Token Stored in localStorage
- **Severity:** HIGH
- **Location:** Frontend JavaScript (`index-BNK6KOf3.js`)
- **Description:** Authentication tokens are stored in `localStorage` and sent as `Authorization: Bearer <token>` headers. `localStorage` is accessible to any JavaScript running on the same origin, making it vulnerable to XSS attacks.
- **Impact:** Any XSS vulnerability allows an attacker to steal the JWT token, gaining full access to the victim's account. The token has no additional protection (no HttpOnly flag, no fingerprinting visible from outside).
- **Evidence:**
  ```javascript
  // Extracted from the JS bundle:
  localStorage.getItem("token")
  // Sent as:
  e.headers.Authorization = `Bearer ${t}`
  ```
- **Recommended Fix:**
  1. Switch to **HttpOnly, Secure, SameSite=Strict cookies** for session/JWT storage
  2. Implement token fingerprinting (bind token to client characteristics)
  3. Use short-lived access tokens with refresh token rotation
  4. As a minimum interim measure, implement a strict CSP (H-1) to reduce XSS risk

---

## Medium Severity Findings

### M-1: Missing Permissions-Policy Header (Frontend)
- **Severity:** MEDIUM
- **Location:** `https://www.i-serg.org`
- **Description:** The frontend does not return a `Permissions-Policy` header to restrict browser features (camera, microphone, geolocation, etc.).
- **Impact:** If an XSS vulnerability exists, an attacker could access browser APIs like geolocation or microphone.
- **Recommended Fix:** Add a restrictive Permissions-Policy header:
  ```
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  ```

### M-2: Backend API URL Exposed in Client-Side Code
- **Severity:** MEDIUM
- **Location:** Frontend JavaScript bundle
- **Description:** The backend API URL (`https://i-serg.azurewebsites.net/api/v1`) is hardcoded and clearly visible in the minified JavaScript bundle.
- **Impact:** Attackers know exactly where the backend API lives, simplifying reconnaissance. While the backend has good defenses, this removes a layer of obscurity.
- **Evidence:**
  ```javascript
  baseURL:"https://i-serg.azurewebsites.net/api/v1"
  ```
- **Recommended Fix:** Use an API proxy/gateway (e.g., Azure Front Door, API Management) so the frontend communicates with `https://www.i-serg.org/api/` which proxies to the backend. This also simplifies CORS.

### M-3: Apex Domain Points to GoDaddy Parking Page
- **Severity:** MEDIUM
- **Location:** `https://i-serg.org`
- **Description:** The apex domain (`i-serg.org`) resolves to GoDaddy's Domain Parking Service (DPS), displaying a generic parked page instead of redirecting to the application.
- **Impact:**
  1. Users visiting `i-serg.org` (without www) see an unrelated page — confusion and potential phishing risk
  2. The parked page includes jQuery and Bootstrap from CDN with its own CSP allowing GoDaddy frame-ancestors
  3. The GoDaddy page sets a tracking cookie (`dps_site_id`)
- **Evidence:**
  ```
  Server: DPS/2.0.0+sha-6a26195
  Content-Security-Policy: frame-ancestors 'self' godaddy.com *.godaddy.com ...
  Set-Cookie: dps_site_id=eu-central-1; path=/; secure
  ```
- **Recommended Fix:** Configure DNS to redirect `i-serg.org` → `www.i-serg.org` (HTTP 301), or point the apex domain directly to Azure Static Web Apps.

### M-4: Google Fonts Loaded from External CDN
- **Severity:** MEDIUM
- **Location:** `https://www.i-serg.org` (every page load)
- **Description:** The application loads fonts from `fonts.googleapis.com` and `fonts.gstatic.com`. This sends user IP addresses to Google on every page load.
- **Impact:**
  1. GDPR/privacy concern — user data (IP, Referer, User-Agent) sent to third party without consent
  2. Dependency on external CDN availability
  3. Without CSP, any compromise of the Google CDN could affect the application
- **Recommended Fix:** Self-host the fonts. Bundle them in the static assets. If CDN is required, add proper CSP font-src directives and display a cookie/privacy consent banner.

### M-5: Health Endpoint Information Disclosure
- **Severity:** MEDIUM
- **Location:** `https://i-serg.azurewebsites.net/api/v1/health`
- **Description:** The health endpoint returns service name and timestamps without authentication.
- **Impact:** Attackers can confirm the service is running, identify the service name (`i-serg-api`), and monitor uptime patterns.
- **Evidence:**
  ```json
  {"ok":true,"service":"i-serg-api","timestamp":"2026-07-16T11:39:28.141Z"}
  ```
- **Recommended Fix:** Either restrict the health endpoint to internal monitoring IPs only, or minimize the response to just `{"ok":true}`.

### M-6: HSTS max-age Discrepancy
- **Severity:** MEDIUM
- **Location:** Frontend vs Backend headers
- **Description:** The frontend HSTS max-age is 10,886,400 seconds (~126 days), while the backend is 31,536,000 seconds (1 year).
- **Impact:** Inconsistent HSTS policies reduce overall protection. The shorter frontend value means browsers will re-check HSTS more frequently.
- **Recommended Fix:** Standardize both to `max-age=31536000; includeSubDomains; preload`.

---

## Low Severity Findings

### L-1: Missing security.txt File
- **Severity:** LOW
- **Location:** `/.well-known/security.txt`
- **Description:** No `security.txt` file exists, which is a proposed IETF standard for security researchers to know how to report vulnerabilities.
- **Recommended Fix:** Create a `/.well-known/security.txt` file with contact information for security reports.

### L-2: Verbose Validation Errors
- **Severity:** LOW
- **Location:** Backend API (`/api/v1/auth/login`, etc.)
- **Description:** Validation errors return detailed field-level messages (e.g., `"Too small: expected string to have >=1 characters"`).
- **Impact:** While these help legitimate users, they also provide attackers with information about validation rules.
- **Evidence:**
  ```json
  {"error":{"code":"VALIDATION_ERROR","message":"Invalid request","details":[
    {"field":"body.password","message":"Too small: expected string to have >=1 characters"}
  ]}}
  ```
- **Recommended Fix:** For production, consider less detailed error messages while maintaining validation. Log the details server-side for debugging.

### L-3: No IPv6 Configuration
- **Severity:** LOW
- **Location:** DNS configuration
- **Description:** Neither `www.i-serg.org` nor `i-serg.org` has IPv6 (AAAA) records.
- **Impact:** Users on IPv6-only networks may experience connectivity issues or be routed through NAT64 gateways.
- **Recommended Fix:** Add AAAA records for IPv6 support if the hosting platform supports it.

### L-4: No Asset Compression on Frontend
- **Severity:** LOW
- **Location:** `https://www.i-serg.org`
- **Description:** Static assets are served without Content-Encoding (no gzip/brotli compression). The JS bundle is ~676KB uncompressed.
- **Impact:** Slower page loads for users, increased bandwidth usage.
- **Recommended Fix:** Enable compression (gzip or brotli) in Azure Static Web Apps configuration.

---

## Informational Findings

### I-1: Technology Stack Identified

| Component | Technology |
|-----------|-----------|
| Frontend Framework | React (Vite build) |
| HTTP Client | Axios |
| UI Notifications | SweetAlert2 |
| Backend Runtime | Node.js (Azure App Service Windows) |
| Validation Library | Zod |
| Hosting (Frontend) | Azure Static Web Apps |
| Hosting (Backend) | Azure App Service (`waws-prod-am2`) |
| SSL Certificate | DigiCert/GeoTrust TLS RSA CA G1 |
| TLS Version | TLS 1.3, AES-256-GCM |
| Apex Domain | GoDaddy DPS (parked) |

### I-2: Security Positives (What's Working Well)

- ✅ **CORS properly configured** — only allows `https://www.i-serg.org`
- ✅ **CSRF origin validation** — rejects requests from unauthorized origins
- ✅ **Account enumeration protection** — consistent messages for login and password reset
- ✅ **Strong input validation** — Zod schema validation on all inputs
- ✅ **Rate limiting** — 300 requests per 60-second window on backend
- ✅ **Backend security headers** — Comprehensive CSP, X-Frame-Options, CORP, COOP, etc.
- ✅ **No source maps in production** — JavaScript source maps not exposed
- ✅ **No sensitive files exposed** — .git, .env, etc. return SPA shell (not actual content)
- ✅ **Proper HTTP authentication** — All API methods return 401 without valid token
- ✅ **Password reset uses safe messaging** — "If an account exists..." pattern
- ✅ **No technology leakage in headers** — No `X-Powered-By` or `Server` on backend
- ✅ **All database ports closed** — 5432, 3306, 27017, 6379 not exposed
- ✅ **TLS 1.3 with strong cipher** — AES-256-GCM

### I-3: API Route Map (Discovered)

```
Auth:
  POST   /api/v1/auth/login
  GET    /api/v1/auth/me
  PUT    /api/v1/auth/me/password
  POST   /api/v1/auth/forgot-password
  POST   /api/v1/auth/reset-password
  POST   /api/v1/auth/resend-password-reset

Admin:
  GET/POST/PUT/DELETE  /api/v1/roles
  GET/POST/PUT/DELETE  /api/v1/users
  GET/POST/PUT/DELETE  /api/v1/work-groups
  GET                  /api/v1/alerts

Infrastructure:
  CRUD  /api/v1/infrastructure/repositories/*

Research:
  CRUD  /api/v1/research/publications/*

Training:
  CRUD  /api/v1/training/*

Suppliers:
  CRUD  /api/v1/suppliers/items

Other:
  GET   /api/v1/health
  CRUD  /api/v1/attachments
```

### I-4: Missing Security Headers Comparison

| Header | Frontend | Backend |
|--------|----------|---------|
| Content-Security-Policy | ❌ MISSING | ✅ Present |
| X-Frame-Options | ❌ MISSING | ✅ SAMEORIGIN |
| X-Content-Type-Options | ✅ nosniff | ✅ nosniff |
| Strict-Transport-Security | ✅ 126 days | ✅ 365 days |
| Referrer-Policy | ✅ same-origin | ✅ no-referrer |
| Permissions-Policy | ❌ MISSING | ❌ N/A |
| Cross-Origin-Opener-Policy | ❌ MISSING | ✅ same-origin |
| Cross-Origin-Resource-Policy | ❌ MISSING | ✅ same-origin |

---

## Phase 2: Authenticated Testing Results

### Test Account Used
| Field | Value |
|-------|-------|
| Email | `yiannis@yiangouweb.com` |
| Role | `tester` (id: 17) |
| Permissions | `publications.view`, `training.view`, `repositories.view`, `suppliers.view` |
| User ID | `cmrngpzie000kmcg8d4fo9yqm` |

---

### A-1: JWT Token Analysis

| Property | Value | Assessment |
|----------|-------|------------|
| Algorithm | HS256 | ✅ Standard, no `none` vulnerability |
| Signature Verification | Proper | ✅ Tampered/unsigned tokens rejected |
| `none` algorithm attack | Blocked | ✅ Returns 401 |
| Token lifetime | 8 hours | ⚠️ Long; consider 1-2 hours with refresh |
| Token storage | `localStorage` | ❌ Vulnerable to XSS (see H-3) |
| Token delivery | Response body (JSON) | ⚠️ Not HttpOnly cookie |
| Claims | `iat`, `exp`, `sub` only | ⚠️ Missing `iss`, `aud`, `jti` |

**JWT Structure:**
```json
// Header
{"alg":"HS256","typ":"JWT"}

// Payload  
{"iat":1784203696,"exp":1784232496,"sub":"cmrngpzie000kmcg8d4fo9yqm"}
```

---

### A-2: Authorization Controls — PASSED ✅

All authorization tests passed. The `tester` role was correctly restricted:

| Test | Result |
|------|--------|
| GET /users | 403 Forbidden |
| GET /users/:id | 403 Forbidden |
| GET /roles | 403 Forbidden |
| POST /users (create) | 403 Forbidden |
| POST /training/records (create) | 403 Forbidden |
| PATCH /training/records/:id (modify) | 403 Forbidden |
| DELETE /work-groups/:id | 403 Forbidden |
| PUT /users/me | 403 Forbidden |
| Mass assignment (roles escalation) | Silently ignored ✅ |
| Mass assignment (email change) | Silently ignored ✅ |

---

### A-3: New Finding — PII Exposure via API Responses (MEDIUM)

- **Severity:** MEDIUM
- **Location:** Multiple API endpoints
- **Description:** Several API endpoints accessible to the `tester` role (view-only permissions) return personally identifiable information about other users, including full names and email addresses.
- **Impact:** A user with minimal `training.view` permission can enumerate:
  - Employee names and email addresses (via training attendees)
  - Work group leader names and emails
  - All user names in the system (via assignable-users endpoints)

- **Evidence:**

  **Training record attendees leak emails:**
  ```json
  GET /api/v1/training/records/1
  {
    "attendees": [{
      "user": {
        "firstName": "Nicholas",
        "lastName": "Afxentiou",
        "email": "res.an@frederick.ac.cy"
      }
    }]
  }
  ```

  **Work group leader leaks email:**
  ```json
  GET /api/v1/work-groups/2
  {
    "leader": {
      "firstName": "Nicholas",
      "lastName": "Afxentiou",
      "email": "res.an@frederick.ac.cy"
    }
  }
  ```

  **Employee summary exposes names & training status:**
  ```json
  GET /api/v1/training/employee-summary
  {
    "rows": [
      {"employee": "Nicholas Afxentiou", "total_assigned": 1, "completed": 1},
      {"employee": "Tibet Baskaya", "total_assigned": 1, "completed": 1}
    ]
  }
  ```

  **Assignable users lists all system users:**
  ```json
  GET /api/v1/infrastructure/repositories/assignable-users
  // Returns ALL users: firstName, lastName, id
  ```

- **Recommended Fix:** 
  1. Conditionally include PII fields based on permission level (e.g., show emails only to admin roles)
  2. Use a dedicated "public profile" projection that excludes email for view-only roles
  3. Audit all API response serializers for PII leakage
  4. Consider whether `assignable-users` needs to return the full user list or can be scoped to the requester's work groups

---

### A-4: Rate Limiting Discrepancy (LOW)

- **Severity:** LOW
- **Location:** General API tier vs. Auth tier
- **Description:** The general API rate limit header (`RateLimit-Remaining: 299`) does not decrement across multiple requests to non-auth endpoints. The auth-specific rate limit (20 req/900s) works correctly and decrements.
- **Impact:** Potential rate limiting bypass on general API endpoints if the counter is not actually enforced. The auth tier (login) is properly protected.
- **Evidence:**
  ```
  # auth/me — 5 requests, no counter change:
  RateLimit-Remaining: 299 (×5, never decremented)
  
  # Login — 3 requests, no counter change after initial:
  RateLimit-Remaining: 19 (×3, stuck after initial decrement)
  ```
- **Recommended Fix:** Verify rate limit counter implementation. Ensure the `RateLimit-Remaining` header accurately reflects the actual counter state. Consider using a Redis-backed rate limiter for multi-instance consistency.

---

### A-5: Complete API Route Map (Authenticated)

```
Authentication:
  POST   /api/v1/auth/login              — Login (rate limit: 20/900s)
  GET    /api/v1/auth/me                 — Current user profile
  PATCH  /api/v1/auth/me                 — Update profile (firstName, lastName)
  POST   /api/v1/auth/forgot-password    — Password reset request
  POST   /api/v1/auth/reset-password     — Password reset execution
  POST   /api/v1/auth/resend-password-reset — Resend reset email

User & Role Management (admin only):
  CRUD   /api/v1/users                   — 403 for tester
  CRUD   /api/v1/roles                   — 403 for tester
  CRUD   /api/v1/work-groups             — GET allowed, members 403

Infrastructure Repositories (view):
  GET    /api/v1/infrastructure/repositories/summary
  GET    /api/v1/infrastructure/repositories/hardware[/:id]
  GET    /api/v1/infrastructure/repositories/software[/:id]
  GET    /api/v1/infrastructure/repositories/lab-inventory[/:id]
  GET    /api/v1/infrastructure/repositories/office-equipment[/:id]
  GET    /api/v1/infrastructure/repositories/disposed-equipment[/:id]
  GET    /api/v1/infrastructure/repositories/external-property[/:id]
  GET    /api/v1/infrastructure/repositories/sub-categories
  GET    /api/v1/infrastructure/repositories/assignable-users

Training (view):
  GET    /api/v1/training/records[/:id]  — Includes attendee PII
  GET    /api/v1/training/employee-summary
  GET    /api/v1/training/assignable-users

Research (view):
  GET    /api/v1/research/publications[/:type]

Suppliers (view):
  GET    /api/v1/suppliers/items[/:id]
  GET    /api/v1/suppliers/items?supplier_id=:id

Other:
  GET    /api/v1/health                 — Public, no auth
  GET    /api/v1/alerts                 — Authenticated
  CRUD   /api/v1/attachments[/:id]      — GET /:id/download for blobs
```

---

### A-6: Password Change Endpoint

The password change endpoint route could not be discovered through API probing (all attempted paths returned 404). The route likely uses a non-standard path or is only accessible through the frontend flow with additional CSRF/verification tokens.

---

## Phase 3: Dependency Audit (CVE Research) — UPDATED with Version Verification

### Methodology
Searched GitHub Advisory Database (reviewed advisories, npm ecosystem) for known CVEs affecting the identified tech stack. **Crucially, each CVE was cross-referenced against the actual version running in the production JS bundle.**

### Verified Production Version

The Axios version was extracted from the live i-serg.org JavaScript bundle (`/assets/index-BNK6KOf3.js`):

```javascript
// Verified in production (2026-07-16):
var es = "1.18.1"           // ← Axios VERSION constant
Os.VERSION = es              // ← Exported as axios.VERSION
x.set("User-Agent", "axios/" + es)  // ← User-Agent header
```

**i-SERG uses Axios 1.18.1** — released 2026-06-22, the latest available version.

---

### D-1: Axios CVEs — VERIFIED: ALL PATCHED ✅

18 CVEs were published against Axios in May–June 2026. The table below shows each CVE's vulnerable range and status against i-SERG's version:

| CVE | Severity | Vulnerable Range | i-SERG (1.18.1) |
|-----|----------|------------------|------------------|
| CVE-2026-44496 | HIGH | ≥ 1.0.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-44495 | HIGH | ≥ 1.0.0, &lt; 1.15.2 | ✅ PATCHED |
| CVE-2026-44494 | HIGH | ≥ 1.0.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-44492 | HIGH | ≤ 0.31.1 (0.x line) | ✅ NOT APPLICABLE |
| CVE-2026-44490 | MEDIUM | ≥ 1.0.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-44489 | LOW | = 1.15.2 only | ✅ PATCHED |
| CVE-2026-44488 | HIGH | ≥ 1.7.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-44487 | HIGH | ≥ 1.0.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-44486 | HIGH | ≥ 1.0.0, &lt; 1.16.0 | ✅ PATCHED |
| CVE-2026-42042 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42041 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42039 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42038 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42037 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42036 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42035 | HIGH | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42034 | MEDIUM | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |
| CVE-2026-42033 | HIGH | ≥ 1.0.0, &lt; 1.15.1 | ✅ PATCHED |

**Result: 18/18 CVEs verified — ZERO applicable to i-SERG.** The highest fix boundary across all CVEs is `&lt; 1.16.0`. Axios 1.18.1 is well above this threshold.

**The previous "CRITICAL" assessment for Axios was a FALSE ALARM — the production bundle already contains the latest patched version.**

---

### D-2: Vite — Path Traversal CVEs (MODERATE–HIGH)

| CVE | Severity | Published | Summary | Affected |
|-----|----------|-----------|---------|----------|
| CVE-2026-53571 | HIGH | Jun 15, 2026 | `server.fs.deny` bypass on Windows alternate paths | ⚠️ Dev only |
| CVE-2026-39365 | MODERATE | Apr 6, 2026 | Path Traversal in Optimized Deps `.map` Handling | ⚠️ Dev only |

- **Impact on i-SERG:** Both CVEs affect the Vite **development server**, not the production build served from Azure Static Web Apps. The production build is a static HTML/JS/CSS bundle with no Vite server running.
- **Recommended Fix:** Upgrade Vite in the dev environment. No production impact.

---

### D-3: React — DoS in Server Components (Not Applicable)

| CVE | Severity | Published | Summary |
|-----|----------|-----------|---------|
| CVE-2026-23870 | HIGH | May 11, 2026 | Denial of Service in React Server Components |

- **Impact on i-SERG:** i-SERG uses client-side React (SPA architecture), not React Server Components. **Not applicable.**

---

### D-4: Node.js Runtime — Open Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Crypto hash collision on non-equal JS strings | Informational | Open since Oct 2025 |
| Weak Diffie-Hellman groups in crypto module | Low | Open since Sep 2022 |

- **Recommended Fix:** Keep Node.js updated to latest LTS (≥v22.x). Sanitize strings with `String.prototype.isWellFormed()` before hashing.

---

### D-5: Zod — Clean

Zod email validation ReDoS has been patched. Current versions are secure.

---

### D-6: PostgreSQL — Clean

No critical CVEs affecting recent PostgreSQL versions (15–17). Parameterized queries via ORM provide SQL injection protection.

---

### D-7: Supply Chain Risk Summary (Corrected)

| Component | Version | Risk Level | Status |
|-----------|---------|-----------|--------|
| **Axios** | **1.18.1** | 🟢 **LOW** | ✅ Latest — all 18 CVEs patched |
| Vite | Unknown | 🟡 MODERATE | Dev-only CVEs, update recommended |
| React | Unknown | 🟢 LOW | Client-side only, RSC CVEs N/A |
| Node.js | Unknown | 🟡 MODERATE | Update to latest LTS recommended |
| Zod | Unknown | 🟢 LOW | Keep updated |
| PostgreSQL | Unknown | 🟢 LOW | Keep updated |

---

## Security Score: **72/100** (Reverted — Axios false alarm resolved)

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | 85/100 | Good password reset, rate limiting; token in localStorage |
| Authorization | 90/100 | **Excellent RBAC** — all escalation tests passed; mass assignment protected |
| Frontend Security | 40/100 | **No CSP, no X-Frame-Options, no Permissions-Policy** |
| Backend Security | 85/100 | Excellent headers, input validation, CSRF protection, JWT validation |
| Data Protection | 55/100 | Token in localStorage, PII leakage in API responses, external CDN fonts |
| Infrastructure | 75/100 | Good port hygiene, TLS 1.3; apex domain misconfigured |
| API Security | 85/100 | Strong validation, auth required, rate limiting (minor counter issue) |
| Dependency Security | 80/100 | Axios on latest (1.18.1) — all CVEs patched; Vite/Node updates recommended |
| Backend Security | 85/100 | Excellent headers, input validation, CSRF protection, JWT validation |
| Data Protection | 55/100 | Token in localStorage, PII leakage in API responses, external CDN fonts |
| Infrastructure | 75/100 | Good port hygiene, TLS 1.3; apex domain misconfigured |
| API Security | 70/100 | Strong validation, auth required; **Axios CVEs are critical concern** |
| Dependency Security | 45/100 | **Axios has 12+ HIGH CVEs (May-Jun 2026)**; Vite has path traversal |

---

## Prioritized Remediation Plan

### Immediate (Before Production — Week 1)

| # | Finding | Effort |
|---|---------|--------|
| 1 | **Add CSP header to frontend** (H-1) | 2 hours |
| 2 | **Add X-Frame-Options header** (H-2) | 30 min |
| 3 | **Fix apex domain redirect** (M-3) | 1 hour |
| 4 | **Add missing JWT claims** (iss, aud, jti) (A-1) | 1 hour |

### Short-Term (Week 1-2)

| # | Finding | Effort |
|---|---------|--------|
| 5 | **Migrate JWT to HttpOnly cookies** (H-3) | 1-3 days |
| 6 | **Add Permissions-Policy header** (M-1) | 30 min |
| 7 | **Self-host Google Fonts** (M-4) | 2 hours |
| 8 | **Audit API responses for PII leakage** (A-3) | 1 day |
| 9 | **Upgrade Vite to latest** (D-2) | 1 hour |

### Medium-Term (Week 2-4)

| # | Finding | Effort |
|---|---------|--------|
| 12 | **Add API proxy/gateway** (M-2) | 1-2 days |
| 13 | **Standardize HSTS max-age** (M-6) | 30 min |
| 14 | **Restrict health endpoint** (M-5) | 1 hour |
| 15 | **Verify/fix rate limit counter** (A-4) | 2 hours |
| 16 | **Add security.txt** (L-1) | 15 min |

### Ongoing

| # | Finding |
|---|---------|
| 17 | Reduce validation error verbosity (L-2) |
| 18 | Add IPv6 support (L-3) |
| 19 | Enable asset compression (L-4) |
| 20 | Reduce JWT lifetime to 1-2 hours with refresh tokens |
| 21 | Upgrade Node.js to latest LTS (≥v22) |
| 22 | Review PostgreSQL RLS policies |
| 23 | Conduct full authenticated penetration test with admin role |
| 24 | Set up automated dependency scanning (Dependabot/Snyk) |

---

## Production Readiness Decision

### ⚠️ NEEDS FIXES — Not Recommended for Production Without Remediation

The application is **well-architected from a backend security perspective** with strong input validation, proper CORS/CSRF, rate limiting, and account enumeration protection. The authenticated testing confirmed **excellent authorization controls** — the RBAC system correctly prevented all privilege escalation and IDOR attempts. **The dependency audit verified Axios 1.18.1 (latest) is deployed — all 18 recent CVEs are patched.**

However, the **frontend security posture is significantly deficient**:

1. **No CSP header** leaves the application wide open to XSS attacks, which is even more critical given that JWT tokens are stored in `localStorage` — a successful XSS could compromise any user account.

2. **No X-Frame-Options** exposes users to clickjacking attacks.

3. The **JWT-in-localStorage pattern** is an architectural concern that should be addressed before handling real user data.

4. **PII leakage through API responses** allows minimal-privilege users to enumerate names and email addresses of all system users.

**The four immediate fixes (CSP, X-Frame-Options, apex domain redirect, JWT claims) can be completed in under 4 hours.** I recommend implementing these before any production traffic, then prioritizing the JWT storage migration and PII audit in the first sprint.

---

## Testing Limitations

- **No admin-role testing**: All authenticated tests used a `tester` role with view-only permissions. Admin-specific vulnerabilities (e.g., privilege misuse, mass data export) were not tested.
- **No file upload testing**: Attachment upload functionality could not be tested with the tester role.
- **No multi-tenant isolation testing**: Could not verify data isolation between users of the same role.
- **No password change flow testing**: The password change endpoint route was not discoverable.
- **Rate limit counter anomaly**: Could not definitively determine if the non-decrementing counter is a display bug or a bypass.

---

*This audit was performed using a combination of passive reconnaissance and authenticated API testing with a limited-privilege account. No active exploitation, data modification (beyond a single firstName field which was immediately reverted), or denial-of-service testing was conducted. A full authenticated penetration test with admin and multi-role accounts is recommended.*

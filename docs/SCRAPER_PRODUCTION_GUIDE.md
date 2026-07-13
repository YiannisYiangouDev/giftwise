# GiftWise — Scraper Production Guide

> **Review Date:** July 13, 2026 | **Language:** Python 3.12 | **Engines:** 6 | **Stores:** 16

---

## 1. CURRENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────┐
│                     SCHEDULER                            │
│  Option A: pg_cron → price-checker Edge Function        │
│  Option B: cron job → python main.py                    │
│  Option C: manual trigger (family use, on-demand)       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   SCRAPER MAIN LOOP                      │
│  main.py::run()                                          │
│  ├── get_tracked_items() from DB                        │
│  ├── FOR each item:                                     │
│  │   ├── check_robots(url)                              │
│  │   ├── detect_scraper(url) → STORE_ROUTING            │
│  │   ├── rate_limit(url) — 3 seconds                   │
│  │   ├── scrape(url) → 1 of 6 engines                  │
│  │   └── update_price(item_id, result) → DB            │
│  └── END FOR                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. RELIABILITY ANALYSIS

### 2.1 Current Weaknesses

| Issue | Severity | Impact |
|---|---|---|
| **No retry logic** | 🔴 High | Any network error skips the item entirely |
| **No error aggregation** | 🟡 Medium | Errors printed to stdout, never logged persistently |
| **Synchronous per-item loop** | 🟡 Medium | 16 items × 3s delay = minimum 48 seconds; no parallelism |
| **Single point of failure** | 🟡 Medium | If main.py crashes, all remaining items are lost until next run |
| **No health check** | 🟢 Low | No way to verify scraper is working without checking DB |
| **`apify` typo in skroutz.py** | 🟡 Medium | `os.environ["APPIFY_API_TOKEN"]` has a typo — should be `APIFY_API_TOKEN` |

### 2.2 Reliability Score: C+ (Needs work for production)

---

## 3. RECOMMENDED PRODUCTION ARCHITECTURE

For production, use a **queue-based architecture** that decouples the schedule from execution:

```
┌──────────────────────────────────────────────────────────┐
│  CRON SCHEDULER (pg_cron or Azure Timer Trigger)         │
│  "Every day at 06:00 UTC"                                │
│  → Fetches all tracked items → Pushes to Queue           │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│  MESSAGE QUEUE (Supabase table: scraper_jobs)            │
│  Columns: id, item_id, url, status, retries, error       │
│  Statuses: pending, processing, done, failed              │
└──────────────────────┬───────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────┐
│  WORKER (Python or Edge Function)                        │
│  → Claims N jobs (UPDATE status = 'processing')          │
│  → Scrapes each URL (with retries)                       │
│  → Updates job status + price_history                    │
│  → On failure: increments retries, schedules retry       │
└──────────────────────────────────────────────────────────┘
```

### 3.1 Simple Production Upgrade (Without Queue)

If a full queue is overkill for family scale, implement these minimal improvements:

```python
# main.py — upgraded with retries, parallelism, and error logging

import asyncio
from datetime import datetime, timezone

MAX_RETRIES = 3
CONCURRENCY = 3  # scrape 3 items in parallel

async def scrape_with_retry(item, scraper_type):
    """Scrape with exponential backoff retry."""
    url = item["product_url"]
    for attempt in range(MAX_RETRIES):
        try:
            await rate_limit(url)
            if scraper_type == "woocommerce":
                result = await WooCommerceScraper().scrape(url)
            # ... other engines
            if result and result.get("price"):
                await update_price(item["id"], result)
                return {"id": item["id"], "status": "success", "price": result["price"]}
        except Exception as e:
            wait = 2 ** attempt  # 1s, 2s, 4s
            print(f"  ↻ Retry {attempt+1}/{MAX_RETRIES} for {item['product_name']} in {wait}s: {e}")
            await asyncio.sleep(wait)
    # Log failure
    await log_scrape_failure(item["id"], str(e))
    return {"id": item["id"], "status": "failed", "error": str(e)}

async def run():
    items = await get_tracked_items()
    print(f"[{datetime.now(timezone.utc):%Y-%m-%d %H:%M}] Checking {len(items)} items...")
    
    # Process in batches of CONCURRENCY
    for i in range(0, len(items), CONCURRENCY):
        batch = items[i:i+CONCURRENCY]
        tasks = [scrape_with_retry(item, detect_scraper(item["product_url"])) for item in batch]
        results = await asyncio.gather(*tasks)
        for r in results:
            if r["status"] == "success":
                print(f"  ✓ €{r['price']}")
            else:
                print(f"  ✗ {r['error'][:80]}")
```

---

## 4. FAILURE HANDLING

### 4.1 Types of Failures

| Failure | Current Behavior | Production Fix |
|---|---|---|
| Network timeout | Exception caught, item skipped | Retry 3× with exponential backoff (1s, 2s, 4s) |
| Store blocks IP (403/429) | Exception caught, item skipped | Rotate IP (proxy), add longer delay, skip store for this run |
| Cloudflare JS challenge | Tier 2 tries FlareSolverr | Ensure FlareSolverr is running; provide fallback |
| robots.txt disallows | Item skipped with log message ✅ | Already handled |
| DB write fails | Exception caught, item skipped | Retry DB write; log to file if persistent |
| Python process crashes | All progress lost | Write checkpoints to DB (scraper_jobs table) |

### 4.2 Logging

Add structured logging:

```python
# scraper/logger.py
import logging
import json
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('giftwise-scraper')
```

---

## 5. SCHEDULING OPTIONS

| Option | Pros | Cons | Best For |
|---|---|---|---|
| **pg_cron (current)** | Free, runs in Supabase, no infra | Edge Function 60s timeout, limited memory | Light loads (<50 items) |
| **GitHub Actions cron** | Free, easy setup | 5-min granularity, no persistence | Light loads |
| **Azure Container Apps timer** | Production-grade, scalable | Requires Azure setup, costs $ | Production |
| **Manual `python main.py`** | Simple, no infra | Family member must run it | Family MVP |

**Recommendation:** For family use, stick with pg_cron + Edge Function (already configured) OR manual run. For 50+ items, move to Azure Container Apps.

---

## 6. SECURITY (Scraper-Specific)

### 6.1 SSRF Protection

The scraper accepts arbitrary URLs from the `wishlist_items` table. An attacker who can insert a row into `wishlist_items` could cause the scraper to fetch internal services.

**Fix:**
```python
# main.py — URL validation
import ipaddress
from urllib.parse import urlparse

BLOCKED_HOSTS = ['localhost', '127.0.0.1', '::1', '10.', '172.16.', '192.168.']

def is_safe_url(url: str) -> bool:
    parsed = urlparse(url)
    hostname = parsed.hostname or ''
    for blocked in BLOCKED_HOSTS:
        if hostname.startswith(blocked) or hostname == blocked:
            return False
    return parsed.scheme in ('http', 'https')
```

### 6.2 Resource Exhaustion

A maliciously large HTML page could consume all memory.

**Fix:**
```python
# In cloudflare.py and firecrawl.py
MAX_RESPONSE_SIZE = 5 * 1024 * 1024  # 5 MB
# Read response in chunks, abort if exceeds limit
```

---

## 7. SCRAPER CHECKLIST

```
☐ Fix 'APPIFY_API_TOKEN' typo → 'APIFY_API_TOKEN' in skroutz.py
☐ Add retry logic (3 attempts, exponential backoff)
☐ Add concurrent processing (asyncio.gather with concurrency=3)
☐ Add SSRF URL validation
☐ Add response size limit (5 MB)
☐ Add structured logging (file + stdout)
☐ Create scraper_jobs table for tracking status
☐ Add health check endpoint
☐ Document FlareSolverr setup for production
☐ Test with a real production URL set
☐ Add README section for running the scraper
☐ Consider separating "fetch name/price on add" from "daily price check"
```

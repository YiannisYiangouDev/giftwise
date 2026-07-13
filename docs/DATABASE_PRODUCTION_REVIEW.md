# GiftWise — Database Production Review

> **Review Date:** July 13, 2026 | **DB:** Supabase PostgreSQL 17 | **Region:** eu-west-2 (Ireland)

---

## 1. CURRENT SCHEMA

### 1.1 Tables (9 total, 8 with RLS)

| # | Table | Rows (est.) | RLS | Key Columns |
|---|---|---|---|---|
| 1 | `recipients` | <100 | ✅ | user_id, name, birthday, relationship, budget_min, budget_max |
| 2 | `wishlists` | <200 | ✅ | recipient_id FK, title, occasion, share_token, is_public |
| 3 | `wishlist_items` | <1000 | ✅ | wishlist_id FK, product_name, product_url, target_price, current_best_price, status |
| 4 | `price_history` | <10K | ✅ | item_id FK, store_name, price, checked_at |
| 5 | `tracked_stores` | 16 | ❌ | name, base_url, scraper_type, scraper_config |
| 6 | `notifications` | <5K | ✅ | user_id, type, title, is_read |
| 7 | `contributions` | <500 | ✅ | item_id FK, user_id FK, amount |
| 8 | `secret_santa_groups` | <50 | ✅ | creator_id FK, name, is_drawn |
| 9 | `secret_santa_participants` | <200 | ✅ | group_id FK, user_id FK, assigned_to_user_id FK |

### 1.2 Migrations (6 files)

| # | File | Status |
|---|---|---|
| 1 | `0001_init.sql` | Applied |
| 2 | `0002_seed_stores.sql` | Applied |
| 3 | `0003_cron.sql` | Applied |
| 4 | `0004_rls_policies.sql` | Applied |
| 5 | `0005_group_gifts_secret_santa.sql` | Applied (via SQL Editor) |

---

## 2. INDEX ANALYSIS

### 2.1 Existing Indexes (auto-created by PostgreSQL)

| Table | Column | Index Type | Created By |
|---|---|---|---|
| All tables | `id` (PK) | B-tree unique | `PRIMARY KEY` |
| `recipients` | `user_id` | B-tree | FK reference |
| `wishlists` | `recipient_id` | B-tree | FK reference |
| `wishlist_items` | `wishlist_id` | B-tree | FK reference |
| `price_history` | `item_id` | B-tree | FK reference |
| `contributions` | `item_id`, `user_id` | B-tree | FK references |
| `secret_santa_groups` | `creator_id` | B-tree | FK reference |
| `secret_santa_participants` | `group_id`, `user_id` | B-tree | FK references |
| `secret_santa_participants` | `(group_id, user_id)` | B-tree unique | `UNIQUE` constraint |
| `notifications` | `user_id` | B-tree | FK reference |

### 2.2 Missing Indexes — Recommended

| # | Table | Column(s) | Rationale |
|---|---|---|---|
| **IDX-01** | `recipients` | `birthday` | Dashboard orders by birthday; Edge Function filters by month-day |
| **IDX-02** | `wishlist_items` | `status` | Tracker excludes purchased/received items on every load |
| **IDX-03** | `price_history` | `(item_id, checked_at)` | Tracker detail page queries price history per item, sorted by date |
| **IDX-04** | `notifications` | `(user_id, is_read)` | Bell icon polls unread count per user (30s interval in prod) |
| **IDX-05** | `wishlist_items` | `(target_price, current_best_price)` | Dashboard "Price Drops" count filters `current_best_price <= target_price` |
| **IDX-06** | `wishlists` | `share_token` | Shared wishlist lookup uses share_token in WHERE clause |
| **IDX-07** | `wishlists` | `(recipient_id, created_at)` | Recipient detail page sorts wishlists by date |

### 2.3 Migration to Add Indexes

```sql
-- 0006_performance_indexes.sql

-- Dashboard: birthday sorting
CREATE INDEX IF NOT EXISTS idx_recipients_birthday ON recipients(birthday);

-- Tracker & wishlist filtering by status
CREATE INDEX IF NOT EXISTS idx_wishlist_items_status ON wishlist_items(status);

-- Price history: per-item chronological lookup
CREATE INDEX IF NOT EXISTS idx_price_history_item_checked 
  ON price_history(item_id, checked_at DESC);

-- Notifications: unread count per user
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read) WHERE is_read = false;

-- Dashboard: price drops filter
CREATE INDEX IF NOT EXISTS idx_wishlist_items_price_target 
  ON wishlist_items(target_price, current_best_price) 
  WHERE target_price IS NOT NULL;

-- Shared wishlist lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_share_token 
  ON wishlists(share_token) WHERE share_token IS NOT NULL;

-- Recipient detail: wishlists by date
CREATE INDEX IF NOT EXISTS idx_wishlists_recipient_created 
  ON wishlists(recipient_id, created_at DESC);
```

**Impact:** These 7 indexes will reduce sequential scans to index scans for the most frequent queries. For a family-scale app (<10K rows total), the performance improvement is modest but will ensure scalability.

---

## 3. NORMALIZATION REVIEW

### 3.1 Current Normal Form: 3NF ✅

The schema is reasonably normalized:
- No repeating groups → 1NF ✅
- No partial dependencies → 2NF ✅ (all non-key columns depend on full PK)
- No transitive dependencies → 3NF ✅ (eg. `recipients.budget_max` depends on `recipients.id`, not on `wishlists.recipient_id`)

### 3.2 Minor Concerns

| Issue | Table | Suggestion |
|---|---|---|
| `status` is a TEXT enum | `wishlist_items` | Create a proper PostgreSQL ENUM type: `CREATE TYPE item_status AS ENUM ('wanted','claimed','purchased','received')` |
| `currency` is TEXT with default 'EUR' | `wishlist_items`, `price_history` | Consider ENUM or enforce via CHECK constraint |
| `scraper_config` is JSONB | `tracked_stores` | Fine for 16 rows. At scale, normalize into a `scraper_configs` table. |
| No `photo_url` validation | `recipients` | Column exists in schema but never populated. Consider removing or implementing image upload. |

---

## 4. RLS POLICY AUDIT

### 4.1 Policy Coverage

| Table | Has RLS? | Policies | Coverage |
|---|---|---|---|
| `recipients` | ✅ | `users_own_recipients` (ALL) | Full — users see/edit only their own |
| `wishlists` | ✅ | `users_own_wishlists` (ALL), `public_shared_wishlists` (SELECT) | Full — owner full access, public read-only on shared |
| `wishlist_items` | ✅ | `users_own_wishlist_items` (ALL) | Full — only via wishlist→recipient chain |
| `price_history` | ✅ | `users_own_price_history` (ALL) | Full — only via item→wishlist→recipient chain |
| `notifications` | ✅ | `users_own_notifications` (ALL) | Full |
| `contributions` | ✅ | `users_see_contributions` (SELECT), `users_insert_contributions` (INSERT) | **Gap: No UPDATE/DELETE policy** |
| `secret_santa_groups` | ✅ | `participants_see_groups` (SELECT), `creator_insert_groups` (INSERT) | **Gap: No UPDATE policy for creator** |
| `secret_santa_participants` | ✅ | `participants_see_members` (SELECT), `participants_insert` (INSERT), `view_assignment` (SELECT) | **Gap: No UPDATE policy for assignment during draw** |
| `tracked_stores` | ❌ | None | Public read-only — acceptable; admin-only write |

### 4.2 RLS Gap: Contributions can't be updated or deleted

Contributions can be inserted but not edited or removed by the contributor.

**Fix:**
```sql
CREATE POLICY "users_update_own_contributions" ON contributions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_contributions" ON contributions
  FOR DELETE USING (auth.uid() = user_id);
```

### 4.3 RLS Gap: Secret Santa creator can't update group settings

The creator can insert but not change name/budget/is_drawn after creation.

**Fix:**
```sql
CREATE POLICY "creator_update_groups" ON secret_santa_groups
  FOR UPDATE USING (auth.uid() = creator_id);
```

### 4.4 RLS Gap: Draw requires UPDATE on participants

The Fisher-Yates draw in `SecretSantaActions.tsx` updates `assigned_to_user_id`. This should be restricted to the group creator.

**Fix:**
```sql
CREATE POLICY "creator_update_participants" ON secret_santa_participants
  FOR UPDATE USING (
    group_id IN (SELECT id FROM secret_santa_groups WHERE creator_id = auth.uid())
  );
```

---

## 5. QUERY PERFORMANCE

### 5.1 Most Expensive Queries (by frequency)

| Query | Location | Pattern | Current Plan | Optimized? |
|---|---|---|---|---|
| Dashboard stats | `dashboard/page.tsx` | 3 SELECT counts | Sequential scan (no index on status) | Add IDX-02 |
| Recipients list | `recipients/page.tsx` | `SELECT * ORDER BY name` | Sequential scan on small table | Fine for <100 rows |
| Wishlists list | `wishlists/page.tsx` | `SELECT *, recipients(name)` JOIN | Nested loop join on FK index | Fine |
| Tracker items | `tracker/page.tsx` | `SELECT *, wishlists(title, recipients(name))` double JOIN | Two nested loops | Fine |
| Price history | `tracker/[id]/page.tsx` | `SELECT * WHERE item_id = $1 ORDER BY checked_at` | Index scan on item_id FK | Add IDX-03 |
| Unread count | `TopBar.tsx` | `SELECT count(*) WHERE user_id = $1 AND is_read = false` | Partial index scan | Add IDX-04 |
| Price drops count | `dashboard/page.tsx` | `SELECT count(*) WHERE current_best_price <= target_price AND target_price IS NOT NULL` | Sequential scan | Add IDX-05 |
| Shared wishlist | `s/[token]/page.tsx` | `SELECT * WHERE share_token = $1 AND is_public = true` | Sequential scan | Add IDX-06 |
| Search (Skroutz) | `api/search/route.ts` | Python subprocess → Skroutz.cy | External HTTP call | Not DB-related |

---

## 6. DATA INTEGRITY

### 6.1 Constraints Present

- ✅ Foreign keys on all relational columns
- ✅ `CASCADE` on delete for `wishlists`, `wishlist_items`, `price_history`
- ✅ `CHECK` constraint on `wishlist_items.status`
- ✅ `CHECK` constraint on `contributions.amount > 0`
- ✅ `UNIQUE(group_id, user_id)` on `secret_santa_participants`

### 6.2 Constraints Missing

| # | Table | Constraint | Why |
|---|---|---|---|
| **CON-01** | `wishlist_items` | `target_price > 0` CHECK | Negative target prices should be impossible |
| **CON-02** | `price_history` | `price > 0` CHECK | Negative prices should be impossible |
| **CON-03** | `recipients` | `budget_max >= budget_min` CHECK | Invalid budget ranges should be rejected |

**Migration:**
```sql
ALTER TABLE wishlist_items ADD CONSTRAINT chk_target_price_positive 
  CHECK (target_price IS NULL OR target_price > 0);
ALTER TABLE price_history ADD CONSTRAINT chk_price_positive 
  CHECK (price > 0);
ALTER TABLE recipients ADD CONSTRAINT chk_budget_range 
  CHECK (budget_max >= budget_min);
```

---

## 7. BACKUP & RECOVERY

### 7.1 Supabase Defaults

| Feature | Status |
|---|---|
| Point-in-Time Recovery (PITR) | 🟡 Not enabled (enabled on Pro plan) |
| Daily backups | ✅ Included on Free plan (14-day retention) |
| Manual backups | ❌ Not configured |

### 7.2 Recommendation

For production, enable PITR in Supabase Dashboard → Database → Backups. This allows recovery to any point in the last 7 days. For the current family-scale use, daily backups are sufficient.

---

## 8. CONNECTION POOLING

### 8.1 Current Setup

The app uses the Supabase connection pooler (port 6543 for transaction mode, 5432 for session mode). The Python scraper and Edge Functions connect directly.

### 8.2 Recommendation

- **Frontend (Next.js):** Use transaction pooler (port 6543) — Supabase client handles this automatically
- **Scraper (Python):** Use session pooler (port 5432) for `supabase-py` — it uses persistent connections
- **Edge Functions:** Supabase injects the optimal connection automatically

---

## 9. MIGRATION STRATEGY

### 9.1 Current State

Migrations are applied manually via Supabase SQL Editor. This is acceptable for a family project but creates risk of:
- Forgetting which migrations have been applied
- Applying migrations out of order
- No rollback capability

### 9.2 Recommended Approach for Production

```bash
# Use Supabase CLI for migration management
npx supabase link --project-ref pnmsysqljdnprcwkerlf
npx supabase db push          # Apply pending migrations
npx supabase db diff --file migration_name  # Generate new migration from local schema
```

---

## 10. DATABASE CHECKLIST

```
☐ IDX-01 through IDX-07: Add 7 performance indexes
☐ CON-01 through CON-03: Add 3 data integrity constraints
☐ RLS Gap: Add UPDATE/DELETE policies for contributions
☐ RLS Gap: Add UPDATE policy for secret_santa_groups (creator)
☐ RLS Gap: Add UPDATE policy for secret_santa_participants (creator draw)
☐ Enable PITR for production (Supabase Pro plan)
☐ Convert TEXT status to ENUM for wishlist_items
☐ Set up Supabase CLI for migration management
☐ Create migration 0006_performance_indexes.sql
☐ Create migration 0007_data_integrity.sql
☐ Create migration 0008_rls_gaps.sql
☐ Document DB connection strings in README
```

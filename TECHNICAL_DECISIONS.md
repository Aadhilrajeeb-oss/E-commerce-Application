# TechMart: Technical Decisions

This document explains the key architectural decisions made during the design and implementation of TechMart.

---

## 1. PostgreSQL over MongoDB

**Decision:** PostgreSQL was chosen as the primary database.

**Rationale:**
- **Relational Integrity**: An e-commerce system has strongly relational data. Orders reference customers and products; order_items reference both orders and products. Foreign key constraints enforced at the database level prevent data orphaning that would be invisible in a document store.
- **ACID Transactions**: The order creation endpoint atomically deducts stock, inserts order records, and creates line items in a single transaction. If any step fails, the entire operation rolls back. PostgreSQL provides this guarantee at the database level, while MongoDB multi-document transactions are more complex and add overhead.
- **SQL Aggregations**: The Reports API uses `GROUP BY`, `DATE_TRUNC`, window functions, and multi-table JOINs — all first-class features in PostgreSQL that would require complex aggregation pipelines in MongoDB.
- **Schema Enforcement**: ENUMs, NOT NULL, CHECK constraints, and UNIQUE constraints validate data at the storage layer, providing a strong safety net.

**Trade-off:** PostgreSQL requires schema migrations, which adds overhead during rapid iteration. This is mitigated by our sequential SQL migration files.

---

## 2. JWT with Refresh Token Rotation

**Decision:** Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored in `httpOnly` cookies.

**Rationale:**
- **Stateless Access Tokens**: The Express server can verify any request without a database lookup, enabling horizontal scaling.
- **httpOnly Cookie Security**: The refresh token is inaccessible to JavaScript, eliminating XSS attack vectors that could steal it from `localStorage`.
- **Token Rotation on Refresh**: Every call to `/api/auth/refresh` issues a *new* refresh token. The old token is blacklisted in Redis. This pattern detects token theft: if an attacker uses a stolen token after the legitimate user has refreshed, the blacklist check will catch it.
- **Redis Blacklist for Logout**: Since JWTs are stateless, logout cannot truly "delete" a token. We store the token's remaining TTL in Redis as a blacklist entry, effectively invalidating it for the rest of its valid lifespan.

**Trade-off:** Redis becomes a dependency for auth. If Redis is unavailable, logged-out tokens could theoretically still work until they expire naturally (max 15 min for access tokens).

---

## 3. Order State Machine Approach

**Decision:** Order status transitions are validated via an explicit allowedTransitions map in the service layer.

```javascript
const validTransitions = {
  placed:     ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
};
```

**Rationale:**
- **Business Rule Enforcement**: An order cannot skip states (e.g., jump from `placed` to `delivered`) or move backwards (`shipped` → `processing`). This models the real-world physical constraint that a shipped package cannot be "un-shipped".
- **Auditability**: The state machine creates a predictable, auditable trail. Combined with `inventory_logs`, every stock movement is attributable to an order event.
- **Atomic Cancellation**: Cancelling an order triggers a database transaction that simultaneously updates the order status and restores all deducted stock quantities, ensuring inventory consistency.

**Trade-off:** Adding new statuses requires updating the transitions map and potentially the frontend UI. This is by design — status changes should be deliberate.

---

## 4. Redis Caching for Reports

**Decision:** All Report API endpoints cache their query results in Redis with a 15-minute TTL.

**Rationale:**
- **Query Complexity**: Report queries use multi-table JOINs, `GROUP BY`, and `DATE_TRUNC` over potentially large datasets. These can take hundreds of milliseconds on a production database.
- **Read-Heavy Pattern**: Reports are typically viewed repeatedly by multiple staff members throughout the day, but the underlying data only changes when new orders are placed. A 15-minute stale window is an acceptable trade-off.
- **Cache Key Design**: Cache keys encode the full set of query parameters (`report-name:{ dateFrom, dateTo, period }`), ensuring that different date ranges always produce fresh results.

**Trade-off:** Data can be up to 15 minutes stale. The Reports page includes a manual "Refresh" button that bypasses the cache by constructing a unique cache key. In future, a cache invalidation hook on order creation could be added.

---

## 5. Database Transaction Strategy

**Decision:** All multi-step write operations use explicit PostgreSQL client connections with `BEGIN`/`COMMIT`/`ROLLBACK`.

**Rationale:** Operations like "create order" touch 4 tables: `orders`, `order_items`, `products` (stock deduction), and `inventory_logs`. If the application crashes between steps, partial data would corrupt inventory counts. Using a transaction with `client.release()` in a `finally` block guarantees the connection is always returned to the pool, even on error.

---

## 6. Vite + React over Next.js

**Decision:** The frontend is a Vite-bundled React SPA, not a Next.js SSR application.

**Rationale:** An admin dashboard does not need Server-Side Rendering for SEO purposes — it sits behind an authentication wall. Vite provides extremely fast HMR during development and produces an optimized static bundle that is served via Nginx in production, keeping the deployment simple and portable.

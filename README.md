# TechMart — E-Commerce Admin & Order Management System

A production-grade admin dashboard for a consumer electronics retailer. Built with React, Node.js/Express, PostgreSQL, and Redis.

---

## Features

- 🔐 **JWT Authentication** — Secure login with access/refresh token rotation
- 🛍️ **Product Management** — Full CRUD with image support, SKU generation, and FakeStoreAPI import
- 📦 **Order Lifecycle** — Atomic state machine: placed → processing → shipped → delivered
- 💳 **Stripe Integration** — PaymentIntent creation and webhook handling
- 📊 **Analytics Dashboard** — Revenue trends, top products, category breakdown, and customer LTV with Redis caching
- 📄 **PDF Invoices** — Auto-generated, downloadable invoices per order
- ⏰ **Inventory Alerts** — Hourly cron job detects low-stock products
- 🐳 **Docker Ready** — Full multi-service docker-compose setup

---

## System Architecture

```
┌──────────────────────┐     ┌──────────────────────────┐     ┌──────────────────┐
│   React Admin SPA    │────▶│  Express.js API Server   │────▶│   PostgreSQL DB  │
│  (Vite + Tailwind)   │     │    (Node.js Backend)     │     │  (Primary Store) │
└──────────────────────┘     └───────────┬──────────────┘     └──────────────────┘
                                         │                              ▲
                                         ▼                              │
                             ┌──────────────────────┐                  │
                             │      Redis Cache      │     ┌────────────────────────┐
                             │  (Sessions, Reports)  │     │    External Services   │
                             └──────────────────────┘     │  • Stripe (Payments)   │
                                                           │  • FakeStoreAPI (Seed) │
                                                           └────────────────────────┘
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

---

## Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-org/techmart.git
cd techmart
```

### 2. Backend Setup
```bash
cd techmart-backend
cp .env.example .env
# Edit .env with your database credentials and secrets
npm install
```

### 3. Run Database Migrations
Connect to your PostgreSQL instance and run the migration files in order:
```bash
psql -U your_user -d techmart -f migrations/000_init.sql
psql -U your_user -d techmart -f migrations/001_users.sql
psql -U your_user -d techmart -f migrations/002_categories.sql
psql -U your_user -d techmart -f migrations/003_products.sql
psql -U your_user -d techmart -f migrations/004_customers.sql
psql -U your_user -d techmart -f migrations/005_orders.sql
psql -U your_user -d techmart -f migrations/006_order_items.sql
psql -U your_user -d techmart -f migrations/007_payments.sql
psql -U your_user -d techmart -f migrations/008_inventory_logs.sql
```

### 4. Start the Backend
```bash
cd techmart-backend
node src/server.js
# Server starts on http://localhost:5000
```

### 5. Frontend Setup
```bash
cd techmart-frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

---

## Environment Variables Reference

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment name | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pw@localhost:5432/techmart` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `JWT_SECRET` | Access token signing secret (min. 64 chars) | `...random string...` |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (min. 64 chars) | `...random string...` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_...` |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login and receive tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout (blacklist token) |
| `GET` | `/api/products` | List products (paginated) |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/:id` | Get product by ID |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Archive product |
| `POST` | `/api/products/import-external` | Import from FakeStoreAPI |
| `PUT` | `/api/products/:id/stock` | Update stock level |
| `GET` | `/api/categories/tree` | Get category tree |
| `GET` | `/api/customers` | List customers |
| `GET` | `/api/customers/:id/orders` | Customer order history |
| `POST` | `/api/orders` | Create order (transactional) |
| `GET` | `/api/orders` | List orders (filtered) |
| `PATCH` | `/api/orders/:id/status` | Update order status |
| `POST` | `/api/orders/:id/cancel` | Cancel order + restore stock |
| `GET` | `/api/orders/:id/invoice` | Download PDF invoice |
| `POST` | `/api/payments/create-intent` | Create Stripe PaymentIntent |
| `POST` | `/api/payments/webhook` | Stripe webhook handler |
| `GET` | `/api/inventory/alerts` | Low stock alerts |
| `GET` | `/api/reports/sales-summary` | Sales summary aggregation |
| `GET` | `/api/reports/revenue-by-category` | Revenue by product category |
| `GET` | `/api/reports/top-products` | Top selling products |
| `GET` | `/api/reports/order-funnel` | Order conversion funnel |
| `GET` | `/api/reports/customer-ltv` | Customer lifetime value |

---

## Running Tests

Ensure your test database is running and environment variables are set, then:
```bash
cd techmart-backend
npm test
```

---

## Docker Deployment

```bash
# Copy and configure production env
cp .env.production.example techmart-backend/.env

# Build and start all services
docker-compose up -d --build

# The frontend is accessible at http://localhost:80
# The backend API is accessible at http://localhost:5000
```

---

## Final Security Checklist

- ☑ All secrets loaded from environment variables — never hardcoded
- ☑ Passwords hashed with bcrypt (12 rounds)
- ☑ JWT tokens rotate on each refresh; old tokens blacklisted in Redis
- ☑ Stripe webhook signature verified server-side
- ☑ Helmet.js HTTP security headers enabled
- ☑ CORS restricted to configured origins
- ☑ Database transactions used for all multi-step write operations
- ☑ SQL parameterized queries (no string interpolation)
- ☑ Docker container runs as non-root user

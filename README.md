# TechMart — Premium E-Commerce & Management Ecosystem

TechMart is a dual-interface e-commerce platform designed for both operational excellence and luxury retail. It combines a data-heavy Admin Dashboard for backend operations with a visually stunning, glassmorphic Customer Storefront.

---

## 💎 Visual Experience

### **The Luxury Storefront**
A premium acquisition environment featuring dark-mode aesthetics, smooth transitions, and high-fidelity product cards.
![Customer Store](docs/screenshots/customer_store.png)

### **The Intelligence Hub (Admin & Insights)**
Real-time tracking of revenue, orders, and customer lifetime value.
![Customer Dashboard](docs/screenshots/customer_dashboard.png)

---

## ✨ Key Features

### **Dual-Interface Architecture**
- **Admin Hub**: Full-lifecycle order management, advanced reporting (Recharts), and real-time inventory tracking.
- **Customer Experience**: A "Luxury-First" interface with personalized dashboards and instant payment workflows.

### **Core Modules**
- 🔐 **Multi-Role Auth**: Secure JWT-based authentication for `admin`, `staff`, and `customer` roles.
- 💳 **Stripe Integration**: Full PaymentIntent lifecycle with server-side webhook validation for secure transactions.
- 📊 **Advanced Analytics**: Revenue trends, top-selling categories, and customer LTV with Redis-backed caching.
- 📄 **Dynamic Invoicing**: Automated PDF generation using PDFKit for every successful acquisition.
- ⏰ **Smart Inventory**: Hourly cron jobs monitoring stock health with automated alert triggers.
- 🐳 **Infrastructure**: Production-ready containerization with Docker and Docker Compose.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Lucide, Zustand |
| **Backend** | Node.js, Express.js, JWT, PDFKit |
| **Database** | PostgreSQL 15, Redis (Caching) |
| **Payments** | Stripe API (Elements + Webhooks) |
| **DevOps** | Docker, Docker Compose, Git |

---

## 🚀 Getting Started

### 1. Prerequisite Setup
Ensure you have Node.js 20+, PostgreSQL 15+, and Redis running.

### 2. Environment Configuration
Clone the repository and configure your `.env` files in both `techmart-backend` and `techmart-frontend`.

```bash
# In techmart-backend
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/techmart
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Database Initialization
Run the migrations in order:
```bash
psql -d techmart -f migrations/000_init.sql
# ... run files 001 through 008 ...
psql -d techmart -f migrations/009_customer_auth.sql
```

### 4. Luxury Seeding
Create your first premium customer account and initial data:
```bash
cd techmart-backend
node src/seed-luxury-customer.js
```
*Default Credentials:* `aadhil@luxury.com` / `password123`

### 5. Launch the Ecosystem
```bash
# Backend
cd techmart-backend && npm run dev

# Frontend
cd techmart-frontend && npm run dev
```

---

## 🔒 Security & Performance
- **Atomic Operations**: All financial and inventory updates are wrapped in SQL transactions.
- **Security Headers**: Helmet.js and restricted CORS origins enabled.
- **Data Protection**: 12-round BCrypt hashing and secure JWT rotation.
- **Optimized Caching**: Heavy reporting queries are cached in Redis to ensure sub-100ms response times.

---

*Built with passion for high-performance commerce.*

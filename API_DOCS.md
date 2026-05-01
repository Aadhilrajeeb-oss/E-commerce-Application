# TechMart API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require the header: `Authorization: Bearer <accessToken>`

All responses follow the schema:
```json
{
  "success": true,
  "message": "Success",
  "data": {},
  "error": null
}
```

---

## Auth

### POST /auth/register
Register a new admin or staff user.

**Request Body:**
```json
{
  "name": "Alice Admin",
  "email": "alice@techmart.com",
  "password": "securepassword",
  "role": "admin"
}
```
**Response (201):**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Alice Admin", "email": "alice@techmart.com", "role": "admin" }
}
```

---

### POST /auth/login
Authenticate and receive tokens.

**Request Body:**
```json
{ "email": "alice@techmart.com", "password": "securepassword" }
```
**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": { "id": "uuid", "name": "Alice Admin", "role": "admin" }
  }
}
```
*Note: `refreshToken` is set as an httpOnly cookie.*

---

### POST /auth/refresh
Rotate the refresh token and receive a new access token.

**Requires:** `refreshToken` cookie.
**Response (200):** `{ "data": { "accessToken": "new_token" } }`

---

### POST /auth/logout
Invalidate the current session.

**Requires:** Authentication header + `refreshToken` cookie.
**Response (200):** `{ "message": "Logged out successfully" }`

---

## Products

### GET /products
List products with pagination and filtering.

**Query Params:** `page`, `limit`, `search`, `category` (UUID), `status` (active|draft|archived)

**Response (200):**
```json
{
  "data": {
    "products": [{ "id": "uuid", "name": "MacBook Pro", "sku": "SKU-ABC123", "price": "1299.99", "stock_quantity": 45, "status": "active" }],
    "pagination": { "total": 120, "page": 1, "limit": 10, "totalPages": 12 }
  }
}
```

---

### POST /products
Create a new product. **Requires:** `admin` role.

**Request Body:**
```json
{
  "name": "Samsung Galaxy S24",
  "category_id": "uuid-of-category",
  "price": 899.99,
  "cost_price": 620.00,
  "stock_quantity": 200,
  "images": ["https://example.com/image.jpg"],
  "status": "active"
}
```

---

### POST /products/import-external
Fetch and bulk insert products from FakeStoreAPI. Skips duplicates by SKU.

**Response (200):** `{ "data": { "imported": 15 } }`

---

### PUT /products/:id/stock
Atomically adjust stock and write to inventory log. **Requires:** `admin` role.

**Request Body:**
```json
{ "change_type": "restock", "delta": 50, "note": "Q2 inventory replenishment" }
```

---

## Orders

### POST /orders
Create an order with atomic stock deduction.

**Request Body:**
```json
{
  "customer_id": "uuid",
  "items": [
    { "product_id": "uuid", "quantity": 2 },
    { "product_id": "uuid2", "quantity": 1 }
  ]
}
```
**Response (201):** Returns the created order object.

**Error (400):** If any product has insufficient stock:
```json
{ "success": false, "message": "Insufficient stock for product Samsung Galaxy S24" }
```

---

### PATCH /orders/:id/status
Transition order status via the state machine. **Requires:** `admin` role.

**Request Body:** `{ "status": "processing" }`

**Valid Transitions:**
| From | To |
|---|---|
| placed | processing, cancelled |
| processing | shipped, cancelled |
| shipped | delivered |
| delivered | *(terminal)* |
| cancelled | *(terminal)* |

**Error (400):** `{ "message": "Invalid status transition from shipped to processing" }`

---

### GET /orders/:id/invoice
Streams a PDF invoice directly. Open in browser or download.

**Response:** `Content-Type: application/pdf`

---

## Reports

All report endpoints accept `dateFrom` and `dateTo` query params (ISO date strings). Results are cached for 15 minutes.

### GET /reports/sales-summary
**Query Params:** `dateFrom`, `dateTo`, `period` (daily|weekly|monthly)

**Response (200):**
```json
{
  "data": {
    "summary": { "total_orders": 482, "total_revenue": "94300.50", "avg_order_value": "195.64" },
    "timeline": [{ "period": "2025-04-01", "order_count": 22, "revenue": "4400.00" }]
  }
}
```

---

### GET /reports/top-products
**Query Params:** `limit` (default 10), `dateFrom`, `dateTo`

**Response (200):**
```json
{
  "data": [
    { "name": "iPhone 16 Pro", "sku": "APPL-0001", "units_sold": 312, "revenue": "467880.00" }
  ]
}
```

---

### GET /reports/customer-ltv
Returns top 20 customers ranked by total spend.

**Response (200):**
```json
{
  "data": [
    { "id": "uuid", "name": "John Doe", "email": "john@example.com", "order_count": 8, "lifetime_value": "3200.00" }
  ]
}
```

---

## Inventory

### GET /inventory/alerts
Returns products with `stock_quantity < 10`.

**Response (200):**
```json
{
  "data": {
    "count": 3,
    "items": [
      { "id": "uuid", "name": "USB-C Hub", "sku": "ACCS-0042", "stock_quantity": 4 }
    ]
  }
}
```

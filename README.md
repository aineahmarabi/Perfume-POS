# EtherealDayo POS

A full-featured Point of Sale system built for perfume retail. Handles sales, inventory, purchase orders, expenses, staff management, and reporting — with real-time sync across all devices.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Routing | React Router v7 |
| Backend / DB | Convex (real-time cloud database) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Features

### Point of Sale (POS)
- Product grid with search, category filter, and brand filter
- Multi-variant support per product (different sizes / ml)
- Add to cart, adjust quantities, per-item discounts
- Sale-level discount and customer attachment
- Hold sales and resume later (up to 10 simultaneous holds)
- Payment methods: Cash, M-Pesa, Card, Split payment
- Cash change calculator
- Printable receipt on sale completion
- Keyboard shortcuts: `F1` focus search · `F5` hold sale · `F9` clear cart · `F12` pay now · `Esc` close modals

### Products & Inventory
- Products with brand, category, image (drag-and-drop upload), and description
- Multiple size variants per product (e.g. 30ml, 50ml, 100ml)
- Cost price, selling price, SKU, barcode, expiry date per variant
- Tester flag per variant (excluded from POS)
- Low-stock threshold alerts
- Stock movement history (sale, purchase, adjustment, return, damage, transfer)
- Manual stock adjustments with reason tracking

### Sales History
- Full sales log with filters by status, payment method, and date range
- Sale detail modal with itemised breakdown
- Void sales (admin only) with reason — automatically reverses stock

### Purchase Orders
- Create POs against suppliers
- Draft → Ordered → Received workflow with partial receive support
- Stock auto-increments on receive

### Customers
- Customer profiles with name, phone, and email
- Purchase history per customer
- Total spent, visit count, and loyalty points tracking

### Expenses
- Log business expenses by category: rent, utilities, salaries, supplies, marketing, maintenance, other
- Filter by date and category

### Suppliers
- Supplier directory with contact details
- Activate / deactivate suppliers

### Reports (Admin only)
- **Sales Report** — revenue, transactions, average order value over custom date ranges
- **Product Report** — top-selling products and low-stock alerts
- **Profit Report** — revenue vs cost vs expenses, gross and net profit
- **Payment Report** — breakdown by payment method
- **Staff Report** — sales performance per cashier

### Settings (Admin only)
- Shop name, address, phone, email, VAT rate, currency, receipt footer
- Brands & Categories management (add, soft-delete, restore)
- User management (add cashiers / admins, set PINs, activate / deactivate)

### Auth & Roles
- PIN-based login (no passwords)
- Two roles: **Admin** (full access) and **Cashier** (POS + sales view only)
- Lock screen from POS without losing cart state
- Shared auth context — lock/unlock without page refresh

### Real-time
- All data via Convex WebSocket subscriptions — every connected device updates instantly when a sale is made, stock changes, or settings are updated

---

## Project Structure

```
├── convex/                       # Backend (Convex cloud functions)
│   ├── schema.ts                 # Database schema — all tables + indexes
│   ├── auth.ts                   # PIN login / user queries
│   ├── products.ts               # Product + variant CRUD
│   ├── inventory.ts              # Stock overview, adjustments, movements
│   ├── sales.ts                  # Sale creation, void, hold / resume
│   ├── customers.ts              # Customer CRUD + search
│   ├── brands.ts                 # Brand CRUD (soft delete)
│   ├── categories.ts             # Category CRUD (soft delete)
│   ├── suppliers.ts              # Supplier CRUD
│   ├── purchaseOrders.ts         # PO create, status, receive stock
│   ├── expenses.ts               # Expense CRUD
│   ├── reports.ts                # Dashboard stats + report queries
│   ├── settings.ts               # Key-value settings store
│   ├── users.ts                  # Staff management
│   └── mpesa.ts                  # M-Pesa STK push integration
│
├── src/
│   ├── main.tsx                  # App entry — AuthProvider + Router
│   ├── App.tsx                   # Route definitions + role guards
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx       # Shared auth state (login / logout)
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Re-export from AuthContext
│   │   ├── useCart.ts            # Cart state (items, totals, hold)
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useDebounce.ts
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── POSPage.tsx
│   │   ├── ProductsPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── SalesPage.tsx
│   │   ├── CustomersPage.tsx
│   │   ├── PurchasesPage.tsx
│   │   ├── SuppliersPage.tsx
│   │   ├── ExpensesPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── SettingsPage.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminLayout.tsx   # Sidebar + header wrapper
│   │   │   ├── Sidebar.tsx       # Desktop navigation
│   │   │   └── BottomNav.tsx     # Mobile bottom tab bar
│   │   ├── pos/
│   │   │   ├── ProductGrid.tsx   # POS product browser + search
│   │   │   ├── CartPanel.tsx     # Cart items + totals
│   │   │   ├── PaymentModal.tsx  # Payment flow
│   │   │   └── ReceiptModal.tsx  # Post-sale receipt
│   │   └── ui/                   # Primitives: Button, Input, Select,
│   │                             #   Modal, Table, Badge, Tabs,
│   │                             #   SearchInput, ImageUpload,
│   │                             #   Skeleton, EmptyState, ...
│   │
│   ├── lib/
│   │   └── utils.ts              # cn(), formatCurrency, formatDate, ...
│   │
│   └── index.css                 # Tailwind + CSS variables + utilities
│
├── public/
│   └── Ethereal Dayo official Logo.png
│
├── index.html                    # Tab title: EtherealDayo POS
├── vercel.json                   # SPA rewrite rule
├── vite.config.ts
└── tailwind.config.js
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Staff accounts (admin / cashier, PIN auth) |
| `brands` | Perfume brands (soft delete) |
| `categories` | Product categories (soft delete) |
| `products` | Core product catalog with image |
| `productVariants` | Size variants — price, stock, SKU per size |
| `customers` | Customer profiles + loyalty data |
| `sales` | Completed / voided / held transactions |
| `stockMovements` | Full audit trail of every stock change |
| `suppliers` | Supplier directory |
| `purchaseOrders` | POs with draft → ordered → received workflow |
| `expenses` | Business expense log |
| `settings` | Key-value store for shop configuration |
| `mpesaPayments` | M-Pesa STK push tracking |

---

## Getting Started (Local)

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev) account (free tier works)

### 1. Clone

```bash
git clone https://github.com/aineahmarabi/Perfume-POS.git
cd Perfume-POS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Convex

```bash
npx convex dev
```

This will prompt you to log in, create a project, and generate `.env.local` with your deployment URL and key automatically.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 5. Seed initial data (first run only)

```bash
npx convex run seed:createAdmin
```

This creates the default admin account. Change the PIN immediately in **Settings → Users**.

---

## Deployment (Vercel)

### Required Environment Variables

Set these in your Vercel project under **Settings → Environment Variables**:

| Variable | Example Value |
|---|---|
| `VITE_CONVEX_URL` | `https://small-toad-585.convex.cloud` |
| `VITE_CONVEX_SITE_URL` | `https://small-toad-585.convex.site` |

> **Never add `CONVEX_DEPLOY_KEY` to Vercel.** Keep it in `.env.local` on your machine only — it is gitignored and must not be committed.

### Deploy Steps

1. Push to `main` on GitHub
2. Vercel auto-deploys on every push
3. The `vercel.json` SPA rewrite handles client-side routing

---

## Keyboard Shortcuts (POS)

| Key | Action |
|---|---|
| `F1` | Focus product search |
| `F5` | Hold current sale |
| `F9` | Clear cart |
| `F12` | Open payment modal |
| `Esc` | Close any open modal |

---

## Roles & Permissions

| Feature | Cashier | Admin |
|---|---|---|
| POS — process sales | Yes | Yes |
| View own sales | Yes | Yes |
| View all sales / void sales | No | Yes |
| Products & Inventory | No | Yes |
| Purchase Orders & Suppliers | No | Yes |
| Expenses | No | Yes |
| Reports | No | Yes |
| Settings & User management | No | Yes |

---

## Security

- `.env.local` is in `.gitignore` — contains `CONVEX_DEPLOY_KEY`, never committed
- PINs are hashed before storage
- Admin-only routes are guarded on the frontend and enforced in Convex mutations server-side

---

## License

Private — all rights reserved. Built for EtherealDayo Perfume Shop.

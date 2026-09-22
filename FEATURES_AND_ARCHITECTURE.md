# Hisabi-POS — Comprehensive Features, Architecture & System Documentation

Welcome to the definitive reference manual for **Hisabi-POS** (Smart Inventory & Billing SaaS). This document provides an exhaustive breakdown of the application architecture, database models, technical implementation details, business logic, security controls, and feature workflows.

It is structured so that any engineer, product reviewer, or AI assistant can quickly understand, audit, maintain, or extend any part of the system.

---

## 📋 Table of Contents

1. [Executive Summary & Product Vision](#1-executive-summary--product-vision)
2. [System Architecture & Tech Stack](#2-system-architecture--tech-stack)
3. [Multi-Tenant Data Isolation & Security](#3-multi-tenant-data-isolation--security)
4. [Complete Database Schema Blueprint](#4-complete-database-schema-blueprint)
5. [Feature-by-Feature Technical Breakdown](#5-feature-by-feature-technical-breakdown)
   - [5.1 Multi-Tenant Auth & RBAC](#51-multi-tenant-auth--rbac)
   - [5.2 Mobile-First Point of Sale (POS) Engine](#52-mobile-first-point-of-sale-pos-engine)
   - [5.3 Tiered Subscriptions & Plan Protection](#53-tiered-subscriptions--plan-protection)
   - [5.4 Inventory Core, Barcodes & Bundles](#54-inventory-core-barcodes--bundles)
   - [5.5 Credit Sales & Due Collection Lifecycle](#55-credit-sales--due-collection-lifecycle)
   - [5.6 Purchase Orders & Supplier Operations](#56-purchase-orders--supplier-operations)
   - [5.7 Stock Adjustments & Sales Returns](#57-stock-adjustments--sales-returns)
   - [5.8 End of Day (EoD) Register Reconciliation](#58-end-of-day-eod-register-reconciliation)
   - [5.9 Expenses & Sales Targets Management](#59-expenses--sales-targets-management)
   - [5.10 Financial Analytics & KPI Engine](#510-financial-analytics--kpi-engine)
   - [5.11 Smart PDF & CSV Invoice/Report Exporter](#511-smart-pdf--csv-invoicereport-exporter)
   - [5.12 Digital Payments Integration (Razorpay)](#512-digital-payments-integration-razorpay)
   - [5.13 Multi-Language & RTL Engine (English/Arabic)](#513-multi-language--rtl-engine-englisharabic)
   - [5.14 Super-Admin Platform Command Center](#514-super-admin-platform-command-center)
6. [API Route Registry](#6-api-route-registry)
7. [Environment Configuration & Deployment](#7-environment-configuration--deployment)

---

## 1. Executive Summary & Product Vision

**Hisabi-POS** is a modern, high-performance Point of Sale (POS) and inventory management SaaS engineered for multi-regional retail businesses. Originally designed for Middle Eastern markets (UAE, Kuwait) with VAT compliance and Arabic (RTL) support, it features a localized expansion for the **Indian market**, supporting 18% GST (with HSN/SAC codes) and automated subscription billing via **Razorpay**.

### Core Value Propositions
- **High-Speed Mobile POS**: Instant checkout interface optimized for tablets, touchscreens, and smartphones with fast SKU/barcode search.
- **Relational Inventory & Bundles**: Real-time stock tracking supporting composite product bundles (automatic deduction of component parts upon sale).
- **Flexible Debt Tracking**: Built-in customer credit ledger to sell on credit (`due`) and collect partial balance settlements over time.
- **Tax & Regional Localization**: Multi-tax support (5% UAE TRN VAT and 18% India GSTIN/HSN), dual currency formatting (AED, INR, SAR, KWD, USD), and English/Arabic RTL toggles.
- **Tiered SaaS Monetization**: Multi-plan hierarchy (`free`, `gold`, `premium`) enforced by client-side guards and server-side middleware.

---

## 2. System Architecture & Tech Stack

Hisabi-POS is organized as a decoupled full-stack monorepo featuring a RESTful backend API and a single-page application (SPA) frontend.

```
                  +-----------------------------------+
                  |   Client: React 18 + Vite SPA     |
                  |  Tailwind CSS (Glassmorphism UI)  |
                  |  i18next (English & Arabic RTL)   |
                  +-----------------+-----------------+
                                    | HTTP / JSON APIs (JWT Auth)
                                    v
                  +-----------------+-----------------+
                  |     Backend: Express 5 + Node     |
                  |  Controllers / Routes / Middleware|
                  |  Services (PDFKit, Razorpay SDK)|
                  +-----------------+-----------------+
                                    | Sequelize ORM
                                    v
                  +-----------------+-----------------+
                  |   Database: PostgreSQL Server    |
                  |   22 Partitioned Relational Models|
                  +-----------------------------------+
```

### Backend Technology Stack
- **Node.js (>= v20.0.0) + Express 5**: Asynchronous API server handling REST endpoints, input sanitization, and streaming downloads.
- **Sequelize ORM + PostgreSQL**: Transactional relational persistence layer with automated migration/schema sync (`sequelize.sync({ alter: true })`).
- **JWT (JSON Web Tokens) + BcryptJS**: Token-based authentication with password hashing.
- **Joi**: Schema validation for inbound API payloads.
- **PDFKit**: Server-side dynamic PDF generation for tax invoices and sales reports.
- **Razorpay SDK**: Integration for Indian subscription checkouts and HMAC-SHA256 signature verification.

### Frontend Technology Stack
- **React 18 + Vite**: Lightning-fast build system with Hot Module Replacement (HMR).
- **Tailwind CSS**: Custom utility design system featuring dynamic glassmorphism UI cards, dark/light contrast elements, and responsive grids.
- **Lucide-React**: SVG icon library.
- **Recharts**: Responsive chart engine for daily/monthly sales metrics and top product bar/line charts.
- **i18next + react-i18next**: Dictionary-driven internationalization switching dynamically between LTR and RTL direction.

---

## 3. Multi-Tenant Data Isolation & Security

Hisabi-POS utilizes a **logical tenant separation model** where every business register operates as an isolated `Shop`.

### Isolation Principles
1. **Tenant Anchor (`shop_id`)**: Almost all database tables (Products, Invoices, Customers, Expenses, etc.) contain a mandatory `shop_id` foreign key.
2. **Token Payload Injection**: Upon login, the server issues a JWT containing `id`, `username`, `role`, and `shop_id`.
3. **Strict Query Scoping**: Every controller query forces a `where: { shop_id: req.user.shop_id }` clause. This ensures a shop cannot read or manipulate another shop's data under any circumstances.
4. **Global Unique Username Namespace**: Usernames are globally unique across all shops to prevent auth collisions during cross-shop staff queries.
5. **Account Suspension Guard**: Middleware checks `Shop.active`. If a shop is suspended by Super-Admin, all subsequent API calls return HTTP `403 Account Suspended`.

---

## 4. Complete Database Schema Blueprint

The database consists of **22 Sequelize models**. Below is the architectural mapping of all entities and relationships:

```
[Shop] 1 ─── N [User]
[Shop] 1 ─── N [Product] 1 ─── N [BundleItem] N ─── 1 [Product (Component)]
[Shop] 1 ─── N [Category]
[Shop] 1 ─── N [Customer] 1 ─── N [Invoice] 1 ─── N [InvoiceItem]
[Shop] 1 ─── N [Supplier] 1 ─── N [PurchaseOrder] 1 ─── N [PurchaseOrderItem]
[Shop] 1 ─── N [Expense]
[Shop] 1 ─── N [StockAdjustment]
[Shop] 1 ─── N [Return]
[Shop] 1 ─── N [DiscountCode]
[Shop] 1 ─── N [SalesTarget]
[Shop] 1 ─── N [DuePayment]
[SuperAdmin] (Platform Level)
[Advertisement] / [Announcement] (Global Announcements & Banners)
[ActivityLog] (Audit Records)
```

### Key Models Overview

| Model | Table Name | Purpose / Key Columns |
|---|---|---|
| `Shop` | `shops` | Root tenant entity (`id`, `name`, `username`, `email`, `phone`, `plan`, `currency`, `country`, `trn`, `gstin`, `vat_enabled`, `active`) |
| `User` | `users` | Staff & Admin accounts (`id`, `shop_id`, `username`, `password`, `name`, `role`: `admin`/`staff`, `email`, `phone`) |
| `Product` | `products` | Inventory catalog (`id`, `shop_id`, `category_id`, `name`, `barcode`, `sku`, `brand`, `cost_price`, `selling_price`, `mrp`, `stock_quantity`, `is_bundle`, `hsn_sac`, `image_url`) |
| `Category` | `categories` | Product classification (`id`, `shop_id`, `name`, `description`) |
| `BundleItem` | `bundle_items` | Bundle component breakdown (`id`, `bundle_id`, `product_id`, `quantity`) |
| `Invoice` | `invoices` | Transaction sales record (`id`, `invoice_number`, `shop_id`, `user_id`, `customer_name`, `customer_phone`, `subtotal`, `tax_total`, `discount`, `grand_total`, `paid_amount`, `due_balance`, `payment_method`, `status`: `paid`/`partial`/`due`, `date`) |
| `InvoiceItem` | `invoice_items` | Line items inside an invoice (`id`, `invoice_id`, `product_id`, `quantity`, `unit_price`, `cost_price`, `mrp`, `line_total`, `tax_amount`) |
| `Customer` | `customers` | Client directory (`id`, `shop_id`, `name`, `phone`, `email`, `address`, `total_spent`, `total_due`) |
| `DuePayment` | `due_payments` | Debt settlement logs (`id`, `shop_id`, `invoice_id`, `customer_id`, `amount_paid`, `payment_method`, `notes`, `created_at`) |
| `Supplier` | `suppliers` | Wholesale vendors (`id`, `shop_id`, `name`, `contact_person`, `phone`, `email`, `address`, `gstin_trn`) |
| `PurchaseOrder` | `purchase_orders` | Inventory restocking (`id`, `order_number`, `shop_id`, `supplier_id`, `status`: `draft`/`ordered`/`received`/`cancelled`, `total_cost`, `expected_date`) |
| `PurchaseOrderItem` | `purchase_order_items` | Line items in purchase order (`id`, `order_id`, `product_id`, `quantity`, `unit_cost`, `total_cost`) |
| `StockAdjustment` | `stock_adjustments` | Manual inventory logs (`id`, `shop_id`, `product_id`, `adjusted_by`, `type`: `add`/`subtract`, `quantity`, `reason`, `notes`) |
| `Return` | `returns` | Sales return records (`id`, `shop_id`, `invoice_id`, `product_id`, `quantity`, `refund_amount`, `reason`) |
| `Expense` | `expenses` | Operating expenses (`id`, `shop_id`, `category`, `amount`, `notes`, `expense_date`) |
| `DiscountCode` | `discount_codes` | Shop coupons (`id`, `shop_id`, `code`, `discount_type`: `percentage`/`fixed`, `discount_value`, `min_order_amount`, `expiry_date`, `is_active`) |
| `SalesTarget` | `sales_targets` | Monthly/Daily goals (`id`, `shop_id`, `target_amount`, `period`: `daily`/`monthly`, `start_date`, `end_date`) |
| `SuperAdmin` | `super_admins` | SaaS platform owners (`id`, `username`, `password`, `email`) |
| `Advertisement` | `advertisements` | In-app promotion banners broadcast by Super-Admin (`id`, `title`, `image_url`, `link`, `is_active`) |
| `Announcement` | `announcements` | System notification banners (`id`, `title`, `message`, `type`: `info`/`warning`/`alert`, `is_active`) |
| `ActivityLog` | `activity_logs` | System event tracker (`id`, `user_id`, `action`, `details`, `timestamp`) |

---

## 5. Feature-by-Feature Technical Breakdown

### 5.1 Multi-Tenant Auth & RBAC
- **Authentication**: `POST /api/auth/register` creates both a `Shop` record and the initial `admin` `User` inside an atomic transaction. Passwords are hashed using `bcryptjs` (salt factor 10).
- **Username Availability**: `GET /api/auth/check-username/:username` performs rapid validation before sign-up.
- **Roles**:
  - `admin`: Has access to all shop controls, pricing plan upgrades, staff creation, financial reports, and inventory modifications.
  - `staff`: Restricted to POS sales, product searching, customer management, and due collection. Prevented from viewing backend financial analytics and critical shop settings.
  - `super-admin`: Platform administrator operating via dedicated routes (`/api/super-admin/*`).

### 5.2 Mobile-First Point of Sale (POS) Engine
- **Interface**: Designed with a high-density, tabbed mobile layout with fast instant search by Product Name, SKU, or Barcode.
- **Cart Management**: React local state manages cart items, quantities, and line totals dynamically.
- **Checkout Process**:
  - User selects existing customer or proceeds as "Walking Customer".
  - Selects payment method: `Cash`, `Card`, `UPI` (for India), or `Due` (credit sale).
  - Enters `paid_amount`. If `paid_amount < grand_total`, status automatically becomes `partial` or `due`, updating the customer's debt balance.
- **Stock Decrement & Bundles**:
  - Executed inside a database transaction (`sequelize.transaction()`).
  - Standard products decrement `Product.stock_quantity`.
  - Composite bundles lookup component items in `BundleItem` and atomically deduct required quantities for every underlying component.

### 5.3 Tiered Subscriptions & Plan Protection
Hisabi-POS operates on three plan levels: `free`, `gold`, and `premium`.

#### Plan Matrix Rules (`planUtils.js`)
| Feature / Limit | `free` | `gold` | `premium` |
|---|---|---|---|
| **Max Staff Members** | 2 | 20 | Unlimited |
| **Data History Limit** | 6 Months | 24 Months | Unlimited |
| **Advanced Reports** | ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **Supplier Operations** | ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **Purchase Orders** | ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **End of Day Register**| ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **Discount Codes** | ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **Sales Targets** | ❌ Locked | ✅ Unlocked | ✅ Unlocked |
| **Priority Support** | ❌ Locked | ❌ Locked | ✅ Unlocked |
| **Custom Branding** | ❌ Locked | ❌ Locked | ✅ Unlocked |

#### Enforcement Mechanisms
1. **Server Middleware (`planMiddleware.js`)**: Endpoints for restricted features call `requirePlan('gold')`. If current shop level is insufficient, returns HTTP `403 Plan upgrade required`.
2. **Client Guard (`FeatureGuard.jsx`)**: Wraps restricted UI components in frontend modules. If locked, renders a translucent glassmorphism lock overlay prompt with an upgrade trigger.

### 5.4 Inventory Core, Barcodes & Bundles
- **Barcode & SKU Generation**: Unique identifiers assigned to each SKU for hardware barcode scanner integration.
- **Brand Management**: Products can be filtered and cataloged by Brand name.
- **Low Stock Threshold**: Automatically tracks products with `stock_quantity <= min_stock_level` (default 5 or custom) to display alerts on the dashboard and trigger automated warnings.
- **Composite Bundles**: Allows creating "Combo Packages" (e.g. "Gift Basket"). When a bundle product is sold, the POS server looks up `BundleItem` records and automatically deducts individual items from stock.

### 5.5 Credit Sales & Due Collection Lifecycle
- **Credit Sale Creation**: When an invoice is processed with `payment_method = 'due'` or `paid_amount < grand_total`, an outstanding balance is calculated: `due_balance = grand_total - paid_amount`.
- **Customer Ledger**: Automatically increases `Customer.total_due`.
- **Due Collection Module (`/due-collection`)**:
  - Displays all unpaid and partially paid invoices.
  - Allows staff to record partial or full settlements (`POST /api/due-payments`).
  - Decrements `Invoice.due_balance`, updates `Invoice.status` (from `due`/`partial` to `paid`), and reduces `Customer.total_due`.
  - Emits a printable debt receipt for the customer.

### 5.6 Purchase Orders & Supplier Operations
- **Supplier Directory**: Manage vendor details, contact info, and tax registration IDs (GSTIN/TRN).
- **Purchase Order Workflow**:
  1. Create PO in `draft` or `ordered` state with target supplier and product line items.
  2. Upon arrival of goods, mark PO status as `RECEIVED`.
  3. Server automatically updates stock levels for all products in the purchase order inside a transaction.

### 5.7 Stock Adjustments & Sales Returns
- **Stock Adjustments (`StockAdjustment`)**: Manual corrections for stock intake, breakage, loss, or theft. Supports `add` or `subtract` operations with required audit notes and user tracking.
- **Sales Returns (`Return`)**: Process customer returns for specific invoices. Restocks product quantities and calculates refund values.

### 5.8 End of Day (EoD) Register Reconciliation
- **Shift Day Closure**: Helps shop owners balance physical cash drawers at closing time.
- **Calculation Formula**:
  $$\text{Expected Cash} = \text{Opening Cash} + \text{Total Cash Sales} - \text{Total Cash Expenses}$$
- Compares expected cash with physical cash entered by the cashier, logs variance, and saves daily closing reports.

### 5.9 Expenses & Sales Targets Management
- **Expense Tracker**: Log recurring and ad-hoc shop expenses (Rent, Utilities, Salaries) with category tagging.
- **Sales Targets**: Set daily or monthly targets (`SalesTarget`). Live dashboard visual progress bars compare real-time revenue with defined targets.

### 5.10 Financial Analytics & KPI Engine
- **Database Aggregations**: Performs server-side SQL queries (`SUM`, `COUNT`, `GROUP BY`) via Sequelize to produce metrics without fetching whole datasets to memory.
- **KPI Metrics**:
  - **Total Revenue**: Sum of `grand_total` for paid and partial invoices.
  - **Gross Profit**: Calculated by comparing invoice item line totals against snapshot cost prices (`unit_price - cost_price`).
  - **Expenses**: Sum of all logged expense amounts for selected period.
  - **Net Profit**: $\text{Gross Profit} - \text{Expenses}$.
- **Data Visualizations**: Recharts renders revenue trends, sales target comparisons, top 5 selling items, and category distribution pie charts.

### 5.11 Smart PDF & CSV Invoice/Report Exporter
- **Invoice PDF Engine (`pdfService.js`)**: Generates vector-graphic invoice PDFs directly in memory via `PDFKit`.
  - Regional customization: Includes shop logo/name, customer info, tax identifiers (UAE TRN or India GSTIN), HSN/SAC breakdown, discount, subtotal, tax amount, and due balance.
- **CSV Exporter (`exportController.js`)**: Generates clean, downloadable CSV data formatted for accountants and spreadsheet software.

### 5.12 Digital Payments Integration (Razorpay)
- **Target Market**: Indian merchants purchasing SaaS upgrades (`gold` / `premium`).
- **Order Creation**: Client calls `POST /api/razorpay/create-order`. Server uses official Razorpay SDK to create an order instance with amount and currency (INR).
- **Checkout Modal**: Opens official Razorpay SDK popup on frontend.
- **Signature Verification**: Server receives `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`. Verifies validity using HMAC-SHA256 crypto hashing before upgrading `Shop.plan` in the database.

### 5.13 Multi-Language & RTL Engine (English/Arabic)
- **i18next Integration**: Frontend uses dictionary locale files (`en.json`, `ar.json`).
- **RTL Switching**: Switching to Arabic automatically toggles HTML document attributes (`dir="rtl" lang="ar"`), re-aligning sidebars, tables, inputs, and action buttons for native Middle Eastern usability.

### 5.14 Super-Admin Platform Command Center
- **Access**: Secure routes protected by `authenticateSuperAdmin` middleware.
- **Features**:
  - Overview of platform metrics (Total Shops, Active Subscriptions, Total Revenue).
  - Shop Management: Activate, suspend, or manually override plan levels for any registered business.
  - Broadcast System Announcements: Display platform notifications to all active shop dashboards.
  - Promotional Banners: Create and manage in-app advertisements (`Advertisement`).

---

## 6. API Route Registry

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Register new shop and admin account
- `POST /api/auth/login` — Login user & return JWT token
- `GET /api/auth/check-username/:username` — Check username availability
- `GET /api/auth/me` — Fetch currently authenticated user details
- `GET /api/auth/staff` — List shop staff members
- `POST /api/auth/staff` — Add new staff member (Plan cap protected)

### Product Routes (`/api/products`)
- `GET /api/products` — List all products with category filter
- `POST /api/products` — Create product or bundle
- `PUT /api/products/:id` — Update product details
- `DELETE /api/products/:id` — Remove product

### Invoice & POS Routes (`/api/invoices`)
- `GET /api/invoices` — List shop invoices with pagination & status filters
- `POST /api/invoices` — Process POS sale transaction & update stock
- `GET /api/invoices/:id/pdf` — Stream generated PDF invoice download

### Due Payment Routes (`/api/due-payments`)
- `GET /api/due-payments/unpaid` — List all unpaid/partial customer invoices
- `POST /api/due-payments` — Record debt payment settlement

### Reports & Analytics Routes (`/api/reports`)
- `GET /api/reports/dashboard` — Summary KPIs (Today Sales, Total Revenue, Low Stock)
- `GET /api/reports/daily` — Daily sales metrics for charts
- `GET /api/reports/top-products` — Top selling products by volume & revenue

### Export Routes (`/api/export`)
- `GET /api/export/csv` — Export sales history as CSV
- `GET /api/export/pdf` — Export sales report as PDF

### Subscription & Razorpay Routes (`/api/razorpay`)
- `POST /api/razorpay/create-order` — Create Razorpay order for plan upgrade
- `POST /api/razorpay/verify-payment` — Verify HMAC signature & upgrade plan

### Super-Admin Routes (`/api/super-admin`)
- `POST /api/super-admin/login` — Super Admin login
- `GET /api/super-admin/shops` — List all registered platform shops
- `PUT /api/super-admin/shops/:id/status` — Toggle shop active/suspended status
- `PUT /api/super-admin/shops/:id/plan` — Override shop plan level
- `POST /api/super-admin/announcements` — Broadcast platform announcement

---

## 7. Environment Configuration & Deployment

### Backend Configuration (`backend/.env`)
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/hisabi_db
JWT_SECRET=your_super_secret_jwt_key
RAZORPAY_KEY_ID=rzp_test_xxxxxxx
RAZORPAY_SECRET=your_razorpay_secret
```

### Frontend Configuration (`frontend/.env.local`)
```env
VITE_API_URL=http://localhost:5000
```

### Production Deployment Architecture
- **Frontend**: Cloudflare Pages (Static SPA build deployed from `frontend/dist`).
- **Backend API**: Render Web Service (Node.js engine running `backend/src/server.js`).
- **Database**: PostgreSQL Managed Instance (Neon / Supabase / Render Postgres).

---

*Documentation compiled for developers, technical auditors, and AI agents interacting with Hisabi-POS.*
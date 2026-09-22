# HISABI SaaS — Complete Developer Handbook & System Documentation

Welcome to the **Hisabi SaaS Complete Developer Guide**. This document is an exhaustive, technical handbook designed for new and existing engineers. It provides an end-to-end breakdown of the application architecture, multi-tenant security, database models, frontend/backend interactions, authorization, business logic, workflows, and developer workflows.

---

## 📋 Table of Contents

1. [Project Overview & Core Concepts](#1-project-overview--core-concepts)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [Project Directory & File Structure](#3-project-directory--file-structure)
4. [System Architecture & Data Flow](#4-system-architecture--data-flow)
5. [Complete Database Schema Blueprint](#5-complete-database-schema-blueprint)
6. [Multi-Tenant Data Isolation & Security](#6-multi-tenant-data-isolation--security)
7. [Authentication System](#7-authentication-system)
8. [Role-Based Access Control (RBAC)](#8-role-based-access-control-rbac)
9. [Super Admin Platform Architecture](#9-super-admin-platform-architecture)
10. [Exhaustive Feature-by-Feature Documentation](#10-exhaustive-feature-by-feature-documentation)
11. [Core Business Workflows & Mermaid Diagrams](#11-core-business-workflows--mermaid-diagrams)
    - [11.1 Merchant Registration & Onboarding](#111-merchant-registration--onboarding)
    - [11.2 Authentication & Token Lifecycle](#112-authentication--token-lifecycle)
    - [11.3 Point of Sale (POS) & Checkout](#113-point-of-sale-pos--checkout)
    - [11.4 Relational Inventory & Bundle Stock Deduction](#114-relational-inventory--bundle-stock-deduction)
    - [11.5 Customer Debt & Due Collection Lifecycle](#115-customer-debt--due-collection-lifecycle)
    - [11.6 Supplier Purchasing & Inventory Intake](#116-supplier-purchasing--inventory-intake)
    - [11.7 Sales Returns & Restocking](#117-sales-returns--restocking)
    - [11.8 End of Day (EoD) Register Reconciliation](#118-end-of-day-eod-register-reconciliation)
    - [11.9 Tiered SaaS Subscription & Razorpay Upgrades](#119-tiered-saas-subscription--razorpay-upgrades)
    - [11.10 Super Admin Operations](#1110-super-admin-operations)
12. [Complete API Route Registry](#12-complete-api-route-registry)
13. [Frontend Routing & Navigation Map](#13-frontend-routing--navigation-map)
14. [Client & Server Error Handling](#14-client--server-error-handling)
15. [State Management Architecture](#15-state-management-architecture)
16. [Key Business Logic Formulas](#16-key-business-logic-formulas)
17. [Security Model & Safeguards](#17-security-model--safeguards)
18. [File-to-Feature Quick Reference Map](#18-file-to-feature-quick-reference-map)
19. [Developer "How Do I..." Action Guide](#19-developer-how-do-i-action-guide)
20. [Common Development Pitfalls to Avoid](#20-common-development-pitfalls-to-avoid)
21. [Environment Variables Reference](#21-environment-variables-reference)
22. [Deployment & Infrastructure](#22-deployment--infrastructure)
23. [Testing Strategy & Manual Testing Checklist](#23-testing-strategy--manual-testing-checklist)
24. [Current Implementation Status Matrix](#24-current-implementation-status-matrix)
25. [Known Issues & Technical Debt](#25-known-issues--technical-debt)
26. [Future Development Guidelines](#26-future-development-guidelines)
27. [New Developer Quick-Start Guide](#27-new-developer-quick-start-guide)

---

## 1. Project Overview & Core Concepts

### What is Hisabi?
**Hisabi** (Arabic for *"My Accounting"*) is a high-performance, multi-tenant Point of Sale (POS), Inventory Control, and Retail Analytics Software as a Service (SaaS). It empowers small-to-medium retail shops, supermarkets, hardware stores, and boutiques to manage daily sales, customer credit accounts (`due`), stock levels, supplier restocks, and daily register closures.

### Who Uses Hisabi?
1. **Retail Merchants / Business Owners (Shop Admin)**: Manage inventory pricing, staff access, daily financials, due collections, profit reports, and SaaS billing plans.
2. **Cashiers / Store Personnel (Staff)**: Conduct high-speed checkouts on mobile/desktop, search products, process customer debts, and issue tax receipts.
3. **SaaS Platform Operators (Super Admin)**: Monitor system-wide shop signups, suspend/activate stores, manage tiered subscription plans, broadcast system announcements, and publish in-app ad banners.

### Key Terminology & Concepts
- **Tenant / Shop (`Shop`)**: A discrete, isolated retail business account. Every shop has its own isolated product catalog, customer directory, invoice ledger, expenses, and staff accounts.
- **Shop Admin (`admin`)**: The primary merchant user created during registration who has total control over their shop setting and staff.
- **Staff User (`staff`)**: Secondary accounts created by the Shop Admin with restricted access (limited strictly to sales, product search, due collection, and returns).
- **Super Admin (`super-admin`)**: Platform owner operating outside individual shop tenants with global oversight over all shops, system analytics, global announcements, and ad campaigns.
- **Multi-Tenant Data Isolation**: Software architecture where all shops share the same backend service and PostgreSQL database, but every database table includes a mandatory `shop_id` foreign key. All queries are strictly scoped to the authenticated user's `shop_id`.

---

## 2. Complete Technology Stack

### Frontend Technology Stack
- **React 18**: Component-based UI framework for single-page applications (SPA).
- **Vite**: Next-generation frontend build tool providing instant Hot Module Replacement (HMR) and optimized rollup production bundles.
- **JavaScript (ES6+) / JSX**: Dynamic client-side logic.
- **Tailwind CSS**: Utility-first CSS framework configured for modern glassmorphism UI cards, dark/light contrast elements, and responsive mobile layouts (`frontend/tailwind.config.js`).
- **React Router DOM v6**: Client-side declarative routing with nested layout routes and navigation guards (`frontend/src/App.jsx`).
- **Axios**: HTTP client with custom request/response interceptors for Bearer JWT injection and centralized 401 handling (`frontend/src/api/axios.js`).
- **Lucide-React**: SVG icon system for UI elements.
- **Recharts**: Responsive SVG chart library for revenue trends, category breakdowns, and hourly analytics (`frontend/src/pages/Reports.jsx`).
- **i18next + react-i18next**: Dictionary-driven internationalization engine supporting dual English and Arabic LTR/RTL rendering (`frontend/src/i18n.js`).
- **jwt-decode**: Client-side JWT decoding for token expiration verification.

### Backend Technology Stack
- **Node.js (>= v20.0.0)**: Asynchronous event-driven JavaScript runtime.
- **Express 5**: Fast, minimal web application framework handling REST API routing and HTTP request/response pipelines (`backend/src/app.js`).
- **Sequelize ORM v6**: Object-Relational Mapping library managing PostgreSQL schema definitions, data models, transactions, and relational queries (`database/models/index.js`).
- **PostgreSQL (`pg` & `pg-hstore`)**: Enterprise-grade relational database management system.
- **JSON Web Token (JWT)**: Stateless token authentication standard (`jsonwebtoken`).
- **bcryptjs**: Password hashing library utilizing salt factor 10.
- **Joi**: Schema-based request payload validator (`backend/src/controllers/authController.js`, `invoiceController.js`, `productController.js`).
- **PDFKit**: Server-side vector graphic PDF engine for streaming tax invoices and due receipts (`backend/src/services/pdfService.js`).
- **Multer**: Node.js middleware for multipart/form-data file uploads (product images and ad banners) (`backend/src/middleware/upload.js`).
- **Cors, Helmet, Morgan**: CORS policy management, HTTP security headers, and HTTP request logging middleware.
- **Razorpay SDK**: Official Node.js SDK for Indian INR payment order creation, HMAC-SHA256 signature verification, and raw webhook handling (`backend/src/controllers/razorpayController.js`).

---

## 3. Project Directory & File Structure

```text
Hisabi/
├── backend/                        # Express 5 REST API Server
│   ├── src/
│   │   ├── controllers/            # API Route Logic & Business Calculations
│   │   │   ├── authController.js           # Merchant registration, login, staff & profile
│   │   │   ├── categoryController.js       # Product categories CRUD
│   │   │   ├── customerController.js       # Customer directory & debt tracker
│   │   │   ├── discountCodeController.js   # Shop & platform coupon validation
│   │   │   ├── duePaymentController.js     # Debt collection & receipt generation
│   │   │   ├── endOfDayController.js       # Register closure reconciliation
│   │   │   ├── expenseController.js        # Operating expenses management
│   │   │   ├── exportController.js         # CSV & PDF sales report exporters
│   │   │   ├── invoiceController.js        # POS checkout & PDF invoice streaming
│   │   │   ├── productController.js        # Product, bundle & stock management
│   │   │   ├── purchaseController.js       # Supplier Purchase Orders & restocking
│   │   │   ├── razorpayController.js       # Razorpay order, verify & webhook handlers
│   │   │   ├── reportController.js         # Analytics, daily sales & profit margins
│   │   │   ├── returnController.js         # Sales returns & stock restoration
│   │   │   ├── salesTargetController.js    # Monthly sales target goals
│   │   │   ├── stockAdjustmentController.js# Manual stock add/subtract logs
│   │   │   ├── subscriptionController.js   # Plan information & direct plan upgrade
│   │   │   ├── superAdminController.js     # System administration & analytics
│   │   │   └── supplierController.js       # Vendor directory CRUD
│   │   ├── middleware/                 # Express Request Interceptors
│   │   │   ├── auth.js                     # JWT verification & role authorization
│   │   │   ├── planMiddleware.js           # SaaS plan level enforcement (`requirePlan`)
│   │   │   ├── rateLimiter.js              # In-memory rate limiting middleware
│   │   │   ├── superAdminAuth.js           # Dedicated Super Admin JWT verification
│   │   │   ├── upload.js                   # Multer file upload storage configuration
│   │   │   └── validate.js                 # Joi schema validation wrapper
│   │   ├── routes/                     # Express Endpoint Mappings
│   │   │   ├── authRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── customerRoutes.js
│   │   │   ├── discountCodeRoutes.js
│   │   │   ├── duePaymentRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   ├── exportRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── purchaseRoutes.js
│   │   │   ├── razorpayRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── returnRoutes.js
│   │   │   ├── salesTargetRoutes.js
│   │   │   ├── stockAdjustmentRoutes.js
│   │   │   ├── subscriptionRoutes.js
│   │   │   ├── superAdminRoutes.js
│   │   │   └── supplierRoutes.js
│   │   ├── services/                   # Dynamic PDF Generators
│   │   │   └── pdfService.js               # PDFKit templates for invoices & receipts
│   │   ├── utils/                      # Internal Helpers
│   │   │   ├── hash.js                     # Bcrypt hashing wrappers
│   │   │   ├── planUtils.js                # Plan hierarchy & features definition
│   │   │   ├── taxUtils.js                 # Tax rate formulas (IN/AE/KW)
│   │   │   └── token.js                    # JWT signing & verification helpers
│   │   ├── app.js                      # Express App initialization & CORS setup
│   │   ├── server.js                   # HTTP server entry point & DB sync runner
│   │   ├── checkSuperAdmin.js          # CLI utility to verify Super Admin records
│   │   └── seedSuperAdmin.js           # CLI script to seed initial Super Admin
│   ├── uploads/                        # Static file upload destination
│   └── package.json
├── database/                       # Database Abstraction Layer
│   ├── database.js                     # Sequelize instance connection configuration
│   ├── init.sql                        # Raw SQL database initialization file
│   └── models/                         # Sequelize Data Model Schemas
│       ├── ActivityLog.js              # Platform audit log
│       ├── Advertisement.js            # In-app advertisement banners
│       ├── Announcement.js             # Platform notifications
│       ├── BundleItem.js               # Composite bundle breakdown
│       ├── Category.js                 # Product category classification
│       ├── Customer.js                 # Customer debt directory
│       ├── DiscountCode.js             # Coupons & promo codes
│       ├── DuePayment.js               # Debt settlement receipts
│       ├── Expense.js                  # Operating expenses
│       ├── Invoice.js                  # Sales transactions header
│       ├── InvoiceItem.js              # Transaction line items
│       ├── Product.js                  # Inventory items & bundles
│       ├── PurchaseOrder.js            # Restocking orders header
│       ├── PurchaseOrderItem.js        # Restocking line items
│       ├── Return.js                   # Product returns
│       ├── SalesTarget.js              # Monthly sales goals
│       ├── Shop.js                     # Multi-tenant business register
│       ├── StockAdjustment.js          # Manual inventory adjustments
│       ├── SuperAdmin.js               # Super admin account
│       ├── Supplier.js                 # Vendors directory
│       ├── User.js                     # Shop users (Admin/Staff)
│       └── index.js                    # Associations registry & DB sync export
├── frontend/                       # React 18 + Vite SPA Frontend
│   ├── public/                         # Static assets & favicons
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                # Axios client with request/response interceptors
│   │   ├── components/                 # Reusable React UI Components
│   │   │   ├── FeatureGuard.jsx        # Glassmorphism plan upgrade lock overlay
│   │   │   ├── Layout.jsx              # Application sidebar, header & announcement bar
│   │   │   ├── PricingModal.jsx        # SaaS plan selection & checkout modal
│   │   │   ├── ProtectedRoute.jsx      # Auth & RBAC route guard
│   │   │   └── RazorpayCheckout.jsx    # Razorpay script wrapper & button
│   │   ├── context/
│   │   │   └── AuthContext.jsx         # React Context for user state & session persistence
│   │   ├── hooks/
│   │   │   └── usePlan.js              # Custom hook for plan limit & feature checks
│   │   ├── pages/                      # Application Page Components
│   │   │   ├── Customers.jsx           # Customer directory page
│   │   │   ├── Dashboard.jsx           # Main KPI dashboard
│   │   │   ├── DiscountCodes.jsx       # Coupon manager page
│   │   │   ├── DueCollection.jsx       # Customer debt collection ledger
│   │   │   ├── EndOfDay.jsx            # Cash register reconciliation page
│   │   │   ├── Expenses.jsx            # Expense tracking page
│   │   │   ├── Help.jsx                # Documentation & FAQs
│   │   │   ├── Invoices.jsx            # Invoice history & PDF downloader
│   │   │   ├── Login.jsx               # Merchant sign-in & store registration
│   │   │   ├── POS.jsx                 # Point of Sale terminal
│   │   │   ├── Products.jsx            # Inventory catalog manager
│   │   │   ├── Profile.jsx             # Store & account settings
│   │   │   ├── Purchases.jsx           # Purchase order manager
│   │   │   ├── Reports.jsx             # Analytics & financial reports
│   │   │   ├── Returns.jsx             # Product sales returns
│   │   │   ├── SalesTargets.jsx        # Monthly sales targets
│   │   │   ├── Staff.jsx               # Staff members management
│   │   │   ├── StockAdjustments.jsx    # Manual inventory adjustments
│   │   │   ├── SuperAdminDashboard.jsx # Platform owner command center
│   │   │   ├── SuperAdminLogin.jsx     # Super Admin login portal
│   │   │   └── Suppliers.jsx           # Supplier directory page
│   │   ├── utils/
│   │   │   └── planUtils.js            # Client-side plan definitions & route map
│   │   ├── App.jsx                     # Top-level React Router layout & title manager
│   │   ├── i18n.js                     # Internationalization setup (English & Arabic)
│   │   ├── index.css                   # Tailwind CSS imports & custom styles
│   │   └── main.jsx                    # React DOM entry point
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/                           # Documentation Directory
│   └── HISABI_COMPLETE_DEVELOPER_GUIDE.md # (This File)
├── FEATURES_AND_ARCHITECTURE.md     # Reference feature architecture overview
├── package.json                    # Monorepo concurrently scripts
└── render.yaml                     # Render deployment configuration
```

---

## 4. System Architecture & Data Flow

Hisabi follows a decoupled Client-Server RESTful Architecture.

```mermaid
flowchart TD
    User([Merchant / Cashier / Super Admin]) -->|Interacts with SPA| ReactFrontend[React 18 + Vite SPA]
    
    subgraph Frontend Layer
        ReactFrontend --> AuthCtx[AuthContext / LocalStorage]
        ReactFrontend --> AxiosClient[Axios Interceptor]
    end
    
    AxiosClient -->|HTTP REST + Bearer Token| ExpressApp[Express 5 Server]
    
    subgraph Backend Layer
        ExpressApp --> RateLimiter[Rate Limiter Middleware]
        RateLimiter --> AuthMiddleware[Auth Middleware / JWT Verify]
        AuthMiddleware --> PlanMiddleware[Plan Middleware / requirePlan]
        PlanMiddleware --> Controller[Controller Business Logic]
        Controller --> JoiValidate[Joi Payload Validation]
        Controller --> ServiceLayer[PDFKit / Razorpay SDK]
    end
    
    Controller -->|Sequelize ORM Queries| Database[(PostgreSQL Database)]
    Database -->|Relational Datasets| Controller
    Controller -->|JSON Payload / Stream PDF| ReactFrontend
```

### End-to-End Processing Steps
1. **User Action**: Cashier clicks **"Complete Sale"** in `frontend/src/pages/POS.jsx`.
2. **Client Validation**: Frontend calculates totals, validates cart items, and constructs payload.
3. **HTTP Dispatch**: `Axios` interceptor attaches `Authorization: Bearer <token>` from `localStorage` (`frontend/src/api/axios.js`).
4. **Backend Entry**: Request hits `backend/src/app.js` and routes to `backend/src/routes/invoiceRoutes.js`.
5. **Auth Middleware**: `authenticate` middleware verifies JWT token signature, decodes `shop_id`, `user_id`, `role`, and attaches to `req.user` (`backend/src/middleware/auth.js`).
6. **Controller Logic**: `createInvoice` inside `backend/src/controllers/invoiceController.js` initiates an isolated Sequelize transaction.
7. **Multi-Tenant Filter**: Controller queries `Product` model strictly filtered by `where: { shop_id: req.user.shop_id }`.
8. **Business Calculations & Stock Deduction**:
   - For standard products: Deducts requested quantity from `stock_quantity`.
   - For composite bundles: Queries component items in `BundleItem` and deducts stock from all underlying component products.
   - Computes subtotal, 5% UAE VAT or 18% India GST (if enabled), discount, total amount, and due balance.
9. **Database Write**: Inserts records into `Invoice` and `InvoiceItem` tables. Transaction commits.
10. **Client UI Update**: Returns `201 Created` with created invoice JSON. POS updates state, clears cart, and opens printable receipt modal.

---

## 5. Complete Database Schema Blueprint

The database consists of **22 Sequelize relational models** configured in `database/models/index.js`.

```mermaid
erDiagram
    Shop ||--o{ User : "has staff"
    Shop ||--o{ Product : "owns catalog"
    Shop ||--o{ Category : "groups products"
    Shop ||--o{ Customer : "manages debt"
    Shop ||--o{ Supplier : "buys from"
    Shop ||--o{ Invoice : "issues sales"
    Shop ||--o{ Expense : "logs costs"
    Shop ||--o{ PurchaseOrder : "issues POs"
    Shop ||--o{ StockAdjustment : "adjusts inventory"
    Shop ||--o{ Return : "processes returns"
    Shop ||--o{ DiscountCode : "defines promo codes"
    Shop ||--o{ SalesTarget : "sets goals"
    Shop ||--o{ DuePayment : "collects dues"

    Category ||--o{ Product : "classifies"
    Product ||--o{ BundleItem : "contains component"
    Product ||--o{ InvoiceItem : "sold in"
    Invoice ||--o{ InvoiceItem : "contains line items"
    Customer ||--o{ Invoice : "billed to"
    Supplier ||--o{ PurchaseOrder : "supplies"
    PurchaseOrder ||--o{ PurchaseOrderItem : "contains PO items"
    Product ||--o{ PurchaseOrderItem : "restocked"
    Invoice ||--o{ DuePayment : "settled by"
```

### Detailed Model Definitions

#### 1. `Shop` (`shops`)
Root entity representing an isolated business tenant.
- `id` (UUID, Primary Key, Default: `UUIDV4`)
- `name` (String, Required, Unique)
- `address` (Text, Optional)
- `phone` (String, Optional)
- `email` (String, Optional)
- `trn` (String, Optional) - UAE Tax Registration Number
- `gstin` (String, Optional) - India GST Identification Number (15 chars)
- `country` (Enum: `'AE'`, `'KW'`, `'IN'`, Default: `'AE'`)
- `currency` (Enum: `'AED'`, `'KWD'`, `'INR'`, Required)
- `vat_enabled` (Boolean, Required, Default: `true`)
- `gst_enabled` (Boolean, Default: `false`)
- `plan` (Enum: `'free'`, `'gold'`, `'premium'`, Default: `'free'`)
- `active` (Boolean, Default: `true`) - Shop activation/suspension status
- `brand_logo` (String, Optional) - Custom invoice logo relative URL
- `brand_color` (String, Optional) - Primary branding color hex
- `created_at`, `updated_at` (Timestamps)

#### 2. `User` (`users`)
Merchant admins and store staff members.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `username` (String, Required, Globally Unique)
- `password_hash` (String, Required)
- `role` (Enum: `'admin'`, `'staff'`, Default: `'staff'`)
- `created_at`, `updated_at` (Timestamps)

#### 3. `Product` (`products`)
Inventory catalog item or composite combo package.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `category_id` (UUID, Foreign Key -> `Category.id`, Optional)
- `name` (String, Required)
- `barcode` (String, Optional) - Hardware barcode scanner identifier
- `cost_price` (Decimal(10,2), Required, Default: `0.00`)
- `selling_price` (Decimal(10,2), Required, Default: `0.00`)
- `mrp` (Decimal(10,2), Optional) - Maximum Retail Price
- `stock_quantity` (Integer, Required, Default: `0`)
- `is_bundle` (Boolean, Default: `false`) - Flag for combo package
- `image_path` (String, Optional) - Relative image URL
- `created_at`, `updated_at` (Timestamps)

#### 4. `Category` (`categories`)
Product classification group.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `name` (String, Required)
- `image_path` (String, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 5. `BundleItem` (`bundle_items`)
Relational bridge mapping bundle products to component products.
- `id` (UUID, Primary Key)
- `bundle_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `product_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `quantity` (Integer, Required, Default: `1`)

#### 6. `Invoice` (`invoices`)
Sales transaction invoice header.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `user_id` (UUID, Foreign Key -> `User.id`, Mandatory)
- `invoice_number` (Integer, Required) - Sequential number per shop
- `subtotal` (Decimal(10,2), Required)
- `tax_total` (Decimal(10,2), Required, Default: `0.00`)
- `discount` (Decimal(10,2), Default: `0.00`)
- `grand_total` (Decimal(10,2), Required)
- `paid_amount` (Decimal(10,2), Required)
- `due_amount` (Decimal(10,2), Default: `0.00`)
- `status` (Enum: `'paid'`, `'partial'`, `'due'`, Default: `'paid'`)
- `customer_name` (String, Default: `'Walk-in Customer'`)
- `customer_phone` (String, Optional)
- `customer_email` (String, Optional)
- `date` (Date, Default: `NOW`)
- `created_at`, `updated_at` (Timestamps)

#### 7. `InvoiceItem` (`invoice_items`)
Individual line item in a sales invoice.
- `id` (UUID, Primary Key)
- `invoice_id` (UUID, Foreign Key -> `Invoice.id`, Mandatory)
- `product_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `quantity` (Integer, Required)
- `unit_price` (Decimal(10,2), Required)
- `cost_price` (Decimal(10,2), Required) - Cost price snapshot at sale time
- `mrp` (Decimal(10,2), Optional)
- `line_total` (Decimal(10,2), Required)
- `tax_amount` (Decimal(10,2), Default: `0.00`)

#### 8. `Customer` (`customers`)
Client record for credit sales and debt tracking.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `name` (String, Required)
- `phone` (String, Optional)
- `email` (String, Optional)
- `address` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 9. `DuePayment` (`due_payments`)
Debt settlement payment receipt.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `invoice_id` (UUID, Foreign Key -> `Invoice.id`, Mandatory)
- `due_invoice_number` (String, Required) - Sequential receipt number (`DUE-1001`)
- `amount` (Decimal(10,2), Required)
- `payment_method` (String, Default: `'cash'`)
- `payment_date` (Date, Default: `NOW`)
- `remaining_balance` (Decimal(10,2), Required)
- `notes` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 10. `Supplier` (`suppliers`)
Wholesale vendor directory.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `name` (String, Required)
- `contact_person` (String, Optional)
- `phone` (String, Optional)
- `email` (String, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 11. `PurchaseOrder` (`purchase_orders`)
Stock restocking purchase order header.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `supplier_id` (UUID, Foreign Key -> `Supplier.id`, Optional)
- `order_date` (DateOnly, Required)
- `total_amount` (Decimal(10,2), Required, Default: `0.00`)
- `notes` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 12. `PurchaseOrderItem` (`purchase_order_items`)
Line item inside a purchase order.
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key -> `PurchaseOrder.id`, Mandatory)
- `product_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `quantity` (Integer, Required)
- `unit_cost` (Decimal(10,2), Required)

#### 13. `StockAdjustment` (`stock_adjustments`)
Manual inventory correction log (breakage, theft, intake correction).
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `product_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `adjusted_by` (UUID, Foreign Key -> `User.id`, Mandatory)
- `quantity_change` (Integer, Required) - Positive or negative value
- `type` (String, Default: `'correction'`)
- `reason` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 14. `Return` (`returns`)
Sales return record.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `product_id` (UUID, Foreign Key -> `Product.id`, Mandatory)
- `quantity` (Integer, Required)
- `refund_amount` (Decimal(10,2), Default: `0.00`)
- `reason` (Text, Optional)
- `invoice_ref` (String, Optional)
- `return_date` (DateOnly, Required)
- `created_at`, `updated_at` (Timestamps)

#### 15. `Expense` (`expenses`)
Operating store costs (rent, electricity, salaries).
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `title` (String, Required)
- `amount` (Decimal(10,2), Required)
- `category` (String, Default: `'Other'`)
- `expense_date` (DateOnly, Required)
- `notes` (Text, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 16. `DiscountCode` (`discount_codes`)
Shop-specific or platform-wide promotional discount codes.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Optional) - Null for platform codes
- `code` (String, Required)
- `type` (Enum: `'percentage'`, `'fixed'`, Required)
- `value` (Decimal(10,2), Required)
- `min_order_amount` (Decimal(10,2), Default: `0.00`)
- `max_uses` (Integer, Optional)
- `uses_count` (Integer, Default: `0`)
- `expires_at` (Date, Optional)
- `active` (Boolean, Default: `true`)
- `created_at`, `updated_at` (Timestamps)

#### 17. `SalesTarget` (`sales_targets`)
Monthly revenue targets set by merchant.
- `id` (UUID, Primary Key)
- `shop_id` (UUID, Foreign Key -> `Shop.id`, Mandatory)
- `month` (Integer, Required: 1-12)
- `year` (Integer, Required)
- `target_amount` (Decimal(10,2), Required)
- `created_at`, `updated_at` (Timestamps)

#### 18. `SuperAdmin` (`super_admins`)
SaaS platform owner accounts.
- `id` (UUID, Primary Key)
- `username` (String, Required, Unique)
- `password_hash` (String, Required)
- `secret_key_hash` (String, Required) - Mandatory secondary secret key
- `created_at`, `updated_at` (Timestamps)

#### 19. `Advertisement` (`advertisements`)
Global promotional banners broadcast by Super Admin.
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `image_url` (String, Required)
- `link` (String, Optional)
- `active` (Boolean, Default: `true`)
- `expires_at` (Date, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 20. `Announcement` (`announcements`)
System-wide notification banners for active merchants.
- `id` (UUID, Primary Key)
- `title` (String, Required)
- `message` (Text, Required)
- `cta_text` (String, Optional)
- `cta_link` (String, Optional)
- `type` (Enum: `'info'`, `'warning'`, `'alert'`, Default: `'info'`)
- `active` (Boolean, Default: `true`)
- `expires_at` (Date, Optional)
- `created_at`, `updated_at` (Timestamps)

#### 21. `ActivityLog` (`activity_logs`)
System audit log for platform events.
- `id` (UUID, Primary Key)
- `admin_username` (String, Required)
- `action` (String, Required)
- `category` (String, Default: `'SYSTEM'`)
- `details` (JSONB, Optional)
- `created_at`, `updated_at` (Timestamps)

---

## 6. Multi-Tenant Data Isolation & Security

Hisabi uses **Logical Multi-Tenancy**. All businesses store data in shared tables, separated by `shop_id`.

```text
Shop A (ID: uuid-1)               Shop B (ID: uuid-2)
  ├── Products (shop_id: uuid-1)    ├── Products (shop_id: uuid-2)
  ├── Customers (shop_id: uuid-1)   ├── Customers (shop_id: uuid-2)
  └── Invoices (shop_id: uuid-1)    └── Invoices (shop_id: uuid-2)
```

### Security Mechanisms Enforcing Data Isolation
1. **Database Schema Constraints**: All tenant entities feature a mandatory `shop_id` foreign key with `onDelete: 'CASCADE'`.
2. **JWT Payload Injection**: Upon login, `authController.js` signs a JWT containing `{ id, shop_id, role }`.
3. **Automatic Request Decorator**: Middleware (`backend/src/middleware/auth.js`) verifies the JWT signature and populates `req.user`.
4. **Mandatory Query Scoping**: Every Sequelize database query across all controllers explicitly enforces a `where: { shop_id: req.user.shop_id }` filter clause.
5. **Account Suspension Guard**: `planMiddleware.js` checks `Shop.active`. If a shop is suspended (`active === false`), all incoming API requests return HTTP `403 Account Suspended`.
6. **Global Username Uniqueness**: Usernames are validated globally to prevent user account collision across different shops.

> [!CAUTION]
> **Developer Rule**: NEVER write a Sequelize query (`findAll`, `findOne`, `destroy`, `update`) for tenant entities without including `shop_id: req.user.shop_id`. Omitting `shop_id` causes cross-tenant data leaks!

---

## 7. Authentication System

Authentication is stateless and managed via JWT Bearer Tokens.

### Registration Flow (`POST /api/auth/register`)
1. User submits shop details (`shop_name`, `country`, `currency`, `vat_enabled`) and initial admin account credentials (`username`, `password`).
2. Server validates input using Joi (`registerSchema`).
3. Verifies that `username` and `shop_name` do not already exist.
4. Checks India-specific mobile number formatting (`+91` followed by 10 digits) if country is `'IN'`.
5. Starts an atomic Sequelize transaction.
6. Creates `Shop` record, hashes admin password using bcrypt, and creates `admin` `User` record.
7. Commits transaction and generates JWT token (1 day validity).
8. Returns token, user details, and shop settings to frontend.

### Login Flow (`POST /api/auth/login`)
1. User enters `username` and `password`.
2. Server queries `User` table by `username`.
3. If user exists, fetches associated `Shop`.
4. Verifies password hash using `bcrypt.compare`.
5. Checks `shop.active`. If false, returns `403 Account Suspended`.
6. Generates JWT token containing `{ id, shop_id, role }`.
7. Client stores token and user object in `localStorage` (`frontend/src/context/AuthContext.jsx`).

### Logout Flow
1. User clicks Logout in `frontend/src/components/Layout.jsx`.
2. `AuthContext.logout()` clears `localStorage.removeItem('token')` and `localStorage.removeItem('user')`.
3. Client state `user` is set to `null`.
4. Browser redirects to `/login`.
5. Subsequent API calls fail at Axios request interceptor or server auth middleware.

---

## 8. Role-Based Access Control (RBAC)

Hisabi enforces three distinct role tiers:

| Feature / Resource | Shop Admin (`admin`) | Store Cashier (`staff`) | Platform Owner (`super-admin`) |
|---|---|---|---|
| **POS Terminal & Checkout** | ✅ Allowed | ✅ Allowed | ❌ No Shop Access |
| **Product Search & Catalog View** | ✅ Allowed | ✅ Allowed | ❌ No Shop Access |
| **Due Debt Collection** | ✅ Allowed | ✅ Allowed | ❌ No Shop Access |
| **Sales Returns** | ✅ Allowed | ✅ Allowed | ❌ No Shop Access |
| **Product Management (Create/Edit/Delete)** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Financial Analytics & Profit Reports** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Suppliers & Purchase Orders** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Expenses & Sales Targets** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Staff Member Management** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Shop Profile & VAT Settings** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **SaaS Plan Upgrades** | ✅ Allowed | ❌ Restricted | ❌ No Shop Access |
| **Super Admin Command Center** | ❌ Forbidden | ❌ Forbidden | ✅ Full Control |

### Authorization Enforcement Code
- **Server Middleware**: Routes for admin-only features use `requireAdmin` middleware (`backend/src/middleware/auth.js`):
  ```javascript
  const requireAdmin = authorize(['admin']);
  router.use(authenticate, requireAdmin);
  ```
- **Client Route Guard**: `frontend/src/components/ProtectedRoute.jsx` checks `user.role === 'staff'`. If a staff member attempts to navigate to restricted paths (`/reports`, `/suppliers`, `/expenses`, `/staff`, `/profile`), they are automatically redirected to `/dashboard`.
- **Client UI Hiding**: Navigation items in `frontend/src/components/Layout.jsx` render conditionally based on `user.role`.

---

## 9. Super Admin Platform Architecture

Super Admin is a separate platform administration engine.

```mermaid
flowchart TD
    SuperAdmin[Super Admin User] -->|POST /api/super-admin/login| SuperAdminAuth[superAdminAuth Middleware]
    SuperAdminAuth -->|Valid JWT role: super-admin| CommandCenter[SuperAdminDashboard.jsx]
    
    subgraph Operations
        CommandCenter --> PlatformAnalytics[Platform Analytics & Metrics]
        CommandCenter --> ShopMgmt[Shop Management & Suspensions]
        CommandCenter --> PlanOverrides[Plan Tier Overrides]
        CommandCenter --> Announcements[Broadcast System Announcements]
        CommandCenter --> AdsMgmt[In-App Ad Banners]
        CommandCenter --> AuditLogs[System Activity Logs]
    end
```

### Key Super Admin Capabilities
1. **Triple-Credential Authentication**: Requires `username`, `password`, AND a secondary `secret_key` (`backend/src/controllers/superAdminController.js`).
2. **System Bootstrap Initialization**: The first Super Admin account can be initialized via `POST /api/super-admin/initialize` protected by `SUPER_ADMIN_BOOTSTRAP_SECRET` environment variable.
3. **Platform Analytics**: Fetches global metrics across all shops (total shops, active count, total system invoices, products, global platform revenue, and 30-day growth trends).
4. **Shop Management & Overrides**: Allows platform owner to view all registered shops, toggle shop activation state (`active: true/false`), and override subscription plan levels (`free`, `gold`, `premium`).
5. **Global Announcements**: Broadcast notifications (`info`, `warning`, `alert`) to merchant dashboards with call-to-action buttons (`Announcement` model).
6. **In-App Advertisements**: Upload and toggle promotional banners (`Advertisement` model).
7. **Audit Activity Logs**: Automatic logging of platform owner actions (`ActivityLog` model).

---

## 10. Exhaustive Feature-by-Feature Documentation

### 10.1 Dashboard (`frontend/src/pages/Dashboard.jsx`)
- **Purpose**: Merchant overview of daily financial performance and inventory status.
- **Frontend Components**: KPI metric cards, Recharts sales trend chart, top-selling products table, recent sales table.
- **Backend API**: `GET /api/reports/dashboard`, `GET /api/reports/full-stats`.
- **Business Logic**: Aggregates today's sales, month-to-date revenue, total invoice count, low-stock count (`stock_quantity <= 5`), and today's expenses.

### 10.2 Point of Sale Terminal (`frontend/src/pages/POS.jsx`)
- **Purpose**: Fast checkout terminal optimized for desktop, touchscreen, and mobile.
- **Frontend Components**: Barcode/SKU search bar, category filter pills, product grid, cart side-drawer, discount modal, customer selector, checkout popup, thermal receipt preview.
- **Backend API**: `POST /api/invoices`, `POST /api/discount-codes/validate`.
- **Business Logic**: Supports standard items and composite bundles, calculates subtotal, line taxes (5% UAE VAT or 18% India GST), fixed/percentage discounts, grand total, and due debt balance. Atomically decrements product or bundle component stock inside a database transaction.

### 10.3 Inventory & Products (`frontend/src/pages/Products.jsx`)
- **Purpose**: Manage catalog items, barcodes, SKUs, pricing, categories, and combo packages.
- **Frontend Components**: Product table, add/edit modal, bundle builder component, barcode scanner simulator, image upload preview.
- **Backend API**: `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`.
- **Business Logic**: Validates barcode uniqueness per shop, enforces plan limit on maximum products (`maxProducts`), handles composite bundle creation linking `BundleItem` records, handles image file upload via Multer.

### 10.4 Categories (`frontend/src/pages/Products.jsx`)
- **Purpose**: Classify products for quick POS filtering.
- **Backend API**: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id`.
- **Business Logic**: Category deletion safety check prevents deleting categories containing active products.

### 10.5 Customers & Credit Ledger (`frontend/src/pages/Customers.jsx`)
- **Purpose**: Maintain client directory and track customer debt totals.
- **Backend API**: `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`.
- **Business Logic**: Stores name, phone, email, and address. Invoices and credit sales link to customers.

### 10.6 Suppliers Directory (`frontend/src/pages/Suppliers.jsx`)
- **Purpose**: Manage wholesale vendors for inventory replenishment.
- **Backend API**: `GET /api/suppliers`, `POST /api/suppliers`, `PUT /api/suppliers/:id`, `DELETE /api/suppliers/:id`.
- **Permissions**: Restricted to Admin. Locked on `free` plan.

### 10.7 Purchase Orders & Restocking (`frontend/src/pages/Purchases.jsx`)
- **Purpose**: Issue purchase orders to suppliers and automatically increment stock intake.
- **Backend API**: `GET /api/purchases`, `POST /api/purchases`.
- **Business Logic**: On purchase order creation, server automatically increments `stock_quantity` for all line item products within a database transaction.

### 10.8 Invoices & Receipts (`frontend/src/pages/Invoices.jsx`)
- **Purpose**: Search, filter, inspect, print, or delete historical sales invoices.
- **Backend API**: `GET /api/invoices`, `GET /api/invoices/:id/pdf`, `DELETE /api/invoices/:id`.
- **Business Logic**: PDFKit streams vector PDF invoices directly to client. Deleting an invoice restores original stock quantities for standard products or bundle components within a transaction.

### 10.9 Due Collection & Debt Settlement (`frontend/src/pages/DueCollection.jsx`)
- **Purpose**: Track outstanding customer credit sales and record partial/full settlements.
- **Backend API**: `GET /api/due-payments/unpaid`, `POST /api/due-payments`, `GET /api/due-payments/stats`, `GET /api/due-payments/:id/pdf`.
- **Business Logic**: Generates sequential debt settlement receipt numbers (`DUE-1001`), updates invoice `due_amount` and `status` (`paid`/`partial`), logs payment entry, and generates printable PDF debt receipt.

### 10.10 Sales Returns & Restocking (`frontend/src/pages/Returns.jsx`)
- **Purpose**: Process customer product returns and issue refunds.
- **Backend API**: `GET /api/returns`, `POST /api/returns`.
- **Business Logic**: Records return reason, refund amount, invoice reference, and automatically increments product `stock_quantity` within a transaction.

### 10.11 Stock Adjustments (`frontend/src/pages/StockAdjustments.jsx`)
- **Purpose**: Log manual inventory corrections (additions or subtractions) for loss, damage, or stock audits.
- **Backend API**: `GET /api/stock-adjustments`, `POST /api/stock-adjustments`, `GET /api/stock-adjustments/low-stock`.
- **Business Logic**: Updates product `stock_quantity`, records audit trail with user ID, reason, and type (`correction`, `breakage`, `theft`).

### 10.12 Expenses Management (`frontend/src/pages/Expenses.jsx`)
- **Purpose**: Log operational store expenses to compute net profit.
- **Backend API**: `GET /api/expenses`, `POST /api/expenses`, `DELETE /api/expenses/:id`.
- **Business Logic**: Categorizes expenses (Rent, Utilities, Salaries, Other) and filters by date range.

### 10.13 Monthly Sales Targets (`frontend/src/pages/SalesTargets.jsx`)
- **Purpose**: Set monthly sales goals and track live revenue progress.
- **Backend API**: `GET /api/targets`, `POST /api/targets`.
- **Business Logic**: Computes monthly revenue from paid invoices and calculates progress percentage against target.

### 10.14 End-of-Day Reconciliation (`frontend/src/pages/EndOfDay.jsx`)
- **Purpose**: Balance cash register drawer at shift close.
- **Backend API**: `GET /api/reports/end-of-day`.
- **Business Logic**: Aggregates total daily sales, cash collected, outstanding credit sales, discounts, taxes, items sold, and top products.

### 10.15 Staff Management (`frontend/src/pages/Staff.jsx`)
- **Purpose**: Admin interface to create and delete store staff accounts.
- **Backend API**: `GET /api/auth/staff`, `POST /api/auth/staff`, `DELETE /api/auth/staff/:id`.
- **Business Logic**: Enforces plan limits on maximum allowed staff members (`maxStaff`).

### 10.16 Store Profile & Branding (`frontend/src/pages/Profile.jsx`)
- **Purpose**: Update store address, phone, tax IDs (TRN/GSTIN), and invoice branding logo.
- **Backend API**: `GET /api/auth/profile`, `PUT /api/auth/profile`.
- **Business Logic**: Uploads brand logo via Multer and updates shop settings. Restricted to Admin.

### 10.17 Help & Documentation (`frontend/src/pages/Help.jsx`)
- **Purpose**: In-app merchant onboarding guide, user manuals, and FAQs.

### 10.18 Tiered SaaS Plans & Razorpay Checkout (`frontend/src/components/PricingModal.jsx`)
- **Purpose**: Monetization system offering `free`, `gold`, and `premium` tiers.
- **Backend API**: `GET /api/subscription`, `POST /api/subscription/upgrade`, `POST /api/razorpay/create-order`, `POST /api/razorpay/verify-payment`, `POST /api/razorpay/webhook`.
- **Business Logic**: Indian shops (`country === 'IN'`) are forced through Razorpay checkout to prevent payment bypass. Razorpay order creation applies platform fees and platform discount codes. Signature verification uses HMAC-SHA256 crypto hashing.

### 10.19 Dynamic PDF & CSV Exporters (`backend/src/controllers/exportController.js`)
- **Purpose**: Stream sales reports in downloadable CSV or PDF vector formats.
- **Backend API**: `GET /api/export/csv`, `GET /api/export/pdf`.

---

## 11. Core Business Workflows & Mermaid Diagrams

### 11.1 Merchant Registration & Onboarding
```mermaid
sequenceDiagram
    autonumber
    actor Merchant
    participant SPA as React Frontend
    participant API as Express Auth Controller
    participant DB as PostgreSQL Database

    Merchant->>SPA: Fill Registration Form (Shop Name, Country, Currency, VAT/GST, Admin Credentials)
    SPA->>API: POST /api/auth/register
    API->>DB: Check if username exists globally
    API->>DB: Check if shop name exists
    API->>API: Hash admin password (bcrypt)
    API->>DB: Transaction: Create Shop + Create Admin User
    DB-->>API: Transaction Committed
    API->>API: Generate JWT (signed with shop_id & role)
    API-->>SPA: Return 201 Created (Token + User + Shop Data)
    SPA->>SPA: Save Token & User in LocalStorage
    SPA->>Merchant: Redirect to /dashboard
```

### 11.2 Authentication & Token Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor User
    participant SPA as React Frontend
    participant Interceptor as Axios Interceptor
    participant Middleware as Auth Middleware
    participant Controller as Express Controller

    User->>SPA: Open App / Refresh Page
    SPA->>SPA: Read token & user from LocalStorage
    SPA->>SPA: Decode JWT exp timestamp
    alt Token Expired
        SPA->>SPA: Clear LocalStorage & redirect to /login
    else Token Valid
        SPA->>User: Render Dashboard Component
    end

    User->>SPA: Perform Action (e.g. Fetch Products)
    SPA->>Interceptor: Trigger API Request
    Interceptor->>Interceptor: Attach Authorization: Bearer <token>
    Interceptor->>Middleware: Send HTTP Request
    Middleware->>Middleware: Verify JWT Signature
    alt Invalid/Missing Token
        Middleware-->>Interceptor: HTTP 401 Unauthorized
        Interceptor->>SPA: Clear LocalStorage & Redirect /login
    else Valid Token
        Middleware->>Controller: Attach req.user & pass control
    end
```

### 11.3 Point of Sale (POS) & Checkout
```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant POS as POS.jsx Interface
    participant Controller as invoiceController.js
    participant DB as PostgreSQL Database

    Cashier->>POS: Scan Barcode / Search Product
    POS->>POS: Add item to local Cart state
    Cashier->>POS: Select Customer & enter Paid Amount
    Cashier->>POS: Click "Complete Sale"
    POS->>Controller: POST /api/invoices { items, customer, discount, paid_amount }
    Controller->>DB: Begin Transaction
    loop For each item in cart
        Controller->>DB: Fetch Product (where shop_id = req.user.shop_id)
        alt Is Composite Bundle
            Controller->>DB: Fetch component products from BundleItem
            Controller->>DB: Check & decrement component stock_quantity
        else Standard Product
            Controller->>DB: Check & decrement product stock_quantity
        end
    end
    Controller->>Controller: Calculate Subtotal, Tax, Grand Total, Due Balance
    Controller->>DB: Create Invoice & InvoiceItem records
    Controller->>DB: Commit Transaction
    Controller-->>POS: Return 201 Created (Invoice JSON)
    POS->>POS: Clear Cart & render printable Thermal Receipt Modal
```

### 11.4 Relational Inventory & Bundle Stock Deduction
```mermaid
flowchart TD
    SaleRequest[POS Sale Executed] --> CheckBundle{Is Product a Bundle?}
    
    CheckBundle -->|No: Standard Product| CheckDirectStock{stock_quantity >= Qty?}
    CheckDirectStock -->|Yes| DecrementDirect[Decrement Product stock_quantity]
    CheckDirectStock -->|No| RollbackDirect[Rollback Transaction & Return 400 Error]
    
    CheckBundle -->|Yes: Combo Package| FetchComponents[Query BundleItem for Component Product IDs & Qty]
    FetchComponents --> LoopComponents[Loop Through Each Component Product]
    LoopComponents --> CheckCompStock{Component stock_quantity >= Required Qty?}
    CheckCompStock -->|Yes| DecrementComp[Decrement Component stock_quantity]
    CheckCompStock -->|No| RollbackBundle[Rollback Transaction & Return Insufficient Component Stock Error]
    
    DecrementDirect --> CommitTx[Commit Database Transaction]
    DecrementComp --> CommitTx
```

### 11.5 Customer Debt & Due Collection Lifecycle
```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant Ledger as DueCollection.jsx
    participant Controller as duePaymentController.js
    participant DB as PostgreSQL Database

    Cashier->>Ledger: View Unpaid Invoices
    Ledger->>Controller: GET /api/due-payments/unpaid
    Controller->>DB: Query Invoices where due_amount > 0 and shop_id = req.user.shop_id
    DB-->>Ledger: Return List of Unpaid Invoices

    Cashier->>Ledger: Select Invoice & enter Payment Amount
    Cashier->>Ledger: Click "Record Payment"
    Ledger->>Controller: POST /api/due-payments { invoice_id, amount, payment_method }
    Controller->>DB: Begin Transaction
    Controller->>DB: Generate sequential DUE-XXXX receipt number
    Controller->>DB: Calculate new paid_amount, due_amount & status (paid/partial)
    Controller->>DB: Create DuePayment record
    Controller->>DB: Update Invoice record
    Controller->>DB: Commit Transaction
    Controller-->>Ledger: Return Created DuePayment
    Ledger->>Ledger: Open printable PDF Receipt Modal
```

### 11.6 Supplier Purchasing & Inventory Intake
```mermaid
sequenceDiagram
    autonumber
    actor Merchant
    participant Page as Purchases.jsx
    participant Controller as purchaseController.js
    participant DB as PostgreSQL Database

    Merchant->>Page: Select Supplier & Add Line Items (Products, Quantities, Unit Costs)
    Merchant->>Page: Click "Create Purchase Order"
    Page->>Controller: POST /api/purchases { supplier_id, items, notes }
    Controller->>DB: Begin Transaction
    Controller->>DB: Create PurchaseOrder record
    loop For each item in PO
        Controller->>DB: Create PurchaseOrderItem record
        Controller->>DB: Increment Product stock_quantity (where id & shop_id)
    end
    Controller->>DB: Commit Transaction
    Controller-->>Page: Return 201 Created
    Page->>Merchant: Display Success Toast & update inventory list
```

### 11.7 Sales Returns & Restocking
```mermaid
sequenceDiagram
    autonumber
    actor Merchant
    participant Page as Returns.jsx
    participant Controller as returnController.js
    participant DB as PostgreSQL Database

    Merchant->>Page: Enter Returned Product, Quantity, Refund Amount & Reason
    Page->>Controller: POST /api/returns { product_id, quantity, refund_amount, reason }
    Controller->>DB: Begin Transaction
    Controller->>DB: Create Return record
    Controller->>DB: Increment Product stock_quantity (where id & shop_id)
    Controller->>DB: Commit Transaction
    Controller-->>Page: Return 201 Created
    Page->>Merchant: Update Returns List & Stock Quantities
```

### 11.8 End of Day (EoD) Register Reconciliation
```mermaid
flowchart TD
    StartEoD[Cashier opens End of Day Page] --> QueryDate[GET /api/reports/end-of-day?date=YYYY-MM-DD]
    QueryDate --> FetchInvoices[Fetch all shop invoices for target date]
    FetchInvoices --> SumSales[Sum grand_total = Total Sales]
    FetchInvoices --> SumTaxes[Sum tax_total = Total Tax]
    FetchInvoices --> SumDiscounts[Sum discount = Total Discounts]
    FetchInvoices --> SumCash[Sum paid_amount = Cash Collected]
    FetchInvoices --> SumDues[Sum due_amount = Outstanding Credit Sales]
    FetchInvoices --> RankProducts[Aggregate & rank top 5 items sold]
    RankProducts --> RenderSummary[Render EoD Summary Card & Top Products Table]
```

### 11.9 Tiered SaaS Subscription & Razorpay Upgrades
```mermaid
sequenceDiagram
    autonumber
    actor Merchant
    participant Modal as PricingModal.jsx / RazorpayCheckout.jsx
    participant Controller as razorpayController.js
    participant Razorpay as Razorpay API Gateway
    participant DB as PostgreSQL Database

    Merchant->>Modal: Select Upgrade Plan (Gold / Premium)
    Modal->>Controller: POST /api/razorpay/create-order { plan, discount_code }
    Controller->>DB: Verify shop country == 'IN'
    Controller->>Controller: Compute amount in paise + 2% platform fee - discount
    Controller->>Razorpay: Create Razorpay Order Instance
    Razorpay-->>Controller: Return Order ID
    Controller-->>Modal: Return { order_id, totalAmount, key }
    Modal->>Razorpay: Open Razorpay Checkout Modal
    Merchant->>Razorpay: Complete Payment (UPI / Card / NetBanking)
    Razorpay-->>Modal: Payment Success Callback (order_id, payment_id, signature)
    Modal->>Controller: POST /api/razorpay/verify-payment { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan }
    Controller->>Controller: Compute HMAC-SHA256 signature using RAZORPAY_KEY_SECRET
    alt Signature Matches
        Controller->>DB: Update Shop plan in Database
        Controller-->>Modal: Return { success: true, plan }
        Modal->>Merchant: Show Success Notification & unlock features
    else Signature Mismatch
        Controller-->>Modal: Return 400 Payment Verification Failed
    end
```

### 11.10 Super Admin Operations
```mermaid
flowchart TD
    SALogin[Super Admin Enters Username, Password & Secret Key] --> AuthCheck{Credentials Valid?}
    AuthCheck -->|No| Deny[Return 401 Identity Not Recognized]
    AuthCheck -->|Yes| IssueToken[Generate JWT with role: super-admin]
    IssueToken --> OpenDashboard[SuperAdminDashboard.jsx]
    
    OpenDashboard --> Action1[Toggle Shop Activation State]
    Action1 --> DBUpdate1[Update Shop active = true/false]
    
    OpenDashboard --> Action2[Override Shop Subscription Plan]
    Action2 --> DBUpdate2[Update Shop plan = free/gold/premium]
    
    OpenDashboard --> Action3[Broadcast System Announcement]
    Action3 --> DBUpdate3[Create Announcement Record]
    
    OpenDashboard --> Action4[Publish Ad Banner]
    Action4 --> DBUpdate4[Create Advertisement Record]
```

---

## 12. Complete API Route Registry

### 1. Authentication Routes (`/api/auth`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | None | Public | Register new shop and admin account |
| `POST` | `/api/auth/login` | None | Public | Sign in user & issue JWT |
| `GET` | `/api/auth/check-username/:username` | None | Public | Rapid check for username availability |
| `GET` | `/api/auth/me` | Bearer | Any | Fetch currently authenticated user |
| `GET` | `/api/auth/staff` | Bearer | Admin | List all staff members for current shop |
| `POST` | `/api/auth/staff` | Bearer | Admin | Create new staff account (enforces `maxStaff` limit) |
| `DELETE` | `/api/auth/staff/:id` | Bearer | Admin | Delete staff account |
| `GET` | `/api/auth/profile` | Bearer | Any | Fetch user & shop profile settings |
| `PUT` | `/api/auth/profile` | Bearer | Admin | Update shop details, VAT/GST settings, logo image |

### 2. Product & Category Routes (`/api/products`, `/api/categories`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/products` | Bearer | Any | List shop products with search & category filter |
| `GET` | `/api/products/:id` | Bearer | Any | Fetch single product details |
| `POST` | `/api/products` | Bearer | Admin | Create product or composite bundle (Multer image support) |
| `PUT` | `/api/products/:id` | Bearer | Admin | Update product details or bundle components |
| `DELETE` | `/api/products/:id` | Bearer | Admin | Delete product |
| `GET` | `/api/categories` | Bearer | Any | List shop categories |
| `POST` | `/api/categories` | Bearer | Admin | Create category |
| `PUT` | `/api/categories/:id` | Bearer | Admin | Update category |
| `DELETE` | `/api/categories/:id` | Bearer | Admin | Delete category (blocked if non-empty) |

### 3. POS & Invoice Routes (`/api/invoices`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/invoices` | Bearer | Any | List sales invoices with pagination & plan history cutoff |
| `GET` | `/api/invoices/:id` | Bearer | Any | Fetch single invoice with line items |
| `POST` | `/api/invoices` | Bearer | Any | Execute POS checkout transaction & deduct stock |
| `GET` | `/api/invoices/:id/pdf` | Bearer | Any | Stream vector PDF invoice download |
| `DELETE` | `/api/invoices/:id` | Bearer | Admin | Delete invoice & restore product stock |
| `PATCH` | `/api/invoices/:id/payment` | Bearer | Any | Update invoice payment amount |

### 4. Due Collection & Debt Routes (`/api/due-payments`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/due-payments/unpaid` | Bearer | Any | List unpaid and partially paid customer invoices |
| `POST` | `/api/due-payments` | Bearer | Any | Collect debt payment settlement & issue receipt |
| `GET` | `/api/due-payments/stats` | Bearer | Any | Summary stats (Total pending, collected today, overdue) |
| `GET` | `/api/due-payments/history` | Bearer | Any | Fetch historical debt payment settlements |
| `GET` | `/api/due-payments/:id/pdf` | Bearer | Any | Stream printable PDF debt settlement receipt |

### 5. Reports & Analytics Routes (`/api/reports`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/reports/dashboard` | Bearer | Any | Summary KPIs (Today sales, revenue, low stock count) |
| `GET` | `/api/reports/full-stats` | Bearer | Admin | Comprehensive analytics & top products |
| `GET` | `/api/reports/daily` | Bearer | Admin | Daily sales breakdown |
| `GET` | `/api/reports/profit` | Bearer | Admin | Net profit, gross margin, cost analysis |
| `GET` | `/api/reports/trends` | Bearer | Admin | 30-day daily revenue vs expense trend |
| `GET` | `/api/reports/advanced` | Bearer | Admin | Category sales, sales by hour, top customers |
| `GET` | `/api/reports/end-of-day` | Bearer | Admin | End of day register reconciliation summary |

### 6. Purchasing & Supplier Routes (`/api/suppliers`, `/api/purchases`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/suppliers` | Bearer | Admin | List suppliers |
| `POST` | `/api/suppliers` | Bearer | Admin | Create supplier |
| `PUT` | `/api/suppliers/:id` | Bearer | Admin | Update supplier |
| `DELETE` | `/api/suppliers/:id` | Bearer | Admin | Delete supplier |
| `GET` | `/api/purchases` | Bearer | Admin | List purchase orders |
| `POST` | `/api/purchases` | Bearer | Admin | Create purchase order & automatically increment stock |

### 7. Returns & Stock Adjustments Routes (`/api/returns`, `/api/stock-adjustments`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/returns` | Bearer | Any | List sales returns |
| `POST` | `/api/returns` | Bearer | Any | Process sales return & restore stock |
| `GET` | `/api/stock-adjustments` | Bearer | Any | List manual inventory adjustments |
| `POST` | `/api/stock-adjustments` | Bearer | Any | Create manual adjustment (add/subtract stock) |
| `GET` | `/api/stock-adjustments/low-stock` | Bearer | Any | List products below low-stock threshold |

### 8. Expenses & Targets Routes (`/api/expenses`, `/api/targets`, `/api/discount-codes`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/expenses` | Bearer | Admin | List expenses |
| `POST` | `/api/expenses` | Bearer | Admin | Create expense |
| `DELETE` | `/api/expenses/:id` | Bearer | Admin | Delete expense |
| `GET` | `/api/targets` | Bearer | Admin | List sales targets & current month progress |
| `POST` | `/api/targets` | Bearer | Admin | Set sales target for a month |
| `GET` | `/api/discount-codes` | Bearer | Admin | List discount codes |
| `POST` | `/api/discount-codes` | Bearer | Admin | Create discount code |
| `PATCH` | `/api/discount-codes/:id/toggle` | Bearer | Admin | Toggle discount code active status |
| `DELETE` | `/api/discount-codes/:id` | Bearer | Admin | Delete discount code |
| `POST` | `/api/discount-codes/validate` | Bearer | Any | Validate promo code for POS checkout |

### 9. Subscriptions & Razorpay Routes (`/api/subscription`, `/api/razorpay`, `/api/export`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/subscription` | Bearer | Any | Fetch current shop plan & feature limits |
| `POST` | `/api/subscription/upgrade` | Bearer | Admin | Direct plan upgrade (Disabled for Indian accounts) |
| `POST` | `/api/razorpay/create-order` | Bearer | Admin | Create Razorpay order instance for Indian merchants |
| `POST` | `/api/razorpay/verify-payment` | Bearer | Admin | Verify Razorpay HMAC signature & upgrade plan |
| `POST` | `/api/razorpay/webhook` | Raw Body | System | Razorpay webhook listener for automated plan sync |
| `GET` | `/api/export/csv` | Bearer | Admin | Stream sales report download in CSV format |
| `GET` | `/api/export/pdf` | Bearer | Admin | Stream sales report download in PDF format |

### 10. Super Admin Platform Routes (`/api/super-admin`)
| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| `GET` | `/api/super-admin/setup-status` | None | Public | Check if system has been initialized |
| `POST` | `/api/super-admin/initialize` | Bootstrap Secret | Public | Seed initial Super Admin account |
| `POST` | `/api/super-admin/login` | None | Public | Authenticate Super Admin with triple credentials |
| `GET` | `/api/super-admin/analytics` | Super Admin | Super Admin | Global platform usage & revenue metrics |
| `GET` | `/api/super-admin/historical-analytics` | Super Admin | Super Admin | 30-day / 365-day platform growth trends |
| `GET` | `/api/super-admin/shops` | Super Admin | Super Admin | List all registered tenant shops |
| `PUT` | `/api/super-admin/shops/:id` | Super Admin | Super Admin | Update shop active status or override plan tier |
| `GET` | `/api/super-admin/announcements` | Super Admin | Super Admin | List platform announcements |
| `POST` | `/api/super-admin/announcements` | Super Admin | Super Admin | Create broadcast announcement |
| `PUT` | `/api/super-admin/announcements/:id` | Super Admin | Super Admin | Update announcement |
| `DELETE` | `/api/super-admin/announcements/:id` | Super Admin | Super Admin | Delete announcement |
| `GET` | `/api/super-admin/ads` | Super Admin | Super Admin | List in-app ad banners |
| `POST` | `/api/super-admin/ads` | Super Admin | Super Admin | Upload new ad banner (Multer) |
| `PUT` | `/api/super-admin/ads/:id` | Super Admin | Super Admin | Update ad banner |
| `DELETE` | `/api/super-admin/ads/:id` | Super Admin | Super Admin | Delete ad banner |
| `GET` | `/api/super-admin/discounts` | Super Admin | Super Admin | List platform discount codes |
| `POST` | `/api/super-admin/discounts` | Super Admin | Super Admin | Create platform discount code |
| `PUT` | `/api/super-admin/discounts/:id` | Super Admin | Super Admin | Update platform discount code |
| `DELETE` | `/api/super-admin/discounts/:id` | Super Admin | Super Admin | Delete platform discount code |
| `GET` | `/api/super-admin/logs` | Super Admin | Super Admin | Audit activity logs |

---

## 13. Frontend Routing & Navigation Map

Configured in `frontend/src/App.jsx` and guarded by `ProtectedRoute.jsx`.

| Client Path | Public/Private | Role Guard | Main Component | API Endpoints Called |
|---|---|---|---|---|
| `/login` | Public | None | `Login.jsx` | `POST /api/auth/login`, `POST /api/auth/register` |
| `/dashboard` | Private | Any | `Dashboard.jsx` | `GET /api/reports/dashboard`, `GET /api/reports/full-stats` |
| `/pos` | Private | Any | `POS.jsx` | `GET /api/products`, `POST /api/invoices`, `POST /api/discount-codes/validate` |
| `/due-collection` | Private | Any | `DueCollection.jsx` | `GET /api/due-payments/unpaid`, `POST /api/due-payments`, `GET /api/due-payments/stats` |
| `/invoices` | Private | Any | `Invoices.jsx` | `GET /api/invoices`, `GET /api/invoices/:id/pdf`, `DELETE /api/invoices/:id` |
| `/products` | Private | Any (Edit: Admin) | `Products.jsx` | `GET /api/products`, `POST /api/products`, `PUT /api/products/:id` |
| `/customers` | Private | Any | `Customers.jsx` | `GET /api/customers`, `POST /api/customers` |
| `/suppliers` | Private | Admin | `Suppliers.jsx` | `GET /api/suppliers`, `POST /api/suppliers` |
| `/purchases` | Private | Admin | `Purchases.jsx` | `GET /api/purchases`, `POST /api/purchases` |
| `/returns` | Private | Any | `Returns.jsx` | `GET /api/returns`, `POST /api/returns` |
| `/stock-adjustments`| Private | Any | `StockAdjustments.jsx` | `GET /api/stock-adjustments`, `POST /api/stock-adjustments` |
| `/expenses` | Private | Admin | `Expenses.jsx` | `GET /api/expenses`, `POST /api/expenses` |
| `/targets` | Private | Admin | `SalesTargets.jsx` | `GET /api/targets`, `POST /api/targets` |
| `/end-of-day` | Private | Admin | `EndOfDay.jsx` | `GET /api/reports/end-of-day` |
| `/reports` | Private | Admin | `Reports.jsx` | `GET /api/reports/*`, `GET /api/export/*` |
| `/staff` | Private | Admin | `Staff.jsx` | `GET /api/auth/staff`, `POST /api/auth/staff` |
| `/profile` | Private | Admin | `Profile.jsx` | `GET /api/auth/profile`, `PUT /api/auth/profile` |
| `/help` | Private | Any | `Help.jsx` | None (Static documentation) |
| `/super-admin-login`| Public | Super Admin | `SuperAdminLogin.jsx` | `POST /api/super-admin/login` |
| `/super-admin-dashboard`| Private | Super Admin | `SuperAdminDashboard.jsx`| `GET/POST/PUT /api/super-admin/*` |

---

## 14. Client & Server Error Handling

Error handling moves through strict layers to shield users from raw database tracebacks:

```text
Request Pipeline
  │
  ├── 1. Joi Schema Validation (400 Bad Request)
  │      Returns: { error: "Validation message" }
  │
  ├── 2. Auth & Permission Check (401 Unauthorized / 403 Forbidden)
  │      Returns: { error: "Account Suspended" / "Plan upgrade required" }
  │
  ├── 3. Controller Catch Block (500 Internal Server Error)
  │      Logs: console.error(err) on server console
  │      Returns: { error: "Human-readable message" }
  │
  └── 4. Axios Response Interceptor (Client)
         Captures 401 -> Clears localStorage & forces window.location.href = '/login'
```

---

## 15. State Management Architecture

State is divided logically across three tiers:

1. **Global Authentication State (`AuthContext.jsx`)**: Holds current user object, shop details, plan level, and handles token restoration on page load.
2. **Local Component State (`useState` / `useReducer`)**: Holds cart items in POS, active filters, form inputs, loading spinners, and modal visibility states.
3. **Persistent Browser Storage (`localStorage`)**:
   - `'token'`: Merchant Bearer JWT token.
   - `'user'`: Serialized user and shop JSON payload.
   - `'superAdminToken'`: Dedicated JWT token for Super Admin portal.

---

## 16. Key Business Logic Formulas

```text
1. Line Item Total
   line_total = quantity * unit_price

2. Line Item Tax (5% UAE VAT)
   tax_amount = line_total * 0.05

3. Subtotal
   subtotal = SUM(line_total)

4. Total Tax
   tax_total = SUM(tax_amount)

5. Grand Total
   grand_total = MAX(0, (subtotal + tax_total) - discount)

6. Due Amount
   due_amount = MAX(0, grand_total - paid_amount)

7. Invoice Status
   IF due_amount == 0 THEN status = 'paid'
   ELSE IF paid_amount > 0 THEN status = 'partial'
   ELSE status = 'due'

8. Net Profit
   net_profit = SUM(line_total - (cost_price * quantity)) - SUM(expenses)

9. Expected Cash (End of Day)
   expected_cash = opening_cash + cash_sales - cash_expenses
```

---

## 17. Security Model & Safeguards

- **Password Security**: Passwords hashed using `bcryptjs` with salt factor 10.
- **JWT Protection**: Encrypted with `JWT_SECRET`. Production enforces a minimum 32-character key requirement.
- **Strict Query Scoping**: Every database operation enforces `shop_id` scoping to prevent cross-tenant data leakage.
- **SQL Injection Safeguard**: All queries use Sequelize ORM parameterized inputs.
- **Suspension Guard**: Suspended shops (`active: false`) are denied access at middleware level.
- **Razorpay Security**: Payment verification uses HMAC-SHA256 signature checking. Webhooks use raw body validation.

---

## 18. File-to-Feature Quick Reference Map

| If you need to edit this feature... | Modify these Files |
|---|---|
| **POS Terminal & Checkout** | [POS.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/pages/POS.jsx), [invoiceController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/invoiceController.js), [invoiceRoutes.js](file:///home/abdul/Documents/Hisabi/backend/src/routes/invoiceRoutes.js) |
| **Inventory & Combo Bundles** | [Products.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/pages/Products.jsx), [productController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/productController.js), [Product.js](file:///home/abdul/Documents/Hisabi/database/models/Product.js), [BundleItem.js](file:///home/abdul/Documents/Hisabi/database/models/BundleItem.js) |
| **Customer Credit & Debt Settlement** | [DueCollection.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/pages/DueCollection.jsx), [duePaymentController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/duePaymentController.js), [DuePayment.js](file:///home/abdul/Documents/Hisabi/database/models/DuePayment.js) |
| **PDF Invoices & Debt Receipts** | [pdfService.js](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js), [invoiceController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/invoiceController.js) |
| **SaaS Subscriptions & Razorpay** | [PricingModal.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/components/PricingModal.jsx), [razorpayController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/razorpayController.js), [planMiddleware.js](file:///home/abdul/Documents/Hisabi/backend/src/middleware/planMiddleware.js), [planUtils.js](file:///home/abdul/Documents/Hisabi/backend/src/utils/planUtils.js) |
| **Super Admin Platform** | [SuperAdminDashboard.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/pages/SuperAdminDashboard.jsx), [superAdminController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/superAdminController.js), [superAdminAuth.js](file:///home/abdul/Documents/Hisabi/backend/src/middleware/superAdminAuth.js) |
| **Authentication & Registration** | [Login.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/pages/Login.jsx), [AuthContext.jsx](file:///home/abdul/Documents/Hisabi/frontend/src/context/AuthContext.jsx), [authController.js](file:///home/abdul/Documents/Hisabi/backend/src/controllers/authController.js) |

---

## 19. Developer "How Do I..." Action Guide

### How Do I Add a New Database Model?
1. Create a new model file in `database/models/NewModel.js`.
2. Define the schema using `sequelize.define(...)` with a mandatory `shop_id` foreign key.
3. Import the model in `database/models/index.js` and add relational associations.
4. Export the model from `database/models/index.js`.
5. Run the server (`npm start --prefix backend`), which calls `syncDatabase()` with `{ alter: true }`.

### How Do I Add a New Restricted Feature Behind a SaaS Plan Guard?
1. Add the feature flag key to `PLAN_LIMITS` in `backend/src/utils/planUtils.js` and `frontend/src/utils/planUtils.js`.
2. Apply `requirePlan('gold')` middleware on the backend route (`backend/src/routes/myFeatureRoutes.js`).
3. Wrap the frontend UI component in `<FeatureGuard feature="myFeature">` (`frontend/src/components/FeatureGuard.jsx`).

### How Do I Add a New API Endpoint?
1. Create or edit a controller function in `backend/src/controllers/`.
2. Enforce `shop_id: req.user.shop_id` on all database queries.
3. Register the endpoint in `backend/src/routes/`.
4. Mount the route module in `backend/src/app.js`.

---

## 20. Common Development Pitfalls to Avoid

- **FORGETTING `shop_id`**: Always include `where: { shop_id: req.user.shop_id }` in database queries.
- **MUTATING DATABASE WITHOUT TRANSACTIONS**: Use `sequelize.transaction()` for checkout, returns, and restocking operations.
- **HARDCODING BASE URLS**: Always use `import.meta.env.VITE_API_URL` or configured Axios helper.
- **BYPASSING PLAN CHECKS ON SERVER**: Client UI locks are for UX only; always enforce backend protection using `requirePlan`.
- **EXPOSING SECRETS**: Never commit `.env` files or real credentials to Git.

---

## 21. Environment Variables Reference

### Backend (`backend/.env`)
- `PORT`: Server port (Default: `5000`)
- `DATABASE_URL`: PostgreSQL connection URI (`postgresql://user:password@localhost:5432/hisabi_db`)
- `JWT_SECRET`: Secret key for JWT signing (Minimum 32 chars in production)
- `RAZORPAY_KEY_ID`: Razorpay public API key
- `RAZORPAY_KEY_SECRET`: Razorpay private API key
- `RAZORPAY_WEBHOOK_SECRET`: Secret key for Razorpay webhooks
- `SUPER_ADMIN_USERNAME`: Initial Super Admin username
- `SUPER_ADMIN_PASSWORD`: Initial Super Admin password
- `SUPER_ADMIN_SECRET_KEY`: Initial Super Admin secondary key
- `SUPER_ADMIN_BOOTSTRAP_SECRET`: Secret token for Super Admin API initialization

### Frontend (`frontend/.env`)
- `VITE_API_URL`: Backend REST API URL (`http://localhost:5000` or production URL)

---

## 22. Deployment & Infrastructure

- **Frontend Deployment**: Host on Vercel, Netlify, or Cloudflare Pages. Point build directory to `frontend/dist`.
- **Backend API Server**: Host on Render, Railway, or Docker VM. Run `node backend/src/server.js`.
- **PostgreSQL Database**: Managed PostgreSQL instance (Neon, Supabase, or Render Postgres).

---

## 23. Testing Strategy & Manual Testing Checklist

Execute this checklist before pushing major features:

### Authentication & Tenant Isolation
- [ ] Register a new shop and verify `Shop` and `User` records are created.
- [ ] Log in as Shop A, create a product, log out, log in as Shop B, and verify Shop B cannot see Shop A's product.
- [ ] Attempt login to a suspended shop and verify `403 Account Suspended` error.

### POS & Stock Logic
- [ ] Complete a cash sale and verify stock decrements.
- [ ] Sell a composite bundle and verify component stocks decrement.
- [ ] Attempt to sell an item with insufficient stock and verify transaction rollback.

### Financials & Debt Ledger
- [ ] Complete a credit sale (`paid_amount < grand_total`) and verify status becomes `due`/`partial`.
- [ ] Collect a due payment in Due Collection and verify debt settlement receipt (`DUE-XXXX`) is issued.

---

## 24. Current Implementation Status Matrix

| Feature | Status | Frontend | Backend | Database | Notes |
|---|---|---|---|---|---|
| Multi-Tenant Auth & JWT | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Full isolation via `shop_id` |
| Mobile-First POS Engine | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Real-time calculation & bundle deduction |
| Relational Bundles | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Composite stock deduction |
| Customer Credit Ledger | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Due collection & PDF receipts |
| Purchase Orders & Stock | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Auto stock increment on PO |
| PDF Invoice Streaming | COMPLETE | ✅ Implemented | ✅ Implemented | N/A | Vector PDF generation via PDFKit |
| Tiered SaaS Monetization | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | Free, Gold, Premium guards |
| Razorpay Payment Gateway | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | INR subscription upgrades & webhooks |
| Multi-Language (EN/AR) | COMPLETE | ✅ Implemented | N/A | N/A | i18next dynamic RTL layout |
| Super Admin Portal | COMPLETE | ✅ Implemented | ✅ Implemented | ✅ Implemented | System management & analytics |

---

## 25. Known Issues & Technical Debt

1. **Sequelize `alter: true` Sync**: Server uses `sequelize.sync({ alter: true })` on boot (`backend/src/server.js`). For large production databases, migration scripts (`sequelize-cli`) are recommended.
2. **Local Upload Storage**: Uploaded logos are saved to local filesystem (`backend/uploads`). In multi-instance serverless deployments, cloud storage (AWS S3 or Cloudinary) should be used.
3. **Thermal Printer Direct Integration**: Currently prints via browser print dialog (`window.print()`). Hardware ESC/POS WebUSB thermal printing can be added in future.

---

## 26. Future Development Guidelines

1. **Maintain Strict Multi-Tenancy**: Never omit `shop_id` from queries.
2. **Use Database Transactions**: Always wrap multi-step stock or financial operations in `sequelize.transaction()`.
3. **Keep Server Permissions Absolute**: Do not rely exclusively on client-side UI guards (`FeatureGuard`); enforce restrictions on the server using `requireAdmin` and `requirePlan`.
4. **Preserve Internationalization**: Wrap all new UI text strings in `t('key')` to support English and Arabic RTL.

---

## 27. New Developer Quick-Start Guide

If you are a new developer onboarding onto the Hisabi codebase, read this document in the following sequence:

1. **[Section 1: Project Overview & Core Concepts](#1-project-overview--core-concepts)** — Understand what Hisabi does.
2. **[Section 4: System Architecture & Data Flow](#4-system-architecture--data-flow)** — Understand how requests flow.
3. **[Section 5: Complete Database Schema Blueprint](#5-complete-database-schema-blueprint)** — Learn the database models.
4. **[Section 6: Multi-Tenant Data Isolation & Security](#6-multi-tenant-data-isolation--security)** — Understand `shop_id` safety rules.
5. **[Section 11: Core Business Workflows & Mermaid Diagrams](#11-core-business-workflows--mermaid-diagrams)** — Study the sequence diagrams.
6. **[Section 18: File-to-Feature Quick Reference Map](#18-file-to-feature-quick-reference-map)** — Locate specific files for tasks.
7. **[Section 19: Developer "How Do I..." Action Guide](#19-developer-how-do-i-action-guide)** — Start coding!

> *"If you understand these sections, you are ready to safely develop and extend the Hisabi codebase."*

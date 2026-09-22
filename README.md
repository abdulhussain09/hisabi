# 🏬 Hisabi-POS — Enterprise Point of Sale & Inventory SaaS

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.0-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Sequelize-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](#license)

**Hisabi-POS** is a high-performance, full-stack multi-tenant Point of Sale (POS) and Inventory Management SaaS platform designed for modern retail, dining, and multi-location businesses. 

Engineered with a **multi-region architecture** (supporting Gulf Cooperation Council VAT & India 18% GST), **digital payment integrations** (Razorpay), **bilingual RTL support** (English & Arabic), and a **serverless-proof 100% persistent media engine**.

---

## 📌 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [Key Modules & Features](#-key-modules--features)
- [Persistent Media Architecture](#-persistent-media-architecture)
- [Technology Stack](#-technology-stack)
- [Project Architecture & Directory Structure](#-project-architecture--directory-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables](#-environment-variables)
- [Security & Production Readiness](#-security--production-readiness)
- [Documentation & Resources](#-documentation--resources)
- [License](#-license)

---

## 🌐 Overview & Value Proposition

Hisabi-POS provides an end-to-end retail OS that unifies point-of-sale terminals, inventory controls, customer dues, sales analytics, and multi-tier subscription billing into a single responsive web interface.

* **Multi-Market Compliance**: Tailored tax engines for GCC (UAE/Kuwait TRN + VAT) and India (GSTIN + 18% HSN/SAC breakdowns).
* **Multi-Tenant Segmentation**: Isolated shop data with role-based access control (Super-Admin, Shop Admin, Staff).
* **Zero-Latency POS Interface**: Touch-optimized checkout UI with barcode scanner emulation, bundle product assembly, and instant receipt rendering.
* **Serverless Resilience**: In-memory media processing and database persistence for 100% uptime on Vercel, Render, Railway, and Cloudflare.

---

## 🚀 Key Modules & Features

| Category | Module | Highlights |
| :--- | :--- | :--- |
| ⚡ **Point of Sale** | **Modern Checkout Engine** | Responsive grid/list view, fast barcode scanner simulation, discount application, multi-tax calculations, instant cart item assembly. |
| 📦 **Inventory** | **Catalog & Composite Bundles** | Stock management, low-stock threshold triggers, SKU/Barcode tracking, composite bundle item creation linking individual products. |
| 🖼️ **Media Engine** | **Persistent Image Processing** | Serverless-proof Base64 Data URI storage in PostgreSQL `TEXT` columns, in-memory Multer buffering, fallback SVG placeholder rendering. |
| 🌐 **Localization** | **GCC & India Tax Engines** | Dynamic switching between UAE/Kuwait VAT (5%) and India GST (18%), bilingual English & Arabic (RTL) interface with i18next. |
| 💳 **Monetization** | **Subscription & Payments** | Plan hierarchy (Free, Gold, Premium), feature gate enforcement, Razorpay checkout integration for automated plan upgrades. |
| 📊 **Analytics** | **Business Intelligence** | Real-time profit margins, revenue target tracking, sales heatmaps, expense categorizations, top-selling product breakdowns. |
| 📄 **Documents** | **Invoicing & Exports** | PDFKit-powered tax-compliant invoice generator, CSV dataset exports for sales, expenses, inventory, and due collections. |

---

## 🖼️ Persistent Media Architecture

To eliminate file loss inherent to ephemeral container filesystems (e.g. Vercel `/tmp` or Docker instance resets), Hisabi implements a dual-layer persistent storage pipeline:

```
[ Client Upload ] ──> [ Multer (MemoryStorage Buffer) ] 
                             │
                             ▼
              [ Base64 Data URI Converter ] 
                             │
                             ▼
           [ PostgreSQL Database (TEXT Field) ]
                             │
       ┌─────────────────────┴─────────────────────┐
       ▼                                           ▼
[ Direct Data URI Stream ]                [ Express Static Cache ]
 (100% Serverless Persistent)              (Fallback SVG Handler)
```

1. **In-Memory Buffering**: Uploaded files pass directly into RAM (`multer.memoryStorage()`) without writing to temporary disk.
2. **Database Storage**: Image data is encoded as MIME-typed Data URIs (`data:image/png;base64,...`) and saved directly in PostgreSQL `TEXT` columns (`products.image_path`, `shops.brand_logo`, `advertisements.image_url`).
3. **Graceful Fallbacks**: Legacy file paths (`/uploads/*`) are served via static Express middleware with a fallthrough SVG placeholder generator to prevent broken image UI icons.

---

## 🛠️ Technology Stack

### Backend
* **Runtime**: Node.js v20+ (ES6 Modules & CommonJS)
* **Framework**: Express v5.0 (10MB payload body limits for high-res media)
* **ORM & Database**: PostgreSQL + Sequelize ORM (`TEXT` schemas)
* **Authentication**: JSON Web Tokens (JWT) + BcryptJS password hashing
* **Payment Gateway**: Razorpay Node SDK
* **Document Processing**: PDFKit (Invoices), Joi (Schema Validation)

### Frontend
* **Core Framework**: React 18 + Vite (HMR build toolchain)
* **Styling**: Tailwind CSS v3.4 (Custom glassmorphism theme tokens)
* **State & Routing**: React Context API + React Router DOM v6
* **Data Visualization**: Recharts (Interactive analytical charts)
* **Iconography**: Lucide React
* **Localization**: i18next (English & Arabic RTL support)

---

## 📂 Project Architecture & Directory Structure

```
hisabi/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handlers (Auth, Products, Invoices, POS, SuperAdmin)
│   │   ├── middleware/       # JWT Auth, Role Gatekeepers, Memory Uploads, Plan Validation
│   │   ├── routes/           # RESTful API endpoint definitions
│   │   ├── services/         # Razorpay checkout & PDFKit invoice generator
│   │   ├── app.js            # Express server configuration & middleware pipeline
│   │   └── server.js         # DB connection lifecycle & server bootstrap
│   └── database/             # Relational data layer
│       ├── database.js       # Sequelize PostgreSQL connection pool
│       └── models/           # Models (Product, Shop, User, Invoice, Advertisement, etc.)
├── docs/                     # Technical documentation & developer guides
│   └── HISABI_COMPLETE_DEVELOPER_GUIDE.md
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI (Modals, Charts, Sidebar, Topbar)
│   │   ├── pages/            # View pages (POS, Dashboard, Products, Staff, Reports, etc.)
│   │   ├── context/          # AuthContext & global shop state
│   │   └── public/locales/   # i18n translation dictionaries (en, ar)
│   ├── index.html            # Main HTML entrypoint
│   └── vite.config.js        # Vite bundler configuration
├── FEATURES_AND_ARCHITECTURE.md
└── README.md
```

---

## ⚙️ Getting Started & Local Setup

### Prerequisites

Ensure you have the following installed locally:
* **Node.js**: `v20.0.0` or higher
* **npm**: `v9.0.0` or higher
* **PostgreSQL**: `v14.0` or higher (Local installation or managed provider like Neon/Supabase)

### Quickstart Guide

1. **Clone the repository**:
   ```bash
   git clone https://github.com/lucifer-0701/hisabi.git
   cd hisabi
   ```

2. **Install dependencies**:
   ```bash
   # Install root automation scripts
   npm install

   # Install backend & frontend packages
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Configure Environment Files**:
   Create the required `.env` configuration files for both backend and frontend as detailed in the [Environment Variables](#-environment-variables) section below.

4. **Initialize Database**:
   Create a PostgreSQL database named `hisabi`:
   ```sql
   CREATE DATABASE hisabi;
   ```
   *Sequelize will automatically synchronize models and create tables on initial startup (`alter: true`).*

5. **Start Development Servers**:
   Run both frontend and backend concurrently from the root directory:
   ```bash
   npm start
   ```
   * **Frontend Application**: `http://localhost:5173`
   * **Backend API Service**: `http://localhost:5000`

---

## 🗺️ Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://hisabi_user:your_password@localhost:5432/hisabi
JWT_SECRET=your_super_secret_jwt_key_must_be_at_least_32_chars
FRONTEND_URL=http://localhost:5173

# Payment Gateway (Optional / Production)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_SECRET=your_razorpay_secret
```

### Frontend (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:5000
```

---

## 🛡️ Security & Production Readiness

* **JWT Authentication**: Secure Bearer token authentication with configurable expiration and HTTP header verification.
* **Role-Based Authorization**: Middleware-enforced strict permissions (`admin`, `staff`, `super_admin`).
* **Input Sanitization**: Request parameters and payloads validated with Joi schemas prior to database operations.
* **HTTP Security Headers**: Configured with `helmet` for cross-origin security policies and frame protection.
* **Rate Limiting & Payload Defense**: Express body limits raised to `10mb` exclusively for authorized base64 media uploads while safeguarding JSON endpoints against DOS.

---

## 📚 Documentation & Resources

* 📖 **[FEATURES_AND_ARCHITECTURE.md](file:///home/abdul/Documents/Hisabi/FEATURES_AND_ARCHITECTURE.md)** — Comprehensive architecture breakdown, database entity relationships, and module specifications.
* 📚 **[HISABI_COMPLETE_DEVELOPER_GUIDE.md](file:///home/abdul/Documents/Hisabi/docs/HISABI_COMPLETE_DEVELOPER_GUIDE.md)** — Complete developer guide detailing setup, API routes, middleware details, and design system.

---

## 📄 License

This project is licensed under the **ISC License**.

```text
Copyright (c) 2026 Hisabi-POS Team

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.
```

---

<p align-items="center">
  <sub>Built with ❤️ for the future of modern retail by the <b>Hisabi-POS Engineering Team</b></sub>
</p>
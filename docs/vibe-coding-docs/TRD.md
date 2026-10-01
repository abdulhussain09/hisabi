# Technical Requirements Document (TRD) — Hisabi POS

## 1. Project Overview
**Hisabi POS** is an enterprise-grade, multi-tenant Point of Sale (POS) and Inventory SaaS built for retail, dining, and modern commercial businesses across **India (GST 18%)**, **UAE / Dubai (VAT 5%)**, and **Kuwait (Commercial / Tax-Free)**. It features an authoritative multi-country invoice engine, live split-screen invoice editing, strict product master vs invoice snapshot isolation, persistent media storage, and offline-aware transaction queueing.

## 2. Technical Goals
- **Multi-Country Parity**: Support dynamic currency formatting (INR 2 decimals, AED 2 decimals, KWD 3 decimals), tax modes (GST, VAT, NONE), and bilingual English/Arabic RTL layouts.
- **100% Mathematical Parity**: A single normalized calculation engine produces identical subtotal, tax, discount, and grand total figures across React web preview, browser printing, and PDFKit export.
- **Master Data Isolation**: Overriding item prices or adding custom service items on an invoice MUST NEVER mutate product master records or inventory master tables.
- **Audit Stability & Reproducibility**: Historical invoices are backed by full snapshot data and revision logs (`invoice_revisions`), ensuring past documents never change when shop settings or product master prices change.
- **High Concurrency & Idempotency**: Reject stale edits using optimistic concurrency (`version_number`) and eliminate duplicate checkout submissions via `idempotency_key`.

## 3. Tech Stack
- **Frontend**: React 18, Vite 5, Tailwind CSS 3.4, Lucide Icons, i18next (English & Arabic RTL).
- **Backend**: Node.js 20+, Express 5.0, Sequelize ORM 6.37, PostgreSQL (Supabase / Neon DB).
- **PDF & QR Engine**: PDFKit, Native GCC TLV Base64 QR generator, UPI QR builder.
- **Authentication**: JWT token-based auth with tenant isolation (`shop_id`).
- **Hosting & Deployment**: Cloudflare Pages (Frontend), Railway / Cloud Run (Backend API).

## 4. Functional Requirements

### Authentication & Multi-Tenancy
- User can sign in with username and password.
- All database queries and API routes strictly enforce tenant isolation (`shop_id`).
- Role-based permissions distinguish Admin (full access, invoice deletion) and Staff (billing, viewing).

### POS Billing & Checkout
- Real-time product search by name, barcode, or category filters.
- Support for normal products, custom non-inventory service items, and bundle products.
- Cart supports item discounts, global discounts, custom prices, and quantity increments.
- Checkout supports Cash, Card, UPI, KNet, and Bank Transfer with offline fallback queueing (`idempotency_key`).

### International Master Invoice Engine
- **India (IN)**: GST TAX INVOICE title, GSTIN, HSN/SAC codes, Place of Supply state codes, Reverse Charge toggle, CGST/SGST (intra-state) vs IGST (inter-state) calculation, Indian number-to-words (`INR Two Hundred Fifty and Fifty Paise Only`).
- **UAE (AE)**: TAX INVOICE / فاتورة ضريبية, TRN, 5% VAT / 0% Zero-Rated calculation, Dual English + Arabic labels, GCC TLV QR code.
- **Kuwait (KW)**: INVOICE / فاتورة, Commercial Registration (CR No.), KWD 3-decimal Fils precision (`KWD Twelve and Three Hundred Fifty Fils Only`), hidden tax sections.

### Invoice Editing & Revision History
- Interactive split-screen Invoice Editor (`InvoiceEditor.jsx`) with live A4 document preview.
- Allows editing prices, quantities, discounts, HSN/SAC, customer details, payment methods, notes, and declarations post-generation.
- Audit history records previous snapshots into `invoice_revisions` table with version increment (`version_number`).

### Inventory Ledger & Stock Adjustment
- Inventory movements log explicit entries in the `stock_adjustments` table (`type: 'remove'` for sales, `type: 'add'` for voiding).
- Invoice edits compute stock deltas ($\text{stockDelta} = \text{newQty} - \text{oldQty}$) to prevent double deduction.

## 5. Non-Functional Requirements
- **Responsive Layout**: Mobile-optimized cart and invoice editor with tabbed Edit/Preview toggle (320px+ viewport support).
- **Performance**: Sub-500ms backend API response times; client-side calculation engine executes in <5ms.
- **Security**: Server-side validation of all client-submitted totals; secrets stored strictly in environment variables (`.env`).
- **Print Parity**: CSS `@media print` rules enforce A4 portrait printing, repeating table headers, and zero UI element leakage.

## 6. Integrations
- **Razorpay**: Subscription plan billing integration.
- **Supabase / Neon PostgreSQL**: Production database hosting.
- **Cloudflare Pages**: High-availability frontend SPA hosting.

## 7. Constraints
- Product master data and invoice snapshot data must remain strictly isolated.
- Client-calculated totals are for preview only; backend recalculates and validates every figure.
- JavaScript ES2022 standards must be maintained across backend and frontend (no unapproved TypeScript rewrites).

## 8. Definition of Done
- Multi-country test script (`scratch/test_multi_country_invoice_engine.js`) passes 100%.
- Database sync and pre-sync migration backfills execute without SQL errors.
- Frontend production bundle (`npm run build`) builds cleanly with zero errors.

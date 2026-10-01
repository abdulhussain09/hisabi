# Implementation Plan (IMPLEMENTATION_PLAN.md) — Hisabi POS

## Project Rule
Build one phase at a time.
Do not start the next phase until the current phase passes its verification checks.

---

## Phase 0 — Project Setup & Environment
- **Tasks**:
  - Configure root and sub-package scripts (`package.json`).
  - Set up PostgreSQL database connection (`database/database.js`) with `.env` parameters.
  - Configure Tailwind CSS 3.4 and custom design tokens (`frontend/src/index.css`).
  - Configure i18next bilingual English & Arabic translation files (`public/locales/`).
- **Deliverable**: App runs locally with `npm start` (Backend on port 5000, Frontend on port 5173).
- **Verify**: `npm run build` compiles frontend bundle without errors.

---

## Phase 1 — Database Models & Migrations
- **Tasks**:
  - Extend `Invoice` model with snapshot columns, country, currency, tax_mode, version_number, idempotency_key.
  - Extend `InvoiceItem` model to make `product_id` nullable and add snapshot item attributes (`item_name`, `sku`, `hsn_sac`, `discount`, `tax_amount`, `is_custom_item`).
  - Create `InvoiceRevision` model (`database/models/InvoiceRevision.js`) for revision audit logging.
  - Add pre-sync migration SQL in `database/models/index.js` to backfill existing invoices safely from parent shop records without hardcoded default DDL overrides.
- **Deliverable**: Database sync (`syncDatabase()`) executes automatically on server startup.
- **Verify**: `node -e "require('./database/models').syncDatabase()"` completes with `SYNC OK`.

---

## Phase 2 — Authoritative Calculation Engine & Country Config
- **Tasks**:
  - Create `countryConfig.js` (`IN` GST, `AE` VAT, `KW` Tax-Free config definitions).
  - Create `amountInWords.js` (INR Indian scale, AED Dirhams/Fils, KWD Dinars/Fils 3 decimals).
  - Create `invoiceCalculationEngine.js` implementing deterministic calculation pipeline (Gross $\to$ Line Discount $\to$ Taxable $\to$ Tax $\to$ Subtotal $\to$ Global Discount $\to$ Round Off $\to$ Grand Total).
- **Deliverable**: Shared pure JS calculation engine producing normalized view models (`items`, `totals`, `meta`).
- **Verify**: Run `scratch/test_multi_country_invoice_engine.js` calculation tests.

---

## Phase 3 — Master Invoice Renderer UI Components
- **Tasks**:
  - Create `InvoiceHeader.jsx` (Two-column layout, shop logo, TRN/GSTIN/CR No., invoice title in English/Arabic).
  - Create `SellerBuyerCards.jsx` (Side-by-side ice-blue information cards).
  - Create `SupplyDetails.jsx` (Place of Supply state & code, Supply date, Reverse charge badge).
  - Create `ItemsTable.jsx` (Compact itemized table with HSN/SAC, MRP, Unit, Qty, Rate, Discount, Taxable, Tax Rate, Total).
  - Create `TaxSummary.jsx` (India CGST/SGST/IGST breakdown; UAE VAT summary; hidden for Kuwait).
  - Create `TotalsCard.jsx` (Subtotal, Discounts, Tax, Round Off, Grand Total Navy banner, Paid & Due amounts).
  - Create `AmountInWordsCard.jsx`, `BankDetailsCard.jsx`, `QRPaymentCard.jsx`, `DeclarationSignature.jsx`.
  - Create container `InvoiceRenderer.jsx`.
- **Deliverable**: Professional A4 paper invoice component matching GCC & India compliance visual standards.
- **Verify**: View rendered invoice in browser preview; check responsive design across desktop and mobile screens.

---

## Phase 4 — Interactive Live Invoice Editor Component
- **Tasks**:
  - Create `InvoiceEditor.jsx` featuring split-screen desktop layout (Editor Form on left, Live A4 Preview on right).
  - Add line item editor with quantity/price inputs, discount controls, and price override badges (`Invoice Price: ₹450 | Master Price: ₹500`).
  - Add `+ Add Custom Item` button for non-inventory items (`product_id = null`).
  - Add `[ ] Save updates to Customer Directory` opt-in toggle.
  - Implement mobile Edit/Preview tab toggle.
- **Deliverable**: Interactive invoice editing UI with real-time recalculation.
- **Verify**: Edit invoice item price -> verify live preview updates instantly while product master price remains unchanged.

---

## Phase 5 — Backend Controller, Idempotency & Optimistic Concurrency
- **Tasks**:
  - Update `createInvoice` in `backend/src/controllers/invoiceController.js`: Check `idempotency_key`, populate snapshot fields, log `StockAdjustment` ledger entries (`type: 'remove'`).
  - Implement `updateInvoice` (`PUT /api/invoices/:id`): Check `version_number` vs `expected_version` (409 Conflict on mismatch), save current state to `InvoiceRevision` model, calculate stock deltas, increment version.
  - Update `deleteInvoice`: Log `StockAdjustment` stock restoration entries (`type: 'add'`).
  - Update `backend/src/routes/invoiceRoutes.js` with `PUT /:id`.
- **Deliverable**: Secure backend controller with stock ledger integration and optimistic concurrency.
- **Verify**: Test duplicate checkout submitting same `idempotency_key` -> returns existing invoice without duplicate stock deduction.

---

## Phase 6 — PDF Engine Overhaul & Browser Print Styling
- **Tasks**:
  - Overhaul `backend/src/services/pdfService.js` to consume Normalized View Model produced by `invoiceCalculationEngine.js`.
  - Add `@media print` rules in `frontend/src/index.css` for clean A4 printing (hide UI controls, enforce repeating `<thead>`, prevent page-break cuts).
- **Deliverable**: 100% mathematical parity across React preview, browser printing, and PDFKit export.
- **Verify**: Trigger PDF download `GET /api/invoices/:id/pdf` and check generated PDF layout.

---

## Phase 7 — Verification & Production Readiness
- **Tasks**:
  - Run full multi-country test suite (`scratch/test_multi_country_invoice_engine.js`).
  - Run frontend production build (`npm run build`).
  - Verify database second-pass sync.
- **Deliverable**: Verified production-ready Master Invoice Engine.
- **Verify**: All automated tests pass and production build succeeds.

---

## Out of Scope for V1
- Custom domain mapping per tenant (managed via Cloudflare DNS).
- Automated hardware thermal printer ESC/POS Bluetooth raw stream drivers.

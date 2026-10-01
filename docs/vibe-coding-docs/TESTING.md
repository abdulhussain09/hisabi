# Testing Guide (TESTING.md) — Hisabi POS

## 1. Testing Goal
Confirm that the Master Invoice Engine correctly calculates taxes and totals for **India (GST)**, **UAE (VAT)**, and **Kuwait (Tax-Free)**, enforces product master isolation, logs stock ledger adjustments, and prevents concurrency conflicts.

---

## 2. Critical User Journey
Login $\to$ POS Terminal $\to$ Add Product & Custom Item to Cart $\to$ Complete Sale $\to$ View Invoice A4 Document $\to$ Edit Invoice Price Override $\to$ Save Revision $\to$ Verify Product Master Unchanged $\to$ Download PDF.

---

## 3. Multi-Country Compliance Tests

### A. India GST Tests (`country: 'IN'`)
- [ ] **Intra-State GST**: Set Seller State = Buyer State (e.g. Maharashtra). Verify Taxable Amount × 18% splits equally into CGST 9% and SGST 9%.
- [ ] **Inter-State GST**: Set Seller State != Buyer State (e.g. Maharashtra $\to$ Delhi). Verify Taxable Amount × 18% applies as IGST 18% (CGST & SGST = 0).
- [ ] **HSN/SAC Display**: Verify HSN/SAC column is rendered on Items Table.
- [ ] **Place of Supply**: Verify Place of Supply state and state code render in buyer section.
- [ ] **Amount in Words**: Verify text in words uses Indian scale (e.g. `INR Two Hundred Fifty and Fifty Paise Only`).

### B. UAE / Dubai VAT Tests (`country: 'AE'`)
- [ ] **Standard 5% VAT**: Verify 5% VAT is added to taxable amount.
- [ ] **Zero-Rated / Exempt**: Mark item `zero_rated` or `exempt` -> verify 0% VAT applied.
- [ ] **TRN Display**: Verify Seller and Buyer TRN numbers display.
- [ ] **Dual Arabic/English**: Verify Arabic title (فاتورة ضريبية) and labels render with clean RTL text layout.
- [ ] **GCC TLV QR Code**: Verify GCC Base64 TLV string is rendered into QR code.

### C. Kuwait Commercial Tests (`country: 'KW'`)
- [ ] **KWD 3 Decimals**: Verify prices and totals format to 3 decimal places (e.g. `12.350 KWD`).
- [ ] **Fils in Words**: Verify amount in words outputs Fils precision (e.g. `KWD Twelve and Three Hundred Fifty Fils Only`).
- [ ] **Tax Hidden**: Verify Tax Summary card and tax columns are hidden.
- [ ] **CR Number**: Verify Commercial Registration (CR No.) displays in seller details card.

---

## 4. Master Data & Price Override Isolation Tests

### Price Override Test
1. Create a product in Product Master with selling price `₹500.00`.
2. Add product to invoice and override price to `₹450.00`.
3. Save invoice.
4. **Verification**: Query `Product` table -> verify `selling_price` remains `₹500.00`. Query `InvoiceItem` -> verify `unit_price` is `₹450.00`.

### Custom Non-Inventory Item Test
1. Click `+ Add Custom Item` on invoice editor.
2. Enter Name "Tailoring Charge", Price `₹200.00`, Qty `1`.
3. Save invoice.
4. **Verification**: Verify `invoice_items.product_id` is `null` and `is_custom_item` is `true`. Verify no row was created in `products` table.

---

## 5. Stock Ledger & Inventory Adjustment Tests

- [ ] **Sale Deduction**: Complete checkout for 2 units of Item A -> verify `products.stock_quantity` decrements by 2 AND a `stock_adjustments` row is created (`type: 'remove'`, `quantity_change: -2`).
- [ ] **Revision Delta**: Edit finalized invoice quantity from 2 to 5 -> verify stock decrements by 3 AND `stock_adjustments` logs `quantity_change: -3`.
- [ ] **Invoice Deletion**: Delete invoice -> verify stock restores by 5 AND `stock_adjustments` logs `quantity_change: +5` (`type: 'add'`).

---

## 6. Concurrency & Idempotency Tests

- [ ] **Optimistic Concurrency (409 Conflict)**: Send `PUT /api/invoices/:id` with `expected_version: 1` when database `version_number` is `2` -> verify server returns `409 Conflict`.
- [ ] **Idempotency Key Check**: Submit `POST /api/invoices` twice with same `idempotency_key` -> verify second request returns existing invoice without double stock deduction.

---

## 7. Automated Test Suite Execution

Run the multi-country test suite script:
```bash
node scratch/test_multi_country_invoice_engine.js
```

**Expected Output**:
```text
=== STARTING MULTI-COUNTRY INVOICE ENGINE VERIFICATION ===
--- 1. Testing Country Configurations ---
✓ Country Configs OK

--- 2. Testing Amount In Words Utility ---
India Words: INR Two Hundred Fifty and Fifty Paise Only
UAE Words: AED Two Hundred Ten Only
Kuwait Words: KWD Twelve and Three Hundred Fifty Fils Only
✓ Amount In Words OK

--- 3. Testing Calculation Engine (India Intra-state vs Inter-state) ---
Intra-state CGST: 18 SGST: 18 IGST: 0
Inter-state CGST: 0 SGST: 0 IGST: 36
✓ Calculation Engine OK

--- 4. Testing DB Operations & Inventory Isolation ---
Original Product Price: ₹500.000, Stock: 50
Verified Product Master Price remains ₹500.000 (Invoice Override ₹450 isolated!)
✓ Inventory Isolation OK
=== ALL TESTS PASSED SUCCESSFULLY! ===
```

---

## 8. Frontend Production Build Verification

Run the production build:
```bash
cd frontend && npm run build
```

**Expected Output**:
```text
✓ built in 35.79s
dist/assets/Invoices-CcR4lsfi.js
```

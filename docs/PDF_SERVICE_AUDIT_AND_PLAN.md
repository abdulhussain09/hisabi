# HISABI POS — Audit Report & Implementation Plan: Updating `pdfService.js` to Match Approved Invoice Designs

---

## 1. Executive Summary & Objective

The Hisabi POS frontend preview displays the approved modern, country-specific invoice designs for **India (GST)**, **UAE (VAT)**, and **Kuwait (Commercial)**. However, the backend PDF generation service in [`pdfService.js`](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js) still contains legacy drawing routines that cause downloaded PDFs to render with an outdated, unstyled layout whenever PDFKit executes.

This document details the complete audit of the existing PDF pipeline and outlines the exact implementation plan to refactor [`pdfService.js`](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js) to achieve 100% visual parity with the approved reference previews.

---

## 2. Audit of Existing Implementation

### A. Core File Locations & Data Flow
* **Backend PDF Service**: [`backend/src/services/pdfService.js`](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js)
* **API Controller**: [`backend/src/controllers/invoiceController.js`](file:///home/abdul/Documents/Hisabi/backend/src/controllers/invoiceController.js) (`downloadInvoicePDF` at lines 663–697)
* **API Route**: `GET /api/invoices/:id/pdf` (in [`backend/src/routes/invoiceRoutes.js`](file:///home/abdul/Documents/Hisabi/backend/src/routes/invoiceRoutes.js))
* **Authoritative Calculation Engine**: [`backend/src/utils/invoiceCalculationEngine.js`](file:///home/abdul/Documents/Hisabi/backend/src/utils/invoiceCalculationEngine.js)
* **Approved Reference Preview Layouts**:
  * **India (`IN`)**: [`frontend/src/components/invoice/IndiaInvoiceLayout.jsx`](file:///home/abdul/Documents/Hisabi/frontend/src/components/invoice/IndiaInvoiceLayout.jsx) (Reference: `media_1791405445992.png`)
  * **UAE (`AE`)**: [`frontend/src/components/invoice/UAEInvoiceLayout.jsx`](file:///home/abdul/Documents/Hisabi/frontend/src/components/invoice/UAEInvoiceLayout.jsx) (Reference: `media_1791405446877.png`)
  * **Kuwait (`KW`)**: [`frontend/src/components/invoice/KuwaitInvoiceLayout.jsx`](file:///home/abdul/Documents/Hisabi/frontend/src/components/invoice/KuwaitInvoiceLayout.jsx) (Reference: `media_1791405447298.png`)

---

### B. Identified Outdated Code & Sections in `pdfService.js`

Inspecting [`pdfService.js`](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js) lines 132–815 (`generateInvoicePDFKit`) reveals the following outdated components:

| Section in `pdfService.js` | Lines | Issues Identified |
|---|---|---|
| **Header & Brand Icon** | 202–220 | Hardcodes a generic blue box with an `'H'` and `'Hisabi'` text instead of rendering the store's `brand_logo` or `seller_name_snapshot`. Hardcodes static tagline (`Smart Billing | Inventory | Business Growth`). Missing country skyline illustrations (Burj Khalifa for UAE, Kuwait Towers for Kuwait). |
| **Tax ID & Title Position** | 242–269 | Centers the Tax ID with hardcoded pixel coordinates. Lacks the bilingual Arabic/English title badges and Kuwait's `Simpler. Smarter. Together.` subtitle. |
| **Metadata Cards** | 270–287 | Uses plain text vertical key-value lines instead of the approved rounded cards (UAE's 3 pill cards: `Invoice No`, `Issue Date`, `Supply Date`; Kuwait's 4 rounded cards: `Invoice No`, `Date`, `Time`, `Payment Method`; India's light-blue card). |
| **Unwanted "Supply To" Section** | 366–390 | **Explicitly draws an obsolete `"SUPPLY TO / جهة التوريد"` and `"Delivery Address"` card** for UAE and Kuwait, which violates the approved preview specifications. |
| **Items Table** | 395–538 | Hardcoded table coordinates with outdated column widths. Lacks bilingual headers for UAE and Kuwait. Kuwait table incorrectly assumes 2 decimal places instead of standard **3 decimal places for KWD**. |
| **Totals & Tax Summary** | 541–640 | Uses an attached container box with fixed height rather than the clean modern two-column grid. Missing bilingual amount in words for UAE and Kuwait. India GST tax breakdown lacks the clean separate summary table. |
| **Payment Status & Badges** | 588–600, 663–679 | Uses plain colored text instead of the approved rounded status pill badges (`PAID` / `PARTIAL`). |
| **QR Code Generation** | 186–195, 719–737 | Uses `createQRMatrix` + `matrixToBMPBuffer` to render a 1-bit low-res BMP buffer. Often fails or renders pixelated. Missing official UPI logo and KNET / VISA / Mastercard card badges. |
| **Footer & Signatures** | 760–805 | Uses a simple hairline stroke with small plain text (`Powered by Hisabi POS`) instead of the approved deep-navy footer bar with brand accent and website URL. |

---

## 3. Implementation Plan for `pdfService.js`

### A. Architecture Overview
We will refactor [`pdfService.js`](file:///home/abdul/Documents/Hisabi/backend/src/services/pdfService.js) into a clean, modular structure:
1. **Master PDF Orchestrator** (`generateInvoicePDF`): Manages document setup, margins, page dimensions (A4: 595.28 x 841.89 pt), and delegates to country-specific drawing modules.
2. **Dynamic Data & Calculation Extraction**: Resolves all snapshots (`seller_name_snapshot`, `seller_address_snapshot`, `seller_tax_id_snapshot`, `buyer_tax_id`, items, bank details, UPI ID) and invokes [`calculateInvoice`](file:///home/abdul/Documents/Hisabi/backend/src/utils/invoiceCalculationEngine.js) for mathematical consistency.
3. **Country-Specific Layout Renderers**:
   * `drawIndiaInvoice(doc, invoice, shop, calculation, qrBuffer)`
   * `drawUAEInvoice(doc, invoice, shop, calculation, qrBuffer)`
   * `drawKuwaitInvoice(doc, invoice, shop, calculation, qrBuffer)`

---

### B. Detailed Country Layout Specifications

#### 1. India (`IN`) — GST Tax Invoice
* **Header**:
  * Left: Store logo (or initials avatar) + Store Name + Address + Phone + Email.
  * Center: Bordered GSTIN card (`GSTIN NO: [XXXXXXXXXXXX]`).
  * Right: Deep navy `TAX INVOICE` heading with `(GST INVOICE)` subtext + light-blue rounded metadata box containing `Invoice No.`, `Date`, `Time`, and `Payment Method`.
* **Bill To**: Full-width rounded card containing Customer Name, Phone, Email, Address, and Customer GSTIN.
* **Items Table**: 12 columns: `S.No`, `HSN/SAC`, `Description of Goods / Services`, `Qty/Unit`, `MRP`, `Rate`, `Disc`, `Taxable Value`, `GST%`, `CGST`, `SGST`, `Total`.
* **Totals & Tax Summary**:
  * Left: GST Tax Summary table (`Taxable Value`, `CGST`, `SGST`, `IGST`, `Total Tax`).
  * Right: Summary card (`Subtotal`, `Discount`, `Round Off`, and solid navy `GRAND TOTAL ₹`).
* **Amount in Words & Payment**: Two-column row with Amount in Words (`INR ... Only`) and Payment Status badge (`PAID` / `PARTIAL`).
* **Bank & QR Cards**: 3 cards — Bank Details (`Bank Name`, `A/C No.`, `Branch & IFSC`), UPI Payment (`Scan to Pay via UPI` with crisp QR code and UPI badge), and Contact details.
* **Signatures & Footer**: Declaration text, Customer's Seal & Signature line, Authorised Signatory line, and modern blue wave footer bar (`Thank you for your business! Powered by Hisabi`).

#### 2. UAE (`AE`) — Bilingual Tax Invoice (فاتورة ضريبية)
* **Header**:
  * Left: Store logo/name + Address + Phone.
  * Right: Dubai skyline vector illustration (Burj Khalifa silhouette) in light blue.
  * Sub-header: `TAX INVOICE | فاتورة ضريبية` title with TRN on left; 3 rounded pill cards on right: `INVOICE NO.` (`رقم الفاتورة`), `ISSUE DATE` (`تاريخ الإصدار`), `SUPPLY DATE` (`تاريخ التوريد`).
* **Bill To**: Full-width bilingual card: `BILL TO / المشتري` with Customer Name, Phone, Email, Address, and TRN. **No unwanted Supply To section.**
* **Items Table**: 10 bilingual columns: `#`, `Item Description / وصف المنتج`, `Qty / الكمية`, `Unit Price / سعر الوحدة`, `Discount / الخصم`, `Taxable Amount / المبلغ الخاضع للضريبة`, `Net Amount / المبلغ الصافي`, `VAT Rate / نسبة الضريبة`, `VAT Amount / مبلغ الضريبة`, `Gross Amount / المبلغ الإجمالي`.
* **Totals & Summary**:
  * Left: Bilingual Amount in Words (`AED ... Only` / Arabic translation).
  * Right: Subtotal, VAT Total, and solid navy `GRAND TOTAL (AED)` box.
* **Payment Strip**: 4 rounded pill badges: Payment Method (`CASH / نقداً`), Payment Status (`PAID / مدفوع`), Payment Date & Time, Paid Amount.
* **Bottom Cards**: 3 cards — Bank Details (`تفاصيل الحساب البنكي`), QR Code (`Scan to Pay`), Contact Us.
* **Footer**: Reverse Charge disclaimer pill (`Reverse Charge / Special Tax Treatment`), Declaration, Signatures, and navy footer bar.

#### 3. Kuwait (`KW`) — Commercial Invoice
* **Header**:
  * Left: Store logo/name + Address + Phone with clean vertical separator.
  * Center-Right: Kuwait skyline vector illustration in light blue.
  * Right: `فاتورة ضريبية` / `TAX INVOICE` / `Simpler. Smarter. Together.`
  * Metadata: Row of 4 cards: `Invoice No.` (`رقم الفاتورة`), `Date` (`التاريخ`), `Time` (`الوقت`), `Payment Method` (`طريقة الدفع`).
* **Bill To**: Full-width bilingual card: `BILL TO / العميل` with Customer Name, Phone, Email, Address.
* **Items Table**: 6 clean columns: `#`, `Item Description / وصف الصنف`, `Qty / الكمية`, `Unit Price / سعر الوحدة`, `Discount / الخصم`, `Amount / المبلغ (KWD)`. **All numbers strictly formatted to 3 decimal places.**
* **Totals & Summary**:
  * Left: Payment Status badge with Paid Date/Time.
  * Right: Subtotal (`المجموع الفرعي`), Total (`الإجمالي`), Paid Amount (`المبلغ المدفوع`).
* **Amount in Words**: Bilingual English and Arabic (`KWD ... Only` / Arabic words).
* **Bottom Cards**: 3 cards — Bank Details, Scan to Pay with KNET / VISA / Mastercard badges, Tax / Commercial Registration Details (`CR No.`, `Tax Registration No.`, `VAT: Not Applicable`).
* **Footer**: Bilingual Notes & Declaration, Signatures, and Kuwait footer bar.

---

## 4. QR Code Generation & Payment Config Fix

1. **Payload Generation**:
   * **India**: If `shop.upi_id` or `invoice.upi_id` is present, construct: `upi://pay?pa=${upiId}&pn=${encodeURIComponent(sellerName)}&am=${grand_total}&cu=INR`. If `invoice.qr_code_data` exists, use it directly.
   * **UAE**: Encode ZATCA-compliant TLV base64 payload containing Seller Name, TRN, Timestamp, Grand Total, and VAT Total, or the official verification URL.
   * **Kuwait**: Encode verification URL or payment link.
2. **Buffer Creation**:
   * Replace the legacy 1-bit BMP generator with `qrcode.toBuffer(qrPayload, { width: 160, margin: 1, errorCorrectionLevel: 'M' })`.
   * Embed high-resolution PNG buffer cleanly within the QR card using `doc.image(qrBuffer, x, y, { width, height })`.
   * If QR data is unconfigured, draw the clean dashed placeholder box matching the preview.

---

## 5. Data Correctness & Invariant Guarantees

* **Read-Only Operation**: PDF generation is strictly a read operation. It will never invoke Sequelize `.save()`, `.update()`, or `.destroy()`, ensuring customer, inventory, and order records remain completely untouched.
* **Snapshot Integrity**: The PDF must exclusively use saved item snapshots (`item_name`, `unit_price`, `quantity`, `discount`, `taxable_amount`, `tax_rate`, `line_total`) to prevent price drift from future catalog changes.
* **Authoritative Calculations**: Totals are processed exclusively through [`calculateInvoice`](file:///home/abdul/Documents/Hisabi/backend/src/utils/invoiceCalculationEngine.js) to guarantee 100% mathematical consistency across web preview, print, and PDF.

---

## 6. Multi-Page Pagination & Layout Spacing

* Standard margins: Top 25pt, Bottom 25pt, Left 30pt, Right 30pt.
* Table pagination check: If `rowY + rowHeight > maxTableY`, trigger `doc.addPage()` and redraw the table column header row automatically before printing subsequent line items.
* Footer positioning: Header and footer elements remain anchored to preserve clean A4 visual margins without causing unintended blank overflow pages.

---

## 7. Verification & Acceptance Criteria Checklist

### Test Plan:
1. Run automated test script generating PDFs for all three countries: India, UAE, and Kuwait.
2. Convert generated PDF pages to PNG using `pdftoppm -png -r 150` and perform visual comparison against the approved reference images (`media_1791405445992.png`, `media_1791405446877.png`, `media_1791405447298.png`).
3. Verify live endpoint `GET /api/invoices/:id/pdf` with an authenticated request.

### Acceptance Criteria:
- [ ] Downloaded India PDF matches the approved India preview.
- [ ] Downloaded UAE/Dubai PDF matches the approved UAE preview.
- [ ] Downloaded Kuwait PDF matches the approved Kuwait preview.
- [ ] QR code renders crisp and clean when configured.
- [ ] Obsolete PDF layout (hardcoded "H" icon, plain divider footer) is eliminated.
- [ ] Totals, taxes, prices, and customer details match the selected invoice.
- [ ] No unwanted Ship/Supply To section appears.
- [ ] Alignment, spacing, pagination, and footer are correct.
- [ ] Existing invoice creation, editing, and preview remain fully functional.
- [ ] No inventory or customer data is modified.

---
*Awaiting user approval before proceeding to implementation.*

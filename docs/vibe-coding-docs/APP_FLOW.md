# App Flow Document (APP_FLOW.md) — Hisabi POS

## 1. Primary User Journey

```
Login Screen
     ↓
POS Terminal (/pos) ──► Scan / Search Products ──► Add to Cart
     ↓
Select / Enter Customer Details (Optional)
     ↓
Apply Item / Global Discounts
     ↓
Choose Payment Method (Cash / Card / UPI / KNet)
     ↓
Complete Checkout ──► Auto-generate Idempotency Key ──► Deduct Inventory
     ↓
Invoice Success State ──► View Live A4 Document ──► Print Receipt / Download PDF
     ↓
Manage Invoices (/invoices) ──► View / Edit Invoice ──► Audit Revision Saved
```

---

## 2. Screen Details

### A. Login & Authentication (`/login`)
- **Purpose**: Authenticate staff or shop administrator into their isolated tenant account.
- **Inputs**: Username, Password.
- **Primary Action**: "Sign In"
- **Secondary Action**: "Demo Login"
- **System Response**: Validates credentials via `POST /api/auth/login`, stores JWT token in `localStorage`, loads shop configuration (`country`, `currency`, `plan`), and redirects to `/pos`.
- **Errors**: Invalid credentials, inactive account, server error.

---

### B. POS Terminal Screen (`/pos`)
- **Purpose**: High-speed cashier billing interface for processing retail sales.
- **Left/Center Area**:
  - Search bar (by item name, SKU, or barcode scan).
  - Category filter tabs (`All Categories`, `Beverages`, `Services`, etc.).
  - Product Grid with stock indicators, selling price, and MRP (India).
- **Right Area (Cart Manager)**:
  - Line items list with quantity increment/decrement, price override, and delete button.
  - Customer selection dropdown / Walk-in customer inputs (Name, Phone, Email, Address, Tax ID).
  - Discount code input field.
  - Subtotal, Tax breakdown, and **Grand Total** display.
  - Payment method selector (`Cash`, `Card`, `UPI`, `KNet`).
  - Paid Amount input with quick exact-pay buttons.
- **Primary Action**: "Complete Sale" / `POST /api/invoices`
- **Offline Fallback**: If network fails, queues transaction into `offlineStore` and generates `OFF-XXXXXX` receipt until reconnection.

---

### C. Invoices Management Screen (`/invoices`)
- **Purpose**: View, search, edit, print, and audit past sales invoices.
- **Search & Filters**: Search by Invoice Number or Customer Name; pagination controls.
- **Invoice Table Row Actions**:
  - `Eye` icon: Opens **View A4 Invoice Modal** (`InvoiceRenderer.jsx`) with instant "Print Document" button.
  - `Edit3` icon: Opens **Interactive Live Invoice Editor** (`InvoiceEditor.jsx`).
  - `Download` icon: Streams PDFKit binary download (`GET /api/invoices/:id/pdf`).
  - `Trash2` icon (Admin only): Voids invoice and restores stock via `StockAdjustment` log.
- **Row Expansion**: Clicking accordion arrow reveals item breakdown, tax totals, and customer details.

---

### D. Interactive Live Invoice Editor (`InvoiceEditor.jsx`)
- **Purpose**: Allow staff to edit prices, quantities, customer details, HSN/SAC codes, discounts, and payment methods after invoice creation.
- **Desktop Layout**:
  - **Left Column (Editor Controls)**:
    - Customer Info form with toggle `[ ] Save updates to Customer Directory`.
    - Line Items editor with `+ Add Custom Item` button, quantity/price inputs, price override badges (`Invoice Price: ₹450 | Master Price: ₹500`).
    - Global discount & Paid amount controls.
  - **Right Column (Live Preview)**:
    - Real-time A4 document preview updated instantly via `calculateInvoice` calculation engine.
- **Mobile Layout**: Tabbed toggle button `[ Edit ] | [ Preview ]`.
- **Primary Action**: "Save Invoice Changes" (`PUT /api/invoices/:id` with `expected_version`).

---

### E. Account & Shop Settings (`/profile`)
- **Purpose**: Manage shop profile, country settings, currency, and brand identity.
- **Inputs**: Business Name, Phone, Email, Physical Address, TRN / GSTIN / CR Number, Brand Logo upload, Brand Primary Color picker.
- **Primary Action**: "Update Profile" (`PUT /api/auth/profile`).

---

## 3. Secondary Flows

### Return & Credit Note Flow (`/returns`)
- Staff selects invoice -> selects items to return -> calculates refund -> updates invoice status -> restores inventory stock.

### Due Collection Flow (`/due-collection`)
- View invoices with `due_amount > 0` -> record partial/full installment payment -> generate `Due Payment Receipt` PDF.

### End of Day Settlement (`/end-of-day`)
- Cashier reviews total daily cash, card, UPI, and KNet collections -> prints register closure summary.

---

## 4. Important State Lifecycle Matrix

| Invoice Lifecycle State | Stock Impact | Editable? | Payment State Machine |
| :--- | :--- | :--- | :--- |
| **`draft`** | No stock change | Fully editable | `pending` |
| **`generated`** | Stock reserved | Editable | `pending` / `partial` / `paid` |
| **`finalized`** | Stock deducted (`StockAdjustment`) | Controlled edit | `pending` / `partial` / `paid` |
| **`revised`** | Stock delta applied | Controlled edit | `pending` / `partial` / `paid` |
| **`voided`** | Stock restored | Read-only | `void` |

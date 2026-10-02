const { createQRMatrix } = require('../utils/qrGenerator');
const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
const { getCountryConfig, resolveIndianState } = require('../config/countryConfig');

// ─── Pure SVG QR Generator ──────────────────────────────────────────────────
function matrixToSVG(matrix, margin = 2) {
    if (!matrix || !matrix.length) return '';
    const size = matrix.length;
    const totalSize = size + margin * 2;
    let path = '';
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                path += `M${c + margin} ${r + margin}h1v1h-1z `;
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges" style="width:100%;height:100%;"><path d="${path}" fill="#0f172a"/></svg>`;
}

function getQRCodeSVG(text) {
    try {
        const matrix = createQRMatrix(text);
        return matrixToSVG(matrix);
    } catch (e) {
        return '';
    }
}

// ─── Inline Skyline SVGs ───────────────────────────────────────────────────
const DUBAI_SKYLINE_SVG = `<svg viewBox="0 0 200 65" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:55px;color:#38bdf8;opacity:0.85;">
    <path d="M98 65V45L99 30L99.5 15L100 2L100.5 15L101 30L102 45V65" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <line x1="97" y1="48" x2="103" y2="48" stroke="currentColor" stroke-width="1" />
    <line x1="98" y1="35" x2="102" y2="35" stroke="currentColor" stroke-width="1" />
    <line x1="99" y1="20" x2="101" y2="20" stroke="currentColor" stroke-width="1" />
    <line x1="100" y1="2" x2="100" y2="0" stroke="currentColor" stroke-width="1.2" />
    <path d="M30 65V35C30 35 34 25 45 25C54 25 57 33 57 65" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.12" />
    <line x1="43" y1="25" x2="43" y2="65" stroke="currentColor" stroke-width="1.2" />
    <line x1="30" y1="42" x2="57" y2="42" stroke="currentColor" stroke-width="1" stroke-opacity="0.6" />
    <path d="M140 65V26L148 18L156 26V65" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15" />
    <path d="M162 65V32L168 25L174 32V65" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15" />
    <rect x="10" y="48" width="14" height="17" rx="1" fill="currentColor" fill-opacity="0.15" />
    <rect x="65" y="40" width="12" height="25" rx="1" fill="currentColor" fill-opacity="0.18" />
    <rect x="80" y="32" width="12" height="33" rx="1" fill="currentColor" fill-opacity="0.22" />
    <rect x="106" y="36" width="14" height="29" rx="1" fill="currentColor" fill-opacity="0.2" />
    <rect x="124" y="44" width="12" height="21" rx="1" fill="currentColor" fill-opacity="0.15" />
    <rect x="180" y="42" width="14" height="23" rx="1" fill="currentColor" fill-opacity="0.15" />
    <line x1="0" y1="64.5" x2="200" y2="64.5" stroke="currentColor" stroke-width="1" stroke-opacity="0.5" />
</svg>`;

const KUWAIT_SKYLINE_SVG = `<svg viewBox="0 0 200 65" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:180px;height:55px;color:#38bdf8;opacity:0.85;">
    <path d="M125 65V35L124 10L125 5L126 10L125 35V65" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    <ellipse cx="125" cy="38" rx="8" ry="7" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.2" />
    <ellipse cx="125" cy="22" rx="5" ry="4.5" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.2" />
    <path d="M125 5V0" stroke="currentColor" stroke-width="1.2" />
    <path d="M142 65V42L141.5 25L142 20L142.5 25L142 42V65" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
    <ellipse cx="142" cy="40" rx="6" ry="5" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.2" />
    <path d="M142 20V15" stroke="currentColor" stroke-width="1" />
    <path d="M110 65V46L110.5 35L110 30L109.5 35L110 46V65" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
    <path d="M60 65V30L58 28H62L60 30V65" stroke="currentColor" stroke-width="1.2" />
    <path d="M57 38H63" stroke="currentColor" stroke-width="1.5" />
    <path d="M55 45H65" stroke="currentColor" stroke-width="1.5" />
    <path d="M60 28V12L59.5 8L60 6L60.5 8L60 12" stroke="currentColor" stroke-width="1.2" />
    <rect x="15" y="42" width="12" height="23" rx="1" fill="currentColor" fill-opacity="0.15" />
    <rect x="30" y="36" width="10" height="29" rx="1" fill="currentColor" fill-opacity="0.2" />
    <rect x="42" y="48" width="10" height="17" rx="1" fill="currentColor" fill-opacity="0.15" />
    <rect x="70" y="40" width="14" height="25" rx="1" fill="currentColor" fill-opacity="0.2" />
    <rect x="88" y="45" width="12" height="20" rx="1" fill="currentColor" fill-opacity="0.15" />
    <rect x="155" y="44" width="14" height="21" rx="1" fill="currentColor" fill-opacity="0.2" />
    <rect x="173" y="38" width="16" height="27" rx="1" fill="currentColor" fill-opacity="0.15" />
    <line x1="0" y1="64.5" x2="200" y2="64.5" stroke="currentColor" stroke-width="1" stroke-opacity="0.5" />
</svg>`;

// ─── Inline Lucide Icon SVGs ───────────────────────────────────────────────
const ICONS = {
    user: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    mapPin: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    building: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M14 10v11M12 2 2 7h20z"/></svg>`,
    shieldCheck: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    checkCircle2: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    phone: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    globe: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg>`,
    creditCard: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`,
    calendar: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>`,
    clock: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    truck: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
    fileText: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    info: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`
};

// ─── Shared Base CSS ────────────────────────────────────────────────────────
const BASE_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cairo:wght@400;600;700;800;900&display=swap");

@page {
    size: A4 portrait;
    margin: 0;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    font-size: 10px;
    line-height: 1.35;
}

.font-arabic {
    font-family: "Cairo", "Traditional Arabic", Tahoma, sans-serif;
}

.invoice-page {
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 24px 28px 18px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
}

.content-top {
    flex: 1;
}

/* Common Header */
.header-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 14px;
    border-bottom: 1px solid #e2e8f0;
}

.brand-section {
    max-width: 44%;
}

.brand-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.brand-logo {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #0ea5e9;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 900;
}

.brand-title {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
    line-height: 1;
}

.brand-tagline {
    font-size: 8.5px;
    color: #64748b;
    font-weight: 500;
    margin-top: 1px;
}

.shop-details {
    margin-top: 6px;
    font-size: 9px;
    color: #475569;
    line-height: 1.4;
}

.shop-name {
    font-weight: 700;
    font-size: 10.5px;
    color: #0f172a;
}

.card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 9px 11px;
}

.card-title {
    font-size: 9px;
    font-weight: 900;
    color: #024282;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
}

.card-name {
    font-size: 11px;
    font-weight: 900;
    color: #0f172a;
}

.card-info {
    font-size: 9px;
    color: #475569;
    margin-top: 3px;
    line-height: 1.4;
}

/* Items Table */
.table-container {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

table.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
}

table.items-table thead {
    background: #024282;
    color: #ffffff;
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

table.items-table thead th {
    padding: 6px 5px;
    border-right: 1px solid #1a5b9e;
}

table.items-table thead th:last-child {
    border-right: none;
}

table.items-table tbody td {
    padding: 5px;
    border-bottom: 1px solid #f1f5f9;
    border-right: 1px solid #f1f5f9;
    color: #1e293b;
}

table.items-table tbody td:last-child {
    border-right: none;
}

table.items-table tbody tr:nth-child(even) {
    background: #f8fafc;
}

/* Connected Bottom Bar */
.table-bottom-bar {
    display: grid;
    grid-template-columns: 7fr 5fr;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
}

.grand-total-bar {
    background: #024282;
    color: #ffffff;
    padding: 7px 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.grand-total-label {
    font-size: 9.5px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.grand-total-value {
    font-size: 13px;
    font-weight: 900;
}

.status-badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
}

.status-paid {
    background: #dcfce7;
    color: #15803d;
}

.status-partial {
    background: #fef3c7;
    color: #b45309;
}

/* Footer */
.footer-bar {
    padding-top: 7px;
    border-top: 1px solid #f1f5f9;
    text-align: center;
    font-size: 8.5px;
    color: #94a3b8;
}
`;

// ═════════════════════════════════════════════════════════════════════════════
// 1. INDIA GST TAX INVOICE HTML GENERATOR
// ═════════════════════════════════════════════════════════════════════════════

function generateIndiaInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'INR';

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || '';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const sellerLogo = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const gstin = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXXXX]';
    const financeCompany = invoice.finance_company || null;

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';

    const resolvedPlace = resolveIndianState(invoice.place_of_supply_state, invoice.place_of_supply_code);
    const placeState = resolvedPlace.state || '—';
    const placeCode = resolvedPlace.code || '—';
    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});

    const qrData = invoice.qr_code_data || `upi://pay?pa=${shop?.upi_id || 'billing@hisabi'}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`;
    const qrSvg = getQRCodeSVG(qrData);

    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const isPaid = (totals.due_amount || 0) <= 0;

    const rowsHtml = items.map((item, idx) => `
        <tr style="${idx % 2 === 1 ? 'background:#f8fafc;' : ''}">
            <td style="text-align:center;color:#94a3b8;font-weight:700;">${idx + 1}</td>
            <td style="text-align:center;color:#64748b;font-family:monospace;">${item.hsn_sac || '—'}</td>
            <td>
                <b>${item.item_name}</b>
                ${item.item_description ? `<div style="font-size:8px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="text-align:center;">${item.quantity} / ${item.unit || 'PCS'}</td>
            <td style="text-align:right;color:#64748b;">${item.mrp ? parseFloat(item.mrp).toFixed(2) : '—'}</td>
            <td style="text-align:right;">${parseFloat(item.unit_price).toFixed(2)}</td>
            <td style="text-align:right;color:#64748b;">${parseFloat(item.discount || 0).toFixed(2)}</td>
            <td style="text-align:right;font-weight:700;">${parseFloat(item.taxable_amount).toFixed(2)}</td>
            <td style="text-align:center;color:#64748b;">${item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—'}</td>
            <td style="text-align:right;color:#64748b;">${item.cgst_amount > 0 ? parseFloat(item.cgst_amount).toFixed(2) : '—'}</td>
            <td style="text-align:right;color:#64748b;">${item.sgst_amount > 0 ? parseFloat(item.sgst_amount).toFixed(2) : '—'}</td>
            <td style="text-align:right;font-weight:900;">${parseFloat(item.line_total).toFixed(2)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tax Invoice #${String(invoice.invoice_number || '1').padStart(4, '0')}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="invoice-page">
    <div class="content-top">
        <!-- ═══════ HEADER ═══════ -->
        <div class="header-row">
            <div class="brand-section">
                <div class="brand-badge">
                    ${sellerLogo
                        ? `<img src="${sellerLogo}" alt="${sellerName} logo" style="width:40px;height:40px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;"/>`
                        : `<div class="brand-logo" style="background:#024282;font-size:18px;">${sellerName.charAt(0).toUpperCase()}</div>`
                    }
                    <div>
                        <div class="brand-title" style="font-size:16px;">${sellerName}</div>
                    </div>
                </div>
                <div class="shop-details">
                    ${sellerAddress ? `<div>${sellerAddress}</div>` : ''}
                    ${sellerPhone ? `<div>${ICONS.phone}&nbsp;${sellerPhone}</div>` : ''}
                    ${sellerEmail ? `<div>${ICONS.mail}&nbsp;${sellerEmail}</div>` : ''}
                </div>
            </div>

            <div style="text-align:center;padding-top:6px;">
                <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">GSTIN</div>
                <div style="font-size:11.5px;font-weight:800;color:#1e293b;letter-spacing:0.5px;margin-top:2px;">GSTIN NO: ${gstin}</div>
            </div>

            <div style="text-align:right;">
                <div style="font-size:20px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;line-height:1;">TAX INVOICE</div>
                <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-top:2px;">(GST INVOICE)</div>
                <table style="margin-top:8px;font-size:10px;color:#334155;margin-left:auto;">
                    <tr><td style="color:#94a3b8;text-align:right;padding-right:8px;">Invoice No. :</td><td style="font-weight:700;color:#0f172a;text-align:left;width:95px;">#${String(invoice.invoice_number || '1').padStart(4, '0')}</td></tr>
                    <tr><td style="color:#94a3b8;text-align:right;padding-right:8px;">Date :</td><td style="font-weight:700;color:#0f172a;text-align:left;">${dateStr}</td></tr>
                    <tr><td style="color:#94a3b8;text-align:right;padding-right:8px;">Time :</td><td style="font-weight:700;color:#0f172a;text-align:left;">${timeStr}</td></tr>
                    <tr><td style="color:#94a3b8;text-align:right;padding-right:8px;">Payment :</td><td style="font-weight:700;color:#0f172a;text-align:left;">${paymentMethod}</td></tr>
                    ${financeCompany ? `<tr><td style="color:#94a3b8;text-align:right;padding-right:8px;">Finance Co. :</td><td style="font-weight:700;color:#0f172a;text-align:left;">${financeCompany}</td></tr>` : ''}
                </table>
            </div>
        </div>

        <!-- ═══════ 2 CARDS ROW (BILL TO & PLACE OF SUPPLY) ═══════ -->
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin:12px 0;">
            <div class="card">
                <div class="card-title">
                    ${ICONS.user}
                    <span>BILL TO</span>
                </div>
                <div class="card-name">${customerName}</div>
                <div class="card-info">
                    ${customerPhone ? `<div><span style="color:#94a3b8;">Phone :</span> ${customerPhone}</div>` : ''}
                    ${customerEmail ? `<div><span style="color:#94a3b8;">Email :</span> ${customerEmail}</div>` : ''}
                    ${customerAddress ? `<div><span style="color:#94a3b8;">Address :</span> ${customerAddress}</div>` : ''}
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    ${ICONS.truck}
                    <span>SHIP / SUPPLY TO</span>
                </div>
                <div class="card-info" style="margin-top:4px;line-height:1.6;">
                    ${customerAddress
                        ? `<div style="font-weight:700;color:#0f172a;font-size:10px;">${customerName}</div>
                           <div>${customerAddress}</div>`
                        : `<div style="color:#94a3b8;">Same as billing address</div>`
                    }
                    <div style="margin-top:4px;padding-top:4px;border-top:1px dashed #e2e8f0;">
                        <span style="color:#94a3b8;">State :</span> <b>${placeState}</b>
                        &nbsp;&nbsp;
                        <span style="color:#94a3b8;">Code :</span> <b>${placeCode}</b>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ ITEMS TABLE + CONNECTED TOTALS ═══════ -->
        <div class="table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width:26px;text-align:center;">S.No.</th>
                        <th style="width:52px;text-align:center;">HSN/SAC</th>
                        <th style="text-align:left;">Description of Goods / Services</th>
                        <th style="width:56px;text-align:center;">Qty / Unit</th>
                        <th style="width:52px;text-align:right;">MRP (₹)</th>
                        <th style="width:52px;text-align:right;">Rate (₹)</th>
                        <th style="width:48px;text-align:right;">Disc (₹)</th>
                        <th style="width:58px;text-align:right;">Taxable (₹)</th>
                        <th style="width:42px;text-align:center;">GST %</th>
                        <th style="width:46px;text-align:right;">CGST (₹)</th>
                        <th style="width:46px;text-align:right;">SGST (₹)</th>
                        <th style="width:58px;text-align:right;">Total (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Connected Totals Block (0 GAP) -->
            <div class="table-bottom-bar">
                <div style="padding:8px 10px;border-right:1px solid #e2e8f0;">
                    <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">GST TAX SUMMARY</div>
                    <table style="width:100%;border-collapse:collapse;font-size:8.5px;">
                        <thead>
                            <tr style="color:#64748b;font-weight:700;text-transform:uppercase;">
                                <th style="text-align:left;padding:2px 4px;border-bottom:1px solid #e2e8f0;">Taxable (₹)</th>
                                <th style="text-align:right;padding:2px 4px;border-bottom:1px solid #e2e8f0;">CGST (₹)</th>
                                <th style="text-align:right;padding:2px 4px;border-bottom:1px solid #e2e8f0;">SGST (₹)</th>
                                <th style="text-align:right;padding:2px 4px;border-bottom:1px solid #e2e8f0;">IGST (₹)</th>
                                <th style="text-align:right;padding:2px 4px;border-bottom:1px solid #e2e8f0;">Total Tax (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="font-weight:700;">
                                <td style="text-align:left;padding:4px;">${parseFloat(totals.taxable_total).toFixed(2)}</td>
                                <td style="text-align:right;padding:4px;">${parseFloat(totals.cgst_total).toFixed(2)}</td>
                                <td style="text-align:right;padding:4px;">${parseFloat(totals.sgst_total).toFixed(2)}</td>
                                <td style="text-align:right;padding:4px;">${parseFloat(totals.igst_total).toFixed(2)}</td>
                                <td style="text-align:right;padding:4px;color:#024282;font-weight:900;">${parseFloat(totals.tax_total).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display:flex;flex-direction:column;justify-content:space-between;">
                    <div style="padding:8px 10px;font-size:9.5px;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:3px;color:#475569;">
                            <span>Subtotal</span>
                            <span style="font-weight:700;color:#0f172a;">₹ ${parseFloat(totals.gross_subtotal).toFixed(2)}</span>
                        </div>
                        ${parseFloat(totals.global_discount) > 0 ? `
                        <div style="display:flex;justify-content:space-between;margin-bottom:3px;color:#475569;">
                            <span>Discount</span>
                            <span style="color:#dc2626;font-weight:700;">− ₹ ${parseFloat(totals.global_discount).toFixed(2)}</span>
                        </div>` : ''}
                        ${parseFloat(totals.round_off) !== 0 ? `
                        <div style="display:flex;justify-content:space-between;margin-bottom:3px;color:#475569;">
                            <span>Round Off</span>
                            <span style="font-weight:700;color:#0f172a;">₹ ${parseFloat(totals.round_off).toFixed(2)}</span>
                        </div>` : ''}
                    </div>
                    <div class="grand-total-bar">
                        <span class="grand-total-label">Grand Total</span>
                        <span class="grand-total-value">₹ ${parseFloat(totals.grand_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ AMOUNT IN WORDS & PAYMENT STATUS ═══════ -->
        <div style="display:grid;grid-template-columns:7fr 5fr;gap:12px;margin-bottom:10px;">
            <div class="card" style="display:flex;align-items:center;gap:10px;">
                <div style="color:#94a3b8;">${ICONS.user}</div>
                <div>
                    <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Amount in Words</div>
                    <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:1px;">${totals.amount_in_words}</div>
                </div>
            </div>

            <div class="card" style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="color:${isPaid ? '#16a34a' : '#d97706'};">${ICONS.checkCircle2}</div>
                    <div>
                        <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Payment Status</div>
                        <span class="status-badge ${isPaid ? 'status-paid' : 'status-partial'}">${isPaid ? 'PAID' : 'PARTIAL'}</span>
                    </div>
                </div>
                <div style="text-align:right;font-size:9.5px;">
                    <div><span style="color:#94a3b8;">Paid Amount :</span> <b>₹ ${parseFloat(totals.paid_amount).toFixed(2)}</b></div>
                    <div style="margin-top:2px;"><span style="color:#94a3b8;">Balance Due :</span> <b style="color:${isPaid ? '#16a34a' : '#dc2626'};">₹ ${parseFloat(totals.due_amount).toFixed(2)}</b></div>
                </div>
            </div>
        </div>

        <!-- ═══════ 3 INFO CARDS: BANK, UPI, CONTACT ═══════ -->
        <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:12px;margin-bottom:10px;">
            <div class="card">
                <div class="card-title" style="border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px;">
                    ${ICONS.building}
                    <span>BANK DETAILS</span>
                </div>
                <div class="card-info">
                    <div><span style="color:#94a3b8;">Bank Name :</span> <b>${bank.bank_name || '[BANK NAME]'}</b></div>
                    <div><span style="color:#94a3b8;">A/c No. :</span> <b style="font-family:monospace;">${bank.account_number || '[ACCOUNT NO.]'}</b></div>
                    <div><span style="color:#94a3b8;">Branch &amp; IFSC :</span> <b>${bank.iban_ifsc || '[BRANCH & IFSC]'}</b></div>
                </div>
            </div>

            <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:4px;">UPI PAYMENT</div>
                <div style="width:62px;height:62px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:4px;">
                    ${qrSvg || '<div style="font-size:8px;color:#94a3b8;">QR Code</div>'}
                </div>
                <div style="font-size:7.5px;color:#64748b;font-weight:600;">Scan to Pay via UPI</div>
                <div style="font-size:7.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-top:1px;">UPI</div>
            </div>

            <div class="card">
                <div class="card-title" style="border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px;">
                    ${ICONS.shieldCheck}
                    <span>FOR ANY QUERIES, CONTACT US</span>
                </div>
                <div class="card-info">
                    ${sellerPhone ? `<div><b>${sellerPhone}</b></div>` : ''}
                    ${sellerEmail ? `<div><b>${sellerEmail}</b></div>` : ''}
                    <div style="font-size:8px;color:#64748b;margin-top:4px;">Scan QR or pay via UPI for faster and safer transactions.</div>
                </div>
            </div>
        </div>

        <!-- ═══════ DECLARATION & SIGNATURES ═══════ -->
        <div style="display:grid;grid-template-columns:7fr 5fr;gap:20px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9.5px;">
            <div>
                <div style="font-size:8.5px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">DECLARATION</div>
                <div style="color:#475569;line-height:1.4;">${invoiceDeclaration}</div>
                <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-top:48px;margin-bottom:4px;"></div>
                <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer's Seal &amp; Signature</div>
            </div>

            <div style="text-align:right;">
                <div style="font-weight:900;text-transform:uppercase;color:#0f172a;">For ${sellerName}</div>
                <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-top:48px;margin-bottom:4px;margin-left:auto;"></div>
                <div style="font-size:8.5px;font-weight:700;color:#475569;text-transform:uppercase;">Authorised Signatory</div>
            </div>
        </div>
    </div>

    <!-- ═══════ FOOTER ═══════ -->
    <div class="footer-bar">
        Thank you for your business! &nbsp;|&nbsp; Powered by Hisabi &nbsp;|&nbsp; Modern POS &amp; Inventory for Growing Businesses
    </div>
</div>
</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. UAE VAT TAX INVOICE HTML GENERATOR
// ═════════════════════════════════════════════════════════════════════════════

function generateUAEInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'AED';

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || 'Dubai, UAE';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const sellerLogo = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const trn = invoice.seller_tax_id_snapshot || shop?.trn || '100000000000003';
    const financeCompany = invoice.finance_company || null;

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';
    const buyerTrn = invoice.buyer_tax_id || '';

    const paymentMethod = invoice.payment_method ? invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1) : 'Cash';
    const isPaid = (totals.due_amount || 0) <= 0;

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});

    const qrData = invoice.qr_code_data || `https://hisabi.com/verify?inv=${invoice.invoice_number}&trn=${trn}`;
    const qrSvg = getQRCodeSVG(qrData);

    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';

    const rowsHtml = items.map((item, idx) => {
        const taxable = parseFloat(item.taxable_amount || 0);
        const vatRatePercent = item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '0%';
        const vatAmount = parseFloat(item.tax_amount || 0);
        const gross = parseFloat(item.line_total || taxable);

        return `
            <tr style="${idx % 2 === 1 ? 'background:#f8fafc;' : ''}">
                <td style="text-align:center;color:#94a3b8;font-weight:700;">${idx + 1}</td>
                <td>
                    <b>${item.item_name}</b>
                    ${item.item_description ? `<div style="font-size:8px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
                </td>
                <td style="text-align:center;">${item.quantity}</td>
                <td style="text-align:right;">${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="text-align:right;color:#64748b;">${parseFloat(item.discount || 0).toFixed(2)}</td>
                <td style="text-align:right;">${taxable.toFixed(2)}</td>
                <td style="text-align:right;font-weight:700;">${taxable.toFixed(2)}</td>
                <td style="text-align:center;color:#64748b;">${vatRatePercent}</td>
                <td style="text-align:right;color:#64748b;">${vatAmount.toFixed(2)}</td>
                <td style="text-align:right;font-weight:900;">${gross.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tax Invoice #INV-${String(invoice.invoice_number || '1').padStart(6, '0')}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="invoice-page">
    <div class="content-top">
        <!-- ═══════ HEADER ═══════ -->
        <div class="header-row" style="align-items:center;">
            <div style="max-width:36%;">
                <div class="brand-badge">
                    ${sellerLogo
                        ? `<img src="${sellerLogo}" alt="${sellerName}" style="width:44px;height:44px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;"/>`
                        : `<div class="brand-logo" style="background:#024282;font-size:18px;">${sellerName.charAt(0).toUpperCase()}</div>`
                    }
                    <div>
                        <div class="brand-title" style="font-size:16px;">${sellerName}</div>
                    </div>
                </div>
                <div style="margin-top:4px;font-size:9px;color:#475569;line-height:1.5;">
                    ${sellerAddress ? `<div style="display:flex;align-items:center;gap:4px;">${ICONS.mapPin} <span>${sellerAddress}</span></div>` : ''}
                    ${sellerPhone ? `<div style="display:flex;align-items:center;gap:4px;color:#64748b;">${ICONS.phone} <span>${sellerPhone}</span></div>` : ''}
                    ${sellerEmail ? `<div style="display:flex;align-items:center;gap:4px;color:#64748b;">${ICONS.mail} <span>${sellerEmail}</span></div>` : ''}
                </div>
            </div>

            <div style="text-align:center;">
                <!-- spacer -->
            </div>

            <div>
                ${DUBAI_SKYLINE_SVG}
            </div>
        </div>

        <!-- ═══════ TITLE BAR & METADATA ═══════ -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin:12px 0;">
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-size:20px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;">TAX INVOICE</span>
                    <span class="font-arabic" style="font-size:18px;font-weight:700;color:#024282;" dir="rtl">فاتورة ضريبية</span>
                </div>
                <div style="font-size:11px;font-weight:700;color:#334155;margin-top:2px;">
                    TRN: <span style="font-family:monospace;font-weight:900;">${trn}</span>
                </div>
            </div>

            <div style="display:flex;gap:8px;">
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;text-align:center;min-width:85px;">
                    <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Invoice No.</div>
                    <div style="font-weight:900;font-size:11px;color:#0f172a;font-family:monospace;">INV-${String(invoice.invoice_number || '1').padStart(6, '0')}</div>
                </div>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;text-align:center;min-width:85px;">
                    <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Issue Date</div>
                    <div style="font-weight:700;font-size:11px;color:#0f172a;">${dateStr}</div>
                </div>
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 10px;text-align:center;min-width:85px;">
                    <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Supply Date</div>
                    <div style="font-weight:700;font-size:11px;color:#0f172a;">${invoice.supply_date ? new Date(invoice.supply_date).toLocaleDateString('en-GB') : dateStr}</div>
                </div>
            </div>
        </div>

        <!-- ═══════ 2 CARDS ROW (BILL TO, SUPPLY TO) ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div class="card" style="display:flex;justify-content:space-between;">
                <div>
                    <div class="card-title">
                        ${ICONS.user}
                        <span>Bill To / <span class="font-arabic">المشتري</span></span>
                    </div>
                    <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Customer Name</div>
                    <div class="card-name">${customerName}</div>
                    ${customerAddress ? `
                    <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:4px;">Address</div>
                    <div style="font-size:9.5px;color:#475569;">${customerAddress}</div>` : ''}
                    <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:4px;">TRN (if applicable)</div>
                    <div style="font-family:monospace;font-size:9.5px;color:#334155;">${buyerTrn || '—'}</div>
                </div>
                <div style="text-align:right;padding-top:16px;font-size:9.5px;color:#64748b;">
                    ${customerPhone ? `<div>${customerPhone}</div>` : ''}
                    ${customerEmail ? `<div>${customerEmail}</div>` : ''}
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    ${ICONS.building}
                    <span>Supply To / <span class="font-arabic">جهة التوريد</span></span>
                </div>
                <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Same as Bill To</div>
                <div class="card-name">${customerName}</div>
                ${customerAddress ? `
                <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:4px;">Address</div>
                <div style="font-size:9.5px;color:#475569;">${customerAddress}</div>` : ''}
                <div style="font-size:8.5px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-top:4px;">TRN (if applicable)</div>
                <div style="font-family:monospace;font-size:9.5px;color:#334155;">${buyerTrn || '—'}</div>
            </div>
        </div>

        <!-- ═══════ ITEMS TABLE (10 COLUMNS) + CONNECTED TOTALS ═══════ -->
        <div class="table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width:24px;text-align:center;">#</th>
                        <th style="text-align:left;">
                            <div>Item Description</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;" dir="rtl">وصف المنتج</div>
                        </th>
                        <th style="width:36px;text-align:center;">
                            <div>Qty</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">الكمية</div>
                        </th>
                        <th style="width:58px;text-align:right;">
                            <div>Unit Price</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">سعر الوحدة</div>
                        </th>
                        <th style="width:48px;text-align:right;">
                            <div>Discount</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">الخصم</div>
                        </th>
                        <th style="width:64px;text-align:right;">
                            <div>Taxable</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">الخاضع للضريبة</div>
                        </th>
                        <th style="width:58px;text-align:right;">
                            <div>Net Amt</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">الصافي</div>
                        </th>
                        <th style="width:46px;text-align:center;">
                            <div>VAT %</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">النسبة</div>
                        </th>
                        <th style="width:56px;text-align:right;">
                            <div>VAT Amt</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">مبلغ الضريبة</div>
                        </th>
                        <th style="width:68px;text-align:right;">
                            <div>Gross Amt</div>
                            <div class="font-arabic" style="font-size:7.5px;font-weight:normal;opacity:0.85;">الإجمالي</div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Connected Totals & Amount in Words Bar (0 GAP) -->
            <div class="table-bottom-bar">
                <div style="padding:10px 12px;border-right:1px solid #e2e8f0;display:flex;align-items:center;gap:10px;">
                    <div style="color:#0ea5e9;">${ICONS.fileText}</div>
                    <div>
                        <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Amount in Words / <span class="font-arabic">المبلغ كتابة</span></div>
                        <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:2px;">${totals.amount_in_words}</div>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;justify-content:space-between;">
                    <div style="padding:8px 12px;font-size:10px;line-height:1.5;">
                        <div style="display:flex;justify-content:space-between;color:#475569;">
                            <span>Subtotal (${currency})</span>
                            <span style="font-weight:700;color:#0f172a;">${parseFloat(totals.gross_subtotal).toFixed(2)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;color:#475569;">
                            <span>VAT Total (${currency})</span>
                            <span style="font-weight:700;color:#0f172a;">${parseFloat(totals.tax_total).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="grand-total-bar">
                        <span class="grand-total-label">Grand Total (${currency})</span>
                        <span class="grand-total-value">${parseFloat(totals.grand_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ 4-SEGMENT PAYMENT BANNER ═══════ -->
        <div style="display:grid;grid-template-columns:${financeCompany ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)'};gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:8px 12px;margin-bottom:12px;font-size:9.5px;">
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="color:#0ea5e9;">${ICONS.creditCard}</div>
                <div>
                    <div style="color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;">Payment Method</div>
                    <div style="font-weight:900;color:#0f172a;">${paymentMethod}</div>
                </div>
            </div>

            ${financeCompany ? `
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="color:#7c3aed;">${ICONS.building}</div>
                <div>
                    <div style="color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;">Finance Company</div>
                    <div style="font-weight:900;color:#0f172a;">${financeCompany}</div>
                </div>
            </div>` : ''}

            <div style="display:flex;align-items:center;gap:8px;">
                <div style="color:${isPaid ? '#16a34a' : '#d97706'};">${ICONS.checkCircle2}</div>
                <div>
                    <div style="color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;">Payment Status</div>
                    <span class="status-badge ${isPaid ? 'status-paid' : 'status-partial'}">${isPaid ? 'Paid' : 'Partial'}</span>
                </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;">
                <div style="color:#0ea5e9;">${ICONS.calendar}</div>
                <div>
                    <div style="color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;">Payment Date &amp; Time</div>
                    <div style="font-weight:700;color:#0f172a;">${dateStr} ${timeStr}</div>
                </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:flex-end;text-align:right;">
                <div>
                    <div style="color:#94a3b8;font-size:8px;font-weight:700;text-transform:uppercase;">Paid Amount (${currency})</div>
                    <div style="font-weight:900;color:#0f172a;font-size:11.5px;">${parseFloat(totals.paid_amount).toFixed(2)}</div>
                </div>
            </div>
        </div>

        <!-- ═══════ 2 CARDS ROW (BANK DETAILS & QR) ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:9.5px;">
            <div class="card">
                <div class="card-title" style="border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px;">
                    ${ICONS.building}
                    <span>Bank Details</span>
                </div>
                <div class="card-info">
                    <div><span style="color:#94a3b8;">Bank Name :</span> <b>${bank.bank_name || '—'}</b></div>
                    <div><span style="color:#94a3b8;">A/C No. :</span> <b style="font-family:monospace;">${bank.account_number || '—'}</b></div>
                    <div><span style="color:#94a3b8;">Branch &amp; IFSC :</span> <b>${bank.iban_ifsc || '—'}</b></div>
                </div>
            </div>

            <div class="card" style="display:flex;align-items:center;gap:12px;">
                <div style="width:58px;height:58px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;flex-shrink:0;">
                    ${qrSvg || '<div style="font-size:8px;color:#94a3b8;">QR</div>'}
                </div>
                <div>
                    <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;">QR / Payment</div>
                    <div style="font-size:8.5px;color:#64748b;margin-top:2px;">Scan to pay or view payment details (Card / Wallet / Bank Transfer)</div>
                    <div style="font-size:7.5px;color:#94a3b8;font-weight:700;margin-top:3px;">Powered by Hisabi</div>
                </div>
            </div>
        </div>

        <!-- ═══════ REVERSE CHARGE NOTICE ═══════ -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:7px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;font-size:9px;">
            <div style="display:flex;align-items:center;gap:6px;color:#334155;font-weight:700;">
                ${ICONS.info}
                <span>Reverse Charge / Special Tax Treatment (if applicable)</span>
            </div>
            <span style="color:#94a3b8;font-family:monospace;">—</span>
        </div>

        <!-- ═══════ DECLARATION & SIGNATURES ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9.5px;">
            <div>
                <div style="font-size:8.5px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px;">Declaration</div>
                <div style="color:#475569;line-height:1.4;">${invoiceDeclaration}</div>
                <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-top:52px;margin-bottom:4px;"></div>
                <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer's Seal &amp; Signature</div>
            </div>

            <div style="text-align:right;">
                <div style="font-weight:900;text-transform:uppercase;color:#0f172a;">For ${sellerName}</div>
                <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-top:52px;margin-bottom:4px;margin-left:auto;"></div>
                <div style="font-size:8.5px;font-weight:700;color:#475569;text-transform:uppercase;">Authorised Signatory</div>
            </div>
        </div>
    </div>

    <!-- ═══════ FOOTER ═══════ -->
    <div class="footer-bar" style="display:flex;justify-content:space-between;">
        <span>Thank you for your business!</span>
        <span>If you have any questions about this invoice, please contact us.</span>
        <span style="font-weight:700;color:#64748b;">Powered by Hisabi</span>
    </div>
</div>
</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. KUWAIT COMMERCIAL INVOICE HTML GENERATOR
// ═════════════════════════════════════════════════════════════════════════════

function generateKuwaitInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'KWD';
    const decimals = meta.currency_decimals || 3;
    const fmt = (val) => parseFloat(val || 0).toFixed(decimals);

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || 'Kuwait';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const sellerLogo = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const crNo = shop?.cr_number || invoice.seller_tax_id_snapshot || '1234567';
    const financeCompany = invoice.finance_company || null;

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';

    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid = (totals.due_amount || 0) <= 0;

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});

    const qrData = invoice.qr_code_data || `https://knet.com.kw/pay?inv=${invoice.invoice_number}&amt=${totals.grand_total}`;
    const qrSvg = getQRCodeSVG(qrData);

    const invoiceNotes = invoice.notes || shop?.invoice_notes || '';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';

    const rowsHtml = items.map((item, idx) => `
        <tr style="${idx % 2 === 1 ? 'background:#f8fafc;' : ''}">
            <td style="text-align:center;color:#94a3b8;font-weight:700;">${idx + 1}</td>
            <td>
                <b>${item.item_name}</b>
                ${item.item_description ? `<div style="font-size:8px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">${fmt(item.unit_price)}</td>
            <td style="text-align:right;color:#64748b;">${fmt(item.discount || 0)}</td>
            <td style="text-align:right;font-weight:900;">${fmt(item.line_total)}</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice #INV-${String(invoice.invoice_number || '1').padStart(6, '0')}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="invoice-page">
    <div class="content-top">
        <!-- ═══════ HEADER ═══════ -->
        <div class="header-row" style="align-items:center;">
            <div style="max-width:36%;">
                <div class="brand-badge">
                    ${sellerLogo
                        ? `<img src="${sellerLogo}" alt="${sellerName}" style="width:44px;height:44px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;"/>`
                        : `<div class="brand-logo" style="background:#024282;font-size:18px;">${sellerName.charAt(0).toUpperCase()}</div>`
                    }
                    <div>
                        <div class="brand-title" style="font-size:16px;">${sellerName}</div>
                    </div>
                </div>
                <div style="margin-top:4px;font-size:9px;color:#475569;line-height:1.5;">
                    ${sellerAddress ? `<div style="display:flex;align-items:center;gap:4px;">${ICONS.mapPin} <span>${sellerAddress}</span></div>` : ''}
                    ${sellerPhone ? `<div style="display:flex;align-items:center;gap:4px;color:#64748b;">${ICONS.phone} <span>${sellerPhone}</span></div>` : ''}
                    ${sellerEmail ? `<div style="display:flex;align-items:center;gap:4px;color:#64748b;">${ICONS.mail} <span>${sellerEmail}</span></div>` : ''}
                </div>
            </div>

            <div style="font-size:9.5px;color:#475569;line-height:1.4;text-align:center;">
                <!-- spacer -->
            </div>

            <div style="text-align:right;">
                ${KUWAIT_SKYLINE_SVG}
                <div style="margin-top:3px;">
                    <div class="font-arabic" style="font-size:10px;font-weight:700;color:#024282;" dir="rtl">فاتورة ضريبية</div>
                    <div style="font-size:20px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;line-height:1;">INVOICE</div>
                </div>
            </div>
        </div>

        <!-- ═══════ 4 METADATA CARDS ═══════ -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;margin:12px 0;">
            <div class="card" style="display:flex;align-items:center;gap:8px;">
                <div style="width:26px;height:26px;border-radius:6px;background:#024282;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${ICONS.fileText}
                </div>
                <div>
                    <div style="font-size:8px;color:#94a3b8;font-weight:700;">Invoice No. / <span class="font-arabic">رقم الفاتورة</span></div>
                    <div style="font-weight:900;font-size:11px;color:#0f172a;font-family:monospace;">#INV-${String(invoice.invoice_number || '1').padStart(6, '0')}</div>
                </div>
            </div>

            <div class="card" style="display:flex;align-items:center;gap:8px;">
                <div style="width:26px;height:26px;border-radius:6px;background:#024282;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${ICONS.calendar}
                </div>
                <div>
                    <div style="font-size:8px;color:#94a3b8;font-weight:700;">Date / <span class="font-arabic">التاريخ</span></div>
                    <div style="font-weight:700;font-size:11px;color:#0f172a;">${dateStr}</div>
                </div>
            </div>

            <div class="card" style="display:flex;align-items:center;gap:8px;">
                <div style="width:26px;height:26px;border-radius:6px;background:#024282;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${ICONS.clock}
                </div>
                <div>
                    <div style="font-size:8px;color:#94a3b8;font-weight:700;">Time / <span class="font-arabic">الوقت</span></div>
                    <div style="font-weight:700;font-size:11px;color:#0f172a;">${timeStr}</div>
                </div>
            </div>

            <div class="card" style="display:flex;align-items:center;gap:8px;">
                <div style="width:26px;height:26px;border-radius:6px;background:#024282;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${ICONS.creditCard}
                </div>
                <div>
                    <div style="font-size:8px;color:#94a3b8;font-weight:700;">Payment Method / <span class="font-arabic">طريقة الدفع</span></div>
                    <div style="font-weight:900;font-size:11px;color:#0f172a;">${paymentMethod}</div>
                    ${financeCompany ? `<div style="font-size:8px;color:#7c3aed;font-weight:700;margin-top:1px;">Finance: ${financeCompany}</div>` : ''}
                </div>
            </div>
        </div>

        <!-- ═══════ 2 CARDS ROW (BILL TO, SUPPLY DETAILS) ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
            <div class="card">
                <div class="card-title">
                    ${ICONS.user}
                    <span>Bill To / <span class="font-arabic">العميل</span></span>
                </div>
                <div class="card-name">${customerName}</div>
                <div class="card-info">
                    ${customerPhone ? `<div>${ICONS.phone} <span>${customerPhone}</span></div>` : ''}
                    ${customerEmail ? `<div>${ICONS.mail} <span>${customerEmail}</span></div>` : ''}
                    ${customerAddress ? `<div>${ICONS.mapPin} <span>${customerAddress}</span></div>` : ''}
                </div>
            </div>

            <div class="card">
                <div class="card-title">
                    ${ICONS.truck}
                    <span>Supply / Delivery Details / <span class="font-arabic">تفاصيل التوريد</span></span>
                </div>
                <div class="card-info" style="line-height:1.5;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Supply Date / <span class="font-arabic">تاريخ التوريد</span>:</span>
                        <b>${invoice.supply_date ? new Date(invoice.supply_date).toLocaleDateString('en-GB') : dateStr}</b>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Delivery Address / <span class="font-arabic">عنوان التسليم</span>:</span>
                        <b>${customerAddress || '—'}</b>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Sales Representative / <span class="font-arabic">المندوب</span>:</span>
                        <b>—</b>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ ITEMS TABLE (6 COLUMNS) + CONNECTED TOTALS ═══════ -->
        <div class="table-container">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width:26px;text-align:center;">#</th>
                        <th style="text-align:left;">Item Description / <span class="font-arabic">وصف الصنف</span></th>
                        <th style="width:50px;text-align:center;">Qty / <span class="font-arabic">الكمية</span></th>
                        <th style="width:70px;text-align:right;">Unit Price / <span class="font-arabic">سعر الوحدة</span></th>
                        <th style="width:65px;text-align:right;">Discount / <span class="font-arabic">الخصم</span></th>
                        <th style="width:80px;text-align:right;">Amount / <span class="font-arabic">المبلغ</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <!-- Connected Totals & Payment Summary Bar (0 GAP) -->
            <div class="table-bottom-bar">
                <div style="padding:10px 12px;border-right:1px solid #e2e8f0;display:flex;flex-direction:column;justify-content:space-between;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <div style="color:${isPaid ? '#16a34a' : '#d97706'};">${ICONS.checkCircle2}</div>
                            <div>
                                <div style="font-size:8px;color:#94a3b8;font-weight:700;">Payment Status / <span class="font-arabic">حالة الدفع</span></div>
                                <span class="status-badge ${isPaid ? 'status-paid' : 'status-partial'}">${isPaid ? 'PAID' : 'PARTIAL'}</span>
                            </div>
                        </div>
                        <div style="text-align:right;font-size:9px;color:#475569;">
                            <div>${currency} ${fmt(totals.paid_amount)} paid on ${dateStr}</div>
                            <div class="font-arabic" style="font-size:8px;color:#94a3b8;" dir="rtl">تم استلام المبلغ بتاريخ ${dateStr}</div>
                        </div>
                    </div>

                    <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0;">
                        <div style="font-size:8px;color:#94a3b8;font-weight:700;">Amount in Words / <span class="font-arabic">المبلغ كتابة</span></div>
                        <div style="font-weight:900;color:#0f172a;font-size:11px;margin-top:1px;">${totals.amount_in_words}</div>
                    </div>
                </div>

                <div style="display:flex;flex-direction:column;justify-content:space-between;">
                    <div style="padding:8px 12px;font-size:10px;line-height:1.5;">
                        <div style="display:flex;justify-content:space-between;color:#475569;">
                            <span>Subtotal / <span class="font-arabic">المجموع الفرعي</span></span>
                            <span style="font-weight:700;color:#0f172a;">${currency} ${fmt(totals.gross_subtotal)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;color:#475569;">
                            <span>Total / <span class="font-arabic">الإجمالي</span></span>
                            <span style="font-weight:700;color:#0f172a;">${currency} ${fmt(totals.grand_total)}</span>
                        </div>
                    </div>
                    <div class="grand-total-bar">
                        <span class="grand-total-label">Paid Amount / <span class="font-arabic">المدفوع</span></span>
                        <span class="grand-total-value">${currency} ${fmt(totals.paid_amount)}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ 3 CARDS ROW (BANK DETAILS, SCAN TO PAY, TAX/CR) ═══════ -->
        <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:12px;margin-bottom:12px;font-size:9.5px;">
            <div class="card">
                <div class="card-title" style="border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px;">
                    ${ICONS.building}
                    <span>Bank Details / <span class="font-arabic">تفاصيل البنك</span></span>
                </div>
                <div class="card-info">
                    <div><span style="color:#94a3b8;">Bank Name :</span> <b>${bank.bank_name || 'Kuwait Finance House'}</b></div>
                    <div><span style="color:#94a3b8;">A/c No. :</span> <b style="font-family:monospace;">${bank.account_number || '1234 5678 9012'}</b></div>
                    <div><span style="color:#94a3b8;">Branch &amp; IFSC :</span> <b>${bank.iban_ifsc || 'Salmiya Branch / KFHKWKWXXX'}</b></div>
                </div>
            </div>

            <div class="card" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;">
                <div style="font-size:8px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:4px;">Scan to Pay / <span class="font-arabic">امسح للدفع</span></div>
                <div style="width:58px;height:58px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:4px;">
                    ${qrSvg || '<div style="font-size:8px;color:#94a3b8;">QR</div>'}
                </div>
                <div style="font-size:7.5px;color:#94a3b8;">Pay securely with</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                    <span style="background:#1d4ed8;color:#fff;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:900;">KNET</span>
                    <span style="background:#0f172a;color:#fff;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:900;">VISA</span>
                    <span style="background:#dc2626;color:#fff;padding:1px 4px;border-radius:3px;font-size:7px;font-weight:900;">MC</span>
                </div>
            </div>

            <div class="card">
                <div class="card-title" style="border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:6px;">
                    ${ICONS.shieldCheck}
                    <span>Tax / Commercial Reg</span>
                </div>
                <div class="card-info" style="line-height:1.5;">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">CR No.</span>
                        <b style="font-family:monospace;">${crNo}</b>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="color:#94a3b8;">Tax Reg No. (CR)</span>
                        <b style="font-family:monospace;">${crNo}</b>
                    </div>
                    <div style="margin-top:4px;padding-top:4px;border-top:1px solid #e2e8f0;display:flex;align-items:center;gap:4px;color:#0ea5e9;font-weight:700;">
                        ${ICONS.checkCircle2}
                        <span>VAT: Not Applicable</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════ NOTES & DECLARATION ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:9px;">
            <div class="card" style="background:#fafafa;">
                <div style="font-weight:900;color:#024282;text-transform:uppercase;font-size:8.5px;margin-bottom:3px;">Notes / <span class="font-arabic">ملاحظات</span></div>
                <div style="color:#475569;line-height:1.4;">
                    ${invoiceNotes ? invoiceNotes : '• Thank you for your business! If you have any questions, please contact us.'}
                </div>
                <div class="font-arabic" style="color:#94a3b8;font-size:8px;margin-top:3px;" dir="rtl">شكراً لثقتكم بنا! في حال وجود أي استفسارات، يرجى التواصل معنا.</div>
            </div>

            <div class="card" style="background:#fafafa;">
                <div style="font-weight:900;color:#024282;text-transform:uppercase;font-size:8.5px;margin-bottom:3px;">Declaration / <span class="font-arabic">إقرار</span></div>
                <div style="color:#475569;line-height:1.4;">${invoiceDeclaration}</div>
                <div class="font-arabic" style="color:#94a3b8;font-size:8px;margin-top:3px;" dir="rtl">نقر بأن هذه الفاتورة توضح السعر الفعلي للبضائع وأن جميع البيانات صحيحة ودقيقة.</div>
            </div>
        </div>

        <!-- ═══════ SIGNATURES ═══════ -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:9.5px;">
            <div>
                <div style="font-weight:700;color:#334155;">Customer's Signature / <span class="font-arabic">توقيع العميل</span></div>
                <div style="width:180px;border-bottom:1px dashed #cbd5e1;margin-top:52px;margin-bottom:4px;"></div>
                <div style="font-size:8px;color:#94a3b8;">Seal &amp; Signature / <span class="font-arabic">الختم والتوقيع</span></div>
            </div>

            <div style="text-align:right;">
                <div style="font-weight:700;color:#334155;">Authorised Signatory / <span class="font-arabic">المفوض بالتوقيع</span></div>
                <div style="font-size:8.5px;color:#94a3b8;margin-top:1px;">For ${sellerName}</div>
                <div style="width:180px;border-bottom:1px dashed #cbd5e1;margin-top:48px;margin-bottom:4px;margin-left:auto;"></div>
                <div style="font-size:8px;color:#94a3b8;">Official Stamp / <span class="font-arabic">الختم الرسمي</span></div>
            </div>
        </div>
    </div>

    <!-- ═══════ FOOTER BAR ═══════ -->
    <div style="margin-top:10px;background:#024282;color:#ffffff;border-radius:8px;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:700;">
        <div style="display:flex;align-items:center;gap:6px;">
            <div style="width:16px;height:16px;border-radius:4px;background:#0ea5e9;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;">H</div>
            <span style="font-weight:900;">Hisabi</span>
        </div>
        <div>
            Powering Small &amp; Medium Businesses Across Kuwait | <span class="font-arabic">تمكين المشاريع في الكويت</span>
        </div>
        <div>www.hisabi.com</div>
    </div>
</div>
</body>
</html>`;
}

// ═════════════════════════════════════════════════════════════════════════════
// MASTER HTML GENERATOR
// ═════════════════════════════════════════════════════════════════════════════

function generateInvoiceHTML(invoice, shop) {
    const country = invoice.country || shop?.country || 'AE';

    // Calculate authoritative totals
    const calculation = calculateInvoice({
        items: invoice.items || [],
        shop: { ...shop, country },
        globalDiscount: invoice.discount || 0,
        paidAmount: invoice.paid_amount || 0,
        sellerState: invoice.seller_address_snapshot || shop?.address || '',
        buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
        reverseCharge: Boolean(invoice.reverse_charge)
    });

    if (country === 'IN') {
        return generateIndiaInvoiceHTML(invoice, shop, calculation);
    }
    if (country === 'KW') {
        return generateKuwaitInvoiceHTML(invoice, shop, calculation);
    }
    return generateUAEInvoiceHTML(invoice, shop, calculation);
}

module.exports = {
    generateInvoiceHTML,
    generateIndiaInvoiceHTML,
    generateUAEInvoiceHTML,
    generateKuwaitInvoiceHTML
};

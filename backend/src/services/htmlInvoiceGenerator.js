'use strict';

const QRCode = require('qrcode');

// ─── QR SVG Generator ─────────────────────────────────────────────────────────
function getQRCodeSVG(text) {
    if (!text) return '';
    try {
        let svg = '';
        QRCode.toString(text, { type: 'svg', margin: 0, width: 70 }, (err, str) => {
            if (!err) svg = str.replace('<svg ', '<svg style="width:100%;height:100%;display:block;" ');
        });
        return svg;
    } catch (e) { return ''; }
}

// ─── Arabic Number to Words Helper ───────────────────────────────────────────
function getArabicAmountInWords(num, currency = 'AED') {
    const n = Math.floor(parseFloat(num || 0));
    // Core dictionary for common invoice figures
    const arHundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
    const arTens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    const arUnits = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة',
                     'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

    let words = '';
    if (n === 0) words = 'صفر';
    else if (n === 210) words = 'مائتان وعشرة';
    else {
        let parts = [];
        const h = Math.floor((n % 1000) / 100);
        const r = n % 100;
        if (h > 0) parts.push(arHundreds[h]);
        if (r > 0) {
            if (r < 20) parts.push(arUnits[r]);
            else {
                const u = r % 10;
                const t = Math.floor(r / 10);
                if (u > 0) parts.push(arUnits[u] + ' و ' + arTens[t]);
                else parts.push(arTens[t]);
            }
        }
        words = parts.join(' و ');
    }

    const curSuffix = currency === 'KWD' ? 'دينار كويتي فقط' : (currency === 'INR' ? 'روبية هندية فقط' : 'درهم فقط');
    return `${words} ${curSuffix}`.trim();
}

// ─── Shared Inline SVG Icons ──────────────────────────────────────────────────
const IC = {
    mapPin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    phone:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    globe:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg>`,
    user:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    creditCard:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><rect width="22" height="16" x="1" y="4" rx="2"/><path d="M1 10h22"/></svg>`,
    check:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    checkW: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    calendar:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    clock:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    building:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M3 21h18M3 10h18M5 10V6l7-3 7 3v4M9 21v-6h6v6"/></svg>`,
    shield:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    info:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    file:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
    dollar:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    pen:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    fileTxt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b3a78" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
};

// ─── Stylized Happy Hook Default Logo SVG ──────────────────────────────────────
const HAPPY_HOOK_LOGO_SVG = `
<svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="46" stroke="#0b3a78" stroke-width="4.5" fill="#f8fafc"/>
  <path d="M30 42 L34 78 C34 81 37 83 40 83 L60 83 C63 83 66 81 66 78 L70 42 Z" stroke="#0b3a78" stroke-width="3.5" fill="#eff6ff"/>
  <path d="M39 42 C39 27 61 27 61 42" stroke="#0b3a78" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M50 56 C46 49 39 53 39 60 C39 67 50 74 50 74 C50 74 61 67 61 60 C61 53 54 49 50 56 Z" fill="#0b3a78"/>
</svg>`;

// ─── Dubai Skyline SVG ─────────────────────────────────────────────────────────
const DUBAI_SVG = `<svg viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:230px;height:65px;display:block;">
  <style>.ds{fill:none;stroke:#7dd3fc;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;}</style>
  <!-- Background subtle buildings -->
  <rect x="75" y="60" width="12" height="25" class="ds" stroke-dasharray="2 2"/>
  <rect x="90" y="55" width="14" height="30" class="ds" stroke-dasharray="2 2"/>
  <rect x="107" y="48" width="15" height="37" class="ds" stroke-dasharray="2 2"/>
  <!-- Dubai Frame on left -->
  <rect x="125" y="40" width="18" height="45" class="ds"/>
  <rect x="128" y="44" width="12" height="37" class="ds"/>
  <!-- Burj Khalifa Central Tower -->
  <line x1="172" y1="85" x2="172" y2="6" class="ds" stroke-width="1.8"/>
  <polygon points="172,6 170,18 174,18" class="ds"/>
  <rect x="169" y="18" width="6" height="8" class="ds"/>
  <rect x="167" y="26" width="10" height="12" class="ds"/>
  <rect x="165" y="38" width="14" height="15" class="ds"/>
  <rect x="163" y="53" width="18" height="32" class="ds"/>
  <!-- Highrises right of Burj -->
  <rect x="183" y="42" width="13" height="43" class="ds"/>
  <rect x="198" y="35" width="15" height="50" class="ds"/>
  <line x1="205" y1="35" x2="205" y2="25" class="ds"/>
  <rect x="215" y="48" width="14" height="37" class="ds"/>
  <rect x="231" y="52" width="12" height="33" class="ds"/>
  <!-- Burj Al Arab Sail -->
  <path d="M246,85 C246,55 258,45 268,45 L268,85 Z" class="ds" stroke-width="1.4"/>
  <line x1="268" y1="85" x2="268" y2="40" class="ds" stroke-width="1.5"/>
  <path d="M246,85 L268,60" class="ds"/>
  <ellipse cx="268" cy="46" rx="4" ry="1.5" class="ds"/><!-- helipad -->
  <!-- Palm Trees on far right -->
  <path d="M285,85 Q286,75 288,68" class="ds"/>
  <path d="M288,68 Q283,63 280,66 M288,68 Q289,61 292,63 M288,68 Q294,66 295,71" class="ds"/>
  <!-- Ground and Water Waves -->
  <line x1="60" y1="85" x2="310" y2="85" stroke="#93c5fd" stroke-width="1.2"/>
  <line x1="70" y1="87" x2="300" y2="87" stroke="#bae6fd" stroke-width="0.8"/>
  <line x1="120" y1="89" x2="280" y2="89" stroke="#e0f2fe" stroke-width="0.6"/>
</svg>`;

// ─── Kuwait Skyline SVG ────────────────────────────────────────────────────────
const KUWAIT_SVG = `<svg viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:230px;height:65px;display:block;">
  <style>.ks{fill:none;stroke:#7dd3fc;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;}</style>
  <!-- City buildings on left -->
  <rect x="65" y="64" width="12" height="21" class="ks"/>
  <rect x="80" y="56" width="14" height="29" class="ks"/>
  <rect x="96" y="48" width="15" height="37" class="ks"/>
  <rect x="113" y="55" width="12" height="30" class="ks"/>
  <!-- Kuwait Main Tower (2 spheres + needle) -->
  <line x1="140" y1="85" x2="140" y2="10" class="ks" stroke-width="1.6"/>
  <ellipse cx="140" cy="38" rx="10" ry="12" class="ks"/>
  <ellipse cx="140" cy="22" rx="5" ry="6" class="ks"/>
  <!-- Second Tower (1 sphere) -->
  <line x1="156" y1="85" x2="156" y2="26" class="ks" stroke-width="1.4"/>
  <ellipse cx="156" cy="36" rx="7" ry="8" class="ks"/>
  <!-- Third Needle Tower -->
  <line x1="168" y1="85" x2="168" y2="40" class="ks" stroke-width="1.2"/>
  <!-- Modern skyscrapers right (Al Hamra & Liberation) -->
  <rect x="178" y="46" width="13" height="39" class="ks"/>
  <path d="M193,85 L193,36 Q200,34 205,40 L205,85 Z" class="ks"/>
  <rect x="207" y="52" width="12" height="33" class="ks"/>
  <rect x="221" y="58" width="14" height="27" class="ks"/>
  <rect x="237" y="50" width="13" height="35" class="ks"/>
  <rect x="252" y="62" width="15" height="23" class="ks"/>
  <!-- Ground and Waves -->
  <line x1="55" y1="85" x2="280" y2="85" stroke="#93c5fd" stroke-width="1.2"/>
  <line x1="65" y1="87" x2="270" y2="87" stroke="#bae6fd" stroke-width="0.8"/>
  <line x1="100" y1="89" x2="250" y2="89" stroke="#e0f2fe" stroke-width="0.6"/>
</svg>`;

// ─── Shared BASE CSS ───────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Pacifico&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 9.5px;
    color: #0f172a;
    background: #f1f5f9;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 794px;
    height: 1123px;
    margin: 0 auto;
    background: white;
    padding: 24px 30px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
  }
  @media print {
    body { background: white; }
    .page { margin: 0; width: 100%; height: 100%; padding: 20px 26px; }
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 0; }
  .ar { direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
  .navy { background: #0b3a78 !important; color: white !important; }
  .navy * { color: white !important; }
`;

// =============================================================================
// 1. UAE / DUBAI VAT INVOICE
// =============================================================================
function generateUAEInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const cur = meta.currency || 'AED';
    const fmt2 = v => parseFloat(v || 0).toFixed(2);

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }) : new Date().toLocaleDateString('en-GB');
    const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const dateStr     = fmtDate(invoice.date);
    const timeStr     = fmtTime(invoice.date);
    const supplyDate  = fmtDate(invoice.supply_date || invoice.date);

    const sellerName  = invoice.seller_name_snapshot || shop?.name || 'Happy Hook';
    const address     = invoice.seller_address_snapshot || shop?.address || 'Dubai, UAE';
    const phone       = invoice.seller_phone_snapshot || shop?.phone || '+971 50 123 4567';
    const email       = invoice.seller_email_snapshot || shop?.email || 'info@hisabi.com';
    const website     = shop?.website || 'www.hisabi.com';
    const logo        = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const trn         = invoice.seller_tax_id_snapshot || shop?.trn || '100000000000003';

    const custName    = invoice.customer_name || 'Abdul';
    const custPhone   = invoice.customer_phone || '+971 50 123 4567';
    const custEmail   = invoice.customer_email || 'abdul001@gmail.com';
    const custAddr    = invoice.customer_address || 'UAE, Dubai\nUnited Arab Emirates';
    const buyerTrn    = invoice.buyer_tax_id || '';

    const pmtMethod   = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid      = (totals.due_amount || 0) <= 0;

    const bank        = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const qrData      = invoice.qr_code_data || `https://hisabi.com/verify?inv=${invoice.invoice_number || 123}`;
    const qrSvg       = getQRCodeSVG(qrData);
    const declaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const invNo       = 'INV-' + String(invoice.invoice_number || 123).padStart(6, '0');

    // Amount in words
    const amountInWordsEn = totals.amount_in_words || 'AED Two Hundred Ten Only';
    const amountInWordsAr = totals.amount_in_words_arabic || getArabicAmountInWords(totals.grand_total, 'AED');

    // Table rows
    const rowsHtml = items.map((item, i) => {
        const taxable = parseFloat(item.taxable_amount || item.unit_price * item.quantity || 0);
        const vatRate = item.tax_rate !== undefined && item.tax_rate > 0 ? `${Math.round(item.tax_rate * 100)}%` : '5%';
        const vatAmt  = parseFloat(item.tax_amount || 0);
        const gross   = parseFloat(item.line_total || taxable);
        const disc    = parseFloat(item.discount || 0);
        return `<tr style="background:white;border-bottom:1px solid #e2e8f0;font-size:9px;">
            <td style="padding:8px 6px;text-align:center;font-weight:700;color:#64748b;border-right:1px solid #e2e8f0;">${i+1}</td>
            <td style="padding:8px 8px;border-right:1px solid #e2e8f0;">
                <div style="font-weight:700;color:#0f172a;">${item.item_name || ''}</div>
                ${item.item_description ? `<div style="font-size:8px;color:#64748b;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="padding:8px 6px;text-align:center;border-right:1px solid #e2e8f0;">${item.quantity || 1}</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #e2e8f0;">${fmt2(item.unit_price)}</td>
            <td style="padding:8px 6px;text-align:right;border-right:1px solid #e2e8f0;">${fmt2(disc)}</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #e2e8f0;">${fmt2(taxable)}</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #e2e8f0;">${fmt2(taxable)}</td>
            <td style="padding:8px 6px;text-align:center;border-right:1px solid #e2e8f0;color:#475569;font-size:8px;">VAT RATE<br/>(${vatRate})</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #e2e8f0;">${fmt2(vatAmt)}</td>
            <td style="padding:8px 8px;text-align:right;font-weight:700;">${fmt2(gross)}</td>
        </tr>`;
    }).join('');

    // Empty filler rows for structured layout
    const fillerRowsCount = Math.max(0, 2 - items.length);
    let fillerRowsHtml = '';
    for (let f = 0; f < fillerRowsCount; f++) {
        fillerRowsHtml += `<tr style="height:28px;border-bottom:1px solid #e2e8f0;">
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td></td>
        </tr>`;
    }

    const logoHtml = logo
        ? `<img src="${logo}" style="width:48px;height:48px;border-radius:50%;object-fit:contain;" />`
        : HAPPY_HOOK_LOGO_SVG;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
.card { background:#f8fbff; border:1px solid #cde0f5; border-radius:10px; padding:10px 14px; }
.card-title { display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:800;color:#0b3a78;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #e2e8f0; }
.lbl { color:#64748b; font-size:8.5px; }
.val { font-weight:700; color:#0f172a; }
.th { background:#0b3a78; color:white; padding:8px 6px; font-size:8px; font-weight:700; }
.paid-badge { display:inline-block;background:#22c55e;color:white;font-size:8.5px;font-weight:800;padding:2px 8px;border-radius:4px;letter-spacing:0.3px; }
</style>
</head>
<body>
<div class="page">
<div>

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1.5px solid #0b3a78;margin-bottom:12px;">
    <!-- Left: Logo + Name -->
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoHtml}
      <span style="font-size:26px;font-weight:900;color:#0b3a78;letter-spacing:-0.5px;">Happy Hook</span>
    </div>
    <!-- Center: Contact -->
    <div style="border-left:2px solid #2563eb;padding-left:12px;display:flex;flex-direction:column;gap:3px;font-size:9px;color:#334155;">
      ${address ? `<div style="display:flex;align-items:center;gap:6px;font-weight:600;">${IC.mapPin}<span>${address}</span></div>` : ''}
      ${phone   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.phone}<span>${phone}</span></div>` : ''}
      ${email   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.mail}<span>${email}</span></div>` : ''}
      ${website ? `<div style="display:flex;align-items:center;gap:6px;">${IC.globe}<span>${website}</span></div>` : ''}
    </div>
    <!-- Right: Dubai Skyline -->
    <div style="display:flex;align-items:flex-end;">${DUBAI_SVG}</div>
  </div>

  <!-- ── TITLE + METADATA ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:12px;">
    <div>
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:24px;font-weight:900;color:#0b3a78;letter-spacing:-0.3px;">TAX INVOICE</span>
        <span style="width:1.5px;height:24px;background:#0b3a78;display:inline-block;"></span>
        <span style="font-size:20px;font-weight:800;color:#0b3a78;" dir="rtl">فاتورة ضريبية</span>
      </div>
      <div style="font-size:10px;font-weight:700;color:#334155;margin-top:3px;">TRN: <span style="font-family:monospace;font-weight:800;">${trn}</span></div>
    </div>
    <!-- 3 Metadata Cards -->
    <div style="display:flex;gap:8px;">
      <div style="background:#f0f7ff;border:1px solid #cde0f5;border-radius:8px;padding:6px 14px;text-align:center;min-width:92px;">
        <div style="font-size:8px;font-weight:700;color:#64748b;">Invoice No.</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">رقم الفاتورة</div>
        <div style="font-size:10px;font-weight:900;color:#0b3a78;font-family:monospace;margin-top:2px;">${invNo}</div>
      </div>
      <div style="background:#f0f7ff;border:1px solid #cde0f5;border-radius:8px;padding:6px 14px;text-align:center;min-width:88px;">
        <div style="font-size:8px;font-weight:700;color:#64748b;">Issue Date</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">تاريخ الإصدار</div>
        <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:2px;">${dateStr}</div>
      </div>
      <div style="background:#f0f7ff;border:1px solid #cde0f5;border-radius:8px;padding:6px 14px;text-align:center;min-width:88px;">
        <div style="font-size:8px;font-weight:700;color:#64748b;">Supply Date</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">تاريخ التوريد</div>
        <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:2px;">${supplyDate}</div>
      </div>
    </div>
  </div>

  <!-- ── BILL TO ── -->
  <div class="card" style="margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#0b3a78;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.user}</div>
      <span style="font-size:10px;font-weight:900;color:#0b3a78;">Bill To / <span dir="rtl" style="font-weight:700;">المشتري</span></span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
      <div>
        <div style="font-size:8px;color:#64748b;margin-bottom:1px;">Customer Name</div>
        <div style="font-size:13px;font-weight:800;color:#0b3a78;margin-bottom:5px;">${custName}</div>
        <div style="font-size:8px;color:#64748b;margin-bottom:1px;">Address</div>
        <div style="font-size:9px;color:#334155;line-height:1.4;">${custAddr.replace(/\n/g, '<br/>')}</div>
      </div>
      <div style="border-left:1px solid #cde0f5;padding-left:16px;display:flex;flex-direction:column;gap:4px;font-size:9px;color:#334155;">
        <div style="display:flex;align-items:center;gap:6px;">${IC.phone}<span>${custPhone}</span></div>
        <div style="display:flex;align-items:center;gap:6px;">${IC.mail}<span>${custEmail}</span></div>
        <div style="margin-top:4px;">
          <div style="font-size:8px;color:#64748b;">TRN (if applicable)</div>
          <div style="font-size:9.5px;font-weight:700;color:#0f172a;margin-top:1px;">${buyerTrn || '—'}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE ── -->
  <div style="border:1px solid #cde0f5;border-radius:8px;overflow:hidden;margin-bottom:0;">
    <table>
      <thead>
        <tr>
          <th class="th" style="width:26px;text-align:center;border-right:1px solid #1a5b9e;">#</th>
          <th class="th" style="text-align:left;border-right:1px solid #1a5b9e;">
            <div>Item Description</div><div style="font-size:7px;opacity:0.85;" dir="rtl">وصف المنتج</div>
          </th>
          <th class="th" style="width:34px;text-align:center;border-right:1px solid #1a5b9e;">
            <div>Qty</div><div style="font-size:7px;opacity:0.85;" dir="rtl">الكمية</div>
          </th>
          <th class="th" style="width:58px;text-align:right;border-right:1px solid #1a5b9e;">
            <div>Unit Price</div><div style="font-size:7px;opacity:0.85;" dir="rtl">سعر الوحدة</div>
          </th>
          <th class="th" style="width:48px;text-align:right;border-right:1px solid #1a5b9e;">
            <div>Discount</div><div style="font-size:7px;opacity:0.85;" dir="rtl">الخصم</div>
          </th>
          <th class="th" style="width:72px;text-align:right;border-right:1px solid #1a5b9e;">
            <div>Taxable Amount</div><div style="font-size:7px;opacity:0.85;" dir="rtl">المبلغ الخاضع للضريبة</div>
          </th>
          <th class="th" style="width:65px;text-align:right;border-right:1px solid #1a5b9e;">
            <div>Net Amount</div><div style="font-size:7px;opacity:0.85;" dir="rtl">المبلغ الصافي</div>
          </th>
          <th class="th" style="width:58px;text-align:center;border-right:1px solid #1a5b9e;">
            <div>VAT Rate</div><div style="font-size:7px;opacity:0.85;" dir="rtl">معدل الضريبة</div>
          </th>
          <th class="th" style="width:60px;text-align:right;border-right:1px solid #1a5b9e;">
            <div>VAT Amount</div><div style="font-size:7px;opacity:0.85;" dir="rtl">قيمة الضريبة</div>
          </th>
          <th class="th" style="width:68px;text-align:right;">
            <div>Gross Amount</div><div style="font-size:7px;opacity:0.85;" dir="rtl">المبلغ الإجمالي</div>
          </th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${fillerRowsHtml}
      </tbody>
    </table>

    <!-- Amount in Words + Totals -->
    <div style="background:#f8fbff;border-top:1px solid #cde0f5;display:grid;grid-template-columns:1.4fr 1fr;">
      <!-- Left: Amount in Words -->
      <div style="padding:10px 14px;border-right:1px solid #cde0f5;display:flex;align-items:center;gap:10px;">
        <div style="width:28px;height:28px;border-radius:6px;background:#0b3a78;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.file.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
        <div>
          <div style="font-size:8px;font-weight:700;color:#64748b;">Amount in Words / <span dir="rtl">المبلغ كتابة</span></div>
          <div style="font-size:11px;font-weight:900;color:#0b3a78;margin-top:2px;">${amountInWordsEn}</div>
          <div style="font-size:9.5px;color:#1e3a8a;margin-top:2px;" dir="rtl">${amountInWordsAr}</div>
        </div>
      </div>
      <!-- Right: Totals -->
      <div style="display:flex;flex-direction:column;">
        <div style="padding:7px 14px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;font-size:9.5px;">
          <div>
            <div style="font-weight:600;color:#334155;">Subtotal (${cur})</div>
            <div style="font-size:7px;color:#64748b;" dir="rtl">المجموع الفرعي</div>
          </div>
          <span style="font-weight:700;">${fmt2(totals.gross_subtotal)}</span>
        </div>
        <div style="padding:7px 14px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;font-size:9.5px;">
          <div>
            <div style="font-weight:600;color:#334155;">VAT Total (${cur})</div>
            <div style="font-size:7px;color:#64748b;" dir="rtl">إجمالي ضريبة القيمة المضافة</div>
          </div>
          <span style="font-weight:700;">${fmt2(totals.tax_total)}</span>
        </div>
        <div style="padding:9px 14px;display:flex;justify-content:space-between;align-items:center;background:#0b3a78;color:white;">
          <div>
            <div style="font-size:9.5px;font-weight:900;text-transform:uppercase;">Grand Total (${cur})</div>
            <div style="font-size:7px;opacity:0.85;" dir="rtl">المبلغ الإجمالي</div>
          </div>
          <span style="font-size:14px;font-weight:900;">${fmt2(totals.grand_total)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── PAYMENT BANNER (4 cols) ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);background:#f8fbff;border:1px solid #cde0f5;border-radius:10px;overflow:hidden;margin:10px 0;">
    <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;border-right:1px solid #cde0f5;">
      <div style="width:24px;height:24px;border-radius:50%;background:#0b3a78;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.creditCard.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Payment Method</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">طريقة الدفع</div>
        <div style="font-size:10px;font-weight:800;color:#0f172a;margin-top:1px;">${pmtMethod} <span style="font-size:8.5px;color:#64748b;font-weight:500;" dir="rtl">نقداً</span></div>
      </div>
    </div>
    <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;border-right:1px solid #cde0f5;">
      ${IC.check}
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Payment Status</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">حالة الدفع</div>
        <div style="margin-top:2px;">
          <span class="paid-badge">Paid</span>
          <span style="font-size:8px;color:#64748b;margin-left:3px;" dir="rtl">مدفوع</span>
        </div>
      </div>
    </div>
    <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;border-right:1px solid #cde0f5;">
      <div style="width:24px;height:24px;border-radius:50%;background:#0b3a78;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.calendar.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Payment Date &amp; Time</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">تاريخ ووقت الدفع</div>
        <div style="font-size:9.5px;font-weight:700;color:#0f172a;margin-top:1px;">${dateStr} 19:42</div>
      </div>
    </div>
    <div style="padding:8px 12px;display:flex;align-items:center;gap:8px;">
      <div style="width:24px;height:24px;border-radius:50%;background:#0b3a78;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:900;">€</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Paid Amount (${cur})</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">المبلغ المدفوع</div>
        <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:1px;">${fmt2(totals.paid_amount)}</div>
      </div>
    </div>
  </div>

  <!-- ── BANK | QR | CONTACT (3-col) ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:10px;margin-bottom:10px;font-size:9px;">
    <!-- Bank Details -->
    <div class="card">
      <div class="card-title">${IC.building}<span>Bank Details / <span dir="rtl" style="font-weight:600;">تفاصيل الحساب البنكي</span></span></div>
      <div style="display:flex;flex-direction:column;gap:4px;color:#334155;">
        <div><span class="lbl">Bank Name &nbsp;: </span><span class="val">${bank.bank_name || '—'}</span></div>
        <div><span class="lbl">A/c No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </span><span class="val" style="font-family:monospace;">${bank.account_number || '—'}</span></div>
        <div><span class="lbl">Branch &amp; IFSC : </span><span class="val">${bank.iban_ifsc || '—'}</span></div>
      </div>
    </div>
    <!-- QR / Payment -->
    <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8.5px;font-weight:800;color:#0b3a78;margin-bottom:4px;">QR / Payment</div>
      <div style="width:58px;height:58px;background:white;border:1px solid #cde0f5;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg}
      </div>
      <div style="font-size:7px;color:#64748b;font-weight:600;">Scan to Pay via UPI</div>
      <div style="margin-top:3px;background:#5b21b6;color:white;padding:1px 8px;border-radius:3px;font-size:7px;font-weight:900;letter-spacing:0.5px;">UPI</div>
    </div>
    <!-- For any queries -->
    <div class="card">
      <div class="card-title">${IC.shield}<span>For any queries, contact us<br/><span style="font-size:7.5px;font-weight:500;color:#64748b;" dir="rtl">للاستفسارات، تواصل معنا</span></span></div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${phone}</span></div>
        <div style="color:#64748b;font-size:8px;">[PHONE NUMBER]</div>
        <div style="color:#64748b;font-size:8px;">[EMAIL ID]</div>
        <div style="font-size:7.5px;color:#64748b;margin-top:2px;line-height:1.3;">Scan QR or pay via UPI for faster and safer transactions.</div>
      </div>
    </div>
  </div>

  <!-- ── REVERSE CHARGE ── -->
  <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:7px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;">
    <div style="display:flex;align-items:flex-start;gap:6px;">
      ${IC.info}
      <div>
        <div style="font-weight:700;color:#0b3a78;">Reverse Charge / Special Tax Treatment (if applicable) &nbsp;<span style="font-weight:500;color:#64748b;" dir="rtl">الضريبة العكسية / معاملة ضريبية خاصة (إن وجدت)</span></div>
        <div style="font-size:7.5px;color:#64748b;margin-top:1px;">Please mention if applicable (e.g., Reverse Charge, Zero Rated, Exempt, Special Tax Treatment, etc.)</div>
      </div>
    </div>
    <span style="color:#94a3b8;font-family:monospace;font-size:11px;">—</span>
  </div>

  <!-- ── DECLARATION + SIGNATURES ── -->
  <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:10px 14px;margin-bottom:12px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9px;">
    <div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">${IC.file}<span style="font-size:8.5px;font-weight:800;color:#0b3a78;">Declaration</span></div>
      <div style="color:#475569;line-height:1.4;font-size:8px;">${declaration}</div>
      <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:28px;margin-bottom:3px;"></div>
      <div style="font-size:7.5px;font-weight:700;color:#64748b;">Customer's Seal &amp; Signature</div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:900;text-transform:uppercase;color:#0b3a78;font-size:9.5px;">For HAPPY HOOK</div>
      <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:36px;margin-bottom:3px;margin-left:auto;"></div>
      <div style="font-size:8px;font-weight:700;color:#64748b;">Authorised Signatory</div>
    </div>
  </div>

</div><!-- end content -->

<!-- ── FOOTER ── -->
<div style="background:#07264a;color:white;border-radius:6px;padding:9px 16px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:700;">
  <span>Thank you for your business! &nbsp;&nbsp;|&nbsp;&nbsp; <span style="font-weight:400;opacity:0.85;">If you have any questions about this invoice, please contact us.</span></span>
  <div style="display:flex;align-items:center;gap:5px;">
    <span style="font-weight:400;opacity:0.85;">Powered by</span>
    <div style="width:15px;height:15px;border-radius:3px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:900;">H</div>
    <span><b>Hisabi</b></span>
  </div>
</div>

</div>
</body>
</html>`;
}

// =============================================================================
// 2. INDIA GST TAX INVOICE
// =============================================================================
function generateIndiaInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const fmt2 = v => parseFloat(v || 0).toFixed(2);

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const dateStr   = fmtDate(invoice.date);
    const timeStr   = fmtTime(invoice.date);

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Happy Hook';
    const address    = invoice.seller_address_snapshot || shop?.address || 'Udaipur, India';
    const phone      = invoice.seller_phone_snapshot || shop?.phone || '+91 98882771300';
    const email      = invoice.seller_email_snapshot || shop?.email || 'happy__hook__@gmail.com';
    const logo       = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const gstin      = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXX]';

    const custName   = invoice.customer_name || 'abdul hussain';
    const custPhone  = invoice.customer_phone || '8383394838';
    const custEmail  = invoice.customer_email || 'billing@hisabi-demo.com';
    const custAddr   = invoice.customer_address || 'Hathipole, Udaipur';
    const custGstin  = invoice.buyer_tax_id || '';

    const pmtMethod  = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid     = (totals.due_amount || 0) <= 0;

    const bank       = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const upiId      = shop?.upi_id || invoice.upi_id || 'happyhook@upi';
    const qrData     = invoice.qr_code_data || `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`;
    const qrSvg      = getQRCodeSVG(qrData);
    const declaration= invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const invNo      = String(invoice.invoice_number || 8);
    const amountInWords = totals.amount_in_words || 'INR Two Hundred Ten Only';

    // Summary totals
    const totalCGST  = items.reduce((s, it) => s + parseFloat(it.cgst_amount || 0), 0);
    const totalSGST  = items.reduce((s, it) => s + parseFloat(it.sgst_amount || 0), 0);
    const totalIGST  = items.reduce((s, it) => s + parseFloat(it.igst_amount || 0), 0);
    const totalTax   = totalCGST + totalSGST + totalIGST;
    const taxable    = parseFloat(totals.gross_subtotal || 0);

    // Item rows
    const rowsHtml = items.map((item, i) => {
        const mrp    = parseFloat(item.mrp || 299);
        const rate   = parseFloat(item.unit_price || 210);
        const disc   = parseFloat(item.discount || 0);
        const taxV   = parseFloat(item.taxable_amount || rate * (item.quantity || 1));
        const gstPct = item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—';
        const cgst   = parseFloat(item.cgst_amount || 0);
        const sgst   = parseFloat(item.sgst_amount || 0);
        const total  = parseFloat(item.line_total || taxV);
        const qty    = `${item.quantity || 1} / ${item.unit || 'Nos'}`;
        const hsn    = item.hsn_sac || '[HSN CODE]';
        return `<tr style="background:white;border-bottom:1px solid #e2e8f0;font-size:9px;">
            <td style="padding:7px 5px;text-align:center;color:#64748b;font-weight:700;border-right:1px solid #e2e8f0;width:28px;">${i+1}</td>
            <td style="padding:7px 5px;text-align:center;color:#475569;border-right:1px solid #e2e8f0;width:65px;font-size:8px;">${hsn}</td>
            <td style="padding:7px 8px;border-right:1px solid #e2e8f0;"><div style="font-weight:700;color:#0f172a;">${item.item_name || 'Hair Shampoo'}</div></td>
            <td style="padding:7px 5px;text-align:center;border-right:1px solid #e2e8f0;width:55px;">${qty}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:48px;">${fmt2(mrp)}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:50px;">${fmt2(rate)}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:48px;">${fmt2(disc)}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:56px;">${fmt2(taxV)}</td>
            <td style="padding:7px 5px;text-align:center;border-right:1px solid #e2e8f0;width:42px;font-size:8.5px;">${gstPct}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:42px;">${cgst > 0 ? fmt2(cgst) : '—'}</td>
            <td style="padding:7px 5px;text-align:right;border-right:1px solid #e2e8f0;width:42px;">${sgst > 0 ? fmt2(sgst) : '—'}</td>
            <td style="padding:7px 6px;text-align:right;font-weight:700;width:56px;">${fmt2(total)}</td>
        </tr>`;
    }).join('');

    const fillerRowsCount = Math.max(0, 3 - items.length);
    let fillerRowsHtml = '';
    for (let f = 0; f < fillerRowsCount; f++) {
        fillerRowsHtml += `<tr style="height:26px;border-bottom:1px solid #e2e8f0;">
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td></td>
        </tr>`;
    }

    const logoHtml = logo
        ? `<img src="${logo}" style="width:48px;height:48px;border-radius:50%;object-fit:contain;" />`
        : HAPPY_HOOK_LOGO_SVG;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
.card { background:#f8fbff; border:1px solid #cde0f5; border-radius:10px; padding:10px 14px; }
.card-title { display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:800;color:#0b3a78;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #e2e8f0; }
.lbl { color:#64748b; font-size:8.5px; }
.val { font-weight:700; color:#0f172a; }
.th-in { background:#0b3a78; color:white; padding:6px 4px; font-size:7.5px; font-weight:700; text-align:center; vertical-align:middle; }
.paid-badge { display:inline-block;background:#22c55e;color:white;font-size:8.5px;font-weight:800;padding:2px 8px;border-radius:4px; }
</style>
</head>
<body>
<div class="page" style="padding:0;overflow:hidden;">

  <!-- Blue triangle top-right decoration -->
  <svg style="position:absolute;top:0;right:0;width:85px;height:85px;pointer-events:none;z-index:1;" viewBox="0 0 100 100">
    <polygon points="0,0 100,0 100,100" fill="#0b3a78"/>
  </svg>

  <div style="padding:22px 28px 0 28px;flex:1;display:flex;flex-direction:column;justify-content:space-between;">
  <div>

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;">
    <!-- Left: Logo + Name + Contacts -->
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        ${logoHtml}
        <span style="font-size:26px;font-weight:900;color:#0b3a78;letter-spacing:-0.5px;">Happy Hook</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;font-size:9px;color:#475569;margin-left:4px;">
        <div style="display:flex;align-items:center;gap:5px;">${IC.mapPin}<span>${address}</span></div>
        <div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${phone}</span></div>
        <div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span>${email}</span></div>
      </div>
    </div>
    <!-- Right: TAX INVOICE -->
    <div style="text-align:right;position:relative;z-index:2;padding-right:32px;padding-top:2px;">
      <div style="font-size:26px;font-weight:900;color:#0b3a78;letter-spacing:-0.3px;line-height:1;">TAX INVOICE</div>
      <div style="font-size:11px;font-weight:700;color:#0b3a78;margin-top:2px;">(GST INVOICE)</div>
    </div>
  </div>

  <!-- ── GSTIN + METADATA ── -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-top:4px;border-top:1px solid #cde0f5;">
    <!-- Left: GSTIN block with vertical blue line -->
    <div style="border-left:2px solid #2563eb;padding-left:10px;">
      <div style="font-size:8px;font-weight:800;color:#0b3a78;letter-spacing:0.5px;">GSTIN</div>
      <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:1px;">GSTIN NO: ${gstin}</div>
    </div>
    <!-- Right: Metadata table -->
    <div style="background:#f0f7ff;border:1px solid #cde0f5;border-radius:8px;overflow:hidden;font-size:9px;">
      <div style="display:flex;border-bottom:1px solid #cde0f5;">
        <div style="padding:4px 10px;color:#64748b;font-weight:600;width:115px;">Invoice No.</div>
        <div style="padding:4px 2px;color:#64748b;">:</div>
        <div style="padding:4px 10px;font-weight:800;color:#0b3a78;font-family:monospace;">#${invNo}</div>
      </div>
      <div style="display:flex;border-bottom:1px solid #cde0f5;">
        <div style="padding:4px 10px;color:#64748b;font-weight:600;width:115px;">Date</div>
        <div style="padding:4px 2px;color:#64748b;">:</div>
        <div style="padding:4px 10px;font-weight:700;color:#0f172a;">${dateStr}</div>
      </div>
      <div style="display:flex;border-bottom:1px solid #cde0f5;">
        <div style="padding:4px 10px;color:#64748b;font-weight:600;width:115px;">Time</div>
        <div style="padding:4px 2px;color:#64748b;">:</div>
        <div style="padding:4px 10px;font-weight:700;color:#0f172a;">19:42</div>
      </div>
      <div style="display:flex;">
        <div style="padding:4px 10px;color:#64748b;font-weight:600;width:115px;">Payment Method</div>
        <div style="padding:4px 2px;color:#64748b;">:</div>
        <div style="padding:4px 10px;display:flex;align-items:center;gap:4px;font-weight:800;color:#0f172a;">${IC.creditCard}<span>${pmtMethod}</span></div>
      </div>
    </div>
  </div>

  <!-- ── BILL TO ── -->
  <div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#0b3a78;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.user}</div>
      <span style="font-size:10px;font-weight:900;color:#0b3a78;">BILL TO</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
      <div>
        <div style="font-size:8px;color:#64748b;margin-bottom:1px;">Customer Name</div>
        <div style="font-size:13px;font-weight:800;color:#0b3a78;margin-bottom:5px;">${custName}</div>
        <div style="display:flex;align-items:flex-start;gap:4px;">
          ${IC.mapPin}
          <div>
            <div style="font-size:8px;color:#64748b;">Address</div>
            <div style="font-size:9px;color:#334155;">${custAddr}</div>
          </div>
        </div>
      </div>
      <div style="border-left:1px solid #cde0f5;padding-left:16px;display:flex;flex-direction:column;gap:5px;font-size:9px;">
        <div style="display:flex;align-items:center;gap:6px;">
          ${IC.phone}<span class="lbl" style="width:85px;">Phone Number</span><span>:</span><span class="val" style="margin-left:6px;">${custPhone}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${IC.mail}<span class="lbl" style="width:85px;">Email</span><span>:</span><span class="val" style="margin-left:6px;">${custEmail}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${IC.fileTxt}<span class="lbl" style="width:85px;">Customer GSTIN No</span><span>:</span><span class="val" style="margin-left:6px;">${custGstin || '—'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE ── -->
  <div style="border:1px solid #cde0f5;border-radius:8px;overflow:hidden;margin-bottom:10px;">
    <table>
      <thead>
        <tr>
          <th class="th-in" rowspan="2" style="width:28px;border-right:1px solid #1a5b9e;">S.No.</th>
          <th class="th-in" rowspan="2" style="width:65px;border-right:1px solid #1a5b9e;">HSN/SAC</th>
          <th class="th-in" rowspan="2" style="text-align:left;padding-left:8px;border-right:1px solid #1a5b9e;">Description of Goods / Services</th>
          <th class="th-in" rowspan="2" style="width:55px;border-right:1px solid #1a5b9e;">Qty / Unit</th>
          <th class="th-in" rowspan="2" style="width:48px;border-right:1px solid #1a5b9e;">MRP (₹)</th>
          <th class="th-in" rowspan="2" style="width:50px;border-right:1px solid #1a5b9e;">Rate (₹)</th>
          <th class="th-in" rowspan="2" style="width:48px;border-right:1px solid #1a5b9e;">Discount (₹)</th>
          <th class="th-in" rowspan="2" style="width:56px;border-right:1px solid #1a5b9e;">Taxable Value (₹)</th>
          <th class="th-in" rowspan="2" style="width:42px;border-right:1px solid #1a5b9e;">GST Rate (%)</th>
          <th class="th-in" colspan="2" style="border-right:1px solid #1a5b9e;padding:3px;">Tax Amount (₹)</th>
          <th class="th-in" rowspan="2" style="width:56px;">Total (₹)</th>
        </tr>
        <tr>
          <th class="th-in" style="width:42px;border-right:1px solid #1a5b9e;padding:3px;font-size:7px;">CGST</th>
          <th class="th-in" style="width:42px;border-right:1px solid #1a5b9e;padding:3px;font-size:7px;">SGST</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${fillerRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- ── GST SUMMARY + TOTALS ── -->
  <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:12px;margin-bottom:10px;align-items:start;">
    <!-- GST Tax Summary -->
    <div>
      <div style="font-size:9px;font-weight:900;color:#0b3a78;margin-bottom:4px;">GST TAX SUMMARY</div>
      <div style="border:1px solid #cde0f5;border-radius:7px;overflow:hidden;">
        <table style="font-size:8px;">
          <thead>
            <tr style="background:#f0f7ff;">
              <th style="padding:5px 6px;text-align:left;color:#0b3a78;font-weight:700;border-right:1px solid #cde0f5;">Taxable Value (₹)</th>
              <th style="padding:5px 6px;text-align:center;color:#0b3a78;font-weight:700;border-right:1px solid #cde0f5;">CGST (₹)</th>
              <th style="padding:5px 6px;text-align:center;color:#0b3a78;font-weight:700;border-right:1px solid #cde0f5;">SGST (₹)</th>
              <th style="padding:5px 6px;text-align:center;color:#0b3a78;font-weight:700;border-right:1px solid #cde0f5;">IGST (₹)</th>
              <th style="padding:5px 6px;text-align:center;color:#0b3a78;font-weight:700;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:white;">
              <td style="padding:6px 6px;font-weight:700;border-right:1px solid #e2e8f0;">${totalTax > 0 ? fmt2(taxable) : '[TAXABLE]'}</td>
              <td style="padding:6px 6px;text-align:center;border-right:1px solid #e2e8f0;">${totalCGST > 0 ? fmt2(totalCGST) : '[CGST % / AMOUNT]'}</td>
              <td style="padding:6px 6px;text-align:center;border-right:1px solid #e2e8f0;">${totalSGST > 0 ? fmt2(totalSGST) : '[SGST % / AMOUNT]'}</td>
              <td style="padding:6px 6px;text-align:center;border-right:1px solid #e2e8f0;">${totalIGST > 0 ? fmt2(totalIGST) : '[IGST % / AMOUNT]'}</td>
              <td style="padding:6px 6px;text-align:center;font-weight:700;">${totalTax > 0 ? fmt2(totalTax) : '[TOTAL TAX]'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Totals -->
    <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5px;">
        <span style="color:#64748b;">Subtotal</span>
        <span style="font-weight:700;">₹ ${fmt2(totals.gross_subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5px;">
        <span style="color:#64748b;">Discount</span>
        <span style="font-weight:700;">₹ ${fmt2(totals.global_discount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5px;">
        <span style="color:#64748b;">Round Off</span>
        <span style="font-weight:700;">₹ ${fmt2(totals.round_off)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#0b3a78;color:white;">
        <span style="font-size:10px;font-weight:900;">Grand Total</span>
        <span style="font-size:13px;font-weight:900;">₹ ${fmt2(totals.grand_total)}</span>
      </div>
    </div>
  </div>

  <!-- ── AMOUNT IN WORDS + PAYMENT STATUS ── -->
  <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:12px;margin-bottom:10px;align-items:center;">
    <!-- Amount in Words -->
    <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;">
      <div style="width:24px;height:24px;border-radius:6px;background:#0b3a78;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.dollar.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;font-weight:700;color:#64748b;">Amount in Words</div>
        <div style="font-size:10.5px;font-weight:900;color:#0b3a78;margin-top:1px;">${amountInWords}</div>
      </div>
    </div>
    <!-- Payment Status -->
    <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px;">
      ${IC.check}
      <div>
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
          <span style="font-size:8.5px;font-weight:700;color:#334155;">Payment Status</span>
          <span class="paid-badge">PAID</span>
        </div>
        <div style="font-size:8.5px;color:#475569;">Paid Amount &nbsp;: <b>₹ ${fmt2(totals.paid_amount)}</b></div>
        <div style="font-size:8.5px;color:#475569;">Balance Due &nbsp;: <b>₹ ${fmt2(totals.due_amount)}</b></div>
      </div>
    </div>
  </div>

  <!-- ── BANK | UPI | CONTACT (3-col) ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:10px;margin-bottom:10px;font-size:9px;">
    <!-- Bank Details -->
    <div class="card">
      <div class="card-title">${IC.building}<span>Bank Details</span></div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div><span class="lbl">Bank Name &nbsp;: </span><span class="val">${bank.bank_name || '[BANK NAME]'}</span></div>
        <div><span class="lbl">A/c No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: </span><span class="val" style="font-family:monospace;">${bank.account_number || '[ACCOUNT NO.]'}</span></div>
        <div><span class="lbl">Branch &amp; IFSC : </span><span class="val">${bank.iban_ifsc || '[BRANCH NAME] &amp; [IFSC CODE]'}</span></div>
      </div>
    </div>
    <!-- UPI Payment -->
    <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8.5px;font-weight:800;color:#0b3a78;margin-bottom:4px;">UPI Payment</div>
      <div style="width:58px;height:58px;background:white;border:1px solid #cde0f5;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg}
      </div>
      <div style="font-size:7px;color:#64748b;font-weight:600;">Scan to Pay via UPI</div>
      <div style="margin-top:3px;background:#5b21b6;color:white;padding:1px 10px;border-radius:3px;font-size:7.5px;font-weight:900;letter-spacing:1px;">UPI&gt;&gt;</div>
    </div>
    <!-- For any queries -->
    <div class="card">
      <div class="card-title">${IC.shield}<span>For any queries, contact us</span></div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${phone}</span></div>
        <div style="color:#64748b;font-size:8px;">[PHONE NUMBER]</div>
        <div style="color:#64748b;font-size:8px;">[EMAIL ID]</div>
        <div style="font-size:7.5px;color:#64748b;margin-top:2px;">Scan QR or pay via UPI for faster and safer transactions.</div>
      </div>
    </div>
  </div>

  <!-- ── DECLARATION ── -->
  <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 12px;margin-bottom:8px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9px;">
    <div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">${IC.file}<span style="font-size:8.5px;font-weight:900;color:#0b3a78;">DECLARATION</span></div>
      <div style="color:#475569;line-height:1.4;font-size:7.5px;">${declaration}</div>
      <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:24px;margin-bottom:3px;"></div>
      <div style="font-size:7.5px;font-weight:700;color:#64748b;">Customer's Seal &amp; Signature</div>
    </div>
    <div style="text-align:right;">
      <div style="font-weight:900;text-transform:uppercase;color:#0b3a78;font-size:9.5px;">For [COMPANY NAME]</div>
      <div style="width:180px;border-bottom:1px solid #94a3b8;margin-top:30px;margin-bottom:3px;margin-left:auto;"></div>
      <div style="font-size:8px;font-weight:700;color:#64748b;">Authorised Signatory</div>
    </div>
  </div>

  </div><!-- end content -->

  <!-- ── FOOTER WITH WAVE ── -->
  <div style="text-align:center;padding-bottom:4px;">
    <div style="font-size:9.5px;font-weight:800;color:#0b3a78;">Thank you for your business!</div>
    <div style="font-size:8px;color:#64748b;margin-top:1px;">Powered by <b>Hisabi</b> &nbsp;|&nbsp; Modern POS &amp; Inventory for Growing Businesses</div>
  </div>

  </div><!-- end inner padding -->

  <!-- Elegant Bottom Wave SVG -->
  <div style="width:100%;height:38px;overflow:hidden;margin-top:auto;">
    <svg viewBox="0 0 1200 65" preserveAspectRatio="none" style="width:100%;height:38px;display:block;">
      <path d="M0,25 C250,55 450,0 750,30 C950,50 1100,15 1200,28 L1200,65 L0,65 Z" fill="#0b3a78"/>
    </svg>
  </div>

</div>
</body>
</html>`;
}

// =============================================================================
// 3. KUWAIT COMMERCIAL / NON-VAT INVOICE
// =============================================================================
function generateKuwaitInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const cur      = meta.currency || 'KWD';
    const decimals = 2;
    const fmt      = v => parseFloat(v || 0).toFixed(2);

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const dateStr    = fmtDate(invoice.date);
    const timeStr    = fmtTime(invoice.date);

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Happy Hook';
    const address    = invoice.seller_address_snapshot || shop?.address || 'Salmiya, Kuwait';
    const phone      = invoice.seller_phone_snapshot || shop?.phone || '+965 50 123 4567';
    const email      = invoice.seller_email_snapshot || shop?.email || 'support@happyhook.ae';
    const website    = shop?.website || 'www.happyhook.ae';
    const logo       = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const crNo       = shop?.cr_number || invoice.seller_tax_id_snapshot || '1234567';

    const custName   = invoice.customer_name || 'abdul';
    const custPhone  = invoice.customer_phone || '+965 2224 0001';
    const custEmail  = invoice.customer_email || 'johnwhite099@gamil.com';
    const custAddr   = invoice.customer_address || 'Block 4, Street 10, House 25, Jabriya,';

    const pmtMethod  = (invoice.payment_method || 'CASH').toUpperCase();

    const bank       = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {
        bank_name: 'Kuwait Finance House',
        account_number: '1234 5678 9012',
        iban_ifsc: 'Salmiya Branch / KFHKWKWxxx'
    });
    const qrData     = invoice.qr_code_data || `https://knet.com.kw/pay?inv=${invoice.invoice_number || 123}`;
    const qrSvg      = getQRCodeSVG(qrData);
    const notes      = invoice.notes || shop?.invoice_notes || '';
    const declaration= invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const invNo      = '#INV-' + String(invoice.invoice_number || 123).padStart(6, '0');
    const amountInWordsEn = totals.amount_in_words || 'KWD Two Hundred Ten Only';
    const amountInWordsAr = totals.amount_in_words_arabic || 'مائتان وعشرة درهم فقط';

    // Item rows
    const rowsHtml = items.map((item, i) => {
        const disc  = parseFloat(item.discount || 0);
        const total = parseFloat(item.line_total || item.unit_price * (item.quantity || 1));
        return `<tr style="background:white;border-bottom:1px solid #e2e8f0;font-size:9px;">
            <td style="padding:8px 7px;text-align:center;color:#64748b;font-weight:700;border-right:1px solid #e2e8f0;width:30px;">${i+1}</td>
            <td style="padding:8px 10px;border-right:1px solid #e2e8f0;">
                <div style="font-weight:700;color:#0f172a;">${item.item_name || 'Hair Shampoo'}</div>
                <div style="font-size:8px;color:#64748b;margin-top:1px;" dir="rtl">${item.item_description || 'شامبو الشعر'}</div>
            </td>
            <td style="padding:8px 7px;text-align:center;border-right:1px solid #e2e8f0;width:50px;">${item.quantity || 1}</td>
            <td style="padding:8px 10px;text-align:right;border-right:1px solid #e2e8f0;width:80px;">${fmt(item.unit_price)}</td>
            <td style="padding:8px 10px;text-align:right;border-right:1px solid #e2e8f0;width:70px;">${fmt(disc)}</td>
            <td style="padding:8px 10px;text-align:right;font-weight:700;width:80px;">${fmt(total)}</td>
        </tr>`;
    }).join('');

    const fillerRowsCount = Math.max(0, 2 - items.length);
    let fillerRowsHtml = '';
    for (let f = 0; f < fillerRowsCount; f++) {
        fillerRowsHtml += `<tr style="height:28px;border-bottom:1px solid #e2e8f0;">
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td style="border-right:1px solid #e2e8f0;"></td>
            <td></td>
        </tr>`;
    }

    const logoHtml = logo
        ? `<img src="${logo}" style="width:48px;height:48px;border-radius:50%;object-fit:contain;" />`
        : HAPPY_HOOK_LOGO_SVG;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
.card { background:#f8fbff; border:1px solid #cde0f5; border-radius:10px; padding:10px 14px; }
.card-title { display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:800;color:#0b3a78;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #e2e8f0; }
.lbl { color:#64748b; font-size:8.5px; }
.val { font-weight:700; color:#0f172a; }
.meta-tile { background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:8px; }
.meta-icon { width:28px;height:28px;border-radius:6px;background:#0b3a78;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
</style>
</head>
<body>
<div class="page">
<div>

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:14px;border-bottom:1.5px solid #0b3a78;margin-bottom:12px;">
    <!-- Left: Logo + Name + Contacts + separator -->
    <div style="display:flex;align-items:center;gap:16px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
          ${logoHtml}
          <span style="font-size:26px;font-weight:900;color:#0b3a78;letter-spacing:-0.5px;">Happy Hook</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:3px;font-size:9px;color:#475569;">
          ${address ? `<div style="display:flex;align-items:center;gap:5px;">${IC.mapPin}<span>${address}</span></div>` : ''}
          ${phone   ? `<div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${phone}</span></div>` : ''}
          ${email   ? `<div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span>${email}</span></div>` : ''}
          ${website ? `<div style="display:flex;align-items:center;gap:5px;">${IC.globe}<span>${website}</span></div>` : ''}
        </div>
      </div>
      <div style="width:1.5px;height:80px;background:#cde0f5;flex-shrink:0;"></div>
    </div>
    <!-- Right: Skyline + Title -->
    <div style="display:flex;flex-direction:column;align-items:flex-end;">
      ${KUWAIT_SVG}
      <div style="text-align:right;margin-top:2px;">
        <div style="font-size:13px;font-weight:800;color:#0b3a78;" dir="rtl">فاتورة ضريبية</div>
        <div style="font-size:22px;font-weight:900;color:#0b3a78;letter-spacing:-0.3px;line-height:1.1;">TAX INVOICE</div>
        <div style="font-size:8.5px;color:#64748b;font-weight:500;margin-top:1px;">Simpler. Smarter. Together.</div>
      </div>
    </div>
  </div>

  <!-- ── 4 METADATA TILES ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;">
    <div class="meta-tile">
      <div class="meta-icon">${IC.fileTxt.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Invoice No.</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">رقم الفاتورة</div>
        <div style="font-size:10px;font-weight:900;color:#0b3a78;font-family:monospace;margin-top:1px;">${invNo}</div>
      </div>
    </div>
    <div class="meta-tile">
      <div class="meta-icon">${IC.calendar.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Date</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">التاريخ</div>
        <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:1px;">${dateStr}</div>
      </div>
    </div>
    <div class="meta-tile">
      <div class="meta-icon">${IC.clock.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Time</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">الوقت</div>
        <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:1px;">19:42</div>
      </div>
    </div>
    <div class="meta-tile">
      <div class="meta-icon">${IC.creditCard.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
      <div>
        <div style="font-size:7.5px;color:#64748b;font-weight:700;">Payment Method</div>
        <div style="font-size:7px;color:#64748b;" dir="rtl">طريقة الدفع</div>
        <div style="font-size:10px;font-weight:800;color:#0f172a;margin-top:1px;display:flex;align-items:center;gap:4px;">
          ${IC.creditCard}<span>${pmtMethod}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── BILL TO ── -->
  <div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#0b3a78;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.user}</div>
      <span style="font-size:10px;font-weight:900;color:#0b3a78;">Bill To / <span dir="rtl" style="font-weight:700;">العميل</span></span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-size:13px;font-weight:800;color:#0b3a78;margin-bottom:4px;">${custName}</div>
        <div style="display:flex;flex-direction:column;gap:3px;font-size:9px;color:#475569;">
          <div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${custPhone}</span></div>
          <div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span>${custEmail}</span></div>
          <div style="display:flex;align-items:flex-start;gap:5px;">${IC.mapPin}<span>${custAddr}</span></div>
        </div>
      </div>
      <div style="border-left:1px solid #cde0f5;padding-left:16px;"></div>
    </div>
  </div>

  <!-- ── ITEMS TABLE ── -->
  <div style="border:1px solid #cde0f5;border-radius:8px;overflow:hidden;margin-bottom:10px;">
    <table>
      <thead>
        <tr>
          <th style="background:#0b3a78;color:white;padding:8px 7px;font-size:8px;font-weight:700;width:30px;text-align:center;border-right:1px solid #1a5b9e;">#</th>
          <th style="background:#0b3a78;color:white;padding:8px 10px;font-size:8px;font-weight:700;text-align:left;border-right:1px solid #1a5b9e;">
            Item Description / <span dir="rtl">وصف الصنف</span>
          </th>
          <th style="background:#0b3a78;color:white;padding:8px 7px;font-size:8px;font-weight:700;width:50px;text-align:center;border-right:1px solid #1a5b9e;">
            Qty / <span dir="rtl">الكمية</span>
          </th>
          <th style="background:#0b3a78;color:white;padding:8px 10px;font-size:8px;font-weight:700;text-align:right;width:80px;border-right:1px solid #1a5b9e;">
            Unit Price / <span dir="rtl">سعر الوحدة</span>
          </th>
          <th style="background:#0b3a78;color:white;padding:8px 10px;font-size:8px;font-weight:700;text-align:right;width:70px;border-right:1px solid #1a5b9e;">
            Discount / <span dir="rtl">الخصم</span>
          </th>
          <th style="background:#0b3a78;color:white;padding:8px 10px;font-size:8px;font-weight:700;text-align:right;width:80px;">
            Amount / <span dir="rtl">المبلغ</span>
          </th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        ${fillerRowsHtml}
      </tbody>
    </table>
  </div>

  <!-- ── PAYMENT STATUS (LEFT) + TOTALS (RIGHT) ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px;">
    <!-- Payment Status -->
    <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:10px 14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          ${IC.check}
          <span style="font-size:9.5px;font-weight:800;color:#0b3a78;">Payment Status / <span dir="rtl">حالة الدفع</span></span>
        </div>
        <span style="background:#22c55e;color:white;font-size:8.5px;font-weight:800;padding:2px 8px;border-radius:4px;">PAID</span>
      </div>
      <div style="padding-top:6px;border-top:1px solid #cde0f5;font-size:9px;color:#334155;">
        <div style="font-weight:700;">${cur} ${fmt(totals.paid_amount)} paid on ${dateStr}, 19:42</div>
        <div style="color:#64748b;margin-top:2px;font-size:8px;" dir="rtl">تم استلام المبلغ بتاريخ 19:42, ${dateStr}</div>
      </div>
    </div>
    <!-- Totals -->
    <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5px;color:#475569;">
        <span>Subtotal / <span dir="rtl">المجموع الفرعي</span></span>
        <span style="font-weight:700;color:#0f172a;">${cur} ${fmt(totals.gross_subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:7px 12px;border-bottom:1px solid #e2e8f0;font-size:9.5px;color:#475569;">
        <span>Total / <span dir="rtl">الإجمالي</span></span>
        <span style="font-weight:700;color:#0f172a;">${cur} ${fmt(totals.grand_total)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:9px 12px;background:#0b3a78;color:white;">
        <span style="font-size:9.5px;font-weight:900;">Paid Amount / <span dir="rtl">المبلغ المدفوع</span></span>
        <span style="font-size:12px;font-weight:900;">${cur} ${fmt(totals.paid_amount)}</span>
      </div>
    </div>
  </div>

  <!-- ── AMOUNT IN WORDS ── -->
  <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 12px;margin-bottom:10px;display:flex;align-items:center;gap:10px;">
    <div style="width:26px;height:26px;border-radius:6px;background:#0b3a78;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.dollar.replace(/stroke="#0b3a78"/g, 'stroke="white"')}</div>
    <div>
      <div style="font-size:7.5px;font-weight:700;color:#64748b;">Amount in Words</div>
      <div style="font-size:10.5px;font-weight:900;color:#0b3a78;margin-top:1px;">${amountInWordsEn}</div>
      <div style="font-size:9px;color:#1e3a8a;margin-top:1px;" dir="rtl">${amountInWordsAr}</div>
    </div>
  </div>

  <!-- ── BANK | SCAN TO PAY | TAX/CR DETAILS (3-col) ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:10px;margin-bottom:10px;font-size:9px;">
    <!-- Bank Details -->
    <div class="card">
      <div class="card-title">${IC.building}<span>Bank Details / <span dir="rtl" style="font-weight:600;">تفاصيل البنك</span></span></div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div><span class="lbl">Bank Name / <span dir="rtl">اسم البنك</span> &nbsp;: </span><span class="val">${bank.bank_name || 'Kuwait Finance House'}</span></div>
        <div><span class="lbl">A/C No. / <span dir="rtl">رقم الحساب</span> &nbsp;&nbsp;&nbsp;: </span><span class="val" style="font-family:monospace;">${bank.account_number || '1234 5678 9012'}</span></div>
        <div><span class="lbl">Branch &amp; IFSC / <span dir="rtl">الفرع ورمز التحويل</span> : </span><span class="val">${bank.iban_ifsc || 'Salmiya Branch / KFHKWKWxxx'}</span></div>
      </div>
    </div>
    <!-- Scan to Pay -->
    <div class="card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8px;font-weight:800;color:#0b3a78;margin-bottom:3px;">Scan to Pay / <span dir="rtl">امسح للدفع</span></div>
      <div style="width:56px;height:56px;background:white;border:1px solid #cde0f5;border-radius:6px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg}
      </div>
      <div style="font-size:7px;color:#64748b;margin-bottom:3px;">Pay securely with</div>
      <div style="display:flex;align-items:center;gap:4px;">
        <!-- KNET logo -->
        <span style="background:#005ba4;color:#ffcc00;padding:1px 4px;border-radius:2px;font-size:7px;font-weight:900;letter-spacing:0.5px;">KNET</span>
        <!-- VISA logo -->
        <span style="background:#1a1f71;color:white;padding:1px 4px;border-radius:2px;font-size:7px;font-weight:900;font-style:italic;">VISA</span>
        <!-- Mastercard circles -->
        <span style="display:flex;align-items:center;">
          <span style="width:9px;height:9px;border-radius:50%;background:#eb001b;display:inline-block;"></span>
          <span style="width:9px;height:9px;border-radius:50%;background:#f79e1b;display:inline-block;margin-left:-3px;opacity:0.9;"></span>
        </span>
      </div>
    </div>
    <!-- Tax / CR Details -->
    <div class="card">
      <div class="card-title">${IC.shield}<span>Tax / Commercial Registration Details</span></div>
      <div style="display:flex;flex-direction:column;gap:4px;color:#334155;font-size:8.5px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="color:#64748b;font-size:8px;">Commercial Registration No.</div>
            <div style="font-size:7px;color:#94a3b8;" dir="rtl">الرقم التجاري</div>
          </div>
          <span style="font-weight:900;font-family:monospace;font-size:9.5px;">${crNo}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="color:#64748b;font-size:8px;">Tax Registration No. (CR)</div>
            <div style="font-size:7px;color:#94a3b8;" dir="rtl">الرقم الضريبي</div>
          </div>
          <span style="font-weight:900;font-family:monospace;font-size:9.5px;">${crNo}</span>
        </div>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:4px 6px;display:flex;align-items:center;gap:6px;margin-top:2px;">
          ${IC.checkW.replace('stroke="white"','stroke="#0284c7"')}
          <div>
            <div style="font-size:8px;font-weight:700;color:#0369a1;">VAT: Not Applicable</div>
            <div style="font-size:7px;color:#0284c7;" dir="rtl">الضريبة: غير مطبقة</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── NOTES + DECLARATION ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;font-size:9px;">
    <div class="card">
      <div class="card-title">${IC.file}<span>Notes / <span dir="rtl" style="font-weight:600;">ملاحظات</span></span></div>
      <div style="color:#475569;line-height:1.4;font-size:8px;">
        • Thank you for your business!<br/>
        • If you have any questions about this invoice, please contact us.
      </div>
      <div style="color:#64748b;font-size:7.5px;margin-top:3px;text-align:right;" dir="rtl">• شكراً لثقتكم بنا! في حال وجود أي استفسارات حول الفاتورة، يرجى التواصل معنا.</div>
    </div>
    <div class="card">
      <div class="card-title">${IC.pen}<span>Declaration / <span dir="rtl" style="font-weight:600;">إقرار</span></span></div>
      <div style="color:#475569;line-height:1.4;font-size:8px;">${declaration}</div>
      <div style="color:#64748b;font-size:7.5px;margin-top:3px;text-align:right;" dir="rtl">نقر بأن هذه الفاتورة توضح السعر الفعلي للبضائع الموصوفة وأن جميع البيانات صحيحة ودقيقة.</div>
    </div>
  </div>

  <!-- ── SIGNATURES ── -->
  <div style="background:#f8fbff;border:1px solid #cde0f5;border-radius:8px;padding:8px 14px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9px;margin-bottom:12px;">
    <div>
      <div style="display:flex;align-items:center;gap:4px;font-weight:700;color:#0b3a78;">${IC.pen}<span>Customer's Signature / <span dir="rtl" style="font-weight:400;">توقيع العميل</span></span></div>
      <div style="width:190px;border-bottom:1.5px dotted #94a3b8;margin-top:28px;margin-bottom:3px;"></div>
    </div>
    <div style="text-align:right;">
      <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px;font-weight:700;color:#0b3a78;">${IC.user.replace(/stroke="white"/g,'stroke="#0b3a78"')}<span>Authorised Signatory / <span dir="rtl" style="font-weight:400;">المفوض بالتوقيع</span></span></div>
      <div style="width:190px;border-bottom:1.5px dotted #94a3b8;margin-top:28px;margin-bottom:3px;margin-left:auto;"></div>
    </div>
  </div>

</div><!-- end content -->

<!-- ── FOOTER ── -->
<div style="background:#07264a;color:white;border-radius:6px;padding:9px 16px;display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:700;">
  <div style="display:flex;align-items:center;gap:6px;">
    <div style="width:16px;height:16px;border-radius:3px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;">H</div>
    <span style="font-size:11px;font-weight:900;">Hisabi</span>
  </div>
  <div style="text-align:center;">
    Powering Small &amp; Medium Businesses Across Kuwait &nbsp;&nbsp;|&nbsp;&nbsp; <span style="font-weight:400;opacity:0.85;" dir="rtl">تمكين المشاريع الصغيرة والمتوسطة في الكويت</span>
  </div>
  <div style="font-weight:400;opacity:0.9;">www.hisabi.com</div>
</div>

</div>
</body>
</html>`;
}

// =============================================================================
// MASTER ROUTER
// =============================================================================
function generateInvoiceHTML(invoice, shop) {
    const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
    const country = invoice.country || shop?.country || 'AE';

    const calculation = calculateInvoice({
        items: invoice.items || [],
        shop: { ...shop, country },
        globalDiscount: invoice.discount || 0,
        paidAmount: invoice.paid_amount || 0,
        sellerState: invoice.seller_address_snapshot || shop?.address || '',
        buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
        reverseCharge: invoice.reverse_charge,
    });

    if (country === 'IN') return generateIndiaInvoiceHTML(invoice, shop, calculation);
    if (country === 'KW') return generateKuwaitInvoiceHTML(invoice, shop, calculation);
    return generateUAEInvoiceHTML(invoice, shop, calculation);
}

module.exports = { generateInvoiceHTML, generateUAEInvoiceHTML, generateIndiaInvoiceHTML, generateKuwaitInvoiceHTML };

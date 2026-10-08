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
    mapPin: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    phone:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    globe:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg>`,
    user:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    creditCard:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><rect width="22" height="16" x="1" y="4" rx="2"/><path d="M1 10h22"/></svg>`,
    check:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    checkAmber:`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.4"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    checkW: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    calendar:`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
    clock:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    building:`<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M3 21h18M3 10h18M5 10V6l7-3 7 3v4M9 21v-6h6v6"/></svg>`,
    shield:  `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
    info:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
    file:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
    fileSky: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>`,
    dollar:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    pen:     `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    fileTxt: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#024282" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
};

// ─── Dubai Skyline SVG ─────────────────────────────────────────────────────────
const DUBAI_SVG = `<svg viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:190px;height:65px;display:block;">
  <style>.ds{fill:none;stroke:#38bdf8;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;opacity:0.85;}</style>
  <rect x="75" y="60" width="12" height="25" class="ds" stroke-dasharray="2 2"/>
  <rect x="90" y="55" width="14" height="30" class="ds" stroke-dasharray="2 2"/>
  <rect x="107" y="48" width="15" height="37" class="ds" stroke-dasharray="2 2"/>
  <rect x="125" y="40" width="18" height="45" class="ds"/>
  <rect x="128" y="44" width="12" height="37" class="ds"/>
  <line x1="172" y1="85" x2="172" y2="6" class="ds" stroke-width="1.8"/>
  <polygon points="172,6 170,18 174,18" class="ds"/>
  <rect x="169" y="18" width="6" height="8" class="ds"/>
  <rect x="167" y="26" width="10" height="12" class="ds"/>
  <rect x="165" y="38" width="14" height="15" class="ds"/>
  <rect x="163" y="53" width="18" height="32" class="ds"/>
  <rect x="183" y="42" width="13" height="43" class="ds"/>
  <rect x="198" y="35" width="15" height="50" class="ds"/>
  <line x1="205" y1="35" x2="205" y2="25" class="ds"/>
  <rect x="215" y="48" width="14" height="37" class="ds"/>
  <rect x="231" y="52" width="12" height="33" class="ds"/>
  <path d="M246,85 C246,55 258,45 268,45 L268,85 Z" class="ds" stroke-width="1.4"/>
  <line x1="268" y1="85" x2="268" y2="40" class="ds" stroke-width="1.5"/>
  <path d="M246,85 L268,60" class="ds"/>
  <ellipse cx="268" cy="46" rx="4" ry="1.5" class="ds"/>
  <path d="M285,85 Q286,75 288,68" class="ds"/>
  <path d="M288,68 Q283,63 280,66 M288,68 Q289,61 292,63 M288,68 Q294,66 295,71" class="ds"/>
  <line x1="60" y1="85" x2="310" y2="85" stroke="#93c5fd" stroke-width="1.2"/>
  <line x1="70" y1="87" x2="300" y2="87" stroke="#bae6fd" stroke-width="0.8"/>
  <line x1="120" y1="89" x2="280" y2="89" stroke="#e0f2fe" stroke-width="0.6"/>
</svg>`;

// ─── Kuwait Skyline SVG ────────────────────────────────────────────────────────
const KUWAIT_SVG = `<svg viewBox="0 0 320 90" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:210px;height:65px;display:block;">
  <style>.ks{fill:none;stroke:#38bdf8;stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;opacity:0.85;}</style>
  <rect x="65" y="64" width="12" height="21" class="ks"/>
  <rect x="80" y="56" width="14" height="29" class="ks"/>
  <rect x="96" y="48" width="15" height="37" class="ks"/>
  <rect x="113" y="55" width="12" height="30" class="ks"/>
  <line x1="140" y1="85" x2="140" y2="10" class="ks" stroke-width="1.6"/>
  <ellipse cx="140" cy="38" rx="10" ry="12" class="ks"/>
  <ellipse cx="140" cy="22" rx="5" ry="6" class="ks"/>
  <line x1="156" y1="85" x2="156" y2="26" class="ks" stroke-width="1.4"/>
  <ellipse cx="156" cy="36" rx="7" ry="8" class="ks"/>
  <line x1="168" y1="85" x2="168" y2="40" class="ks" stroke-width="1.2"/>
  <rect x="178" y="46" width="13" height="39" class="ks"/>
  <path d="M193,85 L193,36 Q200,34 205,40 L205,85 Z" class="ks"/>
  <rect x="207" y="52" width="12" height="33" class="ks"/>
  <rect x="221" y="58" width="14" height="27" class="ks"/>
  <rect x="237" y="50" width="13" height="35" class="ks"/>
  <rect x="252" y="62" width="15" height="23" class="ks"/>
  <line x1="55" y1="85" x2="280" y2="85" stroke="#93c5fd" stroke-width="1.2"/>
  <line x1="65" y1="87" x2="270" y2="87" stroke="#bae6fd" stroke-width="0.8"/>
  <line x1="100" y1="89" x2="250" y2="89" stroke="#e0f2fe" stroke-width="0.6"/>
</svg>`;

// ─── Shared BASE CSS ───────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 10px;
    color: #0f172a;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 794px;
    min-height: 1123px;
    height: auto;
    margin: 0 auto;
    background: white;
    padding: 0;
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  @media print {
    body { background: white; }
    .page { margin: 0; width: 100%; min-height: 100%; }
  }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 0; }
  .ar { direction: rtl; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
`;

// =============================================================================
// 1. UAE / DUBAI VAT INVOICE
// =============================================================================
function generateUAEInvoiceHTML(invoice, shop, calculation) {
    const { items, totals, meta } = calculation;
    const cur = meta.currency || 'AED';
    const fmt2 = v => parseFloat(v || 0).toFixed(2);

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const dateStr     = fmtDate(invoice.date);
    const timeStr     = fmtTime(invoice.date);
    const supplyDateStr = fmtDate(invoice.supply_date || invoice.date);

    const sellerName  = invoice.seller_name_snapshot || shop?.name || 'Store';
    const address     = invoice.seller_address_snapshot || shop?.address || 'Dubai, UAE';
    const phone       = invoice.seller_phone_snapshot || shop?.phone || '';
    const email       = invoice.seller_email_snapshot || shop?.email || '';
    const website     = shop?.website || '';
    const logo        = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const trn         = invoice.seller_tax_id_snapshot || shop?.trn || '100000000000003';
    const financeCompany = invoice.finance_company || null;

    const customerName  = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';
    const buyerTrn    = invoice.buyer_tax_id || '';

    const paymentMethod = invoice.payment_method ? invoice.payment_method.toUpperCase() : 'CASH';
    const isPaid      = (totals.due_amount || 0) <= 0;

    const bank        = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const qrData      = invoice.qr_code_data || `https://hisabi.com/verify?inv=${invoice.invoice_number}&trn=${trn}`;
    const qrSvg       = getQRCodeSVG(qrData);
    const declaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const invNo       = 'INV-' + String(invoice.invoice_number || '1').padStart(6, '0');

    const amountInWordsEn = totals.amount_in_words || '';
    const amountInWordsAr = totals.amount_in_words_arabic || getArabicAmountInWords(totals.grand_total, cur);

    const rowsHtml = items.map((item, i) => {
        const taxable = parseFloat(item.taxable_amount || 0);
        const vatRatePercent = item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '0%';
        const vatAmount = parseFloat(item.tax_amount || 0);
        const gross = parseFloat(item.line_total || taxable);
        const disc = parseFloat(item.discount || 0);
        const isOdd = i % 2 === 1;

        return `<tr style="background:${isOdd ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #f1f5f9;font-size:9.5px;">
            <td style="padding:7px 4px;text-align:center;font-weight:700;color:#94a3b8;border-right:1px solid #f1f5f9;width:26px;">${i+1}</td>
            <td style="padding:7px 8px;border-right:1px solid #f1f5f9;">
                <div style="font-weight:700;color:#0f172a;">${item.item_name || ''}</div>
                ${item.item_description ? `<div style="font-size:8.5px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="padding:7px 4px;text-align:center;border-right:1px solid #f1f5f9;width:36px;color:#334155;">${item.quantity || 1}</td>
            <td style="padding:7px 6px;text-align:right;border-right:1px solid #f1f5f9;width:56px;color:#334155;">${fmt2(item.unit_price)}</td>
            <td style="padding:7px 4px;text-align:right;border-right:1px solid #f1f5f9;width:44px;color:#64748b;">${fmt2(disc)}</td>
            <td style="padding:7px 6px;text-align:right;border-right:1px solid #f1f5f9;width:66px;color:#334155;">${fmt2(taxable)}</td>
            <td style="padding:7px 6px;text-align:right;border-right:1px solid #f1f5f9;width:62px;font-weight:700;color:#0f172a;">${fmt2(taxable)}</td>
            <td style="padding:5px 4px;text-align:center;border-right:1px solid #f1f5f9;width:48px;color:#475569;font-size:7.5px;">
                VAT RATE<br/><span style="font-weight:900;color:#0f172a;font-size:8.5px;">(${vatRatePercent})</span>
            </td>
            <td style="padding:7px 6px;text-align:right;border-right:1px solid #f1f5f9;width:56px;color:#475569;">${fmt2(vatAmount)}</td>
            <td style="padding:7px 8px;text-align:right;font-weight:900;color:#0f172a;width:64px;">${fmt2(gross)}</td>
        </tr>`;
    }).join('');

    const logoHtml = logo
        ? `<img src="${logo}" style="width:52px;height:52px;border-radius:12px;object-fit:contain;border:1px solid #e2e8f0;" />`
        : `<div style="width:52px;height:52px;border-radius:12px;background:#024282;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;flex-shrink:0;">${sellerName.charAt(0).toUpperCase()}</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="page" style="padding:28px 28px 20px 28px;">

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
    <!-- Left: Logo + Name -->
    <div style="display:flex;align-items:center;gap:12px;">
      ${logoHtml}
      <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#0f172a;">${sellerName}</span>
    </div>
    <!-- Center: Contact -->
    <div style="display:flex;flex-direction:column;gap:3px;font-size:9.5px;color:#475569;padding-top:2px;">
      ${address ? `<div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#1e293b;">${IC.mapPin}<span>${address}</span></div>` : ''}
      ${phone   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.phone}<span>${phone}</span></div>` : ''}
      ${email   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.mail}<span>${email}</span></div>` : ''}
      ${website ? `<div style="display:flex;align-items:center;gap:6px;">${IC.globe}<span>${website}</span></div>` : ''}
    </div>
    <!-- Right: Dubai Skyline -->
    <div style="display:flex;align-items:center;">
      ${DUBAI_SVG}
    </div>
  </div>

  <!-- ── TITLE + METADATA ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin:14px 0 12px 0;">
    <div>
      <div style="display:flex;align-items:baseline;gap:10px;">
        <span style="font-size:24px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;">TAX INVOICE</span>
        <span style="font-size:20px;font-weight:700;color:#024282;" dir="rtl">فاتورة ضريبية</span>
      </div>
      <div style="font-size:11px;font-weight:700;color:#334155;margin-top:2px;">
        TRN: <span style="font-family:monospace;font-weight:900;">${trn}</span>
      </div>
    </div>
    <!-- 3 Metadata Cards -->
    <div style="display:flex;gap:8px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 12px;text-align:center;min-width:88px;">
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px;">Invoice No.</div>
        <div style="font-size:7.5px;color:#94a3b8;" dir="rtl">رقم الفاتورة</div>
        <div style="font-size:11px;font-weight:900;color:#0f172a;font-family:monospace;margin-top:2px;">${invNo}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 12px;text-align:center;min-width:88px;">
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px;">Issue Date</div>
        <div style="font-size:7.5px;color:#94a3b8;" dir="rtl">تاريخ الإصدار</div>
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-top:2px;">${dateStr}</div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:6px 12px;text-align:center;min-width:88px;">
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px;">Supply Date</div>
        <div style="font-size:7.5px;color:#94a3b8;" dir="rtl">تاريخ التوريد</div>
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-top:2px;">${supplyDateStr}</div>
      </div>
    </div>
  </div>

  <!-- ── BILL TO CARD ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:6px;color:#024282;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
      <div style="width:16px;height:16px;border-radius:50%;background:#024282;display:flex;align-items:center;justify-content:center;">${IC.user}</div>
      <span>Bill To / <span dir="rtl" style="font-weight:400;">المشتري</span></span>
    </div>
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:12px;align-items:start;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <div>
          <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer Name</div>
          <div style="font-size:12px;font-weight:900;color:#0f172a;margin-top:1px;">${customerName}</div>
        </div>
        ${customerAddress ? `<div><div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Address</div><div style="font-size:9.5px;color:#475569;margin-top:1px;">${customerAddress}</div></div>` : ''}
        ${buyerTrn ? `<div><div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">TRN (if applicable)</div><div style="font-size:9.5px;color:#334155;font-family:monospace;font-weight:700;">${buyerTrn}</div></div>` : ''}
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:3px;font-size:9.5px;color:#475569;padding-top:2px;">
        ${customerPhone ? `<div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">${IC.phone.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<span>${customerPhone}</span></div>` : ''}
        ${customerEmail ? `<div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">${IC.mail.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<span>${customerEmail}</span></div>` : ''}
        ${!buyerTrn ? `<div style="font-size:9px;color:#94a3b8;">TRN (if applicable)</div>` : ''}
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE ── -->
  <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px;">
    <table>
      <thead style="background:#024282;color:white;font-weight:700;font-size:8.5px;text-align:center;letter-spacing:0.3px;">
        <tr style="border-bottom:1px solid #1a5b9e;">
          <th style="padding:6px 4px;width:26px;border-right:1px solid #1a5b9e;">#</th>
          <th style="padding:6px 8px;text-align:left;border-right:1px solid #1a5b9e;">
            <div>Item Description</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">وصف المنتج</div>
          </th>
          <th style="padding:6px 4px;width:36px;border-right:1px solid #1a5b9e;">
            <div>Qty</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">الكمية</div>
          </th>
          <th style="padding:6px 6px;text-align:right;width:56px;border-right:1px solid #1a5b9e;">
            <div>Unit Price</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">سعر الوحدة</div>
          </th>
          <th style="padding:6px 4px;text-align:right;width:44px;border-right:1px solid #1a5b9e;">
            <div>Discount</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">الخصم</div>
          </th>
          <th style="padding:6px 6px;text-align:right;width:66px;border-right:1px solid #1a5b9e;">
            <div>Taxable Amount</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">المبلغ الخاضع</div>
          </th>
          <th style="padding:6px 6px;text-align:right;width:62px;border-right:1px solid #1a5b9e;">
            <div>Net Amount</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">المبلغ الصافي</div>
          </th>
          <th style="padding:6px 4px;text-align:center;width:48px;border-right:1px solid #1a5b9e;">
            <div>VAT Rate</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">نسبة الضريبة</div>
          </th>
          <th style="padding:6px 6px;text-align:right;width:56px;border-right:1px solid #1a5b9e;">
            <div>VAT Amount</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">مبلغ الضريبة</div>
          </th>
          <th style="padding:6px 8px;text-align:right;width:64px;">
            <div>Gross Amount</div>
            <div style="font-size:7px;font-weight:400;opacity:0.8;" dir="rtl">المبلغ الإجمالي</div>
          </th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Amount in Words + Totals -->
    <div style="border-top:1px solid #e2e8f0;display:grid;grid-template-columns:7fr 5fr;background:#f8fafc;">
      <!-- Left: Amount in Words -->
      <div style="padding:10px 12px;border-right:1px solid #e2e8f0;display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:8px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.fileSky}</div>
        <div>
          <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px;">Amount in Words / <span dir="rtl">المبلغ كتابة</span></div>
          <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:1px;">${amountInWordsEn}</div>
          ${amountInWordsAr ? `<div style="font-size:9.5px;color:#475569;margin-top:1px;" dir="rtl">${amountInWordsAr}</div>` : ''}
        </div>
      </div>
      <!-- Right: Totals -->
      <div style="display:flex;flex-direction:column;justify-content:space-between;font-size:10px;">
        <div style="padding:8px 12px;display:flex;flex-direction:column;gap:4px;border-bottom:1px solid #e2e8f0;color:#475569;">
          <div style="display:flex;justify-content:space-between;">
            <div><span>Subtotal (${cur})</span><span style="font-size:7.5px;color:#94a3b8;margin-left:4px;" dir="rtl">المجموع الفرعي</span></div>
            <span style="font-weight:700;color:#0f172a;">${fmt2(totals.gross_subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;">
            <div><span>VAT Total (${cur})</span><span style="font-size:7.5px;color:#94a3b8;margin-left:4px;" dir="rtl">إجمالي ضريبة القيمة المضافة</span></div>
            <span style="font-weight:700;color:#0f172a;">${fmt2(totals.tax_total)}</span>
          </div>
        </div>
        <div style="background:#024282;color:white;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.3px;">Grand Total (${cur})</span>
            <span style="font-size:7.5px;opacity:0.8;margin-left:4px;" dir="rtl">المبلغ الإجمالي</span>
          </div>
          <span style="font-size:13.5px;font-weight:900;">${fmt2(totals.grand_total)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── 4-SEGMENT PAYMENT BANNER ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 12px;margin-bottom:12px;font-size:9.5px;">
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="color:#0284c7;">${IC.creditCard}</div>
      <div>
        <div style="font-size:7.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Payment Method</div>
        <div style="font-size:7px;color:#94a3b8;" dir="rtl">طريقة الدفع</div>
        <div style="font-size:10px;font-weight:900;color:#0f172a;margin-top:1px;">${paymentMethod}</div>
        ${financeCompany ? `<div style="font-size:7.5px;font-weight:700;color:#7c3aed;">${financeCompany}</div>` : ''}
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div>${isPaid ? IC.check : IC.checkAmber}</div>
      <div>
        <div style="font-size:7.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Payment Status</div>
        <div style="font-size:7px;color:#94a3b8;" dir="rtl">حالة الدفع</div>
        <span style="display:inline-block;background:${isPaid ? '#dcfce7' : '#fef3c7'};color:${isPaid ? '#166534' : '#92400e'};font-size:8.5px;font-weight:900;padding:1px 6px;border-radius:3px;text-transform:uppercase;margin-top:1px;">
          ${isPaid ? 'Paid / مدفوع' : 'Partial'}
        </span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="color:#0284c7;">${IC.calendar}</div>
      <div>
        <div style="font-size:7.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Payment Date &amp; Time</div>
        <div style="font-size:7px;color:#94a3b8;" dir="rtl">تاريخ ووقت الدفع</div>
        <div style="font-size:10px;font-weight:700;color:#0f172a;margin-top:1px;">${dateStr} ${timeStr}</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:flex-end;text-align:right;">
      <div>
        <div style="font-size:7.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Paid Amount (${cur})</div>
        <div style="font-size:7px;color:#94a3b8;" dir="rtl">المبلغ المدفوع</div>
        <div style="font-size:12px;font-weight:900;color:#0f172a;margin-top:1px;">${fmt2(totals.paid_amount)}</div>
      </div>
    </div>
  </div>

  <!-- ── 3-COLUMN: BANK | QR | QUERIES ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:10px;margin-bottom:12px;font-size:9.5px;">
    <!-- Bank Details -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        ${IC.building}
        <span>Bank Details / <span dir="rtl" style="font-weight:400;font-size:8.5px;">تفاصيل الحساب البنكي</span></span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div><span style="color:#94a3b8;">Bank Name : </span><span style="font-weight:700;">${bank.bank_name || '—'}</span></div>
        <div><span style="color:#94a3b8;">A/C No. : </span><span style="font-weight:700;font-family:monospace;">${bank.account_number || '—'}</span></div>
        <div><span style="color:#94a3b8;">Branch &amp; IFSC : </span><span style="font-weight:700;font-family:monospace;">${bank.iban_ifsc || '—'}</span></div>
      </div>
    </div>
    <!-- QR / Payment -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:4px;">QR / Payment</div>
      <div style="width:58px;height:58px;background:white;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg}
      </div>
      <div style="font-size:7.5px;font-weight:700;color:#64748b;">Scan to Pay via UPI</div>
      <div style="margin-top:2px;"><span style="background:#5f259f;color:white;padding:1px 6px;border-radius:2px;font-size:7px;font-weight:900;">UPI</span></div>
    </div>
    <!-- For Any Queries -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        <div style="width:14px;height:14px;border-radius:50%;background:#024282;color:white;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:900;">i</div>
        <span>For any queries, contact us</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        ${phone ? `<div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span style="font-weight:700;">${phone}</span></div>` : ''}
        ${email ? `<div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span style="font-weight:700;">${email}</span></div>` : ''}
        ${!phone && !email ? `<div style="color:#94a3b8;font-size:8px;">Contact details not set</div>` : ''}
        <div style="font-size:8px;color:#64748b;line-height:1.3;margin-top:2px;">Scan QR or pay via UPI for faster and safer transactions.</div>
      </div>
    </div>
  </div>

  <!-- ── REVERSE CHARGE NOTICE ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:7px 12px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;font-size:9.5px;">
    <div style="display:flex;align-items:center;gap:6px;color:#334155;">
      ${IC.info}
      <span>
        <span style="font-weight:700;">Reverse Charge / Special Tax Treatment (if applicable)</span>
        <span style="font-size:8px;color:#94a3b8;margin-left:6px;" dir="rtl">المعاملة الضريبية / معاملة خاصة (إن وجد)</span>
      </span>
    </div>
    <span style="color:#94a3b8;font-family:monospace;font-size:11px;">—</span>
  </div>

  <!-- ── DECLARATION & SIGNATURE ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9.5px;">
    <div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
        ${IC.file}
        <span style="font-size:9px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.3px;">Declaration</span>
      </div>
      <div style="color:#475569;line-height:1.4;font-size:9px;">${declaration}</div>
      <div style="padding-top:40px;">
        <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-bottom:3px;"></div>
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer's Seal &amp; Signature</div>
      </div>
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;">
      <div style="font-weight:900;text-transform:uppercase;color:#0f172a;font-size:10px;">For ${sellerName}</div>
      <div>
        <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-bottom:3px;"></div>
        <div style="font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;">Authorised Signatory</div>
      </div>
    </div>
  </div>

  <!-- ── FOOTER BAR ── -->
  <div style="margin-top:20px;background:#024282;color:white;border-radius:8px;padding:9px 16px;display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:700;">
    <span>Thank you for your business!</span>
    <span style="opacity:0.85;font-weight:400;">If you have any questions about this invoice, please contact us.</span>
    <div style="display:flex;align-items:center;gap:5px;">
      <div style="width:15px;height:15px;border-radius:3px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:8.5px;font-weight:900;">H</div>
      <span>Powered by Hisabi</span>
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

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const address    = invoice.seller_address_snapshot || shop?.address || '';
    const phone      = invoice.seller_phone_snapshot || shop?.phone || '';
    const email      = invoice.seller_email_snapshot || shop?.email || '';
    const logo       = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const gstin      = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXXXX]';
    const financeCompany = invoice.finance_company || null;

    const custName   = invoice.customer_name || 'Walk-in Customer';
    const custPhone  = invoice.customer_phone || '';
    const custEmail  = invoice.customer_email || '';
    const custAddr   = invoice.customer_address || '';
    const custGstin  = invoice.buyer_tax_id || '';

    const pmtMethod  = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid     = (totals.due_amount || 0) <= 0;

    const bank       = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {});

    const upiId      = shop?.upi_id || invoice.upi_id || null;
    const realQrData = invoice.qr_code_data || (upiId
        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`
        : null);
    const qrSvg      = realQrData ? getQRCodeSVG(realQrData) : '';

    const declaration= invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';
    const invNo      = String(invoice.invoice_number || '1').padStart(4, '0');
    const amountInWords = totals.amount_in_words || '';

    // Summary totals
    const taxableTotal = parseFloat(totals.taxable_total || totals.gross_subtotal || 0);
    const totalCGST    = parseFloat(totals.cgst_total || 0);
    const totalSGST    = parseFloat(totals.sgst_total || 0);
    const totalIGST    = parseFloat(totals.igst_total || 0);
    const totalTax     = parseFloat(totals.tax_total || 0);

    // Item rows
    const rowsHtml = items.map((item, i) => {
        const mrp    = item.mrp ? parseFloat(item.mrp) : null;
        const rate   = parseFloat(item.unit_price || 0);
        const disc   = parseFloat(item.discount || 0);
        const taxV   = parseFloat(item.taxable_amount || rate * (item.quantity || 1));
        const gstPct = item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—';
        const cgst   = parseFloat(item.cgst_amount || 0);
        const sgst   = parseFloat(item.sgst_amount || 0);
        const total  = parseFloat(item.line_total || taxV);
        const qty    = `${item.quantity || 1} / ${item.unit || 'Nos'}`;
        const hsn    = item.hsn_sac || '—';
        const isOdd  = i % 2 === 1;

        return `<tr style="background:${isOdd ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #f1f5f9;font-size:9.5px;">
            <td style="padding:6px 4px;text-align:center;color:#94a3b8;font-weight:700;border-right:1px solid #f1f5f9;width:28px;">${i+1}</td>
            <td style="padding:6px 4px;text-align:center;color:#64748b;font-family:monospace;border-right:1px solid #f1f5f9;width:56px;font-size:8.5px;">${hsn}</td>
            <td style="padding:6px 8px;border-right:1px solid #f1f5f9;">
                <div style="font-weight:700;color:#0f172a;">${item.item_name || ''}</div>
                ${item.item_description ? `<div style="font-size:8.5px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="padding:6px 4px;text-align:center;border-right:1px solid #f1f5f9;width:54px;color:#334155;font-weight:500;">${qty}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:46px;color:#64748b;font-weight:500;">${mrp !== null ? fmt2(mrp) : '—'}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:48px;color:#334155;font-weight:500;">${fmt2(rate)}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:46px;color:#64748b;font-weight:500;">${fmt2(disc)}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:56px;font-weight:700;color:#0f172a;">${fmt2(taxV)}</td>
            <td style="padding:6px 4px;text-align:center;border-right:1px solid #f1f5f9;width:40px;color:#334155;font-weight:500;">${gstPct}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:44px;color:#334155;">${cgst > 0 ? fmt2(cgst) : '—'}</td>
            <td style="padding:6px 4px;text-align:right;border-right:1px solid #f1f5f9;width:44px;color:#334155;">${sgst > 0 ? fmt2(sgst) : '—'}</td>
            <td style="padding:6px 6px;text-align:right;font-weight:900;color:#0f172a;width:56px;">${fmt2(total)}</td>
        </tr>`;
    }).join('');

    const logoHtml = logo
        ? `<img src="${logo}" style="width:40px;height:40px;border-radius:8px;object-fit:contain;border:1px solid #e2e8f0;" />`
        : `<div style="width:40px;height:40px;border-radius:8px;background:#024282;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:20px;">${sellerName.charAt(0).toUpperCase()}</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="page">

  <!-- ── HEADER ── -->
  <div style="display:flex;align-items:stretch;min-height:110px;position:relative;">
    <!-- Left: Logo + Name + Contacts -->
    <div style="flex:1;padding:26px 20px 16px 28px;display:flex;flex-direction:column;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        ${logoHtml}
        <span style="font-size:20px;font-weight:900;letter-spacing:-0.3px;color:#0f172a;">${sellerName}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;font-size:10px;color:#475569;margin-top:8px;">
        ${address ? `<div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#1e293b;">${IC.mapPin}<span>${address}</span></div>` : ''}
        ${phone   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.phone}<span>${phone}</span></div>` : ''}
        ${email   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.mail}<span>${email}</span></div>` : ''}
      </div>
    </div>
    <!-- Center: GSTIN -->
    <div style="display:flex;flex-direction:column;justify-content:center;padding:0 20px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;min-width:160px;">
      <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;display:block;">GSTIN</span>
      <span style="font-weight:900;color:#1e293b;font-size:10px;letter-spacing:0.3px;margin-top:2px;">GSTIN NO: ${gstin}</span>
    </div>
    <!-- Right: Title + Metadata -->
    <div style="position:relative;display:flex;flex-direction:column;justify-content:center;padding:22px 28px 16px 20px;text-align:right;min-width:200px;">
      <!-- Decorative triangle top-right -->
      <div style="position:absolute;top:0;right:0;width:80px;height:80px;overflow:hidden;z-index:1;pointer-events:none;">
        <div style="position:absolute;top:0;right:0;width:0;height:0;border-style:solid;border-width:0 80px 80px 0;border-color:transparent #024282 transparent transparent;"></div>
      </div>
      <h1 style="font-size:20px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;margin:0;position:relative;z-index:2;">TAX INVOICE</h1>
      <p style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin:0 0 8px 0;position:relative;z-index:2;">(GST INVOICE)</p>
      <div style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;position:relative;z-index:2;">
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <span style="color:#94a3b8;">Invoice No.</span>
          <span style="font-weight:700;color:#0f172a;width:95px;text-align:left;">: #${invNo}</span>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <span style="color:#94a3b8;">Date</span>
          <span style="font-weight:700;color:#0f172a;width:95px;text-align:left;">: ${dateStr}</span>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <span style="color:#94a3b8;">Time</span>
          <span style="font-weight:700;color:#0f172a;width:95px;text-align:left;">: ${timeStr}</span>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <span style="color:#94a3b8;">Payment Method</span>
          <span style="font-weight:700;color:#0f172a;width:95px;text-align:left;display:flex;align-items:center;gap:4px;">: ${IC.creditCard} ${pmtMethod}</span>
        </div>
        ${financeCompany ? `<div style="display:flex;justify-content:flex-end;gap:8px;"><span style="color:#94a3b8;">Finance Co.</span><span style="font-weight:700;color:#7c3aed;width:95px;text-align:left;">: ${financeCompany}</span></div>` : ''}
      </div>
    </div>
  </div>

  <div style="padding:0 28px 20px 28px;">

  <!-- ── BILL TO CARD ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin:12px 0;">
    <div style="display:flex;align-items:center;gap:6px;font-weight:900;color:#024282;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
      <div style="width:16px;height:16px;border-radius:50%;background:#024282;display:flex;align-items:center;justify-content:center;">${IC.user}</div>
      <span>BILL TO</span>
    </div>
    <div style="display:grid;grid-template-columns:7fr 5fr;gap:12px;align-items:start;">
      <div style="display:flex;flex-direction:column;gap:3px;">
        <div>
          <div style="font-size:8.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer Name</div>
          <div style="font-size:12px;font-weight:900;color:#0f172a;margin-top:1px;">${custName}</div>
        </div>
        ${custAddr ? `<div style="display:flex;align-items:flex-start;gap:4px;margin-top:2px;">${IC.mapPin.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<div><div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Address</div><div style="font-size:9.5px;color:#475569;">${custAddr}</div></div></div>` : `<div style="font-size:9.5px;color:#94a3b8;font-style:italic;">No address provided</div>`}
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:3px;font-size:9.5px;color:#475569;">
        ${custPhone ? `<div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">${IC.phone.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<span><span style="color:#94a3b8;">Phone Number :</span> ${custPhone}</span></div>` : ''}
        ${custEmail ? `<div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">${IC.mail.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<span><span style="color:#94a3b8;">Email :</span> ${custEmail}</span></div>` : ''}
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;">${IC.fileTxt.replace(/stroke="#024282"/g,'stroke="#94a3b8"')}<span><span style="color:#94a3b8;">Customer GSTIN No :</span> ${custGstin || '—'}</span></div>
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE + GST SUMMARY + TOTALS ── -->
  <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px;">
    <table>
      <thead style="background:#024282;color:white;font-weight:700;font-size:8.5px;text-transform:uppercase;letter-spacing:0.3px;">
        <tr>
          <th style="padding:7px 5px;text-align:center;width:28px;border-right:1px solid #1a5b9e;">S.No.</th>
          <th style="padding:7px 5px;text-align:center;width:56px;border-right:1px solid #1a5b9e;">HSN/SAC</th>
          <th style="padding:7px 8px;text-align:left;border-right:1px solid #1a5b9e;">Description of Goods / Services</th>
          <th style="padding:7px 5px;text-align:center;width:56px;border-right:1px solid #1a5b9e;">Qty / Unit</th>
          <th style="padding:7px 5px;text-align:right;width:46px;border-right:1px solid #1a5b9e;">MRP (₹)</th>
          <th style="padding:7px 5px;text-align:right;width:48px;border-right:1px solid #1a5b9e;">Rate (₹)</th>
          <th style="padding:7px 5px;text-align:right;width:46px;border-right:1px solid #1a5b9e;">Disc (₹)</th>
          <th style="padding:7px 5px;text-align:right;width:56px;border-right:1px solid #1a5b9e;">Taxable (₹)</th>
          <th style="padding:7px 4px;text-align:center;width:40px;border-right:1px solid #1a5b9e;">GST%</th>
          <th style="padding:3px 2px;text-align:center;width:88px;border-right:1px solid #1a5b9e;">
            <div style="border-bottom:1px solid #1a5b9e;padding-bottom:2px;font-size:7.5px;">Tax Amount (₹)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;padding-top:2px;font-size:7px;"><span>CGST</span><span style="border-left:1px solid #1a5b9e;">SGST</span></div>
          </th>
          <th style="padding:7px 6px;text-align:right;width:56px;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- GST TAX SUMMARY + TOTALS -->
    <div style="border-top:1px solid #e2e8f0;display:grid;grid-template-columns:7fr 5fr;background:#f8fafc;">
      <!-- Left: GST Summary -->
      <div style="padding:10px 12px;border-right:1px solid #e2e8f0;">
        <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">GST TAX SUMMARY</div>
        <table style="font-size:8px;">
          <thead>
            <tr style="border-bottom:1px solid #e2e8f0;color:#64748b;font-weight:700;text-transform:uppercase;">
              <th style="padding:2px 4px;text-align:left;">Taxable (₹)</th>
              <th style="padding:2px 4px;text-align:right;">CGST (₹)</th>
              <th style="padding:2px 4px;text-align:right;">SGST (₹)</th>
              <th style="padding:2px 4px;text-align:right;">IGST (₹)</th>
              <th style="padding:2px 4px;text-align:right;color:#024282;">Total Tax (₹)</th>
            </tr>
          </thead>
          <tbody style="font-weight:700;color:#0f172a;">
            <tr>
              <td style="padding:4px;">${fmt2(taxableTotal)}</td>
              <td style="padding:4px;text-align:right;">${fmt2(totalCGST)}</td>
              <td style="padding:4px;text-align:right;">${fmt2(totalSGST)}</td>
              <td style="padding:4px;text-align:right;">${fmt2(totalIGST)}</td>
              <td style="padding:4px;text-align:right;font-weight:900;color:#024282;">${fmt2(totalTax)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Right: Totals -->
      <div style="display:flex;flex-direction:column;justify-content:space-between;font-size:10px;">
        <div style="padding:8px 12px;display:flex;flex-direction:column;gap:4px;border-bottom:1px solid #e2e8f0;color:#475569;">
          <div style="display:flex;justify-content:space-between;">
            <span>Subtotal</span>
            <span style="font-weight:700;color:#0f172a;">₹ ${fmt2(totals.gross_subtotal)}</span>
          </div>
          ${parseFloat(totals.global_discount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Discount</span><span style="font-weight:700;color:#dc2626;">₹ ${fmt2(totals.global_discount)}</span></div>` : ''}
          ${parseFloat(totals.round_off || 0) !== 0 ? `<div style="display:flex;justify-content:space-between;"><span>Round Off</span><span style="font-weight:700;color:#0f172a;">₹ ${fmt2(totals.round_off)}</span></div>` : ''}
        </div>
        <div style="padding:9px 12px;display:flex;justify-content:space-between;align-items:center;background:#024282;color:white;">
          <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">Grand Total</span>
          <span style="font-size:14px;font-weight:900;">₹ ${fmt2(totals.grand_total)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- ── AMOUNT IN WORDS + PAYMENT STATUS ── -->
  <div style="display:grid;grid-template-columns:7fr 5fr;gap:12px;margin-bottom:14px;">
    <!-- Amount in Words -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;border-radius:8px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.fileSky}</div>
      <div>
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Amount in Words</div>
        <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:2px;">${amountInWords}</div>
      </div>
    </div>
    <!-- Payment Status -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:8px;">
        ${isPaid ? IC.check : IC.checkAmber}
        <div>
          <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Payment Status</div>
          <span style="display:inline-block;background:${isPaid ? '#dcfce7' : '#fef3c7'};color:${isPaid ? '#166534' : '#92400e'};font-size:9.5px;font-weight:900;padding:2px 8px;border-radius:4px;text-transform:uppercase;margin-top:2px;">
            ${isPaid ? 'PAID' : 'PARTIAL'}
          </span>
        </div>
      </div>
      <div style="text-align:right;font-size:10px;">
        <div><span style="color:#94a3b8;">Paid Amount :</span> <span style="font-weight:700;color:#0f172a;">₹ ${fmt2(totals.paid_amount)}</span></div>
        <div><span style="color:#94a3b8;">Balance Due :</span> <span style="font-weight:700;color:#dc2626;">₹ ${fmt2(totals.due_amount)}</span></div>
      </div>
    </div>
  </div>

  <!-- ── 3-CARD ROW: BANK | UPI | CONTACT ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:12px;margin-bottom:14px;font-size:10px;">
    <!-- Bank Details -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        ${IC.building}<span>Bank Details</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div><span style="color:#94a3b8;">Bank Name :</span> <span style="font-weight:700;">${bank.bank_name || '[BANK NAME]'}</span></div>
        <div><span style="color:#94a3b8;">A/c No. :</span> <span style="font-weight:700;font-family:monospace;">${bank.account_number || '[ACCOUNT NO.]'}</span></div>
        <div><span style="color:#94a3b8;">Branch &amp; IFSC :</span> <span style="font-weight:700;font-family:monospace;">${bank.iban_ifsc || '[BRANCH NAME] &amp; [IFSC CODE]'}</span></div>
      </div>
    </div>
    <!-- UPI Payment -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8.5px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">UPI Payment</div>
      <div style="width:62px;height:62px;background:white;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg || `<div style="font-size:7px;color:#94a3b8;text-align:center;">UPI Not<br/>Configured</div>`}
      </div>
      <div style="font-size:7.5px;color:#64748b;font-weight:700;">${realQrData ? 'Scan to Pay via UPI' : 'UPI Not Configured'}</div>
      ${realQrData ? `<div style="margin-top:3px;background:#5f259f;color:white;padding:1px 8px;border-radius:3px;font-size:7px;font-weight:900;letter-spacing:1px;">UPI ▸</div>` : ''}
    </div>
    <!-- Contact -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        ${IC.shield}<span>For any queries, contact us</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        ${phone ? `<div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span style="font-weight:700;">${phone}</span></div>` : '<div style="color:#94a3b8;font-size:9px;">[PHONE NUMBER]</div>'}
        ${email ? `<div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span style="font-weight:700;">${email}</span></div>` : '<div style="color:#94a3b8;font-size:9px;">[EMAIL ID]</div>'}
        <div style="font-size:8px;color:#64748b;line-height:1.4;margin-top:2px;">Scan QR or pay via UPI for faster and safer transactions.</div>
      </div>
    </div>
  </div>

  <!-- ── DECLARATION + SIGNATURE ── -->
  <div style="display:grid;grid-template-columns:7fr 5fr;gap:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:10px;">
    <div>
      <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
        ${IC.file}
        <span style="font-size:8.5px;font-weight:900;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">DECLARATION</span>
      </div>
      <div style="color:#475569;line-height:1.5;font-size:9px;">${declaration}</div>
      <div style="padding-top:48px;">
        <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-bottom:3px;"></div>
        <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Customer's Seal &amp; Signature</div>
      </div>
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;">
      <div style="font-weight:900;text-transform:uppercase;color:#0f172a;font-size:10px;">For ${sellerName}</div>
      <div>
        <div style="width:180px;border-bottom:1px solid #cbd5e1;margin-bottom:3px;"></div>
        <div style="font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;">Authorised Signatory</div>
      </div>
    </div>
  </div>

  </div><!-- end inner padding -->

  <!-- ── FOOTER BAR ── -->
  <div style="background:#024282;color:white;padding:12px 28px;display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:700;margin-top:auto;">
    <span>Thank you for your business!</span>
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="font-weight:400;opacity:0.85;">Powered by</span>
      <div style="width:16px;height:16px;border-radius:3px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;">H</div>
      <span><b>Hisabi</b></span>
    </div>
    <span style="font-weight:400;opacity:0.8;">Modern POS &amp; Inventory for Growing Businesses</span>
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
    const decimals = meta.currency_decimals !== undefined ? meta.currency_decimals : (cur === 'KWD' ? 3 : 2);
    const fmt      = v => parseFloat(v || 0).toFixed(decimals);

    const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });

    const dateStr    = fmtDate(invoice.date);
    const timeStr    = fmtTime(invoice.date);

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const address    = invoice.seller_address_snapshot || shop?.address || 'Kuwait';
    const phone      = invoice.seller_phone_snapshot || shop?.phone || '';
    const email      = invoice.seller_email_snapshot || shop?.email || '';
    const website    = shop?.website || '';
    const logo       = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const crNo       = shop?.cr_number || invoice.seller_tax_id_snapshot || '1234567';
    const financeCompany = invoice.finance_company || null;

    const custName   = invoice.customer_name || 'Walk-in Customer';
    const custPhone  = invoice.customer_phone || '';
    const custEmail  = invoice.customer_email || '';
    const custAddr   = invoice.customer_address || '';

    const pmtMethod  = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid     = (totals.due_amount || 0) <= 0;

    const bank       = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name, account_number: shop.bank_account_number, iban_ifsc: shop.bank_iban_ifsc
    } : {
        bank_name: 'Kuwait Finance House',
        account_number: '1234 5678 9012',
        iban_ifsc: 'Salmiya Branch / KFHKWKWXXX'
    });
    const qrData     = invoice.qr_code_data || `https://knet.com.kw/pay?inv=${invoice.invoice_number}&amt=${totals.grand_total}`;
    const qrSvg      = getQRCodeSVG(qrData);
    const notes      = invoice.notes || shop?.invoice_notes || '';
    const declaration= invoice.declaration || shop?.invoice_declaration || '';
    const invNo      = '#INV-' + String(invoice.invoice_number || '1').padStart(6, '0');
    const amountInWordsEn = totals.amount_in_words || '';
    const amountInWordsAr = totals.amount_in_words_arabic || getArabicAmountInWords(totals.grand_total, cur);

    // Item rows
    const rowsHtml = items.map((item, i) => {
        const disc  = parseFloat(item.discount || 0);
        const total = parseFloat(item.line_total || item.unit_price * (item.quantity || 1));
        const isOdd = i % 2 === 1;

        return `<tr style="background:${isOdd ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #f1f5f9;font-size:9.5px;">
            <td style="padding:8px 6px;text-align:center;color:#94a3b8;font-weight:700;border-right:1px solid #f1f5f9;width:30px;">${i+1}</td>
            <td style="padding:8px 10px;border-right:1px solid #f1f5f9;">
                <div style="font-weight:700;color:#0f172a;">${item.item_name || ''}</div>
                ${item.item_description ? `<div style="font-size:8.5px;color:#94a3b8;margin-top:1px;">${item.item_description}</div>` : ''}
            </td>
            <td style="padding:8px 6px;text-align:center;border-right:1px solid #f1f5f9;width:50px;color:#334155;font-weight:500;">${item.quantity || 1}</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #f1f5f9;width:80px;color:#334155;font-weight:500;">${fmt(item.unit_price)}</td>
            <td style="padding:8px 8px;text-align:right;border-right:1px solid #f1f5f9;width:70px;color:#64748b;font-weight:500;">${fmt(disc)}</td>
            <td style="padding:8px 8px;text-align:right;font-weight:900;color:#0f172a;width:80px;">${fmt(total)}</td>
        </tr>`;
    }).join('');

    const logoHtml = logo
        ? `<img src="${logo}" style="width:48px;height:48px;border-radius:12px;object-fit:contain;border:1px solid #e2e8f0;" />`
        : `<div style="width:48px;height:48px;border-radius:12px;background:#024282;display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;flex-shrink:0;">${sellerName.charAt(0).toUpperCase()}</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Tax Invoice - ${sellerName}</title>
<style>
${BASE_CSS}
</style>
</head>
<body>
<div class="page" style="padding:28px 28px 20px 28px;">

  <!-- ── HEADER ── -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
    <!-- Left: Store Logo & Details -->
    <div style="display:flex;align-items:flex-start;gap:14px;max-width:52%;">
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logoHtml}
          <span style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.3px;">${sellerName}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;font-size:9.5px;color:#475569;padding-left:2px;">
          ${address ? `<div style="display:flex;align-items:center;gap:6px;font-weight:700;color:#1e293b;">${IC.mapPin}<span>${address}</span></div>` : ''}
          ${phone   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.phone}<span>${phone}</span></div>` : ''}
          ${email   ? `<div style="display:flex;align-items:center;gap:6px;">${IC.mail}<span>${email}</span></div>` : ''}
          ${website ? `<div style="display:flex;align-items:center;gap:6px;">${IC.globe}<span>${website}</span></div>` : ''}
        </div>
      </div>
      <div style="width:1px;height:88px;background:#e2e8f0;margin-left:8px;flex-shrink:0;"></div>
    </div>
    <!-- Right: Kuwait Skyline & Title -->
    <div style="display:flex;flex-direction:column;align-items:flex-end;">
      ${KUWAIT_SVG}
      <div style="text-align:right;margin-top:4px;">
        <div style="font-size:11px;font-weight:700;color:#024282;" dir="rtl">فاتورة ضريبية</div>
        <h1 style="font-size:22px;font-weight:900;color:#024282;text-transform:uppercase;letter-spacing:0.5px;margin:0;line-height:1;">TAX INVOICE</h1>
        <span style="font-size:9px;color:#64748b;font-weight:500;display:block;margin-top:2px;">Simpler. Smarter. Together.</span>
      </div>
    </div>
  </div>

  <!-- ── 4 METADATA TILES ── -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;display:flex;align-items:center;gap:8px;">
      <div style="width:28px;height:28px;border-radius:8px;background:#024282;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.fileTxt.replace(/stroke="#024282"/g,'stroke="white"')}</div>
      <div>
        <div style="font-size:8px;color:#94a3b8;font-weight:700;">Invoice No. / <span dir="rtl">رقم الفاتورة</span></div>
        <div style="font-size:11px;font-weight:900;color:#0f172a;font-family:monospace;margin-top:1px;">${invNo}</div>
      </div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;display:flex;align-items:center;gap:8px;">
      <div style="width:28px;height:28px;border-radius:8px;background:#024282;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.calendar.replace(/stroke="#024282"/g,'stroke="white"')}</div>
      <div>
        <div style="font-size:8px;color:#94a3b8;font-weight:700;">Date / <span dir="rtl">التاريخ</span></div>
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-top:1px;">${dateStr}</div>
      </div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;display:flex;align-items:center;gap:8px;">
      <div style="width:28px;height:28px;border-radius:8px;background:#024282;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.clock.replace(/stroke="#024282"/g,'stroke="white"')}</div>
      <div>
        <div style="font-size:8px;color:#94a3b8;font-weight:700;">Time / <span dir="rtl">الوقت</span></div>
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-top:1px;">${timeStr}</div>
      </div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px;display:flex;align-items:center;gap:8px;">
      <div style="width:28px;height:28px;border-radius:8px;background:#024282;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.creditCard.replace(/stroke="#024282"/g,'stroke="white"')}</div>
      <div>
        <div style="font-size:8px;color:#94a3b8;font-weight:700;">Payment Method / <span dir="rtl">طريقة الدفع</span></div>
        <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:1px;">${pmtMethod}</div>
        ${financeCompany ? `<div style="font-size:7.5px;font-weight:700;color:#7c3aed;">${financeCompany}</div>` : ''}
      </div>
    </div>
  </div>

  <!-- ── BILL TO CARD ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;margin-bottom:12px;">
    <div style="display:flex;align-items:center;gap:6px;font-weight:900;color:#024282;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
      <div style="width:16px;height:16px;border-radius:50%;background:#024282;display:flex;align-items:center;justify-content:center;">${IC.user}</div>
      <span>Bill To / <span dir="rtl" style="font-weight:400;">العميل</span></span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div>
        <div style="font-size:12px;font-weight:900;color:#0f172a;">${custName}</div>
        <div style="margin-top:4px;display:flex;flex-direction:column;gap:2px;font-size:9.5px;color:#475569;">
          ${custPhone ? `<div style="display:flex;align-items:center;gap:5px;">${IC.phone}<span>${custPhone}</span></div>` : ''}
          ${custEmail ? `<div style="display:flex;align-items:center;gap:5px;">${IC.mail}<span>${custEmail}</span></div>` : ''}
          ${custAddr ? `<div style="display:flex;align-items:flex-start;gap:5px;">${IC.mapPin}<span>${custAddr}</span></div>` : ''}
        </div>
      </div>
      <div style="border-left:1px solid #e2e8f0;padding-left:14px;display:flex;flex-direction:column;justify-content:center;font-size:9.5px;color:#475569;">
        ${invoice.customer_civil_id ? `<div><span style="color:#94a3b8;">Civil ID / الرقم المدني: </span><span style="font-weight:700;color:#0f172a;font-family:monospace;">${invoice.customer_civil_id}</span></div>` : `<div style="color:#94a3b8;font-size:9px;font-style:italic;">Commercial / Retail Customer</div>`}
      </div>
    </div>
  </div>

  <!-- ── ITEMS TABLE (6 COLUMNS) ── -->
  <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:12px;">
    <table>
      <thead style="background:#024282;color:white;font-weight:700;font-size:8.5px;letter-spacing:0.3px;">
        <tr style="border-bottom:1px solid #1a5b9e;">
          <th style="padding:8px 6px;text-align:center;width:30px;border-right:1px solid #1a5b9e;">#</th>
          <th style="padding:8px 10px;text-align:left;border-right:1px solid #1a5b9e;">
            Item Description / <span dir="rtl" style="font-weight:400;">وصف الصنف</span>
          </th>
          <th style="padding:8px 6px;text-align:center;width:50px;border-right:1px solid #1a5b9e;">
            Qty / <span dir="rtl" style="font-weight:400;">الكمية</span>
          </th>
          <th style="padding:8px 8px;text-align:right;width:80px;border-right:1px solid #1a5b9e;">
            Unit Price / <span dir="rtl" style="font-weight:400;">سعر الوحدة</span>
          </th>
          <th style="padding:8px 8px;text-align:right;width:70px;border-right:1px solid #1a5b9e;">
            Discount / <span dir="rtl" style="font-weight:400;">الخصم</span>
          </th>
          <th style="padding:8px 8px;text-align:right;width:80px;">
            Amount / <span dir="rtl" style="font-weight:400;">المبلغ</span>
          </th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- ── PAYMENT STATUS (LEFT) & TOTALS (RIGHT) ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
    <!-- Left: Payment Status -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;display:flex;flex-direction:column;justify-content:space-between;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:6px;">
          ${isPaid ? IC.check : IC.checkAmber}
          <span style="font-size:10px;font-weight:900;color:#0f172a;">
            Payment Status / <span dir="rtl" style="font-weight:400;">حالة الدفع</span>
          </span>
        </div>
        <span style="background:${isPaid ? '#22c55e' : '#f59e0b'};color:white;font-size:8.5px;font-weight:900;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:0.3px;">
          ${isPaid ? 'PAID' : 'PARTIAL'}
        </span>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:9.5px;">
        <div style="font-weight:700;color:#0f172a;">${cur} ${fmt(totals.paid_amount)} paid on ${dateStr}, ${timeStr}</div>
        <div style="font-size:8.5px;color:#64748b;margin-top:2px;" dir="rtl">تم استلام المبلغ بتاريخ ${timeStr}, ${dateStr}</div>
      </div>
    </div>
    <!-- Right: Totals -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;font-size:10px;">
      <div style="padding:8px 12px;display:flex;flex-direction:column;gap:5px;color:#475569;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>Subtotal / <span dir="rtl" style="font-weight:400;">المجموع الفرعي</span></span>
          <span style="font-weight:700;color:#0f172a;">${cur} ${fmt(totals.gross_subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>Total / <span dir="rtl" style="font-weight:400;">الإجمالي</span></span>
          <span style="font-weight:700;color:#0f172a;">${cur} ${fmt(totals.grand_total)}</span>
        </div>
      </div>
      <div style="background:#024282;color:white;padding:9px 12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.3px;">Paid Amount / <span dir="rtl" style="font-weight:400;">المبلغ المدفوع</span></span>
        <span style="font-size:13.5px;font-weight:900;">${cur} ${fmt(totals.paid_amount)}</span>
      </div>
    </div>
  </div>

  <!-- ── AMOUNT IN WORDS (STANDALONE) ── -->
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;gap:10px;">
    <div style="width:28px;height:28px;border-radius:8px;background:#024282;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${IC.file.replace(/stroke="#024282"/g,'stroke="white"')}</div>
    <div>
      <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.3px;">Amount in Words</div>
      <div style="font-size:11px;font-weight:900;color:#0f172a;margin-top:1px;">${amountInWordsEn}</div>
      ${amountInWordsAr ? `<div style="font-size:9.5px;color:#475569;margin-top:1px;" dir="rtl">${amountInWordsAr}</div>` : ''}
    </div>
  </div>

  <!-- ── 3-CARD ROW: BANK | SCAN TO PAY | TAX / CR ── -->
  <div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:10px;margin-bottom:12px;font-size:9.5px;">
    <!-- Bank Details -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        ${IC.building}<span>Bank Details / <span dir="rtl" style="font-weight:400;font-size:8.5px;">تفاصيل البنك</span></span>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;color:#334155;">
        <div><span style="color:#94a3b8;">Bank Name / <span dir="rtl">اسم البنك</span>: </span><span style="font-weight:700;">${bank.bank_name || 'Kuwait Finance House'}</span></div>
        <div><span style="color:#94a3b8;">A/C No. / <span dir="rtl">رقم الحساب</span>: </span><span style="font-weight:700;font-family:monospace;">${bank.account_number || '1234 5678 9012'}</span></div>
        <div><span style="color:#94a3b8;">Branch &amp; IFSC / <span dir="rtl">الفرع ورمز التحويل</span>: </span><span style="font-weight:700;font-family:monospace;">${bank.iban_ifsc || 'Salmiya Branch / KFHKWKWXXX'}</span></div>
      </div>
    </div>
    <!-- Scan to Pay -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
      <div style="font-size:8px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:4px;">Scan to Pay / <span dir="rtl">امسح للدفع</span></div>
      <div style="width:58px;height:58px;background:white;border:1px solid #e2e8f0;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:2px;margin-bottom:3px;">
        ${qrSvg}
      </div>
      <div style="font-size:7px;color:#64748b;margin-bottom:3px;">Pay securely with</div>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="background:#005ba4;color:white;padding:1px 4px;border-radius:2px;font-size:7px;font-weight:900;letter-spacing:0.3px;">KNET</span>
        <span style="background:#1a1f71;color:white;padding:1px 4px;border-radius:2px;font-size:7px;font-weight:900;font-style:italic;">VISA</span>
        <span style="display:flex;align-items:center;">
          <span style="width:9px;height:9px;border-radius:50%;background:#eb001b;display:inline-block;"></span>
          <span style="width:9px;height:9px;border-radius:50%;background:#f79e1b;display:inline-block;margin-left:-3px;opacity:0.9;"></span>
        </span>
      </div>
    </div>
    <!-- Tax / CR Details -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:6px;border-bottom:1px solid #e2e8f0;padding-bottom:4px;">
        ${IC.shield}<span>Tax / CR Details</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px;color:#334155;font-size:9px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><span style="color:#94a3b8;font-size:8px;display:block;">Commercial Reg. No.</span><span style="font-size:7px;color:#94a3b8;" dir="rtl">الرقم التجاري</span></div>
          <span style="font-weight:900;font-family:monospace;font-size:10px;">${crNo}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><span style="color:#94a3b8;font-size:8px;display:block;">Tax Reg. No. (CR)</span><span style="font-size:7px;color:#94a3b8;" dir="rtl">الرقم الضريبي</span></div>
          <span style="font-weight:900;font-family:monospace;font-size:10px;">${crNo}</span>
        </div>
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:3px 6px;display:flex;align-items:center;gap:6px;margin-top:2px;">
          ${IC.checkW.replace('stroke="white"','stroke="#0284c7"')}
          <div>
            <div style="font-size:8px;font-weight:700;color:#0369a1;">VAT: Not Applicable</div>
            <div style="font-size:7px;color:#0284c7;" dir="rtl">الضريبة: غير مطبقة</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── NOTES & DECLARATION ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;font-size:9.5px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:4px;">
        ${IC.file}<span>Notes / <span dir="rtl" style="font-weight:400;">ملاحظات</span></span>
      </div>
      <div style="color:#475569;font-size:8.5px;line-height:1.4;">
        ${notes ? `• ${notes}` : `• Thank you for your business!<br/>• If you have any questions about this invoice, please contact us.`}
      </div>
      <div style="color:#94a3b8;font-size:7.5px;margin-top:4px;text-align:right;" dir="rtl">
        • شكراً لثقتكم بنا! في حال وجود أي استفسارات حول الفاتورة، يرجى التواصل معنا.
      </div>
    </div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:5px;font-size:9px;font-weight:900;color:#024282;text-transform:uppercase;margin-bottom:4px;">
        ${IC.pen}<span>Declaration / <span dir="rtl" style="font-weight:400;">إقرار</span></span>
      </div>
      <div style="color:#475569;font-size:8.5px;line-height:1.4;">
        ${declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
      </div>
      <div style="color:#94a3b8;font-size:7.5px;margin-top:4px;text-align:right;" dir="rtl">
        نقر بأن هذه الفاتورة توضح السعر الفعلي للبضائع الموصوفة وأن جميع البيانات صحيحة ودقيقة.
      </div>
    </div>
  </div>

  <!-- ── SIGNATURES ── -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9.5px;">
    <div>
      <div style="font-weight:700;color:#334155;">Customer's Signature / <span dir="rtl" style="font-weight:400;">توقيع العميل</span></div>
      <div style="width:190px;border-bottom:1.5px dotted #94a3b8;margin-top:38px;margin-bottom:3px;"></div>
      <div style="font-size:8px;color:#94a3b8;">Seal &amp; Signature / <span class="ar">الختم والتوقيع</span></div>
    </div>
    <div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;">
      <div style="font-weight:700;color:#334155;">Authorised Signatory / <span dir="rtl" style="font-weight:400;">المفوض بالتوقيع</span></div>
      <div style="font-size:8.5px;color:#94a3b8;margin-top:1px;">For ${sellerName}</div>
      <div style="width:190px;border-bottom:1.5px dotted #94a3b8;margin-top:30px;margin-bottom:3px;"></div>
      <div style="font-size:8px;color:#94a3b8;">Official Stamp / <span class="ar">الختم الرسمي</span></div>
    </div>
  </div>

  <!-- ── FOOTER BAR ── -->
  <div style="margin-top:20px;background:#024282;color:white;border-radius:8px;padding:9px 16px;display:flex;justify-content:space-between;align-items:center;font-size:9px;font-weight:700;">
    <div style="display:flex;align-items:center;gap:6px;">
      <div style="width:16px;height:16px;border-radius:3px;background:#0ea5e9;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:900;">H</div>
      <span style="font-size:11px;font-weight:900;">Hisabi</span>
    </div>
    <div style="text-align:center;font-weight:400;opacity:0.95;">
      Powering Small &amp; Medium Businesses Across Kuwait | <span dir="rtl" style="font-weight:400;">تمكين المشاريع الصغيرة والمتوسطة في الكويت</span>
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

module.exports = {
    generateInvoiceHTML,
    generateUAEInvoiceHTML,
    generateIndiaInvoiceHTML,
    generateKuwaitInvoiceHTML
};

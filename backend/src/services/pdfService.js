const PDFDocument = require('pdfkit');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
const { getCountryConfig, resolveIndianState } = require('../config/countryConfig');
const { renderInvoiceToHTML } = require('./ssrInvoiceRenderer');

// ─── Color Palette ─────────────────────────────────────────────────────────

const NAVY = '#024282';
const SKY = '#0ea5e9';
const TEXT_MAIN = '#0f172a';
const TEXT_MUTED = '#64748b';
const BG_CARD = '#f8fafc';
const BORDER = '#e2e8f0';

function formatDate(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB');
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function formatDec(amount, currency = 'AED') {
    const decimals = currency === 'KWD' ? 3 : 2;
    return parseFloat(amount || 0).toFixed(decimals);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [15, 23, 42];
}

function setColor(doc, hex) {
    doc.fillColor(hexToRgb(hex));
}

function setStroke(doc, hex) {
    doc.strokeColor(hexToRgb(hex));
}

// ─── Chrome Headless PDF Generator (Exact Visual Parity) ───────────────────

// Helper to resolve available Chrome / Chromium binary
function getChromeBinary() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return process.env.CHROME_PATH;
    }
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const candidates = [
        'google-chrome',
        'google-chrome-stable',
        'chromium-browser',
        'chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];
    for (const bin of candidates) {
        if (bin.startsWith('/')) {
            if (fs.existsSync(bin)) return bin;
        }
    }
    return 'google-chrome';
}

async function generateInvoicePDFWithChrome(invoice, shop) {
    const plainInvoice = typeof invoice?.toJSON === 'function' ? invoice.toJSON() : invoice;
    const plainShop = typeof shop?.toJSON === 'function' ? shop.toJSON() : shop;

    // Use the SSR renderer — renders the actual React components so the PDF
    // is pixel-perfect identical to the browser preview.
    const html = await renderInvoiceToHTML(plainInvoice, plainShop);

    // Use separate dirs: one for HTML/PDF output, one for Chrome user-data
    const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hisabi_chrome_'));
    const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hisabi_ud_'));
    const tmpHtml = path.join(workDir, 'invoice.html');
    const tmpPdf = path.join(workDir, 'invoice.pdf');

    await fs.promises.writeFile(tmpHtml, html, 'utf8');

    const cleanup = () => {
        fs.rm(workDir, { recursive: true, force: true }, () => {});
        fs.rm(userDataDir, { recursive: true, force: true }, () => {});
    };

    const chromeBin = getChromeBinary();

    return new Promise((resolve, reject) => {
        // file:// prefix ensures Chrome loads the HTML from disk correctly
        const cmd = `"${chromeBin}" --headless=new --disable-gpu --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --no-pdf-header-footer --user-data-dir="${userDataDir}" --print-to-pdf="${tmpPdf}" "file://${tmpHtml}"`;
        exec(cmd, { timeout: 30000 }, async (error) => {
            try {
                if (error) throw error;
                const buffer = await fs.promises.readFile(tmpPdf);
                cleanup();
                resolve(buffer);
            } catch (err) {
                cleanup();
                reject(err);
            }
        });
    });
}

// ─── Master PDF Generator ────────────────────────────────────────────────────
// Chrome is the only renderer — it produces exact visual parity with the
// HTML preview. PDFKit fallback is kept as last-resort safety net only.

const generateInvoicePDF = async (invoice, shop) => {
    try {
        const buffer = await generateInvoicePDFWithChrome(invoice, shop);
        if (buffer && buffer.length > 0) {
            console.log('[PDF] Chrome render succeeded, size:', buffer.length);
            return buffer;
        }
        throw new Error('Chrome produced an empty buffer');
    } catch (err) {
        console.error('[PDF] Chrome render FAILED:', err.message);
        console.warn('[PDF] Falling back to PDFKit (legacy layout)');
        return generateInvoicePDFKit(invoice, shop);
    }
};

// ─── PDFKit Fallback Generator ─────────────────────────────────────────────
// Three modular country-specific renderers that match the approved invoice designs.

const generateInvoicePDFKit = async (invoice, shop) => {
    const country = invoice.country || shop?.country || 'AE';

    // Run Authoritative Calculation Engine
    const calculation = calculateInvoice({
        items: invoice.items || [],
        shop: { ...shop, country },
        globalDiscount: invoice.discount || 0,
        paidAmount: invoice.paid_amount || 0,
        sellerState: invoice.seller_address_snapshot || shop?.address || '',
        buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
        reverseCharge: Boolean(invoice.reverse_charge)
    });

    const { items: calcItems, totals, meta } = calculation;
    const currency = meta.currency;
    const decimals = currency === 'KWD' ? 3 : 2;
    const dateStr = formatDate(invoice.date);
    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Hisabi Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || '';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';
    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid = (totals.due_amount || 0) <= 0;
    const financeCompany = invoice.finance_company || null;
    const invNum = `#INV-${String(invoice.invoice_number || '1').padStart(6, '0')}`;
    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const invoiceNotes = invoice.notes || shop?.invoice_notes || '';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration
        || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';

    const resolvedPlace = resolveIndianState(invoice.place_of_supply_state, invoice.place_of_supply_code);
    const placeState = resolvedPlace.state || '\u2014';
    const placeCode = resolvedPlace.code || '\u2014';

    // QR Code PNG Generation (PDFKit only accepts PNG/JPEG, not BMP)
    let qrBmp = null;
    const upiId = shop?.upi_id || invoice.upi_id || null;
    try {
        const qrRaw = invoice.qr_code_data || (country === 'IN' && upiId
            ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`
            : null);
        if (qrRaw) {
            qrBmp = await QRCode.toBuffer(qrRaw, { type: 'png', width: 108, margin: 1 });
        }
    } catch (e) { /* Non-fatal — QR omitted if generation fails */ }

    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 25, bottom: 20, left: 30, right: 30 },
            bufferPages: true
        });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const leftMargin = 30;
        const topMargin = 25;
        const pageWidth = doc.page.width - 60;

        // ─── Shared Drawing Helpers ───────────────────────────────────────────
        const fmt = (val) => parseFloat(val || 0).toFixed(decimals);

        const drawCard = (x, y, w, h, radius = 5) => {
            doc.roundedRect(x, y, w, h, radius);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(x, y, w, h, radius).lineWidth(0.5).stroke();
        };

        const drawCardLabel = (text, x, y, color = NAVY) => {
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, color);
            doc.text(text.toUpperCase(), x, y);
        };

        const drawHRule = (y) => {
            setStroke(doc, BORDER);
            doc.moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).lineWidth(0.5).stroke();
        };

        const drawNavyBar = (x, y, w, h, radius = 3) => {
            doc.roundedRect(x, y, w, h, radius);
            setColor(doc, NAVY);
            doc.fill();
        };

        // ─── Dispatch ────────────────────────────────────────────────────────
        const ctx = {
            doc, leftMargin, topMargin, pageWidth,
            invoice, shop, calcItems, totals, meta, currency,
            dateStr, timeStr, sellerName, sellerAddress, sellerPhone, sellerEmail,
            customerName, customerPhone, customerEmail, customerAddress,
            paymentMethod, isPaid, financeCompany, invNum, bank,
            invoiceNotes, invoiceDeclaration, placeState, placeCode, qrBmp, fmt,
            drawCard, drawCardLabel, drawHRule, drawNavyBar
        };

        if (country === 'IN') {
            _drawIndiaInvoice(ctx);
        } else if (country === 'AE') {
            _drawUAEInvoice(ctx);
        } else {
            const crNo = shop?.cr_number || invoice.seller_tax_id_snapshot || '\u2014';
            _drawKuwaitInvoice({ ...ctx, crNo });
        }

        doc.end();
    });
};

// ─── India Invoice Renderer ───────────────────────────────────────────────────

function _drawIndiaInvoice(ctx) {
    const {
        doc, leftMargin, topMargin, pageWidth,
        invoice, shop, calcItems, totals, currency,
        dateStr, timeStr, sellerName, sellerAddress, sellerPhone, sellerEmail,
        customerName, customerPhone, customerEmail, customerAddress,
        paymentMethod, isPaid, invNum, bank,
        invoiceDeclaration, placeState, placeCode, qrBmp,
        fmt, drawCard, drawCardLabel, drawHRule, drawNavyBar
    } = ctx;

    const gstin = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXXXX]';
    let curY = topMargin;

    // ── HEADER ─────────────────────────────────────────────────────────────
    doc.roundedRect(leftMargin, curY, 28, 28, 6);
    setColor(doc, NAVY); doc.fill();
    doc.fontSize(16).font('Helvetica-Bold');
    setColor(doc, '#ffffff');
    doc.text(sellerName.charAt(0).toUpperCase(), leftMargin, curY + 5, { width: 28, align: 'center' });

    doc.fontSize(15).font('Helvetica-Bold');
    setColor(doc, TEXT_MAIN);
    doc.text(sellerName, leftMargin + 34, curY + 2);

    let shopY = curY + 20;
    if (sellerAddress) {
        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(sellerAddress, leftMargin + 34, shopY, { width: 180 });
        shopY += doc.heightOfString(sellerAddress, { width: 180 }) + 2;
    }
    doc.fontSize(8).font('Helvetica');
    setColor(doc, TEXT_MUTED);
    if (sellerPhone) { doc.text(sellerPhone, leftMargin + 34, shopY); shopY += 9; }
    if (sellerEmail) { doc.text(sellerEmail, leftMargin + 34, shopY); shopY += 9; }

    // Center: GSTIN block
    const gstX = leftMargin + 220;
    const gstW = 110;
    drawCard(gstX, curY, gstW, 44);
    doc.fontSize(7.5).font('Helvetica-Bold');
    setColor(doc, TEXT_MUTED);
    doc.text('GSTIN NO', gstX + 8, curY + 5);
    doc.fontSize(8).font('Helvetica-Bold');
    setColor(doc, NAVY);
    doc.text(gstin, gstX + 8, curY + 16, { width: gstW - 16 });

    // Right: Title + Metadata card
    const metaX = gstX + gstW + 8;
    const metaW = pageWidth - (metaX - leftMargin);
    doc.fontSize(14).font('Helvetica-Bold');
    setColor(doc, NAVY);
    doc.text('TAX INVOICE', metaX, curY, { width: metaW, align: 'right' });
    doc.fontSize(8).font('Helvetica-Bold');
    setColor(doc, TEXT_MUTED);
    doc.text('(GST INVOICE)', metaX, curY + 16, { width: metaW, align: 'right' });

    const mCardY = curY + 26;
    drawCard(metaX, mCardY, metaW, 44);
    const drawMR = (lbl, val, y) => {
        doc.fontSize(7.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(lbl, metaX + 6, y, { width: metaW * 0.5 - 6 });
        doc.font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(val, metaX + metaW * 0.5, y, { width: metaW * 0.5 - 6, align: 'right' });
    };
    drawMR('Invoice No.', invNum, mCardY + 4);
    drawMR('Date', dateStr, mCardY + 14);
    drawMR('Time', timeStr, mCardY + 24);
    drawMR('Payment', paymentMethod, mCardY + 34);

    curY = Math.max(shopY, mCardY + 46) + 5;
    drawHRule(curY); curY += 6;

    // ── BILL TO + PLACE OF SUPPLY ─────────────────────────────────────────
    const billH = 50;
    const billW1 = (pageWidth - 8) * 0.65;
    const billW2 = (pageWidth - 8) * 0.35;

    drawCard(leftMargin, curY, billW1, billH);
    drawCardLabel('Bill To', leftMargin + 8, curY + 5);
    doc.fontSize(9.5).font('Helvetica-Bold');
    setColor(doc, TEXT_MAIN);
    doc.text(customerName, leftMargin + 8, curY + 15, { width: billW1 - 16 });
    doc.fontSize(8).font('Helvetica');
    setColor(doc, TEXT_MUTED);
    let bY = curY + 27;
    if (customerPhone) { doc.text(`Ph: ${customerPhone}`, leftMargin + 8, bY, { width: billW1 - 16 }); bY += 9; }
    if (customerEmail) { doc.text(customerEmail, leftMargin + 8, bY, { width: billW1 - 16 }); bY += 9; }
    if (customerAddress) { doc.text(customerAddress, leftMargin + 8, bY, { width: billW1 - 16 }); }

    const posX = leftMargin + billW1 + 8;
    drawCard(posX, curY, billW2, billH);
    drawCardLabel('Place of Supply', posX + 8, curY + 5);
    doc.fontSize(8).font('Helvetica');
    setColor(doc, TEXT_MUTED);
    doc.text('State:', posX + 8, curY + 18);
    doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(placeState, posX + 42, curY + 18, { width: billW2 - 50 });
    doc.font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text('Code:', posX + 8, curY + 30);
    doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(placeCode, posX + 42, curY + 30, { width: billW2 - 50 });

    curY += billH + 8;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────
    const thH = 20;
    const cols = [
        { label: 'S.No', x: leftMargin + 3, w: 22, align: 'center' },
        { label: 'HSN/SAC', x: leftMargin + 25, w: 45, align: 'center' },
        { label: 'Description', x: leftMargin + 70, w: 135, align: 'left' },
        { label: 'Qty', x: leftMargin + 207, w: 28, align: 'center' },
        { label: 'Rate', x: leftMargin + 237, w: 38, align: 'right' },
        { label: 'Disc', x: leftMargin + 277, w: 32, align: 'right' },
        { label: 'Taxable', x: leftMargin + 311, w: 48, align: 'right' },
        { label: 'GST%', x: leftMargin + 361, w: 30, align: 'center' },
        { label: 'CGST', x: leftMargin + 393, w: 35, align: 'right' },
        { label: 'SGST', x: leftMargin + 430, w: 35, align: 'right' },
        { label: 'Total', x: leftMargin + 467, w: 65, align: 'right' },
    ];
    drawNavyBar(leftMargin, curY, pageWidth, thH);
    doc.fontSize(7.5).font('Helvetica-Bold');
    setColor(doc, '#ffffff');
    cols.forEach(c => doc.text(c.label, c.x, curY + 6, { width: c.w, align: c.align }));

    let rowY = curY + thH;
    calcItems.forEach((item, idx) => {
        const rowH = item.item_description ? 26 : 18;
        if (idx % 2 === 1) {
            doc.rect(leftMargin, rowY, pageWidth, rowH);
            setColor(doc, BG_CARD); doc.fill();
        }
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, rowY + rowH).lineTo(leftMargin + pageWidth, rowY + rowH).lineWidth(0.3).stroke();
        const tY = rowY + 4;
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(String(idx + 1), cols[0].x, tY, { width: cols[0].w, align: cols[0].align });
        doc.font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(item.hsn_sac || '\u2014', cols[1].x, tY, { width: cols[1].w, align: cols[1].align });
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(item.item_name, cols[2].x, tY, { width: cols[2].w });
        if (item.item_description) {
            doc.fontSize(7).font('Helvetica'); setColor(doc, TEXT_MUTED);
            doc.text(item.item_description, cols[2].x, tY + 10, { width: cols[2].w });
            doc.fontSize(8);
        }
        doc.font('Helvetica'); setColor(doc, TEXT_MAIN);
        doc.text(String(item.quantity), cols[3].x, tY, { width: cols[3].w, align: cols[3].align });
        doc.text(fmt(item.unit_price), cols[4].x, tY, { width: cols[4].w, align: cols[4].align });
        doc.text(fmt(item.discount || 0), cols[5].x, tY, { width: cols[5].w, align: cols[5].align });
        doc.font('Helvetica-Bold');
        doc.text(fmt(item.taxable_amount), cols[6].x, tY, { width: cols[6].w, align: cols[6].align });
        doc.font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '\u2014', cols[7].x, tY, { width: cols[7].w, align: cols[7].align });
        setColor(doc, TEXT_MAIN);
        doc.text(item.cgst_amount > 0 ? fmt(item.cgst_amount) : '\u2014', cols[8].x, tY, { width: cols[8].w, align: cols[8].align });
        doc.text(item.sgst_amount > 0 ? fmt(item.sgst_amount) : '\u2014', cols[9].x, tY, { width: cols[9].w, align: cols[9].align });
        doc.font('Helvetica-Bold'); setColor(doc, NAVY);
        doc.text(fmt(item.line_total), cols[10].x, tY, { width: cols[10].w, align: cols[10].align });
        rowY += rowH;
    });

    // ── GST SUMMARY + TOTALS (attached) ──────────────────────────────────
    const totW = 195, leftBW = pageWidth - totW, attachH = 60;
    doc.rect(leftMargin, rowY, pageWidth, attachH);
    setColor(doc, BG_CARD); doc.fill();
    setStroke(doc, BORDER);
    doc.rect(leftMargin, rowY, pageWidth, attachH).lineWidth(0.5).stroke();
    doc.moveTo(leftMargin + leftBW, rowY).lineTo(leftMargin + leftBW, rowY + attachH).lineWidth(0.5).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('GST TAX SUMMARY', leftMargin + 8, rowY + 5);
    const subW = (leftBW - 16) / 5;
    const stY = rowY + 16;
    doc.fontSize(7).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text('Taxable', leftMargin + 8, stY, { width: subW });
    doc.text('CGST', leftMargin + 8 + subW, stY, { width: subW, align: 'right' });
    doc.text('SGST', leftMargin + 8 + subW * 2, stY, { width: subW, align: 'right' });
    doc.text('IGST', leftMargin + 8 + subW * 3, stY, { width: subW, align: 'right' });
    doc.text('Total Tax', leftMargin + 8 + subW * 4, stY, { width: subW, align: 'right' });
    setStroke(doc, BORDER);
    doc.moveTo(leftMargin + 8, stY + 10).lineTo(leftMargin + leftBW - 8, stY + 10).lineWidth(0.3).stroke();
    doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    const svY = stY + 13;
    doc.text(fmt(totals.taxable_total), leftMargin + 8, svY, { width: subW });
    doc.text(fmt(totals.cgst_total), leftMargin + 8 + subW, svY, { width: subW, align: 'right' });
    doc.text(fmt(totals.sgst_total), leftMargin + 8 + subW * 2, svY, { width: subW, align: 'right' });
    doc.text(fmt(totals.igst_total || 0), leftMargin + 8 + subW * 3, svY, { width: subW, align: 'right' });
    setColor(doc, NAVY);
    doc.text(fmt(totals.tax_total), leftMargin + 8 + subW * 4, svY, { width: subW, align: 'right' });

    const tBoxX = leftMargin + leftBW;
    let tY = rowY + 6;
    const drawTR = (lbl, val) => {
        doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(lbl, tBoxX + 8, tY);
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(val, tBoxX + 8, tY, { width: totW - 16, align: 'right' });
        tY += 11;
    };
    drawTR('Subtotal', `${currency} ${fmt(totals.gross_subtotal)}`);
    if (totals.global_discount > 0) drawTR('Discount', `-${currency} ${fmt(totals.global_discount)}`);
    if (totals.tax_total > 0) drawTR('Tax Total', `+${currency} ${fmt(totals.tax_total)}`);

    const gtH = 18, gtY = rowY + attachH - gtH;
    drawNavyBar(tBoxX, gtY, totW, gtH);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text('GRAND TOTAL', tBoxX + 8, gtY + 5);
    doc.text(`${currency} ${fmt(totals.grand_total)}`, tBoxX + 8, gtY + 4, { width: totW - 16, align: 'right' });

    let curY2 = rowY + attachH + 6;

    // ── AMOUNT IN WORDS + PAYMENT STATUS ─────────────────────────────────
    const amtW = (pageWidth - 8) * 0.58, payW = (pageWidth - 8) * 0.42;
    drawCard(leftMargin, curY2, amtW, 38);
    drawCardLabel('Amount in Words', leftMargin + 8, curY2 + 5);
    doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(totals.amount_in_words || '', leftMargin + 8, curY2 + 16, { width: amtW - 16 });

    const payX = leftMargin + amtW + 8;
    drawCard(payX, curY2, payW, 38);
    drawCardLabel('Payment Status', payX + 8, curY2 + 5);
    doc.fontSize(8.5).font('Helvetica-Bold');
    setColor(doc, isPaid ? '#166534' : '#b45309');
    doc.text(isPaid ? 'PAID' : 'PARTIAL', payX + 8, curY2 + 15);
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text(`Paid: ${currency} ${fmt(totals.paid_amount)}`, payX + 8, curY2 + 25);
    if (!isPaid) doc.text(`Balance: ${currency} ${fmt(totals.due_amount)}`, payX + 8, curY2 + 35, { width: payW - 16 });

    curY2 += 44;

    // ── BANK DETAILS | QR | CONTACT ──────────────────────────────────────
    const bH = 58;
    const b1W = (pageWidth - 16) * 0.42, b2W = (pageWidth - 16) * 0.25, b3W = (pageWidth - 16) * 0.33;

    drawCard(leftMargin, curY2, b1W, bH);
    drawCardLabel('Bank Details', leftMargin + 8, curY2 + 5);
    let bkY = curY2 + 16;
    const _bk = (lbl, val) => {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(lbl, leftMargin + 8, bkY, { width: 62 });
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(val || '\u2014', leftMargin + 72, bkY, { width: b1W - 80 });
        bkY += 10;
    };
    _bk('Bank Name:', bank.bank_name || '\u2014');
    _bk('A/C No.:', bank.account_number || '\u2014');
    _bk('Branch/IFSC:', bank.iban_ifsc || '\u2014');

    const b2X = leftMargin + b1W + 8;
    drawCard(b2X, curY2, b2W, bH);
    drawCardLabel('UPI Payment', b2X + 8, curY2 + 5);
    if (qrBmp) {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('Scan to Pay', b2X + 8, curY2 + 16, { width: b2W - 16, align: 'center' });
        try { doc.image(qrBmp, b2X + (b2W - 36) / 2, curY2 + 25, { width: 36, height: 36 }); } catch (e) { /* skip */ }
    } else {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('UPI Not Configured', b2X + 8, curY2 + 28, { width: b2W - 16, align: 'center' });
    }

    const b3X = b2X + b2W + 8;
    drawCard(b3X, curY2, b3W, bH);
    drawCardLabel('For Any Queries', b3X + 8, curY2 + 5);
    let qY = curY2 + 16;
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    if (sellerPhone) { doc.text(sellerPhone, b3X + 8, qY, { width: b3W - 16 }); qY += 10; }
    if (sellerEmail) { doc.text(sellerEmail, b3X + 8, qY, { width: b3W - 16 }); qY += 10; }
    doc.fontSize(7.5).text('Scan QR or pay via UPI for faster payment.', b3X + 8, qY, { width: b3W - 16 });

    curY2 += bH + 8;

    // ── DECLARATION + SIGNATURES ──────────────────────────────────────────
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text('DECLARATION', leftMargin, curY2);
    doc.font('Helvetica');
    doc.text(invoiceDeclaration, leftMargin, curY2 + 10, { width: (pageWidth - 20) / 2 });

    const sigY = curY2 + 42;
    setStroke(doc, BORDER);
    doc.moveTo(leftMargin, sigY).lineTo(leftMargin + 120, sigY).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text("Customer's Signature", leftMargin, sigY + 3);
    const rSigX = leftMargin + pageWidth - 130;
    doc.moveTo(rSigX, sigY).lineTo(leftMargin + pageWidth, sigY).lineWidth(0.5).stroke();
    doc.text(`For ${sellerName}`, rSigX, sigY - 10, { width: 130, align: 'right' });
    doc.text('Authorised Signatory', rSigX, sigY + 3, { width: 130, align: 'right' });

    _drawFooter(doc, leftMargin, pageWidth, 'Thank you for your business!  |  Powered by Hisabi POS  |  www.hisabi.com');
}

// ─── UAE Invoice Renderer ─────────────────────────────────────────────────────

function _drawUAEInvoice(ctx) {
    const {
        doc, leftMargin, topMargin, pageWidth,
        invoice, shop, calcItems, totals, currency,
        dateStr, timeStr, sellerName, sellerAddress, sellerPhone, sellerEmail,
        customerName, customerPhone, customerEmail, customerAddress,
        paymentMethod, isPaid, financeCompany, invNum, bank,
        invoiceDeclaration, qrBmp,
        fmt, drawCard, drawCardLabel, drawHRule, drawNavyBar
    } = ctx;

    const trn = invoice.seller_tax_id_snapshot || shop?.trn || '';
    let curY = topMargin;

    // ── HEADER ─────────────────────────────────────────────────────────────
    doc.roundedRect(leftMargin, curY, 28, 28, 6);
    setColor(doc, NAVY); doc.fill();
    doc.fontSize(16).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text(sellerName.charAt(0).toUpperCase(), leftMargin, curY + 5, { width: 28, align: 'center' });

    doc.fontSize(15).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(sellerName, leftMargin + 34, curY + 2);
    let shopY = curY + 20;
    if (sellerAddress) {
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(sellerAddress, leftMargin + 34, shopY, { width: 200 }); shopY += 10;
    }
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    if (sellerPhone) { doc.text(sellerPhone, leftMargin + 34, shopY); shopY += 9; }
    if (sellerEmail) { doc.text(sellerEmail, leftMargin + 34, shopY); shopY += 9; }

    doc.fontSize(14).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('TAX INVOICE', leftMargin + 340, curY, { width: pageWidth - 340, align: 'right' });
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text('Simpler. Smarter. Together.', leftMargin + 340, curY + 16, { width: pageWidth - 340, align: 'right' });
    if (trn) {
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
        doc.text(`TRN: ${trn}`, leftMargin + 340, curY + 26, { width: pageWidth - 340, align: 'right' });
    }

    // 4-card metadata row
    const cardRowY = Math.max(shopY, curY + 38) + 4;
    const cW = (pageWidth - 9) / 4;
    [
        { label: 'Invoice No.', val: invNum },
        { label: 'Date', val: dateStr },
        { label: 'Time', val: timeStr },
        { label: 'Payment', val: paymentMethod + (financeCompany ? `\n${financeCompany}` : '') },
    ].forEach((mc, i) => {
        drawCard(leftMargin + i * (cW + 3), cardRowY, cW, 30, 4);
        doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
        doc.text(mc.label, leftMargin + i * (cW + 3) + 6, cardRowY + 4);
        doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(mc.val, leftMargin + i * (cW + 3) + 6, cardRowY + 14, { width: cW - 12 });
    });

    curY = cardRowY + 36;
    drawHRule(curY); curY += 6;

    // ── BILL TO CARD ──────────────────────────────────────────────────────
    const billH = 48;
    drawCard(leftMargin, curY, pageWidth, billH);
    drawCardLabel('BILL TO / المشتري', leftMargin + 8, curY + 5);
    doc.fontSize(9.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(customerName, leftMargin + 8, curY + 15, { width: pageWidth / 2 - 16 });
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    let bY = curY + 26;
    if (customerPhone) { doc.text(`Ph: ${customerPhone}`, leftMargin + 8, bY, { width: pageWidth / 2 - 16 }); bY += 9; }
    if (customerEmail) { doc.text(customerEmail, leftMargin + 8, bY, { width: pageWidth / 2 - 16 }); }
    if (customerAddress) {
        doc.text(customerAddress, leftMargin + pageWidth / 2, curY + 15, { width: pageWidth / 2 - 16 });
    }

    curY += billH + 8;

    // ── ITEMS TABLE ───────────────────────────────────────────────────────
    const thH = 26;
    const cols = [
        { label: '#', x: leftMargin + 3, w: 18, align: 'center' },
        { label: 'Item Description / الصنف', x: leftMargin + 23, w: 130, align: 'left' },
        { label: 'Qty', x: leftMargin + 155, w: 25, align: 'center' },
        { label: 'Unit Price', x: leftMargin + 182, w: 48, align: 'right' },
        { label: 'Discount', x: leftMargin + 232, w: 40, align: 'right' },
        { label: 'Taxable', x: leftMargin + 274, w: 52, align: 'right' },
        { label: 'Net Amt', x: leftMargin + 328, w: 50, align: 'right' },
        { label: 'VAT%', x: leftMargin + 380, w: 30, align: 'center' },
        { label: 'VAT Amt', x: leftMargin + 412, w: 46, align: 'right' },
        { label: `Gross(${currency})`, x: leftMargin + 460, w: 72, align: 'right' },
    ];
    drawNavyBar(leftMargin, curY, pageWidth, thH);
    doc.fontSize(7).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    cols.forEach(c => doc.text(c.label, c.x, curY + 4, { width: c.w, align: c.align }));

    let rowY = curY + thH;
    calcItems.forEach((item, idx) => {
        const rowH = item.item_description ? 26 : 18;
        if (idx % 2 === 1) { doc.rect(leftMargin, rowY, pageWidth, rowH); setColor(doc, BG_CARD); doc.fill(); }
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, rowY + rowH).lineTo(leftMargin + pageWidth, rowY + rowH).lineWidth(0.3).stroke();
        const tY = rowY + 4;
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(String(idx + 1), cols[0].x, tY, { width: cols[0].w, align: cols[0].align });
        doc.text(item.item_name, cols[1].x, tY, { width: cols[1].w });
        if (item.item_description) {
            doc.fontSize(7).font('Helvetica'); setColor(doc, TEXT_MUTED);
            doc.text(item.item_description, cols[1].x, tY + 10, { width: cols[1].w }); doc.fontSize(8);
        }
        setColor(doc, TEXT_MAIN); doc.font('Helvetica');
        doc.text(String(item.quantity), cols[2].x, tY, { width: cols[2].w, align: cols[2].align });
        doc.text(fmt(item.unit_price), cols[3].x, tY, { width: cols[3].w, align: cols[3].align });
        doc.text(fmt(item.discount || 0), cols[4].x, tY, { width: cols[4].w, align: cols[4].align });
        const taxable = parseFloat(item.taxable_amount || 0);
        doc.text(fmt(taxable), cols[5].x, tY, { width: cols[5].w, align: cols[5].align });
        doc.font('Helvetica-Bold'); doc.text(fmt(taxable), cols[6].x, tY, { width: cols[6].w, align: cols[6].align });
        doc.font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '0%', cols[7].x, tY, { width: cols[7].w, align: cols[7].align });
        setColor(doc, TEXT_MAIN);
        doc.text(fmt(item.tax_amount || 0), cols[8].x, tY, { width: cols[8].w, align: cols[8].align });
        doc.font('Helvetica-Bold'); setColor(doc, NAVY);
        doc.text(fmt(item.line_total), cols[9].x, tY, { width: cols[9].w, align: cols[9].align });
        rowY += rowH;
    });

    // ── AMOUNT IN WORDS + TOTALS (attached) ──────────────────────────────
    const totW = 195, leftBW = pageWidth - totW, attachH = 62;
    doc.rect(leftMargin, rowY, pageWidth, attachH);
    setColor(doc, BG_CARD); doc.fill();
    setStroke(doc, BORDER);
    doc.rect(leftMargin, rowY, pageWidth, attachH).lineWidth(0.5).stroke();
    doc.moveTo(leftMargin + leftBW, rowY).lineTo(leftMargin + leftBW, rowY + attachH).lineWidth(0.5).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('AMOUNT IN WORDS / المبلغ كتابة', leftMargin + 8, rowY + 6);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(totals.amount_in_words || '', leftMargin + 8, rowY + 18, { width: leftBW - 16 });

    const tBoxX = leftMargin + leftBW;
    let tY = rowY + 6;
    const drawTR2 = (lbl, val) => {
        doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED); doc.text(lbl, tBoxX + 8, tY);
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN); doc.text(val, tBoxX + 8, tY, { width: totW - 16, align: 'right' });
        tY += 11;
    };
    drawTR2(`Subtotal (${currency})`, fmt(totals.gross_subtotal));
    if (totals.tax_total > 0) drawTR2(`VAT Total (${currency})`, `+${fmt(totals.tax_total)}`);

    const gtH = 18, gtY = rowY + attachH - gtH;
    drawNavyBar(tBoxX, gtY, totW, gtH);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text(`Grand Total (${currency})`, tBoxX + 8, gtY + 5);
    doc.text(fmt(totals.grand_total), tBoxX + 8, gtY + 4, { width: totW - 16, align: 'right' });

    let curY2 = rowY + attachH + 6;

    // ── 4-SEGMENT PAYMENT BANNER ──────────────────────────────────────────
    const banH = 34;
    doc.rect(leftMargin, curY2, pageWidth, banH);
    setColor(doc, BG_CARD); doc.fill(); setStroke(doc, BORDER);
    doc.rect(leftMargin, curY2, pageWidth, banH).lineWidth(0.5).stroke();
    const segW = pageWidth / 4;
    [
        { lbl: 'Payment Method', val: paymentMethod, color: TEXT_MAIN },
        { lbl: 'Payment Status', val: isPaid ? 'PAID' : 'PARTIAL', color: isPaid ? '#166534' : '#b45309' },
        { lbl: 'Payment Date', val: `${dateStr} ${timeStr}`, color: TEXT_MAIN },
        { lbl: `Paid (${currency})`, val: fmt(totals.paid_amount), color: NAVY },
    ].forEach((seg, i) => {
        const sx = leftMargin + i * segW;
        doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
        doc.text(seg.lbl.toUpperCase(), sx + 8, curY2 + 5, { width: segW - 16 });
        doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, seg.color);
        doc.text(seg.val, sx + 8, curY2 + 17, { width: segW - 16 });
    });

    curY2 += banH + 6;

    // ── BANK | QR | CONTACT ───────────────────────────────────────────────
    const bH = 58;
    const b1W = (pageWidth - 16) * 0.42, b2W = (pageWidth - 16) * 0.25, b3W = (pageWidth - 16) * 0.33;

    drawCard(leftMargin, curY2, b1W, bH);
    drawCardLabel('Bank Details / تفاصيل البنك', leftMargin + 8, curY2 + 5);
    let bkY = curY2 + 16;
    const _bk2 = (lbl, val) => {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(lbl, leftMargin + 8, bkY, { width: 62 });
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(val || '\u2014', leftMargin + 72, bkY, { width: b1W - 80 });
        bkY += 10;
    };
    _bk2('Bank Name:', bank.bank_name || '\u2014');
    _bk2('A/C No.:', bank.account_number || '\u2014');
    _bk2('Identifier:', bank.iban_ifsc || '\u2014');

    const b2X = leftMargin + b1W + 8;
    drawCard(b2X, curY2, b2W, bH);
    doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('QR Code', b2X + 8, curY2 + 5, { width: b2W - 16, align: 'center' });
    if (qrBmp) {
        try { doc.image(qrBmp, b2X + (b2W - 36) / 2, curY2 + 16, { width: 36, height: 36 }); } catch (e) { /* skip */ }
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('Scan Code', b2X + 8, curY2 + 54, { width: b2W - 16, align: 'center' });
    } else {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('No QR Data', b2X + 8, curY2 + 28, { width: b2W - 16, align: 'center' });
    }

    const b3X = b2X + b2W + 8;
    drawCard(b3X, curY2, b3W, bH);
    drawCardLabel('For Any Queries', b3X + 8, curY2 + 5);
    let qY = curY2 + 16;
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    if (sellerPhone) { doc.text(sellerPhone, b3X + 8, qY, { width: b3W - 16 }); qY += 10; }
    if (sellerEmail) { doc.text(sellerEmail, b3X + 8, qY, { width: b3W - 16 }); qY += 10; }
    doc.fontSize(7.5).text('For billing questions or assistance, contact us.', b3X + 8, qY, { width: b3W - 16 });

    curY2 += bH + 8;

    // ── REVERSE CHARGE NOTICE ─────────────────────────────────────────────
    doc.roundedRect(leftMargin, curY2, pageWidth, 16, 3);
    setColor(doc, BG_CARD); doc.fill(); setStroke(doc, BORDER);
    doc.roundedRect(leftMargin, curY2, pageWidth, 16, 3).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text('Reverse Charge / Special Tax Treatment (if applicable): \u2014', leftMargin + 8, curY2 + 4);
    curY2 += 22;

    // ── DECLARATION + SIGNATURES ──────────────────────────────────────────
    drawHRule(curY2); curY2 += 6;
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text('DECLARATION', leftMargin, curY2);
    doc.font('Helvetica');
    doc.text(invoiceDeclaration, leftMargin, curY2 + 10, { width: (pageWidth - 20) / 2 });

    const sigY = curY2 + 42;
    setStroke(doc, BORDER);
    doc.moveTo(leftMargin, sigY).lineTo(leftMargin + 120, sigY).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text("Customer's Seal & Signature", leftMargin, sigY + 3);
    const rSigX = leftMargin + pageWidth - 130;
    doc.moveTo(rSigX, sigY).lineTo(leftMargin + pageWidth, sigY).lineWidth(0.5).stroke();
    doc.text(`For ${sellerName}`, rSigX, sigY - 10, { width: 130, align: 'right' });
    doc.text('Authorised Signatory', rSigX, sigY + 3, { width: 130, align: 'right' });

    _drawFooter(doc, leftMargin, pageWidth, 'Thank you for your business!  |  Powered by Hisabi  |  www.hisabi.com');
}

// ─── Kuwait Invoice Renderer ──────────────────────────────────────────────────

function _drawKuwaitInvoice(ctx) {
    const {
        doc, leftMargin, topMargin, pageWidth,
        invoice, shop, calcItems, totals, currency,
        dateStr, timeStr, sellerName, sellerAddress, sellerPhone, sellerEmail,
        customerName, customerPhone, customerEmail, customerAddress,
        paymentMethod, isPaid, financeCompany, invNum, bank, crNo,
        invoiceNotes, invoiceDeclaration, qrBmp,
        fmt, drawCard, drawCardLabel, drawHRule, drawNavyBar
    } = ctx;

    let curY = topMargin;

    // ── HEADER ─────────────────────────────────────────────────────────────
    doc.roundedRect(leftMargin, curY, 28, 28, 6);
    setColor(doc, NAVY); doc.fill();
    doc.fontSize(16).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text(sellerName.charAt(0).toUpperCase(), leftMargin, curY + 5, { width: 28, align: 'center' });

    doc.fontSize(15).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(sellerName, leftMargin + 34, curY + 2);
    let shopY = curY + 20;
    if (sellerAddress) {
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(sellerAddress, leftMargin + 34, shopY, { width: 220 }); shopY += 10;
    }
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    if (sellerPhone) { doc.text(sellerPhone, leftMargin + 34, shopY); shopY += 9; }
    if (sellerEmail) { doc.text(sellerEmail, leftMargin + 34, shopY); shopY += 9; }

    doc.fontSize(14).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('TAX INVOICE', leftMargin + 340, curY, { width: pageWidth - 340, align: 'right' });
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text('Simpler. Smarter. Together.', leftMargin + 340, curY + 16, { width: pageWidth - 340, align: 'right' });

    const cardRowY = Math.max(shopY, curY + 32) + 4;
    const cW = (pageWidth - 9) / 4;
    [
        { label: 'Invoice No. / رقم الفاتورة', val: invNum },
        { label: 'Date / التاريخ', val: dateStr },
        { label: 'Time / الوقت', val: timeStr },
        { label: 'Payment / طريقة الدفع', val: paymentMethod + (financeCompany ? `\n${financeCompany}` : '') },
    ].forEach((mc, i) => {
        drawCard(leftMargin + i * (cW + 3), cardRowY, cW, 32, 4);
        doc.fontSize(7).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
        doc.text(mc.label, leftMargin + i * (cW + 3) + 6, cardRowY + 4, { width: cW - 12 });
        doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(mc.val, leftMargin + i * (cW + 3) + 6, cardRowY + 14, { width: cW - 12 });
    });

    curY = cardRowY + 38;
    drawHRule(curY); curY += 6;

    // ── BILL TO CARD ──────────────────────────────────────────────────────
    const billH = 48;
    drawCard(leftMargin, curY, pageWidth, billH);
    drawCardLabel('BILL TO / العميل', leftMargin + 8, curY + 5);
    doc.fontSize(9.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(customerName, leftMargin + 8, curY + 15, { width: pageWidth / 2 - 16 });
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    let bY = curY + 26;
    if (customerPhone) { doc.text(`Ph: ${customerPhone}`, leftMargin + 8, bY, { width: pageWidth / 2 - 16 }); bY += 9; }
    if (customerEmail) { doc.text(customerEmail, leftMargin + 8, bY, { width: pageWidth / 2 - 16 }); }
    if (invoice.customer_civil_id) {
        doc.text(`Civil ID / الرقم المدني: ${invoice.customer_civil_id}`, leftMargin + pageWidth / 2, curY + 15, { width: pageWidth / 2 - 16 });
    } else if (customerAddress) {
        doc.text(customerAddress, leftMargin + pageWidth / 2, curY + 15, { width: pageWidth / 2 - 16 });
    }

    curY += billH + 8;

    // ── ITEMS TABLE (6 cols) ──────────────────────────────────────────────
    const thH = 20;
    const cols = [
        { label: '#', x: leftMargin + 3, w: 22, align: 'center' },
        { label: 'Item Description / وصف الصنف', x: leftMargin + 27, w: 218, align: 'left' },
        { label: 'Qty / الكمية', x: leftMargin + 247, w: 38, align: 'center' },
        { label: 'Unit Price / سعر الوحدة', x: leftMargin + 287, w: 78, align: 'right' },
        { label: 'Discount / الخصم', x: leftMargin + 367, w: 60, align: 'right' },
        { label: 'Amount / المبلغ', x: leftMargin + 429, w: 103, align: 'right' },
    ];
    drawNavyBar(leftMargin, curY, pageWidth, thH);
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    cols.forEach(c => doc.text(c.label, c.x, curY + 6, { width: c.w, align: c.align }));

    let rowY = curY + thH;
    calcItems.forEach((item, idx) => {
        const rowH = item.item_description ? 26 : 18;
        if (idx % 2 === 1) { doc.rect(leftMargin, rowY, pageWidth, rowH); setColor(doc, BG_CARD); doc.fill(); }
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, rowY + rowH).lineTo(leftMargin + pageWidth, rowY + rowH).lineWidth(0.3).stroke();
        const tY = rowY + 4;
        doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(String(idx + 1), cols[0].x, tY, { width: cols[0].w, align: cols[0].align });
        doc.text(item.item_name, cols[1].x, tY, { width: cols[1].w });
        if (item.item_description) {
            doc.fontSize(7).font('Helvetica'); setColor(doc, TEXT_MUTED);
            doc.text(item.item_description, cols[1].x, tY + 10, { width: cols[1].w }); doc.fontSize(8);
        }
        setColor(doc, TEXT_MAIN); doc.font('Helvetica');
        doc.text(String(item.quantity), cols[2].x, tY, { width: cols[2].w, align: cols[2].align });
        doc.text(fmt(item.unit_price), cols[3].x, tY, { width: cols[3].w, align: cols[3].align });
        doc.text(fmt(item.discount || 0), cols[4].x, tY, { width: cols[4].w, align: cols[4].align });
        doc.font('Helvetica-Bold'); setColor(doc, NAVY);
        doc.text(fmt(item.line_total), cols[5].x, tY, { width: cols[5].w, align: cols[5].align });
        rowY += rowH;
    });

    // ── PAYMENT STATUS (L) + TOTALS (R) (attached) ───────────────────────
    const totW = 200, leftBW = pageWidth - totW, attachH = 58;
    doc.rect(leftMargin, rowY, pageWidth, attachH);
    setColor(doc, BG_CARD); doc.fill();
    setStroke(doc, BORDER);
    doc.rect(leftMargin, rowY, pageWidth, attachH).lineWidth(0.5).stroke();
    doc.moveTo(leftMargin + leftBW, rowY).lineTo(leftMargin + leftBW, rowY + attachH).lineWidth(0.5).stroke();

    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('PAYMENT STATUS / حالة الدفع', leftMargin + 8, rowY + 6);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, isPaid ? '#166534' : '#b45309');
    doc.text(isPaid ? 'PAID' : 'PARTIAL', leftMargin + 8, rowY + 17);
    doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text(`${currency} ${fmt(totals.paid_amount)} paid on ${dateStr}, ${timeStr}`, leftMargin + 8, rowY + 29, { width: leftBW - 16 });

    const tBoxX = leftMargin + leftBW;
    let tY = rowY + 6;
    const drawTR3 = (lbl, val) => {
        doc.fontSize(8).font('Helvetica'); setColor(doc, TEXT_MUTED); doc.text(lbl, tBoxX + 8, tY);
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN); doc.text(val, tBoxX + 8, tY, { width: totW - 16, align: 'right' });
        tY += 11;
    };
    drawTR3('Subtotal / المجموع الفرعي', `${currency} ${fmt(totals.gross_subtotal)}`);
    drawTR3('Total / الإجمالي', `${currency} ${fmt(totals.grand_total)}`);

    const gtH = 18, gtY = rowY + attachH - gtH;
    drawNavyBar(tBoxX, gtY, totW, gtH);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text('Paid Amount / المبلغ المدفوع', tBoxX + 8, gtY + 5);
    doc.text(`${currency} ${fmt(totals.paid_amount)}`, tBoxX + 8, gtY + 4, { width: totW - 16, align: 'right' });

    let curY2 = rowY + attachH + 6;

    // ── AMOUNT IN WORDS ───────────────────────────────────────────────────
    drawCard(leftMargin, curY2, pageWidth, 26);
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text('Amount in Words:', leftMargin + 8, curY2 + 5);
    doc.fontSize(8.5).font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(totals.amount_in_words || '', leftMargin + 110, curY2 + 5, { width: pageWidth - 130 });

    curY2 += 32;

    // ── BANK | QR | TAX/CR ────────────────────────────────────────────────
    const bH = 60;
    const b1W = (pageWidth - 16) * 0.42, b2W = (pageWidth - 16) * 0.25, b3W = (pageWidth - 16) * 0.33;

    drawCard(leftMargin, curY2, b1W, bH);
    drawCardLabel('Bank Details / تفاصيل البنك', leftMargin + 8, curY2 + 5);
    let bkY = curY2 + 16;
    const _bk3 = (lbl, val) => {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text(lbl, leftMargin + 8, bkY, { width: 62 });
        doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
        doc.text(val || '\u2014', leftMargin + 72, bkY, { width: b1W - 80 });
        bkY += 10;
    };
    _bk3('Bank Name:', bank.bank_name || '\u2014');
    _bk3('A/C No.:', bank.account_number || '\u2014');
    _bk3('Identifier:', bank.iban_ifsc || '\u2014');

    const b2X = leftMargin + b1W + 8;
    drawCard(b2X, curY2, b2W, bH);
    doc.fontSize(8).font('Helvetica-Bold'); setColor(doc, NAVY);
    doc.text('QR Code / رمز الاستجابة', b2X + 8, curY2 + 5, { width: b2W - 16, align: 'center' });
    if (qrBmp) {
        try { doc.image(qrBmp, b2X + (b2W - 36) / 2, curY2 + 16, { width: 36, height: 36 }); } catch (e) { /* skip */ }
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('Scan Code', b2X + 8, curY2 + 54, { width: b2W - 16, align: 'center' });
    } else {
        doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
        doc.text('No QR Data', b2X + 8, curY2 + 28, { width: b2W - 16, align: 'center' });
    }

    const b3X = b2X + b2W + 8;
    drawCard(b3X, curY2, b3W, bH);
    drawCardLabel('Tax / Commercial Registration', b3X + 8, curY2 + 5);
    doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text('CR No. / الرقم التجاري:', b3X + 8, curY2 + 16);
    doc.font('Helvetica-Bold'); setColor(doc, TEXT_MAIN);
    doc.text(crNo, b3X + 8, curY2 + 26);
    doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text('VAT:', b3X + 8, curY2 + 40);
    doc.font('Helvetica-Bold'); setColor(doc, '#0ea5e9');
    doc.text('Not Applicable / غير مطبقة', b3X + 30, curY2 + 40);

    curY2 += bH + 8;

    // ── NOTES + DECLARATION ───────────────────────────────────────────────
    const noteW = (pageWidth - 8) / 2;
    drawCard(leftMargin, curY2, noteW, 38);
    drawCardLabel('Notes / ملاحظات', leftMargin + 8, curY2 + 5);
    doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text(
        invoiceNotes || 'Thank you for your business! If you have any questions about this invoice, please contact us.',
        leftMargin + 8, curY2 + 16, { width: noteW - 16 }
    );

    const declX = leftMargin + noteW + 8;
    drawCard(declX, curY2, noteW, 38);
    drawCardLabel('Declaration / إقرار', declX + 8, curY2 + 5);
    doc.fontSize(7.5).font('Helvetica'); setColor(doc, TEXT_MUTED);
    doc.text(invoiceDeclaration, declX + 8, curY2 + 16, { width: noteW - 16 });

    curY2 += 44;

    // ── SIGNATURES ────────────────────────────────────────────────────────
    drawHRule(curY2); curY2 += 6;
    const sigY = curY2 + 26;
    setStroke(doc, BORDER);
    doc.moveTo(leftMargin, sigY).lineTo(leftMargin + 140, sigY).lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, TEXT_MUTED);
    doc.text("Customer's Signature / توقيع العميل", leftMargin, sigY + 3);
    doc.text('Seal & Signature / الختم والتوقيع', leftMargin, sigY + 11);

    const rSigX = leftMargin + pageWidth - 140;
    doc.moveTo(rSigX, sigY).lineTo(leftMargin + pageWidth, sigY).lineWidth(0.5).stroke();
    doc.text(`For ${sellerName}`, rSigX, sigY - 10, { width: 140, align: 'right' });
    doc.text('Authorised Signatory / المفوض بالتوقيع', rSigX, sigY + 3, { width: 140, align: 'right' });
    doc.text('Official Stamp / الختم الرسمي', rSigX, sigY + 11, { width: 140, align: 'right' });

    _drawFooter(doc, leftMargin, pageWidth, 'Powering Small & Medium Businesses Across Kuwait  |  Hisabi POS  |  www.hisabi.com');
}

// ─── Shared Footer ────────────────────────────────────────────────────────────
function _drawFooter(doc, leftMargin, pageWidth, text) {
    const footerY = doc.page.height - 36;
    doc.roundedRect(leftMargin, footerY, pageWidth, 22, 4);
    setColor(doc, NAVY); doc.fill();
    doc.fontSize(7.5).font('Helvetica-Bold'); setColor(doc, '#ffffff');
    doc.text(text, leftMargin + 8, footerY + 7, { width: pageWidth - 16, align: 'center' });
}

// ─── Due Payment Receipt PDF ─────────────────────────────────────────────────

const generateDueReceiptPDF = (payment, invoice, shop) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 120;
        const currency = shop.currency || 'AED';
        const date = formatDate(payment.payment_date);

        const primaryColor = (shop && shop.brand_color) ? shop.brand_color : '#4f46e5';

        // Header
        doc.fontSize(22).font('Helvetica-Bold');
        setColor(doc, primaryColor);
        doc.text(shop.name || 'Shop', { align: 'center' });

        if (shop.address) {
            doc.fontSize(9).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(shop.address, { align: 'center' });
        }

        // Divider
        setStroke(doc, primaryColor);
        doc.moveTo(60, doc.y + 8).lineTo(60 + pageWidth, doc.y + 8).lineWidth(2).stroke();
        doc.moveDown(1.5);

        // Title
        doc.fontSize(16).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('DUE PAYMENT RECEIPT', { align: 'center', characterSpacing: 2 });
        doc.moveDown(1.5);

        // Info grid (2x2)
        const infoY = doc.y;
        const col1 = 60, col2 = 60 + pageWidth / 2;
        const drawInfoItem = (label, value, x, y) => {
            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text(label.toUpperCase(), x, y);
            doc.fontSize(12).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(value, x, y + 12);
        };

        drawInfoItem('Receipt No', payment.due_invoice_number || '—', col1, infoY);
        drawInfoItem('Date', date, col2, infoY);
        drawInfoItem('Customer', invoice.customer_name || 'Walk-in Customer', col1, infoY + 45);
        drawInfoItem('Original Invoice', `#${invoice.invoice_number}`, col2, infoY + 45);

        doc.y = infoY + 90;
        doc.moveDown(0.5);

        // Payment summary box
        const boxTop = doc.y;
        const boxW = pageWidth;
        const summaryRows = [
            ['Original Grand Total:', `${currency} ${parseFloat(invoice.grand_total).toFixed(2)}`, false],
            [`Total Paid Previously:`, `${currency} ${parseFloat(parseFloat(invoice.paid_amount) - parseFloat(payment.amount)).toFixed(2)}`, false],
            ['Amount Collected Now:', `${currency} ${parseFloat(payment.amount).toFixed(2)}`, true],
        ];
        const summaryBoxH = summaryRows.length * 28 + 20;

        doc.rect(col1, boxTop, boxW, summaryBoxH);
        setColor(doc, BG_CARD);
        doc.fill();

        let sumY = boxTop + 12;
        summaryRows.forEach(([label, value, isTotal]) => {
            if (isTotal) {
                setStroke(doc, BORDER);
                doc.moveTo(col1 + 10, sumY - 4).lineTo(col1 + boxW - 10, sumY - 4).lineWidth(0.5).stroke();
                doc.fontSize(13).font('Helvetica-Bold');
                setColor(doc, primaryColor);
            } else {
                doc.fontSize(11).font('Helvetica');
                setColor(doc, TEXT_MAIN);
            }
            doc.text(label, col1 + 12, sumY);
            if (isTotal) setColor(doc, primaryColor);
            doc.text(value, col1 + 12, sumY, { width: boxW - 24, align: 'right' });
            sumY += 28;
        });

        // Remaining balance
        if (parseFloat(payment.remaining_balance) > 0) {
            doc.fontSize(11).font('Helvetica-Bold');
            doc.fillColor([220, 38, 38]);
            const remY = boxTop + summaryBoxH + 16;
            doc.text('Remaining Balance:', col1, remY);
            doc.text(`${currency} ${parseFloat(payment.remaining_balance).toFixed(2)}`, col1, remY, { width: boxW, align: 'right' });
        }

        // Payment method
        doc.moveDown(3);
        doc.fontSize(10).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('PAYMENT METHOD', { align: 'left' });
        doc.fontSize(13).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text((payment.payment_method || 'Cash').toUpperCase());

        // Footer
        const footerY = doc.page.height - 80;
        setStroke(doc, BORDER);
        doc.moveTo(60, footerY).lineTo(60 + pageWidth, footerY).lineWidth(0.5).stroke();

        doc.fontSize(9).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text('This is a computer generated receipt for your due payment.', 60, footerY + 12, { align: 'center', width: pageWidth });
        doc.text('Thank you for your business!', 60, footerY + 26, { align: 'center', width: pageWidth });

        doc.end();
    });
};

module.exports = { generateInvoicePDF, generateDueReceiptPDF, generateInvoicePDFKit };

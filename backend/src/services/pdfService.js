const PDFDocument = require('pdfkit');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createQRMatrix, matrixToBMPBuffer } = require('../utils/qrGenerator');
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

    return new Promise((resolve, reject) => {
        // file:// prefix ensures Chrome loads the HTML from disk correctly
        const cmd = `google-chrome --headless=new --disable-gpu --no-sandbox --no-pdf-header-footer --user-data-dir="${userDataDir}" --print-to-pdf="${tmpPdf}" "file://${tmpHtml}"`;
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

const generateInvoicePDFKit = (invoice, shop) => {
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
        const pageWidth = doc.page.width - 60; // 595.28 - 60 = 535.28
        const country = invoice.country || shop?.country || 'AE';
        const countryConfig = getCountryConfig(country);

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

        // Resolve Place of Supply dynamically (No hardcoded defaults)
        const resolvedPlace = resolveIndianState(invoice.place_of_supply_state, invoice.place_of_supply_code);
        const placeState = resolvedPlace.state || '—';
        const placeCode = resolvedPlace.code || '—';

        // QR Code BMP Generation
        let qrBmp = null;
        try {
            const qrRaw = invoice.qr_code_data || (country === 'IN'
                ? `upi://pay?pa=${shop?.upi_id || 'hisabi@upi'}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`
                : `https://hisabi.com/verify?inv=${invoice.invoice_number}`);
            const matrix = createQRMatrix(qrRaw);
            qrBmp = matrixToBMPBuffer(matrix, 2, 2);
        } catch (e) {
            // Non-fatal QR failure
        }

        // ═════════════════════════════════════════════════════════════════════
        // 1. HEADER SECTION
        // ═════════════════════════════════════════════════════════════════════
        let curY = topMargin;

        // Brand Icon & Text
        doc.roundedRect(leftMargin, curY, 26, 26, 6);
        setColor(doc, SKY);
        doc.fill();
        doc.fontSize(15).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        doc.text('H', leftMargin, curY + 5, { width: 26, align: 'center' });

        doc.fontSize(20).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text('Hisabi', leftMargin + 32, curY);

        doc.fontSize(8.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        const tagLine = country === 'IN'
            ? 'Smart Billing | Inventory | Business Growth'
            : (country === 'AE' ? 'SMART POS & INVENTORY SOLUTIONS' : 'Smart POS & Inventory for Modern Businesses');
        doc.text(tagLine, leftMargin + 32, curY + 18);

        // Shop Contact / Address below brand
        let shopContactY = curY + 32;
        doc.fontSize(10).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(sellerName, leftMargin, shopContactY);
        shopContactY += 12;

        doc.fontSize(8.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        if (sellerAddress) {
            const addrH = doc.heightOfString(sellerAddress, { width: 190 });
            doc.text(sellerAddress, leftMargin, shopContactY, { width: 190 });
            shopContactY += addrH + 2;
        }
        if (sellerPhone || sellerEmail) {
            const contactText = [sellerPhone, sellerEmail].filter(Boolean).join('  |  ');
            const contactH = doc.heightOfString(contactText, { width: 190 });
            doc.text(contactText, leftMargin, shopContactY, { width: 190 });
            shopContactY += contactH + 2;
        }

        // Center: Tax ID (GSTIN / TRN / CR)
        const taxId = invoice.seller_tax_id_snapshot || shop?.trn || shop?.gstin || shop?.cr_number;
        if (taxId) {
            const taxLabel = country === 'IN' ? 'GSTIN NO' : (country === 'AE' ? 'TRN' : 'CR NO');
            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text(taxLabel, leftMargin + 195, curY + 8, { width: 145, align: 'center' });
            doc.fontSize(10).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(`${taxId}`, leftMargin + 195, curY + 20, { width: 145, align: 'center' });
        }

        // Right: Title & Metadata Table
        const invTitle = country === 'IN' ? 'TAX INVOICE' : (country === 'AE' ? 'TAX INVOICE' : 'INVOICE');
        doc.fontSize(18).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(invTitle, leftMargin + 320, curY, { width: pageWidth - 320, align: 'right' });

        if (country === 'IN') {
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('(GST INVOICE)', leftMargin + 320, curY + 18, { width: pageWidth - 320, align: 'right' });
        } else if (country === 'AE' || country === 'KW') {
            doc.fontSize(8.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Simpler. Smarter. Together.', leftMargin + 320, curY + 18, { width: pageWidth - 320, align: 'right' });
        }

        // Right Metadata Lines
        let metaY = curY + 32;
        const drawMetaLine = (lbl, val) => {
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, leftMargin + 350, metaY, { width: 75, align: 'right' });
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val, leftMargin + 430, metaY, { width: pageWidth - 430, align: 'left' });
            metaY += 11;
        };

        drawMetaLine('Invoice No. :', `#INV-${String(invoice.invoice_number || '1').padStart(4, '0')}`);
        drawMetaLine('Date :', dateStr);
        drawMetaLine('Time :', timeStr);
        drawMetaLine('Payment :', paymentMethod);

        // Header Divider Line
        curY = Math.max(shopContactY, metaY) + 6;
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, curY).lineTo(leftMargin + pageWidth, curY).lineWidth(0.5).stroke();
        curY += 7;

        // ═════════════════════════════════════════════════════════════════════
        // 2. BILL TO & SUPPLY / PLACE OF SUPPLY CARDS
        // ═════════════════════════════════════════════════════════════════════
        const cardH = 54;
        if (country === 'IN') {
            const cardW1 = (pageWidth - 10) * 0.65;
            const cardW2 = (pageWidth - 10) * 0.35;

            // Card 1: Bill To
            doc.roundedRect(leftMargin, curY, cardW1, cardH, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, cardW1, cardH, 5).lineWidth(0.5).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('BILL TO', leftMargin + 8, curY + 6);
            doc.fontSize(10).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerName, leftMargin + 8, curY + 16, { width: cardW1 - 16 });
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            let bY = curY + 28;
            if (customerPhone) { doc.text(`Phone: ${customerPhone}`, leftMargin + 8, bY); bY += 9; }
            if (customerAddress) { doc.text(`Address: ${customerAddress}`, leftMargin + 8, bY, { width: cardW1 - 16 }); }

            // Card 2: Place of Supply (Dynamic with no hardcoded fallback)
            const c2X = leftMargin + cardW1 + 10;
            doc.roundedRect(c2X, curY, cardW2, cardH, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c2X, curY, cardW2, cardH, 5).lineWidth(0.5).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('PLACE OF SUPPLY', c2X + 8, curY + 6);
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('State:', c2X + 8, curY + 19);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(placeState, c2X + 42, curY + 19, { width: cardW2 - 46 });
            doc.font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Code:', c2X + 8, curY + 32);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(placeCode, c2X + 42, curY + 32, { width: cardW2 - 46 });
        } else {
            // UAE / KW: 2 Cards (Bill To & Supply Details)
            const halfW = (pageWidth - 8) / 2;

            // Bill To
            doc.roundedRect(leftMargin, curY, halfW, cardH, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, halfW, cardH, 5).lineWidth(0.5).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(country === 'AE' ? 'BILL TO / المشتري' : 'BILL TO / العميل', leftMargin + 8, curY + 6);
            doc.fontSize(10).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerName, leftMargin + 8, curY + 16, { width: halfW - 16 });
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            let bY = curY + 28;
            if (customerPhone) { doc.text(`Ph: ${customerPhone}`, leftMargin + 8, bY); bY += 9; }
            if (customerAddress) { doc.text(`Address: ${customerAddress}`, leftMargin + 8, bY, { width: halfW - 16 }); }

            // Supply / Delivery Details
            const c2X = leftMargin + halfW + 8;
            doc.roundedRect(c2X, curY, halfW, cardH, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c2X, curY, halfW, cardH, 5).lineWidth(0.5).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(country === 'AE' ? 'SUPPLY TO / جهة التوريد' : 'SUPPLY DETAILS / تفاصيل التوريد', c2X + 8, curY + 6);
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Supply Date:', c2X + 8, curY + 19);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(invoice.supply_date ? formatDate(invoice.supply_date) : dateStr, c2X + 70, curY + 19);

            doc.font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Delivery Address:', c2X + 8, curY + 31);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerAddress || sellerAddress || '—', c2X + 70, curY + 31, { width: halfW - 78 });
        }

        curY += cardH + 8;

        // ═════════════════════════════════════════════════════════════════════
        // 3. ITEMS TABLE
        // ═════════════════════════════════════════════════════════════════════
        const tableTop = curY;
        const thH = 20;

        // Draw Table Header
        doc.roundedRect(leftMargin, tableTop, pageWidth, thH, 4);
        setColor(doc, NAVY);
        doc.fill();

        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, '#ffffff');

        // Column Coordinates per Country
        let cols = [];
        if (country === 'IN') {
            cols = [
                { id: 'sno', label: 'S.No', x: leftMargin + 3, w: 22, align: 'center' },
                { id: 'hsn', label: 'HSN/SAC', x: leftMargin + 25, w: 42, align: 'center' },
                { id: 'desc', label: 'Description of Goods', x: leftMargin + 69, w: 142, align: 'left' },
                { id: 'qty', label: 'Qty', x: leftMargin + 213, w: 28, align: 'center' },
                { id: 'mrp', label: 'MRP', x: leftMargin + 243, w: 34, align: 'right' },
                { id: 'rate', label: 'Rate', x: leftMargin + 279, w: 34, align: 'right' },
                { id: 'disc', label: 'Disc', x: leftMargin + 315, w: 30, align: 'right' },
                { id: 'taxable', label: 'Taxable', x: leftMargin + 347, w: 46, align: 'right' },
                { id: 'rate_pct', label: 'GST %', x: leftMargin + 395, w: 30, align: 'center' },
                { id: 'cgst', label: 'CGST', x: leftMargin + 427, w: 33, align: 'right' },
                { id: 'sgst', label: 'SGST', x: leftMargin + 462, w: 33, align: 'right' },
                { id: 'total', label: 'Total (₹)', x: leftMargin + 497, w: 35, align: 'right' }
            ];
        } else if (country === 'AE') {
            cols = [
                { id: 'sno', label: '#', x: leftMargin + 4, w: 18, align: 'center' },
                { id: 'desc', label: 'Item Description', x: leftMargin + 24, w: 155, align: 'left' },
                { id: 'qty', label: 'Qty', x: leftMargin + 181, w: 28, align: 'center' },
                { id: 'rate', label: 'Unit Price', x: leftMargin + 211, w: 45, align: 'right' },
                { id: 'disc', label: 'Discount', x: leftMargin + 258, w: 35, align: 'right' },
                { id: 'taxable', label: 'Taxable', x: leftMargin + 295, w: 50, align: 'right' },
                { id: 'net', label: 'Net Amount', x: leftMargin + 347, w: 50, align: 'right' },
                { id: 'rate_pct', label: 'VAT %', x: leftMargin + 399, w: 30, align: 'center' },
                { id: 'tax_amt', label: 'VAT Amt', x: leftMargin + 431, w: 45, align: 'right' },
                { id: 'total', label: 'Gross (AED)', x: leftMargin + 478, w: 55, align: 'right' }
            ];
        } else {
            // Kuwait: 6 Clean Columns
            cols = [
                { id: 'sno', label: '#', x: leftMargin + 4, w: 22, align: 'center' },
                { id: 'desc', label: 'Item Description', x: leftMargin + 28, w: 210, align: 'left' },
                { id: 'qty', label: 'Qty', x: leftMargin + 240, w: 35, align: 'center' },
                { id: 'rate', label: 'Unit Price', x: leftMargin + 277, w: 75, align: 'right' },
                { id: 'disc', label: 'Discount', x: leftMargin + 354, w: 60, align: 'right' },
                { id: 'total', label: 'Amount (KWD)', x: leftMargin + 416, w: 115, align: 'right' }
            ];
        }

        cols.forEach(col => {
            doc.text(col.label, col.x, tableTop + 6, { width: col.w, align: col.align });
        });

        let rowY = tableTop + thH;
        calcItems.forEach((item, idx) => {
            const rowH = item.item_description ? 26 : 19;
            if (idx % 2 === 1) {
                doc.rect(leftMargin, rowY, pageWidth, rowH);
                setColor(doc, BG_CARD);
                doc.fill();
            }

            setStroke(doc, BORDER);
            doc.moveTo(leftMargin, rowY + rowH).lineTo(leftMargin + pageWidth, rowY + rowH).lineWidth(0.5).stroke();

            const textY = rowY + 4;
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);

            if (country === 'IN') {
                doc.text(String(idx + 1), cols[0].x, textY, { width: cols[0].w, align: cols[0].align });
                doc.font('Helvetica');
                doc.text(item.hsn_sac || '—', cols[1].x, textY, { width: cols[1].w, align: cols[1].align });
                doc.font('Helvetica-Bold');
                doc.text(item.item_name, cols[2].x, textY, { width: cols[2].w, align: cols[2].align });
                if (item.item_description) {
                    doc.fontSize(7.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[2].x, textY + 10, { width: cols[2].w });
                    doc.fontSize(8.5);
                }
                setColor(doc, TEXT_MAIN);
                doc.font('Helvetica');
                doc.text(String(item.quantity), cols[3].x, textY, { width: cols[3].w, align: cols[3].align });
                doc.text(item.mrp ? formatDec(item.mrp, currency) : '—', cols[4].x, textY, { width: cols[4].w, align: cols[4].align });
                doc.text(formatDec(item.unit_price, currency), cols[5].x, textY, { width: cols[5].w, align: cols[5].align });
                doc.text(formatDec(item.discount || 0, currency), cols[6].x, textY, { width: cols[6].w, align: cols[6].align });
                doc.font('Helvetica-Bold');
                doc.text(formatDec(item.taxable_amount, currency), cols[7].x, textY, { width: cols[7].w, align: cols[7].align });
                doc.font('Helvetica');
                doc.text(item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—', cols[8].x, textY, { width: cols[8].w, align: cols[8].align });
                doc.text(item.cgst_amount > 0 ? formatDec(item.cgst_amount, currency) : '—', cols[9].x, textY, { width: cols[9].w, align: cols[9].align });
                doc.text(item.sgst_amount > 0 ? formatDec(item.sgst_amount, currency) : '—', cols[10].x, textY, { width: cols[10].w, align: cols[10].align });
                doc.font('Helvetica-Bold');
                doc.text(formatDec(item.line_total, currency), cols[11].x, textY, { width: cols[11].w, align: cols[11].align });
            } else if (country === 'AE') {
                doc.text(String(idx + 1), cols[0].x, textY, { width: cols[0].w, align: cols[0].align });
                doc.text(item.item_name, cols[1].x, textY, { width: cols[1].w, align: cols[1].align });
                if (item.item_description) {
                    doc.fontSize(7.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[1].x, textY + 10, { width: cols[1].w });
                    doc.fontSize(8.5);
                }
                setColor(doc, TEXT_MAIN);
                doc.font('Helvetica');
                doc.text(String(item.quantity), cols[2].x, textY, { width: cols[2].w, align: cols[2].align });
                doc.text(formatDec(item.unit_price, currency), cols[3].x, textY, { width: cols[3].w, align: cols[3].align });
                doc.text(formatDec(item.discount || 0, currency), cols[4].x, textY, { width: cols[4].w, align: cols[4].align });
                doc.text(formatDec(item.taxable_amount, currency), cols[5].x, textY, { width: cols[5].w, align: cols[5].align });
                doc.font('Helvetica-Bold');
                doc.text(formatDec(item.taxable_amount, currency), cols[6].x, textY, { width: cols[6].w, align: cols[6].align });
                doc.font('Helvetica');
                doc.text(item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '0%', cols[7].x, textY, { width: cols[7].w, align: cols[7].align });
                doc.text(formatDec(item.tax_amount, currency), cols[8].x, textY, { width: cols[8].w, align: cols[8].align });
                doc.font('Helvetica-Bold');
                doc.text(formatDec(item.line_total, currency), cols[9].x, textY, { width: cols[9].w, align: cols[9].align });
            } else {
                // KW
                doc.text(String(idx + 1), cols[0].x, textY, { width: cols[0].w, align: cols[0].align });
                doc.text(item.item_name, cols[1].x, textY, { width: cols[1].w, align: cols[1].align });
                if (item.item_description) {
                    doc.fontSize(7.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[1].x, textY + 10, { width: cols[1].w });
                    doc.fontSize(8.5);
                }
                setColor(doc, TEXT_MAIN);
                doc.font('Helvetica');
                doc.text(String(item.quantity), cols[2].x, textY, { width: cols[2].w, align: cols[2].align });
                doc.text(formatDec(item.unit_price, currency), cols[3].x, textY, { width: cols[3].w, align: cols[3].align });
                doc.text(formatDec(item.discount || 0, currency), cols[4].x, textY, { width: cols[4].w, align: cols[4].align });
                doc.font('Helvetica-Bold');
                doc.text(formatDec(item.line_total, currency), cols[5].x, textY, { width: cols[5].w, align: cols[5].align });
            }

            rowY += rowH;
        });

        // ═════════════════════════════════════════════════════════════════════
        // 4. ATTACHED TOTALS & TAX SUMMARY SECTION (NO VERTICAL GAP)
        // ═════════════════════════════════════════════════════════════════════
        const totalsW = 210;
        const leftBoxW = pageWidth - totalsW;
        const attachedH = country === 'IN' ? 64 : 58;

        // Container attached directly to the bottom of the table
        setColor(doc, BG_CARD);
        doc.rect(leftMargin, rowY, pageWidth, attachedH).fill();
        setStroke(doc, BORDER);
        doc.rect(leftMargin, rowY, pageWidth, attachedH).lineWidth(0.5).stroke();

        // Vertical divider separating Left Box (Tax summary) and Right Box (Totals)
        doc.moveTo(leftMargin + leftBoxW, rowY).lineTo(leftMargin + leftBoxW, rowY + attachedH).lineWidth(0.5).stroke();

        if (country === 'IN') {
            // Left: GST Tax Summary
            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('GST TAX SUMMARY', leftMargin + 8, rowY + 6);

            // Sub-table headers
            const stY = rowY + 18;
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            const subW = (leftBoxW - 16) / 5;
            doc.text('Taxable (₹)', leftMargin + 8, stY, { width: subW });
            doc.text('CGST (₹)', leftMargin + 8 + subW, stY, { width: subW, align: 'right' });
            doc.text('SGST (₹)', leftMargin + 8 + subW * 2, stY, { width: subW, align: 'right' });
            doc.text('IGST (₹)', leftMargin + 8 + subW * 3, stY, { width: subW, align: 'right' });
            doc.text('Total Tax (₹)', leftMargin + 8 + subW * 4, stY, { width: subW, align: 'right' });

            // Divider
            setStroke(doc, BORDER);
            doc.moveTo(leftMargin + 8, stY + 11).lineTo(leftMargin + leftBoxW - 8, stY + 11).lineWidth(0.5).stroke();

            // Sub-table values
            const svY = stY + 14;
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(formatDec(totals.taxable_total, currency), leftMargin + 8, svY, { width: subW });
            doc.text(formatDec(totals.cgst_total, currency), leftMargin + 8 + subW, svY, { width: subW, align: 'right' });
            doc.text(formatDec(totals.sgst_total, currency), leftMargin + 8 + subW * 2, svY, { width: subW, align: 'right' });
            doc.text(formatDec(totals.igst_total, currency), leftMargin + 8 + subW * 3, svY, { width: subW, align: 'right' });
            setColor(doc, NAVY);
            doc.text(formatDec(totals.tax_total, currency), leftMargin + 8 + subW * 4, svY, { width: subW, align: 'right' });
        } else {
            // Left: Payment Status & Amount in Words
            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('PAYMENT STATUS', leftMargin + 8, rowY + 6);
            doc.fontSize(9).font('Helvetica-Bold');
            setColor(doc, isPaid ? '#166534' : '#b45309');
            doc.text(isPaid ? 'PAID' : 'PARTIAL', leftMargin + 8, rowY + 17);

            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(`Paid: ${currency} ${formatDec(totals.paid_amount, currency)} on ${dateStr}`, leftMargin + 50, rowY + 18);

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('AMOUNT IN WORDS', leftMargin + 8, rowY + 33);
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(totals.amount_in_words, leftMargin + 8, rowY + 43, { width: leftBoxW - 16 });
        }

        // Right: Attached Totals Box
        const tBoxX = leftMargin + leftBoxW;
        let tY = rowY + 5;
        const drawTRow = (lbl, val) => {
            doc.fontSize(8.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, tBoxX + 10, tY);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val, tBoxX + 10, tY, { width: totalsW - 20, align: 'right' });
            tY += 11;
        };

        drawTRow('Subtotal', `${currency} ${formatDec(totals.gross_subtotal, currency)}`);
        if (totals.global_discount > 0) drawTRow('Discount', `-${currency} ${formatDec(totals.global_discount, currency)}`);
        if (totals.tax_total > 0 && country !== 'IN') drawTRow('VAT Total', `+${currency} ${formatDec(totals.tax_total, currency)}`);
        if (totals.round_off !== 0) drawTRow('Round Off', `${currency} ${formatDec(totals.round_off, currency)}`);

        // Grand Total Banner (Flushed cleanly inside attached container)
        const gtH = 19;
        const gtY = rowY + attachedH - gtH;
        doc.rect(tBoxX, gtY, totalsW, gtH);
        setColor(doc, NAVY);
        doc.fill();

        doc.fontSize(9.5).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        doc.text('GRAND TOTAL', tBoxX + 10, gtY + 5);
        doc.fontSize(10.5);
        doc.text(`${currency} ${formatDec(totals.grand_total, currency)}`, tBoxX + 10, gtY + 4, { width: totalsW - 20, align: 'right' });

        curY = rowY + attachedH + 8;

        // ═════════════════════════════════════════════════════════════════════
        // 5. AMOUNT IN WORDS & PAYMENT STATUS (INDIA SPECIFIC ROW)
        // ═════════════════════════════════════════════════════════════════════
        if (country === 'IN') {
            const w1 = (pageWidth - 8) * 0.58;
            const w2 = (pageWidth - 8) * 0.42;

            // Amount in words card
            doc.roundedRect(leftMargin, curY, w1, 40, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, w1, 40, 5).lineWidth(0.5).stroke();

            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('AMOUNT IN WORDS', leftMargin + 8, curY + 6);
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(totals.amount_in_words, leftMargin + 8, curY + 18, { width: w1 - 16 });

            // Payment status card
            const pX = leftMargin + w1 + 8;
            doc.roundedRect(pX, curY, w2, 40, 5);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(pX, curY, w2, 40, 5).lineWidth(0.5).stroke();

            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, isPaid ? '#166534' : '#b45309');
            doc.text(`Payment Status: ${isPaid ? 'PAID' : 'PARTIAL'}`, pX + 8, curY + 6);

            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(`Paid: ${currency} ${formatDec(totals.paid_amount, currency)}`, pX + 8, curY + 18);
            doc.text(`Balance Due: ${currency} ${formatDec(totals.due_amount, currency)}`, pX + 8, curY + 28);

            curY += 46;
        }

        // ═════════════════════════════════════════════════════════════════════
        // 6. BANK DETAILS & QR CODE & CONTACT SECTION
        // ═════════════════════════════════════════════════════════════════════
        const bH = 62;
        const b1W = (pageWidth - 16) * 0.45;
        const b2W = (pageWidth - 16) * 0.25;
        const b3W = (pageWidth - 16) * 0.30;

        // Card 1: Bank Details
        doc.roundedRect(leftMargin, curY, b1W, bH, 5);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(leftMargin, curY, b1W, bH, 5).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text('BANK DETAILS', leftMargin + 8, curY + 6);
        const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
            bank_name: shop.bank_name,
            account_number: shop.bank_account_number,
            iban_ifsc: shop.bank_iban_ifsc
        } : {});
        let bkY = curY + 18;
        const drawBk = (lbl, val) => {
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, leftMargin + 8, bkY, { width: 70 });
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val || '—', leftMargin + 80, bkY, { width: b1W - 88 });
            bkY += 10;
        };
        drawBk('Bank Name:', bank.bank_name || 'Bank');
        drawBk('A/C No.:', bank.account_number || '—');
        drawBk('Branch & IFSC:', bank.iban_ifsc || '—');

        // Card 2: QR Code
        const b2X = leftMargin + b1W + 8;
        doc.roundedRect(b2X, curY, b2W, bH, 5);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(b2X, curY, b2W, bH, 5).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(country === 'IN' ? 'UPI PAYMENT' : 'SCAN TO PAY', b2X + 8, curY + 6, { width: b2W - 16, align: 'center' });

        if (qrBmp) {
            try {
                doc.image(qrBmp, b2X + (b2W - 38) / 2, curY + 16, { width: 38, height: 38 });
            } catch (e) {
                // Fallback text if QR buffer cannot be rendered
            }
        }

        // Card 3: Contact / Tax Info
        const b3X = b2X + b2W + 8;
        doc.roundedRect(b3X, curY, b3W, bH, 5);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(b3X, curY, b3W, bH, 5).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(country === 'KW' ? 'TAX / REGISTRATION' : 'FOR ANY QUERIES', b3X + 8, curY + 6);
        doc.fontSize(8).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let qY = curY + 18;
        if (sellerPhone) { doc.text(`Phone: ${sellerPhone}`, b3X + 8, qY); qY += 10; }
        if (sellerEmail) { doc.text(`Email: ${sellerEmail}`, b3X + 8, qY); qY += 10; }
        doc.text('Scan QR or pay online for faster verification.', b3X + 8, qY, { width: b3W - 16 });

        curY += bH + 8;

        // ═════════════════════════════════════════════════════════════════════
        // 7. DECLARATION & SIGNATURES
        // ═════════════════════════════════════════════════════════════════════
        const halfSigW = (pageWidth - 20) / 2;
        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('DECLARATION', leftMargin, curY);
        doc.fontSize(7.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(
            invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
            leftMargin,
            curY + 10,
            { width: halfSigW }
        );

        // Signatures
        const sigLineY = curY + 40;
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, sigLineY).lineTo(leftMargin + 130, sigLineY).lineWidth(0.5).stroke();
        doc.fontSize(7.5).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text("Customer's Signature", leftMargin, sigLineY + 3);

        const rSigX = leftMargin + pageWidth - 140;
        doc.moveTo(rSigX, sigLineY).lineTo(leftMargin + pageWidth, sigLineY).lineWidth(0.5).stroke();
        doc.text(`For ${sellerName}`, rSigX, sigLineY - 10, { width: 140, align: 'right' });
        doc.text('Authorised Signatory', rSigX, sigLineY + 3, { width: 140, align: 'right' });

        // ═════════════════════════════════════════════════════════════════════
        // 8. PROFESSIONAL FOOTER (HAIRLINE DIVIDER, NO THICK BAR, NO 2ND PAGE)
        // ═════════════════════════════════════════════════════════════════════
        const footerY = doc.page.height - 42;
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, footerY).lineTo(leftMargin + pageWidth, footerY).lineWidth(0.5).stroke();

        doc.fontSize(8).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(
            'Thank you for your business!  |  Powered by Hisabi POS  |  Modern POS & Inventory for Growing Businesses',
            leftMargin,
            footerY + 5,
            {
                width: pageWidth,
                align: 'center',
                lineBreak: false
            }
        );

        doc.end();
    });
};


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

module.exports = { generateInvoicePDF, generateDueReceiptPDF };

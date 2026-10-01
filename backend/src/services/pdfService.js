const PDFDocument = require('pdfkit');
const { createQRMatrix, matrixToBMPBuffer } = require('../utils/qrGenerator');
const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
const { getCountryConfig } = require('../config/countryConfig');

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

// ─── Master Invoice PDF Generator ──────────────────────────────────────────

const generateInvoicePDF = (invoice, shop) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 30, bufferPages: true });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const leftMargin = 30;
        const topMargin = 30;
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
        doc.roundedRect(leftMargin, curY, 24, 24, 6);
        setColor(doc, SKY);
        doc.fill();
        doc.fontSize(14).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        doc.text('H', leftMargin, curY + 5, { width: 24, align: 'center' });

        doc.fontSize(18).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text('Hisabi', leftMargin + 30, curY);

        doc.fontSize(7.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        const tagLine = country === 'IN' ? 'Smart Billing | Inventory | Business Growth' : (country === 'AE' ? 'SMART POS & INVENTORY SOLUTIONS' : 'Smart POS & Inventory for Modern Businesses');
        doc.text(tagLine, leftMargin + 30, curY + 16);

        // Shop Contact / Address below brand
        let shopContactY = curY + 28;
        doc.fontSize(8.5).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(sellerName, leftMargin, shopContactY);
        shopContactY += 10;

        doc.fontSize(7.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        if (sellerAddress) {
            doc.text(sellerAddress, leftMargin, shopContactY, { width: 180 });
            shopContactY += 9;
        }
        if (sellerPhone || sellerEmail) {
            doc.text([sellerPhone, sellerEmail].filter(Boolean).join('  |  '), leftMargin, shopContactY, { width: 180 });
            shopContactY += 9;
        }

        // Center: Tax ID (GSTIN / TRN / CR)
        const taxId = invoice.seller_tax_id_snapshot || shop?.trn || shop?.gstin || shop?.cr_number;
        if (taxId) {
            const taxLabel = country === 'IN' ? 'GSTIN NO' : (country === 'AE' ? 'TRN' : 'CR NO');
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text(taxLabel, leftMargin + 190, curY + 8, { width: 140, align: 'center' });
            doc.fontSize(9.5).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(`${taxId}`, leftMargin + 190, curY + 18, { width: 140, align: 'center' });
        }

        // Right: Title & Metadata Table
        const invTitle = country === 'IN' ? 'TAX INVOICE' : (country === 'AE' ? 'TAX INVOICE' : 'INVOICE');
        doc.fontSize(16).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(invTitle, leftMargin + 330, curY, { width: pageWidth - 330, align: 'right' });

        if (country === 'IN') {
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('(GST INVOICE)', leftMargin + 330, curY + 15, { width: pageWidth - 330, align: 'right' });
        } else if (country === 'AE' || country === 'KW') {
            doc.fontSize(8).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Simpler. Smarter. Together.', leftMargin + 330, curY + 15, { width: pageWidth - 330, align: 'right' });
        }

        // Right Metadata Lines
        let metaY = curY + 28;
        const drawMetaLine = (lbl, val) => {
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, leftMargin + 350, metaY, { width: 75, align: 'right' });
            doc.fontSize(8).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val, leftMargin + 430, metaY, { width: pageWidth - 430, align: 'left' });
            metaY += 10;
        };

        drawMetaLine('Invoice No. :', `#INV-${String(invoice.invoice_number || '1').padStart(4, '0')}`);
        drawMetaLine('Date :', dateStr);
        drawMetaLine('Time :', timeStr);
        drawMetaLine('Payment :', paymentMethod);

        // Header Divider Line
        curY = Math.max(shopContactY, metaY) + 8;
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, curY).lineTo(leftMargin + pageWidth, curY).lineWidth(0.5).stroke();
        curY += 8;

        // ═════════════════════════════════════════════════════════════════════
        // 2. BILL TO & SUPPLY / PLACE OF SUPPLY CARDS
        // ═════════════════════════════════════════════════════════════════════
        const cardH = 58;
        if (country === 'IN') {
            const cardW1 = (pageWidth - 16) * 0.50;
            const cardW2 = (pageWidth - 16) * 0.25;
            const cardW3 = (pageWidth - 16) * 0.25;

            // Card 1: Bill To
            doc.roundedRect(leftMargin, curY, cardW1, cardH, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, cardW1, cardH, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('BILL TO', leftMargin + 8, curY + 6);
            doc.fontSize(9).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerName, leftMargin + 8, curY + 16, { width: cardW1 - 16 });
            doc.fontSize(7).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            let bY = curY + 28;
            if (customerPhone) { doc.text(`Phone: ${customerPhone}`, leftMargin + 8, bY); bY += 8; }
            if (customerAddress) { doc.text(`Address: ${customerAddress}`, leftMargin + 8, bY, { width: cardW1 - 16 }); }

            // Card 2: Place of Supply
            const c2X = leftMargin + cardW1 + 8;
            doc.roundedRect(c2X, curY, cardW2, cardH, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c2X, curY, cardW2, cardH, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('PLACE OF SUPPLY', c2X + 8, curY + 6);
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('State:', c2X + 8, curY + 20);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(invoice.place_of_supply_state || 'Rajasthan', c2X + 38, curY + 20);
            doc.font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Code:', c2X + 8, curY + 32);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(invoice.place_of_supply_code || '08', c2X + 38, curY + 32);

            // Card 3: Payment Method
            const c3X = c2X + cardW2 + 8;
            doc.roundedRect(c3X, curY, cardW3, cardH, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c3X, curY, cardW3, cardH, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('PAYMENT METHOD', c3X + 8, curY + 6);
            doc.roundedRect(c3X + 8, curY + 22, cardW3 - 16, 18, 4);
            setColor(doc, '#ffffff');
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c3X + 8, curY + 22, cardW3 - 16, 18, 4).lineWidth(0.5).stroke();
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(paymentMethod, c3X + 8, curY + 27, { width: cardW3 - 16, align: 'center' });
        } else {
            // UAE / KW: 2 Cards (Bill To & Supply Details)
            const halfW = (pageWidth - 8) / 2;

            // Bill To
            doc.roundedRect(leftMargin, curY, halfW, cardH, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, halfW, cardH, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(country === 'AE' ? 'BILL TO / المشتري' : 'BILL TO / العميل', leftMargin + 8, curY + 6);
            doc.fontSize(9).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerName, leftMargin + 8, curY + 16, { width: halfW - 16 });
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            let bY = curY + 28;
            if (customerPhone) { doc.text(`Ph: ${customerPhone}`, leftMargin + 8, bY); bY += 9; }
            if (customerAddress) { doc.text(`Address: ${customerAddress}`, leftMargin + 8, bY, { width: halfW - 16 }); }

            // Supply / Delivery Details
            const c2X = leftMargin + halfW + 8;
            doc.roundedRect(c2X, curY, halfW, cardH, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(c2X, curY, halfW, cardH, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text(country === 'AE' ? 'SUPPLY TO / جهة التوريد' : 'SUPPLY DETAILS / تفاصيل التوريد', c2X + 8, curY + 6);
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Supply Date:', c2X + 8, curY + 20);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(invoice.supply_date ? formatDate(invoice.supply_date) : dateStr, c2X + 70, curY + 20);

            doc.font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text('Delivery Address:', c2X + 8, curY + 32);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(customerAddress || sellerAddress || '—', c2X + 70, curY + 32, { width: halfW - 78 });
        }

        curY += cardH + 10;

        // ═════════════════════════════════════════════════════════════════════
        // 3. ITEMS TABLE
        // ═════════════════════════════════════════════════════════════════════
        const tableTop = curY;
        const thH = 18;

        // Draw Table Header
        doc.roundedRect(leftMargin, tableTop, pageWidth, thH, 4);
        setColor(doc, NAVY);
        doc.fill();

        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, '#ffffff');

        // Column Coordinates per Country
        let cols = [];
        if (country === 'IN') {
            cols = [
                { id: 'sno', label: 'S.No', x: leftMargin + 4, w: 22, align: 'center' },
                { id: 'hsn', label: 'HSN/SAC', x: leftMargin + 26, w: 42, align: 'center' },
                { id: 'desc', label: 'Description of Goods', x: leftMargin + 70, w: 145, align: 'left' },
                { id: 'qty', label: 'Qty', x: leftMargin + 217, w: 28, align: 'center' },
                { id: 'mrp', label: 'MRP', x: leftMargin + 247, w: 35, align: 'right' },
                { id: 'rate', label: 'Rate', x: leftMargin + 284, w: 35, align: 'right' },
                { id: 'disc', label: 'Disc', x: leftMargin + 321, w: 30, align: 'right' },
                { id: 'taxable', label: 'Taxable', x: leftMargin + 353, w: 45, align: 'right' },
                { id: 'rate_pct', label: 'GST %', x: leftMargin + 400, w: 30, align: 'center' },
                { id: 'cgst', label: 'CGST', x: leftMargin + 432, w: 32, align: 'right' },
                { id: 'sgst', label: 'SGST', x: leftMargin + 466, w: 32, align: 'right' },
                { id: 'total', label: 'Total (₹)', x: leftMargin + 500, w: 33, align: 'right' }
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
            doc.text(col.label, col.x, tableTop + 5, { width: col.w, align: col.align });
        });

        let rowY = tableTop + thH;
        calcItems.forEach((item, idx) => {
            const rowH = item.item_description ? 24 : 17;
            if (idx % 2 === 1) {
                doc.rect(leftMargin, rowY, pageWidth, rowH);
                setColor(doc, BG_CARD);
                doc.fill();
            }

            setStroke(doc, BORDER);
            doc.moveTo(leftMargin, rowY + rowH).lineTo(leftMargin + pageWidth, rowY + rowH).lineWidth(0.5).stroke();

            const textY = rowY + 4;
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);

            if (country === 'IN') {
                doc.text(String(idx + 1), cols[0].x, textY, { width: cols[0].w, align: cols[0].align });
                doc.font('Helvetica');
                doc.text(item.hsn_sac || '—', cols[1].x, textY, { width: cols[1].w, align: cols[1].align });
                doc.font('Helvetica-Bold');
                doc.text(item.item_name, cols[2].x, textY, { width: cols[2].w, align: cols[2].align });
                if (item.item_description) {
                    doc.fontSize(6.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[2].x, textY + 9, { width: cols[2].w });
                    doc.fontSize(7.5);
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
                    doc.fontSize(6.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[1].x, textY + 9, { width: cols[1].w });
                    doc.fontSize(7.5);
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
                    doc.fontSize(6.5).font('Helvetica');
                    setColor(doc, TEXT_MUTED);
                    doc.text(item.item_description, cols[1].x, textY + 9, { width: cols[1].w });
                    doc.fontSize(7.5);
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

        curY = rowY + 10;

        // ═════════════════════════════════════════════════════════════════════
        // 4. TAX SUMMARY & TOTALS SECTION
        // ═════════════════════════════════════════════════════════════════════
        const totalsW = 210;
        const leftBoxW = pageWidth - totalsW - 12;

        if (country === 'IN') {
            // Left: GST Tax Summary
            doc.roundedRect(leftMargin, curY, leftBoxW, 58, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, leftBoxW, 58, 6).lineWidth(0.5).stroke();

            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, NAVY);
            doc.text('GST TAX SUMMARY', leftMargin + 8, curY + 6);

            // Table header
            const stY = curY + 18;
            doc.fontSize(6.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            const subW = (leftBoxW - 16) / 5;
            doc.text('Taxable (₹)', leftMargin + 8, stY, { width: subW });
            doc.text('CGST (₹)', leftMargin + 8 + subW, stY, { width: subW, align: 'right' });
            doc.text('SGST (₹)', leftMargin + 8 + subW * 2, stY, { width: subW, align: 'right' });
            doc.text('IGST (₹)', leftMargin + 8 + subW * 3, stY, { width: subW, align: 'right' });
            doc.text('Total Tax (₹)', leftMargin + 8 + subW * 4, stY, { width: subW, align: 'right' });

            const svY = stY + 11;
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(formatDec(totals.taxable_total, currency), leftMargin + 8, svY, { width: subW });
            doc.text(formatDec(totals.cgst_total, currency), leftMargin + 8 + subW, svY, { width: subW, align: 'right' });
            doc.text(formatDec(totals.sgst_total, currency), leftMargin + 8 + subW * 2, svY, { width: subW, align: 'right' });
            doc.text(formatDec(totals.igst_total, currency), leftMargin + 8 + subW * 3, svY, { width: subW, align: 'right' });
            setColor(doc, NAVY);
            doc.text(formatDec(totals.tax_total, currency), leftMargin + 8 + subW * 4, svY, { width: subW, align: 'right' });
        } else {
            // Left: Payment Status & Amount in Words
            doc.roundedRect(leftMargin, curY, leftBoxW, 58, 6);
            setColor(doc, BG_CARD);
            doc.fill();
            setStroke(doc, BORDER);
            doc.roundedRect(leftMargin, curY, leftBoxW, 58, 6).lineWidth(0.5).stroke();

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('PAYMENT STATUS', leftMargin + 8, curY + 6);
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, isPaid ? '#166534' : '#b45309');
            doc.text(isPaid ? 'PAID' : 'PARTIAL', leftMargin + 8, curY + 16);

            doc.fontSize(7).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(`Paid: ${currency} ${formatDec(totals.paid_amount, currency)} on ${dateStr}`, leftMargin + 50, curY + 17);

            doc.fontSize(7).font('Helvetica-Bold');
            setColor(doc, TEXT_MUTED);
            doc.text('AMOUNT IN WORDS', leftMargin + 8, curY + 32);
            doc.fontSize(7.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(totals.amount_in_words, leftMargin + 8, curY + 42, { width: leftBoxW - 16 });
        }

        // Right: Totals Box
        const tBoxX = leftMargin + leftBoxW + 12;
        doc.roundedRect(tBoxX, curY, totalsW, 58, 6);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(tBoxX, curY, totalsW, 58, 6).lineWidth(0.5).stroke();

        let tY = curY + 6;
        const drawTRow = (lbl, val) => {
            doc.fontSize(7.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, tBoxX + 8, tY);
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val, tBoxX + 8, tY, { width: totalsW - 16, align: 'right' });
            tY += 10;
        };

        drawTRow('Subtotal', `${currency} ${formatDec(totals.gross_subtotal, currency)}`);
        if (totals.global_discount > 0) drawTRow('Discount', `-${currency} ${formatDec(totals.global_discount, currency)}`);
        if (totals.tax_total > 0 && country !== 'IN') drawTRow('VAT Total', `+${currency} ${formatDec(totals.tax_total, currency)}`);
        if (totals.round_off !== 0) drawTRow('Round Off', `${currency} ${formatDec(totals.round_off, currency)}`);

        // Grand Total Banner
        const gtH = 18;
        const gtY = curY + 58 - gtH - 3;
        doc.roundedRect(tBoxX + 3, gtY, totalsW - 6, gtH, 4);
        setColor(doc, NAVY);
        doc.fill();

        doc.fontSize(8.5).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        doc.text('GRAND TOTAL', tBoxX + 10, gtY + 5);
        doc.text(`${currency} ${formatDec(totals.grand_total, currency)}`, tBoxX + 10, gtY + 5, { width: totalsW - 26, align: 'right' });

        curY += 68;

        // ═════════════════════════════════════════════════════════════════════
        // 5. BANK DETAILS & QR CODE & CONTACT SECTION
        // ═════════════════════════════════════════════════════════════════════
        const bH = 64;
        const b1W = (pageWidth - 16) * 0.45;
        const b2W = (pageWidth - 16) * 0.25;
        const b3W = (pageWidth - 16) * 0.30;

        // Card 1: Bank Details
        doc.roundedRect(leftMargin, curY, b1W, bH, 6);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(leftMargin, curY, b1W, bH, 6).lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text('BANK DETAILS', leftMargin + 8, curY + 6);
        const bank = invoice.bank_details_snapshot || shop?.bank_details || {};
        let bkY = curY + 18;
        const drawBk = (lbl, val) => {
            doc.fontSize(6.5).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(lbl, leftMargin + 8, bkY, { width: 60 });
            doc.font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(val || '—', leftMargin + 70, bkY, { width: b1W - 78 });
            bkY += 9;
        };
        drawBk('Bank Name:', bank.bank_name || 'Bank');
        drawBk('A/C No.:', bank.account_number || '—');
        drawBk('Branch & IFSC:', bank.iban_ifsc || '—');

        // Card 2: QR Code
        const b2X = leftMargin + b1W + 8;
        doc.roundedRect(b2X, curY, b2W, bH, 6);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(b2X, curY, b2W, bH, 6).lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(country === 'IN' ? 'UPI PAYMENT' : 'SCAN TO PAY', b2X + 8, curY + 6, { width: b2W - 16, align: 'center' });

        if (qrBmp) {
            try {
                doc.image(qrBmp, b2X + (b2W - 40) / 2, curY + 16, { width: 40, height: 40 });
            } catch (e) {
                // Fallback text if QR buffer cannot be rendered
            }
        }

        // Card 3: Contact / Tax Info
        const b3X = b2X + b2W + 8;
        doc.roundedRect(b3X, curY, b3W, bH, 6);
        setColor(doc, BG_CARD);
        doc.fill();
        setStroke(doc, BORDER);
        doc.roundedRect(b3X, curY, b3W, bH, 6).lineWidth(0.5).stroke();

        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, NAVY);
        doc.text(country === 'KW' ? 'TAX / REGISTRATION' : 'FOR ANY QUERIES', b3X + 8, curY + 6);
        doc.fontSize(7).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let qY = curY + 18;
        if (sellerPhone) { doc.text(`Phone: ${sellerPhone}`, b3X + 8, qY); qY += 9; }
        if (sellerEmail) { doc.text(`Email: ${sellerEmail}`, b3X + 8, qY); qY += 9; }
        doc.text('Scan QR or pay online for faster verification.', b3X + 8, qY, { width: b3W - 16 });

        curY += bH + 10;

        // ═════════════════════════════════════════════════════════════════════
        // 6. DECLARATION & SIGNATURES
        // ═════════════════════════════════════════════════════════════════════
        const halfSigW = (pageWidth - 20) / 2;
        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('DECLARATION', leftMargin, curY);
        doc.fontSize(6.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(
            invoice.declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
            leftMargin,
            curY + 9,
            { width: halfSigW }
        );

        // Signatures
        const sigLineY = curY + 38;
        setStroke(doc, BORDER);
        doc.moveTo(leftMargin, sigLineY).lineTo(leftMargin + 120, sigLineY).lineWidth(0.5).stroke();
        doc.fontSize(6.5).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text("Customer's Signature", leftMargin, sigLineY + 3);

        const rSigX = leftMargin + pageWidth - 140;
        doc.moveTo(rSigX, sigLineY).lineTo(leftMargin + pageWidth, sigLineY).lineWidth(0.5).stroke();
        doc.text(`For ${sellerName}`, rSigX, sigLineY - 9, { width: 140, align: 'right' });
        doc.text('Authorised Signatory', rSigX, sigLineY + 3, { width: 140, align: 'right' });

        // ═════════════════════════════════════════════════════════════════════
        // 7. FOOTER BAR
        // ═════════════════════════════════════════════════════════════════════
        const footerY = doc.page.height - 35;
        doc.rect(leftMargin, footerY, pageWidth, 16);
        setColor(doc, NAVY);
        doc.fill();

        doc.fontSize(7).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        doc.text('Thank you for your business!  |  Powered by Hisabi POS  |  www.hisabi.com', leftMargin, footerY + 4, {
            width: pageWidth,
            align: 'center'
        });

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

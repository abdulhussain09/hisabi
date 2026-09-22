const PDFDocument = require('pdfkit');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PRIMARY = '#4f46e5';
const TEXT_MAIN = '#1e293b';
const TEXT_MUTED = '#64748b';
const BG_LIGHT = '#f8fafc';
const BORDER = '#e2e8f0';

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : [0, 0, 0];
}

function setColor(doc, hex) {
    doc.fillColor(hexToRgb(hex));
}

function setStroke(doc, hex) {
    doc.strokeColor(hexToRgb(hex));
}

// ─── Invoice PDF ─────────────────────────────────────────────────────────────

const generateInvoicePDF = (invoice, shop) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 80; // minus margins
        const country = shop.country || 'AE';
        const isIndia = country === 'IN';
        const isUAE = country === 'AE';
        const currency = shop.currency || 'AED';
        const date = formatDate(invoice.date);
        const time = new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        // ── Header bar ──────────────────────────────────────────────────────
        // Shop name
        doc.fontSize(22).font('Helvetica-Bold');
        setColor(doc, PRIMARY);
        doc.text(shop.name || 'Shop', 40, 40);

        // Invoice label top-right
        doc.fontSize(20).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text('INVOICE', 40, 40, { align: 'right' });

        // Shop details below shop name
        doc.fontSize(9).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let shopY = 68;
        if (shop.address) { doc.text(shop.address, 40, shopY); shopY += 13; }
        if (shop.phone || shop.email) {
            doc.text([shop.phone, shop.email].filter(Boolean).join('  |  '), 40, shopY);
            shopY += 13;
        }
        if (isUAE && shop.trn) {
            doc.font('Helvetica-Bold').text(`TRN: ${shop.trn}`, 40, shopY);
            shopY += 13;
        } else if (isIndia && shop.gstin) {
            doc.font('Helvetica-Bold').text(`GSTIN: ${shop.gstin}`, 40, shopY);
            shopY += 13;
        }

        // Invoice meta top-right
        doc.fontSize(10).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(`ID: #${invoice.invoice_number}`, 40, 68, { align: 'right' });
        doc.text(`Date: ${date}`, 40, 82, { align: 'right' });
        
        // Add Payment Info below Date
        doc.fontSize(8);
        doc.text(`Method: ${(invoice.payment_method || 'Cash').toUpperCase()}`, 40, 96, { align: 'right' });
        doc.text(`Time: ${time}`, 40, 108, { align: 'right' });

        // Divider line under header
        const divY = 125;
        setStroke(doc, PRIMARY);
        doc.moveTo(40, divY).lineTo(40 + pageWidth, divY).lineWidth(2).stroke();

        // ── Bill To ─────────────────────────────────────────────────────────
        doc.fontSize(9).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('BILL TO', 40, divY + 15);
        doc.fontSize(13).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(invoice.customer_name || 'Walk-in Customer', 40, divY + 28);
        
        // Customer Details Expansion
        doc.fontSize(9).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let custY = divY + 44;
        if (invoice.customer_phone) {
            doc.text(`Phone: ${invoice.customer_phone}`, 40, custY);
            custY += 12;
        }
        if (invoice.customer_email) {
            doc.text(`Email: ${invoice.customer_email}`, 40, custY);
            custY += 12;
        }
        if (invoice.customer_address) {
            doc.text(`Address: ${invoice.customer_address}`, 40, custY, { width: 220 });
        }

        // ── Payment Highlight Line ──────────────────────────────────────────
        const highlightY = divY + 80;
        doc.fontSize(10).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(`${currency} ${parseFloat(invoice.paid_amount).toFixed(2)} paid on ${date}, ${time}`, 40, highlightY, { align: 'center', width: pageWidth });

        // ── Items table ─────────────────────────────────────────────────────
        const tableTop = highlightY + 25;
        const colX = {
            no: 40,
            desc: 80,
            qty: isIndia ? 310 : 340,
            price: isIndia ? 360 : 410,
            mrp: isIndia ? 435 : 0,
            total: 495,
        };

        // Table header background
        doc.rect(40, tableTop, pageWidth, 22);
        setColor(doc, BG_LIGHT);
        doc.fill();

        // Table header text
        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        const thY = tableTop + 7;
        doc.text('#', colX.no, thY, { width: 36, align: 'center' });
        doc.text('ITEM DESCRIPTION', colX.desc, thY);
        doc.text('QTY', colX.qty, thY, { width: 45, align: 'center' });
        doc.text('PRICE', colX.price, thY, { width: 70, align: 'right' });
        if (isIndia) {
            doc.text('MRP', colX.mrp, thY, { width: 55, align: 'right' });
        }
        doc.text('TOTAL', colX.total, thY, { width: 60, align: 'right' });

        // Header bottom border
        setStroke(doc, BORDER);
        doc.moveTo(40, tableTop + 22).lineTo(40 + pageWidth, tableTop + 22).lineWidth(1).stroke();

        // Rows
        let rowY = tableTop + 22;
        const items = invoice.items || [];
        items.forEach((item, idx) => {
            const rowH = item.Product?.description ? 30 : 22;

            // Alternating row background
            if (idx % 2 === 1) {
                doc.rect(40, rowY, pageWidth, rowH);
                setColor(doc, '#fafafa');
                doc.fill();
            }

            // Row text
            doc.fontSize(9).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            const textY = rowY + (rowH - 9) / 2 - (item.Product?.description ? 5 : 0);

            doc.text(`${idx + 1}`, colX.no, textY, { width: 36, align: 'center' });
            doc.text(item.Product?.name || '', colX.desc, textY, { width: 255 });

            if (item.Product?.description) {
                doc.fontSize(7.5).font('Helvetica');
                setColor(doc, TEXT_MUTED);
                doc.text(item.Product.description, colX.desc, textY + 12, { width: 255 });
            }

            doc.fontSize(9).font('Helvetica');
            setColor(doc, TEXT_MAIN);
            doc.text(`${item.quantity}`, colX.qty, textY, { width: 45, align: 'center' });
            doc.text(parseFloat(item.unit_price).toFixed(2), colX.price, textY, { width: 70, align: 'right' });
            if (isIndia) {
                doc.text(
                    item.mrp && parseFloat(item.mrp) > 0 ? parseFloat(item.mrp).toFixed(2) : '—',
                    colX.mrp, textY, { width: 55, align: 'right' }
                );
            }
            doc.text(
                (item.quantity * item.unit_price).toFixed(2),
                colX.total, textY, { width: 60, align: 'right' }
            );

            // Row border
            setStroke(doc, BORDER);
            doc.moveTo(40, rowY + rowH).lineTo(40 + pageWidth, rowY + rowH).lineWidth(0.5).stroke();
            rowY += rowH;
        });

        // ── Totals ───────────────────────────────────────────────────────────
        const totalsX = 40 + pageWidth - 250;
        let totY = rowY + 20;

        const drawTotalRow = (label, value, isFinal = false) => {
            if (isFinal) {
                setStroke(doc, PRIMARY);
                doc.moveTo(totalsX, totY - 3).lineTo(40 + pageWidth, totY - 3).lineWidth(1.5).stroke();
                doc.fontSize(13).font('Helvetica-Bold');
                setColor(doc, PRIMARY);
            } else {
                doc.fontSize(10).font('Helvetica');
                setColor(doc, TEXT_MUTED);
            }
            doc.text(label, totalsX, totY, { width: 140 });
            if (isFinal) {
                setColor(doc, PRIMARY);
            } else {
                setColor(doc, TEXT_MAIN);
            }
            doc.text(value, totalsX + 140, totY, { width: 110, align: 'right' });
            totY += isFinal ? 20 : 16;
        };

        drawTotalRow('Subtotal', `${currency} ${parseFloat(invoice.subtotal).toFixed(2)}`);
        if (parseFloat(invoice.tax_total) > 0) {
            const taxLabel = isIndia ? 'GST' : (isUAE ? 'VAT (5%)' : 'Tax');
            drawTotalRow(taxLabel, `${currency} ${parseFloat(invoice.tax_total).toFixed(2)}`);
        }
        if (parseFloat(invoice.discount) > 0) {
            drawTotalRow('Discount', `-${currency} ${parseFloat(invoice.discount).toFixed(2)}`);
        }
        drawTotalRow('Grand Total', `${currency} ${parseFloat(invoice.grand_total).toFixed(2)}`, true);

        // ── Payment info box ──────────────────────────────────────────────────
        totY += 10;
        const boxH = parseFloat(invoice.due_amount) > 0 ? 52 : 30;
        doc.rect(totalsX, totY, 250, boxH);
        setColor(doc, BG_LIGHT);
        doc.fill();

        doc.fontSize(10).font('Helvetica');
        setColor(doc, TEXT_MAIN);
        doc.text('Paid Amount:', totalsX + 10, totY + 8);
        doc.font('Helvetica-Bold');
        doc.text(`${currency} ${parseFloat(invoice.paid_amount || 0).toFixed(2)}`, totalsX + 10, totY + 8, { width: 230, align: 'right' });

        if (parseFloat(invoice.due_amount) > 0) {
            doc.fontSize(10).font('Helvetica');
            doc.fillColor([220, 38, 38]);
            doc.text('Balance Due:', totalsX + 10, totY + 30);
            doc.font('Helvetica-Bold');
            doc.text(`${currency} ${parseFloat(invoice.due_amount).toFixed(2)}`, totalsX + 10, totY + 30, { width: 230, align: 'right' });
        }

        // ── Footer: stamp on page 0 using bufferPages ─────────────────────────
        // With bufferPages:true, switchToPage is safe before doc.end()
        doc.switchToPage(0);

        const footerY = doc.page.height - 58;
        setStroke(doc, BORDER);
        doc.moveTo(40, footerY).lineTo(40 + pageWidth, footerY).lineWidth(0.5).stroke();

        doc.fontSize(10).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text('Thank you for your business!', 40, footerY + 6, { align: 'center', lineBreak: false });

        doc.fontSize(8).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text('If you have any questions about this invoice, please contact us.', 40, footerY + 18, { align: 'center', lineBreak: false });
        
        doc.fontSize(7).font('Helvetica-Bold');
        doc.text('Powered by Hisabi', 40, footerY + 29, { align: 'center', lineBreak: false });

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

        // Header
        doc.fontSize(22).font('Helvetica-Bold');
        setColor(doc, PRIMARY);
        doc.text(shop.name || 'Shop', { align: 'center' });

        if (shop.address) {
            doc.fontSize(9).font('Helvetica');
            setColor(doc, TEXT_MUTED);
            doc.text(shop.address, { align: 'center' });
        }

        // Divider
        setStroke(doc, PRIMARY);
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
        setColor(doc, BG_LIGHT);
        doc.fill();

        let sumY = boxTop + 12;
        summaryRows.forEach(([label, value, isTotal]) => {
            if (isTotal) {
                setStroke(doc, BORDER);
                doc.moveTo(col1 + 10, sumY - 4).lineTo(col1 + boxW - 10, sumY - 4).lineWidth(0.5).stroke();
                doc.fontSize(13).font('Helvetica-Bold');
                setColor(doc, PRIMARY);
            } else {
                doc.fontSize(11).font('Helvetica');
                setColor(doc, TEXT_MAIN);
            }
            doc.text(label, col1 + 12, sumY);
            if (isTotal) setColor(doc, PRIMARY);
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

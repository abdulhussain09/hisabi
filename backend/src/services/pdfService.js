const PDFDocument = require('pdfkit');
const { createQRMatrix, matrixToBMPBuffer } = require('../utils/qrGenerator');
const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
const { getCountryConfig } = require('../config/countryConfig');

// ─── Color Palette ─────────────────────────────────────────────────────────

const TEXT_MAIN = '#0f172a';
const TEXT_MUTED = '#64748b';
const BG_LIGHT = '#f8fafc';
const BORDER = '#dce7f3';

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

// ─── Invoice PDF Generator ────────────────────────────────────────────────────

const generateInvoicePDF = (invoice, shop) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width - 80;
        const country = invoice.country || shop.country || 'AE';
        const countryConfig = getCountryConfig(country);

        // Run Authoritative Calculation Engine for 100% parity with React UI
        const calculation = calculateInvoice({
            items: invoice.items || [],
            shop: { ...shop, country },
            globalDiscount: invoice.discount || 0,
            paidAmount: invoice.paid_amount || 0,
            sellerState: invoice.seller_address_snapshot || shop.address || '',
            buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
            reverseCharge: invoice.reverse_charge
        });

        const { items: calcItems, totals, meta } = calculation;
        const currency = meta.currency;
        const dateStr = formatDate(invoice.date);
        const timeStr = invoice.date ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        const primaryColor = shop?.brand_color || countryConfig.visualTheme.primaryColor || '#0f172a';

        // ── Logo Rendering ──────────────────────────────────────────────────
        let textLeftMargin = 40;
        if (shop?.brand_logo && typeof shop.brand_logo === 'string') {
            try {
                let imgBuf = null;
                if (shop.brand_logo.startsWith('data:image/')) {
                    const base64Data = shop.brand_logo.split(',')[1];
                    if (base64Data) imgBuf = Buffer.from(base64Data, 'base64');
                }
                if (imgBuf) {
                    doc.image(imgBuf, 40, 35, { fit: [50, 50] });
                    textLeftMargin = 100;
                }
            } catch (e) {
                // Non-fatal logo render fallback
            }
        }

        // Shop Name
        doc.fontSize(20).font('Helvetica-Bold');
        setColor(doc, primaryColor);
        doc.text(invoice.seller_name_snapshot || shop.name || 'Store Name', textLeftMargin, 40);

        // Invoice Title Top-Right
        doc.fontSize(16).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(invoice.invoice_title || countryConfig.invoiceTitle, 40, 40, { align: 'right' });

        // Shop Details
        doc.fontSize(8.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let shopY = 66;
        if (invoice.seller_address_snapshot || shop.address) {
            doc.text(invoice.seller_address_snapshot || shop.address, textLeftMargin, shopY);
            shopY += 12;
        }
        if (shop.phone || shop.email) {
            doc.text([shop.phone, shop.email].filter(Boolean).join('  |  '), textLeftMargin, shopY);
            shopY += 12;
        }

        const taxId = invoice.seller_tax_id_snapshot || shop.trn || shop.gstin;
        if (taxId) {
            doc.font('Helvetica-Bold');
            setColor(doc, primaryColor);
            doc.text(`${countryConfig.fields.sellerTaxIdLabel}: ${taxId}`, textLeftMargin, shopY);
        }

        // Metadata Top-Right
        doc.fontSize(9).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text(`Invoice No: #${String(invoice.invoice_number || '0000').padStart(5, '0')}`, 40, 64, { align: 'right' });
        doc.text(`Date: ${dateStr}`, 40, 78, { align: 'right' });
        doc.text(`Time: ${timeStr}`, 40, 92, { align: 'right' });
        doc.text(`Payment: ${(invoice.payment_method || 'Cash').toUpperCase()}`, 40, 106, { align: 'right' });

        // Divider
        const divY = 125;
        setStroke(doc, primaryColor);
        doc.moveTo(40, divY).lineTo(40 + pageWidth, divY).lineWidth(1.5).stroke();

        // ── Bill To Card ─────────────────────────────────────────────────────
        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('BILL TO', 40, divY + 15);
        doc.fontSize(12).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(invoice.customer_name || 'Walk-in Customer', 40, divY + 27);

        doc.fontSize(8.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        let custY = divY + 42;
        if (invoice.customer_phone) { doc.text(`Ph: ${invoice.customer_phone}`, 40, custY); custY += 11; }
        if (invoice.customer_email) { doc.text(`Email: ${invoice.customer_email}`, 40, custY); custY += 11; }
        if (invoice.customer_address) { doc.text(`Address: ${invoice.customer_address}`, 40, custY, { width: 250 }); }

        // ── Items Table ──────────────────────────────────────────────────────
        const tableTop = divY + 80;
        const colX = {
            no: 40,
            desc: 75,
            qty: country === 'IN' ? 290 : 320,
            price: country === 'IN' ? 335 : 380,
            mrp: country === 'IN' ? 410 : 0,
            total: 485
        };

        // Table Header
        doc.rect(40, tableTop, pageWidth, 20);
        setColor(doc, primaryColor);
        doc.fill();

        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, '#ffffff');
        const thY = tableTop + 6;
        doc.text('#', colX.no, thY, { width: 30, align: 'center' });
        doc.text('ITEM DESCRIPTION', colX.desc, thY);
        doc.text('QTY', colX.qty, thY, { width: 40, align: 'center' });
        doc.text('PRICE', colX.price, thY, { width: 70, align: 'right' });
        if (country === 'IN') {
            doc.text('MRP', colX.mrp, thY, { width: 70, align: 'right' });
        }
        doc.text('TOTAL', colX.total, thY, { width: 70, align: 'right' });

        let rowY = tableTop + 20;
        calcItems.forEach((item, idx) => {
            const rowH = item.item_description ? 28 : 20;
            if (idx % 2 === 1) {
                doc.rect(40, rowY, pageWidth, rowH);
                setColor(doc, BG_LIGHT);
                doc.fill();
            }

            const textY = rowY + (rowH - 8) / 2 - (item.item_description ? 4 : 0);
            doc.fontSize(8.5).font('Helvetica-Bold');
            setColor(doc, TEXT_MAIN);
            doc.text(`${idx + 1}`, colX.no, textY, { width: 30, align: 'center' });
            doc.text(item.item_name, colX.desc, textY, { width: 210 });

            if (item.item_description) {
                doc.fontSize(7.5).font('Helvetica');
                setColor(doc, TEXT_MUTED);
                doc.text(item.item_description, colX.desc, textY + 11, { width: 210 });
            }

            doc.fontSize(8.5).font('Helvetica');
            setColor(doc, TEXT_MAIN);
            doc.text(`${item.quantity} ${item.unit || ''}`, colX.qty, textY, { width: 40, align: 'center' });
            doc.text(formatDec(item.unit_price, currency), colX.price, textY, { width: 70, align: 'right' });
            if (country === 'IN') {
                doc.text(item.mrp ? formatDec(item.mrp, currency) : '—', colX.mrp, textY, { width: 70, align: 'right' });
            }
            doc.text(formatDec(item.line_total, currency), colX.total, textY, { width: 70, align: 'right' });

            setStroke(doc, BORDER);
            doc.moveTo(40, rowY + rowH).lineTo(40 + pageWidth, rowY + rowH).lineWidth(0.5).stroke();
            rowY += rowH;
        });

        // ── Totals Box ───────────────────────────────────────────────────────
        const totalsX = 40 + pageWidth - 240;
        let totY = rowY + 15;

        const drawTotalRow = (label, value, isFinal = false) => {
            if (isFinal) {
                setStroke(doc, primaryColor);
                doc.moveTo(totalsX, totY - 2).lineTo(40 + pageWidth, totY - 2).lineWidth(1.5).stroke();
                doc.fontSize(11).font('Helvetica-Bold');
                setColor(doc, primaryColor);
            } else {
                doc.fontSize(9).font('Helvetica');
                setColor(doc, TEXT_MUTED);
            }
            doc.text(label, totalsX, totY, { width: 130 });
            if (isFinal) setColor(doc, primaryColor); else setColor(doc, TEXT_MAIN);
            doc.text(value, totalsX + 130, totY, { width: 110, align: 'right' });
            totY += isFinal ? 18 : 14;
        };

        drawTotalRow('Subtotal', `${currency} ${formatDec(totals.gross_subtotal, currency)}`);
        if (totals.total_line_discount > 0) {
            drawTotalRow('Line Discounts', `-${currency} ${formatDec(totals.total_line_discount, currency)}`);
        }
        if (totals.global_discount > 0) {
            drawTotalRow('Invoice Discount', `-${currency} ${formatDec(totals.global_discount, currency)}`);
        }
        if (countryConfig.supportsTax && totals.tax_total > 0) {
            const taxLabel = country === 'IN' ? 'GST Total' : 'VAT (5%)';
            drawTotalRow(taxLabel, `+${currency} ${formatDec(totals.tax_total, currency)}`);
        }
        if (totals.round_off !== 0) {
            drawTotalRow('Round Off', `${currency} ${formatDec(totals.round_off, currency)}`);
        }

        drawTotalRow('Grand Total', `${currency} ${formatDec(totals.grand_total, currency)}`, true);

        // Paid & Balance Box
        totY += 5;
        doc.rect(totalsX, totY, 240, totals.due_amount > 0 ? 40 : 22);
        setColor(doc, BG_LIGHT);
        doc.fill();

        doc.fontSize(9).font('Helvetica');
        setColor(doc, TEXT_MAIN);
        doc.text('Paid Amount:', totalsX + 10, totY + 6);
        doc.font('Helvetica-Bold');
        doc.text(`${currency} ${formatDec(totals.paid_amount, currency)}`, totalsX + 10, totY + 6, { width: 220, align: 'right' });

        if (totals.due_amount > 0) {
            doc.fontSize(9).font('Helvetica-Bold');
            doc.fillColor([220, 38, 38]);
            doc.text('Balance Due:', totalsX + 10, totY + 22);
            doc.text(`${currency} ${formatDec(totals.due_amount, currency)}`, totalsX + 10, totY + 22, { width: 220, align: 'right' });
        }

        // Amount in words
        totY += totals.due_amount > 0 ? 50 : 32;
        doc.fontSize(8).font('Helvetica-Bold');
        setColor(doc, TEXT_MUTED);
        doc.text('AMOUNT CHARGEABLE (IN WORDS)', 40, totY);
        doc.fontSize(9).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text(totals.amount_in_words, 40, totY + 11);

        // ── Render GCC / UPI QR Code ─────────────────────────────────────────
        if (invoice.qr_code_data) {
            try {
                const qrMatrix = createQRMatrix(invoice.qr_code_data);
                const qrBmp = matrixToBMPBuffer(qrMatrix, 2, 1);
                doc.image(qrBmp, 40, totY + 30, { width: 65, height: 65 });
            } catch (e) {
                // Non-fatal if QR draw fails
            }
        }

        // Footer
        doc.switchToPage(0);
        const footerY = doc.page.height - 50;
        setStroke(doc, BORDER);
        doc.moveTo(40, footerY).lineTo(40 + pageWidth, footerY).lineWidth(0.5).stroke();

        doc.fontSize(9).font('Helvetica-Bold');
        setColor(doc, TEXT_MAIN);
        doc.text('Thank you for your business!', 40, footerY + 6, { align: 'center', lineBreak: false });

        doc.fontSize(7.5).font('Helvetica');
        setColor(doc, TEXT_MUTED);
        doc.text('Powered by Hisabi POS', 40, footerY + 18, { align: 'center', lineBreak: false });

        doc.end();
    });
};

const generateDueReceiptPDF = require('./pdfService').generateDueReceiptPDF || null;

module.exports = { generateInvoicePDF, generateDueReceiptPDF };

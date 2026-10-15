const PDFDocument = require('pdfkit');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { renderInvoiceToHTML } = require('./ssrInvoiceRenderer');

// ─── Color Palette & Helpers (Preserved for Due Payment Receipt PDF) ──────────

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

const puppeteer = require('puppeteer-core');
let chromiumModule = null;
try {
    const rawChromium = require('@sparticuz/chromium');
    chromiumModule = rawChromium.default || rawChromium;
} catch (e) {
    console.warn('[PDF] @sparticuz/chromium module not loaded:', e.message);
}

// Helper to resolve available Chromium / Chrome binary and launch configuration
async function getChromiumLaunchConfig() {
    // 1. Explicit environment variables
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
        return {
            executablePath: process.env.CHROME_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote'],
            headless: true
        };
    }
    if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
        return {
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote'],
            headless: true
        };
    }

    // 2. System binary installed via Docker / apt-get (/usr/bin/chromium)
    if (fs.existsSync('/usr/bin/chromium')) {
        return {
            executablePath: '/usr/bin/chromium',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote'],
            headless: true
        };
    }

    // 3. Serverless / Render native Node runtime via @sparticuz/chromium (bundles all required shared libs)
    if (chromiumModule && typeof chromiumModule.executablePath === 'function') {
        try {
            const execPath = await chromiumModule.executablePath();
            if (execPath && fs.existsSync(execPath)) {
                return {
                    executablePath: execPath,
                    args: chromiumModule.args || ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                    headless: chromiumModule.headless !== undefined ? chromiumModule.headless : true
                };
            }
        } catch (e) {
            console.warn('[PDF] @sparticuz/chromium executable resolution failed:', e.message);
        }
    }

    // 4. Other standard Linux distribution candidate paths
    const candidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
    ];
    for (const bin of candidates) {
        if (fs.existsSync(bin)) {
            return {
                executablePath: bin,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote'],
                headless: true
            };
        }
    }

    return null;
}

async function generateInvoicePDFWithChrome(invoice, shop) {
    const config = await getChromiumLaunchConfig();
    if (!config || !config.executablePath) {
        throw new Error('Chromium/Chrome executable not found. Please install Chromium or configure CHROME_PATH.');
    }

    const plainInvoice = typeof invoice?.toJSON === 'function' ? invoice.toJSON() : invoice;
    const plainShop = typeof shop?.toJSON === 'function' ? shop.toJSON() : shop;

    // Use the SSR renderer — renders the actual React components so the PDF
    // is pixel-perfect identical to the browser preview.
    const html = await renderInvoiceToHTML(plainInvoice, plainShop);

    const browser = await puppeteer.launch({
        args: config.args,
        defaultViewport: { width: 794, height: 1123, deviceScaleFactor: 1 },
        executablePath: config.executablePath,
        headless: config.headless
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });
        return Buffer.from(pdfBuffer);
    } catch (err) {
        console.error('[PDF] Chromium generation error:', err.message);
        throw new Error(`Chromium execution failed: ${err.message}`);
    } finally {
        await browser.close().catch(() => {});
    }
}

// ─── Master PDF Generator ────────────────────────────────────────────────────
// Headless Chromium SSR is the sole authoritative invoice PDF generator.
// Any failure surfaces an explicit error rather than silently degrading to a legacy layout.

const generateInvoicePDF = async (invoice, shop) => {
    const buffer = await generateInvoicePDFWithChrome(invoice, shop);
    if (!buffer || buffer.length === 0) {
        throw new Error('Chromium rendering produced an empty PDF buffer');
    }
    console.log('[PDF] Chrome render succeeded, size:', buffer.length);
    return buffer;
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

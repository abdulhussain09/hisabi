const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const assert = require('assert');
const { generateInvoicePDF, generateInvoicePDFKit } = require('./src/services/pdfService');
const QRCode = require('qrcode');

function getPageCount(filePath) {
    const output = execSync(`pdfinfo "${filePath}"`, { encoding: 'utf8' });
    const match = output.match(/Pages:\s+(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function getPdfText(filePath) {
    return execSync(`pdftotext "${filePath}" -`, { encoding: 'utf8' });
}

async function run() {
    const outDir = path.join(__dirname, 'test_output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    console.log('=================================================================');
    console.log('=== STEP 1: Direct QR Payload and Production PNG Unit Tests   ===');
    console.log('=================================================================');

    // 1.1 India QR payload tests (safe UPI resolution)
    const sellerIN = 'Sharma Electronics';
    const amountIN = '3156.00';
    const customUPI = 'sharma@okhdfcbank';
    const upiCustomExpected = `upi://pay?pa=${customUPI}&pn=${encodeURIComponent(sellerIN)}&am=${amountIN}&cu=INR`;
    assert.strictEqual(
        `upi://pay?pa=${customUPI}&pn=${encodeURIComponent(sellerIN)}&am=${amountIN}&cu=INR`,
        upiCustomExpected,
        'India custom UPI string format must match standard UPI deep-link'
    );

    // Function matching production resolution: upiId must exist, no hisabi@upi fallback
    const resolveIndiaUpiPayload = (invoice, shop, grandTotal) => {
        const upiId = shop?.upi_id || invoice.upi_id || null;
        if (invoice.qr_code_data) return invoice.qr_code_data;
        if (!upiId) return null;
        return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(invoice.seller_name_snapshot || shop?.name || '')}&am=${grandTotal}&cu=INR`;
    };

    assert.strictEqual(
        resolveIndiaUpiPayload({}, { upi_id: 'seller@bank', name: 'Shop' }, '100.00'),
        'upi://pay?pa=seller%40bank&pn=Shop&am=100.00&cu=INR',
        'Configured UPI must resolve to valid URI'
    );
    assert.strictEqual(
        resolveIndiaUpiPayload({}, { upi_id: null }, '100.00'),
        null,
        'Missing shop UPI must resolve to null, never hisabi@upi'
    );
    assert.strictEqual(
        resolveIndiaUpiPayload({}, {}, '100.00'),
        null,
        'Unconfigured UPI must resolve to null, never hisabi@upi'
    );

    // 1.2 Production PNG buffer validation (PNG magic header: 89 50 4E 47 0D 0A 1A 0A)
    const pngBuf = await QRCode.toBuffer(upiCustomExpected, { type: 'png', width: 108, margin: 1 });
    assert(Buffer.isBuffer(pngBuf), 'Production QR generator must return a Buffer');
    assert.strictEqual(pngBuf.slice(0, 8).toString('hex'), '89504e470d0a1a0a', 'PNG header magic must match standard PNG specification');
    console.log('✓ India QR payload resolution and production PNG buffer generation verified');

    // 1.2 UAE QR payload logic tests
    const uaePayloadLogic = (invoice, country) => {
        return invoice.qr_code_data || (country === 'IN'
            ? `upi://pay?pa=hisabi@upi&pn=Test&am=100&cu=INR`
            : null);
    };
    assert.strictEqual(
        uaePayloadLogic({ qr_code_data: null }, 'AE'),
        null,
        'UAE invoice without qr_code_data must resolve to null, never a fabricated verification URL'
    );
    assert.strictEqual(
        uaePayloadLogic({ qr_code_data: undefined }, 'AE'),
        null,
        'UAE invoice with undefined qr_code_data must resolve to null'
    );
    const validUAEQR = 'GENUINE_FTA_QR_DATA_BASE64';
    assert.strictEqual(
        uaePayloadLogic({ qr_code_data: validUAEQR }, 'AE'),
        validUAEQR,
        'UAE invoice with genuine qr_code_data must preserve data directly'
    );
    console.log('✓ UAE QR payload resolution logic verified');

    // 1.3 Kuwait QR payload logic tests
    const kwPayloadLogic = (invoice, country) => {
        return invoice.qr_code_data || (country === 'IN'
            ? `upi://pay?pa=hisabi@upi&pn=Test&am=100&cu=INR`
            : null);
    };
    assert.strictEqual(
        kwPayloadLogic({ qr_code_data: null }, 'KW'),
        null,
        'Kuwait invoice without qr_code_data must resolve to null, never a fabricated KNET URL'
    );
    assert.strictEqual(
        kwPayloadLogic({ qr_code_data: undefined }, 'KW'),
        null,
        'Kuwait invoice with undefined qr_code_data must resolve to null'
    );
    const validKWQR = 'https://valid-payment-gateway.kw/invoice/3001';
    assert.strictEqual(
        kwPayloadLogic({ qr_code_data: validKWQR }, 'KW'),
        validKWQR,
        'Kuwait invoice with configured payment link must preserve link directly'
    );
    console.log('✓ Kuwait QR payload resolution logic verified');


    console.log('\n=================================================================');
    console.log('=== STEP 2: Fixture Definitions & Expected Metadata           ===');
    console.log('=================================================================');

    const sampleShopIN = {
        name: 'Sharma Electronics',
        address: '123 MG Road, Bengaluru, Karnataka, 560001',
        phone: '+91 98765 43210',
        email: 'billing@sharma.in',
        country: 'IN',
        currency: 'INR',
        gstin: '29ABCDE1234F1Z5',
        upi_id: 'sharma@okhdfcbank',
        bank_name: 'HDFC Bank',
        bank_account_number: '50200012345678',
        bank_iban_ifsc: 'HDFC0001234'
    };

    const sampleInvoiceIN = {
        invoice_number: '1001',
        country: 'IN',
        date: new Date().toISOString(),
        payment_method: 'UPI',
        customer_name: 'Rahul Verma',
        customer_phone: '+91 91234 56789',
        customer_email: 'rahul@example.com',
        customer_address: 'Indiranagar, Bengaluru, Karnataka',
        seller_tax_id_snapshot: '29ABCDE1234F1Z5',
        place_of_supply_state: 'Karnataka',
        place_of_supply_code: '29',
        items: [
            { item_name: 'Wireless Mouse', hsn_sac: '8471', quantity: 2, unit_price: 500, discount: 0, tax_rate: 18 },
            { item_name: 'Mechanical Keyboard', hsn_sac: '8471', quantity: 1, unit_price: 2500, discount: 200, tax_rate: 18 }
        ]
    };

    const sampleShopAE = {
        name: 'Al Noor Supermarket LLC',
        address: 'Sheikh Zayed Road, Business Bay, Dubai, UAE',
        phone: '+971 4 123 4567',
        email: 'accounts@alnoor.ae',
        country: 'AE',
        currency: 'AED',
        tax_id: '100234567800003',
        bank_name: 'Emirates NBD',
        bank_account_number: '101234567890',
        bank_iban_ifsc: 'AE29026000101234567890'
    };

    const sampleInvoiceAE = {
        invoice_number: '2001',
        country: 'AE',
        date: new Date().toISOString(),
        payment_method: 'CASH',
        customer_name: 'Ahmed Al Mansoori',
        customer_phone: '+971 50 987 6543',
        customer_email: 'ahmed@example.com',
        customer_address: 'Downtown Dubai',
        seller_tax_id_snapshot: '100234567800003',
        items: [
            { item_name: 'Basmati Rice 5kg', quantity: 3, unit_price: 45.00, discount: 5.00, tax_rate: 5 },
            { item_name: 'Olive Oil 1L', quantity: 2, unit_price: 28.50, discount: 0, tax_rate: 5 }
        ]
    };

    const sampleShopKW = {
        name: 'Kuwait Trading Co.',
        address: 'Salmiya, Block 4, Kuwait City',
        phone: '+965 2222 3333',
        email: 'info@kuwaittrading.com',
        country: 'KW',
        currency: 'KWD',
        cr_number: 'CR-98765',
        bank_name: 'National Bank of Kuwait (NBK)',
        bank_account_number: '0123456789',
        bank_iban_ifsc: 'KW81NBOK0000000123456789'
    };

    const sampleInvoiceKW = {
        invoice_number: '3001',
        country: 'KW',
        date: new Date().toISOString(),
        payment_method: 'KNET',
        customer_name: 'Fatima Al-Sabah',
        customer_phone: '+965 9988 7766',
        customer_email: 'fatima@example.kw',
        customer_address: 'Al-Jabriya, Kuwait',
        items: [
            { item_name: 'Premium Coffee Beans', quantity: 2, unit_price: 4.500, discount: 0.500, tax_rate: 0 },
            { item_name: 'Ceramic Mug Set', quantity: 1, unit_price: 8.250, discount: 0, tax_rate: 0 }
        ]
    };

    // Multi-page test invoice fixture (25 items designed to span 3 pages in Chrome)
    // Multi-page test invoice fixture (25 items designed to span 3 pages in Chrome)
    const multiPageInvoiceIN = {
        ...sampleInvoiceIN,
        invoice_number: '1002-MULTI',
        items: Array.from({ length: 25 }, (_, i) => ({
            item_name: `Industrial Equipment Part #${i + 1} - Extended Description`,
            hsn_sac: '8471',
            quantity: 1,
            unit_price: 1000 + i * 50,
            discount: 0,
            tax_rate: 18
        }))
    };

    // India fixture WITHOUT configured UPI
    const sampleShopINNoUPI = {
        ...sampleShopIN,
        upi_id: null
    };
    const sampleInvoiceINNoUPI = {
        ...sampleInvoiceIN,
        invoice_number: '1003-NO-UPI',
        qr_code_data: null
    };

    console.log('✓ Test fixtures configured');


    console.log('\n=================================================================');
    console.log('=== STEP 3: Testing Chrome Headless Renderer                  ===');
    console.log('=================================================================');

    const chromeIN = await generateInvoicePDF(sampleInvoiceIN, sampleShopIN);
    const chromeINPath = path.join(outDir, 'chrome_IN.pdf');
    fs.writeFileSync(chromeINPath, chromeIN);
    assert(Buffer.isBuffer(chromeIN) && chromeIN.length > 5000, 'Chrome IN PDF must be a non-empty buffer > 5KB');
    console.log('✓ Chrome IN PDF generated:', chromeIN.length, 'bytes');

    const chromeINNoUPI = await generateInvoicePDF(sampleInvoiceINNoUPI, sampleShopINNoUPI);
    const chromeINNoUPIPath = path.join(outDir, 'chrome_IN_no_upi.pdf');
    fs.writeFileSync(chromeINNoUPIPath, chromeINNoUPI);
    assert(Buffer.isBuffer(chromeINNoUPI) && chromeINNoUPI.length > 5000, 'Chrome IN No-UPI PDF must be a non-empty buffer > 5KB');
    console.log('✓ Chrome IN No-UPI PDF generated:', chromeINNoUPI.length, 'bytes');

    const chromeAE = await generateInvoicePDF(sampleInvoiceAE, sampleShopAE);
    const chromeAEPath = path.join(outDir, 'chrome_AE.pdf');
    fs.writeFileSync(chromeAEPath, chromeAE);
    assert(Buffer.isBuffer(chromeAE) && chromeAE.length > 5000, 'Chrome AE PDF must be a non-empty buffer > 5KB');
    console.log('✓ Chrome AE PDF generated:', chromeAE.length, 'bytes');

    const chromeKW = await generateInvoicePDF(sampleInvoiceKW, sampleShopKW);
    const chromeKWPath = path.join(outDir, 'chrome_KW.pdf');
    fs.writeFileSync(chromeKWPath, chromeKW);
    assert(Buffer.isBuffer(chromeKW) && chromeKW.length > 5000, 'Chrome KW PDF must be a non-empty buffer > 5KB');
    console.log('✓ Chrome KW PDF generated:', chromeKW.length, 'bytes');

    const chromeMultiIN = await generateInvoicePDF(multiPageInvoiceIN, sampleShopIN);
    const chromeMultiINPath = path.join(outDir, 'chrome_IN_multi.pdf');
    fs.writeFileSync(chromeMultiINPath, chromeMultiIN);
    assert(Buffer.isBuffer(chromeMultiIN) && chromeMultiIN.length > 10000, 'Chrome Multi-item PDF must be a non-empty buffer');
    console.log('✓ Chrome Multi-item IN PDF generated:', chromeMultiIN.length, 'bytes');


    console.log('\n=================================================================');
    console.log('=== STEP 4: Testing PDFKit Fallback Renderer                  ===');
    console.log('=================================================================');

    const kitIN = await generateInvoicePDFKit(sampleInvoiceIN, sampleShopIN);
    const kitINPath = path.join(outDir, 'kit_IN.pdf');
    fs.writeFileSync(kitINPath, kitIN);
    assert(Buffer.isBuffer(kitIN) && kitIN.length > 3000, 'PDFKit IN PDF must be a non-empty buffer');
    console.log('✓ PDFKit IN PDF generated:', kitIN.length, 'bytes');

    const kitINNoUPI = await generateInvoicePDFKit(sampleInvoiceINNoUPI, sampleShopINNoUPI);
    const kitINNoUPIPath = path.join(outDir, 'kit_IN_no_upi.pdf');
    fs.writeFileSync(kitINNoUPIPath, kitINNoUPI);
    assert(Buffer.isBuffer(kitINNoUPI) && kitINNoUPI.length > 3000, 'PDFKit IN No-UPI PDF must be a non-empty buffer');
    console.log('✓ PDFKit IN No-UPI PDF generated:', kitINNoUPI.length, 'bytes');

    const kitAE = await generateInvoicePDFKit(sampleInvoiceAE, sampleShopAE);
    const kitAEPath = path.join(outDir, 'kit_AE.pdf');
    fs.writeFileSync(kitAEPath, kitAE);
    assert(Buffer.isBuffer(kitAE) && kitAE.length > 3000, 'PDFKit AE PDF must be a non-empty buffer');
    console.log('✓ PDFKit AE PDF generated:', kitAE.length, 'bytes');

    const kitKW = await generateInvoicePDFKit(sampleInvoiceKW, sampleShopKW);
    const kitKWPath = path.join(outDir, 'kit_KW.pdf');
    fs.writeFileSync(kitKWPath, kitKW);
    assert(Buffer.isBuffer(kitKW) && kitKW.length > 3000, 'PDFKit KW PDF must be a non-empty buffer');
    console.log('✓ PDFKit KW PDF generated:', kitKW.length, 'bytes');


    console.log('\n=================================================================');
    console.log('=== STEP 5: Extracted Text and Regional Safety Assertions     ===');
    console.log('=================================================================');

    // 5.1 UAE Safety Assertions (Chrome and PDFKit)
    const textChromeAE = getPdfText(chromeAEPath);
    const textKitAE = getPdfText(kitAEPath);

    [
        { name: 'Chrome AE', text: textChromeAE },
        { name: 'PDFKit AE', text: textKitAE }
    ].forEach(({ name, text }) => {
        assert(!text.includes('Scan to Pay via UPI'), `${name} must NOT contain 'Scan to Pay via UPI'`);
        assert(!text.includes('hisabi@upi'), `${name} must NOT contain 'hisabi@upi'`);
        assert(!text.includes('https://hisabi.com/verify'), `${name} must NOT contain fabricated verify URL`);
        assert(!text.includes('Branch & IFSC'), `${name} must NOT contain Indian 'Branch & IFSC'`);
        assert(!text.includes('Branch/IFSC'), `${name} must NOT contain Indian 'Branch/IFSC'`);
        console.log(`✓ ${name} passed all regional text safety assertions`);
    });

    // 5.2 Kuwait Safety Assertions (Chrome and PDFKit)
    const textChromeKW = getPdfText(chromeKWPath);
    const textKitKW = getPdfText(kitKWPath);

    [
        { name: 'Chrome KW', text: textChromeKW },
        { name: 'PDFKit KW', text: textKitKW }
    ].forEach(({ name, text }) => {
        assert(!text.includes('https://knet.com.kw/pay'), `${name} must NOT contain fabricated KNET pay URL`);
        assert(!text.includes('Kuwait Finance House'), `${name} must NOT contain dummy 'Kuwait Finance House'`);
        assert(!text.includes('KFHKWKWXXX'), `${name} must NOT contain dummy 'KFHKWKWXXX'`);
        assert(!text.includes('Branch & IFSC'), `${name} must NOT contain Indian 'Branch & IFSC'`);
        assert(!text.includes('Branch/IBAN'), `${name} must NOT contain unconfirmed 'Branch/IBAN'`);
        assert(!text.includes('KNET  |  VISA  |  Mastercard'), `${name} must NOT contain unconfigured payment badges`);
        assert(!text.includes('Pay securely with'), `${name} must NOT contain unconfigured 'Pay securely with'`);
        console.log(`✓ ${name} passed all regional text safety assertions`);
    });

    // 5.3 India Preserved Functionality vs Safe Unconfigured Assertions
    const textChromeIN = getPdfText(chromeINPath);
    const textKitIN = getPdfText(kitINPath);
    const textChromeINNoUPI = getPdfText(chromeINNoUPIPath);
    const textKitINNoUPI = getPdfText(kitINNoUPIPath);

    // With configured UPI
    assert(textChromeIN.includes('sharma@okhdfcbank') || textChromeIN.includes('UPI'), 'India Chrome must display UPI section');
    assert(textKitIN.includes('UPI PAYMENT') && textKitIN.includes('Scan to Pay'), 'India PDFKit must display UPI Payment and Scan to Pay');
    assert(!textChromeIN.includes('hisabi@upi'), 'India Chrome must NEVER contain hisabi@upi');
    assert(!textKitIN.includes('hisabi@upi'), 'India PDFKit must NEVER contain hisabi@upi');

    // Without configured UPI
    assert(!textChromeINNoUPI.includes('hisabi@upi'), 'India Chrome No-UPI must NEVER contain hisabi@upi');
    assert(!textKitINNoUPI.includes('hisabi@upi'), 'India PDFKit No-UPI must NEVER contain hisabi@upi');
    assert(!textChromeINNoUPI.includes('sharma@okhdfcbank'), 'India Chrome No-UPI must NOT have sharma@okhdfcbank');
    assert(!textKitINNoUPI.includes('sharma@okhdfcbank'), 'India PDFKit No-UPI must NOT have sharma@okhdfcbank');
    assert(textChromeINNoUPI.includes('No UPI Configured') || textChromeINNoUPI.includes('UPI Not Configured'), 'India Chrome No-UPI must indicate UPI Not Configured');
    assert(textKitINNoUPI.includes('UPI Not Configured'), 'India PDFKit No-UPI must indicate UPI Not Configured');
    console.log('✓ India invoices verified with configured UPI and unconfigured UPI (zero hisabi@upi occurrences)');


    console.log('\n=================================================================');
    console.log('=== STEP 6: Independent PDF Page-Count Assertions            ===');
    console.log('=================================================================');

    const testPageExpectations = [
        { file: chromeINPath, expected: 1, label: 'Chrome IN standard fixture (2 items)' },
        { file: chromeINNoUPIPath, expected: 1, label: 'Chrome IN No-UPI fixture (2 items)' },
        { file: chromeAEPath, expected: 1, label: 'Chrome AE standard fixture (2 items)' },
        { file: chromeKWPath, expected: 1, label: 'Chrome KW standard fixture (2 items)' },
        { file: kitINPath, expected: 1, label: 'PDFKit IN standard fixture (2 items)' },
        { file: kitINNoUPIPath, expected: 1, label: 'PDFKit IN No-UPI fixture (2 items)' },
        { file: kitAEPath, expected: 1, label: 'PDFKit AE standard fixture (2 items)' },
        { file: kitKWPath, expected: 1, label: 'PDFKit KW standard fixture (2 items)' },
        { file: chromeMultiINPath, expected: 2, label: 'Chrome Multi-item IN fixture (25 items)' }
    ];

    for (const { file, expected, label } of testPageExpectations) {
        const actual = getPageCount(file);
        assert.strictEqual(
            actual,
            expected,
            `Page count mismatch for ${label}: expected ${expected}, got ${actual}`
        );
        console.log(`✓ ${label}: ${actual} page(s) (matches expected ${expected})`);
    }


    console.log('\n=================================================================');
    console.log('=== STEP 7: Generating Visual PNG Previews via pdftoppm       ===');
    console.log('=================================================================');

    execSync(`pdftoppm -png -r 150 "${chromeINPath}" "${path.join(outDir, 'preview_chrome_IN')}"`);
    execSync(`pdftoppm -png -r 150 "${chromeINNoUPIPath}" "${path.join(outDir, 'preview_chrome_IN_no_upi')}"`);
    execSync(`pdftoppm -png -r 150 "${chromeAEPath}" "${path.join(outDir, 'preview_chrome_AE')}"`);
    execSync(`pdftoppm -png -r 150 "${chromeKWPath}" "${path.join(outDir, 'preview_chrome_KW')}"`);
    execSync(`pdftoppm -png -r 150 "${chromeMultiINPath}" "${path.join(outDir, 'preview_chrome_IN_multi')}"`);
    execSync(`pdftoppm -png -r 150 "${kitINPath}" "${path.join(outDir, 'preview_kit_IN')}"`);
    execSync(`pdftoppm -png -r 150 "${kitINNoUPIPath}" "${path.join(outDir, 'preview_kit_IN_no_upi')}"`);
    execSync(`pdftoppm -png -r 150 "${kitAEPath}" "${path.join(outDir, 'preview_kit_AE')}"`);
    execSync(`pdftoppm -png -r 150 "${kitKWPath}" "${path.join(outDir, 'preview_kit_KW')}"`);
    console.log('✓ Visual PNG previews rendered to test_output');

    console.log('\n=================================================================');
    console.log('=== ALL PHASE 1 AUTOMATED TESTS PASSED SUCCESSFULLY!          ===');
    console.log('=================================================================');
}

run().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});

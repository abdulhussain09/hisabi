const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateInvoicePDF, generateInvoicePDFKit } = require('./src/services/pdfService');

async function run() {
    const outDir = path.join(__dirname, 'test_output');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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

    console.log('=== 1. Testing Chrome Headless Renderer ===');
    const chromeIN = await generateInvoicePDF(sampleInvoiceIN, sampleShopIN);
    fs.writeFileSync(path.join(outDir, 'chrome_IN.pdf'), chromeIN);
    console.log('✓ Chrome IN PDF generated:', chromeIN.length, 'bytes');

    const chromeAE = await generateInvoicePDF(sampleInvoiceAE, sampleShopAE);
    fs.writeFileSync(path.join(outDir, 'chrome_AE.pdf'), chromeAE);
    console.log('✓ Chrome AE PDF generated:', chromeAE.length, 'bytes');

    const chromeKW = await generateInvoicePDF(sampleInvoiceKW, sampleShopKW);
    fs.writeFileSync(path.join(outDir, 'chrome_KW.pdf'), chromeKW);
    console.log('✓ Chrome KW PDF generated:', chromeKW.length, 'bytes');

    console.log('\n=== 2. Testing PDFKit Fallback Renderer ===');
    const kitIN = await generateInvoicePDFKit(sampleInvoiceIN, sampleShopIN);
    fs.writeFileSync(path.join(outDir, 'kit_IN.pdf'), kitIN);
    console.log('✓ PDFKit IN PDF generated:', kitIN.length, 'bytes');

    const kitAE = await generateInvoicePDFKit(sampleInvoiceAE, sampleShopAE);
    fs.writeFileSync(path.join(outDir, 'kit_AE.pdf'), kitAE);
    console.log('✓ PDFKit AE PDF generated:', kitAE.length, 'bytes');

    const kitKW = await generateInvoicePDFKit(sampleInvoiceKW, sampleShopKW);
    fs.writeFileSync(path.join(outDir, 'kit_KW.pdf'), kitKW);
    console.log('✓ PDFKit KW PDF generated:', kitKW.length, 'bytes');

    console.log('\n=== 3. Converting to PNG previews via pdftoppm ===');
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'chrome_IN.pdf')} ${path.join(outDir, 'preview_chrome_IN')}`);
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'chrome_AE.pdf')} ${path.join(outDir, 'preview_chrome_AE')}`);
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'chrome_KW.pdf')} ${path.join(outDir, 'preview_chrome_KW')}`);
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'kit_IN.pdf')} ${path.join(outDir, 'preview_kit_IN')}`);
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'kit_AE.pdf')} ${path.join(outDir, 'preview_kit_AE')}`);
    execSync(`pdftoppm -png -r 150 ${path.join(outDir, 'kit_KW.pdf')} ${path.join(outDir, 'preview_kit_KW')}`);
    console.log('✓ PNG previews generated successfully!');
}

run().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});

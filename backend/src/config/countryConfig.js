/**
 * Country Configuration for Hisabi POS Invoice Engine
 * Supports: IN (India GST), AE (UAE VAT), KW (Kuwait Commercial/Tax-Free)
 */

const COUNTRY_CONFIGS = {
    IN: {
        country: 'IN',
        countryName: 'India',
        currency: 'INR',
        currencySymbol: '₹',
        currencyDecimals: 2,
        taxMode: 'GST',
        invoiceTitle: 'GST TAX INVOICE',
        subtitle: 'Tax Invoice under Goods and Services Tax Act',
        supportsTax: true,
        supportsArabic: false,
        dateFormat: 'DD/MM/YYYY',
        fields: {
            sellerTaxIdLabel: 'GSTIN',
            buyerTaxIdLabel: 'Customer GSTIN',
            supplyDate: true,
            placeOfSupply: true,
            reverseCharge: true,
            hsnSac: true,
            commercialRegistration: false,
            mrpColumn: true,
        },
        paymentMethods: ['Cash', 'Card', 'UPI', 'Bank Transfer'],
        visualTheme: {
            primaryColor: '#0f172a',
            secondaryColor: '#2563eb',
            accentColor: '#059669',
            lightCardBg: '#f8fafc',
            borderColor: '#dce7f3'
        }
    },
    AE: {
        country: 'AE',
        countryName: 'United Arab Emirates',
        currency: 'AED',
        currencySymbol: 'AED',
        currencyDecimals: 2,
        taxMode: 'VAT',
        invoiceTitle: 'TAX INVOICE',
        invoiceTitleArabic: 'فاتورة ضريبية',
        subtitle: 'Tax Invoice under UAE Federal Decree-Law',
        supportsTax: true,
        supportsArabic: true,
        dateFormat: 'DD/MM/YYYY',
        fields: {
            sellerTaxIdLabel: 'TRN',
            buyerTaxIdLabel: 'Customer TRN',
            supplyDate: true,
            placeOfSupply: false,
            reverseCharge: true,
            hsnSac: false,
            commercialRegistration: false,
            mrpColumn: false,
        },
        paymentMethods: ['Cash', 'Card', 'Bank Transfer', 'Wallet'],
        visualTheme: {
            primaryColor: '#0f172a',
            secondaryColor: '#2563eb',
            accentColor: '#d97706',
            lightCardBg: '#f8fafc',
            borderColor: '#dce7f3'
        }
    },
    KW: {
        country: 'KW',
        countryName: 'Kuwait',
        currency: 'KWD',
        currencySymbol: 'KWD',
        currencyDecimals: 3,
        taxMode: 'NONE',
        invoiceTitle: 'INVOICE',
        invoiceTitleArabic: 'فاتورة',
        subtitle: 'Commercial Document',
        supportsTax: false,
        supportsArabic: true,
        dateFormat: 'DD/MM/YYYY',
        fields: {
            sellerTaxIdLabel: 'CR No.',
            buyerTaxIdLabel: 'Civil ID / CR',
            supplyDate: true,
            placeOfSupply: false,
            reverseCharge: false,
            hsnSac: false,
            commercialRegistration: true,
            mrpColumn: false,
        },
        paymentMethods: ['Cash', 'Card', 'KNet', 'Bank Transfer'],
        visualTheme: {
            primaryColor: '#0f172a',
            secondaryColor: '#2563eb',
            accentColor: '#4f46e5',
            lightCardBg: '#f8fafc',
            borderColor: '#dce7f3'
        }
    }
};

const getCountryConfig = (countryCode = 'AE') => {
    const code = (countryCode || 'AE').toUpperCase();
    return COUNTRY_CONFIGS[code] || COUNTRY_CONFIGS['AE'];
};

const INDIAN_STATES = [
    { code: '01', name: 'Jammu and Kashmir' },
    { code: '02', name: 'Himachal Pradesh' },
    { code: '03', name: 'Punjab' },
    { code: '04', name: 'Chandigarh' },
    { code: '05', name: 'Uttarakhand' },
    { code: '06', name: 'Haryana' },
    { code: '07', name: 'Delhi' },
    { code: '08', name: 'Rajasthan' },
    { code: '09', name: 'Uttar Pradesh' },
    { code: '10', name: 'Bihar' },
    { code: '11', name: 'Sikkim' },
    { code: '12', name: 'Arunachal Pradesh' },
    { code: '13', name: 'Nagaland' },
    { code: '14', name: 'Manipur' },
    { code: '15', name: 'Mizoram' },
    { code: '16', name: 'Tripura' },
    { code: '17', name: 'Meghalaya' },
    { code: '18', name: 'Assam' },
    { code: '19', name: 'West Bengal' },
    { code: '20', name: 'Jharkhand' },
    { code: '21', name: 'Odisha' },
    { code: '22', name: 'Chhattisgarh' },
    { code: '23', name: 'Madhya Pradesh' },
    { code: '24', name: 'Gujarat' },
    { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
    { code: '27', name: 'Maharashtra' },
    { code: '29', name: 'Karnataka' },
    { code: '30', name: 'Goa' },
    { code: '31', name: 'Lakshadweep' },
    { code: '32', name: 'Kerala' },
    { code: '33', name: 'Tamil Nadu' },
    { code: '34', name: 'Puducherry' },
    { code: '35', name: 'Andaman and Nicobar Islands' },
    { code: '36', name: 'Telangana' },
    { code: '37', name: 'Andhra Pradesh' },
    { code: '38', name: 'Ladakh' },
    { code: '97', name: 'Other Territory' }
];

function resolveIndianState(stateInput, codeInput) {
    if (!stateInput && !codeInput) {
        return { state: '', code: '' };
    }

    if (codeInput) {
        const found = INDIAN_STATES.find(s => s.code === String(codeInput).padStart(2, '0'));
        if (found) {
            return { state: stateInput || found.name, code: found.code };
        }
    }

    if (stateInput) {
        const norm = stateInput.trim().toLowerCase();
        const found = INDIAN_STATES.find(s => s.name.toLowerCase() === norm || norm.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(norm));
        if (found) {
            return { state: found.name, code: found.code };
        }
        return { state: stateInput.trim(), code: codeInput ? String(codeInput).padStart(2, '0') : '' };
    }

    return { state: '', code: '' };
}

module.exports = { COUNTRY_CONFIGS, getCountryConfig, INDIAN_STATES, resolveIndianState };


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

module.exports = { COUNTRY_CONFIGS, getCountryConfig };

/**
 * Tax utility — returns tax info for a given country code and item category
 * Supports: IN (India GST 18%), AE (UAE VAT 5%/0%), KW (Kuwait 0%)
 */

const TAX_RATES = {
    IN: { name: 'GST', rate: 0.18 },
    AE: { name: 'VAT', rate: 0.05 },
    KW: { name: 'None', rate: 0.00 }
};

/**
 * Calculate tax on a given amount based on country
 */
const calculateTax = (amount, country = 'AE') => {
    const tax = TAX_RATES[country] || TAX_RATES['AE'];
    const precision = country === 'KW' ? 3 : 2;
    const taxAmount = parseFloat((amount * tax.rate).toFixed(precision));
    return {
        taxName: tax.name,
        taxRate: tax.rate,
        taxAmount,
        total: parseFloat((amount + taxAmount).toFixed(precision))
    };
};

/**
 * Calculate line item tax considering shop settings and product tax category
 * @param {number} lineTotal - quantity * unit_price
 * @param {string} taxCategory - 'standard' | 'zero_rated' | 'exempt'
 * @param {object|string} shop - shop database object or country code string
 * @returns {{ taxRate: number, taxAmount: number }}
 */
const calculateLineTax = (lineTotal, taxCategory = 'standard', shop = {}) => {
    const shopObj = typeof shop === 'string' ? { country: shop } : (shop || {});
    const country = shopObj.country || 'AE';
    const precision = shopObj.currency === 'KWD' || country === 'KW' ? 3 : 2;

    if (country === 'KW') {
        return { taxRate: 0.00, taxAmount: 0 };
    }

    if (country === 'IN') {
        if (shopObj.gst_enabled === false) return { taxRate: 0.00, taxAmount: 0 };
        if (taxCategory === 'zero_rated' || taxCategory === 'exempt') {
            return { taxRate: 0.00, taxAmount: 0 };
        }
        const rate = 0.18;
        const taxAmount = parseFloat((lineTotal * rate).toFixed(precision));
        return { taxRate: rate, taxAmount };
    }

    // UAE (AE) or default GCC
    if (shopObj.vat_enabled === false) return { taxRate: 0.00, taxAmount: 0 };
    if (taxCategory === 'zero_rated' || taxCategory === 'exempt') {
        return { taxRate: 0.00, taxAmount: 0 };
    }

    const rate = 0.05;
    const taxAmount = parseFloat((lineTotal * rate).toFixed(precision));
    return { taxRate: rate, taxAmount };
};

/**
 * Return whether GST applies for a country
 */
const isGSTCountry = (country) => country === 'IN';

module.exports = { calculateTax, calculateLineTax, isGSTCountry, TAX_RATES };

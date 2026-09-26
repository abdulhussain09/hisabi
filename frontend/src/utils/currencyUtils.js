/**
 * Currency Utility for Hisabi-POS
 * Provides dynamic 2 or 3 decimal formatting based on currency specification
 * - KWD (Kuwait): 3 decimal places (e.g. 1.250 KWD)
 * - AED / INR / default: 2 decimal places (e.g. 12.50 AED)
 */

export const getCurrencyDecimals = (currency) => {
    return currency === 'KWD' ? 3 : 2;
};

export const formatCurrency = (amount, currency = 'AED', includeSymbol = false) => {
    const val = parseFloat(amount);
    if (isNaN(val)) return includeSymbol ? `${currency} 0.00` : '0.00';

    const decimals = getCurrencyDecimals(currency);
    const formatted = val.toFixed(decimals);

    if (includeSymbol) {
        return `${currency} ${formatted}`;
    }
    return formatted;
};

export const parseCurrencyInput = (val, currency = 'AED') => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return 0;
    const decimals = getCurrencyDecimals(currency);
    return parseFloat(parsed.toFixed(decimals));
};

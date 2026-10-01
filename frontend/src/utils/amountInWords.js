/**
 * Currency-aware Number-to-Words converter for Hisabi POS (Frontend)
 * Supports:
 * - INR (India): Indian Numbering System (Lakhs, Crores)
 * - AED (UAE): UAE Dirhams & Fils
 * - KWD (Kuwait): Kuwaiti Dinars & Fils (3 decimal precision)
 */

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
              'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertUnderThousand(n) {
    let str = '';
    if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
    }
    if (n >= 20) {
        str += tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    } else if (n > 0) {
        str += ones[n];
    }
    return str.trim();
}

function numberToWordsWestern(num) {
    if (num === 0) return 'Zero';
    let words = '';

    if (Math.floor(num / 1000000) > 0) {
        words += convertUnderThousand(Math.floor(num / 1000000)) + ' Million ';
        num %= 1000000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += convertUnderThousand(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (num > 0) {
        words += convertUnderThousand(num);
    }
    return words.trim();
}

function numberToWordsIndian(num) {
    if (num === 0) return 'Zero';
    let words = '';

    if (Math.floor(num / 10000000) > 0) {
        words += convertUnderThousand(Math.floor(num / 10000000)) + ' Crore ';
        num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
        words += convertUnderThousand(Math.floor(num / 100000)) + ' Lakh ';
        num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
        words += convertUnderThousand(Math.floor(num / 1000)) + ' Thousand ';
        num %= 1000;
    }
    if (num > 0) {
        words += convertUnderThousand(num);
    }
    return words.trim();
}

export function getAmountInWords(amount, currency = 'AED') {
    const val = parseFloat(amount || 0);
    if (isNaN(val) || val <= 0) return `${currency} Zero Only`;

    const curr = (currency || 'AED').toUpperCase();

    if (curr === 'INR') {
        const integerPart = Math.floor(val);
        const paisePart = Math.round((val - integerPart) * 100);
        let result = `INR ${numberToWordsIndian(integerPart)}`;
        if (paisePart > 0) {
            result += ` and ${numberToWordsIndian(paisePart)} Paise`;
        }
        return `${result} Only`;
    }

    if (curr === 'KWD') {
        const integerPart = Math.floor(val);
        const filsPart = Math.round((val - integerPart) * 1000);
        let result = `KWD ${numberToWordsWestern(integerPart)}`;
        if (filsPart > 0) {
            result += ` and ${numberToWordsWestern(filsPart)} Fils`;
        }
        return `${result} Only`;
    }

    const integerPart = Math.floor(val);
    const filsPart = Math.round((val - integerPart) * 100);
    let result = `AED ${numberToWordsWestern(integerPart)}`;
    if (filsPart > 0) {
        result += ` and ${numberToWordsWestern(filsPart)} Fils`;
    }
    return `${result} Only`;
}

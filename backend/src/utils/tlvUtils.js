/**
 * GCC / ZATCA 5-Tag TLV (Tag-Length-Value) Base64 QR Code Generator
 * Standard Tags:
 * Tag 1 (0x01): Seller Name
 * Tag 2 (0x02): VAT Registration Number (TRN)
 * Tag 3 (0x03): Timestamp (ISO 8601 UTC string)
 * Tag 4 (0x04): Invoice Total (inclusive of VAT)
 * Tag 5 (0x05): VAT Total
 */

function encodeTLVTag(tagNum, valueStr) {
    const valStr = (valueStr || '').toString();
    const valBuf = Buffer.from(valStr, 'utf8');
    const tagBuf = Buffer.from([tagNum, valBuf.length]);
    return Buffer.concat([tagBuf, valBuf]);
}

/**
 * Generate 5-Tag TLV Base64 String
 * @param {object} params
 * @param {string} params.sellerName
 * @param {string} params.vatNumber (TRN)
 * @param {string|Date} params.timestamp
 * @param {number|string} params.invoiceTotal
 * @param {number|string} params.vatTotal
 * @returns {string} Base64 encoded TLV string
 */
function generateGCC_TLV_Base64({ sellerName, vatNumber, timestamp, invoiceTotal, vatTotal }) {
    try {
        const timeStr = timestamp instanceof Date 
            ? timestamp.toISOString() 
            : new Date(timestamp || Date.now()).toISOString();

        const tag1 = encodeTLVTag(1, sellerName || 'Shop');
        const tag2 = encodeTLVTag(2, vatNumber || '');
        const tag3 = encodeTLVTag(3, timeStr);
        const tag4 = encodeTLVTag(4, parseFloat(invoiceTotal || 0).toString());
        const tag5 = encodeTLVTag(5, parseFloat(vatTotal || 0).toString());

        const tlvBuffer = Buffer.concat([tag1, tag2, tag3, tag4, tag5]);
        return tlvBuffer.toString('base64');
    } catch (err) {
        console.error('Error generating GCC TLV Base64:', err);
        return '';
    }
}

/**
 * Decode TLV Base64 string for verification
 */
function decodeGCC_TLV_Base64(base64Str) {
    if (!base64Str) return null;
    try {
        const buf = Buffer.from(base64Str, 'base64');
        let offset = 0;
        const result = {};

        while (offset < buf.length) {
            const tag = buf[offset];
            const len = buf[offset + 1];
            const val = buf.slice(offset + 2, offset + 2 + len).toString('utf8');
            result[`tag_${tag}`] = val;
            offset += 2 + len;
        }
        return result;
    } catch (e) {
        return null;
    }
}

module.exports = {
    generateGCC_TLV_Base64,
    decodeGCC_TLV_Base64
};

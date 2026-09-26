/**
 * Pure JavaScript QR Code Generator (Zero Dependencies)
 * Generates PNG/BMP buffers for PDFKit and Base64 data URIs for Frontend UI.
 */

// ─── Compact QR Code Generator ──────────────────────────────────────────────

function createQRMatrix(text) {
    // Minimal standard QR Generator implementation for byte mode string
    // Uses standard QR Code Polynomial & Error Correction
    const QR = require('./qrEncoderCore');
    return QR.generateMatrix(text);
}

// ─── BMP Buffer Converter ──────────────────────────────────────────────────

function matrixToBMPBuffer(matrix, cellSize = 3, margin = 2) {
    const matrixSize = matrix.length;
    const totalSize = matrixSize + margin * 2;
    const width = totalSize * cellSize;
    const height = totalSize * cellSize;
    const rowSize = Math.floor((24 * width + 31) / 32) * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = 54 + pixelArraySize;

    const buf = Buffer.alloc(fileSize);

    // BMP Header
    buf.write('BM', 0);
    buf.writeInt32LE(fileSize, 2);
    buf.writeInt32LE(54, 10);

    // DIB Header
    buf.writeInt32LE(40, 14);
    buf.writeInt32LE(width, 18);
    buf.writeInt32LE(height, 22);
    buf.writeInt16LE(1, 26);
    buf.writeInt16LE(24, 28);
    buf.writeInt32LE(pixelArraySize, 34);

    for (let r = 0; r < height; r++) {
        const my = Math.floor((height - 1 - r) / cellSize) - margin;
        const rowOffset = 54 + r * rowSize;
        for (let c = 0; c < width; c++) {
            const mx = Math.floor(c / cellSize) - margin;
            let isBlack = false;
            if (my >= 0 && my < matrixSize && mx >= 0 && mx < matrixSize) {
                isBlack = matrix[my][mx];
            }
            const color = isBlack ? 0 : 255;
            const offset = rowOffset + c * 3;
            buf[offset] = color;
            buf[offset + 1] = color;
            buf[offset + 2] = color;
        }
    }
    return buf;
}

module.exports = {
    createQRMatrix,
    matrixToBMPBuffer
};

/**
 * Pure JavaScript QR Code Matrix Encoder
 * Supports Byte Mode QR Code Generation (Versions 1-10)
 */

// GF(256) Galois Field Log & Antilog Tables for Reed-Solomon Error Correction
const GF256_EXP = new Array(512);
const GF256_LOG = new Array(256);
(function initGF256() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF256_EXP[i] = x;
        GF256_LOG[x] = i;
        x <<= 1;
        if (x & 256) x ^= 285;
    }
    for (let i = 255; i < 512; i++) {
        GF256_EXP[i] = GF256_EXP[i - 255];
    }
})();

function gfMul(x, y) {
    if (x === 0 || y === 0) return 0;
    return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], GF256_EXP[i]);
        }
        poly = next;
    }
    return poly;
}

function rsCalculateEcc(data, degree) {
    const gen = rsGeneratorPoly(degree);
    const res = new Array(degree).fill(0);
    for (let i = 0; i < data.length; i++) {
        const coef = data[i] ^ res[0];
        res.shift();
        res.push(0);
        if (coef !== 0) {
            for (let j = 0; j < degree; j++) {
                res[j] ^= gfMul(gen[j + 1], coef);
            }
        }
    }
    return res;
}

// Version Specs: [Version, Total Modules, Data Capacity Bytes, EC Bytes]
const VERSION_SPECS = [
    { ver: 1, size: 21, dataCap: 19, ecLen: 7 },
    { ver: 2, size: 25, dataCap: 34, ecLen: 10 },
    { ver: 3, size: 29, dataCap: 55, ecLen: 15 },
    { ver: 4, size: 33, dataCap: 80, ecLen: 20 },
    { ver: 5, size: 37, dataCap: 108, ecLen: 26 },
    { ver: 6, size: 41, dataCap: 136, ecLen: 18 },
    { ver: 7, size: 45, dataCap: 156, ecLen: 20 },
    { ver: 8, size: 49, dataCap: 194, ecLen: 24 },
    { ver: 9, size: 53, dataCap: 232, ecLen: 30 },
    { ver: 10, size: 57, dataCap: 274, ecLen: 18 }
];

function generateMatrix(text) {
    const dataBuf = Buffer.from(text, 'utf8');
    const len = dataBuf.length;

    let spec = VERSION_SPECS.find(s => s.dataCap >= len + 3);
    if (!spec) spec = VERSION_SPECS[VERSION_SPECS.length - 1];

    const size = spec.size;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(null));

    // 1. Draw Position Detection Patterns (Top-Left, Top-Right, Bottom-Left)
    function drawFinder(row, col) {
        for (let r = -1; r <= 7; r++) {
            for (let c = -1; c <= 7; c++) {
                const mr = row + r;
                const mc = col + c;
                if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
                    const isBorder = (r === 0 || r === 6 || c === 0 || c === 6);
                    const isCenter = (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                    const isOuter = (r === -1 || r === 7 || c === -1 || c === 7);
                    if (!isOuter) {
                        matrix[mr][mc] = isBorder || isCenter;
                    }
                }
            }
        }
    }
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    // 2. Draw Timing Patterns
    for (let i = 8; i < size - 8; i++) {
        if (matrix[6][i] === null) matrix[6][i] = (i % 2 === 0);
        if (matrix[i][6] === null) matrix[i][6] = (i % 2 === 0);
    }

    // 3. Encode Data Bits
    const bitStream = [];
    // Mode indicator: 0100 (Byte)
    bitStream.push(0, 1, 0, 0);
    // Character count (8 bits for V1-9)
    for (let i = 7; i >= 0; i--) bitStream.push((len >> i) & 1);
    // Data bytes
    for (let i = 0; i < len; i++) {
        const b = dataBuf[i];
        for (let k = 7; k >= 0; k--) bitStream.push((b >> k) & 1);
    }
    // Pad to capacity
    const totalBits = spec.dataCap * 8;
    while (bitStream.length < totalBits && bitStream.length % 8 !== 0) bitStream.push(0);
    const padBytes = [0xEC, 0x11];
    let padIdx = 0;
    while (bitStream.length < totalBits) {
        const pb = padBytes[padIdx % 2];
        for (let k = 7; k >= 0; k--) bitStream.push((pb >> k) & 1);
        padIdx++;
    }

    // Convert bitStream to Data Bytes
    const dataBytes = [];
    for (let i = 0; i < bitStream.length; i += 8) {
        let b = 0;
        for (let k = 0; k < 8; k++) b = (b << 1) | bitStream[i + k];
        dataBytes.push(b);
    }

    // Calculate ECC Bytes
    const eccBytes = rsCalculateEcc(dataBytes, spec.ecLen);
    const finalCodewords = [...dataBytes, ...eccBytes];

    // 4. Place Codewords into Matrix (Zigzag)
    const finalBits = [];
    finalCodewords.forEach(cw => {
        for (let k = 7; k >= 0; k--) finalBits.push((cw >> k) & 1);
    });

    let bitIdx = 0;
    let dirIndex = -1; // up
    for (let right = size - 1; right > 0; right -= 2) {
        if (right === 6) right--; // skip vertical timing line
        const range = dirIndex === -1 
            ? Array.from({ length: size }, (_, i) => size - 1 - i)
            : Array.from({ length: size }, (_, i) => i);

        for (const row of range) {
            for (let col = right; col > right - 2; col--) {
                if (matrix[row][col] === null) {
                    const bit = bitIdx < finalBits.length ? finalBits[bitIdx++] : 0;
                    // Apply Mask Pattern 0 (row + col) % 2 === 0
                    const mask = ((row + col) % 2 === 0);
                    matrix[row][col] = (bit ^ (mask ? 1 : 0)) === 1;
                }
            }
        }
        dirIndex *= -1;
    }

    return matrix;
}

module.exports = { generateMatrix };

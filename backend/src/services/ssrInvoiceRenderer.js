/**
 * SSR Invoice Renderer
 *
 * Server-side renders the actual React invoice components so the downloaded
 * PDF is pixel-perfect identical to the browser preview.
 *
 * Requires (installed in backend/):
 *   @babel/core @babel/register @babel/preset-env @babel/preset-react
 *   react react-dom
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// ── Paths ────────────────────────────────────────────────────────────────────
const FRONTEND_ROOT   = path.resolve(__dirname, '../../../frontend/src');
const TAILWIND_CSS_PATH = path.join(__dirname, 'invoice-tailwind.css');

// ── Pre-built Tailwind CSS ───────────────────────────────────────────────────
let TAILWIND_CSS = '';
try {
    TAILWIND_CSS = fs.readFileSync(TAILWIND_CSS_PATH, 'utf8');
} catch {
    console.warn('[SSR] invoice-tailwind.css not found — PDF may lack styles');
}

const PRINT_CSS = `
  *, *::before, *::after {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  @page { size: A4; margin: 0; }
  body  { margin: 0; padding: 0; background: #fff; }
`;

// ── Babel register (transpile JSX / ES modules on-the-fly) ──────────────────
//    Must happen BEFORE any JSX file is require()'d.
let babelRegistered = false;
function ensureBabel() {
    if (babelRegistered) return;
    babelRegistered = true;
    require('@babel/register').default({
        extensions: ['.js', '.jsx'],
        presets: [
            [require.resolve(path.resolve(__dirname, '../../../backend/node_modules/@babel/preset-env')), { targets: { node: 'current' }, modules: 'commonjs' }],
            [require.resolve(path.resolve(__dirname, '../../../backend/node_modules/@babel/preset-react')), { runtime: 'automatic' }],
        ],
        only: [
            // Transpile the frontend source tree and lucide-react icons
            new RegExp(FRONTEND_ROOT.replace(/\\/g, '\\\\')),
            /node_modules[\\/\\\\]lucide-react/,
        ],
        cache: true,
    });
}

// ── Server-side QRCodeImage replacement ─────────────────────────────────────
//    QRCodeImage uses useEffect which does not run in SSR.
//    We replace it with a synchronous component that reads from a pre-built cache.
const _qrCache = {}; // text → base64 data URL, filled before each render

function ServerQRCodeImage({ text, alt = 'QR Code', className, containerClassName }) {
    // Import React inline to avoid issues before babel is set up
    const R = require('react');
    const cCls = containerClassName ||
        'w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center';
    const iCls = className || 'w-full h-full object-contain';

    const dataUrl = text && _qrCache[text];
    if (dataUrl) {
        return R.createElement('div', { className: cCls },
            R.createElement('img', { src: dataUrl, alt, className: iCls })
        );
    }
    return R.createElement('div', {
        className: `${cCls} bg-slate-50 border-dashed border-slate-300 flex-col text-center`
    }, R.createElement('span', { className: 'text-[7.5px] text-slate-400' }, 'QR'));
}

// ── Module interception ───────────────────────────────────────────────────────
//    1. QRCodeImage  → server-safe replacement (no useEffect)
//    2. react / react/jsx-runtime / react-dom → backend's copies
//       This prevents the "two React instances" error where frontend JSX elements
//       created with frontend's React are rendered by backend's react-dom/server.
const Module = require('module');
const _origLoad = Module._load.bind(Module);
let _patchApplied = false;

// Pre-resolve the backend's React paths once
const BACKEND_REACT     = path.resolve(__dirname, '../../../backend/node_modules/react');
const BACKEND_REACT_DOM = path.resolve(__dirname, '../../../backend/node_modules/react-dom');

function applyModulePatch() {
    if (_patchApplied) return;
    _patchApplied = true;
    Module._load = function (request, parent, isMain) {
        // Redirect QRCodeImage to server-safe version
        const basename = path.basename(request, path.extname(request));
        if (basename === 'QRCodeImage') {
            return { default: ServerQRCodeImage, __esModule: true };
        }
        // Redirect react imports to backend's copy (single React instance)
        if (request === 'react' || request === 'react/jsx-runtime' || request === 'react/jsx-dev-runtime') {
            const resolved = request === 'react'
                ? BACKEND_REACT
                : path.join(BACKEND_REACT, request.slice('react'.length));
            return _origLoad(resolved, parent, isMain);
        }
        if (request === 'react-dom' || request === 'react-dom/server') {
            const resolved = request === 'react-dom'
                ? BACKEND_REACT_DOM
                : path.join(BACKEND_REACT_DOM, 'server');
            return _origLoad(resolved, parent, isMain);
        }
        return _origLoad(request, parent, isMain);
    };
}


// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Renders the correct invoice layout component to a full HTML string.
 *
 * @param {object} invoice - Plain invoice object (already .toJSON()'d if Sequelize)
 * @param {object} shop    - Plain shop object
 * @returns {Promise<string>} Complete HTML document for Chrome to print
 */
async function renderInvoiceToHTML(invoice, shop) {
    ensureBabel();
    applyModulePatch();

    const country = invoice.country || shop?.country || 'AE';

    // ── 1. Run the calculation engine (same as InvoiceRenderer.jsx does) ────
    const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
    const calculation = calculateInvoice({
        items: invoice.items || [],
        shop: { ...shop, country },
        globalDiscount: invoice.discount || 0,
        paidAmount: invoice.paid_amount || 0,
        sellerState: invoice.seller_address_snapshot || shop?.address || '',
        buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
        reverseCharge: Boolean(invoice.reverse_charge),
    });

    // ── 2. Pre-build QR data URL (async, before render) ─────────────────────
    const { totals } = calculation;
    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const upiId = shop?.upi_id || invoice.upi_id || null;

    let qrText = invoice.qr_code_data || null;
    if (!qrText && country === 'IN' && upiId) {
        qrText = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`;
    }

    if (qrText && !_qrCache[qrText]) {
        try {
            _qrCache[qrText] = await QRCode.toDataURL(qrText, {
                margin: 1, width: 140, errorCorrectionLevel: 'M',
                color: { dark: '#0f172a', light: '#ffffff' },
            });
        } catch { /* non-fatal */ }
    }

    // ── 3. Require and render the layout ────────────────────────────────────
    const React = require('react');
    const ReactDOMServer = require('react-dom/server');

    // Clear require cache for the layout files so changes are picked up
    // (only during development; in production this is fine as-is)
    const layoutMap = {
        IN: path.join(FRONTEND_ROOT, 'components/invoice/IndiaInvoiceLayout.jsx'),
        KW: path.join(FRONTEND_ROOT, 'components/invoice/KuwaitInvoiceLayout.jsx'),
        AE: path.join(FRONTEND_ROOT, 'components/invoice/UAEInvoiceLayout.jsx'),
    };
    const layoutPath = layoutMap[country] || layoutMap.AE;

    // Load with babel (JSX transpilation happens transparently)
    const LayoutModule = require(layoutPath);
    const LayoutComponent = LayoutModule.default || LayoutModule;

    const element = React.createElement(LayoutComponent, { invoice, shop, calculation });
    const bodyHTML = ReactDOMServer.renderToStaticMarkup(element);

    // ── 4. Wrap in a full HTML document ─────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="${country === 'KW' ? 'ar' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice</title>
  <style>${TAILWIND_CSS}</style>
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${bodyHTML}
</body>
</html>`;
}

module.exports = { renderInvoiceToHTML };

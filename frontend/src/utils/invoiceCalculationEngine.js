/**
 * Authoritative Invoice Calculation Engine for Hisabi POS (Frontend)
 * Guarantees 100% mathematical parity across React web preview, backend API, browser print, and PDFKit.
 */

import { getCountryConfig } from '../config/countryConfig';
import { getAmountInWords } from './amountInWords';

export function round(val, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((parseFloat(val || 0) + Number.EPSILON) * factor) / factor;
}

export function calculateInvoice({
    items = [],
    shop = {},
    globalDiscount = 0,
    paidAmount = 0,
    sellerState = '',
    buyerState = '',
    reverseCharge = false
}) {
    const country = shop.country || 'AE';
    const countryConfig = getCountryConfig(country);
    const decimals = shop.currency === 'KWD' || country === 'KW' ? 3 : 2;
    const taxMode = countryConfig.taxMode;

    const normalizedItems = [];
    let grossSubtotal = 0;
    let totalLineDiscount = 0;
    let taxableSubtotal = 0;
    let taxTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let vatTotal = 0;

    const isGST = taxMode === 'GST';
    const isVAT = taxMode === 'VAT';

    const cleanSellerState = (sellerState || shop.state || '').trim().toLowerCase();
    const cleanBuyerState = (buyerState || '').trim().toLowerCase();
    const isIntraState = !cleanBuyerState || cleanSellerState === cleanBuyerState;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qty = parseFloat(item.quantity || 0);
        const unitPrice = parseFloat(item.unit_price || item.selling_price || 0);
        const lineDiscount = parseFloat(item.discount || 0);
        const taxCategory = item.tax_category || 'standard';

        const grossAmount = round(qty * unitPrice, decimals);
        const taxableAmount = Math.max(0, round(grossAmount - lineDiscount, decimals));

        let taxRate = 0;
        let taxAmount = 0;
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;

        if (countryConfig.supportsTax && !reverseCharge) {
            if (shop.vat_enabled !== false && shop.gst_enabled !== false && taxCategory === 'standard') {
                if (isGST) {
                    taxRate = parseFloat(item.tax_rate || shop.gst_rate || 0.18);
                    taxAmount = round(taxableAmount * taxRate, decimals);

                    if (isIntraState) {
                        const halfRate = taxRate / 2;
                        cgstAmount = round(taxableAmount * halfRate, decimals);
                        sgstAmount = round(taxableAmount * halfRate, decimals);
                        igstAmount = 0;
                        cgstTotal += cgstAmount;
                        sgstTotal += sgstAmount;
                    } else {
                        cgstAmount = 0;
                        sgstAmount = 0;
                        igstAmount = taxAmount;
                        igstTotal += igstAmount;
                    }
                } else if (isVAT) {
                    taxRate = parseFloat(item.tax_rate || shop.vat_rate || 0.05);
                    taxAmount = round(taxableAmount * taxRate, decimals);
                    vatTotal += taxAmount;
                }
            }
        }

        const lineTotal = round(taxableAmount + taxAmount, decimals);

        grossSubtotal += grossAmount;
        totalLineDiscount += lineDiscount;
        taxableSubtotal += taxableAmount;
        taxTotal += taxAmount;

        normalizedItems.push({
            product_id: item.product_id || null,
            item_name: item.item_name || item.name || 'Item',
            item_description: item.item_description || item.description || '',
            sku: item.sku || item.barcode || '',
            hsn_sac: item.hsn_sac || '',
            unit: item.unit || 'PCS',
            unit_price: unitPrice,
            cost_price: parseFloat(item.cost_price || 0),
            mrp: item.mrp ? parseFloat(item.mrp) : null,
            quantity: qty,
            discount: lineDiscount,
            gross_amount: grossAmount,
            taxable_amount: taxableAmount,
            tax_category: taxCategory,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            igst_amount: igstAmount,
            line_total: lineTotal,
            is_custom_item: Boolean(item.is_custom_item || !item.product_id)
        });
    }

    const gDiscount = parseFloat(globalDiscount || 0);
    const taxableTotal = Math.max(0, round(taxableSubtotal - gDiscount, decimals));
    const rawGrandTotal = round(taxableTotal + taxTotal, decimals);
    
    const roundedGrandTotal = Math.round(rawGrandTotal);
    const roundOff = round(roundedGrandTotal - rawGrandTotal, decimals);

    const grandTotal = roundedGrandTotal;
    const paid = parseFloat(paidAmount || 0);
    const dueAmount = Math.max(0, round(grandTotal - paid, decimals));

    const amountInWords = getAmountInWords(grandTotal, countryConfig.currency);

    return {
        items: normalizedItems,
        totals: {
            gross_subtotal: round(grossSubtotal, decimals),
            total_line_discount: round(totalLineDiscount, decimals),
            taxable_subtotal: round(taxableSubtotal, decimals),
            global_discount: round(gDiscount, decimals),
            taxable_total: round(taxableTotal, decimals),
            tax_total: round(taxTotal, decimals),
            cgst_total: round(cgstTotal, decimals),
            sgst_total: round(sgstTotal, decimals),
            igst_total: round(igstTotal, decimals),
            vat_total: round(vatTotal, decimals),
            total_before_discount: round(grossSubtotal + taxTotal, decimals),
            round_off: roundOff,
            grand_total: grandTotal,
            paid_amount: round(paid, decimals),
            due_amount: dueAmount,
            amount_in_words: amountInWords
        },
        meta: {
            country,
            currency: countryConfig.currency,
            currency_decimals: decimals,
            tax_mode: taxMode,
            is_intra_state: isIntraState,
            is_reverse_charge: Boolean(reverseCharge)
        }
    };
}

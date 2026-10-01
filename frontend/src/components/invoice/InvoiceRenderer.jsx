import React from 'react';
import { getCountryConfig } from '../../config/countryConfig';
import { calculateInvoice } from '../../utils/invoiceCalculationEngine';
import IndiaInvoiceLayout from './IndiaInvoiceLayout';
import UAEInvoiceLayout from './UAEInvoiceLayout';
import KuwaitInvoiceLayout from './KuwaitInvoiceLayout';

const InvoiceRenderer = ({ invoice = {}, shop = {} }) => {
    const country = invoice.country || shop.country || 'AE';
    const countryConfig = getCountryConfig(country);

    // Calculate normalized totals using authoritative engine
    const calculation = calculateInvoice({
        items: invoice.items || [],
        shop: {
            ...shop,
            country: country
        },
        globalDiscount: invoice.discount || 0,
        paidAmount: invoice.paid_amount || 0,
        sellerState: invoice.seller_address_snapshot || shop.address || '',
        buyerState: invoice.place_of_supply_state || invoice.customer_address || '',
        reverseCharge: invoice.reverse_charge
    });

    if (country === 'IN') {
        return <IndiaInvoiceLayout invoice={invoice} shop={shop} calculation={calculation} />;
    }

    if (country === 'KW') {
        return <KuwaitInvoiceLayout invoice={invoice} shop={shop} calculation={calculation} />;
    }

    // Default: UAE Tax Invoice
    return <UAEInvoiceLayout invoice={invoice} shop={shop} calculation={calculation} />;
};

export default InvoiceRenderer;

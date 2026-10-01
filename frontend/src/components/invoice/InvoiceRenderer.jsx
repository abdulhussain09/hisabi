import React from 'react';
import { getCountryConfig } from '../../config/countryConfig';
import { calculateInvoice } from '../../utils/invoiceCalculationEngine';
import InvoiceHeader from './InvoiceHeader';
import SellerBuyerCards from './SellerBuyerCards';
import SupplyDetails from './SupplyDetails';
import ItemsTable from './ItemsTable';
import TaxSummary from './TaxSummary';
import TotalsCard from './TotalsCard';
import AmountInWordsCard from './AmountInWordsCard';
import BankDetailsCard from './BankDetailsCard';
import QRPaymentCard from './QRPaymentCard';
import DeclarationSignature from './DeclarationSignature';

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

    const { items, totals, meta } = calculation;
    const isArabic = countryConfig.supportsArabic;

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 max-w-4xl mx-auto my-4 text-slate-900 font-sans print:shadow-none print:border-none print:m-0 print:p-0">
            {/* Header */}
            <InvoiceHeader shop={shop} invoice={invoice} countryConfig={countryConfig} />

            {/* Seller & Buyer Cards */}
            <SellerBuyerCards shop={shop} invoice={invoice} countryConfig={countryConfig} />

            {/* Supply Details */}
            <SupplyDetails invoice={invoice} countryConfig={countryConfig} />

            {/* Items Table */}
            <ItemsTable items={items} countryConfig={countryConfig} currency={meta.currency} />

            {/* Tax Summary (India / UAE) */}
            <TaxSummary totals={totals} countryConfig={countryConfig} currency={meta.currency} />

            {/* Totals Card */}
            <TotalsCard totals={totals} currency={meta.currency} countryConfig={countryConfig} />

            {/* Amount in Words */}
            <AmountInWordsCard amountInWords={totals.amount_in_words} isArabic={isArabic} />

            {/* Bank & QR Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <BankDetailsCard shop={shop} bankDetails={invoice.bank_details_snapshot} isArabic={isArabic} />
                <QRPaymentCard qrCodeData={invoice.qr_code_data} countryConfig={countryConfig} />
            </div>

            {/* Declaration & Signature */}
            <DeclarationSignature shop={shop} declaration={invoice.declaration} countryConfig={countryConfig} />

            {/* Subtle Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
                <p>Thank you for your business! | If you have any questions, please contact us.</p>
                <p className="font-bold text-slate-500 mt-0.5">Powered by Hisabi POS</p>
            </div>
        </div>
    );
};

export default InvoiceRenderer;

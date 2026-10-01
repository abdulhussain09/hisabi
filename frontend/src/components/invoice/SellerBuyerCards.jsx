import React from 'react';

const SellerBuyerCards = ({ shop, invoice, countryConfig }) => {
    const isArabic = countryConfig.supportsArabic;
    const isIndia = countryConfig.country === 'IN';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* SELLER CARD */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs relative overflow-hidden">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200/60">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                        SELLER DETAILS {isArabic && '/ تفاصيل البائع'}
                    </span>
                </div>
                <p className="font-black text-slate-900 text-sm">{invoice.seller_name_snapshot || shop?.name || 'Store Name'}</p>
                {(invoice.seller_address_snapshot || shop?.address) && (
                    <p className="text-slate-600 mt-1 font-medium">{invoice.seller_address_snapshot || shop.address}</p>
                )}
                <div className="mt-2 space-y-0.5 text-slate-500 font-semibold">
                    {(invoice.seller_phone_snapshot || shop?.phone) && <p>Ph: {invoice.seller_phone_snapshot || shop.phone}</p>}
                    {(invoice.seller_email_snapshot || shop?.email) && <p>Email: {invoice.seller_email_snapshot || shop.email}</p>}
                </div>
                {(invoice.seller_tax_id_snapshot || shop?.trn || shop?.gstin) && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between font-bold text-slate-700">
                        <span>{countryConfig.fields.sellerTaxIdLabel}:</span>
                        <span className="font-black text-slate-900">{invoice.seller_tax_id_snapshot || shop?.trn || shop?.gstin}</span>
                    </div>
                )}
            </div>

            {/* BUYER CARD */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 text-xs relative overflow-hidden">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200/60">
                    <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                        BILL TO {isArabic && '/ المشتري'}
                    </span>
                </div>
                <p className="font-black text-slate-900 text-sm">
                    {invoice.customer_name || 'Walk-in Customer'}
                </p>
                {invoice.customer_address && (
                    <p className="text-slate-600 mt-1 font-medium">{invoice.customer_address}</p>
                )}
                <div className="mt-2 space-y-0.5 text-slate-500 font-semibold">
                    {invoice.customer_phone && <p>Ph: {invoice.customer_phone}</p>}
                    {invoice.customer_email && <p>Email: {invoice.customer_email}</p>}
                </div>
                {invoice.buyer_tax_id && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex justify-between font-bold text-slate-700">
                        <span>{countryConfig.fields.buyerTaxIdLabel}:</span>
                        <span className="font-black text-slate-900">{invoice.buyer_tax_id}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SellerBuyerCards;

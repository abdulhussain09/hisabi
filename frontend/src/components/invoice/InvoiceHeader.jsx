import React from 'react';
import { getCountryConfig } from '../../config/countryConfig';
import { getImageUrl } from '../../api/axios';

const InvoiceHeader = ({ shop, invoice, countryConfig }) => {
    const isArabic = countryConfig.supportsArabic;
    const dateStr = invoice.date ? new Date(invoice.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
    const timeStr = invoice.date ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const logoUrl = shop?.brand_logo ? getImageUrl(shop.brand_logo) : null;

    return (
        <div className="border-b-2 border-slate-900/10 pb-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                {/* LEFT: Logo & Shop Contact Info */}
                <div className="flex gap-4 items-start max-w-md">
                    {logoUrl && (
                        <div className="w-16 h-16 rounded-xl border border-slate-200 p-1 flex-shrink-0 bg-white shadow-sm overflow-hidden">
                            <img src={logoUrl} alt={shop.name} className="w-full h-full object-contain" />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none" style={{ color: shop?.brand_color || '#0f172a' }}>
                            {shop?.name || 'Store Name'}
                        </h1>
                        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                            {shop?.address || ''}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-semibold mt-2">
                            {shop?.phone && <span>Ph: {shop.phone}</span>}
                            {shop?.email && <span>Em: {shop.email}</span>}
                        </div>
                        {countryConfig.country === 'IN' && shop?.gstin && (
                            <p className="text-xs font-black text-blue-700 mt-1.5 uppercase">
                                GSTIN: {shop.gstin}
                            </p>
                        )}
                        {countryConfig.country === 'AE' && shop?.trn && (
                            <p className="text-xs font-black text-blue-700 mt-1.5 uppercase">
                                TRN: {shop.trn}
                            </p>
                        )}
                        {countryConfig.country === 'KW' && shop?.trn && (
                            <p className="text-xs font-black text-blue-700 mt-1.5 uppercase">
                                CR No: {shop.trn}
                            </p>
                        )}
                    </div>
                </div>

                {/* RIGHT: Document Title & Metadata */}
                <div className="text-right flex-shrink-0 w-full md:w-auto">
                    <div className="inline-block bg-slate-900 text-white px-4 py-2 rounded-xl text-right mb-3 shadow-sm">
                        <h2 className="text-lg font-black uppercase tracking-wider leading-none">
                            {invoice.invoice_title || countryConfig.invoiceTitle}
                        </h2>
                        {isArabic && countryConfig.invoiceTitleArabic && (
                            <p className="text-sm font-bold mt-0.5 text-slate-300 dir-rtl">
                                {countryConfig.invoiceTitleArabic}
                            </p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-1 text-xs text-slate-600">
                        <div className="flex justify-between md:justify-end gap-3">
                            <span className="font-bold text-slate-400">Invoice No / رقم الفاتورة:</span>
                            <span className="font-black text-slate-900">#{String(invoice.invoice_number || '0000').padStart(5, '0')}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-3">
                            <span className="font-bold text-slate-400">Date / التاريخ:</span>
                            <span className="font-black text-slate-900">{dateStr}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-3">
                            <span className="font-bold text-slate-400">Time / الوقت:</span>
                            <span className="font-bold text-slate-800">{timeStr}</span>
                        </div>
                        <div className="flex justify-between md:justify-end gap-3">
                            <span className="font-bold text-slate-400">Method / طريقة الدفع:</span>
                            <span className="font-bold text-slate-800 uppercase">{(invoice.payment_method || 'Cash')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceHeader;

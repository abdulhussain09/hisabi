import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

const TotalsCard = ({ totals, currency, countryConfig }) => {
    const isArabic = countryConfig.supportsArabic;
    const isTaxable = countryConfig.supportsTax;

    return (
        <div className="flex flex-col items-end mb-6">
            <div className="w-full md:w-80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                    <span>Subtotal {isArabic && '/ المجموع الفرعي'}:</span>
                    <span className="font-bold text-slate-900 tabular-nums">
                        {formatCurrency(totals.gross_subtotal, currency, true)}
                    </span>
                </div>

                {parseFloat(totals.total_line_discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Line Discounts:</span>
                        <span className="font-bold tabular-nums">
                            -{formatCurrency(totals.total_line_discount, currency, true)}
                        </span>
                    </div>
                )}

                {parseFloat(totals.global_discount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Invoice Discount {isArabic && '/ الخصم'}:</span>
                        <span className="font-bold tabular-nums">
                            -{formatCurrency(totals.global_discount, currency, true)}
                        </span>
                    </div>
                )}

                {isTaxable && parseFloat(totals.tax_total || 0) > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                        <span>Total Tax {isArabic && '/ إجمالي الضريبة'}:</span>
                        <span className="font-bold tabular-nums">
                            +{formatCurrency(totals.tax_total, currency, true)}
                        </span>
                    </div>
                )}

                {parseFloat(totals.round_off || 0) !== 0 && (
                    <div className="flex justify-between text-slate-500 font-medium">
                        <span>Round Off:</span>
                        <span className="font-bold tabular-nums">
                            {totals.round_off > 0 ? `+${formatCurrency(totals.round_off, currency)}` : formatCurrency(totals.round_off, currency)}
                        </span>
                    </div>
                )}

                {/* GRAND TOTAL PROMINENT BANNER */}
                <div className="bg-slate-900 text-white rounded-xl p-3.5 mt-2 flex justify-between items-center shadow-md">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            GRAND TOTAL {isArabic && '/ المجموع الإجمالي'}
                        </p>
                    </div>
                    <p className="text-xl font-black tabular-nums tracking-tight">
                        {formatCurrency(totals.grand_total, currency, true)}
                    </p>
                </div>

                {/* PAYMENT SUMMARY BOX */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1 mt-2">
                    <div className="flex justify-between text-slate-700 font-bold">
                        <span>Paid Amount {isArabic && '/ المدفوع'}:</span>
                        <span className="text-emerald-600 tabular-nums">
                            {formatCurrency(totals.paid_amount, currency, true)}
                        </span>
                    </div>
                    {parseFloat(totals.due_amount || 0) > 0 ? (
                        <div className="flex justify-between text-red-600 font-black text-xs pt-1 border-t border-slate-200/60">
                            <span>Balance Due {isArabic && '/ المتبقي'}:</span>
                            <span className="tabular-nums">
                                {formatCurrency(totals.due_amount, currency, true)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex justify-between text-emerald-600 font-bold text-[11px] pt-1 border-t border-slate-200/60">
                            <span>Payment Status:</span>
                            <span className="uppercase font-black">Fully Paid</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TotalsCard;

import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

const TaxSummary = ({ totals, countryConfig, currency }) => {
    if (!countryConfig.supportsTax) return null;
    if (parseFloat(totals.tax_total || 0) <= 0) return null;

    const isIndia = countryConfig.country === 'IN';
    const isUAE = countryConfig.country === 'AE';

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3">
                {isIndia ? 'GST TAX SUMMARY' : (isUAE ? 'VAT SUMMARY / ملخص الضريبة' : 'TAX SUMMARY')}
            </h3>

            {isIndia ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-200/60 text-slate-600 font-bold uppercase text-[9px]">
                            <tr>
                                <th className="py-2 px-3">Taxable Value</th>
                                <th className="py-2 px-3 text-right">CGST</th>
                                <th className="py-2 px-3 text-right">SGST</th>
                                <th className="py-2 px-3 text-right">IGST</th>
                                <th className="py-2 px-3 text-right">Total Tax</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 font-medium text-slate-800">
                            <tr>
                                <td className="py-2.5 px-3 font-bold">{formatCurrency(totals.taxable_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right">{formatCurrency(totals.cgst_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right">{formatCurrency(totals.sgst_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right">{formatCurrency(totals.igst_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatCurrency(totals.tax_total, currency)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-200/60 text-slate-600 font-bold uppercase text-[9px]">
                            <tr>
                                <th className="py-2 px-3">Taxable Amount</th>
                                <th className="py-2 px-3 text-right">VAT Rate</th>
                                <th className="py-2 px-3 text-right">VAT Amount</th>
                                <th className="py-2 px-3 text-right">Total Tax</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50 font-medium text-slate-800">
                            <tr>
                                <td className="py-2.5 px-3 font-bold">{formatCurrency(totals.taxable_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right">5%</td>
                                <td className="py-2.5 px-3 text-right">{formatCurrency(totals.vat_total || totals.tax_total, currency)}</td>
                                <td className="py-2.5 px-3 text-right font-black text-blue-700">{formatCurrency(totals.tax_total, currency)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TaxSummary;

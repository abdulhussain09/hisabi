import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

const ItemsTable = ({ items = [], countryConfig, currency }) => {
    const isIndia = countryConfig.country === 'IN';
    const isArabic = countryConfig.supportsArabic;
    const isTaxable = countryConfig.supportsTax;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="py-3 px-3 text-center w-10">#</th>
                            {isIndia && <th className="py-3 px-3 w-20">HSN/SAC</th>}
                            <th className="py-3 px-4">
                                Item Description {isArabic && '/ وصف البند'}
                            </th>
                            <th className="py-3 px-3 text-center w-16">Qty</th>
                            <th className="py-3 px-3 text-right w-24">
                                Unit Price {isArabic && '/ سعر'}
                            </th>
                            {isIndia && <th className="py-3 px-3 text-right w-20">MRP</th>}
                            <th className="py-3 px-3 text-right w-20">Discount</th>
                            <th className="py-3 px-3 text-right w-24">Taxable</th>
                            {isTaxable && <th className="py-3 px-3 text-right w-20">Tax %</th>}
                            <th className="py-3 px-4 text-right w-28">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {items.map((item, idx) => {
                            const unitPrice = parseFloat(item.unit_price || 0);
                            const discount = parseFloat(item.discount || 0);
                            const taxable = parseFloat(item.taxable_amount || (item.quantity * unitPrice - discount));
                            const taxRate = parseFloat(item.tax_rate || 0);
                            const lineTotal = parseFloat(item.line_total || taxable);

                            return (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                                    {isIndia && (
                                        <td className="py-3 px-3 font-mono font-medium text-slate-500">
                                            {item.hsn_sac || '—'}
                                        </td>
                                    )}
                                    <td className="py-3 px-4">
                                        <p className="font-bold text-slate-900">{item.item_name}</p>
                                        {item.item_description && (
                                            <p className="text-[11px] text-slate-500 mt-0.5 font-normal">{item.item_description}</p>
                                        )}
                                        {item.sku && (
                                            <p className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">SKU: {item.sku}</p>
                                        )}
                                    </td>
                                    <td className="py-3 px-3 text-center font-bold text-slate-900 tabular-nums">
                                        {item.quantity} <span className="text-[10px] text-slate-400 font-normal">{item.unit || 'PCS'}</span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-medium text-slate-700 tabular-nums">
                                        {formatCurrency(unitPrice, currency)}
                                    </td>
                                    {isIndia && (
                                        <td className="py-3 px-3 text-right font-medium text-slate-400 line-through decoration-red-400/40 tabular-nums">
                                            {item.mrp && parseFloat(item.mrp) > 0 ? formatCurrency(item.mrp, currency) : '—'}
                                        </td>
                                    )}
                                    <td className="py-3 px-3 text-right font-medium text-emerald-600 tabular-nums">
                                        {discount > 0 ? `-${formatCurrency(discount, currency)}` : '—'}
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
                                        {formatCurrency(taxable, currency)}
                                    </td>
                                    {isTaxable && (
                                        <td className="py-3 px-3 text-right font-medium text-slate-600 tabular-nums">
                                            {taxRate > 0 ? `${(taxRate * 100).toFixed(0)}%` : '0%'}
                                        </td>
                                    )}
                                    <td className="py-3 px-4 text-right font-black text-slate-900 tabular-nums">
                                        {formatCurrency(lineTotal, currency)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ItemsTable;

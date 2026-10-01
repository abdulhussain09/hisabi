import React from 'react';
import {
    User, MapPin, CreditCard, CheckCircle2, Building,
    ShieldCheck, Phone, Mail, QrCode
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const IndiaInvoiceLayout = ({ invoice, shop, calculation }) => {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'INR';

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Hisabi Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || 'India';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const gstin = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXXXX]';

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';

    const placeState = invoice.place_of_supply_state || 'Rajasthan';
    const placeCode = invoice.place_of_supply_code || '08';
    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();

    const bank = invoice.bank_details_snapshot || shop?.bank_details || {};
    const qrData = invoice.qr_code_data || `upi://pay?pa=${shop?.upi_id || 'hisabi@upi'}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;

    const isPaid = (totals.due_amount || 0) <= 0;

    return (
        <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 box-border text-slate-900 font-sans shadow-lg print:shadow-none print:m-0 print:p-6 print:w-full print:max-w-none text-[11px] leading-tight">
            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                {/* Left: Brand & Shop Info */}
                <div className="max-w-[45%]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            H
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight text-slate-900">Hisabi</span>
                            <p className="text-[9px] text-slate-500 font-medium -mt-0.5">Smart Billing | Inventory | Business Growth</p>
                        </div>
                    </div>
                    <div className="mt-2 text-slate-700 space-y-0.5">
                        <p className="font-bold text-xs text-slate-900">{sellerName}</p>
                        <p className="text-slate-500">{sellerAddress}</p>
                        {sellerPhone && <p className="text-slate-500">Ph: {sellerPhone}</p>}
                        {sellerEmail && <p className="text-slate-500">Em: {sellerEmail}</p>}
                    </div>
                </div>

                {/* Center: GSTIN */}
                <div className="pt-2 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GSTIN</span>
                    <span className="font-black text-slate-800 text-xs tracking-wide">GSTIN NO: {gstin}</span>
                </div>

                {/* Right: Tax Invoice Title & Metadata */}
                <div className="text-right">
                    <h1 className="text-xl font-black text-[#024282] uppercase tracking-wide">TAX INVOICE</h1>
                    <p className="text-[9px] font-bold text-slate-400 uppercase -mt-0.5">(GST INVOICE)</p>

                    <div className="mt-3 text-[11px] space-y-1 font-medium text-slate-700">
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Invoice No.</span>
                            <span className="font-bold text-slate-900 w-24 text-left">: #{String(invoice.invoice_number || '1').padStart(4, '0')}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Date</span>
                            <span className="font-bold text-slate-900 w-24 text-left">: {dateStr}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Time</span>
                            <span className="font-bold text-slate-900 w-24 text-left">: {timeStr}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Payment Method</span>
                            <span className="font-bold text-slate-900 w-24 text-left">: {paymentMethod}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ 3 CARDS ROW (BILL TO, PLACE OF SUPPLY, PAYMENT METHOD) ═══════ */}
            <div className="grid grid-cols-12 gap-3 my-4">
                {/* Bill To */}
                <div className="col-span-6 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>BILL TO</span>
                    </div>
                    <p className="font-black text-xs text-slate-900">{customerName}</p>
                    <div className="mt-1 space-y-0.5 text-slate-600 text-[10px]">
                        {customerPhone && <p><span className="text-slate-400">Phone :</span> {customerPhone}</p>}
                        {customerEmail && <p><span className="text-slate-400">Email :</span> {customerEmail}</p>}
                        {customerAddress && <p><span className="text-slate-400">Address :</span> {customerAddress}</p>}
                    </div>
                </div>

                {/* Place of Supply */}
                <div className="col-span-3 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Place of Supply</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[10px]">
                        <p><span className="text-slate-400">State :</span> <span className="font-bold text-slate-800">{placeState}</span></p>
                        <p><span className="text-slate-400">State Code :</span> <span className="font-bold text-slate-800">{placeCode}</span></p>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="col-span-3 bg-slate-50/90 border border-slate-200/90 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Payment Method</span>
                    </div>
                    <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-black text-xs text-slate-800 shadow-2xs">
                            {paymentMethod}
                        </span>
                    </div>
                </div>
            </div>

            {/* ═══════ ITEMS TABLE ═══════ */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
                <table className="w-full border-collapse text-[10px]">
                    <thead className="bg-[#024282] text-white font-bold text-[9px] uppercase tracking-wider">
                        <tr>
                            <th className="py-2 px-2 text-center w-8 border-r border-[#1a5b9e]">S.No.</th>
                            <th className="py-2 px-2 text-center w-16 border-r border-[#1a5b9e]">HSN/SAC</th>
                            <th className="py-2 px-3 text-left border-r border-[#1a5b9e]">Description of Goods / Services</th>
                            <th className="py-2 px-2 text-center w-16 border-r border-[#1a5b9e]">Qty / Unit</th>
                            <th className="py-2 px-2 text-right w-14 border-r border-[#1a5b9e]">MRP (₹)</th>
                            <th className="py-2 px-2 text-right w-14 border-r border-[#1a5b9e]">Rate (₹)</th>
                            <th className="py-2 px-2 text-right w-14 border-r border-[#1a5b9e]">Discount (₹)</th>
                            <th className="py-2 px-2 text-right w-16 border-r border-[#1a5b9e]">Taxable Value (₹)</th>
                            <th className="py-2 px-2 text-center w-12 border-r border-[#1a5b9e]">GST Rate (%)</th>
                            <th className="py-1 px-1 text-center w-28 border-r border-[#1a5b9e]" colSpan={2}>
                                <div className="border-b border-[#1a5b9e] pb-0.5">Tax Amount (₹)</div>
                                <div className="grid grid-cols-2 pt-0.5 text-[8px]">
                                    <span>CGST</span>
                                    <span>SGST</span>
                                </div>
                            </th>
                            <th className="py-2 px-2 text-right w-16">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                <td className="py-2 px-2 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-100">{item.hsn_sac || '—'}</td>
                                <td className="py-2 px-3 border-r border-slate-100">
                                    <p className="font-bold text-slate-900">{item.item_name}</p>
                                    {item.item_description && <p className="text-[9px] text-slate-400 mt-0.5">{item.item_description}</p>}
                                </td>
                                <td className="py-2 px-2 text-center font-medium border-r border-slate-100">{item.quantity} / {item.unit || 'Nos'}</td>
                                <td className="py-2 px-2 text-right font-medium text-slate-500 border-r border-slate-100">{item.mrp ? parseFloat(item.mrp).toFixed(2) : '—'}</td>
                                <td className="py-2 px-2 text-right font-medium border-r border-slate-100">{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td className="py-2 px-2 text-right font-medium text-slate-500 border-r border-slate-100">{parseFloat(item.discount || 0).toFixed(2)}</td>
                                <td className="py-2 px-2 text-right font-bold text-slate-900 border-r border-slate-100">{parseFloat(item.taxable_amount).toFixed(2)}</td>
                                <td className="py-2 px-2 text-center font-medium border-r border-slate-100">{item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—'}</td>
                                <td className="py-2 px-1 text-right font-medium border-r border-slate-100 w-14">{item.cgst_amount > 0 ? parseFloat(item.cgst_amount).toFixed(2) : '—'}</td>
                                <td className="py-2 px-1 text-right font-medium border-r border-slate-100 w-14">{item.sgst_amount > 0 ? parseFloat(item.sgst_amount).toFixed(2) : '—'}</td>
                                <td className="py-2 px-2 text-right font-black text-slate-900">{parseFloat(item.line_total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ═══════ TAX SUMMARY & TOTALS ═══════ */}
            <div className="grid grid-cols-12 gap-4 mb-4">
                {/* GST Tax Summary Table */}
                <div className="col-span-7 bg-slate-50/80 border border-slate-200 rounded-xl p-3">
                    <p className="font-black text-[#024282] uppercase text-[10px] tracking-wider mb-2">GST TAX SUMMARY</p>
                    <table className="w-full border-collapse text-[10px]">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-[9px] font-bold uppercase">
                                <th className="py-1 px-1 text-left">Taxable Value (₹)</th>
                                <th className="py-1 px-1 text-right">CGST (₹)</th>
                                <th className="py-1 px-1 text-right">SGST (₹)</th>
                                <th className="py-1 px-1 text-right">IGST (₹)</th>
                                <th className="py-1 px-1 text-right">Total Tax (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                            <tr>
                                <td className="py-1.5 px-1">{parseFloat(totals.taxable_total).toFixed(2)}</td>
                                <td className="py-1.5 px-1 text-right">{parseFloat(totals.cgst_total).toFixed(2)}</td>
                                <td className="py-1.5 px-1 text-right">{parseFloat(totals.sgst_total).toFixed(2)}</td>
                                <td className="py-1.5 px-1 text-right">{parseFloat(totals.igst_total).toFixed(2)}</td>
                                <td className="py-1.5 px-1 text-right text-[#024282] font-black">{parseFloat(totals.tax_total).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Totals Summary */}
                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col justify-between text-[11px]">
                    <div className="space-y-1.5 text-slate-600 font-medium">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-900">₹ {parseFloat(totals.gross_subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Discount</span>
                            <span className="font-bold text-slate-900">₹ {parseFloat(totals.global_discount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Round Off</span>
                            <span className="font-bold text-slate-900">₹ {parseFloat(totals.round_off).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#024282] text-white rounded-lg p-2.5 flex justify-between items-center shadow-xs">
                        <span className="font-black uppercase tracking-wider text-xs">Grand Total</span>
                        <span className="font-black text-sm">₹ {parseFloat(totals.grand_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ═══════ AMOUNT IN WORDS & PAYMENT STATUS ═══════ */}
            <div className="grid grid-cols-12 gap-3 mb-4">
                <div className="col-span-7 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Amount in Words</span>
                        <p className="font-black text-xs text-slate-900">{totals.amount_in_words}</p>
                    </div>
                </div>

                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-5 h-5 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {isPaid ? 'PAID' : 'PARTIAL'}
                            </span>
                        </div>
                    </div>
                    <div className="text-right text-[10px]">
                        <p><span className="text-slate-400">Paid Amount :</span> <span className="font-bold text-slate-800">₹ {parseFloat(totals.paid_amount).toFixed(2)}</span></p>
                        <p><span className="text-slate-400">Balance Due :</span> <span className="font-bold text-red-600">₹ {parseFloat(totals.due_amount).toFixed(2)}</span></p>
                    </div>
                </div>
            </div>

            {/* ═══════ 3 CARDS ROW (BANK DETAILS, UPI PAYMENT, CONTACT) ═══════ */}
            <div className="grid grid-cols-12 gap-3 mb-4">
                {/* Bank Details */}
                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>Bank Details</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        <p><span className="text-slate-400">Bank Name :</span> <span className="font-bold text-slate-800">{bank.bank_name || '[BANK NAME]'}</span></p>
                        <p><span className="text-slate-400">A/c No. :</span> <span className="font-mono font-bold text-slate-800">{bank.account_number || '[ACCOUNT NO.]'}</span></p>
                        <p><span className="text-slate-400">Branch & IFSC :</span> <span className="font-mono font-bold text-slate-800">{bank.iban_ifsc || '[BRANCH NAME] & [IFSC CODE]'}</span></p>
                    </div>
                </div>

                {/* UPI QR */}
                <div className="col-span-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="font-black text-[#024282] uppercase text-[9px] tracking-wider mb-1">UPI Payment</span>
                    <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs mb-1">
                        <img src={qrUrl} alt="UPI QR" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-[8px] font-bold text-slate-500">Scan to Pay via UPI</span>
                    <span className="text-[8px] font-black text-[#024282] uppercase mt-0.5 tracking-wider">UPI</span>
                </div>

                {/* For any queries */}
                <div className="col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>For any queries, contact us</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        {sellerPhone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> <span className="font-bold">{sellerPhone}</span></p>}
                        {sellerEmail && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> <span className="font-bold">{sellerEmail}</span></p>}
                        <p className="text-[8.5px] text-slate-500 mt-1 leading-snug">
                            Scan QR or pay via UPI for faster and safer transactions.
                        </p>
                    </div>
                </div>
            </div>

            {/* ═══════ DECLARATION & SIGNATURE ═══════ */}
            <div className="grid grid-cols-12 gap-6 pt-3 border-t border-slate-200 text-[10px]">
                <div className="col-span-7 space-y-1">
                    <p className="font-black text-slate-500 uppercase tracking-wider text-[9px]">DECLARATION</p>
                    <p className="text-slate-600 leading-relaxed">
                        {invoice.declaration || "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."}
                    </p>
                    <div className="pt-6">
                        <div className="w-44 border-b border-slate-300"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Customer's Seal & Signature</p>
                    </div>
                </div>

                <div className="col-span-5 flex flex-col justify-between items-end text-right">
                    <p className="font-black text-slate-900 uppercase">For {sellerName}</p>
                    <div className="w-44 text-center pt-8">
                        <div className="border-b border-slate-300 mb-1"></div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Authorised Signatory</p>
                    </div>
                </div>
            </div>

            {/* ═══════ FOOTER ═══════ */}
            <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400">
                <p>Thank you for your business!</p>
                <p className="font-bold text-slate-500 mt-0.5">Powered by Hisabi | Modern POS & Inventory for Growing Businesses</p>
            </div>
        </div>
    );
};

export default IndiaInvoiceLayout;

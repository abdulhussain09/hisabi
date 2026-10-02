import React from 'react';
import {
    User, MapPin, CreditCard, CheckCircle2, Building,
    ShieldCheck, Phone, Mail, QrCode
} from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { resolveIndianState } from '../../config/countryConfig';
import QRCodeImage from './QRCodeImage';

const IndiaInvoiceLayout = ({ invoice, shop, calculation }) => {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'INR';

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || '';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const sellerLogo = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const gstin = invoice.seller_tax_id_snapshot || shop?.gstin || '[XXXXXXXXXXXX]';
    const financeCompany = invoice.finance_company || null;

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';

    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});

    // Real Payment QR Payload: Only generated if shop has real upi_id or invoice has qr_code_data
    const upiId = shop?.upi_id || invoice.upi_id || null;
    const realQrData = invoice.qr_code_data || (upiId
        ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(sellerName)}&am=${totals.grand_total}&cu=INR`
        : null);

    const invoiceNotes = invoice.notes || shop?.invoice_notes || 'Thank you for your business! If you have any questions about this invoice, please contact us.';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';

    const isPaid = (totals.due_amount || 0) <= 0;

    return (
        <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-7 box-border text-slate-900 font-sans shadow-lg print:shadow-none print:m-0 print:p-6 print:w-full print:max-w-none text-[10.5px] leading-snug">
            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                {/* Left: User's Shop Logo & Details */}
                <div className="max-w-[45%]">
                    <div className="flex items-center gap-2.5 mb-2">
                        {sellerLogo ? (
                            <img src={sellerLogo} alt={sellerName} className="w-10 h-10 rounded-lg object-contain border border-slate-200 shadow-2xs" />
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#024282] flex items-center justify-center text-white font-black text-xl shadow-xs">
                                {sellerName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <span className="text-lg font-black tracking-tight text-slate-900 leading-tight block">{sellerName}</span>
                        </div>
                    </div>
                    <div className="text-slate-600 text-[10px] space-y-0.5 leading-snug">
                        {sellerAddress && <p>{sellerAddress}</p>}
                        {sellerPhone && <p className="text-slate-500">Ph: {sellerPhone}</p>}
                        {sellerEmail && <p className="text-slate-500">Email: {sellerEmail}</p>}
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
                            <span className="font-bold text-slate-900 w-28 text-left">: #{String(invoice.invoice_number || '1').padStart(4, '0')}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Date</span>
                            <span className="font-bold text-slate-900 w-28 text-left">: {dateStr}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Time</span>
                            <span className="font-bold text-slate-900 w-28 text-left">: {timeStr}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="text-slate-400">Payment Method</span>
                            <span className="font-bold text-slate-900 w-28 text-left">: {paymentMethod}</span>
                        </div>
                        {financeCompany && (
                            <div className="flex justify-end gap-2">
                                <span className="text-slate-400">Finance Co.</span>
                                <span className="font-bold text-slate-900 w-28 text-left">: {financeCompany}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ BILL TO CARD (FULL WIDTH) ═══════ */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 my-3">
                <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>BILL TO</span>
                </div>
                <div className="grid grid-cols-12 gap-3 items-start">
                    <div className="col-span-7 space-y-0.5">
                        <p className="font-black text-xs text-slate-900">{customerName}</p>
                        {customerAddress ? (
                            <p className="text-slate-600 text-[10px] leading-snug">{customerAddress}</p>
                        ) : (
                            <p className="text-slate-400 text-[9.5px] italic">No address provided</p>
                        )}
                    </div>
                    <div className="col-span-5 text-right space-y-0.5 text-slate-600 text-[10px]">
                        {customerPhone && <p><span className="text-slate-400">Phone :</span> {customerPhone}</p>}
                        {customerEmail && <p><span className="text-slate-400">Email :</span> {customerEmail}</p>}
                    </div>
                </div>
            </div>

            {/* ═══════ ITEMS TABLE + TOTALS (ONE UNIFIED BLOCK) ═══════ */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-2xs">
                <table className="w-full border-collapse text-[9.5px]">
                    <thead className="bg-[#024282] text-white font-bold text-[8.5px] uppercase tracking-wider">
                        <tr>
                            <th className="py-2 px-1.5 text-center w-7 border-r border-[#1a5b9e]">S.No.</th>
                            <th className="py-2 px-1.5 text-center w-14 border-r border-[#1a5b9e]">HSN/SAC</th>
                            <th className="py-2 px-2 text-left border-r border-[#1a5b9e]">Description of Goods / Services</th>
                            <th className="py-2 px-1.5 text-center w-14 border-r border-[#1a5b9e]">Qty / Unit</th>
                            <th className="py-2 px-1.5 text-right w-12 border-r border-[#1a5b9e]">MRP (₹)</th>
                            <th className="py-2 px-1.5 text-right w-12 border-r border-[#1a5b9e]">Rate (₹)</th>
                            <th className="py-2 px-1.5 text-right w-12 border-r border-[#1a5b9e]">Disc (₹)</th>
                            <th className="py-2 px-1.5 text-right w-14 border-r border-[#1a5b9e]">Taxable (₹)</th>
                            <th className="py-2 px-1.5 text-center w-10 border-r border-[#1a5b9e]">GST%</th>
                            <th className="py-1 px-1 text-center w-24 border-r border-[#1a5b9e]" colSpan={2}>
                                <div className="border-b border-[#1a5b9e] pb-0.5 text-[8px]">Tax Amount (₹)</div>
                                <div className="grid grid-cols-2 pt-0.5 text-[7.5px]">
                                    <span>CGST</span>
                                    <span>SGST</span>
                                </div>
                            </th>
                            <th className="py-2 px-1.5 text-right w-14">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                <td className="py-1.5 px-1.5 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                <td className="py-1.5 px-1.5 text-center font-mono text-slate-500 border-r border-slate-100">{item.hsn_sac || '—'}</td>
                                <td className="py-1.5 px-2 border-r border-slate-100">
                                    <p className="font-bold text-slate-900">{item.item_name}</p>
                                    {item.item_description && <p className="text-[8.5px] text-slate-400 mt-0.5">{item.item_description}</p>}
                                </td>
                                <td className="py-1.5 px-1.5 text-center font-medium border-r border-slate-100">{item.quantity} / {item.unit || 'Nos'}</td>
                                <td className="py-1.5 px-1.5 text-right font-medium text-slate-500 border-r border-slate-100">{item.mrp ? parseFloat(item.mrp).toFixed(2) : '—'}</td>
                                <td className="py-1.5 px-1.5 text-right font-medium border-r border-slate-100">{parseFloat(item.unit_price).toFixed(2)}</td>
                                <td className="py-1.5 px-1.5 text-right font-medium text-slate-500 border-r border-slate-100">{parseFloat(item.discount || 0).toFixed(2)}</td>
                                <td className="py-1.5 px-1.5 text-right font-bold text-slate-900 border-r border-slate-100">{parseFloat(item.taxable_amount).toFixed(2)}</td>
                                <td className="py-1.5 px-1.5 text-center font-medium border-r border-slate-100">{item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '—'}</td>
                                <td className="py-1.5 px-1 text-right font-medium border-r border-slate-100 w-12">{item.cgst_amount > 0 ? parseFloat(item.cgst_amount).toFixed(2) : '—'}</td>
                                <td className="py-1.5 px-1 text-right font-medium border-r border-slate-100 w-12">{item.sgst_amount > 0 ? parseFloat(item.sgst_amount).toFixed(2) : '—'}</td>
                                <td className="py-1.5 px-1.5 text-right font-black text-slate-900">{parseFloat(item.line_total).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ── GST Tax Summary + Totals attached directly below table ── */}
                <div className="border-t border-slate-200 grid grid-cols-12">
                    {/* GST Tax Summary (left 7 cols) */}
                    <div className="col-span-7 bg-slate-50/80 p-2.5 border-r border-slate-200">
                        <p className="font-black text-[#024282] uppercase text-[9px] tracking-wider mb-1.5">GST TAX SUMMARY</p>
                        <table className="w-full border-collapse text-[9px]">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-[8px] font-bold uppercase">
                                    <th className="py-0.5 px-1 text-left">Taxable (₹)</th>
                                    <th className="py-0.5 px-1 text-right">CGST (₹)</th>
                                    <th className="py-0.5 px-1 text-right">SGST (₹)</th>
                                    <th className="py-0.5 px-1 text-right">IGST (₹)</th>
                                    <th className="py-0.5 px-1 text-right">Total Tax (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="font-bold text-slate-800">
                                <tr>
                                    <td className="py-1 px-1">{parseFloat(totals.taxable_total).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-right">{parseFloat(totals.cgst_total).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-right">{parseFloat(totals.sgst_total).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-right">{parseFloat(totals.igst_total).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-right text-[#024282] font-black">{parseFloat(totals.tax_total).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals block (right 5 cols) */}
                    <div className="col-span-5 bg-slate-50/80 flex flex-col justify-between text-[10px]">
                        <div className="p-2.5 space-y-1 text-slate-600 font-medium border-b border-slate-200">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900">₹ {parseFloat(totals.gross_subtotal).toFixed(2)}</span>
                            </div>
                            {parseFloat(totals.global_discount) > 0 && (
                                <div className="flex justify-between">
                                    <span>Discount</span>
                                    <span className="font-bold text-red-600">− ₹ {parseFloat(totals.global_discount).toFixed(2)}</span>
                                </div>
                            )}
                            {parseFloat(totals.round_off) !== 0 && (
                                <div className="flex justify-between">
                                    <span>Round Off</span>
                                    <span className="font-bold text-slate-900">₹ {parseFloat(totals.round_off).toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-[#024282] text-white p-2.5 flex justify-between items-center">
                            <span className="font-black uppercase tracking-wider text-[10px]">Grand Total</span>
                            <span className="font-black text-sm">₹ {parseFloat(totals.grand_total).toFixed(2)}</span>
                        </div>
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
                    <QRCodeImage
                        text={realQrData}
                        alt="UPI QR"
                        containerClassName="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs mb-1 flex items-center justify-center"
                        unavailableText="QR Unavailable"
                        unavailableSubtext="No UPI Configured"
                    />
                    <span className="text-[8px] font-bold text-slate-500">{realQrData ? 'Scan to Pay via UPI' : 'UPI Not Configured'}</span>
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
                        {invoiceDeclaration}
                    </p>
                    <div className="pt-16">
                        <div className="w-48 border-b border-slate-300"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Customer's Seal & Signature</p>
                    </div>
                </div>

                <div className="col-span-5 flex flex-col justify-between items-end text-right">
                    <p className="font-black text-slate-900 uppercase">For {sellerName}</p>
                    <div className="w-48 text-center pt-16">
                        <div className="border-b border-slate-300 mb-1"></div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Authorised Signatory</p>
                    </div>
                </div>
            </div>

            {/* ═══════ FOOTER ═══════ */}
            <div className="mt-4 pt-2 border-t border-slate-100 text-center text-[8.5px] text-slate-400">
                <p>Thank you for your business! &nbsp;|&nbsp; Powered by Hisabi POS &nbsp;|&nbsp; Modern POS &amp; Inventory for Growing Businesses</p>
            </div>
        </div>
    );
};

export default IndiaInvoiceLayout;

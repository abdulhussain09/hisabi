import React from 'react';
import {
    User, Building2, CreditCard, CheckCircle2,
    Calendar, Phone, Mail, Globe, MapPin, Info, FileText
} from 'lucide-react';
import { DubaiSkyline } from './DubaiSkyline';

const UAEInvoiceLayout = ({ invoice, shop, calculation }) => {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'AED';

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Hisabi Technologies';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || 'Dubai, UAE';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '+971 50 123 4567';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || 'info@hisabi.com';
    const trn = invoice.seller_tax_id_snapshot || shop?.trn || '100000000000003';

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';
    const buyerTrn = invoice.buyer_tax_id || '';

    const paymentMethod = invoice.payment_method ? invoice.payment_method.charAt(0).toUpperCase() + invoice.payment_method.slice(1) : 'Cash';
    const isPaid = (totals.due_amount || 0) <= 0;

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const qrData = invoice.qr_code_data || `https://hisabi.com/verify?inv=${invoice.invoice_number}&trn=${trn}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
    const invoiceNotes = invoice.notes || shop?.invoice_notes || '';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.';

    return (
        <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 box-border text-slate-900 font-sans shadow-lg print:shadow-none print:m-0 print:p-6 print:w-full print:max-w-none text-[11px] leading-tight">
            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-center pb-5 border-b border-slate-200">
                {/* Left: Brand */}
                <div className="max-w-[35%]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            H
                        </div>
                        <div>
                            <span className="text-2xl font-black tracking-tight text-slate-900">Hisabi</span>
                        </div>
                    </div>
                    <p className="text-[9px] font-black text-slate-700 uppercase tracking-wider">SMART POS & INVENTORY SOLUTIONS</p>
                    <p className="text-[9px] text-slate-400 font-medium">Simple • Fast • Reliable</p>
                </div>

                {/* Center: Contact Info */}
                <div className="text-left text-slate-600 space-y-0.5 text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <MapPin className="w-3 h-3 text-sky-500" />
                        <span>{sellerAddress}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{sellerPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{sellerEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>www.hisabi.com</span>
                    </div>
                </div>

                {/* Right: Dubai Skyline Artwork */}
                <div className="flex justify-end items-center">
                    <DubaiSkyline className="w-48 h-16 text-sky-400 opacity-80" />
                </div>
            </div>

            {/* ═══════ TITLE BAR & METADATA ═══════ */}
            <div className="flex justify-between items-end my-4">
                <div>
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-2xl font-black text-[#024282] uppercase tracking-wide">TAX INVOICE</h1>
                        <span className="text-xl font-bold text-[#024282] font-arabic" dir="rtl">فاتورة ضريبية</span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                        TRN: <span className="font-mono font-black">{trn}</span>
                    </p>
                </div>

                {/* 3 Equal Metadata Cards */}
                <div className="flex gap-2">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center min-w-[90px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Invoice No.</span>
                        <span className="font-black text-xs text-slate-900 font-mono">INV-{String(invoice.invoice_number || '1').padStart(6, '0')}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center min-w-[90px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Issue Date</span>
                        <span className="font-bold text-xs text-slate-900">{dateStr}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-center min-w-[90px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Supply Date</span>
                        <span className="font-bold text-xs text-slate-900">{invoice.supply_date ? new Date(invoice.supply_date).toLocaleDateString('en-GB') : dateStr}</span>
                    </div>
                </div>
            </div>

            {/* ═══════ 2 CARDS ROW (BILL TO, SUPPLY TO) ═══════ */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Bill To */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 flex justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                            <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                                <User className="w-2.5 h-2.5" />
                            </div>
                            <span>Bill To / المشتري</span>
                        </div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">Customer Name</p>
                        <p className="font-black text-xs text-slate-900">{customerName}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-1.5">Address</p>
                        <p className="text-slate-600 text-[10px] whitespace-pre-line">{customerAddress}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-bold mt-1.5">TRN (if applicable)</p>
                        <p className="font-mono text-slate-700 text-[10px]">{buyerTrn || '—'}</p>
                    </div>
                    <div className="text-right space-y-1 text-slate-600 text-[10px] pt-5">
                        {customerPhone && <p className="flex items-center justify-end gap-1"><Phone className="w-3 h-3 text-slate-400" /> {customerPhone}</p>}
                        {customerEmail && <p className="flex items-center justify-end gap-1"><Mail className="w-3 h-3 text-slate-400" /> {customerEmail}</p>}
                    </div>
                </div>

                {/* Supply To */}
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                        <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                            <Building2 className="w-2.5 h-2.5" />
                        </div>
                        <span>Supply To / جهة التوريد</span>
                    </div>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">Same as Bill To</p>
                    <p className="font-black text-xs text-slate-900">{customerName}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mt-1.5">Address</p>
                    <p className="text-slate-600 text-[10px] whitespace-pre-line">{customerAddress}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold mt-1.5">TRN (if applicable)</p>
                    <p className="font-mono text-slate-700 text-[10px]">{buyerTrn || '—'}</p>
                </div>
            </div>

            {/* ═══════ ITEMS TABLE (10 COLUMNS) ═══════ */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
                <table className="w-full border-collapse text-[10px]">
                    <thead className="bg-[#024282] text-white font-bold text-[9px] tracking-wider text-center">
                        <tr className="border-b border-[#1a5b9e]">
                            <th className="py-2 px-1 w-7 border-r border-[#1a5b9e]">#</th>
                            <th className="py-2 px-2 text-left border-r border-[#1a5b9e]">
                                <div>Item Description</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85" dir="rtl">وصف المنتج</div>
                            </th>
                            <th className="py-2 px-1 w-10 border-r border-[#1a5b9e]">
                                <div>Qty</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">الكمية</div>
                            </th>
                            <th className="py-2 px-2 text-right w-16 border-r border-[#1a5b9e]">
                                <div>Unit Price</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">سعر الوحدة</div>
                            </th>
                            <th className="py-2 px-1 text-right w-12 border-r border-[#1a5b9e]">
                                <div>Discount</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">الخصم</div>
                            </th>
                            <th className="py-2 px-2 text-right w-18 border-r border-[#1a5b9e]">
                                <div>Taxable Amount</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">المبلغ الخاضع للضريبة</div>
                            </th>
                            <th className="py-2 px-2 text-right w-16 border-r border-[#1a5b9e]">
                                <div>Net Amount</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">المبلغ الصافي</div>
                            </th>
                            <th className="py-2 px-1 text-center w-14 border-r border-[#1a5b9e]">
                                <div>VAT Rate</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">نسبة الضريبة</div>
                            </th>
                            <th className="py-2 px-2 text-right w-16 border-r border-[#1a5b9e]">
                                <div>VAT Amount</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">مبلغ الضريبة</div>
                            </th>
                            <th className="py-2 px-2 text-right w-18">
                                <div>Gross Amount</div>
                                <div className="text-[8px] font-normal font-arabic opacity-85">المبلغ الإجمالي</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {items.map((item, idx) => {
                            const taxable = parseFloat(item.taxable_amount || 0);
                            const vatRatePercent = item.tax_rate ? `${Math.round(item.tax_rate * 100)}%` : '0%';
                            const vatAmount = parseFloat(item.tax_amount || 0);
                            const gross = parseFloat(item.line_total || taxable);

                            return (
                                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                    <td className="py-2 px-1 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                    <td className="py-2 px-2 border-r border-slate-100">
                                        <p className="font-bold text-slate-900">{item.item_name}</p>
                                        {item.item_description && <p className="text-[9px] text-slate-400 mt-0.5">{item.item_description}</p>}
                                    </td>
                                    <td className="py-2 px-1 text-center font-medium border-r border-slate-100">{item.quantity}</td>
                                    <td className="py-2 px-2 text-right font-medium border-r border-slate-100">{parseFloat(item.unit_price).toFixed(2)}</td>
                                    <td className="py-2 px-1 text-right font-medium text-slate-500 border-r border-slate-100">{parseFloat(item.discount || 0).toFixed(2)}</td>
                                    <td className="py-2 px-2 text-right font-medium border-r border-slate-100">{taxable.toFixed(2)}</td>
                                    <td className="py-2 px-2 text-right font-bold text-slate-900 border-r border-slate-100">{taxable.toFixed(2)}</td>
                                    <td className="py-2 px-1 text-center font-medium border-r border-slate-100 text-slate-600">{vatRatePercent}</td>
                                    <td className="py-2 px-2 text-right font-medium border-r border-slate-100 text-slate-600">{vatAmount.toFixed(2)}</td>
                                    <td className="py-2 px-2 text-right font-black text-slate-900">{gross.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ═══════ TOTALS & AMOUNT IN WORDS ═══════ */}
            <div className="grid grid-cols-12 gap-4 mb-4">
                <div className="col-span-7 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Amount in Words</span>
                        <p className="font-black text-xs text-slate-900">{totals.amount_in_words}</p>
                    </div>
                </div>

                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-[11px] space-y-1.5">
                    <div className="flex justify-between text-slate-600 font-medium">
                        <span>Subtotal ({currency})</span>
                        <span className="font-bold text-slate-900">{parseFloat(totals.gross_subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                        <span>VAT Total ({currency})</span>
                        <span className="font-bold text-slate-900">{parseFloat(totals.tax_total).toFixed(2)}</span>
                    </div>
                    <div className="mt-1 bg-[#024282] text-white rounded-lg p-2.5 flex justify-between items-center shadow-xs">
                        <span className="font-black uppercase tracking-wider text-xs">Grand Total ({currency})</span>
                        <span className="font-black text-sm">{parseFloat(totals.grand_total).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ═══════ 4-SEGMENT PAYMENT BANNER ═══════ */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 mb-4 text-[10px]">
                <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-600" />
                    <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Payment Method</span>
                        <span className="font-black text-slate-800">{paymentMethod}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Payment Status</span>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {isPaid ? 'Paid' : 'Partial'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Payment Date & Time</span>
                        <span className="font-bold text-slate-800">{dateStr} {timeStr}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 justify-end text-right">
                    <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Paid Amount ({currency})</span>
                        <span className="font-black text-slate-900 text-xs">{parseFloat(totals.paid_amount).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* ═══════ 2 CARDS ROW (BANK DETAILS & QR) ═══════ */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-[10px]">
                {/* Bank Details */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Bank Details</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        <p><span className="text-slate-400">Bank Name :</span> <span className="font-bold text-slate-800">{bank.bank_name || '—'}</span></p>
                        <p><span className="text-slate-400">A/C No. :</span> <span className="font-mono font-bold text-slate-800">{bank.account_number || '—'}</span></p>
                        <p><span className="text-slate-400">Branch & IFSC :</span> <span className="font-mono font-bold text-slate-800">{bank.iban_ifsc || '—'}</span></p>
                    </div>
                </div>

                {/* QR / Payment */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs flex-shrink-0">
                        <img src={qrUrl} alt="ZATCA QR" className="w-full h-full object-contain" />
                    </div>
                    <div className="space-y-0.5">
                        <span className="font-black text-[#024282] uppercase text-[9px] tracking-wider block">QR / Payment</span>
                        <p className="text-[9px] text-slate-500 leading-snug">
                            Scan to pay or view payment details (UPI / Card / Wallet / Bank Transfer)
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 mt-1">Powered by Hisabi</p>
                    </div>
                </div>
            </div>

            {/* ═══════ REVERSE CHARGE NOTICE ═══════ */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-4 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-700">
                    <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    <span className="font-bold">Reverse Charge / Special Tax Treatment (if applicable)</span>
                </div>
                <span className="text-slate-400 font-mono">—</span>
            </div>

            {/* ═══════ DECLARATION & SIGNATURE ═══════ */}
            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-200 text-[10px]">
                <div className="space-y-1">
                    <p className="font-black text-slate-500 uppercase tracking-wider text-[9px]">Declaration</p>
                    <p className="text-slate-600 leading-relaxed text-[9.5px]">
                        {invoiceDeclaration}
                    </p>
                    <div className="pt-6">
                        <div className="w-44 border-b border-slate-300"></div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Customer's Seal & Signature</p>
                    </div>
                </div>

                <div className="flex flex-col justify-between items-end text-right">
                    <p className="font-black text-slate-900 uppercase">For {sellerName}</p>
                    <div className="w-44 text-center pt-8">
                        <div className="border-b border-slate-300 mb-1"></div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Authorised Signatory</p>
                    </div>
                </div>
            </div>

            {/* ═══════ FOOTER ═══════ */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-[9px] text-slate-400">
                <p>Thank you for your business!</p>
                <p>If you have any questions about this invoice, please contact us.</p>
                <p className="font-bold text-slate-500">Powered by Hisabi</p>
            </div>
        </div>
    );
};

export default UAEInvoiceLayout;

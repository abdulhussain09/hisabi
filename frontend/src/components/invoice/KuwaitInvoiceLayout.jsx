import React from 'react';
import {
    FileText, Calendar, Clock, CreditCard, User, Truck,
    CheckCircle2, Building, ShieldCheck, Phone, Mail, Globe, MapPin
} from 'lucide-react';
import { KuwaitSkyline } from './KuwaitSkyline';
import QRCodeImage from './QRCodeImage';

const KuwaitInvoiceLayout = ({ invoice, shop, calculation }) => {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'KWD';
    const decimals = meta.currency_decimals || (currency === 'KWD' ? 3 : 2);

    const fmt = (val) => parseFloat(val || 0).toFixed(decimals);

    const dateStr = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    const timeStr = invoice.date
        ? new Date(invoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const sellerName = invoice.seller_name_snapshot || shop?.name || 'Store';
    const sellerAddress = invoice.seller_address_snapshot || shop?.address || 'Kuwait';
    const sellerPhone = invoice.seller_phone_snapshot || shop?.phone || '';
    const sellerEmail = invoice.seller_email_snapshot || shop?.email || '';
    const sellerLogo = invoice.seller_logo_snapshot || shop?.brand_logo || null;
    const crNo = shop?.cr_number || invoice.seller_tax_id_snapshot || '1234567';
    const financeCompany = invoice.finance_company || null;

    const customerName = invoice.customer_name || 'Walk-in Customer';
    const customerPhone = invoice.customer_phone || '';
    const customerEmail = invoice.customer_email || '';
    const customerAddress = invoice.customer_address || '';

    const paymentMethod = (invoice.payment_method || 'CASH').toUpperCase();
    const isPaid = (totals.due_amount || 0) <= 0;

    const bank = invoice.bank_details_snapshot || (shop?.bank_name ? {
        bank_name: shop.bank_name,
        account_number: shop.bank_account_number,
        iban_ifsc: shop.bank_iban_ifsc
    } : {});
    const qrData = invoice.qr_code_data || `https://knet.com.kw/pay?inv=${invoice.invoice_number}&amt=${totals.grand_total}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrData)}`;
    const invoiceNotes = invoice.notes || shop?.invoice_notes || '';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || '';

    return (
        <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 box-border text-slate-900 font-sans shadow-lg print:shadow-none print:m-0 print:p-6 print:w-full print:max-w-none text-[11px] leading-tight">
            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-center pb-5 border-b border-slate-200">
                {/* Left: User Shop Logo & Details */}
                <div className="max-w-[40%]">
                    <div className="flex items-center gap-2.5 mb-2">
                        {sellerLogo ? (
                            <img src={sellerLogo} alt={sellerName} className="w-11 h-11 rounded-lg object-contain border border-slate-200 shadow-2xs" />
                        ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#024282] flex items-center justify-center text-white font-black text-xl shadow-xs">
                                {sellerName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <span className="text-xl font-black tracking-tight text-slate-900 leading-tight block">{sellerName}</span>
                        </div>
                    </div>
                    <div className="text-slate-600 space-y-0.5 text-[10px]">
                        {sellerAddress && (
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <MapPin className="w-3 h-3 text-sky-500" />
                                <span>{sellerAddress}</span>
                            </div>
                        )}
                        {sellerPhone && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{sellerPhone}</span>
                            </div>
                        )}
                        {sellerEmail && (
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{sellerEmail}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Kuwait Skyline & Title */}
                <div className="text-right">
                    <KuwaitSkyline className="w-48 h-16 text-sky-400 opacity-80 ml-auto" />
                    <div className="mt-1">
                        <span className="text-[10px] font-bold text-[#024282] font-arabic block dir-rtl">فاتورة ضريبية</span>
                        <h1 className="text-2xl font-black text-[#024282] uppercase tracking-wide leading-none">INVOICE</h1>
                    </div>
                </div>
            </div>

            {/* ═══════ 4 METADATA CARDS ═══════ */}
            <div className="grid grid-cols-4 gap-2.5 my-4">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Invoice No. / رقم الفاتورة</span>
                        <span className="font-black text-xs text-slate-900 font-mono">#INV-{String(invoice.invoice_number || '1').padStart(6, '0')}</span>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Date / التاريخ</span>
                        <span className="font-bold text-xs text-slate-900">{dateStr}</span>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Time / الوقت</span>
                        <span className="font-bold text-xs text-slate-900">{timeStr}</span>
                    </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Payment Method / طريقة الدفع</span>
                        <span className="font-black text-xs text-slate-900">{paymentMethod}</span>
                        {financeCompany && <span className="text-[8px] font-bold text-violet-700 block truncate">{financeCompany}</span>}
                    </div>
                </div>
            </div>

            {/* ═══════ BILL TO CARD (FULL WIDTH) ═══════ */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Bill To / العميل (Buyer Details)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-black text-xs text-slate-900">{customerName}</p>
                        <div className="mt-1 space-y-0.5 text-slate-600 text-[10px]">
                            {customerPhone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400" /> {customerPhone}</p>}
                            {customerEmail && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400" /> {customerEmail}</p>}
                        </div>
                    </div>
                    <div className="text-slate-600 text-[10px] space-y-0.5 border-l border-slate-200/80 pl-4">
                        {customerAddress && <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" /> <span>{customerAddress}</span></p>}
                        {invoice.customer_civil_id && <p className="font-mono"><span className="text-slate-400">Civil ID:</span> <span className="font-bold text-slate-800">{invoice.customer_civil_id}</span></p>}
                    </div>
                </div>
            </div>

            {/* ═══════ ITEMS TABLE (6 COLUMNS) ═══════ */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4 shadow-2xs">
                <table className="w-full border-collapse text-[10px]">
                    <thead className="bg-[#024282] text-white font-bold text-[9px] tracking-wider">
                        <tr className="border-b border-[#1a5b9e]">
                            <th className="py-2.5 px-2 text-center w-8 border-r border-[#1a5b9e]">#</th>
                            <th className="py-2.5 px-3 text-left border-r border-[#1a5b9e]">
                                Item Description / <span className="font-arabic font-normal">وصف الصنف</span>
                            </th>
                            <th className="py-2.5 px-2 text-center w-16 border-r border-[#1a5b9e]">
                                Qty / <span className="font-arabic font-normal">الكمية</span>
                            </th>
                            <th className="py-2.5 px-3 text-right w-24 border-r border-[#1a5b9e]">
                                Unit Price / <span className="font-arabic font-normal">سعر الوحدة</span>
                            </th>
                            <th className="py-2.5 px-3 text-right w-20 border-r border-[#1a5b9e]">
                                Discount / <span className="font-arabic font-normal">الخصم</span>
                            </th>
                            <th className="py-2.5 px-3 text-right w-28">
                                Amount / <span className="font-arabic font-normal">المبلغ</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                        {items.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                                <td className="py-2.5 px-2 text-center font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                <td className="py-2.5 px-3 border-r border-slate-100">
                                    <p className="font-bold text-slate-900">{item.item_name}</p>
                                    {item.item_description && <p className="text-[9px] text-slate-400 mt-0.5">{item.item_description}</p>}
                                </td>
                                <td className="py-2.5 px-2 text-center font-medium border-r border-slate-100">{item.quantity}</td>
                                <td className="py-2.5 px-3 text-right font-medium border-r border-slate-100">{fmt(item.unit_price)}</td>
                                <td className="py-2.5 px-3 text-right font-medium text-slate-500 border-r border-slate-100">{fmt(item.discount || 0)}</td>
                                <td className="py-2.5 px-3 text-right font-black text-slate-900">{fmt(item.line_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* ── Connected Totals & Summary Bar ── */}
                <div className="border-t border-slate-200 grid grid-cols-12 bg-slate-50/80">
                    {/* Left: Payment Status & Amount in Words (7 cols) */}
                    <div className="col-span-7 p-3 border-r border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className={`w-4 h-4 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                                <div>
                                    <span className="text-[8.5px] text-slate-400 font-bold block">Payment Status / حالة الدفع</span>
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {isPaid ? 'PAID' : 'PARTIAL'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right text-[9px] text-slate-600">
                                <p>{currency} {fmt(totals.paid_amount)} paid on {dateStr}</p>
                                <p className="font-arabic text-slate-400 text-[8px] dir-rtl">تم استلام المبلغ بتاريخ {dateStr}</p>
                            </div>
                        </div>

                        <div className="pt-1.5 border-t border-slate-200/60">
                            <span className="text-[8.5px] text-slate-400 font-bold block">Amount in Words / المبلغ كتابة</span>
                            <p className="font-black text-xs text-slate-900 mt-0.5">{totals.amount_in_words}</p>
                        </div>
                    </div>

                    {/* Right: Subtotal & Total (5 cols) */}
                    <div className="col-span-5 flex flex-col justify-between text-[11px]">
                        <div className="p-3 space-y-1 text-slate-600 font-medium border-b border-slate-200">
                            <div className="flex justify-between">
                                <span>Subtotal / المجموع الفرعي</span>
                                <span className="font-bold text-slate-900">{currency} {fmt(totals.gross_subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total / الإجمالي</span>
                                <span className="font-bold text-slate-900">{currency} {fmt(totals.grand_total)}</span>
                            </div>
                        </div>

                        <div className="bg-[#024282] text-white p-2.5 flex justify-between items-center shadow-xs">
                            <span className="font-black uppercase tracking-wider text-xs">Paid Amount / المبلغ المدفوع</span>
                            <span className="font-black text-sm">{currency} {fmt(totals.paid_amount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ 3 CARDS ROW (BANK DETAILS, SCAN TO PAY, TAX/CR) ═══════ */}
            <div className="grid grid-cols-12 gap-3 mb-4 text-[10px]">
                {/* Bank Details */}
                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>Bank Details / تفاصيل البنك</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        <p><span className="text-slate-400">Bank Name / اسم البنك :</span> <span className="font-bold text-slate-800">{bank.bank_name || 'Kuwait Finance House'}</span></p>
                        <p><span className="text-slate-400">A/C No. / رقم الحساب :</span> <span className="font-mono font-bold text-slate-800">{bank.account_number || '1234 5678 9012'}</span></p>
                        <p><span className="text-slate-400">Branch & IFSC / الفرع ورمز التحويل :</span> <span className="font-mono font-bold text-slate-800">{bank.iban_ifsc || 'Salmiya Branch / KFHKWKWXXX'}</span></p>
                    </div>
                </div>

                {/* Scan to Pay */}
                <div className="col-span-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="font-black text-[#024282] uppercase text-[9px] tracking-wider mb-1">Scan to Pay / امسح للدفع</span>
                    <QRCodeImage
                        text={qrData}
                        alt="Scan to Pay QR"
                        containerClassName="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs mb-1 flex items-center justify-center"
                        unavailableText="QR Unavailable"
                        unavailableSubtext="No Payment Link"
                    />
                    <span className="text-[7.5px] text-slate-400">Pay securely with</span>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span className="px-1 py-0.2 bg-blue-700 text-white rounded text-[7px] font-black">KNET</span>
                        <span className="px-1 py-0.2 bg-slate-900 text-white rounded text-[7px] font-black">VISA</span>
                        <span className="px-1 py-0.2 bg-red-600 text-white rounded text-[7px] font-black">MC</span>
                    </div>
                </div>

                {/* Tax / CR Details */}
                <div className="col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-3 text-[10px]">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Tax / Commercial Registration Details</span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Commercial Registration No.</span>
                            <span className="font-bold text-slate-800 font-mono">{crNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Tax Registration No. (CR)</span>
                            <span className="font-bold text-slate-800 font-mono">{crNo}</span>
                        </div>
                        <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center gap-1 text-slate-500 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-sky-500" />
                            <span>VAT: Not Applicable / الضريبة: غير مطبقة</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ NOTES & DECLARATION ═══════ */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-[10px]">
                <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                    <p className="font-black text-[#024282] uppercase text-[9px] mb-1">Notes / ملاحظات</p>
                    <ul className="text-slate-600 space-y-0.5 text-[9px]">
                        {invoiceNotes
                            ? <li>{invoiceNotes}</li>
                            : <>
                                <li>• Thank you for your business!</li>
                                <li>• If you have any questions about this invoice, please contact us.</li>
                              </>
                        }
                    </ul>
                    <p className="text-slate-400 font-arabic text-[8.5px] mt-1 dir-rtl text-right">شكراً لثقتكم بنا! في حال وجود أي استفسارات حول الفاتورة، يرجى التواصل معنا.</p>
                </div>

                <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                    <p className="font-black text-[#024282] uppercase text-[9px] mb-1">Declaration / إقرار</p>
                    <p className="text-slate-600 text-[9px] leading-relaxed">
                        {invoiceDeclaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                    </p>
                    <p className="text-slate-400 font-arabic text-[8.5px] mt-1 dir-rtl text-right">
                        نقر بأن هذه الفاتورة توضح السعر الفعلي للبضائع الموضحة وأن جميع البيانات صحيحة ودقيقة.
                    </p>
                </div>
            </div>

            {/* ═══════ SIGNATURES ═══════ */}
            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-200 text-[10px]">
                <div>
                    <p className="font-bold text-slate-700">Customer's Signature / <span className="font-arabic font-normal">توقيع العميل</span></p>
                    <div className="w-48 border-b border-dashed border-slate-300 mt-16"></div>
                    <p className="text-[8.5px] text-slate-400 mt-1">Seal &amp; Signature / <span className="font-arabic">الختم والتوقيع</span></p>
                </div>

                <div className="text-right">
                    <p className="font-bold text-slate-700">Authorised Signatory / <span className="font-arabic font-normal">المفوض بالتوقيع</span></p>
                    <p className="text-[9px] text-slate-400 mt-0.5">For {sellerName}</p>
                    <div className="w-48 border-b border-dashed border-slate-300 mt-16 ml-auto"></div>
                    <p className="text-[8.5px] text-slate-400 mt-1">Official Stamp / <span className="font-arabic">الختم الرسمي</span></p>
                </div>
            </div>

            {/* ═══════ FOOTER BAR ═══════ */}
            <div className="mt-6 bg-[#024282] text-white rounded-lg p-2 flex justify-between items-center text-[9px] font-bold">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-sky-500 flex items-center justify-center text-white font-black text-[9px]">H</div>
                    <span className="font-black">Hisabi</span>
                </div>
                <div>
                    Powering Small & Medium Businesses Across Kuwait | <span className="font-arabic font-normal">تمكين المشاريع الصغيرة والمتوسطة في الكويت</span>
                </div>
                <div>
                    www.hisabi.com
                </div>
            </div>
        </div>
    );
};

export default KuwaitInvoiceLayout;

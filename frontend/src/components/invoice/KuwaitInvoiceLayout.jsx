import React from 'react';
import {
    FileText, Calendar, Clock, CreditCard, User,
    CheckCircle2, Building, ShieldCheck, Phone, Mail, Globe, MapPin, PenLine
} from 'lucide-react';
import { KuwaitSkyline } from './KuwaitSkyline';
import QRCodeImage from './QRCodeImage';

const KuwaitInvoiceLayout = ({ invoice, shop, calculation }) => {
    const { items, totals, meta } = calculation;
    const currency = meta.currency || 'KWD';
    const decimals = meta.currency_decimals !== undefined ? meta.currency_decimals : (currency === 'KWD' ? 3 : 2);

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
    const sellerWebsite = shop?.website || '';
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
    const invoiceNotes = invoice.notes || shop?.invoice_notes || '';
    const invoiceDeclaration = invoice.declaration || shop?.invoice_declaration || '';

    return (
        <div className="w-[210mm] max-w-[210mm] min-h-[297mm] mx-auto bg-white p-8 box-border text-slate-900 font-sans shadow-lg print:shadow-none print:m-0 print:p-6 print:w-full print:max-w-none text-[11px] leading-tight">

            {/* ═══════ HEADER ═══════ */}
            <div className="flex justify-between items-start pb-5 border-b border-slate-200">
                {/* Left: Store Logo & Details */}
                <div className="flex items-start gap-4 max-w-[50%]">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            {sellerLogo ? (
                                <img src={sellerLogo} alt={sellerName} className="w-12 h-12 rounded-xl object-contain border border-slate-200 shadow-2xs" />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-[#024282] flex items-center justify-center text-white font-black text-2xl shadow-xs">
                                    {sellerName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-2xl font-black tracking-tight text-slate-900 leading-tight block">{sellerName}</span>
                        </div>

                        <div className="text-slate-600 space-y-1 text-[10px] pl-0.5">
                            {sellerAddress && (
                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <MapPin className="w-3.5 h-3.5 text-[#024282] shrink-0" />
                                    <span>{sellerAddress}</span>
                                </div>
                            )}
                            {sellerPhone && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-[#024282] shrink-0" />
                                    <span>{sellerPhone}</span>
                                </div>
                            )}
                            {sellerEmail && (
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3.5 h-3.5 text-[#024282] shrink-0" />
                                    <span>{sellerEmail}</span>
                                </div>
                            )}
                            {sellerWebsite && (
                                <div className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-[#024282] shrink-0" />
                                    <span>{sellerWebsite}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Vertical separator */}
                    <div className="h-24 w-px bg-slate-200 ml-2"></div>
                </div>

                {/* Right: Kuwait Skyline & Title */}
                <div className="flex flex-col items-end">
                    <KuwaitSkyline className="w-56 h-18 text-sky-400 opacity-80" />
                    <div className="text-right mt-1">
                        <span className="text-[11px] font-bold text-[#024282] block" dir="rtl">فاتورة ضريبية</span>
                        <h1 className="text-2xl font-black text-[#024282] uppercase tracking-wide leading-none">TAX INVOICE</h1>
                        <span className="text-[9px] text-slate-500 font-medium block mt-0.5">Simpler. Smarter. Together.</span>
                    </div>
                </div>
            </div>

            {/* ═══════ 4 METADATA CARDS ═══════ */}
            <div className="grid grid-cols-4 gap-2.5 my-3">
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Invoice No. / <span dir="rtl">رقم الفاتورة</span></span>
                        <span className="font-black text-xs text-slate-900 font-mono">#INV-{String(invoice.invoice_number || '1').padStart(6, '0')}</span>
                    </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Date / <span dir="rtl">التاريخ</span></span>
                        <span className="font-bold text-xs text-slate-900">{dateStr}</span>
                    </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Time / <span dir="rtl">الوقت</span></span>
                        <span className="font-bold text-xs text-slate-900">{timeStr}</span>
                    </div>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center shrink-0">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                        <span className="text-[8.5px] text-slate-400 block font-bold">Payment Method / <span dir="rtl">طريقة الدفع</span></span>
                        <span className="font-black text-xs text-slate-900">{paymentMethod}</span>
                        {financeCompany && <span className="text-[8px] font-bold text-violet-700 block truncate">{financeCompany}</span>}
                    </div>
                </div>
            </div>

            {/* ═══════ BILL TO CARD ═══════ */}
            <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-1.5 text-[#024282] font-black text-[10px] uppercase tracking-wider mb-2">
                    <div className="w-5 h-5 rounded-full bg-[#024282] text-white flex items-center justify-center shrink-0">
                        <User className="w-3 h-3" />
                    </div>
                    <span>Bill To / <span dir="rtl" className="font-normal font-arabic">العميل</span></span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="font-black text-xs text-slate-900">{customerName}</p>
                        <div className="mt-1 space-y-0.5 text-slate-600 text-[10px]">
                            {customerPhone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-[#024282]" /> {customerPhone}</p>}
                            {customerEmail && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-[#024282]" /> {customerEmail}</p>}
                            {customerAddress && <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 text-[#024282] mt-0.5 shrink-0" /> <span>{customerAddress}</span></p>}
                        </div>
                    </div>
                    <div className="text-slate-600 text-[10px] space-y-0.5 border-l border-slate-200/80 pl-4 flex flex-col justify-center">
                        {invoice.customer_civil_id ? (
                            <p className="font-mono"><span className="text-slate-400">Civil ID / الرقم المدني:</span> <span className="font-bold text-slate-800">{invoice.customer_civil_id}</span></p>
                        ) : (
                            <div className="text-slate-400 text-[9px] italic">Commercial / Retail Customer</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════ ITEMS TABLE (6 COLUMNS) ═══════ */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-3 shadow-2xs">
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
            </div>

            {/* ═══════ PAYMENT STATUS (LEFT) & TOTALS (RIGHT) ═══════ */}
            <div className="grid grid-cols-12 gap-3 mb-3">
                {/* Left: Payment Status */}
                <div className="col-span-6 border border-slate-200/90 rounded-xl p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                            <span className="font-black text-[10px] text-slate-800">
                                Payment Status / <span dir="rtl" className="font-normal font-arabic">حالة الدفع</span>
                            </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isPaid ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                            {isPaid ? 'PAID' : 'PARTIAL'}
                        </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[9.5px]">
                        <p className="font-bold text-slate-800">
                            {currency} {fmt(totals.paid_amount)} paid on {dateStr}, {timeStr}
                        </p>
                        <p className="font-arabic text-slate-500 text-[8.5px] mt-0.5" dir="rtl">
                            تم استلام المبلغ بتاريخ {timeStr}, {dateStr}
                        </p>
                    </div>
                </div>

                {/* Right: Totals Card */}
                <div className="col-span-6 border border-slate-200/90 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col justify-between text-[10.5px]">
                    <div className="p-2.5 space-y-1.5 text-slate-600 font-medium">
                        <div className="flex justify-between items-center">
                            <span>Subtotal / <span dir="rtl" className="font-normal font-arabic">المجموع الفرعي</span></span>
                            <span className="font-bold text-slate-900">{currency} {fmt(totals.gross_subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Total / <span dir="rtl" className="font-normal font-arabic">الإجمالي</span></span>
                            <span className="font-bold text-slate-900">{currency} {fmt(totals.grand_total)}</span>
                        </div>
                    </div>

                    <div className="bg-[#024282] text-white p-2.5 flex justify-between items-center">
                        <span className="font-black uppercase tracking-wider text-xs">
                            Paid Amount / <span dir="rtl" className="font-normal font-arabic">المبلغ المدفوع</span>
                        </span>
                        <span className="font-black text-sm">{currency} {fmt(totals.paid_amount)}</span>
                    </div>
                </div>
            </div>

            {/* ═══════ AMOUNT IN WORDS (STANDALONE CARD) ═══════ */}
            <div className="border border-slate-200/90 rounded-xl p-3 mb-3 bg-slate-50/60 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#024282] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                </div>
                <div>
                    <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        Amount in Words
                    </span>
                    <p className="font-black text-xs text-slate-900 mt-0.5">{totals.amount_in_words}</p>
                    {totals.amount_in_words_arabic && (
                        <p className="font-arabic text-[10px] text-slate-600 mt-0.5" dir="rtl">{totals.amount_in_words_arabic}</p>
                    )}
                </div>
            </div>

            {/* ═══════ 3 CARDS ROW (BANK DETAILS | SCAN TO PAY | TAX / CR) ═══════ */}
            <div className="grid grid-cols-12 gap-3 mb-3 text-[10px]">
                {/* Bank Details */}
                <div className="col-span-5 bg-slate-50/80 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[#024282] font-black uppercase text-[10px] mb-2 border-b border-slate-200/60 pb-1">
                        <Building className="w-3.5 h-3.5" />
                        <span>Bank Details / <span dir="rtl" className="font-normal font-arabic">تفاصيل البنك</span></span>
                    </div>
                    <div className="space-y-1 text-slate-700">
                        <p><span className="text-slate-400">Bank Name / <span dir="rtl">اسم البنك</span>:</span> <span className="font-bold text-slate-800">{bank.bank_name || 'Kuwait Finance House'}</span></p>
                        <p><span className="text-slate-400">A/C No. / <span dir="rtl">رقم الحساب</span>:</span> <span className="font-mono font-bold text-slate-800">{bank.account_number || '1234 5678 9012'}</span></p>
                        <p><span className="text-slate-400">Branch & IFSC / <span dir="rtl">الفرع ورمز التحويل</span>:</span> <span className="font-mono font-bold text-slate-800">{bank.iban_ifsc || 'Salmiya Branch / KFHKWKWXXX'}</span></p>
                    </div>
                </div>

                {/* Scan to Pay */}
                <div className="col-span-3 bg-slate-50/80 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="font-black text-[#024282] uppercase text-[9px] tracking-wider mb-1">
                        Scan to Pay / <span dir="rtl" className="font-normal font-arabic">امسح للدفع</span>
                    </span>
                    <QRCodeImage
                        text={qrData}
                        alt="Scan to Pay QR"
                        containerClassName="w-16 h-16 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs mb-1 flex items-center justify-center"
                        unavailableText="QR Unavailable"
                        unavailableSubtext="No Payment Link"
                    />
                    <span className="text-[7.5px] text-slate-400">Pay securely with</span>
                    <div className="flex items-center gap-1.5 mt-1">
                        {/* K-Net Badge */}
                        <div className="px-1.5 py-0.5 bg-[#005ba4] text-white rounded font-black text-[7px] tracking-tight">
                            KNET
                        </div>
                        {/* VISA Badge */}
                        <div className="px-1.5 py-0.5 bg-[#1a1f71] text-white rounded font-black text-[7px] tracking-tight italic">
                            VISA
                        </div>
                        {/* Mastercard Badge */}
                        <div className="flex items-center -space-x-1">
                            <div className="w-3 h-3 rounded-full bg-[#eb001b]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#f79e1b] opacity-90"></div>
                        </div>
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
                            <div>
                                <span className="text-slate-400 block text-[9px]">Commercial Registration No.</span>
                                <span className="text-slate-400 block text-[7.5px]" dir="rtl">الرقم التجاري</span>
                            </div>
                            <span className="font-bold text-slate-800 font-mono text-[10px]">{crNo}</span>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <span className="text-slate-400 block text-[9px]">Tax Registration No. (CR)</span>
                                <span className="text-slate-400 block text-[7.5px]" dir="rtl">الرقم الضريبي</span>
                            </div>
                            <span className="font-bold text-slate-800 font-mono text-[10px]">{crNo}</span>
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 bg-sky-50/80 border border-sky-100 rounded-lg p-1.5 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <div>
                                <span className="font-bold text-[9px] text-sky-900 block leading-tight">VAT: Not Applicable</span>
                                <span className="font-arabic text-[8px] text-sky-700 block leading-tight" dir="rtl">الضريبة: غير مطبقة</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════ NOTES & DECLARATION ═══════ */}
            <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
                <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                    <p className="font-black text-[#024282] uppercase text-[9px] mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>Notes / <span dir="rtl" className="font-normal font-arabic">ملاحظات</span></span>
                    </p>
                    <ul className="text-slate-600 space-y-0.5 text-[9px]">
                        {invoiceNotes ? (
                            <li>• {invoiceNotes}</li>
                        ) : (
                            <>
                                <li>• Thank you for your business!</li>
                                <li>• If you have any questions about this invoice, please contact us.</li>
                            </>
                        )}
                    </ul>
                    <p className="text-slate-400 font-arabic text-[8.5px] mt-1 dir-rtl text-right">
                        • شكراً لثقتكم بنا! في حال وجود أي استفسارات حول الفاتورة، يرجى التواصل معنا.
                    </p>
                </div>

                <div className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                    <p className="font-black text-[#024282] uppercase text-[9px] mb-1 flex items-center gap-1">
                        <PenLine className="w-3 h-3" />
                        <span>Declaration / <span dir="rtl" className="font-normal font-arabic">إقرار</span></span>
                    </p>
                    <p className="text-slate-600 text-[9px] leading-relaxed">
                        {invoiceDeclaration || 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.'}
                    </p>
                    <p className="text-slate-400 font-arabic text-[8.5px] mt-1 dir-rtl text-right">
                        نقر بأن هذه الفاتورة توضح السعر الفعلي للبضائع الموصوفة وأن جميع البيانات صحيحة ودقيقة.
                    </p>
                </div>
            </div>

            {/* ═══════ SIGNATURES ═══════ */}
            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-200 text-[10px] mb-3">
                <div>
                    <p className="font-bold text-slate-700">Customer's Signature / <span className="font-arabic font-normal">توقيع العميل</span></p>
                    <div className="w-48 border-b border-dashed border-slate-300 mt-8"></div>
                    <p className="text-[8.5px] text-slate-400 mt-1">Seal &amp; Signature / <span className="font-arabic">الختم والتوقيع</span></p>
                </div>

                <div className="text-right">
                    <p className="font-bold text-slate-700">Authorised Signatory / <span className="font-arabic font-normal">المفوض بالتوقيع</span></p>
                    <p className="text-[9px] text-slate-400 mt-0.5">For {sellerName}</p>
                    <div className="w-48 border-b border-dashed border-slate-300 mt-8 ml-auto"></div>
                    <p className="text-[8.5px] text-slate-400 mt-1">Official Stamp / <span className="font-arabic">الختم الرسمي</span></p>
                </div>
            </div>

            {/* ═══════ FOOTER BAR ═══════ */}
            <div className="bg-[#024282] text-white rounded-lg p-2.5 flex justify-between items-center text-[9px] font-bold">
                <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-sky-500 flex items-center justify-center text-white font-black text-[9px]">H</div>
                    <span className="font-black text-xs">Hisabi</span>
                </div>
                <div>
                    Powering Small & Medium Businesses Across Kuwait | <span className="font-arabic font-normal">تمكين المشاريع الصغيرة والمتوسطة في الكويت</span>
                </div>
                <div className="font-medium text-white/90">
                    www.hisabi.com
                </div>
            </div>
        </div>
    );
};

export default KuwaitInvoiceLayout;

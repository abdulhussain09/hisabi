import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatCurrency } from '../utils/currencyUtils';
import {
    Printer, Download, Search, FileText, User,
    ChevronLeft, ChevronRight, CheckCircle2, Trash2,
    Circle, AlertCircle, ChevronDown, ChevronUp, Tag,
    Clock, Crown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import PricingModal from '../components/PricingModal';

const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    if (status === 'paid')
        return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-emerald-100"><CheckCircle2 className="w-3 h-3" />{t('invoices.status.paid')}</span>;
    if (status === 'partial')
        return <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-amber-100"><AlertCircle className="w-3 h-3" />{t('invoices.status.partial')}</span>;
    return <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 border border-slate-100"><Circle className="w-3 h-3" />{t('invoices.status.void')}</span>;
};

const InvoiceRow = ({ inv, user, onDelete, onDownload, currency }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const fmtTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <tr className={`group hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`}>
                <td className="w-10 pl-4 py-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-1 rounded-lg transition-all ${isExpanded ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                    >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </td>
                <td>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-indigo-100">
                            <FileText className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-900 leading-none">{t('invoices.number')}{String(inv.invoice_number).padStart(5, '0')}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('invoices.type_sale')}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                            {inv.customer_name || t('pos.customer_name_default')}
                        </span>
                    </div>
                </td>
                <td>
                    <p className="text-sm text-slate-800 font-bold">{fmt(inv.date)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tabular-nums">{fmtTime(inv.date)}</p>
                </td>
                <td className="text-right">
                    <p className="text-sm font-black text-slate-900 tabular-nums">
                        {formatCurrency(inv.grand_total, currency, true)}
                    </p>
                    {parseFloat(inv.due_amount) > 0 ? (
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter">
                            {t('invoices.due_label')} {formatCurrency(inv.due_amount, currency, true)}
                        </p>
                    ) : (
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">{t('invoices.fully_paid')}</p>
                    )}
                </td>
                <td>
                    <div className="flex justify-center">
                        <StatusBadge status={inv.status} />
                    </div>
                </td>
                <td className="pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => onDownload(inv.id, inv.invoice_number)}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all shadow-sm"
                            title="Download PDF"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        {user?.role === 'admin' && (
                            <button
                                onClick={() => onDelete(inv.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:shadow-sm transition-all shadow-sm"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-slate-50/50 border-b border-slate-100">
                    <td colSpan={7} className="p-0">
                        <div className="px-14 py-6 animate-in slide-in-from-top-2 duration-300 space-y-4">
                            {/* Professional Details Expansion */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('pos.customer_details')}</p>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-bold text-slate-900">{inv.customer_name || t('pos.customer_name_default')}</p>
                                        {inv.customer_phone && <p className="text-xs text-slate-500 font-medium">Ph: {inv.customer_phone}</p>}
                                        {inv.customer_email && <p className="text-xs text-slate-500 font-medium">Em: {inv.customer_email}</p>}
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('pos.payment_info')}</p>
                                    <div className="flex flex-col gap-1 items-end">
                                        <p className="text-sm font-bold text-slate-900">{(inv.payment_method || 'Cash').toUpperCase()}</p>
                                        <p className="text-xs text-slate-500 font-medium">{fmt(inv.date)} at {fmtTime(inv.date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Highlight */}
                            <div className="text-center py-2 px-4 bg-slate-50 border border-slate-100 rounded-xl">
                                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                                    {formatCurrency(inv.paid_amount, currency, true)} paid on {fmt(inv.date)}, {fmtTime(inv.date)}
                                </p>
                            </div>

                            {/* Items Table */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('invoices.items_list')}</th>
                                            <th className="px-6 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.qty')}</th>
                                            <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.price')}</th>
                                            {user?.shop?.country === 'IN' && (
                                                <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.mrp')}</th>
                                            )}
                                            <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(inv.items || []).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-900">{item.Product?.name || 'Deleted Product'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs font-black text-slate-700 tabular-nums">{item.quantity}</td>
                                                <td className="px-6 py-4 text-right text-xs font-black text-slate-700 tabular-nums">{formatCurrency(item.unit_price, currency, true)}</td>
                                                {user?.shop?.country === 'IN' && (
                                                    <td className="px-6 py-4 text-right text-xs font-black text-slate-400 tabular-nums line-through decoration-red-400/30">
                                                        {item.mrp && parseFloat(item.mrp) > 0 ? formatCurrency(item.mrp, currency, true) : '—'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-right text-xs font-black text-slate-900 tabular-nums">
                                                    {formatCurrency(item.quantity * item.unit_price, currency, true)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/50">
                                        <tr>
                                            <td colSpan={user?.shop?.country === 'IN' ? 4 : 3} className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.subtotal')}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 tabular-nums">{formatCurrency(inv.subtotal, currency, true)}</td>
                                        </tr>
                                        {parseFloat(inv.tax_total) > 0 && (
                                            <tr>
                                                <td colSpan={user?.shop?.country === 'IN' ? 4 : 3} className="px-6 py-4 text-right text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">{user?.shop?.country === 'IN' ? 'GST' : (user?.shop?.country === 'AE' ? 'VAT (5%)' : 'Tax')}</td>
                                                <td className="px-6 py-4 text-right text-sm font-black text-blue-600 tabular-nums">+{formatCurrency(inv.tax_total, currency, true)}</td>
                                            </tr>
                                        )}
                                        {parseFloat(inv.discount) > 0 && (
                                            <tr>
                                                <td colSpan={user?.shop?.country === 'IN' ? 4 : 3} className="px-6 py-4 text-right text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{t('common.discount')}</td>
                                                <td className="px-6 py-4 text-right text-sm font-black text-emerald-600 tabular-nums">-{formatCurrency(inv.discount, currency, true)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-slate-900 text-white">
                                            <td colSpan={user?.shop?.country === 'IN' ? 4 : 3} className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('common.grand_total')}</td>
                                            <td className="px-6 py-4 text-right text-lg font-black tabular-nums">{formatCurrency(inv.grand_total, currency, true)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

const Invoices = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const currentPlan = user?.shop?.plan || 'free';
    const isPremium = currentPlan === 'premium';
    const currency = user?.shop?.currency || 'AED';

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/invoices?page=${page}&limit=12`);
            setInvoices(res.data.data);
            const total = res.data.meta.total;
            const limit = res.data.meta.limit;
            setTotalPages(Math.ceil(total / limit));
            setTotalCount(total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInvoices(); }, [page]);

    const handleDelete = async (id) => {
        if (!window.confirm(t('invoices.delete_confirm'))) return;
        try {
            await api.delete(`/invoices/${id}`);
            fetchInvoices();
        } catch (err) {
            alert(err.response?.data?.error || t('invoices.errors.delete_failed'));
        }
    };

    const handleDownload = async (id, num) => {
        try {
            const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${num}.pdf`;
            a.click();
        } catch { alert(t('invoices.errors.download_failed')); }
    };

    const filtered = invoices.filter(inv =>
        !searchTerm || String(inv.invoice_number).includes(searchTerm) || (inv.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 lg:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-slate-900/10">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('invoices.title')}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalCount} {t('invoices.total_records')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] text-sm font-bold text-slate-900 outline-none focus:border-blue-400 shadow-sm transition-all placeholder:text-slate-300"
                        placeholder={t('invoices.search_placeholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* ── History Retention Warning (Non-Premium) ── */}
            {!isPremium && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <h4 className="text-base font-black text-slate-900 leading-tight">6-Month History Retention</h4>
                            <p className="text-sm text-slate-500 font-bold mt-0.5">Your current plan limits invoice history to the last 6 months. Upgrade to Premium for life-time storage.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="btn-primary whitespace-nowrap bg-slate-900 hover:bg-slate-800"
                    >
                        <Crown className="w-4 h-4" /> Upgrade to Premium
                    </button>
                </div>
            )}

            {/* Main Table Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="w-14"></th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Totals</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-5 text-right pr-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(6).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="h-3 w-1/4 bg-slate-100 rounded" />
                                                    <div className="h-2 w-1/6 bg-slate-50 rounded" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20">
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                                                <FileText className="w-10 h-10 text-slate-200" />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900">{t('invoices.empty')}</h3>
                                            <p className="text-sm font-bold text-slate-400 mt-1">{t('invoices.empty_sub')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((inv) => (
                                    <InvoiceRow
                                        key={inv.id}
                                        inv={inv}
                                        user={user}
                                        onDelete={handleDelete}
                                        onDownload={handleDownload}
                                        currency={currency}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-8 bg-slate-50/50 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {t('common.page')} <span className="text-slate-900">{page}</span> {t('common.of')} <span className="text-slate-900">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => p - 1)}
                                disabled={page === 1}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-1.5 px-2">
                                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-xl rotate-3' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page === totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <PricingModal
                isOpen={isPricingModalOpen}
                onClose={() => setIsPricingModalOpen(false)}
            />
        </div>
    );
};

export default Invoices;

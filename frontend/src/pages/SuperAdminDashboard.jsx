import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Megaphone as AnnouncementIcon, Ticket, LogOut, Plus, Trash2, Edit2,
    CheckCircle2, XCircle, Layout, Chrome, BarChart2, DollarSign,
    Save, X, Image as ImageIcon, Link as LinkIcon, Calendar,
    Users, Activity, Store, AlertCircle, Info, Menu, ChevronDown, ChevronUp
} from 'lucide-react';
import api, { IMAGE_BASE_URL } from '../api/axios';

const AD_TEMPLATES = [
    {
        id: 'promo_50_off',
        title: '50% OFF Subscription',
        image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
        link_url: '/subscription',
        description: 'Perfect for attracting new users with a heavy discount.'
    },
    {
        id: 'gold_upgrade',
        title: 'Upgrade to Gold Plan',
        image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80',
        link_url: '/subscription',
        description: 'Promote the middle-tier plan features.'
    },
    {
        id: 'premium_access',
        title: 'Get Premium Access',
        image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=800&q=80',
        link_url: '/subscription',
        description: 'Showcase the best features for serious businesses.'
    }
];

const SuperAdminDashboard = () => {
    const [view, setView] = useState('analytics'); // analytics, shops, ads, discounts, announcements, logs
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const navigate = useNavigate();

    // Data States
    const [analytics, setAnalytics] = useState({ shops: { total: 0, active: 0 }, usage: { invoices: 0, products: 0 }, revenue: 0 });
    const [historicalAnalytics, setHistoricalAnalytics] = useState({ shops: [], invoices: [] });
    const [shops, setShops] = useState([]);
    const [ads, setAds] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [logs, setLogs] = useState([]);
    const [expandedLogs, setExpandedLogs] = useState({});

    // Form States
    // Form States
    const [adForm, setAdForm] = useState({ title: '', image_url: '', link_url: '', placement: 'dashboard_banner', active: true, type: 'manual', template_id: '' });
    const [adFile, setAdFile] = useState(null);
    const [adPreview, setAdPreview] = useState(null);
    const [discountForm, setDiscountForm] = useState({ code: '', type: 'percent', value: 0, expires_at: '', max_uses: '', active: true });
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '', cta_link: '', cta_text: '', type: 'info', active: true, expires_at: '' });
    const [logFilter, setLogFilter] = useState('ALL');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('superAdminToken');
        if (!token) { navigate('/super-admin-login'); return; }
        fetchData();
        setupInactivityTimer();
    }, [view]);

    // Session Inactivity Timer
    const setupInactivityTimer = () => {
        let timer;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            // 15 minutes = 15 * 60 * 1000 ms
            timer = setTimeout(() => {
                handleLogout();
            }, 15 * 60 * 1000);
        };

        const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => window.addEventListener(evt, resetTimer));

        resetTimer(); // Initialize timer

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach(evt => window.removeEventListener(evt, resetTimer));
        };
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (view === 'analytics') {
                const [res, hRes] = await Promise.all([
                    api.get('/super-admin/analytics'),
                    api.get('/super-admin/analytics/historical')
                ]);
                setAnalytics(res.data);
                setHistoricalAnalytics(hRes.data);
            } else if (view === 'shops') {
                const res = await api.get('/super-admin/shops');
                setShops(res.data);
            } else if (view === 'ads') {
                const res = await api.get('/super-admin/ads');
                setAds(res.data);
            } else if (view === 'discounts') {
                const res = await api.get('/super-admin/discounts');
                setDiscounts(res.data);
            } else if (view === 'announcements') {
                const res = await api.get('/super-admin/announcements');
                setAnnouncements(res.data);
            } else if (view === 'logs') {
                const res = await api.get('/super-admin/logs');
                setLogs(res.data);
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem('superAdminToken');
                navigate('/super-admin-login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('superAdminToken');
        navigate('/super-admin-login');
    };

    // Generic Submit Handler (for Ads, Discounts, Announcements)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let data;
            
            if (view === 'ads') {
                endpoint = '/super-admin/ads';
                data = new FormData();
                Object.keys(adForm).forEach(key => data.append(key, adForm[key]));
                if (adFile) data.append('image', adFile);
            } else if (view === 'discounts') {
                endpoint = '/super-admin/discounts';
                data = discountForm;
            } else if (view === 'announcements') {
                endpoint = '/super-admin/announcements';
                data = announcementForm;
            }

            if (editItem) {
                await api.put(`${endpoint}/${editItem.id}`, data);
            } else {
                await api.post(endpoint, data);
            }
            setIsModalOpen(false);
            setEditItem(null);
            setAdFile(null);
            setAdPreview(null);
            fetchData();
        } catch (err) { 
            console.error('Submit error:', err);
            alert('Failed to save data: ' + (err.response?.data?.error || err.message)); 
        }
    };

    const handleAdFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAdFile(file);
            setAdPreview(URL.createObjectURL(file));
        }
    };

    const getImageUrl = (url) => {
        if (!url) return '';
        if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://'))) {
            return url;
        }
        return `${IMAGE_BASE_URL}${url}`;
    };

    const handleToggleShop = async (shopId, active, plan) => {
        try {
            await api.put(`/super-admin/shops/${shopId}`, { active, plan });
            fetchData();
        } catch (err) { alert('Failed to update shop'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            let endpoint = '';
            if (view === 'ads') endpoint = `/super-admin/ads/${id}`;
            else if (view === 'discounts') endpoint = `/super-admin/discounts/${id}`;
            else if (view === 'announcements') endpoint = `/super-admin/announcements/${id}`;
            await api.delete(endpoint);
            fetchData();
        } catch (err) { alert('Delete failed'); }
    };

    const renderAnalytics = () => (
        <div className="space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {[
                    { label: 'Total Revenue', value: `${analytics.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Platform Shops', value: analytics.shops.total, sub: `${analytics.shops.active} active`, icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Invoices', value: analytics.usage.invoices, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Product Catalog', value: analytics.usage.products, icon: Layout, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                                <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                            </div>
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
                        <p className="text-2xl lg:text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
                        {stat.sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{stat.sub}</p>}
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h3 className="text-lg font-black text-slate-900 mb-2">Platform Growth</h3>
                <p className="text-sm font-bold text-slate-500 mb-6">Daily shop registrations over the last 30 days.</p>
                <div className="h-64 flex items-end justify-between gap-1 group/chart">
                    {historicalAnalytics.shops.length > 0 ? (
                        historicalAnalytics.shops.map((data, i) => {
                            const maxCount = Math.max(...historicalAnalytics.shops.map(s => parseInt(s.count)), 1);
                            const height = (parseInt(data.count) / maxCount) * 100;
                            return (
                                <div key={i} className="flex-1 bg-slate-50/50 rounded-t-lg relative group transition-all hover:bg-slate-100">
                                    <div
                                        style={{ height: `${height}%` }}
                                        className="absolute bottom-0 w-full bg-blue-600/20 group-hover:bg-blue-600 rounded-t-lg transition-all duration-500"
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {data.count} Shops ({new Date(data.date).toLocaleDateString()})
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No growth data available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderShops = () => (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Shop Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Contact</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Stats</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {shops.map(shop => (
                        <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                                <p className="font-black text-slate-900">{shop.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold">ID: {shop.id.slice(0, 8)}</p>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-xs font-bold text-slate-600">{shop.email || 'No email'}</p>
                                <p className="text-[10px] text-slate-400">{shop.phone || 'No phone'}</p>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-3">
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-900">{shop.productCount || 0}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Products</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs font-black text-slate-900">{shop.invoiceCount || 0}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Invoices</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <select
                                    value={shop.plan}
                                    onChange={(e) => handleToggleShop(shop.id, shop.active, e.target.value)}
                                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none
                                        ${shop.plan === 'gold' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                            shop.plan === 'premium' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                'bg-slate-50 text-slate-600 border-slate-200'}
                                    `}
                                >
                                    <option value="free">FREE</option>
                                    <option value="gold">GOLD</option>
                                    <option value="premium">PREMIUM</option>
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <button
                                    onClick={() => handleToggleShop(shop.id, !shop.active, shop.plan)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all
                                        ${shop.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}
                                    `}
                                >
                                    {shop.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {shop.active ? 'Active' : 'Suspended'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

    const formatLogTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const toggleLogDetails = (id) => {
        setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const renderLogs = () => {
        const filteredLogs = logFilter === 'ALL' ? logs : logs.filter(log => log.category === logFilter);
        const categories = [
            { id: 'ALL', label: 'All Activity', icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100' },
            { id: 'AUTH', label: 'Security/Auth', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-100' },
            { id: 'SHOP_MGMT', label: 'Shop Control', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100' },
            { id: 'AD_MGMT', label: 'Ad Engine', icon: Layout, color: 'text-purple-600', bg: 'bg-purple-50 border border-purple-100' },
            { id: 'DISCOUNT_MGMT', label: 'Tier Codes', icon: Ticket, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-100' },
            { id: 'SYSTEM', label: 'System', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-100' }
        ];

        return (
            <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setLogFilter(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95
                                ${logFilter === cat.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-300'}
                            `}
                        >
                            <cat.icon className="w-3.5 h-3.5" /> {cat.label}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-600" /> Administrative Audit Trail
                        </h3>
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            {filteredLogs.length} events
                        </span>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[800px] overflow-y-auto custom-scrollbar flex-1">
                        {filteredLogs.length > 0 ? (
                            filteredLogs.map(log => {
                                const cat = categories.find(c => c.id === log.category) || categories[categories.length - 1];
                                return (
                                    <div key={log.id} className="p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-slate-50/30 transition-colors group">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${cat.bg} ${cat.color}`}>
                                            <cat.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${cat.bg} ${cat.color}`}>
                                                        {log.category}
                                                    </span>
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{log.action}</p>
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">
                                                    {formatLogTime(log.created_at)}
                                                </p>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">
                                                Executed by <span className="text-slate-950 font-black px-2 py-0.5 bg-slate-100 rounded-md border border-slate-150">{log.admin_username}</span>
                                            </p>
                                            
                                            {log.details && Object.keys(log.details).length > 0 && (
                                                <div className="mt-4">
                                                    <button
                                                        onClick={() => toggleLogDetails(log.id)}
                                                        className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 tracking-wider transition-colors"
                                                    >
                                                        {expandedLogs[log.id] ? (
                                                            <>Hide Payload <ChevronUp className="w-3.5 h-3.5" /></>
                                                        ) : (
                                                            <>Show Payload <ChevronDown className="w-3.5 h-3.5" /></>
                                                        )}
                                                    </button>
                                                    {expandedLogs[log.id] && (
                                                        <div className="mt-3 bg-slate-900 text-slate-100 border border-slate-800 p-5 rounded-2xl font-mono text-[10px] overflow-x-auto shadow-inner animate-in slide-in-from-top-2 duration-200">
                                                            <div className="flex justify-between items-center pb-2 mb-3 border-b border-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-500">
                                                                <span>Payload Details</span>
                                                                <span className="font-mono text-[7px]">{log.id}</span>
                                                            </div>
                                                            <pre className="whitespace-pre-wrap leading-relaxed">{JSON.stringify(log.details, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border border-slate-100 shadow-sm animate-pulse">
                                    <Activity className="w-10 h-10" />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-2">No activities logged</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Activity events matching the filter "{categories.find(c => c.id === logFilter)?.label}" will appear here once administrators perform updates.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 z-40 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-black tracking-tight">Super Admin</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Management</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {[
                        { id: 'analytics', label: 'Overview', icon: BarChart2 },
                        { id: 'shops', label: 'Shops Control', icon: Users },
                        { id: 'announcements', label: 'Push Notices', icon: AnnouncementIcon },
                        { id: 'ads', label: 'Advertisements', icon: Layout },
                        { id: 'discounts', label: 'Tier Codes', icon: Ticket },
                        { id: 'logs', label: 'Activity Logs', icon: Activity },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setView(item.id); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-all group ${view === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <item.icon className={`w-4 h-4 ${view === item.id ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:pl-64 overflow-y-auto min-h-screen">
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-[10px] lg:text-xs font-black text-slate-900 uppercase tracking-[0.2em] line-clamp-1">
                            {view} portal
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {['ads', 'discounts', 'announcements'].includes(view) && (
                            <button
                                onClick={() => {
                                    setEditItem(null);
                                    if (view === 'ads') setAdForm({ title: '', image_url: '', link_url: '', placement: 'dashboard_banner', active: true, type: 'manual', template_id: '' });
                                    if (view === 'discounts') setDiscountForm({ code: '', type: 'percent', value: 0, expires_at: '', active: true });
                                    if (view === 'announcements') setAnnouncementForm({ message: '', type: 'info', active: true });
                                    setIsModalOpen(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 lg:px-4 py-2 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Create New</span><span className="sm:hidden">New</span>
                            </button>
                        )}
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing System...</p>
                        </div>
                    ) : (
                        <>
                            {view === 'analytics' && renderAnalytics()}
                            {view === 'shops' && renderShops()}
                            {view === 'logs' && renderLogs()}

                            {view === 'ads' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ads.map(ad => (
                                        <div key={ad.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group">
                                            <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                                <img src={getImageUrl(ad.image_url)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ad.active ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                                                    {ad.active ? 'Live' : 'Hidden'}
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{ad.placement.replace('_', ' ')}</p>
                                                <h3 className="font-black text-slate-800 line-clamp-1 mb-4">{ad.title || 'Ad Asset'}</h3>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditItem(ad); setAdForm(ad); setIsModalOpen(true); }} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 p-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold border border-slate-100 italic">
                                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(ad.id)} className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-xl transition-all border border-red-100">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {view === 'announcements' && (
                                <div className="space-y-4 max-w-4xl">
                                    {announcements.map(notice => (
                                        <div key={notice.id} className={`p-6 rounded-3xl border flex items-start gap-4 transition-all hover:shadow-md
                                            ${notice.type === 'info' ? 'bg-blue-50/50 border-blue-100' :
                                                notice.type === 'warning' ? 'bg-amber-50/50 border-amber-100' :
                                                    notice.type === 'danger' ? 'bg-red-50/50 border-red-100' :
                                                        'bg-emerald-50/50 border-emerald-100'}
                                        `}>
                                            <div className={`p-2.5 rounded-xl shrink-0
                                                ${notice.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                                    notice.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                        notice.type === 'danger' ? 'bg-red-100 text-red-600' :
                                                            'bg-emerald-100 text-emerald-600'}
                                            `}>
                                                {notice.type === 'info' && <Info className="w-5 h-5" />}
                                                {notice.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                                                {notice.type === 'danger' && <XCircle className="w-5 h-5" />}
                                                {notice.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notice ID: {notice.id.slice(0, 8)}</span>
                                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${notice.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                            {notice.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => { setEditItem(notice); setAnnouncementForm({ ...notice, expires_at: notice.expires_at ? notice.expires_at.split('T')[0] : '' }); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDelete(notice.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                {notice.title && <h4 className="text-sm font-black text-slate-900 mb-1">{notice.title}</h4>}
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-2xl">{notice.message}</p>
                                                {notice.cta_link && (
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase text-slate-400">CTA:</span>
                                                        <a href={notice.cta_link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1">
                                                            {notice.cta_text || 'Learn More'} <LinkIcon className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {view === 'discounts' && (
                                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Code</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Value</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiry</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {discounts.map(d => (
                                                <tr key={d.id} className="hover:bg-slate-50/50 group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl border border-blue-100">{d.code}</span>
                                                            {!d.active && <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">Inactive</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-black text-slate-700">{d.value}{d.type === 'percent' ? '%' : ' AED'}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{d.type} discount</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                                <Users className="w-3 h-3" /> {d.used_count} / {d.max_uses || '∞'} uses
                                                            </div>
                                                            <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-blue-500" 
                                                                    style={{ width: d.max_uses ? `${(d.used_count / d.max_uses) * 100}%` : '20%' }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                                                            <Calendar className="w-3 h-3" /> {d.expires_at ? new Date(d.expires_at).toLocaleDateString() : 'Evergreen'}
                                                        </div>
                                                        {d.expires_at && new Date(d.expires_at) < new Date() && (
                                                            <span className="text-[8px] font-black text-red-500 uppercase">Expired</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditItem(d); setDiscountForm({ ...d, expires_at: d.expires_at ? d.expires_at.split('T')[0] : '' }); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDelete(d.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </div>
            </main>

            {/* Comprehensive Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <h3 className="text-xl font-black text-slate-900 uppercase">Create {view}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {view === 'ads' && (
                                <div className="space-y-6">
                                    <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                                        <button 
                                            type="button"
                                            onClick={() => setAdForm({ ...adForm, type: 'manual' })}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adForm.type === 'manual' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Manual Asset
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setAdForm({ ...adForm, type: 'promotional' })}
                                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${adForm.type === 'promotional' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Promo Templates
                                        </button>
                                    </div>

                                    {adForm.type === 'manual' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Campaign Title</label>
                                                <input type="text" required value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="Summer Growth Pack..." />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Asset Image</label>
                                                <div className="relative group">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleAdFileChange}
                                                        className="hidden" 
                                                        id="ad-image-upload" 
                                                    />
                                                    <label 
                                                        htmlFor="ad-image-upload"
                                                        className="flex flex-col items-center justify-center w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-slate-100/50 hover:border-blue-300 transition-all overflow-hidden"
                                                    >
                                                        {adPreview || adForm.image_url ? (
                                                            <img src={adPreview || getImageUrl(adForm.image_url)} alt="Preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <>
                                                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 mb-3 group-hover:scale-110 transition-transform">
                                                                    <Plus className="w-6 h-6" />
                                                                </div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Banner Image</p>
                                                            </>
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Action Link (Optional)</label>
                                                <input type="text" value={adForm.link_url} onChange={e => setAdForm({ ...adForm, link_url: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="https://..." />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid grid-cols-1 gap-3">
                                                {AD_TEMPLATES.map(template => (
                                                    <button
                                                        key={template.id}
                                                        type="button"
                                                        onClick={() => setAdForm({ 
                                                            ...adForm, 
                                                            template_id: template.id,
                                                            title: template.title,
                                                            image_url: template.image_url,
                                                            link_url: template.link_url
                                                        })}
                                                        className={`p-4 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${adForm.template_id === template.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                                                    >
                                                        <div className="w-16 h-12 bg-slate-200 rounded-xl overflow-hidden shrink-0">
                                                            <img src={template.image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{template.title}</p>
                                                            <p className="text-[10px] font-bold text-slate-500">{template.description}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                            {adForm.template_id && (
                                                <div className="pt-4 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Customize Title</label>
                                                        <input type="text" value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Custom Image Override (Optional)</label>
                                                        <div className="relative group">
                                                            <input type="file" accept="image/*" onChange={handleAdFileChange} className="hidden" id="ad-template-image-upload" />
                                                            <label htmlFor="ad-template-image-upload" className="flex items-center gap-3 w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 cursor-pointer hover:bg-slate-100 transition-all">
                                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm"><ImageIcon className="w-4 h-4" /></div>
                                                                <span className="text-xs font-bold text-slate-500">{adFile ? adFile.name : 'Click to override template image'}</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Placement Area</label>
                                        <select value={adForm.placement} onChange={e => setAdForm({ ...adForm, placement: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black focus:border-blue-500 outline-none appearance-none cursor-pointer">
                                            <option value="dashboard_banner">Dashboard Main</option>
                                            <option value="billing_banner">Billing & Invoices</option>
                                            <option value="reports_banner">Advanced Reports</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                             {view === 'announcements' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notice Title</label>
                                        <input type="text" value={announcementForm.title} onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="E.g. System Update" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notice Content</label>
                                        <textarea
                                            required rows={3}
                                            value={announcementForm.message}
                                            onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none resize-none"
                                            placeholder="System update scheduled for 2 AM tonight..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CTA Label</label>
                                            <input type="text" value={announcementForm.cta_text} onChange={e => setAnnouncementForm({ ...announcementForm, cta_text: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="Check it out" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CTA Link</label>
                                            <input type="text" value={announcementForm.cta_link} onChange={e => setAnnouncementForm({ ...announcementForm, cta_link: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="https://..." />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notice Type</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['info', 'success', 'warning', 'danger'].map(t => (
                                                <button
                                                    key={t} type="button"
                                                    onClick={() => setAnnouncementForm({ ...announcementForm, type: t })}
                                                    className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all
                                                        ${announcementForm.type === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200'}
                                                    `}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                             {view === 'discounts' && (
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Code Name</label>
                                        <div className="relative">
                                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" required value={discountForm.code} onChange={e => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-black focus:border-blue-500 outline-none" placeholder="LAUNCH2026" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit Type</label>
                                            <select value={discountForm.type} onChange={e => setDiscountForm({ ...discountForm, type: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-black focus:border-blue-500 outline-none">
                                                <option value="percent">Percentage (%)</option>
                                                <option value="fixed">Flat Amount</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Discount Value</label>
                                            <input type="number" required value={discountForm.value} onChange={e => setDiscountForm({ ...discountForm, value: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Max Usage (Optional)</label>
                                            <input type="number" value={discountForm.max_uses} onChange={e => setDiscountForm({ ...discountForm, max_uses: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" placeholder="Unlimted" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Expiry Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="date" value={discountForm.expires_at} onChange={e => setDiscountForm({ ...discountForm, expires_at: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-11 pr-4 py-4 text-sm font-bold focus:border-blue-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase">
                                <Save className="w-4 h-4" /> Finalize & Push to Platform
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;

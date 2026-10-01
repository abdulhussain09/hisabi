import React, { useState, useEffect } from 'react';
import api, { IMAGE_BASE_URL, getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Building2,
    Mail,
    Phone,
    MapPin,
    Hash,
    Save,
    Lock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    Upload,
    Palette,
    Check,
    Landmark,
    QrCode,
    FileText,
    Globe,
    CreditCard
} from 'lucide-react';
import FeatureGuard from '../components/FeatureGuard';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });
    const [profileData, setProfileData] = useState({
        username: '',
        password: '',
        shop_name: '',
        address: '',
        phone: '',
        email: '',
        country: 'AE',
        currency: 'AED',
        trn: '',
        gstin: '',
        cr_number: '',
        bank_name: '',
        bank_account_number: '',
        bank_iban_ifsc: '',
        upi_id: '',
        invoice_declaration: '',
        invoice_notes: '',
        brand_color: '#3b82f6',
        brand_logo: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);

    const isPremium = user?.shop?.plan === 'premium';

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            const { user: userData, shop } = response.data;
            setProfileData({
                username: userData.username,
                password: '',
                shop_name: shop.name || '',
                address: shop.address || '',
                phone: shop.phone || '',
                email: shop.email || '',
                country: shop.country || 'AE',
                currency: shop.currency || (shop.country === 'IN' ? 'INR' : (shop.country === 'KW' ? 'KWD' : 'AED')),
                trn: shop.trn || '',
                gstin: shop.gstin || '',
                cr_number: shop.cr_number || '',
                bank_name: shop.bank_name || '',
                bank_account_number: shop.bank_account_number || '',
                bank_iban_ifsc: shop.bank_iban_ifsc || '',
                upi_id: shop.upi_id || '',
                invoice_declaration: shop.invoice_declaration || '',
                invoice_notes: shop.invoice_notes || '',
                brand_color: shop.brand_color || '#3b82f6',
                brand_logo: shop.brand_logo || ''
            });
            if (shop.brand_logo) setLogoPreview(getImageUrl(shop.brand_logo));
        } catch (error) {
            console.error('Failed to fetch profile', error);
            setStatus({ type: 'error', message: 'Failed to load profile data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'country') {
            const defaultCurrency = value === 'IN' ? 'INR' : (value === 'KW' ? 'KWD' : 'AED');
            setProfileData(prev => ({ ...prev, country: value, currency: defaultCurrency }));
        } else {
            setProfileData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus({ type: null, message: '' });

        try {
            const formData = new FormData();
            Object.keys(profileData).forEach(key => {
                if (profileData[key] !== undefined && key !== 'brand_logo') {
                    formData.append(key, profileData[key]);
                }
            });
            if (logoFile) formData.append('brand_logo', logoFile);

            const response = await api.put('/auth/profile', formData);
            setStatus({ type: 'success', message: 'Profile & Invoice settings updated successfully!' });

            if (setUser) {
                setUser({
                    ...user,
                    username: response.data.user.username,
                    shop: response.data.shop
                });
            }

            setProfileData(prev => ({ ...prev, password: '' }));
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.response?.data?.error || 'Failed to update profile'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="page-header">
                <div className="page-title-group">
                    <div className="page-icon bg-slate-800">
                        <User className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="page-title">Account & Invoice Settings</h1>
                        <p className="page-subtitle">Configure your business profile, invoice design country, bank details, and payment QR codes</p>
                    </div>
                </div>
            </div>

            {status.message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span className="font-bold text-sm">{status.message}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 pb-12">
                {/* 1. Account Section */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <Lock className="w-32 h-32" />
                    </div>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Login Credentials</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Username</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="username"
                                    value={profileData.username}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">New Password (Empty to keep current)</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="password"
                                    name="password"
                                    value={profileData.password}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all placeholder:text-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Country & Invoice Format Selection */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Country & Invoice Design System</h2>
                            <p className="text-xs text-slate-500 font-medium">Select your country to automatically apply its dedicated invoice layout, tax compliance, and currency</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'country', value: 'IN' } })}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${profileData.country === 'IN' ? 'border-[#024282] bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-sm text-slate-900">India</span>
                                {profileData.country === 'IN' && <Check className="w-4 h-4 text-[#024282]" />}
                            </div>
                            <p className="text-xs font-bold text-[#024282]">GST Tax Invoice (₹)</p>
                            <p className="text-[10px] text-slate-500 mt-1">CGST / SGST / IGST split, HSN/SAC codes & UPI QR</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'country', value: 'AE' } })}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${profileData.country === 'AE' ? 'border-[#024282] bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-sm text-slate-900">UAE</span>
                                {profileData.country === 'AE' && <Check className="w-4 h-4 text-[#024282]" />}
                            </div>
                            <p className="text-xs font-bold text-[#024282]">Tax Invoice (AED)</p>
                            <p className="text-[10px] text-slate-500 mt-1">Dubai Skyline, 5% VAT breakdown & ZATCA TLV QR</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleChange({ target: { name: 'country', value: 'KW' } })}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${profileData.country === 'KW' ? 'border-[#024282] bg-blue-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-black text-sm text-slate-900">Kuwait</span>
                                {profileData.country === 'KW' && <Check className="w-4 h-4 text-[#024282]" />}
                            </div>
                            <p className="text-xs font-bold text-[#024282]">Commercial Invoice (KWD)</p>
                            <p className="text-[10px] text-slate-500 mt-1">Kuwait Towers, CR Registration & 3-Decimal KWD</p>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Currency Code</label>
                            <input
                                type="text"
                                name="currency"
                                value={profileData.currency}
                                readOnly
                                className="w-full px-4 py-3.5 bg-slate-100 rounded-2xl border border-transparent font-bold text-slate-700 cursor-not-allowed"
                            />
                        </div>

                        {profileData.country === 'IN' && (
                            <div className="space-y-2 animate-in fade-in">
                                <label className="text-sm font-black text-slate-700 ml-1">GSTIN Number</label>
                                <input
                                    type="text"
                                    name="gstin"
                                    placeholder="e.g. 08AAAAA0000A1Z5"
                                    value={profileData.gstin}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 uppercase"
                                />
                            </div>
                        )}

                        {profileData.country === 'AE' && (
                            <div className="space-y-2 animate-in fade-in">
                                <label className="text-sm font-black text-slate-700 ml-1">TRN (Tax Registration Number)</label>
                                <input
                                    type="text"
                                    name="trn"
                                    placeholder="e.g. 100000000000003"
                                    value={profileData.trn}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900"
                                />
                            </div>
                        )}

                        {profileData.country === 'KW' && (
                            <div className="space-y-2 animate-in fade-in">
                                <label className="text-sm font-black text-slate-700 ml-1">CR Number (Commercial Registration)</label>
                                <input
                                    type="text"
                                    name="cr_number"
                                    placeholder="e.g. 1234567"
                                    value={profileData.cr_number}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Shop Contact Details */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Shop & Seller Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Business Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="shop_name"
                                    value={profileData.shop_name}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Physical Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    name="address"
                                    value={profileData.address}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900 transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Bank Details & Payment QR Section */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Landmark className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Invoice Bank & QR Payment Details</h2>
                            <p className="text-xs text-slate-500 font-medium">These details appear directly in the Bank Details card and QR section of your printed/PDF invoices</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Bank Name</label>
                            <input
                                type="text"
                                name="bank_name"
                                placeholder="e.g. Kuwait Finance House / HDFC Bank"
                                value={profileData.bank_name}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Account Number (A/C No.)</label>
                            <input
                                type="text"
                                name="bank_account_number"
                                placeholder="e.g. 1234 5678 9012"
                                value={profileData.bank_account_number}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold font-mono text-slate-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Branch / IFSC / IBAN</label>
                            <input
                                type="text"
                                name="bank_iban_ifsc"
                                placeholder="e.g. Salmiya Branch / HDFC0001234"
                                value={profileData.bank_iban_ifsc}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold font-mono text-slate-900"
                            />
                        </div>
                    </div>

                    {profileData.country === 'IN' && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="space-y-2 max-w-md">
                                <label className="text-sm font-black text-slate-700 ml-1 flex items-center gap-1.5">
                                    <QrCode className="w-4 h-4 text-sky-500" />
                                    <span>UPI ID for Invoice QR Code</span>
                                </label>
                                <input
                                    type="text"
                                    name="upi_id"
                                    placeholder="e.g. yourshop@upi or 9876543210@paytm"
                                    value={profileData.upi_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-bold font-mono text-slate-900"
                                />
                                <p className="text-[10px] text-slate-400 font-medium">When customers scan the QR on your GST invoice, it will open UPI with this VPA</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Custom Declaration & Invoice Notes */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Invoice Notes & Declaration</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Invoice Notes / Terms</label>
                            <textarea
                                name="invoice_notes"
                                rows={3}
                                placeholder="Thank you for your business! If you have any questions about this invoice, please contact us."
                                value={profileData.invoice_notes}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-medium text-xs text-slate-900 leading-relaxed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 ml-1">Legal Declaration</label>
                            <textarea
                                name="invoice_declaration"
                                rows={3}
                                placeholder="We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."
                                value={profileData.invoice_declaration}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500/20 focus:bg-white outline-none font-medium text-xs text-slate-900 leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                {/* 6. Premium Branding Section */}
                <FeatureGuard feature="customBranding">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                            <Palette className="w-32 h-32" />
                        </div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Sparkles className="w-5 h-5" /></div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Premium Branding & Colors</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 ml-1">Shop Logo</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group/logo cursor-pointer">
                                        {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" /> : <Upload className="w-8 h-8 text-slate-300" />}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"><Upload className="w-6 h-6 text-white" /></div>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-700">PNG, JPG or SVG</p>
                                        <p className="text-[10px] text-slate-400 font-medium text-wrap">Square, transparent background recommended</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 ml-1">Brand Accent Color</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl shadow-inner border border-white relative overflow-hidden" style={{ backgroundColor: profileData.brand_color }}>
                                        <input type="color" name="brand_color" value={profileData.brand_color} onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4" />
                                    </div>
                                    <input type="text" name="brand_color" value={profileData.brand_color} onChange={handleChange} className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl border border-transparent font-mono text-xs font-bold text-slate-600 uppercase" />
                                </div>
                                <div className="flex gap-2">
                                    {['#3b82f6', '#0d9488', '#8b5cf6', '#f43f5e', '#f59e0b', '#0f172a'].map(color => (
                                        <button key={color} type="button" onClick={() => handleChange({ target: { name: 'brand_color', value: color } })} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${profileData.brand_color === color ? 'border-slate-400' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                                            {profileData.brand_color === color && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </FeatureGuard>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={saving} className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] hover:bg-blue-700 disabled:bg-blue-300 transition-all font-black text-base shadow-xl shadow-blue-500/20 active:scale-95">
                        {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save All Profile & Invoice Settings</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Store, User, Lock, MapPin, Hash,
    Coins, Percent, ArrowRight, CheckCircle2,
    AlertCircle, Loader2
} from 'lucide-react';
import DemoLoginButton from '../components/DemoLoginButton';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        shop_name: '',
        username: '',
        password: '',
        address: '',
        trn: '',
        gstin: '',
        country: 'AE',
        phone: '',
        email: '',
        currency: 'AED',
        vat_enabled: false,
        gst_enabled: false
    });
    const [error, setError] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    // Region selector — auto-sets currency and tax mode
    const REGIONS = [
        { country: 'AE', label: '🇦🇪 UAE (AED)', currency: 'AED', vat: true },
        { country: 'KW', label: '🇰🇼 Kuwait (KWD)', currency: 'KWD', vat: false },
        { country: 'IN', label: '🇮🇳 India (INR)', currency: 'INR', vat: false },
    ];

    const handleRegionChange = (e) => {
        const region = REGIONS.find(r => r.country === e.target.value);
        if (region) {
            setFormData(prev => ({
                ...prev,
                country: region.country,
                currency: region.currency,
                vat_enabled: region.vat,
                gst_enabled: region.country === 'IN'
            }));
        }
    };

    const isIndia = formData.country === 'IN';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(formData.username, formData.password);
            } else {
                await register(formData);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || t('login.auth_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-2 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden relative z-10">

                {/* Brand Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
                            <Store className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight mb-4">Hisabi-POS</h1>
                        <p className="text-blue-100 text-xl font-medium leading-relaxed max-w-sm">
                            {t('login.brand_msg')}
                        </p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        {[
                            t('login.features.uae_ready'),
                            t('login.features.modern_pos'),
                            t('login.features.realtime_tracking'),
                            t('login.features.pdf_export')
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="p-1 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                    <CheckCircle2 className="w-5 h-5 text-blue-200" />
                                </div>
                                <span className="font-semibold text-blue-50/90">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Decorative Circle */}
                    <div className="absolute bottom-[-100px] right-[-100px] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                </div>

                {/* Form Side */}
                <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white/95">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className={`text-3xl font-black text-gray-900 tracking-tight ${isRTL ? 'lg:text-right' : ''}`}>
                            {isLogin ? t('login.welcome') : t('login.create_account')}
                        </h2>
                        <p className={`text-gray-500 font-medium mt-2 ${isRTL ? 'lg:text-right' : ''}`}>
                            {isLogin
                                ? t('login.login_sub')
                                : t('login.register_sub')}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
                        <button
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${isLogin ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('login.sign_in')}
                        </button>
                        <button
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 ${!isLogin ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('login.register')}
                        </button>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Common Fields */}
                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="relative group">
                                    <label htmlFor="shop_name" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.shop_identity')}</label>
                                    <div className="relative">
                                        <Store className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                        <input
                                            id="shop_name"
                                            name="shop_name"
                                            type="text"
                                            required
                                            value={formData.shop_name}
                                            onChange={handleChange}
                                            className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                            placeholder={t('login.shop_name')}
                                            autoComplete="organization"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <label htmlFor="username" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.username_label')}</label>
                                    <div className="relative">
                                        <User className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                        <input
                                            id="username"
                                            name="username"
                                            type="text"
                                            required
                                            value={formData.username}
                                            onChange={handleChange}
                                            className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                            placeholder={t('login.username')}
                                            autoComplete="username"
                                        />
                                    </div>
                                </div>
                                <div className="relative group">
                                    <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.password_label')}</label>
                                    <div className="relative">
                                        <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                            placeholder="••••••••"
                                            autoComplete={isLogin ? "current-password" : "new-password"}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Registration Specific Fields */}
                        {!isLogin && (
                            <div className="space-y-4 pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="relative group">
                                    <label htmlFor="address" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.address_label')}</label>
                                    <div className="relative">
                                        <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                        <input
                                            id="address"
                                            name="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                            placeholder={t('login.address_placeholder')}
                                            autoComplete="street-address"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <label htmlFor="phone" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.phone_label')}</label>
                                        <div className="relative">
                                            <div className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 flex items-center justify-center`}>
                                                <Hash className="w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                id="phone"
                                                name="phone"
                                                type="text"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                                placeholder="+971 50..."
                                                autoComplete="tel"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <label htmlFor="email" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">{t('login.email_label')}</label>
                                        <div className="relative">
                                            <User className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400`}
                                                placeholder="store@example.com"
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Country / Region Selector */}
                                    <div className="relative group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">Region</label>
                                        <div className="relative">
                                            <Coins className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleRegionChange}
                                                className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-black text-gray-900 appearance-none`}
                                            >
                                                {REGIONS.map(r => (
                                                    <option key={r.country} value={r.country}>{r.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    {/* Tax ID: TRN for UAE/KW, GSTIN for India */}
                                    <div className="relative group">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
                                            {isIndia ? 'GSTIN (Optional)' : t('login.trn_label')}
                                        </label>
                                        <div className="relative">
                                            <Hash className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors`} />
                                            <input
                                                name={isIndia ? 'gstin' : 'trn'}
                                                type="text"
                                                maxLength={isIndia ? 15 : undefined}
                                                value={isIndia ? formData.gstin : formData.trn}
                                                onChange={handleChange}
                                                className={`w-full ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'} py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400 uppercase`}
                                                placeholder={isIndia ? '15-char GSTIN' : t('login.trn_placeholder')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* GST toggle for India, VAT toggle for UAE */}
                                {!isIndia && (
                                    <div className={`flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 group cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => setFormData({ ...formData, vat_enabled: !formData.vat_enabled })}>
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${formData.vat_enabled ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200'}`}>
                                            {formData.vat_enabled && <Percent className="w-4 h-4" />}
                                        </div>
                                        <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                                            <span className="block text-sm font-black text-gray-900">{t('login.vat_label')}</span>
                                            <p className="text-xs font-medium text-blue-600/80">{t('login.vat_sub')}</p>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={formData.vat_enabled} readOnly />
                                    </div>
                                )}
                                {isIndia && (
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                            <Percent className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 leading-none">Platform Fee</p>
                                            <p className="text-xs font-medium text-orange-600/80 mt-1">Prices include a 2% platform fee.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className={`p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <p className={`text-sm font-bold text-red-800 ${isRTL ? 'text-right' : ''}`}>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gray-900 text-white py-4 px-6 rounded-2xl font-black text-lg shadow-xl shadow-gray-200 hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>{isLogin ? t('login.sign_in') : t('login.create_shop')}</span>
                                    <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                                </>
                            )}
                        </button>
                    </form>

                    {isLogin && (
                        <div className="mt-4">
                            <div className="relative flex items-center gap-3 mb-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <DemoLoginButton />
                        </div>
                    )}

                    <p className="mt-6 text-center text-gray-400 font-bold text-sm">
                        Smart retail management by <span className="text-gray-900">Hisabi-POS Tech</span>
                    </p>
                    <p className="mt-2 text-center text-xs text-gray-400">
                        <Link to="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
                        <span className="mx-2">·</span>
                        <Link to="/terms" className="hover:text-blue-600 transition-colors">Terms &amp; Conditions</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

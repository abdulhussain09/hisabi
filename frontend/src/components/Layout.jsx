import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import api, { IMAGE_BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard, ShoppingCart, Package, FileText, BarChart2,
    Users, Truck, Wallet, RotateCcw, ShoppingBag, User,
    LogOut, Menu, X, ChevronRight, Store,
    PackageCheck, Ticket, ClipboardList, Target, Globe, HelpCircle, Mail, Crown, Lock
} from 'lucide-react';
import PricingModal from './PricingModal';
import { usePlan } from '../hooks/usePlan';

const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${IMAGE_BASE_URL}${url}`;
};

const NAV = [
    {
        group: 'nav.group_core',
        items: [
            { name: 'nav.dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'nav.pos', href: '/pos', icon: ShoppingCart },
            { name: 'nav.due_collection', href: '/due-collection', icon: Wallet },
            { name: 'nav.products', href: '/products', icon: Package },
            { name: 'nav.invoices', href: '/invoices', icon: FileText },
            { name: 'nav.reports', href: '/reports', icon: BarChart2 },
        ]
    },
    {
        group: 'nav.group_operations',
        items: [
            { name: 'nav.customers', href: '/customers', icon: Users },
            { name: 'nav.suppliers', href: '/suppliers', icon: Truck },
            { name: 'nav.purchases', href: '/purchases', icon: ShoppingBag },
            { name: 'nav.returns', href: '/returns', icon: RotateCcw },
            { name: 'nav.expenses', href: '/expenses', icon: Wallet },
            { name: 'nav.eod', href: '/end-of-day', icon: ClipboardList },
        ]
    },
    {
        group: 'nav.group_management',
        items: [
            { name: 'nav.stock_adj', href: '/stock-adjustments', icon: PackageCheck },
            { name: 'nav.discounts', href: '/discount-codes', icon: Ticket },
            { name: 'nav.targets', href: '/targets', icon: Target },
            { name: 'nav.staff', href: '/staff', icon: Users },
        ]
    },
    {
        group: 'nav.group_support',
        items: [
            { name: 'nav.help', href: '/help', icon: HelpCircle },
        ]
    },
];


const NavItem = ({ item, isActive, onClick, isRTL, locked, onLockClick }) => {
    const Icon = item.icon;
    const { t } = useTranslation();

    const handleClick = (e) => {
        if (locked) {
            e.preventDefault();
            onLockClick?.();
            return;
        }
        onClick?.();
    };

    return (
        <Link
            to={locked ? '#' : item.href}
            onClick={handleClick}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 relative ${isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                } ${locked ? 'opacity-80' : ''}`}
        >
            <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-150 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 group-hover:scale-110'}`} />
            <span className="truncate">{t(item.name)}</span>

            {locked && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} p-1 bg-slate-100 rounded-lg group-hover:bg-blue-100 transition-colors`}>
                    <Lock className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
                </div>
            )}

            {isActive && !locked && <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? 'mr-auto rotate-180' : 'ml-auto'} opacity-60`} />}
        </Link>
    );
};

const Sidebar = ({ location, onClose, isLocked, onUpgradeTrigger }) => {
    const { user, logout } = useAuth();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="flex flex-col h-full">
            {/* Logo */}
            <div className={`flex items-center gap-3 px-5 h-16 border-b border-slate-100 flex-shrink-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 overflow-hidden"
                    style={{
                        backgroundColor: user?.shop?.brand_color || '#3b82f6',
                        boxShadow: `0 4px 12px ${user?.shop?.brand_color ? user.shop.brand_color + '40' : 'rgba(59, 130, 246, 0.3)'}`
                    }}
                >
                    {user?.shop?.brand_logo ? (
                        <img src={getImageUrl(user.shop.brand_logo)} alt={`${user?.shop?.name || 'Shop'} logo`} className="w-full h-full object-contain p-1" />
                    ) : (
                        <Store className="w-4 h-4 text-white" />
                    )}
                </div>
                <div className={`overflow-hidden ${isRTL ? 'text-right' : 'text-left'}`}>
                    <h1 className="text-base font-black text-slate-900 tracking-tight leading-none">{user?.shop?.name || 'Hisabi-POS'}</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t('common.pos_subtitle')}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className={`${isRTL ? 'mr-auto' : 'ml-auto'} p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden`}>
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV.map((section) => (
                    <div key={section.group}>
                        <p className={`text-[9px] font-black text-slate-400 uppercase tracking-[0.12em] mb-1.5 px-3 ${isRTL ? 'text-right' : 'text-left'}`}>{t(section.group)}</p>
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                // Staff Restrictions
                                const restrictedPaths = [
                                    '/reports', '/suppliers', '/purchases',
                                    '/expenses', '/end-of-day', '/discount-codes',
                                    '/targets', '/staff'
                                ];
                                if (user?.role === 'staff' && restrictedPaths.includes(item.href)) {
                                    return null;
                                }

                                return (
                                    <NavItem
                                        key={item.href}
                                        item={item}
                                        isActive={location.pathname === item.href}
                                        onClick={onClose}
                                        isRTL={isRTL}
                                        locked={isLocked(item.href)}
                                        onLockClick={onUpgradeTrigger}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User footer */}
            <div className="flex-shrink-0 border-t border-slate-100">
            </div>
        </aside>
    );
};

const UserDropdown = ({ user, handleLogout, isRTL, t, onUpgrade, plan }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('main'); // 'main' or 'language'
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        setIsOpen(false);
        setView('main');
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    setView('main');
                }}
                className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-100 transition-all duration-200 border border-transparent ${isOpen ? 'bg-slate-100 border-slate-200' : ''} ${isRTL ? 'flex-row-reverse' : ''}`}
            >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-white">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className={`hidden sm:block ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className="text-xs font-black text-slate-900 leading-tight">{user?.username}</p>
                    <p className="text-[10px] font-black text-slate-400 leading-tight uppercase tracking-widest">{user?.role}</p>
                </div>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className={`absolute top-full mt-2 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top overflow-hidden ${isRTL ? 'left-0' : 'right-0'}`}>
                        {view === 'main' ? (
                            <>
                                <div className={`px-4 py-3 border-b border-slate-50 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                                    <p className="text-xs font-black text-slate-900">{user?.username}</p>
                                    <p className="text-[10px] font-bold text-slate-400 truncate">{user?.shop?.name}</p>
                                </div>

                                {user?.role !== 'staff' && (
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                    >
                                        <User className="w-4 h-4 opacity-70" />
                                        {t('nav.profile')}
                                    </Link>
                                )}

                                <button
                                    onClick={() => setView('language')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                >
                                    <Globe className="w-4 h-4 opacity-70 shrink-0" />
                                    <span className="text-inherit">{i18n.language === 'en' ? t('common.english') : t('common.arabic')}</span>
                                    <div className="flex-1" />
                                    <ChevronRight className={`w-3.5 h-3.5 opacity-40 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                                </button>

                                <div className="h-px bg-slate-50 my-1 mx-2" />

                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        handleLogout();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                >
                                    <LogOut className="w-4 h-4 opacity-70" />
                                    {t('Sign Out')}
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="relative px-2 py-3 border-b border-slate-50 mb-2 flex items-center justify-center">
                                    <button 
                                        onClick={() => setView('main')} 
                                        className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-2' : 'left-2'} p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors`}
                                    >
                                        <ChevronRight className={`w-4 h-4 ${isRTL ? '' : 'rotate-180'}`} />
                                    </button>
                                    <span className="text-xs font-black uppercase text-slate-500 tracking-widest">{t('common.language')}</span>
                                </div>
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`w-full flex items-center px-3 py-2.5 text-xs font-black rounded-xl transition-all ${i18n.language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'} ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                                >
                                    <span className="flex-1">English</span>
                                    {i18n.language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                </button>
                                <button
                                    onClick={() => changeLanguage('ar')}
                                    className={`w-full flex items-center px-3 py-2.5 text-xs font-black rounded-xl transition-all ${i18n.language === 'ar' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'} ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                                >
                                    <span className="flex-1">العربية</span>
                                    {i18n.language === 'ar' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

const Layout = () => {
    const { user, logout } = useAuth();
    const { isLocked, plan } = usePlan();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showPricing, setShowPricing] = useState(false);

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language, isRTL]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`min-h-screen bg-slate-50 flex ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Desktop sidebar */}
            <div className={`hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-30`}>
                <Sidebar
                    location={location}
                    onClose={null}
                    isLocked={isLocked}
                    onUpgradeTrigger={() => setShowPricing(true)}
                />
            </div>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    style={{ backdropFilter: 'blur(2px)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile drawer */}
            <div className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} z-50 w-72 bg-white border-r border-slate-100 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${mobileOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}`}>
                <Sidebar
                    location={location}
                    onClose={() => setMobileOpen(false)}
                    isLocked={isLocked}
                    onUpgradeTrigger={() => setShowPricing(true)}
                />
            </div>

            {/* Main content */}
            <div className={`flex-1 flex flex-col ${isRTL ? 'lg:mr-64' : 'lg:ml-64'} min-w-0`}>
                {/* Mobile top bar */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white border-b border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                                <Store className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="font-black text-slate-900 text-sm tracking-tight">Hisabi-POS</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {user?.role !== 'staff' && (
                            <button
                                onClick={() => setShowPricing(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                                <span>{t('common.upgrade')}</span>
                            </button>
                        )}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-xl">
                            <Crown className={`w-3.5 h-3.5 ${plan === 'premium' ? 'text-amber-500' : plan === 'gold' ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{plan}</span>
                        </div>
                        <UserDropdown 
                            user={user} 
                            handleLogout={handleLogout} 
                            isRTL={isRTL} 
                            t={t} 
                            onUpgrade={() => setShowPricing(true)}
                            plan={plan}
                        />
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden lg:flex sticky top-0 z-20 items-center justify-between px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">{t(NAV.find(n => n.items.some(i => i.href === location.pathname))?.group || 'nav.group_core')}</h2>
                        <ChevronRight className={`w-4 h-4 text-slate-300 ${isRTL ? 'rotate-180' : ''}`} />
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                            {t(NAV.flatMap(n => n.items).find(i => i.href === location.pathname)?.name || '')}
                        </h2>
                    </div>

                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {user?.role !== 'staff' && (
                            <button
                                onClick={() => setShowPricing(true)}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300/30" />
                                <span>{t('common.upgrade')}</span>
                            </button>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
                            <Crown className={`w-3.5 h-3.5 ${plan === 'premium' ? 'text-amber-500' : plan === 'gold' ? 'text-blue-500' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{plan}</span>
                        </div>
                        <UserDropdown 
                            user={user} 
                            handleLogout={handleLogout} 
                            isRTL={isRTL} 
                            t={t} 
                            onUpgrade={() => setShowPricing(true)}
                            plan={plan}
                        />
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    <div className={`${location.pathname === '/pos' ? 'w-full h-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8'}`}>
                        <Outlet />
                    </div>
                </main>

                {/* Footer */}
                {location.pathname !== '/pos' && (
                    <footer className="flex-shrink-0 border-t border-slate-100 bg-white">
                        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2`}>
                            <p className="text-[11px] font-semibold text-slate-400">
                                © {new Date().getFullYear()} Hisabi-POS. All rights reserved. Abdul Hussain.
                            </p>
                            <a
                                href="mailto:support@hisabi.app"
                                className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <Mail className="w-3 h-3" />
                                support@hisabi.app
                            </a>
                        </div>
                    </footer>
                )}
            </div>

            {/* Pricing Modal */}
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </div>
    );
};

export default Layout;

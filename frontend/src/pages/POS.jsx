import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import api, { IMAGE_BASE_URL, getImageUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Plus,
    Minus,
    ShoppingCart,
    Clock,
    User,
    CreditCard,
    Wallet,
    QrCode,
    ChevronRight,
    Printer,
    CheckCircle,
    Package,
    Tag,
    Ticket,
    Percent,
    Banknote,
    X,
    AlertCircle,
    MapPin
} from 'lucide-react';

// Memoized Product Card for performance
const ProductCard = memo(({ product, currency, isRTL, onAdd, t }) => {
    return (
        <div
            onClick={() => onAdd(product)}
            className="bg-white border border-slate-200 rounded-2xl p-3 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative h-full"
        >
            <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
                {product.stock_quantity <= 0 ? (
                    <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{t('pos.stock.out_of_stock')}</span>
                ) : product.stock_quantity < 10 ? (
                    <span className="bg-amber-100 text-amber-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{t('pos.stock.low_stock')} ({product.stock_quantity})</span>
                ) : (
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">{t('pos.stock.in_stock')}</span>
                )}
            </div>

            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3 border border-slate-100 flex items-center justify-center p-2 group-hover:bg-blue-50/50 transition-colors">
                {product.image_path ? (
                    <img src={getImageUrl(product.image_path)} alt={product.name} className="w-full h-full object-contain" loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                    <Package className="w-10 h-10 text-slate-200" />
                )}
            </div>

            <h3 className="text-[13px] font-bold text-slate-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{product.name}</h3>

            <div className="mt-auto pt-2 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900">{currency} {parseFloat(product.selling_price).toFixed(2)}</span>
                    {product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price) && (
                        <span className="text-[10px] text-slate-400 line-through decoration-red-400/50 font-bold">{currency} {parseFloat(product.mrp).toFixed(2)}</span>
                    )}
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
});

const POS = () => {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();
    const currency = user?.shop?.currency || 'AED';
    const isRTL = i18n.language === 'ar';

    // State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState(null);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState(0);

    // Auto-fill returning customer details when entering phone or email
    useEffect(() => {
        const query = (customerPhone || customerEmail || '').trim();
        if (!query || query.length < 3) return;

        const timer = setTimeout(async () => {
            try {
                const res = await api.get(`/customers?search=${encodeURIComponent(query)}`);
                if (res.data && res.data.length > 0) {
                    const match = res.data.find(c => 
                        (c.phone && c.phone.trim() === customerPhone.trim()) ||
                        (c.email && c.email.trim().toLowerCase() === customerEmail.trim().toLowerCase())
                    ) || res.data[0];

                    if (match) {
                        if (match.name && !customerName) setCustomerName(match.name);
                        if (match.phone && !customerPhone) setCustomerPhone(match.phone);
                        if (match.email && !customerEmail) setCustomerEmail(match.email);
                        if (match.address && !customerAddress) setCustomerAddress(match.address);
                    }
                }
            } catch { /* silent */ }
        }, 400);

        return () => clearTimeout(timer);
    }, [customerPhone, customerEmail]);

    // Discount States
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscountCode, setAppliedDiscountCode] = useState(null);
    const [isValidatingCode, setIsValidatingCode] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());
    const [mobileTab, setMobileTab] = useState('products'); // 'products' | 'cart'

    // Auto-generated Invoice # (Mock for UI)
    const [mockInvoiceNum] = useState(`INV-${Date.now().toString().slice(-6)}`);

    // Effects
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    api.get(`/products?search=${search}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`),
                    api.get('/categories')
                ]);
                setProducts(prodRes.data);
                setCategories(catRes.data);
            } catch (err) {
                console.error('Failed to load POS data', err);
            }
        };
        loadInitialData();
    }, [search, selectedCategory]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cart Handlers
    const addToCart = useCallback((product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock_quantity) return prevCart;
                return prevCart.map(item =>
                    item.product_id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                if (product.stock_quantity <= 0) return prevCart;
                return [...prevCart, {
                    product_id: product.id,
                    name: product.name,
                    price: parseFloat(product.selling_price),
                    mrp: product.mrp ? parseFloat(product.mrp) : null,
                    quantity: 1,
                    stock: product.stock_quantity,
                    image_path: product.image_path
                }];
            }
        });
    }, []);

    const updateQuantity = useCallback((productId, newQty) => {
        if (newQty <= 0) {
            setCart(prev => prev.filter(item => item.product_id !== productId));
            return;
        }
        setCart(prev => prev.map(item => {
            if (item.product_id === productId) {
                if (newQty > item.stock) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    }, []);

    // Discount Code Logic
    const handleApplyDiscountCode = async () => {
        if (!discountCode.trim()) return;
        setIsValidatingCode(true);
        try {
            const response = await api.post('/discount-codes/validate', {
                code: discountCode,
                order_total: subtotal
            });
            setAppliedDiscountCode(response.data);
            setDiscountCode('');
        } catch (err) {
            alert(err.response?.data?.error || t('pos.errors.invalid_discount'));
            setAppliedDiscountCode(null);
        } finally {
            setIsValidatingCode(false);
        }
    };

    // Calculations
    const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

    // Regional Logic: VAT only for AED
    const vatRate = currency === 'AED' ? 0.05 : 0;
    const vatValue = useMemo(() => subtotal * vatRate, [subtotal, vatRate]);

    // Manual Discount Calculation
    const manualDiscountValue = useMemo(() => {
        if (discountType === 'percent') {
            return (subtotal * discount) / 100;
        }
        return discount;
    }, [subtotal, discount, discountType]);

    // Total Discount (Manual + Applied Code)
    const totalDiscount = useMemo(() => {
        let total = manualDiscountValue;
        if (appliedDiscountCode) {
            total += appliedDiscountCode.discount_amount;
        }
        return total;
    }, [manualDiscountValue, appliedDiscountCode]);

    const grandTotal = useMemo(() => Math.max(0, subtotal + vatValue - totalDiscount), [subtotal, vatValue, totalDiscount]);
    const dueAmount = useMemo(() => Math.max(0, grandTotal - paidAmount), [grandTotal, paidAmount]);

    // Auto-fill paid amount when total changes (if not partial)
    useEffect(() => {
        if (paidAmount === 0 || paidAmount > 0) {
            // We don't auto-reset to allow partial entry, but we can have a button to mark as fully paid
        }
    }, [grandTotal]);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const response = await api.post('/invoices', {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                customer_name: customerName || t('pos.customer_name_default'),
                customer_phone: customerPhone,
                customer_email: customerEmail,
                customer_address: customerAddress,
                discount: totalDiscount,
                paid_amount: paidAmount || grandTotal, // Default to grand total if 0
                payment_method: paymentMethod,
                discount_code: appliedDiscountCode?.code?.code
            });
            setInvoice(response.data);
            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setCustomerEmail('');
            setCustomerAddress('');
            setDiscount(0);
            setPaidAmount(0);
            setAppliedDiscountCode(null);
        } catch (error) {
            alert(error.response?.data?.error || t('pos.errors.checkout_failed'));
        } finally {
            setLoading(false);
        }
    };

    const resetPOS = () => {
        setInvoice(null);
        setCart([]);
        setAppliedDiscountCode(null);
        setPaidAmount(0);
    };

    if (invoice) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-300 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl max-w-sm w-full text-center">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-900">{t('pos.complete_transaction')}</h2>
                    <p className="text-slate-500 mt-1 font-bold">#{invoice.invoice_number}</p>

                    <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{t('pos.grand_total')}</span>
                            <span className="text-slate-900">{currency} {parseFloat(invoice.grand_total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span>{t('pos.paid')}</span>
                            <span className="text-emerald-600">{currency} {parseFloat(invoice.paid_amount).toFixed(2)}</span>
                        </div>
                        {parseFloat(invoice.due_amount) > 0 && (
                            <div className="flex justify-between items-center text-[10px] font-black text-red-400 uppercase tracking-widest">
                                <span>{t('pos.due')}</span>
                                <span className="text-red-600">{currency} {parseFloat(invoice.due_amount).toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={async () => {
                                try {
                                    const res = await api.get(`/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
                                    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                    window.open(url, '_blank');
                                } catch (err) {
                                    alert(t('invoices.errors.download_failed'));
                                }
                            }}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                        >
                            <Printer className="w-4 h-4" /> {t('pos.print_receipt')}
                        </button>
                        <button className="w-full py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all" onClick={resetPOS}>
                            {t('pos.new_transaction')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        {/* ══════ DESKTOP LAYOUT ══════ */}
        <div className={`hidden lg:flex h-screen overflow-hidden bg-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Center Area: Product Section */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200">
                {/* Top Header & Search */}
                <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                            <input
                                type="text"
                                placeholder={t('pos.search_placeholder')}
                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 outline-none transition-all font-medium`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {t('pos.all_categories')}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-5">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                currency={currency}
                                isRTL={isRTL}
                                onAdd={addToCart}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Area: Billing Panel */}
            <div className="w-[420px] flex flex-col bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.04)] z-20">
                {/* Invoice Metadata */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/80">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pos.transaction_id')}</p>
                            <p className="text-sm font-black text-slate-900">#{mockInvoiceNum}</p>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-500 justify-end">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-xs font-black text-slate-900 tabular-nums">{currentTime.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <div className="relative">
                            <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                            <input
                                type="text"
                                placeholder={t('pos.customer_name')}
                                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 shadow-sm transition-all`}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="relative">
                                <Plus className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                                <input
                                    type="text"
                                    placeholder={t('pos.customer_phone')}
                                    className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 shadow-sm transition-all`}
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <AlertCircle className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                                <input
                                    type="email"
                                    placeholder={t('pos.customer_email')}
                                    className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 shadow-sm transition-all`}
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="relative">
                            <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                            <input
                                type="text"
                                placeholder="Complete Delivery Address"
                                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 shadow-sm transition-all`}
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Cart + Summary — single scrollable area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    {/* Cart Items */}
                    <div className="p-4 space-y-4">
                        {cart.map(item => (
                            <div key={item.product_id} className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl items-center hover:border-blue-200 transition-colors group">
                                <div className="w-12 h-12 rounded-lg bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden">
                                    {item.image_path ? (
                                        <img src={getImageUrl(item.image_path)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                            <Package className="w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate mb-0.5">{item.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-400 font-medium">{currency} {item.price.toFixed(2)}</p>
                                        {item.mrp && item.mrp > item.price && (
                                            <p className="text-[9px] text-slate-300 line-through tabular-nums">{currency} {item.mrp.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 transition-colors">
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-xs font-black text-slate-900 tabular-nums">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm hover:text-blue-600 transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="w-20 text-right">
                                    <p className="text-xs font-black text-slate-900 tabular-nums">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                                <ShoppingCart className="w-16 h-16 mb-4 opacity-10" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pos.empty_cart')}</p>
                            </div>
                        )}
                    </div>

                    {/* Summary Section */}
                    <div className="p-6 pt-0 space-y-4 bg-white mt-auto">
                        <div className="space-y-2 pt-5 border-t border-slate-100">
                            {/* Subtotal */}
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('pos.subtotal')}</span>
                                <span className="text-xs font-black text-slate-900 tabular-nums">{currency} {subtotal.toFixed(2)}</span>
                            </div>

                            {/* VAT */}
                            {currency === 'AED' && (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{t('pos.vat')}</span>
                                    <span className="text-xs font-black text-blue-600 tabular-nums">+{currency} {vatValue.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Manual Discount */}
                            <div className="flex justify-between items-center gap-4 px-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('pos.discount')}</span>
                                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                        <button
                                            onClick={() => setDiscountType('amount')}
                                            className={`p-1 rounded-md transition-all ${discountType === 'amount' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Banknote className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => setDiscountType('percent')}
                                            className={`p-1 rounded-md transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Percent className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1 bg-slate-50 group-focus-within:border-blue-400 transition-all">
                                    <input
                                        type="number"
                                        className="w-16 bg-transparent text-right outline-none font-black text-xs text-slate-900 tabular-nums"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="text-[10px] text-slate-400 font-black uppercase">{discountType === 'percent' ? '%' : currency}</span>
                                </div>
                            </div>

                            {/* Discount Code Input */}
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <Ticket className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                                    <input
                                        type="text"
                                        placeholder={t('pos.discount_code')}
                                        className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-400 transition-all`}
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                    />
                                </div>
                                <button
                                    onClick={handleApplyDiscountCode}
                                    disabled={!discountCode.trim() || isValidatingCode}
                                    className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-200 transition-all"
                                >
                                    {isValidatingCode ? '...' : t('pos.apply')}
                                </button>
                            </div>
                            {appliedDiscountCode && (
                                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                        <span className="text-[10px] font-black text-emerald-700 uppercase">{appliedDiscountCode.code.code}</span>
                                    </div>
                                    <button onClick={() => setAppliedDiscountCode(null)} className="text-emerald-400 hover:text-emerald-600">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Paid / Due Section (Restored) */}
                        <div className="pt-2">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('pos.paid_amount')}</p>
                                    <div className="relative group">
                                        <Banknote className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors`} />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-xs font-black text-emerald-700 outline-none focus:border-emerald-400 focus:bg-white transition-all tabular-nums`}
                                            value={paidAmount || ''}
                                            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('pos.balance_due')}</p>
                                    <div className={`w-full px-4 py-2 rounded-2xl border text-xs font-black tabular-nums h-9 flex items-center transition-all ${dueAmount > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                        {currency} {dueAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grand Total - Compact Design */}
                        <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-700"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pos.grand_total')}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-slate-500 tabular-nums">{currency}</span>
                                    <h2 className="text-3xl font-black tracking-tighter tabular-nums">{grandTotal.toFixed(2)}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Payment & Final Action */}
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
                                {[
                                    { id: 'cash', icon: Wallet, label: t('pos.payment_methods.cash') },
                                    { id: 'card', icon: CreditCard, label: t('pos.payment_methods.card') },
                                    { id: 'digital', icon: QrCode, label: t('pos.payment_methods.digital') }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-300 ${paymentMethod === method.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <method.icon className="w-4 h-4 mb-1" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || loading}
                                className="group w-full py-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                            >
                                {loading ? '...' : t('pos.complete_transaction')}
                                {!loading && <ChevronRight className={`w-5 h-5 opacity-40 transition-transform ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* ══════ MOBILE LAYOUT ══════ */}
        <div className={`lg:hidden flex flex-col h-screen bg-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {mobileTab === 'products' ? (
                /* ── Mobile Products View ── */
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Search & Categories */}
                    <div className="p-3 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-3">
                        <div className="relative">
                            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                            <input
                                type="text"
                                placeholder={t('pos.search_placeholder')}
                                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-400 outline-none transition-all font-medium`}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                            >
                                {t('pos.all_categories')}
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
                        <div className="grid grid-cols-2 gap-3">
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    currency={currency}
                                    isRTL={isRTL}
                                    onAdd={addToCart}
                                    t={t}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Floating Cart Button */}
                    {cart.length > 0 && (
                        <button
                            onClick={() => setMobileTab('cart')}
                            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                                {cart.reduce((sum, i) => sum + i.quantity, 0)}
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                /* ── Mobile Cart/Billing View ── */
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Back to Products */}
                    <div className="p-3 border-b border-slate-200 bg-white sticky top-0 z-10 flex items-center gap-3">
                        <button
                            onClick={() => setMobileTab('products')}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                            <ChevronRight className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
                        </button>
                        <div>
                            <p className="text-sm font-black text-slate-900">{t('pos.cart')} ({cart.reduce((s, i) => s + i.quantity, 0)})</p>
                            <p className="text-[10px] font-bold text-slate-400">#{mockInvoiceNum}</p>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="p-3 border-b border-slate-100 space-y-2">
                        <div className="relative">
                            <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                            <input
                                type="text"
                                placeholder={t('pos.customer_name')}
                                className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all`}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                placeholder={t('pos.customer_phone')}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                            />
                            <input
                                type="email"
                                placeholder={t('pos.customer_email')}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="Complete Delivery Address"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-400 transition-all"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                    </div>

                    {/* Cart Items + Summary — scrollable */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Cart Items */}
                        <div className="p-3 space-y-2">
                            {cart.map(item => (
                                <div key={item.product_id} className="flex gap-3 p-2.5 bg-white border border-slate-100 rounded-xl items-center">
                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden">
                                        {item.image_path ? (
                                            <img src={getImageUrl(item.image_path)} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <Package className="w-5 h-5" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-bold text-slate-900 truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{currency} {item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-5 text-center text-[11px] font-black tabular-nums">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md shadow-sm">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 tabular-nums w-16 text-right">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                            {cart.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                                    <ShoppingCart className="w-12 h-12 mb-3 opacity-10" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pos.empty_cart')}</p>
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="p-3 space-y-3">
                            <div className="space-y-2 pt-3 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('pos.subtotal')}</span>
                                    <span className="text-xs font-black text-slate-900 tabular-nums">{currency} {subtotal.toFixed(2)}</span>
                                </div>
                                {currency === 'AED' && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">{t('pos.vat')}</span>
                                        <span className="text-xs font-black text-blue-600 tabular-nums">+{currency} {vatValue.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('pos.discount')}</span>
                                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                                            <button onClick={() => setDiscountType('amount')} className={`p-1 rounded-md transition-all ${discountType === 'amount' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>
                                                <Banknote className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => setDiscountType('percent')} className={`p-1 rounded-md transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>
                                                <Percent className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-1 bg-slate-50">
                                        <input
                                            type="number"
                                            className="w-14 bg-transparent text-right outline-none font-black text-xs text-slate-900 tabular-nums"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        />
                                        <span className="text-[10px] text-slate-400 font-black uppercase">{discountType === 'percent' ? '%' : currency}</span>
                                    </div>
                                </div>
                                {/* Discount Code */}
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Ticket className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400`} />
                                        <input
                                            type="text"
                                            placeholder={t('pos.discount_code')}
                                            className={`w-full ${isRTL ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-blue-400 transition-all`}
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyDiscountCode}
                                        disabled={!discountCode.trim() || isValidatingCode}
                                        className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-200 transition-all"
                                    >
                                        {isValidatingCode ? '...' : t('pos.apply')}
                                    </button>
                                </div>
                                {appliedDiscountCode && (
                                    <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-[10px] font-black text-emerald-700 uppercase">{appliedDiscountCode.code.code}</span>
                                        </div>
                                        <button onClick={() => setAppliedDiscountCode(null)} className="text-emerald-400 hover:text-emerald-600">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Paid / Due */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('pos.paid_amount')}</p>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs font-black text-emerald-700 outline-none focus:border-emerald-400 tabular-nums"
                                        value={paidAmount || ''}
                                        onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('pos.balance_due')}</p>
                                    <div className={`w-full px-3 py-2 rounded-xl border text-xs font-black tabular-nums flex items-center ${dueAmount > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                        {currency} {dueAmount.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            {/* Grand Total */}
                            <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl relative overflow-hidden">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('pos.grand_total')}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-bold text-slate-500 tabular-nums">{currency}</span>
                                        <h2 className="text-2xl font-black tracking-tighter tabular-nums">{grandTotal.toFixed(2)}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method & Checkout */}
                            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60">
                                {[
                                    { id: 'cash', icon: Wallet, label: t('pos.payment_methods.cash') },
                                    { id: 'card', icon: CreditCard, label: t('pos.payment_methods.card') },
                                    { id: 'digital', icon: QrCode, label: t('pos.payment_methods.digital') }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${paymentMethod === method.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400'}`}
                                    >
                                        <method.icon className="w-4 h-4 mb-0.5" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || loading}
                                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/10"
                            >
                                {loading ? '...' : t('pos.complete_transaction')}
                                {!loading && <ChevronRight className={`w-5 h-5 opacity-40 ${isRTL ? 'rotate-180' : ''}`} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
};

export default POS;


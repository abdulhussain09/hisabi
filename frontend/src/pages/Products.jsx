import React, { useState, useEffect } from 'react';
import api, { IMAGE_BASE_URL, getImageUrl } from '../api/axios';
import { formatCurrency } from '../utils/currencyUtils';
import { Plus, Edit, Trash2, Search, X, Package, Upload, FolderPlus, ArrowLeft, Tag, Pencil, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

/* ─── Category Modal ──────────────────────────────────────────────── */
const CategoryModal = ({ onClose, onCreated }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.post('/categories', { name: name.trim() });
            onCreated();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || t('categories.errors.create_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-md">
                <div className="modal-header">
                    <h2 className="modal-title">{t('categories.new')}</h2>
                    <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div>
                            <label className="form-label">{t('categories.name')}</label>
                            <input
                                type="text"
                                required
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('categories.placeholder')}
                                className="input-field"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost flex-1">{t('common.cancel')}</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? t('categories.creating') : t('categories.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Product Form Modal ──────────────────────────────────────────── */
const ProductModal = ({ editingProduct, categoryId, onClose, onSuccess, currency, isAdmin }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        cost_price: 0,
        selling_price: 0,
        mrp: 0,
        stock_quantity: 0,
        tax_category: 'standard',
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (editingProduct) {
            setFormData({
                name: editingProduct.name,
                barcode: editingProduct.barcode || '',
                cost_price: editingProduct.cost_price,
                selling_price: editingProduct.selling_price,
                mrp: editingProduct.mrp || 0,
                stock_quantity: editingProduct.stock_quantity,
                tax_category: editingProduct.tax_category || 'standard',
            });
            setPreviewUrl(editingProduct.image_path ? getImageUrl(editingProduct.image_path) : null);
        }
    }, [editingProduct]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('barcode', formData.barcode);
            data.append('cost_price', formData.cost_price);
            data.append('selling_price', formData.selling_price);
            data.append('mrp', formData.mrp || 0);
            data.append('stock_quantity', formData.stock_quantity);
            data.append('tax_category', formData.tax_category || 'standard');
            if (categoryId) data.append('category_id', categoryId);
            if (selectedFile) data.append('image', selectedFile);

            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, data);
            } else {
                await api.post('/products', data);
            }
            onSuccess();
            onClose();
        } catch (err) {
            alert(err.response?.data?.error || t('common.error'));
        }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="modal-header sticky top-0 bg-white z-10">
                    <h2 className="modal-title">{editingProduct ? t('products.edit') : t('products.new')}</h2>
                    <button onClick={onClose} className="btn-icon"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {/* Image upload */}
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative flex-shrink-0">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <Upload className="h-7 w-7 text-slate-300" />
                                )}
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-700">{t('products.image')}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{t('products.upload_photo')}</p>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">{t('products.name')}</label>
                            <input className="input-field" type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('products.name_placeholder')} />
                        </div>
                        <div>
                            <label className="form-label">{t('products.barcode')}</label>
                            <input className="input-field" type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder={t('products.barcode_placeholder')} />
                        </div>
                        <div>
                            <label className="form-label">{t('products.stock')}</label>
                            <input className="input-field" type="number" required value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">{t('products.cost')}</label>
                                <input className="input-field" type="number" step="0.001" required value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })} />
                            </div>
                            <div>
                                <label className="form-label">{t('products.selling')}</label>
                                <input className="input-field" type="number" step="0.001" required value={formData.selling_price} onChange={(e) => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <label className="form-label">{t('products.mrp')}</label>
                            <input className="input-field" type="number" step="0.001" value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) })} placeholder="Maximum Retail Price" />
                        </div>
                        <div>
                            <label className="form-label">Tax Category</label>
                            <select
                                className="input-field"
                                value={formData.tax_category || 'standard'}
                                onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
                            >
                                <option value="standard">Standard Tax (5% UAE / 18% IN)</option>
                                <option value="zero_rated">Zero-Rated (0%)</option>
                                <option value="exempt">Exempt (0%)</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-ghost flex-1">{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary flex-1">
                            {editingProduct ? t('common.save') : t('common.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProductTable = ({ products, isAdmin, currency, onEdit, onDelete }) => {
    const { t } = useTranslation();
    return (
        <div className="overflow-x-auto">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>{t('common.name')}</th>
                        <th>{t('products.barcode')}</th>
                        <th className="text-right">{t('common.price')}</th>
                        <th className="text-right">{t('products.mrp')}</th>
                        {isAdmin && <th className="text-right">{t('products.cost')}</th>}
                        <th className="text-center">{t('products.stock')}</th>
                        {isAdmin && <th className="text-right">{t('common.actions')}</th>}
                    </tr>
                </thead>
                <tbody>
                    {products.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 7 : 5}>
                                <div className="empty-state">
                                    <div className="empty-icon"><Package className="w-5 h-5" /></div>
                                    <p className="empty-title">{t('products.no_products')}</p>
                                    <p className="empty-sub">{t('products.empty_sub')}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        products.map((product) => (
                            <tr key={product.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                            {product.image_path ? (
                                                <img src={getImageUrl(product.image_path)} alt={product.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = ''; }} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-blue-600 font-black text-xs bg-blue-50">
                                                    {product.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{product.name}</span>
                                    </div>
                                </td>
                                <td><span className="font-mono text-xs text-gray-400">{product.barcode || '—'}</span></td>
                                <td className="text-right font-bold text-gray-900">{formatCurrency(product.selling_price, currency, true)}</td>
                                <td className="text-right">
                                    {product.mrp ? (
                                        <span className="text-xs text-gray-400 line-through decoration-red-400">{formatCurrency(product.mrp, currency, true)}</span>
                                    ) : <span className="text-gray-300">—</span>}
                                </td>
                                {isAdmin && <td className="text-right text-gray-500">{formatCurrency(product.cost_price, currency, true)}</td>}
                                <td>
                                    <div className="flex justify-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${product.stock_quantity > 6 ? 'bg-emerald-50 text-emerald-700' :
                                            product.stock_quantity > 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {product.stock_quantity > 6 ? `${product.stock_quantity} ${t('pos.stock.in_stock')}` :
                                                product.stock_quantity > 0 ? `${t('pos.stock.low_stock')}: ${product.stock_quantity}` : t('pos.stock.out_of_stock')}
                                        </span>
                                    </div>
                                </td>
                                {isAdmin && (
                                    <td>
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => onEdit(product)} className="btn-icon"><Edit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => onDelete(product.id)} className="btn p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

/* ─── Category View ───────────────────────────────────────────────── */
const CategoryView = ({ category, isAdmin, currency, onBack }) => {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?category_id=${category.id}&search=${search}`);
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch category products', err);
        }
    };

    useEffect(() => { fetchProducts(); }, [category.id, search]);

    const handleDelete = async (id) => {
        if (!window.confirm(t('products.delete_confirm'))) return;
        try { await api.delete(`/products/${id}`); fetchProducts(); } catch { alert(t('products.errors.delete_failed')); }
    };

    const openEdit = (product) => { setEditingProduct(product); setIsProductModalOpen(true); };
    const openAdd = () => { setEditingProduct(null); setIsProductModalOpen(true); };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div className="page-title-group">
                    <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors flex-shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="page-icon bg-blue-600"><Tag className="w-5 h-5" /></div>
                    <div>
                        <h1 className="page-title">{category.name}</h1>
                        <p className="page-subtitle">{t('products.category_subtitle')}</p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={openAdd} className="btn-primary flex-shrink-0">
                        <Plus className="w-4 h-4" /> {t('products.add_new')}
                    </button>
                )}
            </div>

            {/* Search + Table */}
            <div className="card overflow-hidden">
                <div className="px-5 pt-4 pb-3 border-b border-slate-50">
                    <div className="relative">
                        <Search className="input-icon" />
                        <input className="input-with-icon text-sm" placeholder={t('products.search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <ProductTable products={products} isAdmin={isAdmin} currency={currency} onEdit={openEdit} onDelete={handleDelete} />
            </div>

            {isProductModalOpen && (
                <ProductModal
                    editingProduct={editingProduct}
                    categoryId={category.id}
                    onClose={() => setIsProductModalOpen(false)}
                    onSuccess={fetchProducts}
                    currency={currency}
                    isAdmin={isAdmin}
                />
            )}
        </div>
    );
};

/* ─── Main Products Page ──────────────────────────────────────────── */
const Products = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const isAdmin = user?.role === 'admin';
    const currency = user?.shop?.currency;
    const currentPlan = user?.shop?.plan || 'free';
    const isFreePlan = currentPlan === 'free';

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [renamingCatId, setRenamingCatId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const startRename = (cat, e) => { e.stopPropagation(); setRenamingCatId(cat.id); setRenameValue(cat.name); };
    const saveRename = async (catId, e) => {
        e.stopPropagation();
        if (!renameValue.trim()) return;
        try { await api.put(`/categories/${catId}`, { name: renameValue.trim() }); fetchCategories(); }
        catch (err) { alert(err.response?.data?.error || t('categories.errors.update_failed')); }
        finally { setRenamingCatId(null); }
    };
    const cancelRename = (e) => { e.stopPropagation(); setRenamingCatId(null); };

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?search=${search}`);
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    useEffect(() => { fetchProducts(); }, [search]);
    useEffect(() => { fetchCategories(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm(t('products.delete_confirm'))) return;
        try { await api.delete(`/products/${id}`); fetchProducts(); } catch { alert(t('products.errors.delete_failed')); }
    };

    const openEdit = (product) => { setEditingProduct(product); setIsProductModalOpen(true); };
    const openAdd = () => { setEditingProduct(null); setIsProductModalOpen(true); };

    // Count products per category from the flat list
    const countForCategory = (catId) => products.filter(p => p.category_id === catId).length;
    // Uncategorized products shown on main dashboard
    const uncategorizedProducts = products.filter(p => !p.category_id);

    if (selectedCategory) {
        return (
            <CategoryView
                category={selectedCategory}
                isAdmin={isAdmin}
                currency={currency}
                onBack={() => setSelectedCategory(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Dashboard Header ── */}
            <div className="page-header">
                <div className="page-title-group">
                    <div className="page-icon bg-slate-900"><Package className="w-5 h-5" /></div>
                    <div>
                        <h1 className="page-title">{t('nav.inventory')}</h1>
                        <p className="page-subtitle">{products.length} {t('nav.products')} · {categories.length} {t('nav.categories')}</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="btn-ghost"
                        >
                            <FolderPlus className="w-4 h-4" /> {t('categories.title')}
                        </button>
                        <button onClick={openAdd} className="btn-primary">
                            <Plus className="w-4 h-4" /> {t('products.add_new')}
                        </button>
                    </div>
                )}
            </div>

            {/* ── Plan Limit Warning (Free only) ── */}
            {isFreePlan && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${products.length >= 45 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-900">
                                {products.length}/50 Products Used
                            </p>
                            <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                <div
                                    className={`h-full transition-all ${products.length >= 45 ? 'bg-red-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(100, (products.length / 50) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPricingModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                    >
                        Upgrade for Unlimited Products
                    </button>
                </div>
            )}



            {/* ── Category Cards ── */}
            {
                categories.length > 0 && (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">{t('categories.title')}</h2>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="relative flex-shrink-0 group"
                                >
                                    {/* Admin action buttons overlay */}
                                    {isAdmin && (
                                        <>
                                            {/* Delete */}
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!window.confirm(t('categories.delete_confirm', { name: cat.name }))) return;
                                                    try {
                                                        await api.delete(`/categories/${cat.id}`);
                                                        fetchCategories();
                                                        fetchProducts();
                                                    } catch (err) {
                                                        alert(err.response?.data?.error || t('categories.errors.delete_failed'));
                                                    }
                                                }}
                                                className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete category"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                            {/* Rename */}
                                            <button
                                                onClick={(e) => startRename(cat, e)}
                                                className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200 shadow-sm transition-all opacity-0 group-hover:opacity-100"
                                                title="Rename category"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        </>
                                    )}
                                    {/* Card body */}
                                    {renamingCatId === cat.id ? (
                                        <div className="flex flex-col items-center gap-2 px-4 py-4 bg-blue-50 border-2 border-blue-300 rounded-2xl min-w-[140px]" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={renameValue}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveRename(cat.id, e); if (e.key === 'Escape') cancelRename(e); }}
                                                className="w-full text-sm font-bold text-center bg-white border border-blue-200 rounded-xl px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                            />
                                            <div className="flex gap-1.5">
                                                <button onClick={e => saveRename(cat.id, e)} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check className="w-3 h-3" /></button>
                                                <button onClick={cancelRename} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"><X className="w-3 h-3" /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedCategory(cat)}
                                            className="flex flex-col items-center justify-center gap-2 px-5 py-4 bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-2xl transition-all min-w-[110px] group/catbtn"
                                        >
                                            <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover/catbtn:bg-blue-600 group-hover/catbtn:text-white transition-all">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 group-hover/catbtn:text-blue-700 text-center leading-tight">{cat.name}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">{countForCategory(cat.id)} {t('common.items')}</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* ── Search + Product Table (uncategorized) ── */}
            <div className="card overflow-hidden">
                <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-4 border-b border-slate-50">
                    {categories.length > 0 && (
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('products.uncategorized')}</span>
                    )}
                    <div className="relative flex-1 max-w-xs ml-auto">
                        <Search className="input-icon" />
                        <input
                            className="input-with-icon text-sm"
                            placeholder={t('products.search_placeholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <ProductTable
                    products={categories.length > 0 ? uncategorizedProducts : products}
                    isAdmin={isAdmin}
                    currency={currency}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                />
            </div>

            {/* ── Modals ── */}
            {
                isCategoryModalOpen && (
                    <CategoryModal
                        onClose={() => setIsCategoryModalOpen(false)}
                        onCreated={fetchCategories}
                    />
                )
            }
            {
                isProductModalOpen && (
                    <ProductModal
                        editingProduct={editingProduct}
                        categoryId={null}
                        onClose={() => setIsProductModalOpen(false)}
                        onSuccess={fetchProducts}
                        currency={currency}
                        isAdmin={isAdmin}
                    />
                )
            }
        </div >
    );
};

export default Products;

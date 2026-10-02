import React, { useState, useEffect } from 'react';
import { getCountryConfig } from '../../config/countryConfig';
import { calculateInvoice } from '../../utils/invoiceCalculationEngine';
import InvoiceRenderer from './InvoiceRenderer';
import {
    Plus, Trash2, Copy, Save, X, Eye, Edit3, AlertCircle,
    CheckCircle2, DollarSign, User, Package, FileText, Sparkles
} from 'lucide-react';

const InvoiceEditor = ({ initialInvoice = {}, shop = {}, onSave, onCancel }) => {
    const country = initialInvoice.country || shop.country || 'AE';
    const countryConfig = getCountryConfig(country);

    const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
    const [invoiceData, setInvoiceData] = useState({
        invoice_number: initialInvoice.invoice_number || 1,
        date: initialInvoice.date || new Date().toISOString(),
        supply_date: initialInvoice.supply_date || '',
        payment_method: initialInvoice.payment_method || 'cash',
        finance_company: initialInvoice.finance_company || '',
        reverse_charge: Boolean(initialInvoice.reverse_charge),
        customer_name: initialInvoice.customer_name || 'Walk-in Customer',
        customer_phone: initialInvoice.customer_phone || '',
        customer_email: initialInvoice.customer_email || '',
        customer_address: initialInvoice.customer_address || '',
        buyer_tax_id: initialInvoice.buyer_tax_id || '',
        place_of_supply_state: initialInvoice.place_of_supply_state || '',
        place_of_supply_code: initialInvoice.place_of_supply_code || '',
        discount: initialInvoice.discount || 0,
        paid_amount: initialInvoice.paid_amount || 0,
        notes: initialInvoice.notes || '',
        declaration: initialInvoice.declaration || '',
        items: (initialInvoice.items || []).map(item => ({
            product_id: item.product_id || null,
            item_name: item.item_name || item.Product?.name || 'Item',
            item_description: item.item_description || item.Product?.description || '',
            sku: item.sku || item.Product?.barcode || '',
            hsn_sac: item.hsn_sac || '',
            unit: item.unit || 'PCS',
            unit_price: parseFloat(item.unit_price || 0),
            inventory_price: parseFloat(item.Product?.selling_price || item.unit_price || 0),
            cost_price: parseFloat(item.cost_price || 0),
            mrp: item.mrp ? parseFloat(item.mrp) : (item.Product?.mrp ? parseFloat(item.Product.mrp) : null),
            quantity: item.quantity || 1,
            discount: parseFloat(item.discount || 0),
            tax_rate: parseFloat(item.tax_rate || 0),
            tax_category: item.tax_category || item.Product?.tax_category || 'standard',
            is_custom_item: Boolean(item.is_custom_item || !item.product_id)
        }))
    });

    const [saveToCustomerMaster, setSaveToCustomerMaster] = useState(false);

    // Dynamic Live Calculation
    const calculation = calculateInvoice({
        items: invoiceData.items,
        shop: { ...shop, country },
        globalDiscount: invoiceData.discount,
        paidAmount: invoiceData.paid_amount,
        sellerState: shop.address || '',
        buyerState: invoiceData.place_of_supply_state || invoiceData.customer_address || '',
        reverseCharge: invoiceData.reverse_charge
    });

    const handleItemChange = (index, field, value) => {
        setInvoiceData(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const handleAddItem = () => {
        setInvoiceData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    product_id: null,
                    item_name: 'Custom Service / Product',
                    item_description: '',
                    sku: '',
                    hsn_sac: '',
                    unit: 'PCS',
                    unit_price: 0,
                    inventory_price: 0,
                    cost_price: 0,
                    mrp: null,
                    quantity: 1,
                    discount: 0,
                    tax_rate: countryConfig.supportsTax ? 0.05 : 0,
                    tax_category: 'standard',
                    is_custom_item: true
                }
            ]
        }));
    };

    const handleRemoveItem = (index) => {
        setInvoiceData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleDuplicateItem = (index) => {
        setInvoiceData(prev => {
            const itemToCopy = prev.items[index];
            return {
                ...prev,
                items: [...prev.items, { ...itemToCopy, is_custom_item: itemToCopy.is_custom_item }]
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...invoiceData,
            totals: calculation.totals,
            saveToCustomerMaster
        });
    };

    return (
        <div className="bg-slate-100 min-h-screen p-4 md:p-6 animate-fade-in">
            {/* Header bar */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Edit3 className="w-5 h-5 text-blue-600" />
                        Invoice Editor #{String(invoiceData.invoice_number).padStart(5, '0')}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                        Modify items, prices, discounts, and customer information for this invoice
                    </p>
                </div>

                {/* Mobile Tab Toggle */}
                <div className="flex md:hidden bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                    >
                        Preview
                    </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-black shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Invoice Changes
                    </button>
                </div>
            </div>

            {/* Main Split Layout */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Editor Form Controls */}
                <div className={`lg:col-span-6 space-y-6 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
                    {/* Customer Info Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-blue-600" /> Customer Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    value={invoiceData.customer_name}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, customer_name: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={invoiceData.customer_phone}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, customer_phone: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={invoiceData.customer_email}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, customer_email: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">{countryConfig.fields.buyerTaxIdLabel}</label>
                                <input
                                    type="text"
                                    value={invoiceData.buyer_tax_id}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, buyer_tax_id: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="font-bold text-slate-700 block mb-1">Billing Address</label>
                                <textarea
                                    rows={2}
                                    value={invoiceData.customer_address}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, customer_address: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <input
                                type="checkbox"
                                id="saveToCustomerMaster"
                                checked={saveToCustomerMaster}
                                onChange={e => setSaveToCustomerMaster(e.target.checked)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                            />
                            <label htmlFor="saveToCustomerMaster" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                Save updates to Customer Directory (Master Record)
                            </label>
                        </div>
                    </div>

                    {/* Items Editor Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                <Package className="w-4 h-4 text-blue-600" /> Line Items ({invoiceData.items.length})
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Custom Item
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                            {invoiceData.items.map((item, idx) => {
                                const isPriceOverridden = item.inventory_price > 0 && item.unit_price !== item.inventory_price;

                                return (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 relative group">
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    value={item.item_name}
                                                    onChange={e => handleItemChange(idx, 'item_name', e.target.value)}
                                                    placeholder="Item Name"
                                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDuplicateItem(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
                                                    title="Duplicate Line Item"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Remove Line Item"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {isPriceOverridden && (
                                            <div className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                                Invoice Price Override: Master Price is {item.inventory_price} | Invoice Price is {item.unit_price} (Inventory master will not change)
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 text-center"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit Price</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={e => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Discount</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={item.discount}
                                                    onChange={e => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 text-right"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Unit</label>
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900 outline-none focus:border-blue-500 text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Totals & Discounts Card */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <DollarSign className="w-4 h-4 text-blue-600" /> Invoice Discounts & Payments
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                                <select
                                    value={invoiceData.payment_method}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, payment_method: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="digital">Digital / UPI</option>
                                    <option value="finance">Finance / EMI / Loan</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="knet">KNET</option>
                                </select>
                            </div>
                            {invoiceData.payment_method === 'finance' && (
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">Finance Company Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Bajaj Finance, Emirates NBD Finance"
                                        value={invoiceData.finance_company}
                                        onChange={e => setInvoiceData(prev => ({ ...prev, finance_company: e.target.value }))}
                                        className="w-full px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl font-bold text-slate-900 outline-none focus:border-violet-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Invoice-Level Discount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={invoiceData.discount}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Paid Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={invoiceData.paid_amount}
                                    onChange={e => setInvoiceData(prev => ({ ...prev, paid_amount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Live A4 Document Preview */}
                <div className={`lg:col-span-6 ${activeTab === 'edit' ? 'hidden lg:block' : 'block'}`}>
                    <div className="sticky top-6">
                        <div className="bg-slate-800 text-white px-4 py-2 rounded-t-2xl flex justify-between items-center text-xs font-bold">
                            <span className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-blue-400" /> Live Invoice A4 Preview
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Real-time Parity</span>
                        </div>
                        <div className="bg-slate-200/60 p-4 rounded-b-2xl max-h-[80vh] overflow-y-auto shadow-inner">
                            <InvoiceRenderer
                                invoice={{
                                    ...invoiceData,
                                    items: calculation.items,
                                    discount: invoiceData.discount,
                                    paid_amount: invoiceData.paid_amount
                                }}
                                shop={shop}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;

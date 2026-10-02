const Joi = require('joi');
const { Op } = require('sequelize');
const { sequelize } = require('../../../database/database');
const { Shop, Product, Invoice, InvoiceItem, InvoiceRevision, BundleItem, Customer, StockAdjustment } = require('../../../database/models');

const { calculateInvoice } = require('../utils/invoiceCalculationEngine');
const { getCountryConfig, resolveIndianState } = require('../config/countryConfig');

// ─── Inline ZATCA-compliant GCC/UAE TLV Base64 Encoder ──────────────────────
function generateGCC_TLV_Base64({ sellerName, vatNumber, timestamp, invoiceTotal, vatTotal }) {
    function encodeTLV(tag, value) {
        const valueBytes = Buffer.from(value, 'utf8');
        return Buffer.concat([Buffer.from([tag]), Buffer.from([valueBytes.length]), valueBytes]);
    }
    const dt = timestamp instanceof Date ? timestamp.toISOString() : new Date().toISOString();
    const tlvBuffer = Buffer.concat([
        encodeTLV(1, String(sellerName || '')),
        encodeTLV(2, String(vatNumber || '')),
        encodeTLV(3, dt),
        encodeTLV(4, parseFloat(invoiceTotal || 0).toFixed(2)),
        encodeTLV(5, parseFloat(vatTotal || 0).toFixed(2))
    ]);
    return tlvBuffer.toString('base64');
}

const invoiceSchema = Joi.object({
    idempotency_key: Joi.string().allow('', null),
    expected_version: Joi.number().integer().min(1).optional(),
    customer_name: Joi.string().allow('', null),
    customer_phone: Joi.string().allow('', null),
    customer_email: Joi.string().allow('', null).email(),
    customer_address: Joi.string().allow('', null),
    customer_id: Joi.string().uuid().allow('', null),
    buyer_tax_id: Joi.string().allow('', null),
    place_of_supply_state: Joi.string().allow('', null),
    place_of_supply_code: Joi.string().allow('', null),
    reverse_charge: Joi.boolean().default(false),
    payment_method: Joi.string().allow('', null).default('cash'),
    finance_company: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
    declaration: Joi.string().allow('', null),
    discount: Joi.number().min(0).default(0),
    paid_amount: Joi.number().min(0).required(),
    saveToCustomerMaster: Joi.boolean().optional(),
    items: Joi.array().items(
        Joi.object({
            product_id: Joi.string().uuid().allow('', null),
            item_name: Joi.string().allow('', null),
            item_description: Joi.string().allow('', null),
            sku: Joi.string().allow('', null),
            hsn_sac: Joi.string().allow('', null),
            unit: Joi.string().allow('', null).default('PCS'),
            unit_price: Joi.number().min(0).optional(),
            cost_price: Joi.number().min(0).optional(),
            mrp: Joi.number().min(0).allow(null).optional(),
            discount: Joi.number().min(0).default(0),
            tax_rate: Joi.number().min(0).optional(),
            tax_category: Joi.string().allow('', null).default('standard'),
            is_custom_item: Joi.boolean().optional(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required()
});

const createInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const shop_id = req.user.shop_id;
        const user_id = req.user.id;
        const {
            idempotency_key,
            items,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            buyer_tax_id,
            place_of_supply_state,
            place_of_supply_code,
            reverse_charge,
            payment_method,
            finance_company,
            notes,
            declaration,
            discount,
            paid_amount
        } = req.body;

        // Idempotency check to prevent duplicate invoice submission
        if (idempotency_key) {
            const existingInvoice = await Invoice.findOne({
                where: { shop_id, idempotency_key },
                include: [{ model: InvoiceItem, as: 'items', include: [Product] }]
            });
            if (existingInvoice) {
                await t.rollback();
                return res.status(200).json(existingInvoice);
            }
        }

        // Fetch Shop details
        const shop = await Shop.findByPk(shop_id);
        if (!shop) {
            await t.rollback();
            return res.status(404).json({ error: 'Shop not found' });
        }

        // Monthly Invoice Quota Limit Check
        const { getPlanLimits } = require('../middleware/planMiddleware');
        const planLimits = getPlanLimits(shop.plan);
        const invoicesPerMonthLimit = planLimits.invoicesPerMonth || Infinity;

        if (invoicesPerMonthLimit !== Infinity) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const monthlyCount = await Invoice.count({
                where: {
                    shop_id,
                    created_at: { [Op.gte]: startOfMonth }
                },
                transaction: t
            });

            if (monthlyCount >= invoicesPerMonthLimit) {
                await t.rollback();
                return res.status(403).json({
                    error: 'Monthly Invoice Limit Reached',
                    limit: invoicesPerMonthLimit,
                    used: monthlyCount,
                    message: `Limit of ${invoicesPerMonthLimit} invoices reached for this month on the ${shop.plan.toUpperCase()} plan.`
                });
            }
        }

        // Process items & validate/deduct stock via StockAdjustment ledger
        const processedItems = [];
        for (const item of items) {
            let product = null;
            if (item.product_id) {
                product = await Product.findOne({
                    where: { id: item.product_id, shop_id },
                    include: [{ model: BundleItem, as: 'bundleItems' }],
                    transaction: t
                });

                if (!product) {
                    await t.rollback();
                    return res.status(404).json({ error: `Product not found: ${item.product_id}` });
                }

                if (product.is_bundle) {
                    for (const bundleItem of product.bundleItems) {
                        const component = await Product.findByPk(bundleItem.product_id, { transaction: t });
                        const requiredQty = bundleItem.quantity * item.quantity;

                        if (component.stock_quantity < requiredQty) {
                            await t.rollback();
                            return res.status(400).json({ error: `Insufficient stock for bundle component: ${component.name}` });
                        }

                        // Deduct component stock & record StockAdjustment ledger entry
                        await component.update({
                            stock_quantity: component.stock_quantity - requiredQty
                        }, { transaction: t });

                        await StockAdjustment.create({
                            shop_id,
                            product_id: component.id,
                            quantity_change: -requiredQty,
                            type: 'remove',
                            reason: `Invoice sale (Bundle Component: ${product.name})`,
                            adjusted_by: user_id
                        }, { transaction: t });
                    }
                } else {
                    if (product.stock_quantity < item.quantity) {
                        await t.rollback();
                        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
                    }

                    await product.update({
                        stock_quantity: product.stock_quantity - item.quantity
                    }, { transaction: t });

                    await StockAdjustment.create({
                        shop_id,
                        product_id: product.id,
                        quantity_change: -item.quantity,
                        type: 'remove',
                        reason: 'Invoice sale',
                        adjusted_by: user_id
                    }, { transaction: t });
                }
            }

            processedItems.push({
                product_id: product ? product.id : null,
                item_name: item.item_name || (product ? product.name : 'Custom Item'),
                item_description: item.item_description || (product ? product.description : ''),
                sku: item.sku || (product ? product.barcode : ''),
                hsn_sac: item.hsn_sac || '',
                unit: item.unit || 'PCS',
                unit_price: item.unit_price !== undefined ? parseFloat(item.unit_price) : (product ? parseFloat(product.selling_price) : 0),
                cost_price: item.cost_price !== undefined ? parseFloat(item.cost_price) : (product ? parseFloat(product.cost_price) : 0),
                mrp: item.mrp !== undefined ? (item.mrp ? parseFloat(item.mrp) : null) : (product && product.mrp ? parseFloat(product.mrp) : null),
                quantity: parseInt(item.quantity),
                discount: parseFloat(item.discount || 0),
                tax_category: item.tax_category || (product ? product.tax_category : 'standard'),
                tax_rate: item.tax_rate !== undefined ? parseFloat(item.tax_rate) : undefined,
                is_custom_item: Boolean(!product || item.is_custom_item)
            });
        }

        // Run Authoritative Calculation Engine
        const calculation = calculateInvoice({
            items: processedItems,
            shop,
            globalDiscount: discount || 0,
            paidAmount: paid_amount || 0,
            sellerState: shop.address || '',
            buyerState: place_of_supply_state || customer_address || '',
            reverseCharge: Boolean(reverse_charge)
        });

        const { items: calcItems, totals, meta } = calculation;

        // Customer auto-link / creation
        let customerRecord = null;
        const searchConditions = [];
        if (customer_phone && customer_phone.trim()) searchConditions.push({ phone: customer_phone.trim() });
        if (customer_email && customer_email.trim()) searchConditions.push({ email: customer_email.trim() });

        if (searchConditions.length > 0) {
            customerRecord = await Customer.findOne({
                where: { shop_id, [Op.or]: searchConditions },
                transaction: t
            });
        }

        const effectiveCustomerName = (customer_name && customer_name.trim()) ? customer_name.trim() : 'Walk-in Customer';

        if (customerRecord) {
            const updates = {};
            if (effectiveCustomerName !== 'Walk-in Customer' && customerRecord.name !== effectiveCustomerName) updates.name = effectiveCustomerName;
            if (customer_phone && customer_phone.trim() && customerRecord.phone !== customer_phone.trim()) updates.phone = customer_phone.trim();
            if (customer_email && customer_email.trim() && customerRecord.email !== customer_email.trim()) updates.email = customer_email.trim();
            if (customer_address && customer_address.trim() && customerRecord.address !== customer_address.trim()) updates.address = customer_address.trim();

            if (Object.keys(updates).length > 0) {
                await customerRecord.update(updates, { transaction: t });
            }
        } else if (effectiveCustomerName !== 'Walk-in Customer' || (customer_phone && customer_phone.trim()) || (customer_email && customer_email.trim())) {
            customerRecord = await Customer.create({
                shop_id,
                name: effectiveCustomerName,
                phone: customer_phone ? customer_phone.trim() : null,
                email: customer_email ? customer_email.trim() : null,
                address: customer_address ? customer_address.trim() : null
            }, { transaction: t });
        }

        // Next invoice number
        const lastInvoice = await Invoice.findOne({
            where: { shop_id },
            order: [['invoice_number', 'DESC']]
        });
        const nextInvoiceNumber = lastInvoice ? lastInvoice.invoice_number + 1 : 1;

        // GCC TLV Base64 QR Generation (specifically required for UAE / GCC compliance)
        let qr_code_data = null;
        if (meta.country === 'AE') {
            qr_code_data = generateGCC_TLV_Base64({
                sellerName: shop.name,
                vatNumber: shop.trn,
                timestamp: new Date(),
                invoiceTotal: totals.grand_total,
                vatTotal: totals.tax_total
            });
        }

        // Create Invoice
        const invoice = await Invoice.create({
            shop_id,
            user_id,
            idempotency_key: idempotency_key || null,
            invoice_number: nextInvoiceNumber,
            country: meta.country,
            currency: meta.currency,
            tax_mode: meta.tax_mode,
            invoice_type: 'tax_invoice',
            lifecycle_status: 'finalized',
            version_number: 1,
            subtotal: totals.gross_subtotal,
            tax_total: totals.tax_total,
            grand_total: totals.grand_total,
            discount: totals.global_discount,
            paid_amount: totals.paid_amount,
            due_amount: totals.due_amount,
            status: totals.due_amount <= 0 ? 'paid' : 'partial',
            customer_name: effectiveCustomerName,
            customer_phone: customer_phone ? customer_phone.trim() : null,
            customer_email: customer_email ? customer_email.trim() : null,
            customer_address: customer_address ? customer_address.trim() : (customerRecord ? customerRecord.address : null),
            customer_id: customerRecord ? customerRecord.id : null,
            buyer_tax_id: buyer_tax_id ? buyer_tax_id.trim() : null,
            place_of_supply_state: (place_of_supply_state || place_of_supply_code) ? resolveIndianState(place_of_supply_state, place_of_supply_code).state : null,
            place_of_supply_code: (place_of_supply_state || place_of_supply_code) ? resolveIndianState(place_of_supply_state, place_of_supply_code).code : null,
            reverse_charge: meta.is_reverse_charge,
            payment_method: payment_method || 'cash',
            finance_company: finance_company ? finance_company.trim() : null,
            notes: notes || shop.invoice_notes || null,
            declaration: declaration || shop.invoice_declaration || null,
            seller_name_snapshot: shop.name,
            seller_address_snapshot: shop.address,
            seller_phone_snapshot: shop.phone,
            seller_email_snapshot: shop.email,
            seller_tax_id_snapshot: shop.trn || shop.gstin || shop.cr_number,
            seller_cr_number_snapshot: shop.cr_number || null,
            seller_logo_snapshot: shop.brand_logo || null,
            bank_details_snapshot: (shop.bank_name || shop.bank_account_number) ? {
                bank_name: shop.bank_name || '',
                account_number: shop.bank_account_number || '',
                iban_ifsc: shop.bank_iban_ifsc || ''
            } : null,
            qr_code_data: qr_code_data || (shop.country === 'IN' && shop.upi_id ? `upi://pay?pa=${shop.upi_id}&pn=${encodeURIComponent(shop.name)}&am=${totals.grand_total}&cu=INR` : null)
        }, { transaction: t });

        // Bulk create InvoiceItems with full snapshot columns
        const itemsToCreate = calcItems.map(item => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            item_name: item.item_name,
            item_description: item.item_description,
            sku: item.sku,
            hsn_sac: item.hsn_sac,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost_price: item.cost_price,
            mrp: item.mrp,
            discount: item.discount,
            taxable_amount: item.taxable_amount,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            cgst_amount: item.cgst_amount,
            sgst_amount: item.sgst_amount,
            igst_amount: item.igst_amount,
            line_total: item.line_total,
            is_custom_item: item.is_custom_item
        }));

        await InvoiceItem.bulkCreate(itemsToCreate, { transaction: t });

        await t.commit();

        const completeInvoice = await Invoice.findOne({
            where: { id: invoice.id },
            include: [{ model: InvoiceItem, as: 'items', include: [Product] }]
        });

        res.status(201).json(completeInvoice);
    } catch (error) {
        await t.rollback();
        console.error('Create Invoice Error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
};

// PUT /api/invoices/:id — Edit / Revise Invoice with Optimistic Concurrency & Stock Delta Tracking
const updateInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const shop_id = req.user.shop_id;
        const user_id = req.user.id;
        const { id } = req.params;
        const {
            expected_version,
            items,
            customer_name,
            customer_phone,
            customer_email,
            customer_address,
            buyer_tax_id,
            place_of_supply_state,
            place_of_supply_code,
            reverse_charge,
            payment_method,
            notes,
            declaration,
            discount,
            paid_amount,
            saveToCustomerMaster
        } = req.body;

        const invoice = await Invoice.findOne({
            where: { id, shop_id },
            include: [{ model: InvoiceItem, as: 'items' }],
            transaction: t
        });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Optimistic Concurrency Check
        if (expected_version !== undefined && invoice.version_number !== expected_version) {
            await t.rollback();
            return res.status(409).json({
                error: 'Conflict: Invoice was modified by another user. Reload latest data before saving.',
                current_version: invoice.version_number
            });
        }

        const shop = await Shop.findByPk(shop_id, { transaction: t });

        // Save Current Snapshot into InvoiceRevision table before updating
        await InvoiceRevision.create({
            invoice_id: invoice.id,
            revision_number: invoice.version_number,
            changed_by: user_id,
            changes_summary: { reason: 'Invoice edited', timestamp: new Date() },
            snapshot_data: invoice.toJSON()
        }, { transaction: t });

        // Process stock deltas between old items and new items
        const oldItemsMap = new Map();
        for (const oldItem of invoice.items) {
            if (oldItem.product_id) {
                oldItemsMap.set(oldItem.product_id, (oldItemsMap.get(oldItem.product_id) || 0) + oldItem.quantity);
            }
        }

        const newItemsMap = new Map();
        const processedItems = [];

        for (const item of items) {
            let product = null;
            if (item.product_id) {
                product = await Product.findOne({ where: { id: item.product_id, shop_id }, transaction: t });
                if (product) {
                    newItemsMap.set(product.id, (newItemsMap.get(product.id) || 0) + parseInt(item.quantity));
                }
            }

            processedItems.push({
                product_id: product ? product.id : null,
                item_name: item.item_name || (product ? product.name : 'Custom Item'),
                item_description: item.item_description || (product ? product.description : ''),
                sku: item.sku || (product ? product.barcode : ''),
                hsn_sac: item.hsn_sac || '',
                unit: item.unit || 'PCS',
                unit_price: parseFloat(item.unit_price || 0),
                cost_price: parseFloat(item.cost_price || 0),
                mrp: item.mrp ? parseFloat(item.mrp) : (product && product.mrp ? parseFloat(product.mrp) : null),
                quantity: parseInt(item.quantity),
                discount: parseFloat(item.discount || 0),
                tax_category: item.tax_category || (product ? product.tax_category : 'standard'),
                tax_rate: item.tax_rate !== undefined ? parseFloat(item.tax_rate) : undefined,
                is_custom_item: Boolean(!product || item.is_custom_item)
            });
        }

        // Apply Stock Deltas via StockAdjustment ledger
        const allProductIds = new Set([...oldItemsMap.keys(), ...newItemsMap.keys()]);
        for (const prodId of allProductIds) {
            const oldQty = oldItemsMap.get(prodId) || 0;
            const newQty = newItemsMap.get(prodId) || 0;
            const delta = newQty - oldQty;

            if (delta !== 0) {
                const targetProd = await Product.findOne({ where: { id: prodId, shop_id }, transaction: t });
                if (targetProd) {
                    const updatedStock = targetProd.stock_quantity - delta;
                    if (updatedStock < 0) {
                        await t.rollback();
                        return res.status(400).json({ error: `Insufficient stock for product: ${targetProd.name}` });
                    }

                    await targetProd.update({ stock_quantity: updatedStock }, { transaction: t });
                    await StockAdjustment.create({
                        shop_id,
                        product_id: targetProd.id,
                        quantity_change: -delta,
                        type: delta > 0 ? 'remove' : 'add',
                        reason: `Invoice #${invoice.invoice_number} revision stock adjustment`,
                        adjusted_by: user_id
                    }, { transaction: t });
                }
            }
        }

        // Run Authoritative Calculation Engine
        const country = invoice.country || shop.country || 'AE';
        const calculation = calculateInvoice({
            items: processedItems,
            shop: { ...shop, country },
            globalDiscount: discount || 0,
            paidAmount: paid_amount || 0,
            sellerState: shop.address || '',
            buyerState: place_of_supply_state || customer_address || '',
            reverseCharge: Boolean(reverse_charge)
        });

        const { items: calcItems, totals, meta } = calculation;

        // Optionally update Customer Master directory
        if (saveToCustomerMaster && invoice.customer_id) {
            const cust = await Customer.findOne({ where: { id: invoice.customer_id, shop_id }, transaction: t });
            if (cust) {
                await cust.update({
                    name: customer_name || cust.name,
                    phone: customer_phone || cust.phone,
                    email: customer_email || cust.email,
                    address: customer_address || cust.address
                }, { transaction: t });
            }
        }

        // Delete existing items and recreate new calculation items
        await InvoiceItem.destroy({ where: { invoice_id: id }, transaction: t });

        const itemsToCreate = calcItems.map(item => ({
            invoice_id: invoice.id,
            product_id: item.product_id,
            item_name: item.item_name,
            item_description: item.item_description,
            sku: item.sku,
            hsn_sac: item.hsn_sac,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            cost_price: item.cost_price,
            mrp: item.mrp,
            discount: item.discount,
            taxable_amount: item.taxable_amount,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            cgst_amount: item.cgst_amount,
            sgst_amount: item.sgst_amount,
            igst_amount: item.igst_amount,
            line_total: item.line_total,
            is_custom_item: item.is_custom_item
        }));

        await InvoiceItem.bulkCreate(itemsToCreate, { transaction: t });

        // Update Invoice record
        const nextVersion = invoice.version_number + 1;
        await invoice.update({
            lifecycle_status: 'revised',
            version_number: nextVersion,
            subtotal: totals.gross_subtotal,
            tax_total: totals.tax_total,
            grand_total: totals.grand_total,
            discount: totals.global_discount,
            paid_amount: totals.paid_amount,
            due_amount: totals.due_amount,
            status: totals.due_amount <= 0 ? 'paid' : 'partial',
            customer_name: customer_name || invoice.customer_name,
            customer_phone: customer_phone || invoice.customer_phone,
            customer_email: customer_email || invoice.customer_email,
            customer_address: customer_address || invoice.customer_address,
            buyer_tax_id: buyer_tax_id !== undefined ? buyer_tax_id : invoice.buyer_tax_id,
            place_of_supply_state: (place_of_supply_state !== undefined ? place_of_supply_state : invoice.place_of_supply_state) || null,
            place_of_supply_code: (place_of_supply_code !== undefined ? place_of_supply_code : (place_of_supply_state ? resolveIndianState(place_of_supply_state).code : invoice.place_of_supply_code)) || null,
            reverse_charge: meta.is_reverse_charge,
            payment_method: payment_method || invoice.payment_method,
            notes: notes || invoice.notes,
            declaration: declaration || invoice.declaration
        }, { transaction: t });

        await t.commit();

        const updatedInvoice = await Invoice.findOne({
            where: { id: invoice.id },
            include: [{ model: InvoiceItem, as: 'items', include: [Product] }]
        });

        res.json(updatedInvoice);
    } catch (error) {
        await t.rollback();
        console.error('Update Invoice Error:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
};

const listInvoices = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const shop = await Shop.findByPk(shop_id);
        let where = { shop_id };

        const { getPlanLimits } = require('../middleware/planMiddleware');
        const { historyMonths } = getPlanLimits(shop.plan);

        if (historyMonths !== Infinity) {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - historyMonths);
            where.created_at = { [Op.gte]: cutoffDate };
        }

        const invoices = await Invoice.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']],
            include: [{ model: InvoiceItem, as: 'items', include: [Product] }]
        });

        res.json({
            data: invoices.rows,
            meta: {
                total: invoices.count,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('List Invoices Error:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
};

const getInvoice = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            where: { id, shop_id },
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [{ model: Product, attributes: ['name', 'barcode', 'selling_price'] }]
                },
                {
                    model: InvoiceRevision,
                    as: 'revisions',
                    required: false
                }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get Invoice Error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
};

const { generateInvoicePDF } = require('../services/pdfService');

const downloadInvoicePDF = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            where: { id, shop_id },
            include: [
                {
                    model: InvoiceItem,
                    as: 'items',
                    include: [{ model: Product, attributes: ['name'] }]
                }
            ]
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const shop = await Shop.findByPk(shop_id);
        const pdfBuffer = await generateInvoicePDF(invoice, shop);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
            'Content-Length': pdfBuffer.length
        });

        res.send(pdfBuffer);
    } catch (error) {
        console.error('Download PDF Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

const deleteInvoice = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const shop_id = req.user.shop_id;
        const user_id = req.user.id;
        const { id } = req.params;

        const invoice = await Invoice.findOne({
            where: { id, shop_id },
            include: [{ model: InvoiceItem, as: 'items' }],
            transaction: t
        });

        if (!invoice) {
            await t.rollback();
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Restore stock and log StockAdjustment
        for (const item of invoice.items) {
            if (item.product_id) {
                const product = await Product.findOne({
                    where: { id: item.product_id, shop_id },
                    include: [{ model: BundleItem, as: 'bundleItems' }],
                    transaction: t
                });

                if (product) {
                    if (product.is_bundle) {
                        for (const bundleItem of product.bundleItems) {
                            const component = await Product.findByPk(bundleItem.product_id, { transaction: t });
                            if (component) {
                                const restoreQty = bundleItem.quantity * item.quantity;
                                await component.update({
                                    stock_quantity: component.stock_quantity + restoreQty
                                }, { transaction: t });
                                await StockAdjustment.create({
                                    shop_id,
                                    product_id: component.id,
                                    quantity_change: restoreQty,
                                    type: 'add',
                                    reason: `Invoice #${invoice.invoice_number} deleted stock restoration`,
                                    adjusted_by: user_id
                                }, { transaction: t });
                            }
                        }
                    } else {
                        await product.update({
                            stock_quantity: product.stock_quantity + item.quantity
                        }, { transaction: t });
                        await StockAdjustment.create({
                            shop_id,
                            product_id: product.id,
                            quantity_change: item.quantity,
                            type: 'add',
                            reason: `Invoice #${invoice.invoice_number} deleted stock restoration`,
                            adjusted_by: user_id
                        }, { transaction: t });
                    }
                }
            }
        }

        await InvoiceItem.destroy({ where: { invoice_id: id }, transaction: t });
        await invoice.destroy({ transaction: t });

        await t.commit();
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        await t.rollback();
        console.error('Delete Invoice Error:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
};

const updatePayment = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const invoice = await Invoice.findOne({ where: { id, shop_id } });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (parseFloat(invoice.due_amount) <= 0) {
            return res.status(400).json({ error: 'Invoice is already fully paid' });
        }

        const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
        const newDueAmount = Math.max(0, parseFloat(invoice.grand_total) - newPaidAmount);
        const newStatus = newDueAmount <= 0 ? 'paid' : 'partial';

        await invoice.update({
            paid_amount: newPaidAmount,
            due_amount: newDueAmount,
            status: newStatus
        });

        res.json(invoice);
    } catch (error) {
        console.error('Update Payment Error:', error);
        res.status(500).json({ error: 'Failed to update payment' });
    }
};

const syncOfflineInvoices = async (req, res) => {
    try {
        const { offlineInvoices } = req.body;
        if (!Array.isArray(offlineInvoices) || offlineInvoices.length === 0) {
            return res.json({ synced: [], failed: [] });
        }

        const synced = [];
        const failed = [];

        for (const item of offlineInvoices) {
            try {
                const reqMock = {
                    user: req.user,
                    body: item.data
                };
                let resultData = null;
                const resMock = {
                    status: () => resMock,
                    json: (data) => { resultData = data; }
                };
                await createInvoice(reqMock, resMock);
                if (resultData && !resultData.error) {
                    synced.push({ client_id: item.client_id, invoice: resultData });
                } else {
                    failed.push({ client_id: item.client_id, error: resultData?.error || 'Sync failed' });
                }
            } catch (err) {
                failed.push({ client_id: item.client_id, error: err.message });
            }
        }

        res.json({ synced, failed });
    } catch (error) {
        console.error('Sync Offline Invoices Error:', error);
        res.status(500).json({ error: 'Failed to sync offline invoices' });
    }
};

module.exports = {
    createInvoice,
    updateInvoice,
    listInvoices,
    getInvoice,
    downloadInvoicePDF,
    deleteInvoice,
    updatePayment,
    syncOfflineInvoices,
    invoiceSchema
};

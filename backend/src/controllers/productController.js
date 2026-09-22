const Joi = require('joi');
const { sequelize } = require('../../../database/database');
const { Product, BundleItem, Shop } = require('../../../database/models');
const { Op } = require('sequelize');
const { getPlanLimits } = require('../middleware/planMiddleware');
const uploadMiddleware = require('../middleware/upload');

const productSchema = Joi.object({
    name: Joi.string().required(),
    barcode: Joi.string().allow('', null),
    cost_price: Joi.number().min(0).required(),
    selling_price: Joi.number().min(0).required(),
    mrp: Joi.number().min(0).allow(null),
    stock_quantity: Joi.number().integer().min(0).required(),
    is_bundle: Joi.boolean().default(false),
    bundle_items: Joi.alternatives().try(
        Joi.array().items(
            Joi.object({
                product_id: Joi.string().uuid().required(),
                quantity: Joi.number().integer().min(1).required()
            })
        ),
        Joi.string().custom((value, helpers) => {
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) throw new Error();
                return parsed;
            } catch (e) {
                return helpers.error('any.invalid');
            }
        })
    ).when('is_bundle', { is: true, then: Joi.required() }).default([]),
    category_id: Joi.string().uuid().allow(null, '').optional(),
    image: Joi.any()
}).unknown(true);

const listProducts = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { search = '', category_id } = req.query;

        const where = {
            shop_id,
            [Op.or]: [
                { name: { [Op.iLike]: `%${search}%` } },
                { barcode: { [Op.iLike]: `%${search}%` } }
            ]
        };

        // Filter by category if provided; if 'uncategorized', fetch products with no category
        if (category_id === 'uncategorized') {
            where.category_id = null;
        } else if (category_id) {
            where.category_id = category_id;
        }

        const products = await Product.findAll({
            where,
            order: [['name', 'ASC']]
        });

        res.json(products);
    } catch (error) {
        console.error('List Products Error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
};

const getProduct = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;

        const product = await Product.findOne({ where: { id, shop_id } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Get Product Error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
};

const createProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const shop_id = req.user.shop_id;
        
        // Parse bundle_items if sent as string (multipart/form-data limitation)
        let { name, barcode, cost_price, selling_price, stock_quantity, mrp, is_bundle, bundle_items, category_id } = req.body;
        const image_path = req.file ? uploadMiddleware.processImageToDataUri(req.file, 'product') : null;

        if (typeof bundle_items === 'string') {
            try {
                bundle_items = JSON.parse(bundle_items);
            } catch (e) {
                bundle_items = [];
            }
        }

        // Ensure boolean conversion
        is_bundle = is_bundle === 'true' || is_bundle === true;

        // Check plan limits
        const shop = await Shop.findByPk(shop_id);
        const limits = getPlanLimits(shop.plan);
        const productCount = await Product.count({ where: { shop_id } });

        if (productCount >= limits.maxProducts) {
            await t.rollback();
            return res.status(403).json({
                error: 'Limit reached',
                message: `You have reached the limit of ${limits.maxProducts} products for the ${shop.plan} plan. Please upgrade to add more.`
            });
        }

        // Check barcode uniqueness within shop if provided
        if (barcode) {
            const existingProduct = await Product.findOne({
                where: { shop_id, barcode }
            });
            if (existingProduct) {
                await t.rollback();
                return res.status(400).json({ error: 'Barcode already exists in this shop' });
            }
        }

        const product = await Product.create({
            shop_id,
            name,
            barcode,
            cost_price,
            selling_price,
            stock_quantity: is_bundle ? 0 : stock_quantity, // Bundles don't have direct stock
            mrp,
            is_bundle,
            image_path,
            category_id: category_id || null
        }, { transaction: t });

        if (is_bundle && bundle_items && bundle_items.length > 0) {
            const items = bundle_items.map(item => ({
                bundle_id: product.id,
                product_id: item.product_id,
                quantity: item.quantity
            }));
            await BundleItem.bulkCreate(items, { transaction: t });

            // Auto-calculate cost price for bundle based on components if not provided or 0? 
            // For now, we assume user provides cost price or we could calc it. 
            // Let's stick to user input for simplicity unless requested otherwise.
        }

        await t.commit();
        res.status(201).json(product);
    } catch (error) {
        await t.rollback();
        console.error('Create Product Error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

const updateProduct = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;
        
        let { name, barcode, cost_price, selling_price, stock_quantity, mrp, is_bundle, bundle_items, category_id, remove_image } = req.body;
        let image_path = req.file ? uploadMiddleware.processImageToDataUri(req.file, 'product') : undefined;
        if (!req.file && (remove_image === 'true' || remove_image === true)) {
            image_path = null;
        }

        if (typeof bundle_items === 'string') {
            try {
                bundle_items = JSON.parse(bundle_items);
            } catch (e) {
                bundle_items = [];
            }
        }

        // Ensure boolean conversion if it comes as string
        if (is_bundle !== undefined) {
            is_bundle = is_bundle === 'true' || is_bundle === true;
        }

        const product = await Product.findOne({ where: { id, shop_id } });

        if (!product) {
            await t.rollback();
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check barcode uniqueness if changed
        if (barcode && barcode !== product.barcode) {
            const existingProduct = await Product.findOne({
                where: { shop_id, barcode }
            });
            if (existingProduct) {
                await t.rollback();
                return res.status(400).json({ error: 'Barcode already exists in this shop' });
            }
        }

        await product.update({
            name,
            barcode,
            cost_price,
            selling_price,
            stock_quantity: (is_bundle || product.is_bundle) ? 0 : stock_quantity,
            mrp,
            ...(is_bundle !== undefined && { is_bundle }),
            ...(image_path !== undefined && { image_path }),
            ...(category_id !== undefined && { category_id: category_id || null })
        }, { transaction: t });

        if ((is_bundle || product.is_bundle) && bundle_items) {
            // Replace bundle items
            await BundleItem.destroy({ where: { bundle_id: id }, transaction: t });
            if (bundle_items.length > 0) {
                const items = bundle_items.map(item => ({
                    bundle_id: id,
                    product_id: item.product_id,
                    quantity: item.quantity
                }));
                await BundleItem.bulkCreate(items, { transaction: t });
            }
        }

        await t.commit();
        res.json(product);
    } catch (error) {
        await t.rollback();
        console.error('Update Product Error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const { id } = req.params;

        const product = await Product.findOne({ where: { id, shop_id } });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.destroy();

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete Product Error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
};

module.exports = {
    listProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    productSchema
};

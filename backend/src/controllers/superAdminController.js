const {
    SuperAdmin, Advertisement, DiscountCode, sequelize,
    Shop, User, Product, Invoice, Announcement, ActivityLog
} = require('../../../database/models');
const { Op } = require('sequelize');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');
const uploadMiddleware = require('../middleware/upload');

// Helper for Activity Logging
const logActivity = async (adminUsername, action, category = 'SYSTEM', details = {}) => {
    try {
        await ActivityLog.create({
            admin_username: adminUsername,
            action,
            category,
            details
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
    }
};

const login = async (req, res) => {
    try {
        const { username, password, secret_key } = req.body;
        console.log(`[SuperAdminLogin] Attempt for username: "${username}"`);

        await SuperAdmin.sync({ alter: true });

        const admin = await SuperAdmin.findOne({
            where: sequelize.where(
                sequelize.fn('LOWER', sequelize.col('username')),
                sequelize.fn('LOWER', username)
            )
        });

        if (!admin) {
            return res.status(401).json({ error: 'Identity not recognized' });
        }

        const isPasswordMatch = await comparePassword(password, admin.password_hash);
        const isSecretKeyMatch = await comparePassword(secret_key, admin.secret_key_hash);

        if (!isPasswordMatch || !isSecretKeyMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken({ id: admin.id, role: 'super-admin', username: admin.username });

        await logActivity(admin.username, 'LOGIN', 'AUTH', { ip: req.ip });

        res.json({
            message: 'Super Admin login successful',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                role: 'super-admin'
            }
        });
    } catch (error) {
        console.error('Super Admin Login Error:', error);
        res.status(500).json({ error: 'Login connectivity issue.' });
    }
};

const checkSetupStatus = async (req, res) => {
    try {
        await SuperAdmin.sync({ alter: true });
        const count = await SuperAdmin.count();
        res.json({ isInitialized: count > 0 });
    } catch (error) {
        res.json({ isInitialized: false });
    }
};

const initializeSuperAdmin = async (req, res) => {
    try {
        const { username, password, secret_key, bootstrap_secret } = req.body;
        const masterSecret = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;

        if (!masterSecret) {
            return res.status(500).json({ error: 'SUPER_ADMIN_BOOTSTRAP_SECRET is not configured on the server.' });
        }

        if (bootstrap_secret !== masterSecret) {
            return res.status(403).json({ error: 'Master Bootstrap Secret is incorrect' });
        }

        await SuperAdmin.sync({ alter: true });
        const count = await SuperAdmin.count();
        if (count > 0) return res.status(403).json({ error: 'System already initialized' });

        const passwordHash = await hashPassword(password);
        const secretKeyHash = await hashPassword(secret_key);

        const admin = await SuperAdmin.create({
            username,
            password_hash: passwordHash,
            secret_key_hash: secretKeyHash
        });

        await logActivity(username, 'SYSTEM_INITIALIZATION', { message: 'First Super Admin created' });

        res.status(201).json({ message: 'Super Admin initialized successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to initialize system' });
    }
};

// --- NEW FEATURES ---

// 1. System Analytics
const getAnalytics = async (req, res) => {
    try {
        const [
            totalShops,
            activeShops,
            totalInvoices,
            totalProducts,
            revenueData
        ] = await Promise.all([
            Shop.count(),
            Shop.count({ where: { active: true } }),
            Invoice.count(),
            Product.count(),
            Invoice.sum('grand_total')
        ]);

        res.json({
            shops: { total: totalShops, active: activeShops },
            usage: { invoices: totalInvoices, products: totalProducts },
            revenue: parseFloat(revenueData || 0)
        });
    } catch (error) {
        console.error('System analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

const getHistoricalAnalytics = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let shopGrowth = await Shop.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        // Fallback to 365 days if no shops created in last 30 days
        if (shopGrowth.length === 0) {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            shopGrowth = await Shop.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                where: {
                    created_at: { [Op.gte]: oneYearAgo }
                },
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            });
        }

        let invoiceGrowth = await Invoice.findAll({
            attributes: [
                [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            },
            group: [sequelize.fn('DATE', sequelize.col('created_at'))],
            order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
        });

        // Fallback to 365 days if no invoices created in last 30 days
        if (invoiceGrowth.length === 0) {
            const oneYearAgo = new Date();
            oneYearAgo.setDate(oneYearAgo.getDate() - 365);
            invoiceGrowth = await Invoice.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                ],
                where: {
                    created_at: { [Op.gte]: oneYearAgo }
                },
                group: [sequelize.fn('DATE', sequelize.col('created_at'))],
                order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']]
            });
        }

        res.json({
            shops: shopGrowth,
            invoices: invoiceGrowth
        });
    } catch (error) {
        console.error('Historical analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch historical analytics' });
    }
};

// 2. Shop Management
const getAllShops = async (req, res) => {
    try {
        const shops = await Shop.findAll({
            attributes: [
                'id', 'name', 'email', 'phone', 'plan', 'active', 'created_at',
                [sequelize.literal('(SELECT COUNT(*) FROM products WHERE products.shop_id = "Shop".id)'), 'productCount'],
                [sequelize.literal('(SELECT COUNT(*) FROM invoices WHERE invoices.shop_id = "Shop".id)'), 'invoiceCount'],
                [sequelize.literal('(SELECT COUNT(*) FROM users WHERE users.shop_id = "Shop".id)'), 'staffCount']
            ],
            order: [['created_at', 'DESC']]
        });
        res.json(shops);
    } catch (error) {
        console.error('Fetch shops error:', error);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
};

const updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { active, plan } = req.body;
        const shop = await Shop.findByPk(id);
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const updateData = {};
        if (active !== undefined) updateData.active = active;
        if (plan !== undefined) updateData.plan = plan;

        console.log(`[SuperAdmin] Updating shop ${id}:`, updateData);
        await shop.update(updateData);

        await logActivity(req.superAdmin.username, 'UPDATE_SHOP', 'SHOP_MGMT', {
            shopId: id, shopName: shop.name, changes: updateData
        });

        res.json({ message: 'Shop updated successfully', shop });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shop' });
    }
};

// 3. Announcement Management
const getAnnouncements = async (req, res) => {
    try {
        const list = await Announcement.findAll({ order: [['created_at', 'DESC']] });
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { message, title, cta_link, cta_text, type, active, expires_at } = req.body;
        const announcement = await Announcement.create({
            message, title, cta_link, cta_text, type, active,
            expires_at: (expires_at === '' || expires_at === null) ? null : expires_at
        });
        await logActivity(req.superAdmin.username, 'CREATE_ANNOUNCEMENT', 'SYSTEM', { id: announcement.id });
        res.status(201).json(announcement);
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Failed to create announcement' });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, title, cta_link, cta_text, type, active, expires_at } = req.body;
        const announcement = await Announcement.findByPk(id);
        if (!announcement) return res.status(404).json({ error: 'Not found' });
        
        await announcement.update({
            message, title, cta_link, cta_text, type, active,
            expires_at: (expires_at === '' || expires_at === null) ? null : expires_at
        });
        await logActivity(req.superAdmin.username, 'UPDATE_ANNOUNCEMENT', 'SYSTEM', { id });
        res.json(announcement);
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ error: 'Failed to update announcement' });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.destroy({ where: { id } });
        await logActivity(req.superAdmin.username, 'DELETE_ANNOUNCEMENT', 'SYSTEM', { id });
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

// 4. Activity Logs
const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.findAll({
            limit: 100,
            order: [['created_at', 'DESC']]
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
};

// --- EXISTING AD/DISCOUNT FEATURES ---
const getAds = async (req, res) => {
    try {
        const ads = await Advertisement.findAll();
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const createAd = async (req, res) => {
    try {
        const adData = { ...req.body };
        if (req.file) {
            adData.image_url = uploadMiddleware.processImageToDataUri(req.file, 'ad');
        }
        if (adData.expires_at === '') adData.expires_at = null;
        
        const ad = await Advertisement.create(adData);
        await logActivity(req.superAdmin.username, 'CREATE_AD', 'AD_MGMT', { id: ad.id });
        res.status(201).json(ad);
    } catch (error) {
        console.error('Create ad error:', error);
        res.status(500).json({ error: 'Failed' });
    }
};

const updateAd = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await Advertisement.findByPk(id);
        if (!ad) return res.status(404).json({ error: 'Not found' });
        
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image_url = uploadMiddleware.processImageToDataUri(req.file, 'ad');
        }
        if (updateData.expires_at === '') updateData.expires_at = null;
        
        await ad.update(updateData);
        await logActivity(req.superAdmin.username, 'UPDATE_AD', 'AD_MGMT', { id });
        res.json(ad);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const deleteAd = async (req, res) => {
    try {
        const { id } = req.params;
        await Advertisement.destroy({ where: { id } });
        await logActivity(req.superAdmin.username, 'DELETE_AD', 'AD_MGMT', { id });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const getDiscounts = async (req, res) => {
    try {
        const discounts = await DiscountCode.findAll({ where: { shop_id: null }, order: [['created_at', 'DESC']] });
        res.json(discounts);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const validateDiscount = async (req, res) => {
    try {
        const { code, amount } = req.query; // Use query for GET
        if (!code) return res.status(400).json({ error: 'Code is required' });
        
        const result = await DiscountCode.validate(code, null, parseFloat(amount || 0));
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const createDiscount = async (req, res) => {
    try {
        const { code, type, value, min_order_amount, max_uses, expires_at, active } = req.body;
        const discount = await DiscountCode.create({
            code, type, value, 
            min_order_amount: min_order_amount || 0,
            max_uses: (max_uses === '' || max_uses === null) ? null : parseInt(max_uses),
            expires_at: (expires_at === '' || expires_at === null) ? null : expires_at,
            active,
            shop_id: null
        });
        await logActivity(req.superAdmin.username, 'CREATE_PLATFORM_DISCOUNT', 'DISCOUNT_MGMT', { code: discount.code });
        res.status(201).json(discount);
    } catch (error) {
        console.error('Create Discount Error:', error);
        res.status(500).json({ error: error.name === 'SequelizeUniqueConstraintError' ? 'Code already exists' : 'Failed' });
    }
};

const updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, type, value, min_order_amount, max_uses, expires_at, active } = req.body;
        const d = await DiscountCode.findOne({ where: { id, shop_id: null } });
        if (!d) return res.status(404).json({ error: 'Not found' });
        
        await d.update({
            code, type, value,
            min_order_amount: min_order_amount || 0,
            max_uses: (max_uses === '' || max_uses === null) ? null : parseInt(max_uses),
            expires_at: (expires_at === '' || expires_at === null) ? null : expires_at,
            active
        });
        await logActivity(req.superAdmin.username, 'UPDATE_PLATFORM_DISCOUNT', 'DISCOUNT_MGMT', { code: d.code });
        res.json(d);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

const deleteDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        await DiscountCode.destroy({ where: { id, shop_id: null } });
        await logActivity(req.superAdmin.username, 'DELETE_PLATFORM_DISCOUNT', 'DISCOUNT_MGMT', { id });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

module.exports = {
    login, checkSetupStatus, initializeSuperAdmin,
    getAnalytics, getHistoricalAnalytics, getAllShops, updateShop,
    getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
    getActivityLogs,
    getAds, createAd, updateAd, deleteAd,
    getDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount
};

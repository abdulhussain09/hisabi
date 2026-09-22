const Joi = require('joi');
const { sequelize } = require('../../../database/database');
const { Shop, User } = require('../../../database/models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');
const uploadMiddleware = require('../middleware/upload');

const registerSchema = Joi.object({
    shop_name: Joi.string().required(),
    address: Joi.string().allow('', null),
    trn: Joi.string().allow('', null),
    gstin: Joi.string().length(15).allow('', null),
    country: Joi.string().valid('AE', 'KW', 'IN').default('AE'),
    currency: Joi.string().valid('AED', 'KWD', 'INR').required(),
    vat_enabled: Joi.boolean().required(),
    gst_enabled: Joi.boolean().default(false),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).max(72).required()
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().max(72).required()
});

const createStaffSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).max(72).required()
});

const updateProfileSchema = Joi.object({
    username: Joi.string().min(3).max(30).allow('', null),
    password: Joi.string().min(6).max(72).allow('', null),
    shop_name: Joi.string().allow('', null),
    address: Joi.string().allow('', null),
    phone: Joi.string().allow('', null),
    email: Joi.string().email().allow('', null),
    trn: Joi.string().allow('', null),
    brand_logo: Joi.string().allow('', null),
    brand_color: Joi.string().allow('', null)
});

const register = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { shop_name, address, trn, gstin, country, currency, vat_enabled, gst_enabled, phone, email, username, password } = req.body;

        // Check if username exists globally
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if shop name exists
        const existingShop = await Shop.findOne({ where: { name: shop_name } });
        if (existingShop) {
            await t.rollback();
            return res.status(400).json({ error: 'Shop name already exists' });
        }

        // India-specific: validate phone format (+91 followed by 10-digit mobile number)
        if (country === 'IN' && phone) {
            const indianPhoneRegex = /^\+91[6-9]\d{9}$/;
            if (!indianPhoneRegex.test(phone)) {
                await t.rollback();
                return res.status(400).json({ error: 'Indian phone must be +91 followed by 10 digits (e.g. +919876543210)' });
            }
        }

        // Create Shop
        const shop = await Shop.create({
            name: shop_name,
            address,
            trn,
            gstin: gstin || null,
            country: country || 'AE',
            currency,
            vat_enabled,
            gst_enabled: gst_enabled || false,
            phone,
            email
        }, { transaction: t });

        // Hash Password
        const hashedPassword = await hashPassword(password);

        // Create Admin User
        const user = await User.create({
            shop_id: shop.id,
            username,
            password_hash: hashedPassword,
            role: 'admin'
        }, { transaction: t });

        await t.commit();

        // Generate Token
        const token = generateToken({ id: user.id, shop_id: shop.id, role: user.role });

        res.status(201).json({
            message: 'Shop registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                shop_id: shop.id
            },
            shop: {
                id: shop.id,
                name: shop.name,
                currency: shop.currency,
                country: shop.country,
                vat_enabled: shop.vat_enabled,
                gst_enabled: shop.gst_enabled,
                phone: shop.phone,
                email: shop.email,
                plan: shop.plan,
                brand_logo: shop.brand_logo,
                brand_color: shop.brand_color
            }
        });
    } catch (error) {
        await t.rollback();
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find User by username only
        const user = await User.findOne({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Find Shop associated with User
        const shop = await Shop.findByPk(user.shop_id);
        if (!shop) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check Password
        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if Shop is Active
        console.log(`[Login] Checking active status for Shop ${shop.id}: ${shop.active} (Type: ${typeof shop.active})`);
        if (shop.active === false || shop.active === 0 || shop.active === 'false') {
            console.warn(`[Login] Access denied for Shop ${shop.id}: Suspended`);
            return res.status(403).json({
                error: 'Account Suspended',
                message: 'Your shop access has been suspended. Please contact platform support.'
            });
        }

        // Generate Token
        const token = generateToken({ id: user.id, shop_id: shop.id, role: user.role });

        console.log(`[Login] Successful for ${username}. Shop Plan: ${shop.plan}, Active: ${shop.active}`);

        const responseData = {
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                shop_id: shop.id
            },
            shop: {
                id: shop.id,
                name: shop.name,
                currency: shop.currency,
                country: shop.country,
                vat_enabled: shop.vat_enabled,
                gst_enabled: shop.gst_enabled,
                phone: shop.phone,
                email: shop.email,
                plan: shop.plan,
                brand_logo: shop.brand_logo,
                brand_color: shop.brand_color
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

const createStaff = async (req, res) => {
    try {
        const { username, password } = req.body;
        const shop_id = req.user.shop_id;
        const { getPlanLimits } = require('../middleware/planMiddleware');
        const shop = await Shop.findByPk(shop_id);
        const { maxStaff } = getPlanLimits(shop.plan);

        // Enforce staff limit
        const currentStaffCount = await User.count({ where: { shop_id, role: 'staff' } });
        if (currentStaffCount >= maxStaff) {
            return res.status(403).json({
                error: 'Staff limit reached',
                message: `${shop.plan.charAt(0).toUpperCase() + shop.plan.slice(1)} plan allows only ${maxStaff} staff members. Upgrade to add more.`
            });
        }

        // Check if username exists globally
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const user = await User.create({
            shop_id,
            username,
            password_hash: hashedPassword,
            role: 'staff'
        });

        res.status(201).json({
            message: 'Staff created successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Create Staff Error:', error);
        res.status(500).json({ error: 'Failed to create staff' });
    }
};

const getStaff = async (req, res) => {
    try {
        const shop_id = req.user.shop_id;
        const staff = await User.findAll({
            where: { shop_id, role: 'staff' },
            attributes: ['id', 'username', 'role', 'created_at']
        });
        res.json(staff);
    } catch (error) {
        console.error('Get Staff Error:', error);
        res.status(500).json({ error: 'Failed to fetch staff' });
    }
};

const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const shop_id = req.user.shop_id;

        const user = await User.findOne({ where: { id, shop_id, role: 'staff' } });
        if (!user) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        await user.destroy();
        res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
        console.error('Delete Staff Error:', error);
        res.status(500).json({ error: 'Failed to delete staff' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user_id = req.user.id;
        const shop_id = req.user.shop_id;

        const user = await User.findByPk(user_id, {
            attributes: ['id', 'username', 'role']
        });
        const shop = await Shop.findByPk(shop_id);

        res.json({ user, shop });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, password, shop_name, address, phone, email, trn, brand_logo, brand_color } = req.body;
        const user_id = req.user.id;
        const shop_id = req.user.shop_id;
        const user_role = req.user.role;

        // Staff Restrictions: Only admins can update profiles
        if (user_role === 'staff') {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Staff members are not permitted to modify account settings. Please contact your administrator.'
            });
        }

        const user = await User.findByPk(user_id);
        const shop = await Shop.findByPk(shop_id);

        if (!user || !shop) {
            return res.status(404).json({ error: 'User or Shop not found' });
        }
        // The provided code snippet seems to be intended for a different controller (e.g., superAdminController)
        // as it references `req.superAdmin.username`, `id` (instead of `shop_id`), `active`, and `plan`
        // in a context that doesn't align with `authController.js`'s `updateProfile` function.
        // Applying it directly would result in a syntactically incorrect file due to undefined variables
        // and incorrect logic for this specific function.
        // Therefore, the requested change cannot be applied faithfully and correctly to this file.
        // If the intention was to add a log for profile updates, it would need to be adapted.
        // For example: console.log(`[Profile Update] User ${user_id} updated profile for shop ${shop_id}`);

        // Update User details
        if (username) user.username = username;
        if (password) {
            user.password_hash = await hashPassword(password);
        }
        await user.save();

        // Update Shop details
        if (shop_name) shop.name = shop_name;
        if (address !== undefined) shop.address = address;
        if (phone !== undefined) shop.phone = phone;
        if (email !== undefined) shop.email = email;
        if (trn !== undefined) shop.trn = trn;

        // Handle file upload for logo
        if (req.file) {
            shop.brand_logo = uploadMiddleware.processImageToDataUri(req.file, 'logo');
        } else if (brand_logo !== undefined) {
            shop.brand_logo = brand_logo;
        }

        if (brand_color !== undefined) shop.brand_color = brand_color;
        await shop.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            shop: {
                id: shop.id,
                name: shop.name,
                address: shop.address,
                phone: shop.phone,
                email: shop.email,
                trn: shop.trn,
                currency: shop.currency,
                country: shop.country,
                vat_enabled: shop.vat_enabled,
                gst_enabled: shop.gst_enabled,
                plan: shop.plan,
                brand_logo: shop.brand_logo,
                brand_color: shop.brand_color
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

module.exports = {
    register,
    login,
    createStaff,
    getStaff,
    deleteStaff,
    getProfile,
    updateProfile,
    registerSchema,
    loginSchema,
    createStaffSchema,
    updateProfileSchema
};

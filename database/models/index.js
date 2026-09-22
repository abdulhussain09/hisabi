const { sequelize } = require('../database');
const Shop = require('./Shop');
const User = require('./User');
const Product = require('./Product');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const BundleItem = require('./BundleItem');
const Category = require('./Category');
const Customer = require('./Customer');
const Supplier = require('./Supplier');
const Expense = require('./Expense');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const Return = require('./Return');
const StockAdjustment = require('./StockAdjustment');
const DiscountCode = require('./DiscountCode');
const SalesTarget = require('./SalesTarget');
const DuePayment = require('./DuePayment');
const SuperAdmin = require('./SuperAdmin');
const Advertisement = require('./Advertisement');
const Announcement = require('./Announcement');
const ActivityLog = require('./ActivityLog');

// ─── ALL ASSOCIATIONS (single source of truth) ────────────────────────
// ... (lines omitted for brevity, but I will target specific insertion points)

// Shop ↔ User
Shop.hasMany(User, { foreignKey: 'shop_id' });
User.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Shop ↔ Category
Shop.hasMany(Category, { foreignKey: 'shop_id' });
Category.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Shop ↔ Product
Shop.hasMany(Product, { foreignKey: 'shop_id' });
Product.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Category ↔ Product
Category.hasMany(Product, { foreignKey: 'category_id' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

// Bundle (Product self-ref via BundleItem)
Product.hasMany(BundleItem, { foreignKey: 'bundle_id', as: 'bundleItems', onDelete: 'CASCADE' });
BundleItem.belongsTo(Product, { foreignKey: 'bundle_id', as: 'bundle' });
Product.hasMany(BundleItem, { foreignKey: 'product_id', as: 'componentOf', onDelete: 'RESTRICT' });
BundleItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Shop ↔ Invoice
Shop.hasMany(Invoice, { foreignKey: 'shop_id' });
Invoice.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// User ↔ Invoice
User.hasMany(Invoice, { foreignKey: 'user_id' });
Invoice.belongsTo(User, { foreignKey: 'user_id' });

// Invoice ↔ InvoiceItem
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Product ↔ InvoiceItem
Product.hasMany(InvoiceItem, { foreignKey: 'product_id' });
InvoiceItem.belongsTo(Product, { foreignKey: 'product_id' });

// Shop ↔ Customer
Shop.hasMany(Customer, { foreignKey: 'shop_id' });
Customer.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Customer ↔ Invoice
Customer.hasMany(Invoice, { foreignKey: 'customer_id' });
Invoice.belongsTo(Customer, { foreignKey: 'customer_id', onDelete: 'SET NULL' });

// Shop ↔ Supplier
Shop.hasMany(Supplier, { foreignKey: 'shop_id' });
Supplier.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// Shop ↔ Expense
Shop.hasMany(Expense, { foreignKey: 'shop_id' });
Expense.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// PurchaseOrder
Shop.hasMany(PurchaseOrder, { foreignKey: 'shop_id' });
PurchaseOrder.belongsTo(Shop, { foreignKey: 'shop_id' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', onDelete: 'SET NULL' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'order_id' });
Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Return
Shop.hasMany(Return, { foreignKey: 'shop_id' });
Return.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
Product.hasMany(Return, { foreignKey: 'product_id' });
Return.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// StockAdjustment
Shop.hasMany(StockAdjustment, { foreignKey: 'shop_id' });
StockAdjustment.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
Product.hasMany(StockAdjustment, { foreignKey: 'product_id' });
StockAdjustment.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
User.hasMany(StockAdjustment, { foreignKey: 'adjusted_by' });
StockAdjustment.belongsTo(User, { foreignKey: 'adjusted_by', as: 'adjustedBy' });

// DiscountCode
Shop.hasMany(DiscountCode, { foreignKey: 'shop_id' });
DiscountCode.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// SalesTarget
Shop.hasMany(SalesTarget, { foreignKey: 'shop_id' });
SalesTarget.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });

// DuePayment
Shop.hasMany(DuePayment, { foreignKey: 'shop_id' });
DuePayment.belongsTo(Shop, { foreignKey: 'shop_id', onDelete: 'CASCADE' });
Invoice.hasMany(DuePayment, { foreignKey: 'invoice_id', as: 'payments', onDelete: 'CASCADE' });
DuePayment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

// Platform Discount Codes (no shop_id)
// We'll reuse DiscountCode model but make shop_id optional

// ─── Database Sync ────────────────────────────────────────────────────
const syncDatabase = async () => {
    try {
        // Pre-sync migrations: fix known column type issues before Sequelize alter runs
        try {
            // Fix: shops.plan VARCHAR -> ENUM cast (PostgreSQL cannot auto-cast default)
            await sequelize.query(`
                DO $$
                BEGIN
                    -- Only migrate if the column is still VARCHAR (not already an enum)
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'shops' AND column_name = 'plan'
                        AND data_type = 'character varying'
                    ) THEN
                        -- Ensure the enum type exists
                        BEGIN
                            CREATE TYPE "public"."enum_shops_plan" AS ENUM ('free', 'gold', 'premium');
                        EXCEPTION WHEN duplicate_object THEN NULL;
                        END;

                        -- Drop default, cast type, restore default
                        ALTER TABLE "shops" ALTER COLUMN "plan" DROP DEFAULT;
                        ALTER TABLE "shops" ALTER COLUMN "plan"
                            TYPE "public"."enum_shops_plan"
                            USING "plan"::"public"."enum_shops_plan";
                        ALTER TABLE "shops" ALTER COLUMN "plan"
                            SET DEFAULT 'free'::"public"."enum_shops_plan";
                        ALTER TABLE "shops" ALTER COLUMN "plan" SET NOT NULL;
                    END IF;
                END$$;
            `);
        } catch (e) {
            // Non-fatal: log and continue so server still starts
            console.warn('Pre-sync migration warning (plan enum):', e.message);
        }

        try {
            await sequelize.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_address TEXT;');
            await sequelize.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id UUID;');
        } catch { /* silent fallback */ }

        // Fix: drop duplicate unique index on users.username before Sequelize recreates it
        try {
            await sequelize.query('DROP INDEX IF EXISTS "users_username";');
        } catch { /* silent fallback */ }

        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};

module.exports = {
    sequelize, syncDatabase,
    Shop, User, Category, Product,
    Invoice, InvoiceItem, BundleItem,
    Customer, Supplier, Expense,
    PurchaseOrder, PurchaseOrderItem,
    Return, StockAdjustment, DiscountCode, SalesTarget, DuePayment,
    SuperAdmin, Advertisement, Announcement, ActivityLog
};

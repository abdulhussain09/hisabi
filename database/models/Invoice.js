const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Shop = require('./Shop');
const User = require('./User');

const Invoice = sequelize.define('Invoice', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Shop,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    invoice_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE, // TIMESTAMPTZ maps to DATE in Sequelize
        defaultValue: DataTypes.NOW
    },
    subtotal: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
    },
    tax_total: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    grand_total: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('paid', 'partial', 'void'),
        defaultValue: 'paid'
    },
    customer_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Walk-in Customer'
    },
    customer_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer_email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer_address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    customer_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    discount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    paid_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    due_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    qr_code_data: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(2),
        allowNull: true // Backfilled dynamically from shop during sync
    },
    currency: {
        type: DataTypes.STRING(10),
        allowNull: true // Backfilled dynamically from shop during sync
    },
    tax_mode: {
        type: DataTypes.STRING(10),
        allowNull: true // 'GST' | 'VAT' | 'NONE'
    },
    invoice_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'tax_invoice' // 'tax_invoice' | 'simplified'
    },
    lifecycle_status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'finalized' // 'draft' | 'generated' | 'finalized' | 'revised' | 'voided'
    },
    version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    idempotency_key: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    seller_name_snapshot: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    seller_address_snapshot: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    seller_phone_snapshot: {
        type: DataTypes.STRING(30),
        allowNull: true
    },
    seller_email_snapshot: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    seller_tax_id_snapshot: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    seller_cr_number_snapshot: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    buyer_tax_id: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    supply_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    place_of_supply_state: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    place_of_supply_code: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    reverse_charge: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'cash'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    declaration: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    bank_details_snapshot: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Associations defined centrally in models/index.js

module.exports = Invoice;


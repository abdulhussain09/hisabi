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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    tax_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    grand_total: {
        type: DataTypes.DECIMAL(10, 2),
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
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    paid_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    due_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'invoices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

// Associations defined centrally in models/index.js

module.exports = Invoice;


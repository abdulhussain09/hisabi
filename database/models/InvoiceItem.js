const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Invoice = require('./Invoice');
const Product = require('./Product');

const InvoiceItem = sequelize.define('InvoiceItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    invoice_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Invoice,
            key: 'id'
        }
    },
    product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Product,
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unit_price: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
    },
    cost_price: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    mrp: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: true
    },
    line_total: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false
    },
    tax_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'invoice_items',
    timestamps: false
});

// Associations defined centrally in models/index.js

module.exports = InvoiceItem;


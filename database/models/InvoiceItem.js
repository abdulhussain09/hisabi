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
        allowNull: true, // Nullable for custom non-inventory items
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
    },
    item_name: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    item_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    hsn_sac: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PCS'
    },
    discount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    taxable_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    tax_rate: {
        type: DataTypes.DECIMAL(6, 4),
        allowNull: false,
        defaultValue: 0
    },
    cgst_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    sgst_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    igst_amount: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0
    },
    is_custom_item: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'invoice_items',
    timestamps: false
});

// Associations defined centrally in models/index.js

module.exports = InvoiceItem;


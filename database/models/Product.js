const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Shop = require('./Shop');

const Product = sequelize.define('Product', {
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    barcode: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    selling_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    image_path: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: true, // Allow null initially for migration or uncategorized items
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    mrp: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            fields: ['shop_id', 'barcode']
        }
    ]
});

// Associations defined centrally in models/index.js

module.exports = Product;


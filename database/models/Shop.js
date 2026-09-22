const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Shop = sequelize.define('Shop', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    trn: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    currency: {
        type: DataTypes.ENUM('AED', 'KWD', 'INR'),
        allowNull: false
    },
    vat_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: 'AE'   // Existing shops safely default to UAE
    },
    gstin: {
        type: DataTypes.STRING(15),
        allowNull: true       // GST Registration Number (India only)
    },
    gst_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    plan: {
        type: DataTypes.ENUM('free', 'gold', 'premium'),
        allowNull: false,
        defaultValue: 'free'
    },
    brand_logo: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    brand_color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#2563eb'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    }
}, {
    tableName: 'shops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Schema didn't specify updated_at, but usually good to have. Schema has created_at.
});

module.exports = Shop;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Advertisement = sequelize.define('Advertisement', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    image_url: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    link_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('manual', 'promotional'),
        allowNull: false,
        defaultValue: 'manual'
    },
    template_id: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    placement: {
        type: DataTypes.ENUM('dashboard_banner', 'billing_banner', 'reports_banner'),
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'advertisements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Advertisement;

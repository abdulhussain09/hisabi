const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');
const Invoice = require('./Invoice');
const User = require('./User');

const InvoiceRevision = sequelize.define('InvoiceRevision', {
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
    revision_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    changed_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    changes_summary: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
    },
    snapshot_data: {
        type: DataTypes.JSONB,
        allowNull: false
    }
}, {
    tableName: 'invoice_revisions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = InvoiceRevision;

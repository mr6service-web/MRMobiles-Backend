const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceItem = sequelize.define('ServiceItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'invoice_id',
        references: {
            model: 'service_invoices',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'item_id',
        references: {
            model: 'items',
            key: 'id'
        }
    },
    inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'inventory_id',
        references: {
            model: 'inventory',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'service_items',
    timestamps: true,
    underscored: true
});

module.exports = ServiceItem;

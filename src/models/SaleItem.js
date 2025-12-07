const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleItem = sequelize.define('SaleItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    saleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sale_id',
        references: {
            model: 'sales',
            key: 'id'
        }
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'item_id',
        references: {
            model: 'items',
            key: 'id'
        }
    },
    inventoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'inventory_id',
        references: {
            model: 'inventory',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    }
}, {
    tableName: 'sale_items',
    timestamps: true,
    underscored: true
});

module.exports = SaleItem;

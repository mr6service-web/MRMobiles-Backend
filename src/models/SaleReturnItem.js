const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleReturnItem = sequelize.define('SaleReturnItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    saleReturnId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sale_return_id',
        references: {
            model: 'sale_returns',
            key: 'id'
        }
    },
    saleItemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sale_item_id',
        references: {
            model: 'sale_items',
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
    tableName: 'sale_return_items',
    timestamps: true,
    underscored: true
});

module.exports = SaleReturnItem;

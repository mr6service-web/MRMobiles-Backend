const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    itemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'items',
            key: 'id'
        },
        field: 'item_id'
    },
    batch: {
        type: DataTypes.INTEGER,
        allowNull: false, // Enforce NOT NULL at database level
        comment: 'Auto-increment batch number per item'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        }
    },
    inwardPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'inward_price',
        validate: {
            min: 0
        }
    },
    sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'selling_price',
        validate: {
            min: 0
        }
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'inventory',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeValidate: async (inventory, options) => {
            // Auto-increment batch number BEFORE validation
            if (!inventory.batch) {
                const maxBatch = await Inventory.max('batch', {
                    where: { itemId: inventory.itemId }
                });
                inventory.batch = (maxBatch || 0) + 1;
            }
        },
        beforeCreate: (inventory, options) => {
            if (options.userId) {
                inventory.createdBy = options.userId;
            }
        },
        beforeUpdate: (inventory, options) => {
            if (options.userId) {
                inventory.updatedBy = options.userId;
            }
        }
    }
});

module.exports = Inventory;

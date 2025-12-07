const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    itemTypeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'item_types',
            key: 'id'
        },
        field: 'item_type_id'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
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
    tableName: 'items',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: (item, options) => {
            if (options.userId) {
                item.createdBy = options.userId;
            }
        },
        beforeUpdate: (item, options) => {
            if (options.userId) {
                item.updatedBy = options.userId;
            }
        }
    }
});

module.exports = Item;

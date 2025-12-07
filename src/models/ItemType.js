const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ItemType = sequelize.define('ItemType', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
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
    tableName: 'item_types',
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: (itemType, options) => {
            if (options.userId) {
                itemType.createdBy = options.userId;
            }
        },
        beforeUpdate: (itemType, options) => {
            if (options.userId) {
                itemType.updatedBy = options.userId;
            }
        }
    }
});

module.exports = ItemType;

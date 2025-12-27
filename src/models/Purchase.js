const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Purchase = sequelize.define('Purchase', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    supplierName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'supplier_name'
    },
    handledByUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'handled_by_user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_quantity'
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
    tableName: 'purchases',
    timestamps: true,
    underscored: true
});

module.exports = Purchase;

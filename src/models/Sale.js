const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'invoice_date'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'customer_name',
        validate: {
            notEmpty: true
        }
    },
    soldBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sold_by',
        references: {
            model: 'users',
            key: 'id'
        }
    },
    paymentMode: {
        type: DataTypes.ENUM('CASH', 'UPI'),
        allowNull: false,
        defaultValue: 'CASH',
        field: 'payment_mode'
    },
    totalQuantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'total_quantity'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount'
    }
}, {
    tableName: 'sales',
    timestamps: true,
    underscored: true
});

module.exports = Sale;

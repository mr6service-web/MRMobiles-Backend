const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SaleReturn = sequelize.define('SaleReturn', {
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
    returnDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'return_date'
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
        field: 'total_amount',
        comment: 'Total value of items returned'
    },
    refundAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'refund_amount',
        comment: 'Actual money returned to customer'
    },
    paymentMode: {
        type: DataTypes.ENUM('CASH', 'UPI'),
        allowNull: false,
        defaultValue: 'CASH',
        field: 'payment_mode'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'reason'
    }
}, {
    tableName: 'sale_returns',
    timestamps: true,
    underscored: true
});

module.exports = SaleReturn;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceInvoice = sequelize.define('ServiceInvoice', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inwardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'inward_id',
        references: {
            model: 'service_inwards',
            key: 'id'
        }
    },
    invoiceNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'invoice_no'
    },
    invoiceDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'invoice_date'
    },
    serviceDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'service_details'
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount'
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    finalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'final_amount'
    }
}, {
    tableName: 'service_invoices',
    timestamps: true,
    underscored: true
});

module.exports = ServiceInvoice;

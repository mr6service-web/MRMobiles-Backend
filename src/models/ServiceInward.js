const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceInward = sequelize.define('ServiceInward', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inwardDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'inward_date'
    },
    inwardNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'inward_no'
    },
    customerName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'customer_name'
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'phone_number'
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    brandName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'brand_name'
    },
    modelNo: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'model_no'
    },
    problemDetails: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'problem_details'
    },
    estimateAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'estimate_amount'
    },
    status: {
        type: DataTypes.ENUM('INWARD', 'REPAIRED', 'RETURNED'),
        allowNull: false,
        defaultValue: 'INWARD'
    },
    receivedBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'received_by',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'service_inwards',
    timestamps: true,
    underscored: true
});

module.exports = ServiceInward;

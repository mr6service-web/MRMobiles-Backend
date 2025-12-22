const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceReturn = sequelize.define('ServiceReturn', {
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
    returnDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'return_date'
    },
    returnReason: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'return_reason'
    }
}, {
    tableName: 'service_returns',
    timestamps: true,
    underscored: true
});

module.exports = ServiceReturn;

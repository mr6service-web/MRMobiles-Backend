const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [3, 255]
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
    tableName: 'users',
    timestamps: true, // Enables createdAt and updatedAt
    underscored: true, // Uses snake_case for column names (created_at, updated_at)
    hooks: {
        beforeCreate: (user, options) => {
            // If userId is available in options, set createdBy
            if (options.userId) {
                user.createdBy = options.userId;
            }
        },
        beforeUpdate: (user, options) => {
            // If userId is available in options, set updatedBy
            if (options.userId) {
                user.updatedBy = options.userId;
            }
        }
    }
});

module.exports = User;

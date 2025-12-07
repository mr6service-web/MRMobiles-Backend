const sequelize = require('../config/database');
const User = require('./User');
const ItemType = require('./ItemType');
const Item = require('./Item');
const Inventory = require('./Inventory');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');

// Setup associations
Item.belongsTo(ItemType, {
    foreignKey: 'itemTypeId',
    as: 'type'
});

ItemType.hasMany(Item, {
    foreignKey: 'itemTypeId',
    as: 'items'
});

Inventory.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
});

Item.hasMany(Inventory, {
    foreignKey: 'itemId',
    as: 'inventoryBatches'
});

// Sales Associations
Sale.belongsTo(User, {
    foreignKey: 'soldBy',
    as: 'seller'
});

User.hasMany(Sale, {
    foreignKey: 'soldBy',
    as: 'sales'
});

Sale.hasMany(SaleItem, {
    foreignKey: 'saleId',
    as: 'items'
});

SaleItem.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

SaleItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
});

SaleItem.belongsTo(Inventory, {
    foreignKey: 'inventoryId',
    as: 'inventory'
});

// Initialize all models
const models = {
    User,
    ItemType,
    Item,
    Inventory,
    Sale,
    SaleItem
};

module.exports = {
    sequelize,
    ...models
};

const sequelize = require('../config/database');
const User = require('./User');
const ItemType = require('./ItemType');
const Item = require('./Item');
const Inventory = require('./Inventory');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const ServiceInward = require('./ServiceInward');
const ServiceInvoice = require('./ServiceInvoice');
const ServiceReturn = require('./ServiceReturn');
const ServiceItem = require('./ServiceItem');

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

// Service Associations
ServiceInward.belongsTo(User, {
    foreignKey: 'receivedBy',
    as: 'receiver'
});

User.hasMany(ServiceInward, {
    foreignKey: 'receivedBy',
    as: 'serviceInwards'
});

// Service Inward -> Invoice
ServiceInward.hasOne(ServiceInvoice, {
    foreignKey: 'inwardId',
    as: 'invoice'
});

ServiceInvoice.belongsTo(ServiceInward, {
    foreignKey: 'inwardId',
    as: 'inward'
});

// Service Inward -> Return
ServiceInward.hasOne(ServiceReturn, {
    foreignKey: 'inwardId',
    as: 'return'
});

ServiceReturn.belongsTo(ServiceInward, {
    foreignKey: 'inwardId',
    as: 'inward'
});

// Service Invoice -> Items
ServiceInvoice.hasMany(ServiceItem, {
    foreignKey: 'invoiceId',
    as: 'items'
});

ServiceItem.belongsTo(ServiceInvoice, {
    foreignKey: 'invoiceId',
    as: 'invoice'
});

ServiceItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
});

ServiceItem.belongsTo(Inventory, {
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
    SaleItem,
    ServiceInward,
    ServiceInvoice,
    ServiceReturn,
    ServiceItem
};

module.exports = {
    sequelize,
    ...models
};

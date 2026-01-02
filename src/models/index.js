const sequelize = require('../config/database');
const User = require('./User');
const ItemType = require('./ItemType');
const Item = require('./Item');
const Inventory = require('./Inventory');
const Purchase = require('./Purchase');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const ServiceInward = require('./ServiceInward');
const ServiceInvoice = require('./ServiceInvoice');
const ServiceReturn = require('./ServiceReturn');
const ServiceItem = require('./ServiceItem');
const SaleReturn = require('./SaleReturn');
const SaleReturnItem = require('./SaleReturnItem');

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

// Purchase Associations
Purchase.belongsTo(User, {
    foreignKey: 'handledByUserId',
    as: 'handler'
});

User.hasMany(Purchase, {
    foreignKey: 'handledByUserId',
    as: 'purchaseEntries'
});

Purchase.hasMany(Inventory, {
    foreignKey: 'purchaseId',
    as: 'items'
});

Inventory.belongsTo(Purchase, {
    foreignKey: 'purchaseId',
    as: 'purchase'
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

// Sale Return Associations
Sale.hasMany(SaleReturn, {
    foreignKey: 'saleId',
    as: 'returns'
});

SaleReturn.belongsTo(Sale, {
    foreignKey: 'saleId',
    as: 'sale'
});

SaleReturn.hasMany(SaleReturnItem, {
    foreignKey: 'saleReturnId',
    as: 'items'
});

SaleReturnItem.belongsTo(SaleReturn, {
    foreignKey: 'saleReturnId',
    as: 'return'
});

SaleReturnItem.belongsTo(SaleItem, {
    foreignKey: 'saleItemId',
    as: 'saleItem'
});

SaleReturnItem.belongsTo(Item, {
    foreignKey: 'itemId',
    as: 'item'
});

SaleReturnItem.belongsTo(Inventory, {
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
    Purchase,
    Sale,
    SaleItem,
    ServiceInward,
    ServiceInvoice,
    ServiceReturn,
    ServiceItem,
    SaleReturn,
    SaleReturnItem
};

module.exports = {
    sequelize,
    ...models
};

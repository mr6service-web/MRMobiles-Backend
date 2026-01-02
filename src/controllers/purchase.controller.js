const { Purchase, Inventory, Item, ItemType, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { id: search },
                { supplierName: { [Op.like]: `%${search}%` } }
            ];
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            whereClause.date = {
                [Op.between]: [start, end]
            };
        }

        const { count, rows } = await Purchase.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'handler', attributes: ['id', 'username'] },
                {
                    model: Inventory,
                    as: 'items',
                    include: [{ model: Item, as: 'item', attributes: ['id', 'name'] }]
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            items: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id, {
            include: [
                { model: User, as: 'handler', attributes: ['id', 'username'] },
                {
                    model: Inventory,
                    as: 'items',
                    include: [
                        {
                            model: Item,
                            as: 'item',
                            attributes: ['id', 'name'],
                            include: [{ model: ItemType, as: 'type', attributes: ['id', 'name'] }]
                        }
                    ]
                }
            ]
        });

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase entry not found' });
        }

        res.status(200).json(purchase);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { date, supplierName, handledByUserId, items } = req.body;

        if (!supplierName || !handledByUserId || !items || !items.length) {
            return res.status(400).json({ message: 'Missing required fields or items' });
        }

        const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

        const purchase = await Purchase.create({
            date,
            supplierName,
            handledByUserId,
            totalQuantity
        }, { transaction: t, userId: req.userId });

        // Create associated inventory items
        for (const itemData of items) {
            await Inventory.create({
                itemId: itemData.itemId,
                purchaseId: purchase.id,
                quantity: itemData.quantity,
                inwardPrice: itemData.inwardPrice, // Purchase Rate
                sellingPrice: itemData.sellingPrice, // Sale Rate
                supplierName: supplierName // Sync supplier name for backward compatibility
            }, { transaction: t, userId: req.userId });
        }

        await t.commit();

        const createdPurchase = await Purchase.findByPk(purchase.id, {
            include: [
                { model: User, as: 'handler', attributes: ['id', 'username'] },
                {
                    model: Inventory,
                    as: 'items',
                    include: [{ model: Item, as: 'item', attributes: ['id', 'name'] }]
                }
            ]
        });

        res.status(201).json(createdPurchase);
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { date, supplierName, handledByUserId, items } = req.body;

        const purchase = await Purchase.findByPk(id);
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase entry not found' });
        }

        const totalQuantity = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

        await purchase.update({
            date: date || purchase.date,
            supplierName: supplierName || purchase.supplierName,
            handledByUserId: handledByUserId || purchase.handledByUserId,
            totalQuantity
        }, { transaction: t, userId: req.userId });

        // Simple approach: Delete old items and recreate new ones
        // In a production app, you might want to sync instead of re-creating
        await Inventory.destroy({
            where: { purchaseId: id },
            transaction: t
        });

        for (const itemData of items) {
            await Inventory.create({
                itemId: itemData.itemId,
                purchaseId: id,
                quantity: itemData.quantity,
                inwardPrice: itemData.inwardPrice,
                sellingPrice: itemData.sellingPrice,
                supplierName: supplierName || purchase.supplierName
            }, { transaction: t, userId: req.userId });
        }

        await t.commit();

        const updatedPurchase = await Purchase.findByPk(id, {
            include: [
                { model: User, as: 'handler', attributes: ['id', 'username'] },
                {
                    model: Inventory,
                    as: 'items',
                    include: [{ model: Item, as: 'item', attributes: ['id', 'name'] }]
                }
            ]
        });

        res.status(200).json(updatedPurchase);
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.delete = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const purchase = await Purchase.findByPk(id);

        if (!purchase) {
            return res.status(404).json({ message: 'Purchase entry not found' });
        }

        // Inventory items will be handled by Cascade if set up in DB, 
        // but let's do it manually to be safe or if constraints are not strictly enforced.
        await Inventory.destroy({
            where: { purchaseId: id },
            transaction: t
        });

        await purchase.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Purchase entry deleted successfully' });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

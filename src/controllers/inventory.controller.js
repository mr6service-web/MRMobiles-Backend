const { Inventory, Item, ItemType } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, itemId = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = itemId ? { itemId: parseInt(itemId) } : {};

        const { count, rows } = await Inventory.findAndCountAll({
            where: whereClause,
            include: [{
                model: Item,
                as: 'item',
                attributes: ['id', 'name'],
                include: [{
                    model: ItemType,
                    as: 'type',
                    attributes: ['id', 'name']
                }]
            }],
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

        const inventory = await Inventory.findByPk(id, {
            include: [{
                model: Item,
                as: 'item',
                attributes: ['id', 'name'],
                include: [{
                    model: ItemType,
                    as: 'type',
                    attributes: ['id', 'name']
                }]
            }]
        });

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory record not found' });
        }

        res.status(200).json(inventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { itemId, quantity, inwardPrice, sellingPrice } = req.body;

        if (!itemId || quantity === undefined || !inwardPrice || !sellingPrice) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if item exists
        const itemExists = await Item.findByPk(itemId);
        if (!itemExists) {
            return res.status(400).json({ message: 'Invalid item' });
        }

        const inventory = await Inventory.create({
            itemId,
            quantity,
            inwardPrice,
            sellingPrice
        }, { userId: req.userId });

        const createdInventory = await Inventory.findByPk(inventory.id, {
            include: [{
                model: Item,
                as: 'item',
                attributes: ['id', 'name'],
                include: [{
                    model: ItemType,
                    as: 'type',
                    attributes: ['id', 'name']
                }]
            }]
        });

        res.status(201).json(createdInventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, inwardPrice, sellingPrice } = req.body;

        const inventory = await Inventory.findByPk(id);

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory record not found' });
        }

        await inventory.update({
            quantity: quantity !== undefined ? quantity : inventory.quantity,
            inwardPrice: inwardPrice || inventory.inwardPrice,
            sellingPrice: sellingPrice || inventory.sellingPrice
        }, { userId: req.userId });

        const updatedInventory = await Inventory.findByPk(id, {
            include: [{
                model: Item,
                as: 'item',
                attributes: ['id', 'name'],
                include: [{
                    model: ItemType,
                    as: 'type',
                    attributes: ['id', 'name']
                }]
            }]
        });

        res.status(200).json(updatedInventory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const inventory = await Inventory.findByPk(id);

        if (!inventory) {
            return res.status(404).json({ message: 'Inventory record not found' });
        }

        await inventory.destroy();

        res.status(200).json({ message: 'Inventory record deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const { Item, ItemType } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const whereClause = search
            ? {
                name: {
                    [Op.iLike]: `%${search}%`
                }
            }
            : {};

        const { count, rows } = await Item.findAndCountAll({
            where: whereClause,
            include: [{
                model: ItemType,
                as: 'type',
                attributes: ['id', 'name']
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

        const item = await Item.findByPk(id, {
            include: [{
                model: ItemType,
                as: 'type',
                attributes: ['id', 'name']
            }]
        });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, itemTypeId, description } = req.body;

        if (!name || !itemTypeId) {
            return res.status(400).json({ message: 'Name and item type are required' });
        }

        // Check if item type exists
        const typeExists = await ItemType.findByPk(itemTypeId);
        if (!typeExists) {
            return res.status(400).json({ message: 'Invalid item type' });
        }

        const item = await Item.create({
            name,
            itemTypeId,
            description
        }, { userId: req.userId });

        const createdItem = await Item.findByPk(item.id, {
            include: [{
                model: ItemType,
                as: 'type',
                attributes: ['id', 'name']
            }]
        });

        res.status(201).json(createdItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, itemTypeId, description } = req.body;

        const item = await Item.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Check if item type exists if being updated
        if (itemTypeId) {
            const typeExists = await ItemType.findByPk(itemTypeId);
            if (!typeExists) {
                return res.status(400).json({ message: 'Invalid item type' });
            }
        }

        await item.update({
            name: name || item.name,
            itemTypeId: itemTypeId || item.itemTypeId,
            description: description !== undefined ? description : item.description
        }, { userId: req.userId });

        const updatedItem = await Item.findByPk(id, {
            include: [{
                model: ItemType,
                as: 'type',
                attributes: ['id', 'name']
            }]
        });

        res.status(200).json(updatedItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await Item.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        await item.destroy();

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

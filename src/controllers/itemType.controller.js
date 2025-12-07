const { ItemType } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const types = await ItemType.findAll({
            attributes: ['id', 'name'],
            order: [['name', 'ASC']]
        });

        res.status(200).json(types);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.create = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const itemType = await ItemType.create({ name }, { userId: req.userId });

        res.status(201).json(itemType);
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Item type already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

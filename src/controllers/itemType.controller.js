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
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        const itemType = await ItemType.findByPk(id);

        if (!itemType) {
            return res.status(404).json({ message: 'Item type not found' });
        }

        itemType.name = name;
        itemType.updatedBy = req.userId;
        await itemType.save();

        res.status(200).json(itemType);
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Item type already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        const itemType = await ItemType.findByPk(id);

        if (!itemType) {
            return res.status(404).json({ message: 'Item type not found' });
        }

        // TODO: Check if used in Items table before deleting if no foreign key constraint exists
        // Assuming database constraint will handle reference integrity or Sequelize will throw error

        await itemType.destroy();

        res.status(200).json({ message: 'Item type deleted successfully' });
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Cannot delete item type as it is being used by items' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

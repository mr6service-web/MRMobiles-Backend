const User = require('../models/User');

// Get all users
exports.getAll = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username'], // Only return id and username, not password
            order: [['username', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

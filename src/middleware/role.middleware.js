const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        const user = req.user; // Assuming user is attached to request by auth middleware
        if (!user || (roles.length && !roles.includes(user.role))) {
            return res.status(403).json({ message: 'Forbidden: Access is denied' });
        }
        next();
    };
};

module.exports = { authorize };

const { Sale, SaleItem, Inventory, Item, ItemType, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get dashboard statistics
exports.getStats = async (req, res) => {
    try {
        // Total inventory count (sum of all quantities)
        const totalInventory = await Inventory.sum('quantity') || 0;

        // Low stock items (quantity < 10)
        const lowStockCount = await Inventory.count({
            where: {
                quantity: {
                    [Op.lt]: 10
                }
            }
        });

        // Today's sales count
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySalesCount = await Sale.count({
            where: {
                invoiceDate: {
                    [Op.gte]: today
                }
            }
        });

        // Total revenue (all time)
        const totalRevenue = await Sale.sum('totalAmount') || 0;

        // This week's revenue
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekRevenue = await Sale.sum('totalAmount', {
            where: {
                invoiceDate: {
                    [Op.gte]: weekStart
                }
            }
        }) || 0;

        res.status(200).json({
            totalInventory,
            lowStockCount,
            todaySalesCount,
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            weekRevenue: parseFloat(weekRevenue).toFixed(2)
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        // Get recent sales
        const recentSales = await Sale.findAll({
            include: [
                {
                    model: User,
                    as: 'seller',
                    attributes: ['username']
                }
            ],
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'customerName', 'totalAmount', 'totalQuantity', 'createdAt']
        });

        // Get recent inventory additions
        const recentInventory = await Inventory.findAll({
            include: [
                {
                    model: Item,
                    as: 'item',
                    attributes: ['name']
                }
            ],
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'quantity', 'batch', 'createdAt']
        });

        // Combine and sort by date
        const activities = [
            ...recentSales.map(sale => ({
                type: 'sale',
                id: sale.id,
                description: `Sale to ${sale.customerName}`,
                amount: sale.totalAmount,
                quantity: sale.totalQuantity,
                user: sale.seller?.username || 'Unknown',
                timestamp: sale.createdAt
            })),
            ...recentInventory.map(inv => ({
                type: 'inventory',
                id: inv.id,
                description: `Added ${inv.item?.name || 'Item'} (Batch ${inv.batch})`,
                quantity: inv.quantity,
                user: 'System',
                timestamp: inv.createdAt
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, parseInt(limit));

        res.status(200).json(activities);
    } catch (error) {
        console.error('Recent activities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;

        const lowStockItems = await Inventory.findAll({
            where: {
                quantity: {
                    [Op.lt]: parseInt(threshold)
                }
            },
            include: [
                {
                    model: Item,
                    as: 'item',
                    include: [
                        {
                            model: ItemType,
                            as: 'itemType',
                            attributes: ['name']
                        }
                    ]
                }
            ],
            order: [['quantity', 'ASC']],
            limit: 20
        });

        res.status(200).json(lowStockItems);
    } catch (error) {
        console.error('Low stock items error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;

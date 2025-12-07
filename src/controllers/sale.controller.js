const { Sale, SaleItem, Inventory, Item, sequelize } = require('../models');

exports.create = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customerName, paymentMode, items } = req.body;
        const userId = req.userId;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in sale' });
        }

        let totalQuantity = 0;
        let totalAmount = 0;

        // 1. Create Sale record first
        const sale = await Sale.create({
            customerName,
            paymentMode,
            soldBy: userId,
            totalQuantity: 0, // Will update later
            totalAmount: 0    // Will update later
        }, { transaction: t });

        // 2. Process each item
        for (const item of items) {
            const { itemId, inventoryId, quantity, price } = item;

            // Check stock availability
            const inventory = await Inventory.findByPk(inventoryId, { transaction: t });

            if (!inventory) {
                throw new Error(`Inventory batch not found for item ${itemId}`);
            }

            if (inventory.quantity < quantity) {
                throw new Error(`Insufficient stock for item ${itemId} (Batch ${inventory.batch})`);
            }

            // Deduct stock
            await inventory.decrement('quantity', { by: quantity, transaction: t });

            // Calculate amount
            const amount = quantity * price;
            totalQuantity += quantity;
            totalAmount += amount;

            // Create SaleItem
            await SaleItem.create({
                saleId: sale.id,
                itemId,
                inventoryId,
                quantity,
                price,
                amount
            }, { transaction: t });
        }

        // 3. Update Sale totals
        await sale.update({
            totalQuantity,
            totalAmount
        }, { transaction: t });

        await t.commit();

        // Fetch complete sale details to return
        const completeSale = await Sale.findByPk(sale.id, {
            include: [{
                model: SaleItem,
                as: 'items',
                include: ['item']
            }]
        });

        res.status(201).json(completeSale);

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(400).json({ message: error.message || 'Error creating sale' });
    }
};

exports.getAll = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { count, rows } = await Sale.findAndCountAll({
            include: ['seller'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            sales: rows,
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

        const sale = await Sale.findByPk(id, {
            include: [
                'seller',
                {
                    model: SaleItem,
                    as: 'items',
                    include: ['item', 'inventory']
                }
            ]
        });

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Explicitly convert to plain object to ensure nested associations are included
        const saleData = sale.toJSON();
        console.log('Sending sale data:', JSON.stringify(saleData, null, 2));
        console.log('Items count:', saleData.items?.length);

        res.status(200).json(saleData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

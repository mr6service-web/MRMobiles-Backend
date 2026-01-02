const { Sale, SaleItem, Inventory, Item, SaleReturn, SaleReturnItem, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customerName, paymentMode, items, date } = req.body;
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
            invoiceDate: date || new Date(),
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
        const { page = 1, limit = 10, fromDate, toDate, sellerId } = req.query;
        console.log('Sales Query Params:', { fromDate, toDate, sellerId });
        const offset = (page - 1) * limit;

        const where = {};
        if (fromDate && toDate) {
            where.invoiceDate = {
                [Op.between]: [fromDate + ' 00:00:00', toDate + ' 23:59:59']
            };
        } else if (fromDate) {
            where.invoiceDate = { [Op.gte]: fromDate + ' 00:00:00' };
        } else if (toDate) {
            where.invoiceDate = { [Op.lte]: toDate + ' 23:59:59' };
        }

        if (sellerId && sellerId !== 'null' && sellerId !== 'undefined') {
            where.soldBy = sellerId;
        }

        console.log('Final Where Clause:', where);

        const { count, rows } = await Sale.findAndCountAll({
            where,
            include: ['seller'],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['invoiceDate', 'DESC'], ['id', 'DESC']]
        });

        // Calculate grand total for the current filtered set (not just the page)
        const grossAmount = await Sale.sum('totalAmount', { where });

        // Calculate total returns for these sales
        const salesIds = rows.map(s => s.id);

        // Get individual refund amounts for each sale in the current page
        const refundData = await SaleReturn.findAll({
            attributes: [
                'saleId',
                [sequelize.fn('SUM', sequelize.col('refund_amount')), 'totalRefunded']
            ],
            where: {
                saleId: { [Op.in]: salesIds.length > 0 ? salesIds : [0] }
            },
            group: ['saleId'],
            raw: true
        });

        const refundMap = {};
        refundData.forEach(item => {
            refundMap[item.saleId] = parseFloat(item.totalRefunded || 0);
        });

        const rowsWithRefunds = rows.map(row => {
            const plainRow = row.toJSON();
            plainRow.totalRefunded = refundMap[row.id] || 0;
            return plainRow;
        });

        // For the grand total net calculation: sum all returns matching the date filter
        const returnWhere = {};
        if (fromDate && toDate) {
            returnWhere.returnDate = {
                [Op.between]: [fromDate + ' 00:00:00', toDate + ' 23:59:59']
            };
        }

        const totalReturnsTotal = await SaleReturn.sum('refundAmount', { where: returnWhere }) || 0;
        const netGrandTotal = parseFloat(grossAmount || 0) - parseFloat(totalReturnsTotal);

        res.status(200).json({
            sales: rowsWithRefunds,
            total: count,
            grandTotal: parseFloat(grossAmount || 0),
            netGrandTotal: netGrandTotal,
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

        // Explicitly convert to plain object
        const saleData = sale.toJSON();

        // For each item, calculate how much has been returned
        for (let item of saleData.items) {
            item.returnedQuantity = await SaleReturnItem.sum('quantity', {
                where: { saleItemId: item.id }
            }) || 0;
            item.returnedAmount = await SaleReturnItem.sum('amount', {
                where: { saleItemId: item.id }
            }) || 0;
        }

        // Also get total return info for this sale
        saleData.returns = await SaleReturn.findAll({
            where: { saleId: id },
            include: [{
                model: SaleReturnItem,
                as: 'items',
                include: ['item']
            }],
            order: [['returnDate', 'DESC']]
        });

        saleData.totalRefunded = await SaleReturn.sum('refundAmount', {
            where: { saleId: id }
        }) || 0;

        res.status(200).json(saleData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

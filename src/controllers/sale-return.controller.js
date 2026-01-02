const { Sale, SaleItem, SaleReturn, SaleReturnItem, Inventory, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createReturn = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { saleId, returnDate, items, reason, refundAmount, paymentMode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items specified for return' });
        }

        let totalQuantity = 0;
        let totalAmount = 0;

        // 1. Create SaleReturn record
        const saleReturn = await SaleReturn.create({
            saleId,
            returnDate: returnDate || new Date(),
            reason,
            refundAmount: refundAmount || 0,
            paymentMode: paymentMode || 'CASH',
            totalQuantity: 0, // Update later
            totalAmount: 0    // Update later
        }, { transaction: t });

        // 2. Process each returned item
        for (const item of items) {
            const { saleItemId, quantity } = item;

            if (quantity <= 0) continue;

            // Fetch the original sale item
            const originalSaleItem = await SaleItem.findByPk(saleItemId, {
                include: ['inventory'],
                transaction: t
            });

            if (!originalSaleItem) {
                throw new Error(`Original sale item not found for ID: ${saleItemId}`);
            }

            // --- Partial Return Validation ---
            // Calculate how much has already been returned for this specific sale item
            const previouslyReturned = await SaleReturnItem.sum('quantity', {
                where: { saleItemId },
                transaction: t
            }) || 0;

            const remainingReturnable = originalSaleItem.quantity - previouslyReturned;

            if (quantity > remainingReturnable) {
                throw new Error(
                    `Cannot return more than remaining quantity. ` +
                    `Sold: ${originalSaleItem.quantity}, Already Returned: ${previouslyReturned}, ` +
                    `Trying to return: ${quantity}`
                );
            }

            // --- Inventory Update ---
            // Add quantity back to the ORIGINAL inventory record
            const inventory = await Inventory.findByPk(originalSaleItem.inventoryId, { transaction: t });
            if (inventory) {
                await inventory.increment('quantity', { by: quantity, transaction: t });
            }

            // --- Calculate Totals ---
            const itemPrice = parseFloat(originalSaleItem.price);
            const lineAmount = quantity * itemPrice;
            totalQuantity += quantity;
            totalAmount += lineAmount;

            // --- Create SaleReturnItem ---
            await SaleReturnItem.create({
                saleReturnId: saleReturn.id,
                saleItemId: originalSaleItem.id,
                itemId: originalSaleItem.itemId,
                inventoryId: originalSaleItem.inventoryId,
                quantity,
                price: itemPrice,
                amount: lineAmount
            }, { transaction: t });
        }

        // 3. Update SaleReturn totals
        await saleReturn.update({
            totalQuantity,
            totalAmount
        }, { transaction: t });

        await t.commit();

        // Fetch completed return with details
        const completeReturn = await SaleReturn.findByPk(saleReturn.id, {
            include: [
                {
                    model: SaleReturnItem,
                    as: 'items',
                    include: ['item']
                },
                {
                    model: Sale,
                    as: 'sale'
                }
            ]
        });

        res.status(201).json(completeReturn);

    } catch (error) {
        await t.rollback();
        console.error('Sale Return Error:', error);
        res.status(500).json({ message: error.message || 'Error processing sale return' });
    }
};

// Get all returns with basic search/filter
exports.getAllReturns = async (req, res) => {
    try {
        const { fromDate, toDate } = req.query;
        let where = {};

        if (fromDate && toDate) {
            where.returnDate = {
                [Op.between]: [new Date(fromDate), new Date(toDate)]
            };
        }

        const returns = await SaleReturn.findAll({
            where,
            include: [
                { model: Sale, as: 'sale' },
                { model: SaleReturnItem, as: 'items', include: ['item'] }
            ],
            order: [['returnDate', 'DESC']]
        });

        res.json(returns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get specific return detail
exports.getReturnById = async (req, res) => {
    try {
        const saleReturn = await SaleReturn.findByPk(req.params.id, {
            include: [
                { model: Sale, as: 'sale' },
                { model: SaleReturnItem, as: 'items', include: ['item'] }
            ]
        });

        if (!saleReturn) return res.status(404).json({ message: 'Return record not found' });
        res.json(saleReturn);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

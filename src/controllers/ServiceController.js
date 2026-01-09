const { ServiceInward, ServiceInvoice, ServiceReturn, ServiceItem, User, Inventory, Item, sequelize } = require('../models');
const { Op } = require('sequelize');

class ServiceController {
    static async createInward(req, res) {
        try {
            const {
                customerName, phoneNumber, address,
                brandName, modelNo, problemDetails,
                estimateAmount
            } = req.body;

            // Generate Inward Number
            const lastInward = await ServiceInward.findOne({
                order: [['id', 'DESC']]
            });
            let nextNo = 1;
            if (lastInward && lastInward.inwardNo) {
                const match = lastInward.inwardNo.match(/\d+/);
                if (match) {
                    nextNo = parseInt(match[0], 10) + 1;
                }
            }
            const inwardNo = nextNo.toString().padStart(4, '0');

            const service = await ServiceInward.create({
                inwardNo,
                customerName,
                phoneNumber,
                address,
                brandName,
                modelNo,
                problemDetails,
                estimateAmount,
                receivedBy: req.userId,
                status: 'INWARD'
            });

            res.status(201).json(service);
        } catch (error) {
            console.error('Error creating inward:', error);
            res.status(500).json({ message: 'Error creating inward entry', error: error.message });
        }
    }

    static async getNextInwardNo(req, res) {
        try {
            const lastInward = await ServiceInward.findOne({
                order: [['id', 'DESC']]
            });
            let nextNoVal = 1;
            if (lastInward && lastInward.inwardNo) {
                const match = lastInward.inwardNo.match(/\d+/);
                if (match) {
                    nextNoVal = parseInt(match[0], 10) + 1;
                }
            }
            const nextNo = nextNoVal.toString().padStart(4, '0');
            res.json({ nextNo });
        } catch (error) {
            res.status(500).json({ message: 'Error generating inward number', error: error.message });
        }
    }

    static async searchInward(req, res) {
        try {
            const { inwardNo } = req.query;
            console.log('Searching Inward No:', inwardNo);

            if (!inwardNo) {
                return res.status(400).json({ message: 'Inward number is required' });
            }

            // Construct Variations
            const variations = [inwardNo];
            const cleanNo = parseInt(inwardNo);

            if (!isNaN(cleanNo)) {
                variations.push(cleanNo.toString().padStart(4, '0'));
                variations.push(`MR/INW/${cleanNo.toString().padStart(3, '0')}`);
                variations.push(`MR/INW/${cleanNo.toString().padStart(4, '0')}`);
            }

            console.log('Search Variations:', variations);

            const service = await ServiceInward.findOne({
                where: {
                    inwardNo: {
                        [Op.or]: variations
                    }
                },
                include: [
                    { model: User, as: 'receiver', attributes: ['username'] },
                    {
                        model: ServiceInvoice,
                        as: 'invoice',
                        include: [
                            {
                                model: ServiceItem,
                                as: 'items',
                                include: [
                                    { model: Item, as: 'item' },
                                    { model: Inventory, as: 'inventory' }
                                ]
                            }
                        ]
                    }
                ]
            });

            console.log('Search Result:', service ? 'Found' : 'Not Found');

            if (!service) {
                return res.status(404).json({ message: 'Service record not found' });
            }

            res.json(service);
        } catch (error) {
            console.error('Error searching inward:', error);
            res.status(500).json({ message: 'Error searching service record', error: error.message });
        }
    }

    static async updateInward(req, res) {
        try {
            const { id } = req.params;
            const service = await ServiceInward.findByPk(id);

            if (!service) {
                return res.status(404).json({ message: 'Service record not found' });
            }

            // Allow editing basic details even after processing
            await service.update(req.body);
            res.json(service);
        } catch (error) {
            console.error('Error updating inward:', error);
            res.status(500).json({ message: 'Error updating inward entry', error: error.message });
        }
    }

    static async getAllServices(req, res) {
        try {
            const { status, fromDate, toDate, receivedBy, phoneNumber, page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const whereClause = {};
            if (status && status !== 'ALL') {
                if (status === 'SERVICED') {
                    whereClause.status = { [Op.in]: ['REPAIRED', 'RETURNED'] };
                } else {
                    whereClause.status = status;
                }
            }

            if (fromDate && toDate) {
                whereClause.inwardDate = {
                    [Op.between]: [fromDate + ' 00:00:00', toDate + ' 23:59:59']
                };
            } else if (fromDate) {
                whereClause.inwardDate = { [Op.gte]: fromDate + ' 00:00:00' };
            } else if (toDate) {
                whereClause.inwardDate = { [Op.lte]: toDate + ' 23:59:59' };
            }

            if (receivedBy && receivedBy !== 'null' && receivedBy !== 'undefined') {
                whereClause.receivedBy = receivedBy;
            }

            if (phoneNumber) {
                whereClause.phoneNumber = { [Op.like]: `%${phoneNumber}%` };
            }

            const { count, rows } = await ServiceInward.findAndCountAll({
                where: whereClause,
                include: [
                    { model: User, as: 'receiver', attributes: ['username'] },
                    { model: ServiceInvoice, as: 'invoice', attributes: ['id', 'finalAmount', 'invoiceNo'] }
                ],
                limit: parseInt(limit),
                offset: parseInt(offset),
                order: [['inwardDate', 'DESC'], ['id', 'DESC']]
            });

            // Calculate totals for the filtered set
            const totalEstimate = await ServiceInward.sum('estimateAmount', { where: whereClause }) || 0;

            // To get total invoiced amount, we need to sum finalAmounts from associated invoices
            const inwardIds = await ServiceInward.findAll({
                where: whereClause,
                attributes: ['id'],
                raw: true
            }).then(items => items.map(i => i.id));

            const totalInvoiced = await ServiceInvoice.sum('finalAmount', {
                where: { inwardId: { [Op.in]: inwardIds.length > 0 ? inwardIds : [0] } }
            }) || 0;

            res.json({
                services: rows,
                total: count,
                totalEstimate: parseFloat(totalEstimate),
                totalInvoiced: parseFloat(totalInvoiced),
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ message: 'Error fetching services', error: error.message });
        }
    }

    static async getServiceById(req, res) {
        try {
            const service = await ServiceInward.findByPk(req.params.id, {
                include: [
                    { model: User, as: 'receiver', attributes: ['username'] },
                    {
                        model: ServiceInvoice,
                        as: 'invoice',
                        include: [
                            {
                                model: ServiceItem,
                                as: 'items',
                                include: [
                                    { model: Item, as: 'item' },
                                    { model: Inventory, as: 'inventory' }
                                ]
                            }
                        ]
                    },
                    { model: ServiceReturn, as: 'return' }
                ]
            });
            if (!service) {
                return res.status(404).json({ message: 'Service record not found' });
            }
            res.json(service);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching service details', error: error.message });
        }
    }

    static async createInvoice(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { serviceDetails, totalAmount, discount, finalAmount, items } = req.body;

            const inward = await ServiceInward.findByPk(id, { transaction: t });
            if (!inward) {
                throw new Error('Inward record not found');
            }

            if (inward.status !== 'INWARD') {
                throw new Error('Device is already processed (Repaired/Returned)');
            }

            // Generate Invoice Number
            const lastInvoice = await ServiceInvoice.findOne({
                order: [['id', 'DESC']],
                transaction: t
            });
            let nextInvoiceId = 1;
            if (lastInvoice && lastInvoice.invoiceNo) {
                const match = lastInvoice.invoiceNo.match(/\d+/);
                if (match) {
                    nextInvoiceId = parseInt(match[0], 10) + 1;
                }
            }
            const invoiceNo = `MR/SER/${nextInvoiceId.toString().padStart(3, '0')}`;

            const invoice = await ServiceInvoice.create({
                inwardId: id,
                invoiceNo,
                invoiceDate: new Date(),
                serviceDetails,
                totalAmount,
                discount,
                finalAmount
            }, { transaction: t });

            // Process items and deduct stock
            if (items && items.length > 0) {
                for (const item of items) {
                    await ServiceItem.create({
                        ...item,
                        invoiceId: invoice.id
                    }, { transaction: t });

                    if (item.inventoryId) {
                        const inventory = await Inventory.findByPk(item.inventoryId, { transaction: t });
                        if (inventory) {
                            if (inventory.quantity < item.quantity) {
                                throw new Error(`Insufficient stock for item: ${item.description || 'N/A'}`);
                            }
                            await inventory.decrement('quantity', { by: item.quantity, transaction: t });
                        }
                    }
                }
            }

            // Update inward status
            await inward.update({ status: 'REPAIRED' }, { transaction: t });

            await t.commit();
            res.status(201).json(invoice);
        } catch (error) {
            await t.rollback();
            console.error('Error creating service invoice:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async updateInvoice(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { serviceDetails, totalAmount, discount, finalAmount, items } = req.body;

            const invoice = await ServiceInvoice.findByPk(id, {
                include: [{ model: ServiceItem, as: 'items' }],
                transaction: t
            });

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // 1. Revert Inventory for old items
            for (const item of invoice.items) {
                if (item.inventoryId) {
                    const inventory = await Inventory.findByPk(item.inventoryId, { transaction: t });
                    if (inventory) {
                        await inventory.increment('quantity', { by: item.quantity, transaction: t });
                    }
                }
            }

            // 2. Delete old ServiceItems
            await ServiceItem.destroy({
                where: { invoiceId: id },
                transaction: t
            });

            // 3. Update Invoice basic details
            await invoice.update({
                serviceDetails,
                totalAmount,
                discount,
                finalAmount
            }, { transaction: t });

            // 4. Create new ServiceItems and deduct stock
            if (items && items.length > 0) {
                for (const item of items) {
                    await ServiceItem.create({
                        ...item,
                        invoiceId: invoice.id
                    }, { transaction: t });

                    if (item.inventoryId) {
                        const inventory = await Inventory.findByPk(item.inventoryId, { transaction: t });
                        if (inventory) {
                            if (inventory.quantity < item.quantity) {
                                throw new Error(`Insufficient stock for item: ${item.description || 'N/A'}`);
                            }
                            await inventory.decrement('quantity', { by: item.quantity, transaction: t });
                        }
                    }
                }
            }

            await t.commit();
            res.json(invoice);
        } catch (error) {
            await t.rollback();
            console.error('Error updating service invoice:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async createReturn(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { returnReason } = req.body;

            const inward = await ServiceInward.findByPk(id, { transaction: t });
            if (!inward) {
                throw new Error('Inward record not found');
            }

            if (inward.status !== 'INWARD') {
                throw new Error('Device is already processed (Repaired/Returned)');
            }

            const returnRecord = await ServiceReturn.create({
                inwardId: id,
                returnDate: new Date(),
                returnReason
            }, { transaction: t });

            // Update inward status
            await inward.update({ status: 'RETURNED' }, { transaction: t });

            await t.commit();
            res.status(201).json(returnRecord);
        } catch (error) {
            await t.rollback();
            console.error('Error creating service return:', error);
            res.status(500).json({ message: error.message });
        }
    }

    static async deleteInward(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const service = await ServiceInward.findByPk(id, { transaction: t });

            if (!service) {
                await t.rollback();
                return res.status(404).json({ message: 'Service record not found' });
            }

            if (service.status === 'REPAIRED') {
                await t.rollback();
                return res.status(400).json({ message: 'Cannot delete inward once it has been repaired. Delete the invoice first.' });
            }

            // If status is RETURNED, delete the associated return record first
            if (service.status === 'RETURNED') {
                await ServiceReturn.destroy({
                    where: { inwardId: id },
                    transaction: t
                });
            }

            await service.destroy({ transaction: t });
            await t.commit();
            res.json({ message: 'Inward entry deleted successfully' });
        } catch (error) {
            await t.rollback();
            console.error('Error deleting inward:', error);
            res.status(500).json({ message: 'Error deleting inward entry', error: error.message });
        }
    }

    static async deleteInvoice(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;

            const invoice = await ServiceInvoice.findByPk(id, {
                include: [{ model: ServiceItem, as: 'items' }],
                transaction: t
            });

            if (!invoice) {
                await t.rollback();
                return res.status(404).json({ message: 'Service invoice not found' });
            }

            // Revert Inventory for parts used
            for (const item of invoice.items) {
                if (item.inventoryId) {
                    const inventory = await Inventory.findByPk(item.inventoryId, { transaction: t });
                    if (inventory) {
                        await inventory.increment('quantity', { by: item.quantity, transaction: t });
                    }
                }
            }

            // Delete Invoice (ServiceItems will be deleted via CASCADE)
            await invoice.destroy({ transaction: t });

            // Update parent Inward status back to 'INWARD'
            await ServiceInward.update({ status: 'INWARD' }, {
                where: { id: invoice.inwardId },
                transaction: t
            });

            await t.commit();
            res.json({ message: 'Service invoice deleted and inventory reverted successfully' });
        } catch (error) {
            await t.rollback();
            console.error('Error deleting service invoice:', error);
            res.status(500).json({ message: 'Error deleting service invoice', error: error.message });
        }
    }
}

module.exports = ServiceController;

const { ServiceInward, ServiceInvoice, ServiceReturn, ServiceItem, User, Inventory, Item, sequelize } = require('../models');

class ServiceController {
    static async createInward(req, res) {
        try {
            const {
                customerName, phoneNumber, address,
                brandName, modelNo, problemDetails,
                estimateAmount
            } = req.body;

            // Generate Inward Number
            const count = await ServiceInward.count();
            const inwardNo = `MR/INW/${(count + 1).toString().padStart(3, '0')}`;

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

    static async updateInward(req, res) {
        try {
            const { id } = req.params;
            const service = await ServiceInward.findByPk(id);

            if (!service) {
                return res.status(404).json({ message: 'Service record not found' });
            }

            if (service.status !== 'INWARD') {
                return res.status(400).json({ message: 'Cannot edit inward details once processed' });
            }

            await service.update(req.body);
            res.json(service);
        } catch (error) {
            console.error('Error updating inward:', error);
            res.status(500).json({ message: 'Error updating inward entry', error: error.message });
        }
    }

    static async getAllServices(req, res) {
        try {
            const services = await ServiceInward.findAll({
                include: [
                    { model: User, as: 'receiver', attributes: ['username'] }
                ],
                order: [['created_at', 'DESC']]
            });
            res.json(services);
        } catch (error) {
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
            const invoiceCount = await ServiceInvoice.count({ transaction: t });
            const invoiceNo = `MR/SER/${(invoiceCount + 1).toString().padStart(3, '0')}`;

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
}

module.exports = ServiceController;

const { Sale, SaleItem, Inventory, Item, ServiceInward, ServiceInvoice, ServiceItem, User, sequelize } = require('./src/models');
require('dotenv').config();

async function testDeletion() {
    try {
        console.log('--- Starting Deletion & Inventory Reversion Tests ---');

        // 1. Setup Data
        const user = await User.findOne();
        if (!user) throw new Error('No user found in DB');

        const item = await Item.findOne();
        if (!item) throw new Error('No items found in DB');

        const inventory = await Inventory.create({
            itemId: item.id,
            quantity: 10,
            inwardPrice: 100,
            sellingPrice: 150
        });
        console.log(`Created Inventory Batch: ${inventory.id}, Initial Qty: ${inventory.quantity}`);

        // 2. Test Sale Deletion
        console.log('\nTesting Sale Deletion...');
        const sale = await Sale.create({
            customerName: 'Test Customer',
            paymentMode: 'CASH',
            totalQuantity: 2,
            totalAmount: 300,
            soldBy: user.id
        });
        await SaleItem.create({
            saleId: sale.id,
            itemId: item.id,
            inventoryId: inventory.id,
            quantity: 2,
            price: 150,
            amount: 300
        });
        await inventory.decrement('quantity', { by: 2 });

        await inventory.reload();
        console.log(`Sale Created. Inventory Qty: ${inventory.quantity} (expected 8)`);

        // Now simulate controller delete logic
        const t1 = await sequelize.transaction();
        const saleItems = await SaleItem.findAll({ where: { saleId: sale.id }, transaction: t1 });
        for (const si of saleItems) {
            const inv = await Inventory.findByPk(si.inventoryId, { transaction: t1 });
            await inv.increment('quantity', { by: si.quantity, transaction: t1 });
        }
        await SaleItem.destroy({ where: { saleId: sale.id }, transaction: t1 });
        await Sale.destroy({ where: { id: sale.id }, transaction: t1 });
        await t1.commit();

        await inventory.reload();
        console.log(`Sale Deleted. Inventory Qty: ${inventory.quantity} (expected 10)`);

        if (inventory.quantity === 10) {
            console.log('✅ Sale Deletion Reversion Passed');
        } else {
            console.log('❌ Sale Deletion Reversion Failed');
        }

        // 3. Test Service Invoice Deletion
        console.log('\nTesting Service Invoice Deletion...');
        const inward = await ServiceInward.create({
            inwardNo: 'TEST_INW',
            customerName: 'Test Service',
            phoneNumber: '1234567890',
            brandName: 'Test',
            modelNo: 'Test',
            problemDetails: 'Test',
            estimateAmount: 1000,
            status: 'INWARD',
            receivedBy: user.id
        });

        const invoice = await ServiceInvoice.create({
            inwardId: inward.id,
            invoiceNo: 'TEST_INV',
            invoiceDate: new Date(),
            totalAmount: 500,
            discount: 0,
            finalAmount: 500
        });

        await ServiceItem.create({
            invoiceId: invoice.id,
            itemId: item.id,
            inventoryId: inventory.id,
            quantity: 1,
            price: 200,
            amount: 200
        });
        await inventory.decrement('quantity', { by: 1 });
        await inward.update({ status: 'REPAIRED' });

        await inventory.reload();
        console.log(`Service Invoice Created. Inventory Qty: ${inventory.quantity} (expected 9)`);

        // Simulate deleteInvoice logic
        const t2 = await sequelize.transaction();
        const sItems = await ServiceItem.findAll({ where: { invoiceId: invoice.id }, transaction: t2 });
        for (const si of sItems) {
            if (si.inventoryId) {
                const inv = await Inventory.findByPk(si.inventoryId, { transaction: t2 });
                await inv.increment('quantity', { by: si.quantity, transaction: t2 });
            }
        }
        await ServiceInvoice.destroy({ where: { id: invoice.id }, transaction: t2 });
        await ServiceInward.update({ status: 'INWARD' }, { where: { id: inward.id }, transaction: t2 });
        await t2.commit();

        await inventory.reload();
        await inward.reload();
        console.log(`Service Invoice Deleted. Inventory Qty: ${inventory.quantity} (expected 10)`);
        console.log(`Inward status: ${inward.status} (expected INWARD)`);

        if (inventory.quantity === 10 && inward.status === 'INWARD') {
            console.log('✅ Service Invoice Deletion Reversion Passed');
        } else {
            console.log('❌ Service Invoice Deletion Reversion Failed');
        }

        // Cleanup
        await inward.destroy();
        await inventory.destroy();

        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testDeletion();

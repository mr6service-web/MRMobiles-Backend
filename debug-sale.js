const { Sale, SaleItem, sequelize } = require('./src/models');

async function debugSale() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Database connected.');

        const sales = await Sale.findAll();
        console.log(`Found ${sales.length} sales.`);

        if (sales.length > 0) {
            const saleId = sales[0].id;
            console.log(`Checking Sale ID: ${saleId}`);

            const sale = await Sale.findByPk(saleId, {
                include: [{
                    model: SaleItem,
                    as: 'items'
                }]
            });

            console.log('Sale with Items:', JSON.stringify(sale, null, 2));

            // Also check SaleItems directly
            const items = await SaleItem.findAll({ where: { saleId: saleId } });
            console.log(`Direct query for SaleItems with saleId ${saleId}: found ${items.length} items.`);
            console.log('Items:', JSON.stringify(items, null, 2));
        } else {
            console.log('No sales found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugSale();

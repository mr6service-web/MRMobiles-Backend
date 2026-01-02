const { Sequelize } = require('sequelize');
const sequelize = require('./src/config/database');
const ServiceInward = require('./src/models/ServiceInward');

async function debugData() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const records = await ServiceInward.findAll({
            attributes: ['id', 'inwardNo', 'customerName']
        });

        console.log('--- DB RECORD DUMP ---');
        records.forEach(r => {
            console.log(`ID: ${r.id}, InwardNo: '${r.inwardNo}', Customer: ${r.customerName}`);
        });
        console.log('----------------------');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

debugData();

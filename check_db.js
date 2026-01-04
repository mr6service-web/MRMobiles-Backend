
const { ServiceInward } = require('./src/models');

async function checkInwards() {
    try {
        const inwards = await ServiceInward.findAll({
            attributes: ['id', 'inwardNo'],
            order: [['id', 'DESC']],
            limit: 10
        });
        console.log('Last 10 inwards:');
        console.table(inwards.map(i => i.toJSON()));

        const count = await ServiceInward.count();
        console.log('Count:', count);
        console.log('Proposed next inwardNo (count + 1):', (count + 1).toString().padStart(4, '0'));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkInwards();

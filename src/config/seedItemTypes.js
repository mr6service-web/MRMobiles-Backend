const { ItemType } = require('../models');

async function seedItemTypes() {
    try {
        const types = [
            { name: 'Accessory' },
            { name: 'Panel' },
            { name: 'Display' }
        ];

        for (const type of types) {
            await ItemType.findOrCreate({
                where: { name: type.name },
                defaults: type
            });
        }

        console.log('Item types seeded successfully');
    } catch (error) {
        console.error('Error seeding item types:', error);
    }
}

module.exports = seedItemTypes;

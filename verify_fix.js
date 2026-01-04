
const { ServiceInward } = require('./src/models');

async function verifyNewLogic() {
    try {
        const lastInward = await ServiceInward.findOne({
            order: [['id', 'DESC']]
        });

        console.log('Last inward in DB:', lastInward ? lastInward.toJSON() : 'None');

        let nextNo = 1;
        if (lastInward && lastInward.inwardNo) {
            const match = lastInward.inwardNo.match(/\d+/);
            if (match) {
                nextNo = parseInt(match[0], 10) + 1;
            }
        }
        const inwardNo = nextNo.toString().padStart(4, '0');
        console.log('Proposed next inwardNo (new logic):', inwardNo);

        const count = await ServiceInward.count();
        console.log('Old logic would have proposed:', (count + 1).toString().padStart(4, '0'));

        if (inwardNo !== (count + 1).toString().padStart(4, '0')) {
            console.log('SUCCESS: New logic avoids collision!');
        } else {
            console.log('NOTE: New logic and old logic match, this happens if no records were deleted.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

verifyNewLogic();

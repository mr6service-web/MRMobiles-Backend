const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sales/1',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response:');
        const parsed = JSON.parse(data);
        console.log(JSON.stringify(parsed, null, 2));
        console.log('\nItems array:', parsed.items);
        console.log('Items length:', parsed.items?.length);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.end();

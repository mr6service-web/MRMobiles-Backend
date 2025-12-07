const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const seedItemTypes = require('./config/seedItemTypes');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const itemRoutes = require('./routes/item.routes');
const itemTypeRoutes = require('./routes/itemType.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const saleRoutes = require('./routes/sale.routes');
const userRoutes = require('./routes/user.routes');
const welcomeRoutes = require('./routes/welcome.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Fullstack App API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/item-types', itemTypeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/welcome', welcomeRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Sync database and start server
sequelize.sync({ alter: true }) // Use { force: true } to drop tables on every restart (dev only)
    .then(async () => {
        console.log('Database synced successfully');

        // Seed item types
        await seedItemTypes();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    });

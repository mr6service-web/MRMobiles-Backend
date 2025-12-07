# MRMobiles Backend

Node.js backend API for MRMobiles - a mobile sales and inventory management system.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, bcryptjs, CORS
- **Process Manager**: PM2 (for production)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MRMobiles-Backend.git
cd MRMobiles-Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mrmobiles
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:4200
```

### 4. Set Up Database

Create a PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mrmobiles;

# Create user (optional)
CREATE USER mrmobiles_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mrmobiles TO mrmobiles_user;
```

### 5. Run the Application

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files (database, etc.)
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # API routes
│   ├── utils/          # Utility functions
│   └── server.js       # Application entry point
├── .env                # Environment variables (not in git)
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

## Deployment

See [AWS-EC2-Deployment-Guide.md](./AWS-EC2-Deployment-Guide.md) for detailed deployment instructions.

### Quick Deployment Steps

1. **Set up EC2 instance** with Amazon Linux 2023
2. **Install Node.js and PM2**
3. **Clone repository** to `/var/www/mrmobiles-backend`
4. **Configure environment variables**
5. **Install dependencies**: `npm install --production`
6. **Start with PM2**: `pm2 start ecosystem.config.js`
7. **Configure Nginx** as reverse proxy
8. **Set up SSL** with Let's Encrypt

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `DB_HOST` | PostgreSQL host | Yes | - |
| `DB_PORT` | PostgreSQL port | No | 5432 |
| `DB_NAME` | Database name | Yes | - |
| `DB_USER` | Database user | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 24h |
| `CORS_ORIGIN` | Allowed CORS origins | No | * |

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with nodemon
- `npm test` - Run tests (when implemented)

## Security

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configured to allow requests from frontend domain
- **JWT**: Secure token-based authentication
- **bcryptjs**: Password hashing
- **Environment Variables**: Sensitive data stored in `.env` file

## Database Schema

The application uses Sequelize ORM with the following main models:

- **User**: User accounts and authentication
- **Product**: Product inventory
- **Customer**: Customer information
- **Sale**: Sales transactions
- **SaleItem**: Individual items in a sale

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

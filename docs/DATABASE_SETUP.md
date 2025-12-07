# Database Setup Instructions

Before running the backend server, you need to create the database and users table.

## Option 1: Using psql command line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mrmobiles_db;

# Connect to the database
\c mrmobiles_db

# Run the init script
\i backend/init-db.sql

# Exit
\q
```

## Option 2: Using pgAdmin or any PostgreSQL client

1. Create a new database named `mrmobiles_db`
2. Run the SQL script from `backend/init-db.sql`

## Environment Variables

Make sure your `backend/.env` file has the correct database credentials:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mrmobiles_db
DB_PASSWORD=your_password
DB_PORT=5432
```

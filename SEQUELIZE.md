# Sequelize ORM Setup

The backend now uses Sequelize ORM for database operations with automatic timestamp tracking.

## Features

- **Automatic Timestamps**: `createdAt` and `updatedAt` are automatically managed by Sequelize
- **User Tracking**: `createdBy` and `updatedBy` fields track which user created/modified records
- **Model Validation**: Built-in validation for username and password fields
- **Connection Pooling**: Configured for optimal database performance

## Database Schema

### Users Table
```javascript
{
  id: INTEGER (Primary Key, Auto Increment),
  username: STRING(255) (Unique, Not Null),
  password: STRING(255) (Not Null),
  createdBy: INTEGER (Foreign Key to users.id),
  updatedBy: INTEGER (Foreign Key to users.id),
  createdAt: TIMESTAMP (Auto-managed),
  updatedAt: TIMESTAMP (Auto-managed)
}
```

## Auto-Sync

The server automatically syncs the database schema on startup using:
```javascript
sequelize.sync({ alter: true })
```

**Note**: In production, use migrations instead of auto-sync.

## Usage Example

### Creating a User with Tracking
```javascript
const newUser = await User.create({
  username: 'john',
  password: hashedPassword
}, { userId: currentUserId }); // Pass userId in options for createdBy tracking
```

### Updating a User with Tracking
```javascript
await user.update({
  username: 'newUsername'
}, { userId: currentUserId }); // Pass userId in options for updatedBy tracking
```

## Migration to Sequelize

The following changes were made:
1. Installed `sequelize`, `pg`, `pg-hstore`, and `sequelize-cli`
2. Created `src/config/database.js` for Sequelize connection
3. Created `src/models/User.js` with timestamp tracking
4. Updated `auth.controller.js` to use Sequelize models
5. Modified `server.js` to sync database on startup

## Next Steps

For production, consider:
1. Using Sequelize migrations instead of auto-sync
2. Implementing proper error handling for database operations
3. Adding database indexes for performance optimization

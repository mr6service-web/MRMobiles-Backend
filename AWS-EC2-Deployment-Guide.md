# AWS EC2 Deployment Guide for MRMobiles Backend

This guide provides detailed steps to deploy your Node.js backend application on AWS EC2 using Amazon Linux 2023.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Server Configuration](#server-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Process Management with PM2](#process-management-with-pm2)
7. [Nginx Reverse Proxy Setup](#nginx-reverse-proxy-setup)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Security Best Practices](#security-best-practices)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Prerequisites

Before you begin, ensure you have:
- ✅ AWS account with EC2 instance created
- ✅ EC2 instance running Amazon Linux 2023
- ✅ SSH key pair (.pem file) for EC2 access
- ✅ Domain name (optional, for SSL setup)
- ✅ PostgreSQL database (RDS or self-hosted)

---

## EC2 Instance Setup

### 1. Configure Security Group

Your EC2 security group needs the following inbound rules:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Node.js app (temporary) |
| PostgreSQL | TCP | 5432 | Security Group ID | Database (if self-hosted) |

> [!WARNING]
> After setting up Nginx, remove port 3000 from public access for security.

### 2. Connect to EC2 Instance

```bash
# Set proper permissions for your key file
chmod 400 your-key-pair.pem

# Connect to your EC2 instance
ssh -i "your-key-pair.pem" ec2-user@your-ec2-public-ip
```

---

## Server Configuration

### 1. Update System Packages

```bash
# Update all packages
sudo dnf update -y
```

### 2. Install Node.js

Amazon Linux 2023 uses `dnf` package manager. Install Node.js 18.x or later:

```bash
# Install Node.js 18.x
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

If you need a specific Node.js version, use `nvm`:

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load nvm
source ~/.bashrc

# Install Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. Install Git

```bash
sudo dnf install -y git

# Verify installation
git --version
```

### 4. Install Build Tools

```bash
# Install development tools (needed for some npm packages)
sudo dnf groupinstall -y "Development Tools"
```

---

## Database Setup

### Option A: Using AWS RDS PostgreSQL (Recommended)

1. **Create RDS PostgreSQL Instance**
   - Go to AWS RDS Console
   - Create PostgreSQL database
   - Choose appropriate instance type (t3.micro for testing)
   - Configure VPC and security groups
   - Note down the endpoint, username, and password

2. **Configure Security Group**
   - Allow inbound PostgreSQL (5432) from EC2 security group

### Option B: Self-Hosted PostgreSQL on EC2

```bash
# Install PostgreSQL
sudo dnf install -y postgresql15 postgresql15-server

# Initialize database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql
```

In PostgreSQL shell:

```sql
-- Create database
CREATE DATABASE mrmobiles;

-- Create user
CREATE USER mrmobiles_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mrmobiles TO mrmobiles_user;

-- Exit
\q
```

Configure PostgreSQL to accept connections:

```bash
# Edit postgresql.conf
sudo nano /var/lib/pgsql/data/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'  # or '*' for all interfaces

# Edit pg_hba.conf
sudo nano /var/lib/pgsql/data/pg_hba.conf

# Add this line for local connections:
host    all             all             127.0.0.1/32            md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Application Deployment

### 1. Create Application Directory

```bash
# Create directory for your application
sudo mkdir -p /var/www/mrmobiles-backend
sudo chown -R ec2-user:ec2-user /var/www/mrmobiles-backend
cd /var/www/mrmobiles-backend
```

### 2. Clone or Upload Your Application

**Option A: Using Git (Recommended)**

```bash
# Clone your repository
git clone https://github.com/your-username/mrmobiles-backend.git .

# Or if using private repository
git clone https://<token>@github.com/your-username/mrmobiles-backend.git .
```

**Option B: Using SCP to Upload Files**

From your local machine:

```bash
# Navigate to your backend directory
cd d:\Projects\MRMobiles\backend

# Upload files to EC2
scp -i "your-key-pair.pem" -r * ec2-user@your-ec2-public-ip:/var/www/mrmobiles-backend/
```

### 3. Install Dependencies

```bash
cd /var/www/mrmobiles-backend
npm install --production
```

### 4. Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=mrmobiles
DB_USER=mrmobiles_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration (your frontend URL)
CORS_ORIGIN=https://yourdomain.com
```

> [!IMPORTANT]
> Replace all placeholder values with your actual configuration. Use strong passwords and secrets in production.

### 5. Test the Application

```bash
# Test run
npm start
```

If successful, you should see:
```
Server is running on port 3000
Database synced successfully
```

Press `Ctrl+C` to stop the test run.

---

## Process Management with PM2

PM2 keeps your application running continuously and restarts it automatically if it crashes.

### 1. Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Ecosystem File

```bash
cd /var/www/mrmobiles-backend
nano ecosystem.config.js
```

Add the following configuration:

```javascript
module.exports = {
  apps: [{
    name: 'mrmobiles-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 3. Create Logs Directory

```bash
mkdir -p logs
```

### 4. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs

# Monitor
pm2 monit
```

### 5. Configure PM2 to Start on Boot

```bash
# Generate startup script
pm2 startup

# Copy and run the command that PM2 outputs

# Save current PM2 process list
pm2 save
```

### 6. Useful PM2 Commands

```bash
# Restart application
pm2 restart mrmobiles-backend

# Stop application
pm2 stop mrmobiles-backend

# View logs
pm2 logs mrmobiles-backend

# View detailed info
pm2 show mrmobiles-backend

# Delete from PM2
pm2 delete mrmobiles-backend
```

---

## Nginx Reverse Proxy Setup

Nginx acts as a reverse proxy, forwarding requests to your Node.js application.

### 1. Install Nginx

```bash
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Configure Nginx

```bash
# Create configuration file
sudo nano /etc/nginx/conf.d/mrmobiles-backend.conf
```

Add the following configuration:

```nginx
# Rate limiting zone
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

upstream backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 public IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/mrmobiles-backend-access.log;
    error_log /var/log/nginx/mrmobiles-backend-error.log;

    # Client body size limit
    client_max_body_size 10M;

    location / {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Proxy settings
        proxy_pass http://backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend;
    }
}
```

### 3. Test and Restart Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### 4. Update Security Group

Now that Nginx is handling traffic on port 80, you can remove direct access to port 3000:
- Remove the port 3000 inbound rule from your EC2 security group

---

## SSL Certificate Setup

### Using Let's Encrypt (Free SSL)

> [!NOTE]
> You need a domain name pointing to your EC2 instance for SSL setup.

### 1. Install Certbot

```bash
# Install certbot
sudo dnf install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
# Get certificate and auto-configure Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

### 3. Auto-Renewal Setup

Certbot automatically sets up renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run
```

### 4. Verify SSL

Visit `https://your-domain.com` to verify SSL is working.

---

## Security Best Practices

### 1. Configure Firewall (firewalld)

```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow SSH (if not already allowed)
sudo firewall-cmd --permanent --add-service=ssh

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

### 2. Disable Root Login

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Find and set:
PermitRootLogin no
PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

### 3. Keep System Updated

```bash
# Set up automatic security updates
sudo dnf install -y dnf-automatic

# Configure automatic updates
sudo nano /etc/dnf/automatic.conf

# Set: apply_updates = yes

# Enable and start
sudo systemctl enable --now dnf-automatic.timer
```

### 4. Environment Variables Security

```bash
# Ensure .env file has proper permissions
chmod 600 /var/www/mrmobiles-backend/.env

# Verify
ls -la /var/www/mrmobiles-backend/.env
```

### 5. Database Security

- Use strong passwords
- Restrict database access to application server only
- Enable SSL for database connections
- Regular backups

---

## Monitoring and Maintenance

### 1. Monitor Application Logs

```bash
# PM2 logs
pm2 logs mrmobiles-backend

# Nginx access logs
sudo tail -f /var/log/nginx/mrmobiles-backend-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/mrmobiles-backend-error.log

# System logs
sudo journalctl -u nginx -f
```

### 2. Monitor System Resources

```bash
# Install htop
sudo dnf install -y htop

# Monitor resources
htop

# Check disk space
df -h

# Check memory
free -h
```

### 3. Database Backups

**For RDS:**
- Configure automated backups in RDS console
- Set retention period (7-35 days)

**For Self-Hosted PostgreSQL:**

```bash
# Create backup script
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ec2-user/db-backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U mrmobiles_user -h localhost mrmobiles > $BACKUP_DIR/mrmobiles_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "mrmobiles_*.sql" -mtime +7 -delete
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /home/ec2-user/backup-db.sh
```

### 4. Application Updates

```bash
# Navigate to application directory
cd /var/www/mrmobiles-backend

# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies
npm install --production

# Restart application
pm2 restart mrmobiles-backend

# Check status
pm2 status
```

---

## Quick Reference Commands

### Application Management

```bash
# Start application
pm2 start ecosystem.config.js

# Restart application
pm2 restart mrmobiles-backend

# Stop application
pm2 stop mrmobiles-backend

# View logs
pm2 logs mrmobiles-backend

# Monitor
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx (graceful)
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

### Database Management

```bash
# Connect to PostgreSQL
psql -U mrmobiles_user -d mrmobiles

# Backup database
pg_dump -U mrmobiles_user mrmobiles > backup.sql

# Restore database
psql -U mrmobiles_user mrmobiles < backup.sql
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs mrmobiles-backend --lines 100

# Check if port is in use
sudo lsof -i :3000

# Check environment variables
cat /var/www/mrmobiles-backend/.env

# Test database connection
psql -U mrmobiles_user -h your-db-host -d mrmobiles
```

### Nginx Issues

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# Check if port 80/443 is open
sudo netstat -tlnp | grep nginx
```

### Database Connection Issues

```bash
# Test database connectivity
psql -U mrmobiles_user -h your-db-host -d mrmobiles

# Check PostgreSQL logs (if self-hosted)
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log

# Verify security group allows connection
# Check RDS security group or EC2 security group
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Check PM2 processes
pm2 list

# Restart application
pm2 restart mrmobiles-backend

# Consider increasing instance size if needed
```

---

## Next Steps

After deployment:

1. ✅ Test all API endpoints
2. ✅ Configure frontend to use new backend URL
3. ✅ Set up monitoring (CloudWatch, Datadog, etc.)
4. ✅ Configure automated backups
5. ✅ Set up CI/CD pipeline (GitHub Actions, Jenkins, etc.)
6. ✅ Document API endpoints
7. ✅ Set up error tracking (Sentry, Rollbar, etc.)

---

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

> [!TIP]
> Save this guide for future reference and updates. Consider creating a deployment checklist based on these steps for consistent deployments.

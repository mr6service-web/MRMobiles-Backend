# Backend Redeployment Guide - New Repository

This guide provides detailed steps to redeploy your MRMobiles backend from the new separate repository to your EC2 instance.

## Overview

**Current Deployment Location**: `/var/www/mrmobiles-backend/MR-Mobiles/backend`  
**New Deployment Location**: `/var/www/MRMobiles-Backend`  
**New Repository**: MRMobiles-Backend (separate repository)

> [!NOTE]
> We'll remove the entire old `mrmobiles-backend` folder and clone the new repository fresh into `/var/www/`.

## Prerequisites

✅ New backend repository created and pushed to GitHub  
✅ SSH access to EC2 instance  
✅ EC2 SSH key (.pem file)  
✅ Backend currently running on EC2

---

## Step-by-Step Redeployment Process

### Step 1: Connect to EC2 Instance

```bash
# From your local machine (PowerShell or Command Prompt)
ssh -i "path\to\your-key-pair.pem" ec2-user@your-ec2-public-ip
```

> Replace `path\to\your-key-pair.pem` with your actual key file path and `your-ec2-public-ip` with your EC2 instance IP.

---

### Step 2: Backup Current Deployment

Before making changes, create a backup of your current deployment:

```bash
# Create backup directory
sudo mkdir -p /home/ec2-user/backups

# Backup current deployment
sudo cp -r /var/www/mrmobiles-backend /home/ec2-user/backups/mrmobiles-backend-$(date +%Y%m%d_%H%M%S)

# Backup .env file separately (important!)
sudo cp /var/www/mrmobiles-backend/MR-Mobiles/backend/.env /home/ec2-user/backups/.env.backup

# Verify backup
ls -la /home/ec2-user/backups/
```

---

### Step 3: Stop Current Application

```bash
# Stop the running application with PM2
pm2 stop mrmobiles-backend

# Verify it's stopped
pm2 status
```

---

### Step 4: Remove Old Deployment

```bash
# Navigate to /var/www
cd /var/www

# Remove the entire old deployment folder
sudo rm -rf mrmobiles-backend

# Verify removal
ls -la /var/www
```

---

### Step 5: Clone New Repository

```bash
# Navigate to /var/www
cd /var/www

# Clone the new backend repository (this will create MRMobiles-Backend folder)
# Use sudo because /var/www requires elevated permissions
# Option A: Public repository
sudo git clone https://github.com/mr6service-web/MRMobiles-Backend.git

# Option B: Private repository (using personal access token)
sudo git clone https://YOUR_GITHUB_TOKEN@github.com/mr6service-web/MRMobiles-Backend.git

# Fix ownership immediately after cloning
sudo chown -R ec2-user:ec2-user /var/www/MRMobiles-Backend

# Verify the repository was cloned
ls -la /var/www/MRMobiles-Backend

# You should see files like: src/, package.json, README.md, etc.
```

> [!NOTE]
> We use `sudo` for git clone because `/var/www` requires elevated permissions. We immediately fix ownership afterward so you can work with the files normally.

**Creating GitHub Personal Access Token** (if needed):
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token and use it in the clone command

---

### Step 6: Restore Environment Variables

```bash
# Copy the backed-up .env file to the new location
sudo cp /home/ec2-user/backups/.env.backup /var/www/MRMobiles-Backend/.env

# Set proper ownership
sudo chown ec2-user:ec2-user /var/www/MRMobiles-Backend/.env

# Set proper permissions (important for security)
chmod 600 /var/www/MRMobiles-Backend/.env

# Verify .env file exists and has correct permissions
ls -la /var/www/MRMobiles-Backend/.env
cat /var/www/MRMobiles-Backend/.env
```

> [!NOTE]
> Review the `.env` file to ensure all variables are correct. Update if needed.

---

### Step 7: Update Directory Ownership

```bash
# Set ownership to ec2-user
sudo chown -R ec2-user:ec2-user /var/www/MRMobiles-Backend

# Verify ownership
ls -la /var/www/MRMobiles-Backend
```

---

### Step 8: Install Dependencies

```bash
# Navigate to backend directory
cd /var/www/MRMobiles-Backend

# Install production dependencies
npm install --production

# If you encounter permission issues, try:
# npm install --production --unsafe-perm
```

---

### Step 9: Update PM2 Configuration

The PM2 ecosystem file might need updating since the directory structure changed.

```bash
# Check if ecosystem.config.js exists
cat /var/www/MRMobiles-Backend/ecosystem.config.js
```

If the file exists and the `script` path is correct (should be `src/server.js`), you're good. If not, create/update it:

```bash
nano /var/www/MRMobiles-Backend/ecosystem.config.js
```

Ensure it contains:

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

Save and exit (Ctrl+X, then Y, then Enter).

---

### Step 10: Create Logs Directory

```bash
# Create logs directory
mkdir -p /var/www/MRMobiles-Backend/logs

# Verify
ls -la /var/www/MRMobiles-Backend/
```

---

### Step 11: Test the Application

Before starting with PM2, test the application manually:

```bash
cd /var/www/MRMobiles-Backend

# Test run
npm start
```

You should see:
```
Server is running on port 3000
Database synced successfully
```

If you see errors:
- Check database connection settings in `.env`
- Verify PostgreSQL is running and accessible
- Check logs for specific error messages

Press `Ctrl+C` to stop the test run.

---

### Step 12: Start Application with PM2

```bash
# Delete old PM2 process (if exists)
pm2 delete mrmobiles-backend

# Start application with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs to ensure it's running correctly
pm2 logs mrmobiles-backend --lines 50
```

---

### Step 13: Save PM2 Configuration

```bash
# Save current PM2 process list
pm2 save

# Verify startup script is configured
pm2 startup

# If it outputs a command, copy and run it
```

---

### Step 14: Update Nginx Configuration (if needed)

Check if Nginx configuration needs updating due to path changes:

```bash
# View current Nginx configuration
sudo cat /etc/nginx/conf.d/mrmobiles-backend.conf
```

The configuration should already be pointing to `http://127.0.0.1:3000`, so no changes should be needed. However, if you want to verify:

```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

### Step 15: Verify Deployment

#### Test Local Access (from EC2)

```bash
# Test backend API locally
curl http://localhost:3000/api/health

# Or test a specific endpoint
curl http://localhost:3000/api/
```

#### Test External Access (from your local machine)

```bash
# From PowerShell on your local machine
# Replace with your EC2 public IP or domain
curl http://your-ec2-public-ip/api/health
```

Or open in browser:
```
http://your-ec2-public-ip/api/
```

---

### Step 16: Monitor Application

```bash
# View real-time logs
pm2 logs mrmobiles-backend

# Monitor application
pm2 monit

# Check detailed info
pm2 show mrmobiles-backend

# Check system resources
htop
```

---

## Path Changes Summary

| Item | Old Path | New Path |
|------|----------|----------|
| **Application Root** | `/var/www/mrmobiles-backend/MR-Mobiles/backend` | `/var/www/MRMobiles-Backend` |
| **Source Code** | `/var/www/mrmobiles-backend/MR-Mobiles/backend/src` | `/var/www/MRMobiles-Backend/src` |
| **Environment File** | `/var/www/mrmobiles-backend/MR-Mobiles/backend/.env` | `/var/www/MRMobiles-Backend/.env` |
| **PM2 Config** | `/var/www/mrmobiles-backend/MR-Mobiles/backend/ecosystem.config.js` | `/var/www/MRMobiles-Backend/ecosystem.config.js` |
| **Logs** | `/var/www/mrmobiles-backend/MR-Mobiles/backend/logs` | `/var/www/MRMobiles-Backend/logs` |

---

## Future Updates Workflow

After this redeployment, future updates will be simpler:

```bash
# SSH to EC2
ssh -i "your-key-pair.pem" ec2-user@your-ec2-public-ip

# Navigate to application directory
cd /var/www/MRMobiles-Backend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart application
pm2 restart mrmobiles-backend

# Check status
pm2 status

# View logs
pm2 logs mrmobiles-backend --lines 50
```

---

## Troubleshooting

### Issue: Git Clone Fails

**Error**: `Permission denied` or `Authentication failed`

**Solution**:
```bash
# For private repositories, use personal access token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/MRMobiles-Backend.git .

# Or configure SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add this public key to GitHub → Settings → SSH and GPG keys
```

### Issue: PM2 Won't Start

**Error**: Application fails to start

**Solution**:
```bash
# Check PM2 logs for errors
pm2 logs mrmobiles-backend --lines 100

# Common issues:
# 1. Database connection - check .env file
# 2. Port already in use - check with: sudo lsof -i :3000
# 3. Missing dependencies - run: npm install --production
```

### Issue: Database Connection Failed

**Error**: `ECONNREFUSED` or database connection errors

**Solution**:
```bash
# Test database connection
psql -U mrmobiles_user -h your-db-host -d mrmobiles

# Check .env file has correct credentials
cat /var/www/MRMobiles-Backend/.env

# Verify PostgreSQL is running (if self-hosted)
sudo systemctl status postgresql

# Check security group allows connection from EC2
```

### Issue: Nginx 502 Bad Gateway

**Error**: Nginx returns 502 error

**Solution**:
```bash
# Check if backend is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart backend
pm2 restart mrmobiles-backend

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Permission Denied Errors

**Error**: Permission errors when running commands

**Solution**:
```bash
# Fix ownership
sudo chown -R ec2-user:ec2-user /var/www/MRMobiles-Backend

# Fix .env permissions
chmod 600 /var/www/MRMobiles-Backend/.env

# Fix logs directory
chmod 755 /var/www/MRMobiles-Backend/logs
```

---

## Rollback Procedure

If something goes wrong, you can rollback to the previous deployment:

```bash
# Stop current application
pm2 stop mrmobiles-backend

# Remove new deployment
sudo rm -rf /var/www/MRMobiles-Backend

# Restore from backup (recreate old structure)
sudo cp -r /home/ec2-user/backups/mrmobiles-backend-TIMESTAMP /var/www/mrmobiles-backend

# Fix ownership
sudo chown -R ec2-user:ec2-user /var/www/mrmobiles-backend

# Restart application
pm2 restart mrmobiles-backend
```

---

## Post-Deployment Checklist

After successful deployment, verify:

- ✅ Application is running: `pm2 status`
- ✅ No errors in logs: `pm2 logs mrmobiles-backend`
- ✅ API endpoints respond: `curl http://localhost:3000/api/health`
- ✅ External access works: Test from browser
- ✅ Database connections work: Check application logs
- ✅ PM2 startup configured: `pm2 startup` and `pm2 save`
- ✅ Nginx is running: `sudo systemctl status nginx`
- ✅ SSL certificate valid (if configured): Check in browser

---

## Additional Notes

### GitHub Actions Deployment

If you set up GitHub Actions for automatic deployment, future updates will be even simpler:

1. Make changes to code locally
2. Commit and push to GitHub
3. GitHub Actions automatically deploys to EC2

Refer to the deployment workflow in `.github/workflows/deploy-backend.yml` in your new repository.

### Security Reminders

- ✅ Keep `.env` file permissions at `600`
- ✅ Never commit `.env` to Git
- ✅ Use strong database passwords
- ✅ Keep system packages updated: `sudo dnf update -y`
- ✅ Monitor application logs regularly
- ✅ Set up automated backups

---

## Need Help?

- Check PM2 logs: `pm2 logs mrmobiles-backend`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check system logs: `sudo journalctl -xe`
- Refer to: [AWS-EC2-Deployment-Guide.md](file:///D:/Projects/MRMobiles/backend/AWS-EC2-Deployment-Guide.md)

---

## Summary

You have successfully redeployed your backend from the new separate repository! The application is now:

- ✅ Running from `/var/www/MRMobiles-Backend`
- ✅ Using the new repository structure
- ✅ Managed by PM2 with auto-restart
- ✅ Proxied through Nginx
- ✅ Ready for future updates via `git pull`

Happy coding! 🚀

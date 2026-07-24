---
name: server-deploy
description: Use when deploying, configuring, or managing the Node.js server, PM2 process manager, environment variables, or production setup. Covers server startup, monitoring, and troubleshooting.
---

# Server Deployment & Management

This skill covers server operations for the "Montagem de Teto Falso" project.

## Environment Setup

### Environment Variables (.env)
```env
# Server
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-secret-key-here
BCRYPT_SALT_ROUNDS=12

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Install Dependencies
```bash
npm install
```

## Running the Server

### Development Mode
```bash
# Direct node execution
node server.js

# Or with npm script
npm start
```

### Production Mode (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name "teto-falso"

# PM2 commands
pm2 status              # View status
pm2 logs teto-falso     # View logs
pm2 restart teto-falso  # Restart app
pm2 stop teto-falso     # Stop app
pm2 delete teto-falso   # Remove app
```

## Windows Service Setup

### Using NSSM (Non-Sucking Service Manager)
```powershell
# Download NSSM from https://nssm.cc/download

# Install service
nssm install TetoFalso "C:\Program Files\nodejs\node.exe" "C:\path\to\server.js"
nssm set TetoFalso AppDirectory "C:\path\to\project"
nssm set TetoFalso DisplayName "Teto Falso Service"
nssm set TetoFalso Start SERVICE_AUTO_START

# Start service
nssm start TetoFalso

# Manage service
nssm status TetoFalso
nssm restart TetoFalso
nssm stop TetoFalso
```

## Backup Operations

### Database Backup
```powershell
# Create backup with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "database.db" "backups\database_$timestamp.db"

# Keep only last 7 backups
Get-ChildItem "backups\database_*.db" | 
  Sort-Object CreationTime -Descending | 
  Select-Object -Skip 7 | 
  Remove-Item -Force
```

### Automated Backup Script
```powershell
# backup.ps1
$backupDir = "C:\path\to\backups"
$dbPath = "C:\path\to\database.db"
$retentionDays = 7

# Create backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $dbPath "$backupDir\database_$timestamp.db"

# Remove old backups
Get-ChildItem "$backupDir\database_*.db" | 
  Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-$retentionDays) } | 
  Remove-Item -Force
```

## Monitoring

### Health Check
```powershell
# Simple health check
Invoke-RestMethod -Uri "http://localhost:3001/api/configuracoes" -Method Get
```

### PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs --lines 100
```

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Database Locked
1. Stop the server
2. Check for other SQLite connections
3. Restart the server

### View Logs
```powershell
# PM2 logs
pm2 logs teto-falso

# Windows Event Viewer
Get-EventLog -LogName Application -Source "TetoFalso" -Newest 50
```

## Performance Optimization

### Node.js Flags
```bash
# Increase memory limit
node --max-old-space-size=4096 server.js

# Enable cluster mode with PM2
pm2 start server.js -i max
```

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Change default admin password
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable CORS restrictions
- [ ] Regular database backups
- [ ] Monitor access logs

## Quick Reference

| Task | Command |
|------|---------|
| Start server | `pm2 start server.js --name teto-falso` |
| View status | `pm2 status` |
| View logs | `pm2 logs teto-falso` |
| Restart | `pm2 restart teto-falso` |
| Backup DB | `Copy-Item database.db backups\db_$(Get-Date -f yyyyMMdd).db` |
| Check port | `netstat -ano | findstr :3001` |

## Files Reference

- `server.js` - Main application entry point
- `.env` - Environment configuration
- `package.json` - Dependencies and scripts

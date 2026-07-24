---
name: sqlite-database
description: Use when working with the SQLite database (database.db), creating/modifying tables, running queries, performing backups, or troubleshooting database issues. Covers schema changes, migrations, and data manipulation.
---

# SQLite Database Management

This skill covers all database operations for the "Montagem de Teto Falso" project using SQLite.

## Database Location

- **File**: `database.db` (root directory)
- **Driver**: `sqlite3` npm package
- **Connection**: `database.js` (shared module)

## Common Operations

### Querying Data
```javascript
const db = require('./database');

// Get single record
db.get('SELECT * FROM usuarios WHERE id = ?', [userId], (err, row) => {
  if (err) return console.error(err.message);
  console.log(row);
});

// Get multiple records
db.all('SELECT * FROM servicos ORDER BY created_at DESC', [], (err, rows) => {
  if (err) return console.error(err.message);
  console.log(rows);
});
```

### Inserting Data
```javascript
db.run(
  'INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)',
  [nome, telefone, email],
  function(err) {
    if (err) return console.error(err.message);
    console.log('Inserted ID:', this.lastID);
  }
);
```

### Updating Data
```javascript
db.run(
  'UPDATE usuarios SET nome = ? WHERE id = ?',
  [newName, userId],
  function(err) {
    if (err) return console.error(err.message);
    console.log('Rows affected:', this.changes);
  }
);
```

## Adding New Columns

Always check if column exists before adding:
```javascript
db.run(`ALTER TABLE table_name ADD COLUMN column_name TYPE`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error:', err.message);
  }
});
```

## Backup Operations

### Export Database
```powershell
# Windows PowerShell
Copy-Item "database.db" "backups/database_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

### Import/Restore
```powershell
Stop-Service "node-service"  # Stop server first
Copy-Item "backups/database_backup.db" "database.db" -Force
Start-Service "node-service"
```

## Troubleshooting

### Database Locked
- Ensure only one connection is active
- Close any SQLite browser tools
- Restart the Node.js server

### Check Database Integrity
```bash
sqlite3 database.db "PRAGMA integrity_check;"
```

## Performance Tips

1. Use indexes for frequently queried columns
2. Use `?` placeholders for parameterized queries
3. Avoid `SELECT *` in production code
4. Use transactions for bulk operations

## Files Reference

- `database.js` - Main database initialization and connection
- `database.db` - SQLite database file
- `.gitignore` - Excludes database.db from version control

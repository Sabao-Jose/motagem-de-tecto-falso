---
name: nodejs-api
description: Use when working with Express.js routes, API endpoints, middleware, authentication (JWT), or backend logic. Covers route creation, validation, error handling, and API testing.
---

# Node.js API Development

This skill covers the Express.js backend for the "Montagem de Teto Falso" project.

## Project Structure

```
├── server.js           # Main Express application
├── database.js         # SQLite connection
├── middleware/
│   ├── auth.js         # JWT authentication
│   ├── audit.js        # Audit logging
│   ├── security.js     # Helmet, CORS, rate limiting
│   └── validation.js   # Input validation
├── routes/
│   ├── ai.js           # AI agent routes
│   └── security.js     # Security routes
└── services/
    └── aiAgent.js      # AI agent service
```

## Adding New Routes

### Basic Route Structure
```javascript
// In server.js
app.get('/api/new-endpoint', autenticarToken, verificarRole('admin'), (req, res) => {
  try {
    // Your logic here
    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### POST Route with Validation
```javascript
app.post('/api/resources', autenticarToken, verificarRole('admin', 'funcionario'), (req, res) => {
  const { field1, field2 } = req.body;
  
  if (!field1 || !field2) {
    return res.status(400).json({ error: 'Fields are required' });
  }
  
  db.run(
    'INSERT INTO table (field1, field2) VALUES (?, ?)',
    [field1, field2],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: 'Created successfully!' });
    }
  );
});
```

## Authentication

### JWT Token Flow
1. Login: `POST /api/auth/login` → Returns `{ accessToken, refreshToken, user }`
2. Use token: `Authorization: Bearer <accessToken>`
3. Refresh: `POST /api/auth/refresh`

### Middleware Usage
```javascript
// Require authentication
app.get('/api/protected', autenticarToken, (req, res) => {
  // req.user contains decoded token
  console.log(req.user.id, req.user.role);
});

// Require specific roles
app.put('/api/admin-only', autenticarToken, verificarRole('admin'), (req, res) => {
  // Only admin can access
});
```

## Common Patterns

### Paginated Response
```javascript
app.get('/api/items', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  db.all('SELECT * FROM items LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ items: rows, page, limit });
  });
});
```

### File Upload with Multer
```javascript
app.post('/api/upload', autenticarToken, (req, res) => {
  upload.single('file')(req, res, function(err) {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ url: fileUrl });
  });
});
```

## Testing API

### Using curl
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@tetofalso.com","senha":"admin123"}'

# Get resources (with token)
curl http://localhost:3001/api/clientes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

Always return consistent error format:
```javascript
res.status(400).json({ error: 'Message here' });
res.status(401).json({ error: 'Unauthorized' });
res.status(404).json({ error: 'Not found' });
res.status(500).json({ error: 'Internal server error' });
```

## Security Best Practices

1. Always validate input
2. Use parameterized queries (prevent SQL injection)
3. Implement rate limiting
4. Use HTTPS in production
5. Store secrets in `.env` file
6. Log audit events for sensitive operations

## Files Reference

- `server.js` - Main application with all routes
- `middleware/auth.js` - JWT authentication functions
- `middleware/security.js` - Security middleware
- `middleware/audit.js` - Audit logging

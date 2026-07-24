---
name: frontend-web
description: Use when working with HTML, CSS, JavaScript frontend files, pages, components, or UI/UX issues. Covers public/ directory structure, client-side logic, and static assets.
---

# Frontend Web Development

This skill covers the client-side code for the "Montagem de Teto Falso" project.

## Project Structure

```
public/
├── index.html          # Main entry point (SPA)
├── css/
│   └── styles.css      # Global styles
├── js/
│   ├── app.js          # Main application logic
│   ├── auth.js         # Authentication handling
│   ├── calculators/    # Calculator modules
│   │   ├── gesso.js    # Gypsum ceiling calculator
│   │   ├── pvc.js      # PVC ceiling calculator
│   │   └── modular.js  # Modular ceiling calculator
│   ├── pages/          # Page-specific logic
│   │   ├── home.js
│   │   ├── admin.js
│   │   ├── portfolio.js
│   │   └── ...
│   └── utils/          # Utility functions
│       ├── pdfGenerator.js
│       └── excelExporter.js
└── images/             # Static images
```

## Adding New Pages

### 1. Create Page File
```javascript
// public/js/pages/newpage.js
const NewPage = {
  init() {
    this.loadData();
    this.setupEventListeners();
  },
  
  async loadData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    this.render(data);
  },
  
  render(data) {
    document.getElementById('content').innerHTML = `
      <h1>New Page</h1>
      <!-- Your HTML here -->
    `;
  },
  
  setupEventListeners() {
    // Add event listeners here
  }
};
```

### 2. Register in app.js
```javascript
// Add to route mapping
const routes = {
  'newpage': NewPage,
  // ... other routes
};
```

## Calculator Modules

### Structure
```javascript
// public/js/calculators/gesso.js
const GessoCalculator = {
  materials: {
    chapa: { price: 450, unit: 'un' },
    perfilMae: { price: 85, unit: 'm' },
    // ...
  },
  
  calculate(area) {
    const results = {};
    // Calculation logic
    return results;
  },
  
  renderResults(results) {
    // Display calculations
  }
};
```

## CSS Guidelines

### Using CSS Variables
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #1e40af;
  --background: #f3f4f6;
}

.card {
  background: var(--background);
  border-left: 4px solid var(--primary-color);
}
```

### Responsive Design
```css
/* Mobile first */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## API Integration

### Fetch Wrapper
```javascript
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}
```

### Usage Examples
```javascript
// GET request
const clients = await apiCall('/clientes');

// POST request
const newService = await apiCall('/servicos', {
  method: 'POST',
  body: JSON.stringify(serviceData)
});
```

## Authentication Flow

### Login
```javascript
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.accessToken);
  localStorage.setItem('user', JSON.stringify(data.user));
}
```

### Protected Routes
```javascript
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.hash = '#login';
    return false;
  }
  return true;
}
```

## Best Practices

1. **Modularity**: Keep code in separate files by feature
2. **Error Handling**: Always handle API errors gracefully
3. **Loading States**: Show loading indicators during async operations
4. **Validation**: Validate user input on client side
5. **Accessibility**: Use semantic HTML and ARIA labels
6. **Performance**: Lazy load images and heavy content

## Files Reference

- `public/index.html` - Main HTML structure
- `public/js/app.js` - Application routing and core logic
- `public/css/styles.css` - Global styles
- `public/js/pages/` - Page-specific modules

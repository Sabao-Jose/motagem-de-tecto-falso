const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const crypto = require('crypto');

const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== CSRF PROTECTION ====================
const csrfTokens = new Map(); // Em producao, usar Redis

function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hora
  csrfTokens.set(token, { expiry });
  return token;
}

function validateCsrfToken(token) {
  if (!token) return false;
  const data = csrfTokens.get(token);
  if (!data) return false;
  if (Date.now() > data.expiry) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

// Limpar tokens expirados periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens.entries()) {
    if (now > data.expiry) {
      csrfTokens.delete(token);
    }
  }
}, 10 * 60 * 1000); // A cada 10 minutos

const securityMiddleware = {
  helmet: helmet({
    contentSecurityPolicy: {
      // useDefaults desativado para controlar todas as diretrizes
      // (o default do helmet injeta script-src-attr 'none', que mata
      // todos os onclick="" inline usados em todo o painel admin)
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
        // Permite handlers inline (onclick="...") usados nos botoes do painel
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "https:", "blob:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),

  cors: cors({
    origin: function (origin, callback) {
      // Requisicoes SEM Origin (mesma origem, curl, health checks, apps moveis)
      // sao sempre permitidas - navegadores so enviam Origin em cross-origin
      if (!origin) {
        return callback(null, true);
      }

      // Lista de origens permitidas; vazia = permitir todas
      const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

      if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[SECURITY] CORS: origem bloqueada: ${origin}`);
        callback(new Error('Origem nao permitida pelo CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  }),

  generalLimiter: rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes. Tente novamente mais tarde.' },
  }),

  loginLimiter: rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
    skipSuccessfulRequests: true,
  }),

  // Rate limiter especifico para registo de novas contas
  registerLimiter: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // Maximo 3 registos por hora por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de registo. Aguarde 1 hora.' },
  }),

  apiLimiter: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes a API. Tente novamente.' },
  }),

  // CSRF middleware
  csrfProtection: (req, res, next) => {
    // Exempt GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    const token = req.headers['x-csrf-token'] || req.body?._csrf;
    if (!validateCsrfToken(token)) {
      return res.status(403).json({ error: 'Token CSRF invalido ou ausente' });
    }
    next();
  },

  // Gerar token CSRF
  generateCsrf: (req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token });
  },

  // Middleware de seguranca para headers
  securityHeaders: (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  },

  // Detectar e bloquear comportamento suspeito
  suspiciousActivityDetector: (req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const suspiciousPatterns = [
      /sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /zap/i,
      /acunetix/i, /burpsuite/i, /havij/i, /w3af/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        console.warn(`[SECURITY] Requisicao suspeita detectada: ${req.ip} - ${userAgent}`);
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }
    next();
  },
};

module.exports = securityMiddleware;

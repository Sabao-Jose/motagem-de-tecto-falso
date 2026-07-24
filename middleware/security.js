const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const NODE_ENV = process.env.NODE_ENV || 'development';

const securityMiddleware = {
  helmet: helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),

  cors: cors({
    origin: function (origin, callback) {
      const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001').split(',');
      if (!origin || allowedOrigins.includes(origin) || NODE_ENV === 'development') {
        callback(null, true);
      } else {
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

  apiLimiter: rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Muitas requisicoes a API. Tente novamente.' },
  }),
};

module.exports = securityMiddleware;

const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'teto-falso-sabao-jwt-secret-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'teto-falso-refresh-secret-2024';
const MAX_TENTATIVAS = 5; // Maximo de tentativas antes de bloquear
const BLOQUEIO_MINUTOS = 30; // Minutos de bloqueio apos exceder tentativas

// ==================== TRACKING DE TENTATIVAS ====================
const tentativasLogin = new Map(); // IP/email -> { count, blockedUntil }

function registrarTentativa(email, ip) {
  const key = `${email}:${ip}`;
  const atual = tentativasLogin.get(key) || { count: 0, blockedUntil: null };

  // Se ainda esta bloqueado, retorna true
  if (atual.blockedUntil && Date.now() < atual.blockedUntil) {
    return { bloqueado: true, restante: Math.ceil((atual.blockedUntil - Date.now()) / 60000) };
  }

  // Se o bloqueio expirou, resetar
  if (atual.blockedUntil && Date.now() >= atual.blockedUntil) {
    atual.count = 0;
    atual.blockedUntil = null;
  }

  atual.count++;

  if (atual.count >= MAX_TENTATIVAS) {
    atual.blockedUntil = Date.now() + BLOQUEIO_MINUTOS * 60 * 1000;
    tentativasLogin.set(key, atual);
    console.warn(`[SECURITY] Conta bloqueada por ${BLOQUEIO_MINUTOS} min: ${email} (IP: ${ip}) - ${atual.count} tentativas`);
    return { bloqueado: true, restante: BLOQUEIO_MINUTOS };
  }

  tentativasLogin.set(key, atual);
  return { bloqueado: false, restante: MAX_TENTATIVAS - atual.count };
}

function limparTentativas(email, ip) {
  const key = `${email}:${ip}`;
  tentativasLogin.delete(key);
}

// Limpar registros antigos periodicamente (a cada 15 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of tentativasLogin.entries()) {
    if (data.blockedUntil && now > data.blockedUntil) {
      tentativasLogin.delete(key);
    }
  }
}, 15 * 60 * 1000);

// ==================== MIDDLEWARE DE AUTENTICACAO ====================

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticacao necessario' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ error: 'Token invalido' });
    }

    db.get('SELECT id, nome, email, role, ativo FROM usuarios WHERE id = ?', [user.id], (err, row) => {
      if (err || !row) {
        return res.status(401).json({ error: 'Usuario nao encontrado' });
      }
      if (row.ativo === 0) {
        return res.status(403).json({ error: 'Conta desativada. Contacte o administrador.' });
      }

      req.user = {
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role,
      };
      next();
    });
  });
}

function verificarRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso nao autorizado' });
    }
    next();
  };
}

function gerarTokens(user) {
  const token = jwt.sign(
    { id: user.id, nome: user.nome, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
}

function renovarToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token necessario' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Refresh token invalido ou expirado' });
    }

    db.get('SELECT id, nome, email, role, ativo FROM usuarios WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Usuario nao encontrado' });
      }
      if (user.ativo === 0) {
        return res.status(403).json({ error: 'Conta desativada. Contacte o administrador.' });
      }

      const tokens = gerarTokens(user);
      res.json(tokens);
    });
  });
}

module.exports = {
  autenticarToken,
  verificarRole,
  gerarTokens,
  renovarToken,
  registrarTentativa,
  limparTentativas,
  MAX_TENTATIVAS,
  BLOQUEIO_MINUTOS,
};

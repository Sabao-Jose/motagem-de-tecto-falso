const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'teto-falso-sabao-jwt-secret-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'teto-falso-refresh-secret-2024';

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

    db.get('SELECT id, nome, email, role FROM usuarios WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Usuario nao encontrado' });
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
};

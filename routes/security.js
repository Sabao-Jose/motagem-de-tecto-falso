const express = require('express');
const router = express.Router();
const { autenticarToken, verificarRole } = require('../middleware/auth');
const { obterLogsAuditoria } = require('../middleware/audit');
const db = require('../database');

router.get('/logs', autenticarToken, verificarRole('admin'), (req, res) => {
  const { usuario_id, limite } = req.query;

  obterLogsAuditoria(usuario_id || null, parseInt(limite) || 100)
    .then(logs => {
      const logsComNome = logs.map(log => ({
        ...log,
        usuario_nome: null
      }));

      const ids = [...new Set(logs.filter(l => l.usuario_id).map(l => l.usuario_id))];
      if (ids.length === 0) return res.json({ logs: logsComNome });

      const placeholders = ids.map(() => '?').join(',');
      db.all(`SELECT id, nome FROM usuarios WHERE id IN (${placeholders})`, ids, (err, usuarios) => {
        if (err) return res.json({ logs: logsComNome });

        const usuarioMap = {};
        usuarios.forEach(u => { usuarioMap[u.id] = u.nome; });

        logsComNome.forEach(l => {
          l.usuario_nome = usuarioMap[l.usuario_id] || 'Sistema';
        });

        res.json({ logs: logsComNome });
      });
    })
    .catch(err => res.status(500).json({ error: err.message }));
});

router.get('/status', autenticarToken, verificarRole('admin'), (req, res) => {
  const status = {
    servidor: {
      uptime: process.uptime(),
      node: process.version,
      env: process.env.NODE_ENV || 'development',
    },
    seguranca: {
      jwt: !!process.env.JWT_SECRET,
      bcryptSalt: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
      rateLimiting: true,
      helmet: true,
      cors: !!process.env.CORS_ORIGINS,
    },
    openai: {
      configurado: !!process.env.OPENAI_API_KEY,
      modelo: process.env.OPENAI_MODEL || 'nao configurado',
    },
  };

  res.json({ status });
});

router.get('/sessoes-ativas', autenticarToken, verificarRole('admin'), (req, res) => {
  db.all(
    `SELECT u.id, u.nome, u.email, u.role, u.ultimo_login,
            COUNT(al.id) as total_acoes
     FROM usuarios u
     LEFT JOIN audit_logs al ON al.usuario_id = u.id
        AND al.created_at > datetime('now', '-24 hours')
     GROUP BY u.id
     ORDER BY u.ultimo_login DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ sessoes: rows });
    }
  );
});

module.exports = router;

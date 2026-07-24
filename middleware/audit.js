const db = require('../database');

function registrarAuditoria(usuario_id, acao, detalhes, ip, userAgent) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (usuario_id, acao, detalhes, ip, user_agent)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(usuario_id, acao, typeof detalhes === 'string' ? detalhes : JSON.stringify(detalhes), ip, userAgent);
  stmt.finalize();
}

function auditMiddleware(acao) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode < 400) {
        const usuario_id = req.user ? req.user.id : null;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'unknown';

        registrarAuditoria(usuario_id, acao, {
          method: req.method,
          path: req.originalUrl,
          body: sanitizarDadosSensiveis(req.body),
          statusCode: res.statusCode,
        }, ip, userAgent);
      }
      return originalJson(body);
    };

    next();
  };
}

function sanitizarDadosSensiveis(data) {
  if (!data) return {};
  const sanitized = { ...data };
  delete sanitized.senha;
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.refreshToken;
  delete sanitized.smtp_pass;
  delete sanitized.smtp_user;
  return sanitized;
}

function obterLogsAuditoria(usuario_id, limite = 100) {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM audit_logs';
    let params = [];

    if (usuario_id) {
      query += ' WHERE usuario_id = ?';
      params.push(usuario_id);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limite);

    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  registrarAuditoria,
  auditMiddleware,
  obterLogsAuditoria,
};

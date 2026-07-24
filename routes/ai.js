const express = require('express');
const router = express.Router();
const { autenticarToken, verificarRole } = require('../middleware/auth');
const { aiChatValidation } = require('../middleware/validation');
const { auditMiddleware } = require('../middleware/audit');
const { processarMensagem, obterContextoDoSistema } = require('../services/aiAgent');
const db = require('../database');

router.post('/chat', autenticarToken, verificarRole('admin'), aiChatValidation, auditMiddleware('ai_chat'), async (req, res) => {
  try {
    const { mensagem } = req.body;

    const resultado = await processarMensagem(mensagem, req.user);

    if (!resultado.sucesso) {
      return res.status(resultado.erro.includes('API key') ? 400 : 500).json({ error: resultado.erro });
    }

    db.run(
      'INSERT INTO ai_conversations (usuario_id, pergunta, resposta) VALUES (?, ?, ?)',
      [req.user.id, mensagem, resultado.resposta]
    );

    res.json({ resposta: resultado.resposta });
  } catch (error) {
    console.error('Erro ao processar chat AI:', error);
    res.status(500).json({ error: 'Erro interno ao processar mensagem' });
  }
});

router.get('/conversations', autenticarToken, verificarRole('admin'), (req, res) => {
  db.all(
    'SELECT * FROM ai_conversations WHERE usuario_id = ? ORDER BY created_at DESC LIMIT 50',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ conversations: rows });
    }
  );
});

router.get('/contexto', autenticarToken, verificarRole('admin'), async (req, res) => {
  try {
    const contexto = await obterContextoDoSistema();
    res.json({ contexto });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const db = require('./database');
const blob = require('./blob-upload');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'teto-falso-sabao-jwt-secret-2024';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// ==================== MIDDLEWARE DE SEGURANCA ====================
const security = require('./middleware/security');
app.use(security.helmet);
app.use(security.cors);
app.use('/api/auth/login', security.loginLimiter);

// ==================== MIDDLEWARE GLOBAL ====================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
// Vercel Hobby: limite de 4.5MB por request
const MAX_BODY = process.env.VERCEL ? '4mb' : '10mb';
app.use(bodyParser.json({ limit: MAX_BODY }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_BODY }));

// Servir ficheiros estáticos
app.use(express.static(path.join(__dirname, 'public')));

// No ambiente local, serve ficheiros da pasta uploads/
if (!blob.isVercel) {
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ==================== HEALTH CHECK ====================
app.get('/api/health', async (req, res) => {
    try {
        await db.ready;
        res.json({
            status: 'ok',
            env: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL,
            db: db._initialized ? 'postgres' : (db._initError ? 'erro: ' + db._initError.message : 'não inicializado'),
            db_error: db._initError ? db._initError.message : null,
            postgres_url: !!process.env.POSTGRES_URL,
            database_url: !!process.env.DATABASE_URL,
            blob_token: !!process.env.BLOB_READ_WRITE_TOKEN,
            jwt_secret: !!process.env.JWT_SECRET,
            admin_email: !!process.env.ADMIN_EMAIL,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message, db_error: db._initError ? db._initError.message : null });
    }
});


// Rate limiter global apenas nas rotas da API com escrita (nao afeta rotas de leitura GET)
app.use('/api', (req, res, next) => {
    // So aplica rate limiter em rotas POST, PUT, DELETE (escritas)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return security.generalLimiter(req, res, next);
    }
    next();
});

// Configuração do Multer para upload de arquivos (usa memoryStorage para funcionar em Vercel)
const storage = multer.memoryStorage();

// Vercel Hobby: limite prático de 4MB por request; local: 50MB
const MAX_FILE_SIZE = process.env.VERCEL
    ? 4 * 1024 * 1024        // 4MB no Vercel (plano gratuito)
    : 50 * 1024 * 1024;      // 50MB local

const upload = multer({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (req, file, cb) => {
        // Extensões permitidas
        const allowedExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.mkv', '.webm', '.3gp', '.ogg', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        const extOk = allowedExts.includes(ext);

        // MIME types permitidos (inclui todos os tipos de vídeo e imagem comuns)
        const allowedMimes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime',
            'video/x-matroska', 'video/webm', 'video/ogg', 'video/3gpp',
            'application/pdf'
        ];
        const mimeOk = allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

        if (extOk && mimeOk) {
            return cb(null, true);
        } else {
            cb(new Error(`Tipo de ficheiro não permitido: ${ext} (${file.mimetype})`));
        }
    }
});

// ==================== MIDDLEWARE DE AUTENTICAÇÃO (MELHORADO) ====================
const { autenticarToken, verificarRole, gerarTokens, renovarToken } = require('./middleware/auth');
const { auditMiddleware, registrarAuditoria } = require('./middleware/audit');

// ==================== FUNÇÃO DE ENVIO DE EMAIL ====================

function enviarEmail(destinatario, assunto, html) {
    return new Promise((resolve, reject) => {
        db.all("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'smtp_%'", [], (err, rows) => {
            if (err) return reject(err);

            const config = {};
            rows.forEach(r => { config[r.chave] = r.valor; });

            if (!config.smtp_host) {
                return reject(new Error('SMTP não configurado'));
            }

            const transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: parseInt(config.smtp_port || '587'),
                secure: config.smtp_secure === '1',
                auth: {
                    user: config.smtp_user,
                    pass: config.smtp_pass
                }
            });

            db.get("SELECT valor FROM configuracoes WHERE chave = 'empresa_email'", [], (err, row) => {
                if (err) return reject(err);
                const fromEmail = row ? row.valor : 'noreply@tetofalso.com';

                transporter.sendMail({
                    from: `"${config.smtp_user ? 'Teto Falso Sabao' : 'Sistema'}" <${fromEmail}>`,
                    to: destinatario,
                    subject: assunto,
                    html: html
                }, (err, info) => {
                    if (err) return reject(err);
                    resolve(info);
                });
            });
        });
    });
}

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    db.get('SELECT * FROM usuarios WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            registrarAuditoria(null, 'login_falha', { email, motivo: 'utilizador_inexistente' }, req.ip, req.headers['user-agent']);
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        const senhaValida = bcrypt.compareSync(senha, user.senha);
        if (!senhaValida) {
            db.run('UPDATE usuarios SET tentativas_login = tentativas_login + 1 WHERE id = ?', [user.id]);
            registrarAuditoria(user.id, 'login_falha', { email, motivo: 'senha_incorreta' }, req.ip, req.headers['user-agent']);
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        if (user.ativo === 0) {
            registrarAuditoria(user.id, 'login_conta_desativada', { email }, req.ip, req.headers['user-agent']);
            return res.status(403).json({ error: 'Conta desativada. Contacte o administrador.' });
        }

        db.run('UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP, tentativas_login = 0 WHERE id = ?', [user.id]);

        const tokens = gerarTokens(user);

        registrarAuditoria(user.id, 'login_sucesso', { email }, req.ip, req.headers['user-agent']);

        res.json({
            ...tokens,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                pode_responder_mensagens: user.pode_responder_mensagens || 0
            }
        });
    });
});

// Registro de cliente
app.post('/api/auth/register', (req, res) => {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    // Verificar se email já existe
    db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (row) {
            return res.status(400).json({ error: 'Email já registado' });
        }

        const senhaHash = bcrypt.hashSync(senha, BCRYPT_SALT_ROUNDS);

        db.run(
            'INSERT INTO usuarios (nome, email, senha, telefone, role) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaHash, telefone || null, 'cliente'],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                const tokens = gerarTokens({ id: this.lastID, nome, email, role: 'cliente' });

                registrarAuditoria(this.lastID, 'registro_cliente', { nome, email }, req.ip, req.headers['user-agent']);

                res.json({
                    ...tokens,
                    user: { id: this.lastID, nome, email, role: 'cliente' }
                });
            }
        );
    });
});

// Obter dados do usuário atual
app.get('/api/auth/me', autenticarToken, (req, res) => {
    db.get('SELECT id, nome, email, telefone, role, created_at FROM usuarios WHERE id = ?', [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ user });
    });
});

// ==================== ROTAS DE GESTÃO DE USUÁRIOS (ADMIN) ====================

// Atualizar dados de um utilizador (nome, email, telefone)
app.put('/api/usuarios/:id', autenticarToken, verificarRole('admin'), auditMiddleware('utilizador_atualizado'), (req, res) => {
    const { nome, email, telefone } = req.body;

    if (!nome || !email) {
        return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    // Verificar se email já existe (se for diferente do atual)
    db.get('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'Email já está em uso por outro utilizador' });

        db.run(
            'UPDATE usuarios SET nome = ?, email = ?, telefone = ? WHERE id = ?',
            [nome, email, telefone || null, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Utilizador não encontrado' });
                res.json({ message: 'Dados actualizados com sucesso!' });
            }
        );
    });
});

// Listar todos os usuários
app.get('/api/usuarios', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all('SELECT id, nome, email, telefone, role, verificado, salario, endereco, numero_conta, banco, tipo_conta, foto, pode_responder_mensagens, created_at FROM usuarios ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ usuarios: rows });
    });
});

// Criar usuário (admin ou funcionario)
app.post('/api/usuarios', autenticarToken, verificarRole('admin'), auditMiddleware('utilizador_criado'), (req, res) => {
    const { nome, email, senha, telefone, role, salario, endereco, numero_conta, banco, tipo_conta } = req.body;

    if (!nome || !email || !senha || !role) {
        return res.status(400).json({ error: 'Nome, email, senha e role são obrigatórios' });
    }

    if (!['admin', 'funcionario', 'cliente'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida. Use: admin, funcionario ou cliente' });
    }

    db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.status(400).json({ error: 'Email já registado' });

        const senhaHash = bcrypt.hashSync(senha, BCRYPT_SALT_ROUNDS);
        db.run(
            'INSERT INTO usuarios (nome, email, senha, telefone, role, salario, endereco, numero_conta, banco, tipo_conta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [nome, email, senhaHash, telefone || null, role, salario || 0, endereco || null, numero_conta || null, banco || null, tipo_conta || null],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id: this.lastID, message: 'Usuário criado com sucesso!' });
            }
        );
    });
});

// Atualizar role de um usuário
app.put('/api/usuarios/:id/role', autenticarToken, verificarRole('admin'), auditMiddleware('role_atualizada'), (req, res) => {
    const { role } = req.body;

    if (!['admin', 'funcionario', 'cliente'].includes(role)) {
        return res.status(400).json({ error: 'Role inválida. Use: admin, funcionario ou cliente' });
    }

    db.run('UPDATE usuarios SET role = ? WHERE id = ?', [role, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ message: 'Role atualizada com sucesso!' });
    });
});

// Alternar permissão de responder mensagens
app.put('/api/usuarios/:id/responder-permissao', autenticarToken, verificarRole('admin'), auditMiddleware('permissao_responder_atualizada'), (req, res) => {
    const { pode_responder } = req.body;
    db.run(
        'UPDATE usuarios SET pode_responder_mensagens = ? WHERE id = ?',
        [pode_responder ? 1 : 0, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Permissão atualizada com sucesso!' });
        }
    );
});

// Deletar usuário
app.delete('/api/usuarios/:id', autenticarToken, verificarRole('admin'), auditMiddleware('utilizador_apagado'), (req, res) => {
    const userId = req.params.id;

    // PostgreSQL impõe as chaves estrangeiras: antes de apagar o utilizador é
    // preciso remover (ou desassociar) os registos que dependem dele.
    //  - ai_conversations/faltas/pedidos_portfolio: apagar (NOT NULL)
    //  - audit_logs: manter o histórico, apenas desassociar o utilizador
    const limpezas = [
        'DELETE FROM ai_conversations WHERE usuario_id = ?',
        'DELETE FROM faltas WHERE usuario_id = ?',
        'DELETE FROM pedidos_portfolio WHERE usuario_id = ?',
        'UPDATE audit_logs SET usuario_id = NULL WHERE usuario_id = ?'
    ];

    const executarLimpeza = (i) => {
        if (i >= limpezas.length) {
            db.run('DELETE FROM usuarios WHERE id = ?', [userId], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
                res.json({ message: 'Usuário deletado com sucesso!' });
            });
            return;
        }
        db.run(limpezas[i], [userId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            executarLimpeza(i + 1);
        });
    };
    executarLimpeza(0);
});

// Atualizar dados de funcionário (salario, endereco, numero_conta, banco, tipo_conta, foto)
app.put('/api/usuarios/:id/dados', autenticarToken, verificarRole('admin'), auditMiddleware('dados_funcionario_atualizados'), (req, res) => {
    const { salario, endereco, numero_conta, banco, tipo_conta, foto } = req.body;
    db.run(
        'UPDATE usuarios SET salario = ?, endereco = ?, numero_conta = ?, banco = ?, tipo_conta = ?, foto = ? WHERE id = ?',
        [salario || 0, endereco || null, numero_conta || null, banco || null, tipo_conta || null, foto || null, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
            res.json({ message: 'Dados actualizados com sucesso!' });
        }
    );
});

// Upload foto do funcionário
app.post('/api/usuarios/:id/foto', autenticarToken, verificarRole('admin'), auditMiddleware('foto_funcionario_atualizada'), async (req, res) => {
    upload.single('foto')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message || err });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhuma foto enviada' });
        }
        try {
            const { url } = await blob.uploadFile(req.file.buffer, req.file.originalname, 'fotos');
            db.run(
                'UPDATE usuarios SET foto = ? WHERE id = ?',
                [url, req.params.id],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    if (this.changes === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
                    res.json({ foto: url, message: 'Foto actualizada com sucesso!' });
                }
            );
        } catch (uploadErr) {
            res.status(500).json({ error: 'Erro ao fazer upload: ' + uploadErr.message });
        }
    });
});

// ==================== ROTAS DE CLIENTES ====================

// Listar todos os clientes
app.get('/api/clientes', (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ clientes: rows });
    });
});

// Listar clientes registados (role=cliente) com verificação e último login
app.get('/api/clientes/lista', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all("SELECT id, nome, email, telefone, verificado, created_at, ultimo_login FROM usuarios WHERE role = 'cliente' ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ clientes: rows });
    });
});

// Buscar cliente por ID
app.get('/api/clientes/:id', (req, res) => {
    db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ cliente: row });
    });
});

// Criar novo cliente
app.post('/api/clientes', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('cliente_criado'), (req, res) => {
    const { nome, telefone, email, endereco } = req.body;

    if (telefone && telefone.replace(/[^0-9]/g, '').length > 9) {
        return res.status(400).json({ error: 'Telefone deve ter no maximo 9 digitos' });
    }

    db.run(
        'INSERT INTO clientes (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)',
        [nome, telefone, email, endereco],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Cliente criado com sucesso!' });
        }
    );
});

// Atualizar cliente
app.put('/api/clientes/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('cliente_atualizado'), (req, res) => {
    const { nome, telefone, email, endereco } = req.body;

    if (telefone && telefone.replace(/[^0-9]/g, '').length > 9) {
        return res.status(400).json({ error: 'Telefone deve ter no maximo 9 digitos' });
    }

    db.run(
        'UPDATE clientes SET nome = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?',
        [nome, telefone, email, endereco, req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Cliente atualizado com sucesso!' });
        }
    );
});

// Deletar cliente
app.delete('/api/clientes/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('cliente_apagado'), (req, res) => {
    const clienteId = req.params.id;

    // PostgreSQL impõe as chaves estrangeiras: antes de apagar o cliente é
    // preciso desassociar os serviços e utilizadores que apontam para ele
    // (mantém os registos de negócio, apenas remove a ligação ao cliente).
    const limpezas = [
        'UPDATE servicos SET cliente_id = NULL WHERE cliente_id = ?',
        'UPDATE usuarios SET cliente_id = NULL WHERE cliente_id = ?'
    ];

    const executarLimpeza = (i) => {
        if (i >= limpezas.length) {
            db.run('DELETE FROM clientes WHERE id = ?', [clienteId], function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
                res.json({ message: 'Cliente deletado com sucesso!' });
            });
            return;
        }
        db.run(limpezas[i], [clienteId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            executarLimpeza(i + 1);
        });
    };
    executarLimpeza(0);
});

// ==================== ROTAS DE SERVIÇOS ====================

// Listar todos os serviços
app.get('/api/servicos', (req, res) => {
    const query = `
    SELECT s.*, c.nome as cliente_nome 
    FROM servicos s 
    LEFT JOIN clientes c ON s.cliente_id = c.id 
    ORDER BY s.created_at DESC
  `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ servicos: rows });
    });
});

// Buscar serviço por ID
app.get('/api/servicos/:id', (req, res) => {
    const query = `
    SELECT s.*, c.nome as cliente_nome, c.telefone, c.email, c.endereco 
    FROM servicos s 
    LEFT JOIN clientes c ON s.cliente_id = c.id 
    WHERE s.id = ?
  `;

    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ servico: row });
    });
});

// Criar novo serviço/orçamento
app.post('/api/servicos', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('servico_criado'), (req, res) => {
    const {
        cliente_id,
        tipo_teto,
        area,
        largura,
        comprimento,
        materiais_json,
        servicos_adicionais_json,
        valor_materiais,
        valor_mao_obra,
        valor_total,
        data_servico,
        status,
        observacoes
    } = req.body;

    db.run(
        `INSERT INTO servicos (
      cliente_id, tipo_teto, area, largura, comprimento, 
      materiais_json, servicos_adicionais_json, 
      valor_materiais, valor_mao_obra, valor_total, 
      data_servico, status, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            cliente_id, tipo_teto, area, largura, comprimento,
            materiais_json, servicos_adicionais_json,
            valor_materiais, valor_mao_obra, valor_total,
            data_servico, status || 'pendente', observacoes
        ],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Serviço criado com sucesso!' });
        }
    );
});

// Atualizar serviço (apenas admin)
app.put('/api/servicos/:id', autenticarToken, verificarRole('admin'), auditMiddleware('servico_atualizado'), (req, res) => {
    const { status, observacoes, area } = req.body;

    // Build query dynamically based on what was provided
    let updates = [];
    let params = [];

    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (observacoes !== undefined) { updates.push('observacoes = ?'); params.push(observacoes); }
    if (area !== undefined) { updates.push('area = ?'); params.push(area); }

    if (updates.length === 0) return res.json({ message: 'Nenhuma alteração enviada' });

    params.push(req.params.id);

    db.run(
        `UPDATE servicos SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Serviço atualizado com sucesso!' });
        }
    );
});

// Atualizar materiais do serviço (apenas admin)
app.put('/api/servicos/:id/materiais', autenticarToken, verificarRole('admin'), auditMiddleware('materiais_atualizados'), (req, res) => {
    const { materiais_json, valor_materiais, valor_total } = req.body;
    db.run(
        'UPDATE servicos SET materiais_json = ?, valor_materiais = ?, valor_total = ? WHERE id = ?',
        [materiais_json, valor_materiais, valor_total, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Materiais atualizados com sucesso!' });
        }
    );
});

// Deletar serviço/orçamento (apenas admin) — com backup automático
app.delete('/api/servicos/:id', autenticarToken, verificarRole('admin'), (req, res) => {
    // Primeiro buscar o serviço para fazer backup
    db.get('SELECT s.*, c.nome as cliente_nome FROM servicos s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.id = ?', [req.params.id], (err, servico) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });

        // Inserir backup antes de apagar
        const stmt = db.prepare(`
            INSERT INTO servicos_backup (
                original_id, cliente_id, cliente_nome, tipo_teto, area, largura, comprimento,
                materiais_json, servicos_adicionais_json, valor_materiais, valor_mao_obra,
                valor_total, data_servico, status, observacoes, pago,
                deleted_by, deleted_by_nome, original_created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            servico.id, servico.cliente_id, servico.cliente_nome, servico.tipo_teto,
            servico.area, servico.largura, servico.comprimento,
            servico.materiais_json, servico.servicos_adicionais_json,
            servico.valor_materiais, servico.valor_mao_obra, servico.valor_total,
            servico.data_servico, servico.status, servico.observacoes, servico.pago,
            req.user.id, req.user.nome, servico.created_at
        );
        stmt.finalize();

        // Agora sim deletar
        db.run('DELETE FROM servicos WHERE id = ?', [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Serviço não encontrado' });

            // Registar na auditoria
            const { registrarAuditoria } = require('./middleware/audit');
            registrarAuditoria(req.user.id, 'servico_deletado_com_backup', {
                servico_id: servico.id,
                cliente: servico.cliente_nome,
                valor: servico.valor_total,
                tipo: servico.tipo_teto
            }, req.ip, req.headers['user-agent']);

            res.json({ message: 'Serviço deletado com sucesso! Cópia de segurança criada.' });
        });
    });
});

// ==================== ROTAS DE CONTACTO ====================

// Enviar mensagem de contacto (público)
app.post('/api/contact', auditMiddleware('mensagem_contacto_recebida'), (req, res) => {
    const { nome, telefone, email, assunto, mensagem } = req.body;

    if (!nome || !telefone || !email || !assunto || !mensagem) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    db.run(
        'INSERT INTO contact_messages (nome, telefone, email, assunto, mensagem) VALUES (?, ?, ?, ?, ?)',
        [nome, telefone, email, assunto, mensagem],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Enviar email de notificação ao admin
            db.get("SELECT valor FROM configuracoes WHERE chave = 'admin_email'", [], (err, rowAdmin) => {
                if (!err && rowAdmin && rowAdmin.valor) {
                    const adminEmail = rowAdmin.valor;
                    const assuntoEmail = `[Nova Mensagem] ${assunto} - ${nome}`;
                    const htmlEmail = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">📬 Nova Mensagem de Contacto</h2>
                            <p>Uma nova mensagem foi recebida pelo formulário de contacto:</p>
                            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                <p><strong>Nome:</strong> ${nome}</p>
                                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                                <p><strong>Telefone:</strong> <a href="tel:${telefone}">${telefone}</a></p>
                                <p><strong>Assunto:</strong> ${assunto}</p>
                            </div>
                            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
                                <p><strong>Mensagem:</strong></p>
                                <p>${mensagem}</p>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                            <p style="color: #6b7280; font-size: 12px;">Este é um email automático do sistema Teto Falso Sabao. Responda pelo painel admin.</p>
                        </div>
                    `;
                    enviarEmail(adminEmail, assuntoEmail, htmlEmail).catch(erro => {
                        console.error('Erro ao enviar notificação ao admin:', erro.message);
                    });
                }
            });

            res.json({ id: this.lastID, message: 'Mensagem enviada com sucesso!' });
        }
    );
});

// Listar mensagens de contacto (admin/funcionario)
app.get('/api/contact', autenticarToken, verificarRole('admin', 'funcionario'), (req, res) => {
    db.all('SELECT * FROM contact_messages ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ messages: rows });
    });
});

// Marcar mensagem como lida
app.put('/api/contact/:id/read', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('mensagem_marcada_lida'), (req, res) => {
    db.run('UPDATE contact_messages SET lido = 1 WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Mensagem não encontrada' });
        res.json({ message: 'Mensagem marcada como lida' });
    });
});

// Responder mensagem (com anexo opcional) - envia email ao cliente
app.put('/api/contact/:id/reply', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('mensagem_respondida'), async (req, res) => {
    upload.single('anexo')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message || err });
        }

        const { resposta, resposta_orcamento_id } = req.body;
        if (!resposta || !resposta.trim()) {
            return res.status(400).json({ error: 'A resposta é obrigatória' });
        }

        let anexo_url = null;
        if (req.file) {
            try {
                const { url } = await blob.uploadFile(req.file.buffer, req.file.originalname, 'anexos');
                anexo_url = url;
            } catch (uploadErr) {
                return res.status(500).json({ error: 'Erro ao fazer upload do anexo: ' + uploadErr.message });
            }
        }

        // Buscar mensagem original para obter email do cliente
        db.get('SELECT * FROM contact_messages WHERE id = ?', [req.params.id], (err, msg) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!msg) return res.status(404).json({ error: 'Mensagem não encontrada' });

            // Actualizar a mensagem com a resposta
            db.run(
                'UPDATE contact_messages SET resposta = ?, respondida = 1, lido = 1, updated_at = CURRENT_TIMESTAMP, resposta_anexo = ?, resposta_orcamento_id = ? WHERE id = ?',
                [resposta.trim(), anexo_url, resposta_orcamento_id || null, req.params.id],
                function (err) {
                    if (err) return res.status(500).json({ error: err.message });

                    // Enviar email para o cliente (assíncrono - não bloqueia a resposta)
                    const nomeEmpresa = 'Teto Falso Sabao';
                    const assunto = `Resposta ao seu contacto - ${msg.assunto}`;
                    const html = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #2563eb;">${nomeEmpresa}</h2>
                            <p>Olá <strong>${msg.nome}</strong>,</p>
                            <p>Recebemos a sua mensagem e temos uma resposta para si:</p>
                            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                                <p><strong>Assunto:</strong> ${msg.assunto}</p>
                                <p><strong>Sua mensagem:</strong> ${msg.mensagem}</p>
                            </div>
                            <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
                                <p><strong>Resposta:</strong></p>
                                <p>${resposta.trim()}</p>
                            </div>
                            ${anexo_url ? `<p><a href="${anexo_url}" style="color: #2563eb;">Ver anexo</a></p>` : ''}
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                            <p style="color: #6b7280; font-size: 12px;">Este é um email automático do sistema ${nomeEmpresa}.</p>
                        </div>
                    `;

                    enviarEmail(msg.email, assunto, html).catch(erro => {
                        console.error('Erro ao enviar email de resposta:', erro.message);
                    });

                    res.json({ message: 'Resposta enviada com sucesso!', anexo: anexo_url });
                }
            );
        });
    });
});

// Deletar mensagem
app.delete('/api/contact/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('mensagem_apagada'), (req, res) => {
    db.run('DELETE FROM contact_messages WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Mensagem deletada' });
    });
});

// ==================== ROTAS DE PORTFÓLIO ====================

// Gerar client token para upload DIRETO do browser ao Vercel Blob
// (contorna o limite de ~4.5MB de body das serverless functions no plano Hobby)
app.post('/api/blob/token', autenticarToken, verificarRole('admin', 'funcionario'), async (req, res) => {
    const { originalname, folder } = req.body || {};

    if (!originalname) {
        return res.status(400).json({ error: 'Nome do ficheiro é obrigatório' });
    }
    if (!blob.isVercel) {
        return res.status(400).json({ error: 'Upload direto só está disponível no Vercel (em produção). Em desenvolvimento use o formulário normal.' });
    }

    try {
        const info = await blob.getClientUploadToken(originalname, folder || 'portfolio');
        res.json(info);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao preparar upload: ' + err.message });
    }
});

// Listar portfólio
app.get('/api/portfolio', (req, res) => {
    const tipo = req.query.tipo;
    let query = 'SELECT * FROM portfolio ORDER BY created_at DESC';
    let params = [];

    if (tipo) {
        query = 'SELECT * FROM portfolio WHERE tipo_servico = ? ORDER BY created_at DESC';
        params = [tipo];
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ portfolio: rows });
    });
});

// Adicionar projeto ao portfólio
app.post('/api/portfolio', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('portfolio_criado'), async (req, res) => {
    // Caminho JSON: upload direto ao Blob já feito pelo browser (vídeos/imagens grandes)
    if (!req.is('multipart/form-data')) {
        const { titulo, descricao, tipo_servico, imagem_url, video_url } = req.body;
        if (!titulo || !tipo_servico) {
            return res.status(400).json({ error: 'Título e tipo de serviço são obrigatórios' });
        }
        db.run(
            'INSERT INTO portfolio (titulo, descricao, tipo_servico, imagem_url, video_url) VALUES (?, ?, ?, ?, ?)',
            [titulo, descricao, tipo_servico, imagem_url || null, video_url || null],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID, message: 'Projeto adicionado ao portfólio!' });
            }
        );
        return;
    }

    upload.single('arquivo')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message || err });
        }

        const { titulo, descricao, tipo_servico } = req.body;
        let imagem_url = null;
        let video_url = null;

        if (req.file) {
            try {
                const { url } = await blob.uploadFile(req.file.buffer, req.file.originalname, 'portfolio');
                const ext = path.extname(req.file.originalname).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    imagem_url = url;
                } else {
                    video_url = url;
                }
            } catch (uploadErr) {
                return res.status(500).json({ error: 'Erro ao fazer upload: ' + uploadErr.message });
            }
        }

        db.run(
            'INSERT INTO portfolio (titulo, descricao, tipo_servico, imagem_url, video_url) VALUES (?, ?, ?, ?, ?)',
            [titulo, descricao, tipo_servico, imagem_url, video_url],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ id: this.lastID, message: 'Projeto adicionado ao portfólio!' });
            }
        );
    });
});

// Atualizar projeto do portfólio
app.put('/api/portfolio/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('portfolio_atualizado'), async (req, res) => {
    // Caminho JSON: upload direto ao Blob já feito pelo browser
    if (!req.is('multipart/form-data')) {
        const { titulo, descricao, tipo_servico, imagem_url, video_url, substituir_imagem, substituir_video } = req.body;

        db.get('SELECT * FROM portfolio WHERE id = ?', [req.params.id], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projeto não encontrado' });
            }

            const finalImagem = substituir_imagem ? imagem_url : row.imagem_url;
            const finalVideo = substituir_video ? video_url : row.video_url;

            // Apagar ficheiro antigo do Blob se foi substituído
            try {
                if (substituir_imagem && row.imagem_url && imagem_url && imagem_url !== row.imagem_url) {
                    await blob.deleteFile(row.imagem_url);
                }
                if (substituir_video && row.video_url && video_url && video_url !== row.video_url) {
                    await blob.deleteFile(row.video_url);
                }
            } catch (delErr) {
                console.warn('Aviso ao apagar blob antigo:', delErr.message);
            }

            db.run(
                'UPDATE portfolio SET titulo = ?, descricao = ?, tipo_servico = ?, imagem_url = ?, video_url = ? WHERE id = ?',
                [titulo, descricao, tipo_servico, finalImagem, finalVideo, req.params.id],
                function (err2) {
                    if (err2) {
                        return res.status(500).json({ error: err2.message });
                    }
                    res.json({ message: 'Projeto atualizado com sucesso!' });
                }
            );
        });
        return;
    }

    upload.single('arquivo')(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ error: err.message || err });
        }

        const { titulo, descricao, tipo_servico } = req.body;
        let newImagem = null;
        let newVideo = null;

        if (req.file) {
            try {
                const { url } = await blob.uploadFile(req.file.buffer, req.file.originalname, 'portfolio');
                const ext = path.extname(req.file.originalname).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
                    newImagem = url;
                } else {
                    newVideo = url;
                }
            } catch (uploadErr) {
                return res.status(500).json({ error: 'Erro ao fazer upload: ' + uploadErr.message });
            }
        }

        db.get('SELECT * FROM portfolio WHERE id = ?', [req.params.id], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: 'Projeto não encontrado' });
            }

            const finalImagem = newImagem || row.imagem_url;
            const finalVideo = newVideo || row.video_url;

            // Deletar arquivo antigo do Blob se foi substituído
            if (newImagem && row.imagem_url) {
                await blob.deleteFile(row.imagem_url);
            }
            if (newVideo && row.video_url) {
                await blob.deleteFile(row.video_url);
            }

            db.run(
                'UPDATE portfolio SET titulo = ?, descricao = ?, tipo_servico = ?, imagem_url = ?, video_url = ? WHERE id = ?',
                [titulo, descricao, tipo_servico, finalImagem, finalVideo, req.params.id],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Projeto atualizado com sucesso!' });
                }
            );
        });
    });
});

// Deletar projeto do portfólio
app.delete('/api/portfolio/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('portfolio_apagado'), (req, res) => {
    // Buscar arquivo para deletar
    db.get('SELECT * FROM portfolio WHERE id = ?', [req.params.id], async (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Deletar arquivo do Blob se existir
        if (row) {
            if (row.imagem_url) await blob.deleteFile(row.imagem_url);
            if (row.video_url) await blob.deleteFile(row.video_url);
        }

        // Deletar do banco
        db.run('DELETE FROM portfolio WHERE id = ?', [req.params.id], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Projeto deletado com sucesso!' });
        });
    });
});

// ==================== ROTAS DE PEDIDOS DE PORTFÓLIO ====================

// Cliente envia pedido de interesse num projeto do portfólio
app.post('/api/pedidos-portfolio', autenticarToken, auditMiddleware('pedido_portfolio_enviado'), (req, res) => {
    const { portfolio_id, portfolio_titulo, portfolio_imagem, portfolio_video, portfolio_tipo, mensagem } = req.body;
    const user = req.user;

    if (!portfolio_id) {
        return res.status(400).json({ error: 'portfolio_id é obrigatório' });
    }

    db.run(
        `INSERT INTO pedidos_portfolio 
        (usuario_id, usuario_nome, usuario_email, portfolio_id, portfolio_titulo, portfolio_imagem, portfolio_video, portfolio_tipo, mensagem)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.nome, user.email, portfolio_id, portfolio_titulo || '', portfolio_imagem || '', portfolio_video || '', portfolio_tipo || '', mensagem || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Pedido enviado ao administrador com sucesso!' });
        }
    );
});

// Admin/funcionário lista todos os pedidos de portfólio
app.get('/api/pedidos-portfolio', autenticarToken, verificarRole('admin', 'funcionario'), (req, res) => {
    db.all('SELECT * FROM pedidos_portfolio ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ pedidos: rows });
    });
});

// Admin atualiza status do pedido
app.put('/api/pedidos-portfolio/:id/status', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('pedido_status_atualizado'), (req, res) => {
    const { status, orcamento_id } = req.body;
    const validStatus = ['pendente', 'visto', 'orcamento_criado'];
    if (!validStatus.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
    }
    db.run(
        'UPDATE pedidos_portfolio SET status = ?, orcamento_id = ? WHERE id = ?',
        [status, orcamento_id || null, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
            res.json({ message: 'Status actualizado com sucesso!' });
        }
    );
});

// Admin elimina um pedido
app.delete('/api/pedidos-portfolio/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('pedido_apagado'), (req, res) => {
    db.run('DELETE FROM pedidos_portfolio WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Pedido não encontrado' });
        res.json({ message: 'Pedido eliminado com sucesso!' });
    });
});

// ==================== ROTAS DE CONFIGURAÇÕES ====================


// Buscar todas as configurações
app.get('/api/configuracoes', (req, res) => {
    db.all('SELECT * FROM configuracoes', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const config = {};
        rows.forEach(row => {
            config[row.chave] = row.valor;
        });

        res.json({ configuracoes: config });
    });
});

// Atualizar configuração
app.put('/api/configuracoes/:chave', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('configuracao_atualizada'), (req, res) => {
    const { valor } = req.body;

    db.run(
        'UPDATE configuracoes SET valor = ? WHERE chave = ?',
        [valor, req.params.chave],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Configuração atualizada!' });
        }
    );
});

// ==================== ROTAS DE FALTAS ====================

// Listar faltas de um funcionário
app.get('/api/faltas/:usuario_id', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all('SELECT * FROM faltas WHERE usuario_id = ? ORDER BY data DESC', [req.params.usuario_id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ faltas: rows });
    });
});

// Listar todas as faltas (com dados do funcionário)
app.get('/api/faltas', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all(`
        SELECT f.*, u.nome as funcionario_nome
        FROM faltas f
        JOIN usuarios u ON f.usuario_id = u.id
        ORDER BY f.data DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ faltas: rows });
    });
});

// Marcar falta
app.post('/api/faltas', autenticarToken, verificarRole('admin'), auditMiddleware('falta_registada'), (req, res) => {
    const { usuario_id, data, observacao, tipo, tipo_falta } = req.body;
    if (!usuario_id || !data) {
        return res.status(400).json({ error: 'usuario_id e data são obrigatórios' });
    }
    db.run(
        'INSERT INTO faltas (usuario_id, data, observacao, tipo, tipo_falta) VALUES (?, ?, ?, ?, ?)',
        [usuario_id, data, observacao || null, tipo || null, tipo_falta || 'dia_inteiro'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Falta registada!' });
        }
    );
});

// Justificar (ou reverter) falta com tipo opcional
app.put('/api/faltas/:id/justificar', autenticarToken, verificarRole('admin'), auditMiddleware('falta_justificada'), (req, res) => {
    const { tipo, justificada } = req.body;
    let sql, params;
    if (justificada === 0) {
        sql = 'UPDATE faltas SET justificada = 0, tipo = NULL WHERE id = ?';
        params = [req.params.id];
    } else if (tipo !== undefined) {
        sql = 'UPDATE faltas SET justificada = 1, tipo = ? WHERE id = ?';
        params = [tipo, req.params.id];
    } else {
        sql = 'UPDATE faltas SET justificada = 1 WHERE id = ?';
        params = [req.params.id];
    }
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Falta não encontrada' });
        const msg = justificada === 0 ? 'Justificação revertida!' : 'Falta justificada!';
        res.json({ message: msg });
    });
});

// Apagar falta
app.delete('/api/faltas/:id', autenticarToken, verificarRole('admin'), auditMiddleware('falta_apagada'), (req, res) => {
    db.run('DELETE FROM faltas WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Falta não encontrada' });
        res.json({ message: 'Falta removida!' });
    });
});

// ==================== ROTAS DE VERIFICAÇÃO DE CLIENTES ====================

// Verificar cliente
app.put('/api/clientes/:id/verificar', autenticarToken, verificarRole('admin'), auditMiddleware('cliente_verificado'), (req, res) => {
    db.run("UPDATE usuarios SET verificado = 1 WHERE id = ? AND role = 'cliente'", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
        res.json({ message: 'Cliente verificado!' });
    });
});

// ==================== ROTAS DE PAGAMENTOS ====================

// Listar serviços com status de pagamento
app.get('/api/pagamentos', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all(`
        SELECT s.id, s.tipo_teto, s.area, s.valor_total, s.data_servico, s.pago, s.created_at,
               COALESCE(c.nome, 'N/A') as cliente_nome
        FROM servicos s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        ORDER BY s.created_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ pagamentos: rows });
    });
});

// Marcar serviço como pago
app.put('/api/servicos/:id/pagar', autenticarToken, verificarRole('admin'), auditMiddleware('pagamento_registado'), (req, res) => {
    db.run('UPDATE servicos SET pago = 1 WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Serviço não encontrado' });
        res.json({ message: 'Pagamento registado!' });
    });
});

// ==================== ROTAS DE PREÇOS ====================

// Listar todos os preços
app.get('/api/precos', (req, res) => {
    const categoria = req.query.categoria;
    let query = 'SELECT * FROM precos_materiais ORDER BY categoria, item';
    let params = [];

    if (categoria) {
        query = 'SELECT * FROM precos_materiais WHERE categoria = ? ORDER BY item';
        params = [categoria];
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ precos: rows });
    });
});

// Atualizar preço
app.put('/api/precos/:id', autenticarToken, verificarRole('admin', 'funcionario'), auditMiddleware('preco_atualizado'), (req, res) => {
    const { preco } = req.body;

    db.run(
        'UPDATE precos_materiais SET preco = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [preco, req.params.id],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Preço atualizado!' });
        }
    );
});

// ==================== ROTAS DE RELATÓRIOS ====================

// Relatório de serviços por período
app.get('/api/relatorios/servicos', (req, res) => {
    const { data_inicio, data_fim } = req.query;

    let query = `
    SELECT s.*, c.nome as cliente_nome 
    FROM servicos s 
    LEFT JOIN clientes c ON s.cliente_id = c.id
  `;
    let params = [];

    if (data_inicio && data_fim) {
        query += ' WHERE s.data_servico BETWEEN ? AND ?';
        params = [data_inicio, data_fim];
    }

    query += ' ORDER BY s.data_servico DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ servicos: rows });
    });
});

// Estatísticas gerais
app.get('/api/relatorios/estatisticas', (req, res) => {
    const stats = {};

    // Total de clientes
    db.get('SELECT COUNT(*) as total FROM clientes', [], (err, row) => {
        stats.total_clientes = row ? row.total : 0;

        // Total de projectos (portfolio)
        db.get('SELECT COUNT(*) as total FROM portfolio', [], (err, row) => {
            stats.total_servicos = row ? row.total : 0;

            // Valor total faturado (todos os serviços)
            db.get('SELECT SUM(valor_total) as total FROM servicos', [], (err, row) => {
                stats.valor_total_faturado = row ? row.total : 0;

                // Área total trabalhada
                db.get('SELECT SUM(area) as total FROM servicos', [], (err, row) => {
                    stats.area_total = row ? row.total : 0;

                    res.json({ estatisticas: stats });
                });
            });
        });
    });
});

// ==================== ROTAS DO AGENTE INTELIGENTE ====================

// Listar serviços apagados (backup)
app.get('/api/servicos-backup', autenticarToken, verificarRole('admin'), (req, res) => {
    db.all(`
        SELECT sb.*, 
            (SELECT nome FROM usuarios WHERE id = sb.deleted_by) as deleted_by_nome
        FROM servicos_backup sb 
        ORDER BY sb.deleted_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ backups: rows });
    });
});

// Apagar backup permanentemente
app.delete('/api/servicos-backup/:id', autenticarToken, verificarRole('admin'), (req, res) => {
    db.get('SELECT * FROM servicos_backup WHERE id = ?', [req.params.id], (err, backup) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!backup) return res.status(404).json({ error: 'Backup não encontrado' });

        db.run('DELETE FROM servicos_backup WHERE id = ?', [req.params.id], function (err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Backup nao encontrado ou ja foi apagado' });

            // Registar na auditoria
            const { registrarAuditoria } = require('./middleware/audit');
            registrarAuditoria(req.user.id, 'backup_apagado_permanentemente', {
                backup_id: backup.id,
                original_id: backup.original_id,
                cliente: backup.cliente_nome,
                valor: backup.valor_total,
                tipo: backup.tipo_teto
            }, req.ip, req.headers['user-agent']);

            res.json({ message: 'Backup apagado permanentemente!' });
        });
    });
});

// Restaurar serviço apagado
app.post('/api/servicos-backup/:id/restaurar', autenticarToken, verificarRole('admin'), (req, res) => {
    db.get('SELECT * FROM servicos_backup WHERE id = ?', [req.params.id], (err, backup) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!backup) return res.status(404).json({ error: 'Backup não encontrado' });

        // Inserir de volta na tabela servicos
        db.run(
            `INSERT INTO servicos (
                cliente_id, tipo_teto, area, largura, comprimento,
                materiais_json, servicos_adicionais_json,
                valor_materiais, valor_mao_obra, valor_total,
                data_servico, status, observacoes, pago
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                backup.cliente_id, backup.tipo_teto, backup.area, backup.largura, backup.comprimento,
                backup.materiais_json, backup.servicos_adicionais_json,
                backup.valor_materiais, backup.valor_mao_obra, backup.valor_total,
                backup.data_servico, backup.status || 'pendente', backup.observacoes, backup.pago || 0
            ],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                // Remover do backup
                db.run('DELETE FROM servicos_backup WHERE id = ?', [req.params.id], function (err2) {
                    if (err2) console.error('Erro ao remover backup:', err2.message);
                });

                // Registar na auditoria
                const { registrarAuditoria } = require('./middleware/audit');
                registrarAuditoria(req.user.id, 'servico_restaurado', {
                    backup_id: backup.id,
                    novo_id: this.lastID,
                    cliente: backup.cliente_nome,
                    valor: backup.valor_total
                }, req.ip, req.headers['user-agent']);

                res.json({ message: 'Serviço restaurado com sucesso!', novoId: this.lastID });
            }
        );
    });
});

// Relatório completo do sistema (Agente Inteligente)
app.get('/api/agente-relatorio', autenticarToken, verificarRole('admin'), (req, res) => {
    const relatorio = {};
    let pending = 9;

    function done() {
        pending--;
        if (pending === 0) {
            res.json({ relatorio });
        }
    }

    function fail(err) {
        if (pending > 0) {
            pending = 0;
            res.status(500).json({ error: err.message });
        }
    }

    // 1. Usuários
    db.get('SELECT COUNT(*) as total FROM usuarios', [], (e, r) => {
        if (e) return fail(e);
        relatorio.totalUsuarios = r ? r.total : 0;

        db.get("SELECT COUNT(*) as t FROM usuarios WHERE role = 'admin'", [], (e, r) => {
            if (e) return fail(e);
            relatorio.totalAdmins = r ? r.t : 0;

            db.get("SELECT COUNT(*) as t FROM usuarios WHERE role = 'funcionario'", [], (e, r) => {
                if (e) return fail(e);
                relatorio.totalFuncionarios = r ? r.t : 0;

                db.get("SELECT COUNT(*) as t FROM usuarios WHERE role = 'cliente'", [], (e, r) => {
                    if (e) return fail(e);
                    relatorio.totalClientes = r ? r.t : 0;
                    done();
                });
            });
        });
    });

    // 2. Serviços
    db.get('SELECT COUNT(*) as total FROM servicos', [], (e, r) => {
        if (e) return fail(e);
        relatorio.totalServicos = r ? r.total : 0;

        db.get('SELECT COALESCE(SUM(valor_total),0) as t FROM servicos', [], (e, r) => {
            if (e) return fail(e);
            relatorio.valorTotalFaturado = r ? r.t : 0;

            db.get('SELECT COUNT(*) as t FROM servicos WHERE pago=1', [], (e, r) => {
                if (e) return fail(e);
                relatorio.servicosPagos = r ? r.t : 0;

                db.get("SELECT COUNT(*) as t FROM servicos WHERE status = 'pendente'", [], (e, r) => {
                    if (e) return fail(e);
                    relatorio.servicosPendentes = r ? r.t : 0;

                    db.get('SELECT COALESCE(SUM(valor_total),0) as t FROM servicos WHERE pago=0', [], (e, r) => {
                        if (e) return fail(e);
                        relatorio.valorPendente = r ? r.t : 0;
                        done();
                    });
                });
            });
        });
    });

    // 3. Mensagens
    db.get('SELECT COUNT(*) as t FROM contact_messages WHERE lido=0', [], (e, r) => {
        if (e) return fail(e);
        relatorio.mensagensNaoLidas = r ? r.t : 0;
        done();
    });

    // 4. Faltas
    db.get('SELECT COUNT(*) as t FROM faltas WHERE justificada=0', [], (e, r) => {
        if (e) return fail(e);
        relatorio.faltasNaoJustificadas = r ? r.t : 0;
        done();
    });

    // 5. Portfolio
    db.get('SELECT COUNT(*) as t FROM portfolio', [], (e, r) => {
        if (e) return fail(e);
        relatorio.totalPortfolio = r ? r.t : 0;
        done();
    });

    // 6. Pedidos portfolio
    db.get("SELECT COUNT(*) as t FROM pedidos_portfolio WHERE status = 'pendente'", [], (e, r) => {
        if (e) return fail(e);
        relatorio.pedidosPendentes = r ? r.t : 0;
        done();
    });

    // 7. Backups (recibos apagados)
    db.get('SELECT COUNT(*) as t FROM servicos_backup', [], (e, r) => {
        if (e) return fail(e);
        relatorio.totalBackups = r ? r.t : 0;
        done();
    });

    // 8. Últimas atividades (audit logs)
    db.all('SELECT al.*, u.nome as usuario_nome FROM audit_logs al LEFT JOIN usuarios u ON al.usuario_id = u.id ORDER BY al.created_at DESC LIMIT 20', [], (e, rows) => {
        if (e) return fail(e);
        relatorio.ultimasAtividades = rows || [];
        done();
    });

    // 9. Últimos serviços apagados
    db.all('SELECT * FROM servicos_backup ORDER BY deleted_at DESC LIMIT 10', [], (e, rows) => {
        if (e) return fail(e);
        relatorio.ultimosBackups = rows || [];
        done();
    });
});

// ==================== ROTAS DE HISTÓRICO / AUDITORIA DO SISTEMA ====================

// Listar histórico completo do sistema (apenas admin), com filtros e paginação
app.get('/api/auditoria', autenticarToken, verificarRole('admin'), (req, res) => {
    const pagina = Math.max(1, parseInt(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(5, parseInt(req.query.por_pagina) || 25));
    const offset = (pagina - 1) * porPagina;

    const where = [];
    const params = [];

    if (req.query.acao) {
        where.push('al.acao = ?');
        params.push(req.query.acao);
    }
    if (req.query.usuario_id) {
        where.push('al.usuario_id = ?');
        params.push(parseInt(req.query.usuario_id) || 0);
    }
    if (req.query.data_inicio) {
        where.push("al.created_at >= ?");
        params.push(req.query.data_inicio + ' 00:00:00');
    }
    if (req.query.data_fim) {
        where.push("al.created_at <= ?");
        params.push(req.query.data_fim + ' 23:59:59');
    }
    if (req.query.busca) {
        where.push("(al.acao LIKE ? OR al.detalhes LIKE ? OR COALESCE(u.nome, '') LIKE ? OR al.ip LIKE ?)");
        const termo = '%' + req.query.busca + '%';
        params.push(termo, termo, termo, termo);
    }

    const whereSql = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    db.get(
        `SELECT COUNT(*) as total FROM audit_logs al LEFT JOIN usuarios u ON al.usuario_id = u.id ${whereSql}`,
        params,
        (err, rowTotal) => {
            if (err) return res.status(500).json({ error: err.message });
            const total = rowTotal ? rowTotal.total : 0;

            db.all(
                `SELECT al.*, u.nome as usuario_nome
                 FROM audit_logs al
                 LEFT JOIN usuarios u ON al.usuario_id = u.id
                 ${whereSql}
                 ORDER BY al.created_at DESC
                 LIMIT ? OFFSET ?`,
                [...params, porPagina, offset],
                (err2, rows) => {
                    if (err2) return res.status(500).json({ error: err2.message });

                    // Ações distintas existentes (para o filtro do painel)
                    db.all('SELECT DISTINCT acao FROM audit_logs ORDER BY acao', [], (err3, acoes) => {
                        if (err3) return res.status(500).json({ error: err3.message });
                        res.json({
                            logs: rows || [],
                            total,
                            pagina,
                            porPagina,
                            totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
                            acoes: (acoes || []).map(a => a.acao)
                        });
                    });
                }
            );
        }
    );
});

// Apagar histórico de auditoria (apenas admin, com confirmação dupla no frontend)
app.delete('/api/auditoria', autenticarToken, verificarRole('admin'), (req, res) => {
    const { ate } = req.body || {};
    if (ate) {
        db.run('DELETE FROM audit_logs WHERE created_at <= ?', [ate + ' 23:59:59'], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            registrarAuditoria(req.user.id, 'historico_apagado', { ate, registos: this.changes }, req.ip, req.headers['user-agent']);
            res.json({ message: 'Histórico anterior a ' + ate + ' apagado!', apagados: this.changes });
        });
    } else {
        db.run('DELETE FROM audit_logs', [], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            registrarAuditoria(req.user.id, 'historico_total_apagado', { registos: this.changes }, req.ip, req.headers['user-agent']);
            res.json({ message: 'Todo o histórico foi apagado!', apagados: this.changes });
        });
    }
});

// ==================== ROTA DE REFRESH TOKEN ====================

app.post('/api/auth/refresh', (req, res) => {
    renovarToken(req, res);
});

// ==================== ROTAS DO AGENTE DE IA ====================

const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);

// ==================== ROTAS DE SEGURANCA ====================

const securityRoutes = require('./routes/security');
app.use('/api/security', securityRoutes);

// ==================== TRATAMENTO DE ERROS GLOBAL ====================

app.use((err, req, res, next) => {
    console.error('Erro nao tratado:', err);

    if (err.name === 'MulterError') {
        return res.status(400).json({ error: 'Erro no upload: ' + err.message });
    }

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Ficheiro demasiado grande' });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : err.message
    });
});

// ==================== INICIAR SERVIDOR ====================

// Exportar app para Vercel Serverless Functions
module.exports = app;

// Iniciar servidor apenas localmente (não no Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
        console.log(`📊 Sistema de Montagem de Teto Falso`);
        console.log(`✓ API disponivel em http://localhost:${PORT}/api`);
        console.log(`🔒 Seguranca melhorada ativa`);
        console.log(`🤖 Agente AI ${process.env.OPENAI_API_KEY ? 'configurado' : 'nao configurado (adicione OPENAI_API_KEY no .env)'}`);
        console.log(`\nPressione Ctrl+C para parar o servidor\n`);
    });
}

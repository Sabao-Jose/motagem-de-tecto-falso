const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Inicializar banco de dados
db.serialize(() => {
  // Tabela de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      email TEXT,
      endereco TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de utilizadores (autenticação)
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      telefone TEXT,
      role TEXT NOT NULL DEFAULT 'cliente' CHECK(role IN ('admin', 'funcionario', 'cliente')),
      cliente_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabela de serviços realizados
  db.run(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      tipo_teto TEXT NOT NULL,
      area REAL NOT NULL,
      largura REAL,
      comprimento REAL,
      materiais_json TEXT,
      servicos_adicionais_json TEXT,
      valor_materiais REAL,
      valor_mao_obra REAL,
      valor_total REAL NOT NULL,
      data_servico DATE,
      status TEXT DEFAULT 'pendente',
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    )
  `);

  // Tabela de portfólio
  db.run(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT,
      tipo_servico TEXT,
      imagem_url TEXT,
      video_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de pedidos de portfólio (cliente envia modelo que gostou ao admin)
  db.run(`
    CREATE TABLE IF NOT EXISTS pedidos_portfolio (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      usuario_nome TEXT,
      usuario_email TEXT,
      portfolio_id INTEGER NOT NULL,
      portfolio_titulo TEXT,
      portfolio_imagem TEXT,
      portfolio_video TEXT,
      portfolio_tipo TEXT,
      mensagem TEXT,
      status TEXT DEFAULT 'pendente',
      orcamento_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (portfolio_id) REFERENCES portfolio(id)
    )
  `);

  // Tabela de configurações
  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT
    )
  `);

  // Tabela de mensagens de contacto
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT NOT NULL,
      assunto TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      lido INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de faltas de funcionários
  db.run(`
    CREATE TABLE IF NOT EXISTS faltas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      data DATE NOT NULL,
      justificada INTEGER DEFAULT 0,
      observacao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Adicionar colunas em usuarios se não existirem
  const addColumnIfNotExists = (table, column, def) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Erro ao adicionar coluna:', err.message);
      }
    });
  };

  addColumnIfNotExists('usuarios', 'verificado', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('usuarios', 'salario', 'REAL DEFAULT 0');
  addColumnIfNotExists('usuarios', 'endereco', 'TEXT');
  addColumnIfNotExists('faltas', 'tipo', 'TEXT');
  addColumnIfNotExists('faltas', 'tipo_falta', 'TEXT DEFAULT "dia_inteiro"');
  addColumnIfNotExists('usuarios', 'numero_conta', 'TEXT');
  addColumnIfNotExists('usuarios', 'ultimo_login', 'DATETIME');
  addColumnIfNotExists('usuarios', 'pode_responder_mensagens', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('usuarios', 'foto', 'TEXT');
  addColumnIfNotExists('usuarios', 'banco', 'TEXT');
  addColumnIfNotExists('usuarios', 'tipo_conta', 'TEXT');
  addColumnIfNotExists('usuarios', 'ativo', 'INTEGER DEFAULT 1');
  addColumnIfNotExists('usuarios', 'tentativas_login', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('usuarios', 'bloqueado_ate', 'DATETIME');

  // Tabela de backup de serviços apagados (copia de segurança)
  db.run(`
    CREATE TABLE IF NOT EXISTS servicos_backup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_id INTEGER NOT NULL,
      cliente_id INTEGER,
      cliente_nome TEXT,
      tipo_teto TEXT NOT NULL,
      area REAL NOT NULL,
      largura REAL,
      comprimento REAL,
      materiais_json TEXT,
      servicos_adicionais_json TEXT,
      valor_materiais REAL,
      valor_mao_obra REAL,
      valor_total REAL NOT NULL,
      data_servico DATE,
      status TEXT,
      observacoes TEXT,
      pago INTEGER DEFAULT 0,
      deleted_by INTEGER,
      deleted_by_nome TEXT,
      deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delete_reason TEXT,
      original_created_at DATETIME
    )
  `);

  // Tabela de logs de auditoria
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      acao TEXT NOT NULL,
      detalhes TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Tabela de conversas com AI
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      pergunta TEXT NOT NULL,
      resposta TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )
  `);

  // Indices para performance
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON audit_logs(usuario_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao)');
  db.run('CREATE INDEX IF NOT EXISTS idx_ai_conversations_usuario ON ai_conversations(usuario_id)');

  // Adicionar coluna pago em servicos se não existir
  db.run("ALTER TABLE servicos ADD COLUMN pago INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Erro ao adicionar coluna pago:', err.message);
    }
  });

  // Adicionar colunas de resposta em contact_messages se não existirem
  addColumnIfNotExists('contact_messages', 'resposta', 'TEXT');
  addColumnIfNotExists('contact_messages', 'respondida', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('contact_messages', 'updated_at', 'DATETIME');
  addColumnIfNotExists('contact_messages', 'resposta_anexo', 'TEXT');
  addColumnIfNotExists('contact_messages', 'resposta_orcamento_id', 'INTEGER');

  // Tabela de preços de materiais (com unique para evitar duplicados)
  db.run(`
    CREATE TABLE IF NOT EXISTS precos_materiais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT NOT NULL,
      item TEXT NOT NULL,
      unidade TEXT NOT NULL,
      preco REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(categoria, item, unidade)
    )
  `);

  // Inserir configurações padrão
  db.run(`
    INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES 
    ('empresa_nome', 'Teto Falso Sabao'),
    ('empresa_telefone', '+258 XX XXX XXXX'),
    ('empresa_email', 'contato@tetofalso.com'),
    ('empresa_endereco', 'Maputo, Moçambique'),
    ('margem_seguranca', '10'),
    ('smtp_host', ''),
    ('smtp_port', '587'),
    ('smtp_user', ''),
    ('smtp_pass', ''),
    ('smtp_secure', '0'),
    ('admin_email', 'tectofalsosabao@gmail.com')
  `);

  // Criar admin inicial apenas se credenciais forem fornecidas por ambiente
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminSenha = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminSenha) {
    const senhaHash = bcrypt.hashSync(adminSenha, 10);
    db.run(
      `INSERT OR IGNORE INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)`,
      ['Administrador', adminEmail, senhaHash, 'admin']
    );
    console.log('✓ Admin inicial configurado via variaveis de ambiente');
  } else {
    console.warn('⚠ ADMIN_EMAIL/ADMIN_PASSWORD nao definidos: admin inicial nao criado.');
  }

  // Inserir preços padrão de materiais
  const precosPadrao = [
    // Gesso
    ['gesso', 'Chapa de Gesso 1,20x2,40m', 'unidade', 450],
    ['gesso', 'Perfil Mãe', 'metro', 85],
    ['gesso', 'Perfil Guia', 'metro', 75],
    ['gesso', 'Pendural/Pente', 'unidade', 15],
    ['gesso', 'Parafuso', 'unidade', 2],
    ['gesso', 'Bucha', 'unidade', 2],
    ['gesso', 'Massa Corrida', 'kg', 45],

    // PVC
    ['pvc', 'Chapa PVC 5,80x0,25m', 'unidade', 380],
    ['pvc', 'Perfil Guia PVC', 'metro', 65],
    ['pvc', 'Perfil de Sustentação', 'metro', 55],
    ['pvc', 'Pendural PVC', 'unidade', 12],
    ['pvc', 'Cantoneira PVC', 'metro', 35],

    // Modular
    ['modular', 'Placa Modular 60x60cm', 'unidade', 280],
    ['modular', 'Placa Modular 60x120cm', 'unidade', 520],
    ['modular', 'Perfil T24 (Longarina)', 'metro', 95],
    ['modular', 'Perfil T15 (Travessa)', 'metro', 75],
    ['modular', 'Pendural/Tirante', 'unidade', 18],
    ['modular', 'Cantoneira Perimetral', 'metro', 45],

    // Serviços
    ['servico', 'Mão de Obra Instalação', 'm²', 150],
    ['servico', 'Barramento de Parede', 'm²', 120],
    ['servico', 'Barramento de Teto', 'm²', 130],
    ['servico', 'Aplicação de Massa', 'm²', 80],
    ['servico', 'Pintura Profissional', 'm²', 100],
    ['servico', 'Instalação Elétrica', 'ponto', 250]
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO precos_materiais (categoria, item, unidade, preco) 
    VALUES (?, ?, ?, ?)
  `);

  precosPadrao.forEach(preco => {
    stmt.run(preco);
  });

  stmt.finalize();

  console.log('✓ Banco de dados inicializado com sucesso!');
});

// Exportar db com promise ready para quem quiser aguardar inicializacao
db.ready = new Promise((resolve, reject) => {
  // Segunda serialize executa apos todos os statements da primeira
  db.serialize(() => {
    db.run('SELECT 1', (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

module.exports = db;

/**
 * PostgreSQL Database Adapter for Vercel
 * Mantém a mesma API do SQLite (db.all, db.get, db.run)
 * para que o server.js não precise de alterações
 */

const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

// Wrapper que emula a API do SQLite
const db = {
  _initialized: false,
  _initPromise: null,

  // Aguarda inicializacao antes de executar queries
  _ensureInit: async function() {
    if (this._initPromise) {
      await this._initPromise;
    }
  },

  // db.run(query, params, callback)
  run: function(query, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    // Aguarda inicializacao antes de executar
    this._ensureInit().then(() => {
      const adapted = adaptQuery(query);
      return sql.query(adapted, params);
    }).then(result => {
      if (callback) callback(null, { 
        changes: result.rowCount,
        lastID: result.rows[0] ? result.rows[0].id : null 
      });
    }).catch(err => {
      if (callback) callback(err);
    });
  },

  // db.all(query, params, callback)
  all: function(query, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    this._ensureInit().then(() => {
      const adapted = adaptQuery(query);
      return sql.query(adapted, params);
    }).then(result => {
      if (callback) callback(null, result.rows);
    }).catch(err => {
      if (callback) callback(err);
    });
  },

  // db.get(query, params, callback)
  get: function(query, params, callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    this._ensureInit().then(() => {
      const adapted = adaptQuery(query);
      return sql.query(adapted, params);
    }).then(result => {
      if (callback) callback(null, result.rows[0] || undefined);
    }).catch(err => {
      if (callback) callback(err);
    });
  },

  // db.serialize(callback) - no-op for PostgreSQL
  serialize: function(callback) {
    if (callback) callback();
  },

  // db.prepare(query) - retorna statement mock
  prepare: function(query) {
    const adapted = adaptQuery(query);
    const self = this;
    return {
      run: function(...params) {
        // Last param is callback
        const callback = typeof params[params.length - 1] === 'function' ? params.pop() : null;
        const flatParams = params.flat();
        self._ensureInit().then(() => {
          return sql.query(adapted, flatParams);
        }).then(result => {
          if (callback) callback(null, { changes: result.rowCount });
        }).catch(err => {
          if (callback) callback(err);
        });
      },
      finalize: function() {}
    };
  }
};

// Adaptar sintaxe SQL do SQLite para PostgreSQL
function adaptQuery(query) {
  let q = query.trim();
  
  // INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
  q = q.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  // Verificar se é INSERT OR IGNORE
  const isInsertOrIgnore = /^INSERT\s+OR\s+IGNORE/i.test(q);
  q = q.replace(/INSERT\s+OR\s+IGNORE/gi, 'INSERT');
  
  // Se era INSERT OR IGNORE e não tem ON CONFLICT, adicionar ON CONFLICT DO NOTHING
  if (isInsertOrIgnore && !/ON\s+CONFLICT/i.test(q)) {
    q = q.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
  }
  
  // ? placeholder -> $1, $2, etc. (PostgreSQL numbered params)
  // Substitui apenas fora de strings literais (entre aspas simples)
  let paramIndex = 0;
  const parts = q.split(/'/);
  for (let i = 0; i < parts.length; i++) {
    // Partes pares (índice 0, 2, 4...) estão fora de strings
    if (i % 2 === 0) {
      parts[i] = parts[i].replace(/\?/g, () => {
        paramIndex++;
        return `$${paramIndex}`;
      });
    }
  }
  q = parts.join("'");
  
  // CURRENT_TIMESTAMP já funciona no PostgreSQL
  
  // Remover backticks extras se houver
  q = q.replace(/`/g, '"');
  
  return q;
}

// Inicializar tabelas no PostgreSQL
async function initDatabase() {
  if (db._initialized) return;
  
  try {
    // Tabela de clientes
    await sql.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        endereco TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de utilizadores
    await sql.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        telefone TEXT,
        role TEXT NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'funcionario', 'cliente')),
        cliente_id INTEGER REFERENCES clientes(id),
        verificado INTEGER DEFAULT 0,
        salario REAL DEFAULT 0,
        endereco TEXT,
        numero_conta TEXT,
        ultimo_login TIMESTAMP,
        pode_responder_mensagens INTEGER DEFAULT 0,
        foto TEXT,
        banco TEXT,
        tipo_conta TEXT,
        ativo INTEGER DEFAULT 1,
        tentativas_login INTEGER DEFAULT 0,
        bloqueado_ate TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de servicos
    await sql.query(`
      CREATE TABLE IF NOT EXISTS servicos (
        id SERIAL PRIMARY KEY,
        cliente_id INTEGER REFERENCES clientes(id),
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
        pago INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de portfolio
    await sql.query(`
      CREATE TABLE IF NOT EXISTS portfolio (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        descricao TEXT,
        tipo_servico TEXT,
        imagem_url TEXT,
        video_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de pedidos_portfolio
    await sql.query(`
      CREATE TABLE IF NOT EXISTS pedidos_portfolio (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        usuario_nome TEXT,
        usuario_email TEXT,
        portfolio_id INTEGER NOT NULL REFERENCES portfolio(id),
        portfolio_titulo TEXT,
        portfolio_imagem TEXT,
        portfolio_video TEXT,
        portfolio_tipo TEXT,
        mensagem TEXT,
        status TEXT DEFAULT 'pendente',
        orcamento_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de configuracoes
    await sql.query(`
      CREATE TABLE IF NOT EXISTS configuracoes (
        id SERIAL PRIMARY KEY,
        chave TEXT UNIQUE NOT NULL,
        valor TEXT
      )
    `);

    // Tabela de contact_messages
    await sql.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT NOT NULL,
        email TEXT NOT NULL,
        assunto TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        lido INTEGER DEFAULT 0,
        resposta TEXT,
        respondida INTEGER DEFAULT 0,
        updated_at TIMESTAMP,
        resposta_anexo TEXT,
        resposta_orcamento_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de faltas
    await sql.query(`
      CREATE TABLE IF NOT EXISTS faltas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        data DATE NOT NULL,
        justificada INTEGER DEFAULT 0,
        observacao TEXT,
        tipo TEXT,
        tipo_falta TEXT DEFAULT 'dia_inteiro',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de servicos_backup
    await sql.query(`
      CREATE TABLE IF NOT EXISTS servicos_backup (
        id SERIAL PRIMARY KEY,
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
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delete_reason TEXT,
        original_created_at TIMESTAMP
      )
    `);

    // Tabela de audit_logs
    await sql.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        acao TEXT NOT NULL,
        detalhes TEXT,
        ip TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de ai_conversations
    await sql.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        pergunta TEXT NOT NULL,
        resposta TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de precos_materiais
    await sql.query(`
      CREATE TABLE IF NOT EXISTS precos_materiais (
        id SERIAL PRIMARY KEY,
        categoria TEXT NOT NULL,
        item TEXT NOT NULL,
        unidade TEXT NOT NULL,
        preco REAL NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(categoria, item, unidade)
      )
    `);

    // Indices
    await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_usuario ON audit_logs(usuario_id)');
    await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at)');
    await sql.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_acao ON audit_logs(acao)');
    await sql.query('CREATE INDEX IF NOT EXISTS idx_ai_conversations_usuario ON ai_conversations(usuario_id)');

    // Inserir configurações padrão
    await sql.query(`
      INSERT INTO configuracoes (chave, valor) VALUES 
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
      ON CONFLICT (chave) DO NOTHING
    `);

    // Criar admin inicial apenas se credenciais forem fornecidas por ambiente
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminSenha = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminSenha) {
      const senhaHash = bcrypt.hashSync(adminSenha, 10);
      await sql.query(
        'INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        ['Administrador', adminEmail, senhaHash, 'admin']
      );
      console.log('✓ Admin inicial configurado via variaveis de ambiente');
    } else {
      console.warn('⚠ ADMIN_EMAIL/ADMIN_PASSWORD nao definidos: admin inicial nao criado.');
    }

    // Inserir preços padrão
    const precosPadrao = [
      ['gesso', 'Chapa de Gesso 1,20x2,40m', 'unidade', 450],
      ['gesso', 'Perfil Mãe', 'metro', 85],
      ['gesso', 'Perfil Guia', 'metro', 75],
      ['gesso', 'Pendural/Pente', 'unidade', 15],
      ['gesso', 'Parafuso', 'unidade', 2],
      ['gesso', 'Bucha', 'unidade', 2],
      ['gesso', 'Massa Corrida', 'kg', 45],
      ['pvc', 'Chapa PVC 5,80x0,25m', 'unidade', 380],
      ['pvc', 'Perfil Guia PVC', 'metro', 65],
      ['pvc', 'Perfil de Sustentação', 'metro', 55],
      ['pvc', 'Pendural PVC', 'unidade', 12],
      ['pvc', 'Cantoneira PVC', 'metro', 35],
      ['modular', 'Placa Modular 60x60cm', 'unidade', 280],
      ['modular', 'Placa Modular 60x120cm', 'unidade', 520],
      ['modular', 'Perfil T24 (Longarina)', 'metro', 95],
      ['modular', 'Perfil T15 (Travessa)', 'metro', 75],
      ['modular', 'Pendural/Tirante', 'unidade', 18],
      ['modular', 'Cantoneira Perimetral', 'metro', 45],
      ['servico', 'Mão de Obra Instalação', 'm²', 150],
      ['servico', 'Barramento de Parede', 'm²', 120],
      ['servico', 'Barramento de Teto', 'm²', 130],
      ['servico', 'Aplicação de Massa', 'm²', 80],
      ['servico', 'Pintura Profissional', 'm²', 100],
      ['servico', 'Instalação Elétrica', 'ponto', 250]
    ];

    for (const preco of precosPadrao) {
      await sql.query(
        'INSERT INTO precos_materiais (categoria, item, unidade, preco) VALUES ($1, $2, $3, $4) ON CONFLICT (categoria, item, unidade) DO NOTHING',
        preco
      );
    }

    db._initialized = true;
    console.log('✓ Banco PostgreSQL inicializado com sucesso!');
  } catch (err) {
    console.error('Erro ao inicializar PostgreSQL:', err.message);
  }
}

// Inicializar automaticamente e armazenar promise para concurrency safety
db._initPromise = initDatabase().catch(err => {
  console.error('✗ Falha na inicializacao do PostgreSQL:', err.message);
  throw err;
});

// Exportar db com promise ready
db.ready = db._initPromise;

module.exports = db;

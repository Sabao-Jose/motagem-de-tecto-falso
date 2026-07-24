const db = require('../database');
const { obterLogsAuditoria } = require('../middleware/audit');

async function obterContextoDoSistema() {
  return new Promise((resolve) => {
    const ctx = {};

    db.get('SELECT COUNT(*) as t FROM usuarios', [], (e, r) => {
      ctx.totalUsuarios = r ? r.t : 0;
      db.get('SELECT COUNT(*) as t FROM usuarios WHERE role = "cliente"', [], (e, r) => {
        ctx.totalClientes = r ? r.t : 0;
        db.get('SELECT COUNT(*) as t FROM usuarios WHERE role = "funcionario"', [], (e, r) => {
          ctx.totalFuncionarios = r ? r.t : 0;
          db.get('SELECT COUNT(*) as t FROM usuarios WHERE role = "admin"', [], (e, r) => {
            ctx.totalAdmins = r ? r.t : 0;
            db.get('SELECT COUNT(*) as t FROM servicos', [], (e, r) => {
              ctx.totalServicos = r ? r.t : 0;
              db.get('SELECT COALESCE(SUM(valor_total),0) as t FROM servicos', [], (e, r) => {
                ctx.valorTotalFaturado = r ? r.t : 0;
                db.get('SELECT COUNT(*) as t FROM servicos WHERE pago = 1', [], (e, r) => {
                  ctx.totalPagos = r ? r.t : 0;
                  db.get('SELECT COUNT(*) as t FROM contact_messages WHERE lido = 0', [], (e, r) => {
                    ctx.mensagensNaoLidas = r ? r.t : 0;
                    db.get('SELECT COUNT(*) as t FROM faltas WHERE justificada = 0', [], (e, r) => {
                      ctx.faltasNaoJustificadas = r ? r.t : 0;
                      db.get('SELECT COUNT(*) as t FROM servicos WHERE status = "pendente"', [], (e, r) => {
                        ctx.servicosPendentes = r ? r.t : 0;
                        db.get('SELECT COALESCE(SUM(valor_total),0) as t FROM servicos WHERE pago = 0', [], (e, r) => {
                          ctx.valorPendente = r ? r.t : 0;
                          resolve(ctx);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

function formatarValor(v) { return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v); }

const respostas = {
  ola: () => 'Ola! Como posso ajudar na gestao do sistema? Pergunte sobre usuarios, servicos, facturacao, financas, seguranca, faltas, mensagens ou configuracoes.',

  bom_dia: () => 'Bom dia! Como posso ajudar na gestao do sistema hoje?',

  boa_tarde: () => 'Boa tarde! Em que posso ser util?',

  boa_noite: () => 'Boa noite! Como posso ajudar?',

  obrigado: () => 'De nada! Esta a minha disposicao para ajudar na gestao do sistema.',

  ajuda: () => `Posso ajudar com:

📊 **ESTATISTICAS** — "estatisticas", "resumo do sistema", "dashboard"
👥 **USUARIOS** — "lista de usuarios", "quantos clientes", "funcionarios", "admins"
💰 **FACTURACAO** — "facturacao", "valor total", "quanto faturado", "pagamentos"
📋 **SERVICOS** — "servicos pendentes", "lista servicos", "total servicos"
🔒 **SEGURANCA** — "logs de seguranca", "auditoria", "sessoes ativas"
📬 **MENSAGENS** — "mensagens nao lidas", "contactos"
👷 **FALTAS** — "faltas funcionarios", "faltas nao justificadas"
⚙️ **CONFIGURACAO** — "configuracoes", "ajuda configuracao"

Pergunte o que precisar!`,

  estatisticas: async (ctx) => `📊 **Resumo do Sistema**

👥 **Usuarios:** ${ctx.totalUsuarios} total
  • Clientes: ${ctx.totalClientes}
  • Funcionarios: ${ctx.totalFuncionarios}
  • Administradores: ${ctx.totalAdmins}

📋 **Servicos:** ${ctx.totalServicos} registados
  • Pendentes: ${ctx.servicosPendentes}
  • Pagos: ${ctx.totalPagos}

💰 **Facturacao:**
  • Total faturado: ${formatarValor(ctx.valorTotalFaturado)}
  • Valor pendente: ${formatarValor(ctx.valorPendente)}

📬 **Mensagens nao lidas:** ${ctx.mensagensNaoLidas}
👷 **Faltas nao justificadas:** ${ctx.faltasNaoJustificadas}`,

  usuarios: async (ctx) => `👥 **Usuarios do Sistema**

Total: ${ctx.totalUsuarios}
  • Clientes: ${ctx.totalClientes}
  • Funcionarios: ${ctx.totalFuncionarios}
  • Administradores: ${ctx.totalAdmins}

Para gerir usuarios va ao separador "Utilizadores" no painel admin.`,

  funcionarios_lista: async () => {
    return new Promise((resolve) => {
      db.all('SELECT id, nome, email, telefone, salario, created_at FROM usuarios WHERE role = "funcionario" ORDER BY nome', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhum funcionario registado.');
        let r = `👷 **Lista de Funcionarios (${rows.length})**\n\n`;
        rows.forEach((f, i) => {
          r += `${i+1}. **${f.nome}** — ${f.email || 'sem email'}\n`;
          if (f.telefone) r += `   📞 ${f.telefone}\n`;
          if (f.salario) r += `   💰 Salario: ${formatarValor(f.salario)}\n`;
        });
        resolve(r);
      });
    });
  },

  clientes_lista: async () => {
    return new Promise((resolve) => {
      db.all('SELECT id, nome, email, telefone, verificado, created_at FROM usuarios WHERE role = "cliente" ORDER BY created_at DESC LIMIT 20', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhum cliente registado.');
        let r = `✅ **Ultimos Clientes Registados (${rows.length})**\n\n`;
        rows.forEach((c, i) => {
          r += `${i+1}. **${c.nome}** ${c.verificado ? '✅' : '⏳'} \n`;
          if (c.email) r += `   📧 ${c.email}\n`;
          if (c.telefone) r += `   📞 ${c.telefone}\n`;
        });
        resolve(r);
      });
    });
  },

  facturacao: async (ctx) => {
    return new Promise((resolve) => {
      db.get('SELECT COUNT(*) as total, COALESCE(SUM(valor_total),0) as soma FROM servicos WHERE pago = 1', [], (e, r) => {
        const pagos = r ? r.total : 0;
        const valorPago = r ? r.soma : 0;
        let resp = `💰 **Facturacao do Sistema**\n\n`;
        resp += `• Total faturado: **${formatarValor(ctx.valorTotalFaturado)}**\n`;
        resp += `• Total recebido: **${formatarValor(valorPago)}** (${pagos} servicos)\n`;
        resp += `• Valor pendente: **${formatarValor(ctx.valorPendente)}**\n`;
        resp += `• Servicos pagos: ${ctx.totalPagos} de ${ctx.totalServicos}\n`;
        resolve(resp);
      });
    });
  },

  servicos_pendentes: async () => {
    return new Promise((resolve) => {
      db.all('SELECT s.id, s.tipo_teto, s.valor_total, s.created_at, c.nome as cliente FROM servicos s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.status = "pendente" ORDER BY s.created_at DESC', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhum servico pendente.');
        let r = `📋 **Servicos Pendentes (${rows.length})**\n\n`;
        rows.forEach((s, i) => {
          r += `${i+1}. #${s.id} — ${s.tipo_teto} — ${formatarValor(s.valor_total)}\n`;
          if (s.cliente) r += `   👤 ${s.cliente}\n`;
          r += `   📅 ${s.created_at}\n`;
        });
        resolve(r);
      });
    });
  },

  mensagens_nao_lidas: async () => {
    return new Promise((resolve) => {
      db.all('SELECT id, nome, assunto, created_at FROM contact_messages WHERE lido = 0 ORDER BY created_at DESC', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhuma mensagem nao lida.');
        let r = `📬 **Mensagens Nao Lidas (${rows.length})**\n\n`;
        rows.forEach((m, i) => {
          r += `${i+1}. **${m.nome}** — ${m.assunto}\n`;
          r += `   📅 ${m.created_at}\n`;
        });
        resolve(r);
      });
    });
  },

  faltas: async () => {
    return new Promise((resolve) => {
      db.all('SELECT f.id, f.data, f.justificada, u.nome as funcionario FROM faltas f JOIN usuarios u ON f.usuario_id = u.id WHERE f.justificada = 0 ORDER BY f.data DESC LIMIT 15', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhuma falta nao justificada.');
        let r = `👷 **Faltas Nao Justificadas (${rows.length})**\n\n`;
        rows.forEach((f, i) => {
          r += `${i+1}. **${f.funcionario}** — ${f.data}\n`;
        });
        resolve(r);
      });
    });
  },

  seguranca: async (ctx) => `🔒 **Seguranca do Sistema**

• Autenticacao: JWT com refresh token
• Protecao de rotas: Role-based (admin/funcionario/cliente)
• Rate limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} req/15min (geral), 5 tentativas login/15min
• Headers de seguranca: Helmet ativo
• Validacao de inputs: Sim
• Auditoria: Sim (logs de operacoes)
• CORS: Restrito a dominios autorizados
• Passwords: Bcrypt com 12 rounds
• Contas: Bloqueio apos multiplas tentativas`,

  servicos_hoje: async () => {
    const hoje = new Date().toISOString().split('T')[0];
    return new Promise((resolve) => {
      db.all('SELECT s.id, s.tipo_teto, s.status, c.nome as cliente FROM servicos s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE date(s.data_servico) = ?', [hoje], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhum servico agendado para hoje.');
        let r = `📅 **Servicos de Hoje (${rows.length})**\n\n`;
        rows.forEach((s, i) => {
          r += `${i+1}. #${s.id} — ${s.tipo_teto} — ${s.status}\n`;
          if (s.cliente) r += `   👤 ${s.cliente}\n`;
        });
        resolve(r);
      });
    });
  },

  ajuda_config: () => `⚙️ **Ajuda de Configuracao**

No separador "Configuracoes" do painel admin pode definir:
• Nome da empresa (para relatorios e emails)
• Telefone e email de contacto
• Endereco da empresa
• Margem de seguranca (%) para orcamentos
• Configuracoes SMTP para envio de emails

As configuracoes de seguranca (JWT, rate limit, CORS) estao no ficheiro .env`,

  relatorios: () => `📈 **Relatorios Disponiveis**

Clique no botao "Relatorios" no painel admin para:
• Relatorio mensal, semestral, anual ou geral
• Graficos de desempenho
• Exportacao para PDF
• Exportacao para Excel`,

  pagamentos_lista: async () => {
    return new Promise((resolve) => {
      db.all('SELECT s.id, s.tipo_teto, s.valor_total, s.pago, c.nome as cliente FROM servicos s LEFT JOIN clientes c ON s.cliente_id = c.id ORDER BY s.created_at DESC LIMIT 15', [], (e, rows) => {
        if (e || !rows.length) return resolve('Nenhum servico registado.');
        let r = `💳 **Pagamentos (ultimos ${rows.length})**\n\n`;
        rows.forEach((s, i) => {
          r += `${i+1}. #${s.id} ${s.tipo_teto} — ${formatarValor(s.valor_total)} ${s.pago ? '✅ Pago' : '⏳ Pendente'}\n`;
          if (s.cliente) r += `   👤 ${s.cliente}\n`;
        });
        resolve(r);
      });
    });
  },
};

function detectarIntencao(mensagem) {
  const m = mensagem.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (/ola\b|ol[aá]|bom dia|boa tarde|boa noite|oie|hey|ei\b/.test(m)) return 'ola';
  if (/obrigad|valeu|brigad|agradec/.test(m)) return 'obrigado';
  if (/(^ajuda|^help|o que pode|o que sab|funcionalidade|comandos|o que voce)/.test(m)) return 'ajuda';
  if (/(estatistic|resumo|dashboard|panorama|geral|visao geral|numeros|numeros|indicador)/.test(m)) return 'estatisticas';

  if (/(quantos.*usuario|lista.*usuario|usuarios?$|todos.*usuario|ver.*usuario)/.test(m)) return 'usuarios';
  if (/(funcionario|empregado|colaborador|trabalhador)/.test(m) && /(lista|quantos|todos|ver|mostra)/.test(m)) return 'funcionarios_lista';
  if (/(cliente|cliente)/.test(m) && /(lista|quantos|todos|ver|mostra|registado)/.test(m)) return 'clientes_lista';

  if (/(facturac|fatura|faturado|quanto.*fatur|valor.*total|receita|renda|ganho|faturou)/.test(m)) return 'facturacao';
  if (/(pagamento|pago|receber|pendente.*pag|nao.*pago|por.*pagar)/.test(m)) return 'pagamentos_lista';
  if (/(servico.*pendente|pendente.*servico|servico.*aberto|em.*andamento)/.test(m)) return 'servicos_pendentes';
  if (/(servico.*hoje|hoje.*servico|agenda.*hoje|servico.*agora)/.test(m)) return 'servicos_hoje';

  if (/(mensagen|mensage|contacto|inbox|caixa.*entrada)/.test(m) && /(nao.*lid|nova|novo|pendente|nao.*respond)/.test(m)) return 'mensagens_nao_lidas';

  if (/(falta.*funcionario|falta.*nao.*justific|faltas?$|absentei|faltou)/.test(m)) return 'faltas';

  if (/(seguranca|segurança|protecao|proteção|invasao|hacker|vulnerabilidad|auditori)/.test(m)) return 'seguranca';

  if (/(configuracao|configuração|ajuda.*config|como.*config)/.test(m)) return 'ajuda_config';
  if (/(relatorio|relatório|relatorios|relatórios|grafico|grafico|chart)/.test(m)) return 'relatorios';

  return null;
}

async function processarMensagem(mensagem, usuario) {
  const temApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10;

  if (temApiKey) {
    try {
      return await processarComOpenAI(mensagem, usuario);
    } catch (error) {
      console.error('Erro no OpenAI, a usar fallback local:', error.message);
    }
  }

  return processarLocal(mensagem, usuario);
}

async function processarLocal(mensagem, usuario) {
  try {
    const ctx = await obterContextoDoSistema();
    const intencao = detectarIntencao(mensagem);

    if (!intencao) {
      return {
        sucesso: true,
        resposta: `Nao percebi a sua pergunta. Tente perguntar sobre:\n\n` +
          `📊 **Estatisticas** — "mostra estatisticas"\n` +
          `👥 **Usuarios** — "lista de usuarios"\n` +
          `💰 **Facturacao** — "quanto faturamos?"\n` +
          `📋 **Servicos** — "servicos pendentes"\n` +
          `🔒 **Seguranca** — "seguranca do sistema"\n` +
          `📬 **Mensagens** — "mensagens nao lidas"\n\n` +
          `Digite "ajuda" para ver todas as opcoes.`
      };
    }

    const handler = respostas[intencao];
    if (!handler) {
      return { sucesso: true, resposta: 'Nao percebi. Digite "ajuda" para ver o que posso fazer.' };
    }

    const resposta = await handler(ctx);
    return { sucesso: true, resposta };
  } catch (error) {
    console.error('Erro no agente local:', error);
    return { sucesso: true, resposta: 'Ocorreu um erro ao processar. Tente novamente.' };
  }
}

async function processarComOpenAI(mensagem, usuario) {
  const { ChatOpenAI } = await import('@langchain/openai');
  const { PromptTemplate } = await import('@langchain/core/prompts');
  const { StringOutputParser } = await import('@langchain/core/output_parsers');
  const { RunnableSequence } = await import('@langchain/core/runnables');

  const ctx = await obterContextoDoSistema();

  const systemPrompt = `Voce e o assistente AI do Sistema "Teto Falso Sabao" (Montagem de Tecto Falso).
Responde em Portugues de Mocambique (pt-MZ).
Dados atuais: ${ctx.totalUsuarios} usuarios, ${ctx.totalServicos} servicos, ${formatarValor(ctx.valorTotalFaturado)} faturado.
Nao revele passwords ou tokens. Seja conciso (max 300 palavras).`;

  const prompt = PromptTemplate.fromTemplate(`{system}\n\nMensagem: {mensagem}\n\nResposta:`);
  const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const chain = RunnableSequence.from([prompt, model, new StringOutputParser()]);
  const resposta = await chain.invoke({ system: systemPrompt, mensagem });

  return { sucesso: true, resposta };
}

module.exports = { processarMensagem, obterContextoDoSistema };

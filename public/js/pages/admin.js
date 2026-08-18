import { render, api, showError, showSuccess, formatCurrency, formatDate } from '../app.js';
import { gerarReciboPDF } from '../utils/pdfGenerator.js';
import { uploadFileToBlob, isDirectUploadAvailable } from '../utils/blobUploader.js';
import { createProgressBar } from '../utils/uploadProgress.js';

export default async function adminPage() {
    let usuarios = [];
    let precos = [];
    let configuracoes = {};
    let estatisticas = {};
    let mensagens = [];
    let faltas = [];
    let clientesLista = [];
    let clientesSatisfeitos = [];
    let portfolioItems = [];
    let pagamentos = [];
    let servicos = [];
    let pedidosPortfolio = [];
    let historicoLogs = [];
    let historicoAcoes = [];
    let paginaHistorico = 1;
    let historicoTotalPaginas = 1;

    try {
        const [resU, resP, resC, resE, resM, resF, resCL, resPG, resS, resCS, resPF, resPedidos] = await Promise.all([
            api.get('/usuarios'),
            api.get('/precos'),
            api.get('/configuracoes'),
            api.get('/relatorios/estatisticas'),
            api.get('/contact'),
            api.get('/faltas'),
            api.get('/clientes/lista'),
            api.get('/pagamentos'),
            api.get('/servicos'),
            api.get('/clientes'),
            api.get('/portfolio'),
            api.get('/pedidos-portfolio')
        ]);
        usuarios = resU.usuarios || [];
        precos = resP.precos || [];
        configuracoes = resC.configuracoes || {};
        estatisticas = resE.estatisticas || {};
        mensagens = resM.messages || [];
        faltas = resF.faltas || [];
        clientesLista = resCL.clientes || [];
        pagamentos = resPG.pagamentos || [];
        servicos = resS.servicos || [];
        clientesSatisfeitos = resCS.clientes || [];
        portfolioItems = resPF.portfolio || [];
        pedidosPortfolio = resPedidos.pedidos || [];
    } catch (error) {
        console.error('Error loading admin data:', error);
    }

    function getFatorDesconto(tipo) {
        if (tipo === 'meio_dia') return 0.5;
        if (tipo === 'atrazo') return 0.25;
        return 1;
    }

    function getLabelTipoFalta(tipo) {
        if (tipo === 'meio_dia') return '½ Dia';
        if (tipo === 'atrazo') return 'Atrazo';
        return 'Dia Inteiro';
    }

    const categoriasPrecos = [...new Set(precos.map(p => p.categoria))];
    const mensagensNaoLidas = mensagens.filter(m => !m.lido).length;
    const funcionarios = usuarios.filter(u => u.role === 'funcionario');
    const hojeData = new Date();
    const mesAtual = hojeData.getMonth();
    const anoAtual = hojeData.getFullYear();
    const hoje = new Date().toISOString().split('T')[0];

    render(`
    <div class="container admin-panel">
        <!-- Admin Hero -->
        <div class="admin-hero">
            <div class="admin-hero-glow admin-hero-glow-1"></div>
            <div class="admin-hero-glow admin-hero-glow-2"></div>
            <div class="admin-hero-inner">
                <div>
                    <div class="admin-hero-eyebrow">🎛️ Sistema de Gestão</div>
                    <h1 class="admin-hero-title">Painel Admin</h1>
                    <p class="admin-hero-sub">Gestão completa do sistema — utilizadores, funcionários, finanças e muito mais</p>
                </div>
                <div class="admin-hero-actions">
                    <button class="admin-hero-btn" onclick="abrirPesquisaGeral()" title="Pesquisa Geral">🔍 <span>Pesquisar</span></button>
                    <button class="admin-hero-btn" onclick="abrirListaClientes()" title="Lista de Clientes">👥 <span>Clientes</span></button>
                    <button class="admin-hero-btn" onclick="abrirListaPagamentos()" title="Lista de Pagamentos">💳 <span>Pagamentos</span></button>
                    <button class="admin-hero-btn" onclick="abrirListaPedidos()" title="Lista de Pedidos">📨 <span>Pedidos</span></button>
                    <button class="admin-hero-btn" onclick="abrirSistemaRelatoriosAdmin()" title="Sistema de Relatórios">📈 <span>Relatórios</span></button>
                    <button class="admin-hero-btn admin-hero-btn-ai" onclick="abrirAgenteIntel()" title="Agente Inteligente">🤖 <span>Agente</span></button>
                    <span class="badge badge-primary admin-hero-badge">Admin</span>
                </div>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="admin-stat-grid">
            <div class="admin-stat-card">
                <div class="admin-stat-icon admin-stat-icon--purple">👥</div>
                <div style="flex: 1; min-width: 0;">
                    <h3 class="admin-stat-value" title="${usuarios.length}">${usuarios.length}</h3>
                    <p class="admin-stat-label">Utilizadores</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-icon admin-stat-icon--blue">📋</div>
                <div style="flex: 1; min-width: 0;">
                    <h3 class="admin-stat-value" title="${estatisticas.total_servicos || 0}">${estatisticas.total_servicos || 0}</h3>
                    <p class="admin-stat-label">Serviços</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-icon admin-stat-icon--teal">💰</div>
                <div style="flex: 1; min-width: 0;">
                    <h3 class="admin-stat-value" style="font-size: clamp(1.1rem, 2vw, 1.45rem); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${formatCurrency(estatisticas.valor_total_faturado || 0)}">${formatCurrency(estatisticas.valor_total_faturado || 0)}</h3>
                    <p class="admin-stat-label">Facturado</p>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="admin-stat-icon admin-stat-icon--gold">📬</div>
                <div style="flex: 1; min-width: 0;">
                    <h3 class="admin-stat-value" title="${mensagens.length}">${mensagens.length}</h3>
                    <p class="admin-stat-label">${mensagensNaoLidas > 0 ? `<span style="color: #ef4444; font-weight: 700;">${mensagensNaoLidas} não lida(s)</span>` : 'Mensagens'}</p>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs" id="adminTabs" style="flex-wrap: wrap;">
            <button class="tab active" data-admin-tab="usuarios">👥 Utilizadores</button>
            <button class="tab" data-admin-tab="funcionarios">👷 Funcionários</button>
            <button class="tab" data-admin-tab="clientes">✅ Clientes</button>
            <button class="tab" data-admin-tab="pagamentos">💳 Pagamentos</button>
            <button class="tab" data-admin-tab="mensagens">📬 Mensagens ${mensagensNaoLidas > 0 ? `<span class="badge badge-danger" style="margin-left: 0.25rem; font-size: 0.7rem; padding: 0.1rem 0.5rem;">${mensagensNaoLidas}</span>` : ''}</button>
            <button class="tab" data-admin-tab="precos">💰 Preços</button>
            <button class="tab" data-admin-tab="portfolio">📸 Portfólio</button>
            <button class="tab" data-admin-tab="pedidos">
                📨 Pedidos ${pedidosPortfolio.filter(p => p.status === 'pendente').length > 0 ? `<span class="badge badge-danger" style="margin-left: 0.25rem; font-size: 0.7rem; padding: 0.1rem 0.5rem;">${pedidosPortfolio.filter(p => p.status === 'pendente').length}</span>` : ''}
            </button>
            <button class="tab" data-admin-tab="config">⚙️ Configurações</button>
            <button class="tab" data-admin-tab="ai">🤖 Agente IA</button>
            <button class="tab" data-admin-tab="historico">📜 Histórico</button>
        </div>

        <!-- TAB: Users -->
        <div class="tab-content-admin active" id="tab-usuarios">
            <div class="section-card">
                <div class="section-card-header">
                    <h2 class="section-card-title">➕ Novo Utilizador</h2>
                </div>
                <form id="formCreateUser">
                    <div class="grid" style="grid-template-columns: 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Nome</label>
                            <input type="text" class="form-input" id="newUserNome" placeholder="Nome completo" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="newUserEmail" placeholder="email@exemplo.com" required maxlength="54">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Senha</label>
                            <input type="password" class="form-input" id="newUserSenha" placeholder="Mínimo 4 caracteres" required minlength="4" maxlength="12">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone</label>
                            <input type="tel" class="form-input" id="newUserTelefone" placeholder="84 123 4567" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo</label>
                            <select class="form-select" id="newUserRole" required>
                                <option value="funcionario">Funcionário</option>
                                <option value="admin">Administrador</option>
                                <option value="cliente">Cliente</option>
                            </select>
                        </div>
                        <div class="form-group" style="display: flex; align-items: flex-end;">
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Criar Utilizador</button>
                        </div>
                    </div>
                </form>
            </div>

            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">📋 Utilizadores <span class="table-toolbar-count">${usuarios.length} registos</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadosUsuarios" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionados (<span id="countSelecionadosUsuarios">0</span>)</button>
                        <input type="text" id="searchUsuarios" class="table-toolbar-search" placeholder="🔍 Pesquisar por nome...">
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table" id="tableUsuarios">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;"><input type="checkbox" id="selectAllUsuarios" style="width: 18px; height: 18px; cursor: pointer;"></th>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Data</th>
                                <th class="cell-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${usuarios.length > 0 ? usuarios.map(u => `
                                <tr>
                                    <td style="text-align: center;"><input type="checkbox" class="checkbox-selecionar checkbox-usuario" data-id="${u.id}" style="width: 18px; height: 18px; cursor: pointer;"></td>
                                    <td class="cell-name">${u.nome}</td>
                                    <td class="cell-email">${u.email}</td>
                                    <td>
                                        <span class="badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'funcionario' ? 'badge-warning' : 'badge-success'}">
                                            ${u.role === 'admin' ? 'Admin' : u.role === 'funcionario' ? 'Funcionário' : 'Cliente'}
                                        </span>
                                    </td>
                                    <td style="font-size: 0.85rem; color: var(--gray);">${new Date(u.created_at).toLocaleDateString('pt-MZ')}</td>
                                    <td class="cell-center">
                                        <div class="table-actions" style="justify-content: center;">
                                            <select class="form-select role-select" data-user-id="${u.id}" style="width: auto; display: inline-block; padding: 0.3rem 0.5rem; font-size: 0.78rem;">
                                                <option value="cliente" ${u.role === 'cliente' ? 'selected' : ''}>Cliente</option>
                                                <option value="funcionario" ${u.role === 'funcionario' ? 'selected' : ''}>Funcionário</option>
                                                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                                            </select>
                                            <button class="btn-delete-user btn-sm" data-user-id="${u.id}" style="background: #ef4444; color: white; border: none;">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum utilizador encontrado</div></div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB: Funcionários -->
        <div class="tab-content-admin" id="tab-funcionarios" style="display: none;">
            <!-- Cadastrar Funcionário -->
            <div class="section-card func-cadastro-card">
                <div class="func-cadastro-topbar"></div>
                <div class="func-cadastro-header">
                    <div class="func-cadastro-header-icon">👷</div>
                    <div>
                        <h2 class="section-card-title">Cadastrar Novo Funcionário</h2>
                        <p class="func-cadastro-sub">Preencha os dados abaixo para criar a conta de acesso do funcionário</p>
                    </div>
                </div>
                <div class="func-cadastro-body">
                    <form id="formCreateFuncionario">
                        <div class="func-cadastro-grid" style="grid-template-columns: 1fr;">
                            <div class="func-field">
                                <label class="form-label">📷 Foto</label>
                                <div class="func-photo-upload">
                                    <div class="func-photo-preview" id="funcFotoPreview">👷</div>
                                    <div>
                                        <label class="func-photo-btn" for="newFuncFoto">📷 Escolher foto</label>
                                        <p class="func-photo-hint">JPG, PNG ou GIF</p>
                                    </div>
                                    <input type="file" class="form-input func-photo-input" id="newFuncFoto" accept="image/*">
                                </div>
                            </div>
                            <div class="func-field">
                                <label class="form-label">👤 Nome Completo</label>
                                <input type="text" class="form-input" id="newFuncNome" placeholder="Nome completo" required>
                            </div>
                            <div class="func-field">
                                <label class="form-label">📧 Email</label>
                                <input type="email" class="form-input" id="newFuncEmail" placeholder="email@exemplo.com" required maxlength="54">
                            </div>
                            <div class="func-field">
                                <label class="form-label">🔒 Senha</label>
                                <input type="password" class="form-input" id="newFuncSenha" placeholder="Mínimo 4 caracteres" required minlength="4" maxlength="12">
                            </div>
                            <div class="func-field">
                                <label class="form-label">📱 Telefone</label>
                                <input type="tel" class="form-input" id="newFuncTelefone" placeholder="84 123 4567" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
                            </div>
                            <div class="func-field">
                                <label class="form-label">💰 Salário (MZN)</label>
                                <input type="number" class="form-input" id="newFuncSalario" placeholder="0" step="0.01">
                            </div>
                            <div class="func-field">
                                <label class="form-label">📍 Endereço</label>
                                <input type="text" class="form-input" id="newFuncEndereco" placeholder="Endereço completo">
                            </div>
                            <div class="func-field">
                                <label class="form-label">🏦 Banco</label>
                                <select class="form-select" id="newFuncBanco">
                                    <option value="">Selecionar banco...</option>
                                    <option value="BIM">BIM</option>
                                    <option value="BCI">BCI</option>
                                    <option value="Standard Bank">Standard Bank</option>
                                </select>
                            </div>
                            <div class="func-field">
                                <label class="form-label">🔢 Nº Conta Bancária</label>
                                <input type="text" class="form-input" id="newFuncConta" placeholder="Número de conta">
                            </div>
                            <div class="func-field">
                                <label class="form-label">📲 Carteira Móvel</label>
                                <select class="form-select" id="newFuncTipoConta">
                                    <option value="">Selecionar...</option>
                                    <option value="mpesa">M-Pesa</option>
                                    <option value="emola">E-Mola</option>
                                    <option value="emick">E-Micks</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" class="func-submit-btn">➕ Cadastrar Funcionário</button>
                    </form>
                </div>
            </div>

            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">👷 Funcionários <span class="table-toolbar-count">${funcionarios.length} registos</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnEditarListaFuncionarios" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; white-space: nowrap; background: #8b5cf6;">✏️ Editar Lista</button>
                        <button id="btnListaFuncionarios" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; white-space: nowrap;">📋 Lista Funcionários</button>
                        <input type="text" id="searchFuncionarios" class="table-toolbar-search" placeholder="🔍 Pesquisar por nome...">
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th class="cell-center">Salário (MZN)</th>
                                <th>Endereço</th>
                                <th>Conta</th>
                                <th class="cell-center">Faltas</th>
                                <th class="cell-center">Responder</th>
                                <th class="cell-center">Acção</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${funcionarios.length > 0 ? funcionarios.map(f => {
        const faltasFunc = faltas.filter(fa => fa.usuario_id === f.id);
        const bancoLabel = f.banco ? f.banco : (f.tipo_conta ? ({ mpesa: 'M-Pesa', emola: 'E-Mola', emick: 'E-Micks' }[f.tipo_conta] || f.tipo_conta) : '');
        const contaLabel = bancoLabel ? `${bancoLabel}${f.numero_conta ? ' · ' + f.numero_conta : ''}` : '';
        return `
                                <tr>
                                    <td style="display: flex; align-items: center; gap: 0.75rem;">
                                        ${f.foto ? `<img src="${f.foto}" alt="${f.nome}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">` : `<div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0;">👷</div>`}
                                        <span class="cell-name">${f.nome}</span>
                                    </td>
                                    <td class="cell-email">${f.email}</td>
                                    <td class="cell-center">
                                        <input type="number" class="editable-input editable-input-sm input-salario" data-func-id="${f.id}" value="${f.salario || 0}" step="0.01">
                                    </td>
                                    <td><input type="text" class="editable-input editable-input-lg input-endereco" data-func-id="${f.id}" value="${f.endereco || ''}"></td>
                                    <td style="font-size: 0.82rem; color: var(--dark-700); max-width: 160px;">
                                        ${contaLabel || '<span style="color: var(--gray-light);">—</span>'}
                                    </td>
                                    <td class="cell-center">
                                        ${(() => {
                const pendentes = faltasFunc.filter(f => !f.justificada);
                const totalDesconto = pendentes.reduce((sum, fa) => {
                    const valorDia = (f.salario || 0) / 22;
                    return sum + valorDia * getFatorDesconto(fa.tipo_falta);
                }, 0);
                return `
                                        <span style="font-weight: 700; font-size: 1.1rem; color: ${pendentes.length > 0 ? '#ef4444' : '#10b981'};">
                                            ${pendentes.length}
                                        </span>
                                        ${totalDesconto > 0 ? `<br><span style="font-size: 0.7rem; color: #ef4444; font-weight: 600;">-${formatCurrency(totalDesconto)}</span>` : ''}
                                        ${pendentes.length > 0 ? `
                                        <button class="btn-ver-faltas btn-sm" data-func-id="${f.id}" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 0.78rem; text-decoration: underline; margin-left: 0.25rem;">ver</button>` : ''}
                                        `;
            })()}
                                    </td>
                                    <td class="cell-center">
                                        <input type="checkbox" class="toggle-responder" data-func-id="${f.id}" ${f.pode_responder_mensagens ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                                    </td>
                                    <td class="cell-center">
                                        <div class="table-actions" style="justify-content: center;">
                                            <button class="btn-editar-func btn-sm" data-func-id="${f.id}" data-func-nome="${f.nome}" data-func-email="${f.email}" data-func-telefone="${f.telefone || ''}" data-func-salario="${f.salario || 0}" data-func-endereco="${f.endereco || ''}" data-func-conta="${f.numero_conta || ''}" data-func-banco="${f.banco || ''}" data-func-tipo="${f.tipo_conta || ''}" data-func-foto="${f.foto || ''}" style="background: #3b82f6; color: white; border: none;" title="Editar">✏️</button>
                                            <button class="btn-guardar-func btn-sm" data-func-id="${f.id}" style="background: var(--primary); color: white; border: none;" title="Guardar">💾</button>
                                            <button class="btn-calendario-faltas btn-sm" data-func-id="${f.id}" data-func-nome="${f.nome}" style="background: #8b5cf6; color: white; border: none;" title="Calendário de Faltas">📅</button>
                                            <button class="btn-folha-salario btn-sm" data-func-id="${f.id}" data-func-nome="${f.nome}" style="background: #10b981; color: white; border: none;" title="Folha de Salário">📄</button>
                                        </div>
                                    </td>
                                </tr>
                                `;
    }).join('') : `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">👷</div><div class="empty-state-text">Nenhum funcionário encontrado</div></div></td></tr>`}
                        </tbody>
                    </table>
                </div>
                ${funcionarios.length > 0 ? `
                <div style="margin-top: 1rem; padding: 1rem; background: #fef2f2; border-radius: var(--radius-lg); border: 1px solid #fecaca;">
                    <h4 style="font-size: 0.9rem; font-weight: 700; color: #ef4444; margin-bottom: 0.5rem;">📊 Resumo de Descontos (Mês Atual)</h4>
                    ${funcionarios.map(f => {
        const faltasFunc = faltas.filter(fa => fa.usuario_id === f.id && !fa.justificada);
        const totalDesconto = faltasFunc.reduce((sum, fa) => {
            const valorDia = (f.salario || 0) / 22;
            return sum + valorDia * getFatorDesconto(fa.tipo_falta);
        }, 0);
        if (totalDesconto <= 0) return '';
        const diasInteiros = faltasFunc.filter(fa => fa.tipo_falta === 'dia_inteiro' || !fa.tipo_falta).length;
        const meiosDias = faltasFunc.filter(fa => fa.tipo_falta === 'meio_dia').length;
        const atrazos = faltasFunc.filter(fa => fa.tipo_falta === 'atrazo').length;
        return `<div style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 0.2rem 0;">
                            <span>${f.nome} (${diasInteiros}d + ${meiosDias}½ + ${atrazos}A)</span>
                            <span style="font-weight: 700; color: #ef4444;">-${formatCurrency(totalDesconto)}</span>
                        </div>`;
    }).join('')}
                </div>` : ''}
            </div>
        </div>

        <!-- TAB: Clientes -->
        <div class="tab-content-admin" id="tab-clientes" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">✅ Clientes <span class="table-toolbar-count">${clientesLista.length} registos</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadosClientes" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionados (<span id="countSelecionadosClientes">0</span>)</button>
                        <input type="text" id="searchClientes" class="table-toolbar-search" placeholder="🔍 Pesquisar por nome...">
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table" id="tableClientes">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;"><input type="checkbox" id="selectAllClientes" style="width: 18px; height: 18px; cursor: pointer;"></th>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th class="cell-center">Verificado</th>
                                <th class="cell-center">Último Login</th>
                                <th class="cell-center">Acção</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesLista.length > 0 ? clientesLista.map(c => `
                                <tr>
                                    <td style="text-align: center;"><input type="checkbox" class="checkbox-selecionar checkbox-cliente" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer;"></td>
                                    <td class="cell-name">${c.nome}</td>
                                    <td class="cell-email">${c.email || '-'}</td>
                                    <td class="cell-email">${c.telefone || '-'}</td>
                                    <td class="cell-center" style="font-size: 1.25rem;">
                                        ${c.verificado ? '🟢' : '🔴'}
                                    </td>
                                    <td class="cell-center" style="font-size: 0.85rem; white-space: nowrap;">
                                        ${c.ultimo_login ? new Date(c.ultimo_login).toLocaleDateString('pt-MZ') + ' ' + new Date(c.ultimo_login).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) : '<span style="color: #ef4444; font-weight: 600;">Nunca</span>'}
                                    </td>
                                    <td class="cell-center">
                                        ${!c.verificado ? `
                                        <button class="btn-verificar-cliente btn-sm" data-cliente-id="${c.id}" style="background: #10b981; color: white; border: none;">
                                            ✅ Verificar
                                        </button>` : '<span style="color: #10b981; font-weight: 600;">Verificado</span>'}
                                        <button class="btn-delete-cliente btn-sm" data-user-id="${c.id}" style="background: #ef4444; color: white; border: none; margin-left: 0.25rem;">🗑️</button>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">Nenhum cliente encontrado</div></div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Clientes Satisfeitos (tabela clientes) -->
            <div class="section-card" style="margin-top: 2rem;">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">⭐ Clientes Satisfeitos <span class="table-toolbar-count">${clientesSatisfeitos.length} registos</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadosSatisfeitos" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionados (<span id="countSelecionadosSatisfeitos">0</span>)</button>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table" id="tableClientesSatisfeitos">
                        <thead>
                            <tr>
                                <th style="width: 40px; text-align: center;"><input type="checkbox" id="selectAllSatisfeitos" style="width: 18px; height: 18px; cursor: pointer;"></th>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th class="cell-center">Acção</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clientesSatisfeitos.length > 0 ? clientesSatisfeitos.map(c => `
                                <tr>
                                    <td style="text-align: center;"><input type="checkbox" class="checkbox-selecionar checkbox-satisfeito" data-id="${c.id}" style="width: 18px; height: 18px; cursor: pointer;"></td>
                                    <td class="cell-name">${c.nome}</td>
                                    <td class="cell-email">${c.email || '-'}</td>
                                    <td class="cell-email">${c.telefone || '-'}</td>
                                    <td class="cell-center">
                                        <button class="btn-delete-cliente-satisfeito btn-sm" data-cliente-id="${c.id}" style="background: #ef4444; color: white; border: none;">🗑️</button>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-text">Nenhum cliente satisfeito registado</div></div></td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB: Pagamentos -->
        <div class="tab-content-admin" id="tab-pagamentos" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">💳 Pagamentos <span class="table-toolbar-count">${pagamentos.length} registos</span></h2>
                    </div>
                </div>
                <div class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th>Área</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th style="text-align: center;">Status</th>
                                <th style="text-align: center;">Acção</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pagamentos.length > 0 ? pagamentos.map(p => `
                                <tr>
                                    <td style="font-weight: 600;">${p.cliente_nome || 'N/A'}</td>
                                    <td style="font-size: 0.9rem;">${p.tipo_teto}</td>
                                    <td>${p.area} m²</td>
                                    <td style="font-weight: 700; color: var(--primary);">${formatCurrency(p.valor_total)}</td>
                                    <td style="font-size: 0.85rem;">${p.data_servico ? new Date(p.data_servico).toLocaleDateString('pt-MZ') : '-'}</td>
                                    <td style="text-align: center; font-size: 1.25rem;">
                                        ${p.pago ? '🟢' : '🔴'}
                                    </td>
                                    <td style="text-align: center;">
                                        ${!p.pago ? `
                                        <button class="btn-marcar-pago" data-servico-id="${p.id}" style="background: #10b981; color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">
                                            Pagamento Recebido
                                        </button>` : '<span style="color: #10b981; font-weight: 600;">Pago</span>'}
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="7" style="text-align: center; color: var(--gray); padding: 2rem;">Nenhum pagamento encontrado.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB: Messages -->
        <div class="tab-content-admin" id="tab-mensagens" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">📬 Mensagens de Contacto <span class="table-toolbar-count">${mensagens.length} mensagens · ${mensagensNaoLidas} não lidas</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadasMsgs" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionadas (<span id="countSelecionadasMsgs">0</span>)</button>
                        <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                            <input type="checkbox" id="selectAllMsgs" style="width: 18px; height: 18px; cursor: pointer;"> Selecionar Todas
                        </label>
                    </div>
                </div>
                ${mensagens.length > 0 ? mensagens.map(m => `
                    <div style="border: 1px solid var(--light); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1rem; ${!m.lido ? 'border-left: 4px solid var(--primary); background: rgba(99,102,241,0.03);' : ''}" class="msg-card" data-msg-id="${m.id}">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <input type="checkbox" class="checkbox-selecionar checkbox-msg" data-id="${m.id}" style="width: 18px; height: 18px; cursor: pointer;">
                                <div>
                                    <strong style="font-size: 1.05rem;">${m.nome}</strong>
                                    <span style="color: var(--gray); font-size: 0.85rem; margin-left: 0.75rem;">${m.email}</span>
                                    <span style="color: var(--gray); font-size: 0.85rem; margin-left: 0.75rem;">${m.telefone}</span>
                                </div>
                            </div>
                            <div class="table-actions">
                                <span class="badge ${m.assunto === 'Orçamento' ? 'badge-primary' : m.assunto === 'Reclamação' ? 'badge-danger' : m.assunto === 'Dúvida' ? 'badge-warning' : 'badge-success'}">${m.assunto}</span>
                                ${!m.lido ? '<span class="badge badge-danger" style="font-size: 0.7rem;">NOVA</span>' : ''}
                                ${m.respondida ? '<span class="badge" style="font-size: 0.7rem; background: #10b981;">RESPONDIDA</span>' : ''}
                            </div>
                        </div>
                        <p style="color: var(--dark-700); margin-bottom: 0.75rem; line-height: 1.6; white-space: pre-wrap;">${m.mensagem}</p>
                        ${m.respondida && m.resposta ? `
                        <div class="section-card" style="background: #f0fdf4; border: 1px solid #bbf7d0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span class="badge" style="background: #10b981; font-size: 0.8rem;">RESPOSTA</span>
                                <span style="font-size: 0.75rem; color: var(--gray);">${new Date(m.updated_at || m.created_at).toLocaleString('pt-MZ')}</span>
                            </div>
                            <p style="color: var(--dark-700); line-height: 1.6; white-space: pre-wrap; margin: 0;">${m.resposta}</p>
                            ${m.resposta_anexo ? `
                            <div style="margin-top: 0.75rem;">
                                <a href="${m.resposta_anexo}" target="_blank" style="display: inline-flex; align-items: center; gap: 0.4rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.5rem 1rem; color: var(--dark-700); text-decoration: none; font-size: 0.85rem; font-weight: 600;">
                                    📄 Ver Recibo Anexado
                                </a>
                            </div>` : ''}
                            ${m.resposta_orcamento_id ? (() => {
                const orcSel = servicos.find(s => s.id === m.resposta_orcamento_id); return orcSel ? `
                            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #bbf7d0;">
                                <span style="font-size: 0.75rem; color: var(--gray);">📎 Orçamento anexado:</span>
                                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.25rem;">
                                    <span style="font-weight: 600; font-size: 0.9rem;">#${orcSel.id} - ${orcSel.cliente_nome || 'N/A'} (${formatCurrency(orcSel.valor_total)})</span>
                                    <button class="btn-ver-recibo-anexado" data-orc-id="${orcSel.id}" style="background: var(--primary); color: white; padding: 0.25rem 0.6rem; border-radius: var(--radius-md); font-size: 0.75rem; border: none; cursor: pointer;">📄 Ver Recibo</button>
                                </div>
                            </div>` : ''
            })() : ''}
                        </div>` : ''}
                        <div class="table-actions" style="justify-content: space-between; margin-top: 0.75rem;">
                            <span style="font-size: 0.8rem; color: var(--gray);">${new Date(m.created_at).toLocaleString('pt-MZ')}</span>
                            <div style="display: flex; gap: 0.5rem;">
                                ${!m.lido ? `<button class="btn-marcar-lida" data-msg-id="${m.id}" style="background: var(--primary); color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Marcar como Lida</button>` : ''}
                                ${!m.respondida ? `<button class="btn-responder-msg" data-msg-id="${m.id}" data-msg-nome="${m.nome}" style="background: #10b981; color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Responder</button>` : ''}
                                <button class="btn-deletar-msg" data-msg-id="${m.id}" style="background: #ef4444; color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Excluir</button>
                            </div>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state">Nenhuma mensagem recebida.</div>'}
            </div>
        </div>

        <!-- TAB: Prices -->
        <div class="tab-content-admin" id="tab-precos" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">💰 Preços dos Materiais</h2>
                    </div>
                    <div class="table-toolbar-search" style="display: flex; gap: 0.5rem;">
                        <button id="btnVerTudoPrecos" class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;">📋 Ver Tudo</button>
                        <button id="btnImprimirPrecos" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">🖨️ Imprimir PDF</button>
                    </div>
                </div>
                <div id="precosPorCategoria">
                    ${categoriasPrecos.map(cat => `
                        <div class="section-card" style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); border-bottom: 2px solid var(--light); padding-bottom: 0.5rem;">
                                ${cat === 'gesso' ? 'Gesso' : cat === 'pvc' ? 'PVC' : cat === 'modular' ? 'Modular' : 'Serviços'}
                            </h3>
                            <div class="table-wrap">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Unidade</th>
                                            <th>Preço (MZN)</th>
                                            <th class="cell-center">Actualizar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${precos.filter(p => p.categoria === cat).map(p => `
                                            <tr>
                                                <td class="cell-name">${p.item}</td>
                                                <td>${p.unidade}</td>
                                                <td>
                                                    <input type="number" class="editable-input preco-input" data-preco-id="${p.id}" value="${p.preco}" style="width: 120px;">
                                                </td>
                                                <td class="cell-center">
                                                    <button class="btn-atualizar-preco" data-preco-id="${p.id}" style="background: var(--primary); color: white; padding: 0.4rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; border: none; cursor: pointer;">
                                                        Actualizar
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div id="precosTudo" style="display: none;">
                    <div class="section-card">
                        <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary); border-bottom: 2px solid var(--light); padding-bottom: 0.5rem;">📋 Lista Completa de Preços</h3>
                        <div class="table-wrap">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Categoria</th>
                                        <th>Item</th>
                                        <th>Unidade</th>
                                        <th>Preço (MZN)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${precos.map(p => `
                                        <tr>
                                            <td><span class="badge badge-primary">${p.categoria}</span></td>
                                            <td class="cell-name">${p.item}</td>
                                            <td>${p.unidade}</td>
                                            <td class="cell-name">${formatCurrency(p.preco)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="table-actions" style="justify-content: center; margin-top: 1rem;">
                            <button id="btnVoltarCategoria" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">← Voltar à Vista por Categoria</button>
                        </div>
                    </div>
                </div>
                ${precos.length === 0 ? '<div class="empty-state">Nenhum preço encontrado.</div>' : ''}
            </div>
        </div>

        <!-- TAB: Portfolio -->
        <div class="tab-content-admin" id="tab-portfolio" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">📸 Portfólio <span class="table-toolbar-count">${portfolioItems.length} projectos</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadosPortfolio" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionados (<span id="countSelecionadosPortfolio">0</span>)</button>
                        <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                            <input type="checkbox" id="selectAllPortfolio" style="width: 18px; height: 18px; cursor: pointer;"> Selecionar Todos
                        </label>
                    </div>
                </div>
                <div id="portfolioAdminGrid" class="grid grid-3">
                    ${portfolioItems.length > 0 ? portfolioItems.map(item => `
                        <div class="card" style="position: relative;">
                            <div style="position: absolute; top: 0.5rem; left: 0.5rem; z-index: 2;">
                                <input type="checkbox" class="checkbox-selecionar checkbox-portfolio" data-id="${item.id}" style="width: 20px; height: 20px; cursor: pointer; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                            </div>
                            ${item.imagem_url ? `
                                <img src="${item.imagem_url}" alt="${item.titulo}" style="width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 0.75rem;">
                            ` : item.video_url ? `
                                <video src="${item.video_url}" controls preload="metadata" playsinline style="width: 100%; height: 180px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 0.75rem; background: #000;"></video>
                            ` : `
                                <div style="width: 100%; height: 180px; background: var(--gradient-primary); border-radius: var(--radius-lg); margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: white;">🏗️</div>
                            `}
                            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.25rem;">${item.titulo}</h4>
                            <p style="font-size: 0.82rem; color: var(--gray); margin-bottom: 0.5rem;">${item.descricao || ''}</p>
                            <span class="badge badge-primary" style="font-size: 0.7rem;">${item.tipo_servico || 'Outros'}</span>
                            <div style="display: flex; gap: 0.4rem; margin-top: 0.75rem;">
                                <button class="btn-ver-portfolio-admin btn-sm" data-id="${item.id}" style="background: #3b82f6; color: white; border: none; flex: 1;">👁️ Ver</button>
                                <button class="btn-editar-portfolio-admin btn-sm" data-id="${item.id}" data-titulo="${item.titulo}" data-descricao="${item.descricao || ''}" data-tipo="${item.tipo_servico || ''}" data-imagem="${item.imagem_url || ''}" data-video="${item.video_url || ''}" style="background: #f59e0b; color: white; border: none; flex: 1;">✏️ Editar</button>
                                <button class="btn-deletar-portfolio-admin btn-sm" data-id="${item.id}" style="background: #ef4444; color: white; border: none; flex: 1;">🗑️</button>
                            </div>
                        </div>
                    `).join('') : `
                        <div class="card text-center" style="grid-column: 1 / -1; padding: 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 0.75rem;">📸</div>
                            <p style="color: var(--gray);">Nenhum projecto no portfólio</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Edit Portfolio Modal -->
            <div id="editarPortfolioModalAdmin" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="max-width: 600px;">
                    <span onclick="fecharEditarPortfolioAdmin()" class="modal-close">&times;</span>
                    <h2 class="section-card-title" style="color: var(--primary);">✏️ Editar Projecto</h2>
                    <form id="formEditarPortfolioAdmin">
                        <input type="hidden" id="editPortfolioId">
                        <div class="form-group">
                            <label class="form-label">Título</label>
                            <input type="text" class="form-input" id="editPortfolioTitulo" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-textarea" id="editPortfolioDescricao" rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo de Serviço</label>
                            <select class="form-select" id="editPortfolioTipo" required>
                                <option value="Gesso">Gesso</option>
                                <option value="PVC">PVC</option>
                                <option value="Modular">Modular</option>
                                <option value="Pintura">Pintura</option>
                                <option value="Elétrica">Elétrica</option>
                                <option value="Acabamentos">Acabamentos</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Imagem / Vídeo (deixe vazio para manter o actual)</label>
                            <input type="file" class="form-input" id="editPortfolioArquivo" accept="image/*,video/*">
                        </div>
                        <div id="editUploadProgressContainer"></div>
                        <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">Salvar Alterações</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- TAB: Pedidos de Portfólio -->
        <div class="tab-content-admin" id="tab-pedidos" style="display: none;">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">📨 Pedidos de Portfólio <span class="table-toolbar-count">${pedidosPortfolio.length} pedidos · ${pedidosPortfolio.filter(p => p.status === 'pendente').length} pendentes</span></h2>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button id="btnApagarSelecionadosPedidos" class="btn btn-sm" style="background: #ef4444; color: white; display: none; white-space: nowrap;">🗑️ Apagar Selecionados (<span id="countSelecionadosPedidos">0</span>)</button>
                        <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; cursor: pointer; white-space: nowrap;">
                            <input type="checkbox" id="selectAllPedidos" style="width: 18px; height: 18px; cursor: pointer;"> Selecionar Todos
                        </label>
                    </div>
                </div>
                ${pedidosPortfolio.length > 0 ? pedidosPortfolio.map(p => `
                    <div class="card pedido-card" style="margin-bottom: 1rem; border-left: 4px solid ${p.status === 'pendente' ? '#ef4444' : p.status === 'visto' ? '#f59e0b' : '#10b981'};" data-pedido-id="${p.id}">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <!-- Checkbox + Preview clicável -->
                            <div style="display: flex; align-items: flex-start; gap: 0.5rem; flex-shrink: 0;">
                                <input type="checkbox" class="checkbox-selecionar checkbox-pedido" data-id="${p.id}" style="width: 20px; height: 20px; cursor: pointer; margin-top: 0.25rem; flex-shrink: 0;">
                                <div class="pedido-preview" data-pedido-id="${p.id}" data-pedido-titulo="${(p.portfolio_titulo || '').replace(/"/g, '&quot;')}" data-pedido-imagem="${(p.portfolio_imagem || '').replace(/"/g, '&quot;')}" data-pedido-video="${(p.portfolio_video || '').replace(/"/g, '&quot;')}" style="width: 110px; height: 80px; border-radius: var(--radius-lg); overflow: hidden; flex-shrink: 0; background: var(--light); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; position: relative;" title="Clique para ver em tamanho real">
                                ${p.portfolio_imagem ? `<img src="${p.portfolio_imagem}" alt="preview" style="width: 100%; height: 100%; object-fit: cover;">` : p.portfolio_video ? `<video src="${p.portfolio_video}" style="width: 100%; height: 100%; object-fit: cover;" muted></video>` : '<span style="font-size: 2rem;">🏗️</span>'}
                                <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.6); color: white; font-size: 0.6rem; padding: 1px 4px; border-radius: 4px;">🔍</span>
                            </div>
                            </div>
                            <!-- Info -->
                            <div style="flex: 1; min-width: 200px;">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.4rem;">
                                    <strong style="font-size: 1rem;">${p.portfolio_titulo || 'Sem título'}</strong>
                                    <span class="badge" style="background: ${p.status === 'pendente' ? '#ef4444' : p.status === 'visto' ? '#f59e0b' : '#10b981'}; font-size: 0.7rem;">
                                        ${p.status === 'pendente' ? 'PENDENTE' : p.status === 'visto' ? 'VISTO' : 'ORÇAMENTO CRIADO'}
                                    </span>
                                </div>
                                ${p.portfolio_tipo ? `<span class="badge badge-primary" style="font-size: 0.7rem; margin-bottom: 0.4rem;">${p.portfolio_tipo}</span>` : ''}
                                <p style="font-size: 0.85rem; color: var(--gray); margin-bottom: 0.25rem;">👤 <strong>${p.usuario_nome || 'Cliente'}</strong> · ${p.usuario_email || ''}</p>
                                ${p.mensagem ? `<p style="font-size: 0.88rem; color: var(--dark-700); font-style: italic; margin-bottom: 0.25rem;">"${p.mensagem}"</p>` : ''}
                                <p style="font-size: 0.75rem; color: var(--gray); margin: 0;">${new Date(p.created_at).toLocaleString('pt-MZ')}</p>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--light);">
                            ${(p.portfolio_imagem || p.portfolio_video) ? `
                            <button class="btn-ver-projeto-pedido" data-titulo="${(p.portfolio_titulo || '').replace(/"/g, '&quot;')}" data-imagem="${(p.portfolio_imagem || '').replace(/"/g, '&quot;')}" data-video="${(p.portfolio_video || '').replace(/"/g, '&quot;')}" style="background: #8b5cf6; color: white; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; border: none; cursor: pointer;">
                                🔍 Ver Projeto
                            </button>` : ''}
                            ${p.status === 'pendente' ? `
                            <button class="btn-pedido-visto" data-id="${p.id}" style="background: #f59e0b; color: white; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; border: none; cursor: pointer;">
                                👁️ Marcar como Visto
                            </button>` : ''}
                            <button class="btn-criar-orcamento-pedido" 
                                data-id="${p.id}"
                                data-cliente-nome="${p.usuario_nome || ''}"
                                data-cliente-email="${p.usuario_email || ''}"
                                data-titulo="${p.portfolio_titulo || ''}"
                                data-tipo="${p.portfolio_tipo || ''}"
                                style="background: #2563eb; color: white; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; border: none; cursor: pointer;">
                                📋 Criar Orçamento
                            </button>
                            <button class="btn-eliminar-pedido" data-id="${p.id}" style="background: #ef4444; color: white; padding: 0.4rem 0.85rem; border-radius: var(--radius-md); font-size: 0.82rem; border: none; cursor: pointer;">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `).join('') : '<div class="empty-state"><div class="empty-state-icon">📨</div><div class="empty-state-text">Nenhum pedido de portfólio recebido ainda.</div></div>'}
            </div>
        </div>

        <!-- TAB: Config -->
        <div class="tab-content-admin" id="tab-config" style="display: none;">
            <div class="section-card">
                <div class="section-card-header">
                    <h2 class="section-card-title">⚙️ Configurações da Empresa</h2>
                </div>
                <form id="formConfig">
                    <div class="grid grid-2" style="gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Nome da Empresa</label>
                            <input type="text" class="form-input config-input" data-chave="empresa_nome" value="${configuracoes.empresa_nome || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone</label>
                            <input type="text" class="form-input config-input" data-chave="empresa_telefone" value="${configuracoes.empresa_telefone || ''}" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input config-input" data-chave="empresa_email" value="${configuracoes.empresa_email || ''}" maxlength="54">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Endereço</label>
                            <input type="text" class="form-input config-input" data-chave="empresa_endereco" value="${configuracoes.empresa_endereco || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Margem de Segurança (%)</label>
                            <input type="number" class="form-input config-input" data-chave="margem_seguranca" value="${configuracoes.margem_seguranca || '10'}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">📧 Email do Admin (Notificações)</label>
                            <input type="email" class="form-input config-input" data-chave="admin_email" value="${configuracoes.admin_email || ''}" placeholder="admin@tetofalso.com" maxlength="54">
                            <small style="color: var(--gray); font-size: 0.8rem;">Email que recebe notificações quando clientes enviam mensagens</small>
                        </div>
                    </div>
                    <div class="table-actions" style="margin-top: 1.5rem;">
                        <button type="submit" class="btn btn-primary" style="flex: 1;">
                            Salvar Configurações
                        </button>
                        <button type="button" id="btnSairAdmin" class="btn" style="background: #ef4444; color: white; padding: 0.875rem 2rem; border-radius: var(--radius-lg); font-weight: 600; flex-shrink: 0;">
                            Sair
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- TAB: Agente IA -->
        <div class="tab-content-admin" id="tab-ai" style="display: none;">
            <div class="card" style="max-width: 900px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <span style="font-size: 2rem;">🤖</span>
                    <div>
                        <h2 style="margin: 0; font-size: 1.25rem;">Agente Inteligente</h2>
                        <p style="margin: 0; color: var(--gray); font-size: 0.85rem;">Assistente AI para administração do sistema</p>
                    </div>
                    <span id="aiStatusIndicator" style="margin-left: auto; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; background: var(--light); color: var(--gray);">A aguardar...</span>
                </div>

                <div id="aiChatMessages" style="background: var(--light); border-radius: var(--radius-lg); padding: 1rem; height: 400px; overflow-y: auto; margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                        <span style="font-size: 1.5rem; flex-shrink: 0;">🤖</span>
                        <div style="background: white; padding: 0.75rem 1rem; border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 85%;">
                            <p style="margin: 0; font-size: 0.9rem;">
                                Olá <strong>${JSON.parse(localStorage.getItem('teto_falso_user') || '{}').nome || 'Admin'}</strong>! 👋<br><br>
                            Sou o assistente do sistema. Funciona sem Internet! 🚀<br><br>
                            Pode fazer-me perguntas sobre:<br>
                            • 📊 <strong>Estatisticas</strong> do sistema<br>
                            • 👥 <strong>Usuarios</strong> e permissoes<br>
                            • 💰 <strong>Facturacao</strong> e servicos<br>
                            • 🔒 <strong>Seguranca</strong> do sistema<br>
                            • ⚙️ <strong>Configuracoes</strong> e boas praticas
                            </p>
                        </div>
                    </div>
                </div>

                <form id="aiChatForm" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <input type="text" id="aiChatInput" class="form-input" placeholder="Digite a sua pergunta..." style="flex: 1;" required autocomplete="off">
                    <button type="submit" class="btn btn-primary" id="aiSendBtn" style="white-space: nowrap;">
                        Enviar
                    </button>
                </form>
                <div style="display: flex; gap: 0.5rem;">
                    <button id="btnExportAIPdf" class="btn btn-sm btn-outline" style="flex: 1; font-size: 0.8rem;">
                        📄 Exportar PDF
                    </button>
                    <button id="btnExportAIExcel" class="btn btn-sm btn-outline" style="flex: 1; font-size: 0.8rem;">
                        📊 Exportar Excel
                    </button>
                    <button id="btnClearAIChat" class="btn btn-sm btn-outline" style="flex: 0; font-size: 0.8rem; color: #ef4444; border-color: #fecaca;">
                        🗑️
                    </button>
                </div>
            </div>
        </div>

        <!-- Aba: Histórico do Sistema -->
        <div class="tab-content-admin" id="tab-historico" style="display: none;">
            <div class="card" style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
                    <span style="font-size: 2rem;">📜</span>
                    <div>
                        <h2 style="margin: 0; font-size: 1.25rem;">Histórico do Sistema</h2>
                        <p style="margin: 0; color: var(--gray); font-size: 0.85rem;">Registo de auditoria de todas as acções no sistema</p>
                    </div>
                    <span id="historicoCount" style="margin-left: auto; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; background: var(--light); color: var(--gray);">0 registos</span>
                </div>

                <!-- Filtros -->
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;">
                    <input type="text" id="filtroBusca" class="form-input" placeholder="🔍 Buscar (ação, detalhes, utilizador, IP)..." style="flex: 1; min-width: 200px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                    <select id="filtroAcao" class="form-input" style="max-width: 220px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                        <option value="">Todas as ações</option>
                    </select>
                    <input type="date" id="filtroDataInicio" class="form-input" style="max-width: 160px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                    <input type="date" id="filtroDataFim" class="form-input" style="max-width: 160px; padding: 0.45rem 0.75rem; font-size: 0.85rem;">
                    <button class="btn btn-sm" style="background: var(--primary); color: white;" onclick="carregarHistorico(1)">🔍 Filtrar</button>
                    <button class="btn btn-sm btn-outline" onclick="limparFiltrosHistorico()">✖ Limpar</button>
                    <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="exportarHistoricoPDF()">📄 PDF</button>
                    <button class="btn btn-sm" style="background: #10b981; color: white;" onclick="exportarHistoricoExcel()">📊 Excel</button>
                </div>

                <!-- Tabela -->
                <div class="table-wrap">
                    <table class="table" id="tabelaHistorico">
                        <thead>
                            <tr>
                                <th style="width: 160px;">Data/Hora</th>
                                <th>Utilizador</th>
                                <th>Ação</th>
                                <th>Detalhes</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyHistorico">
                            <tr><td colspan="5" style="text-align: center; color: var(--gray); padding: 1.5rem;">Carregando histórico...</td></tr>
                        </tbody>
                    </table>
                </div>

                <!-- Paginação -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; color: var(--gray);" id="historicoInfoPagina">Página 1</span>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm btn-outline" id="btnHistoricoPrev" onclick="paginaAnterior()">← Anterior</button>
                        <button class="btn btn-sm btn-outline" id="btnHistoricoNext" onclick="paginaSeguinte()">Próxima →</button>
                    </div>
                    <button class="btn btn-sm" style="background: #ef4444; color: white; font-size: 0.8rem;" onclick="apagarHistorico()">🗑️ Apagar histórico</button>
                </div>
            </div>
        </div>
    </div>
    <div id="pesquisaGeralModal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 480px;">
        <span onclick="fecharPesquisaGeral()" class="modal-close">&times;</span>
        <h3 style="color: var(--primary); margin-bottom: 0.75rem;">🔍 Pesquisa Geral</h3>
        <input type="text" id="pesquisaGeralInput" class="form-input" placeholder="Pesquisar..." style="width: 100%; padding: 0.5rem 0.75rem; font-size: 0.85rem; margin-bottom: 0.75rem;">
        <div id="pesquisaGeralResultados" style="max-height: 300px; overflow-y: auto;">
          <p style="color: var(--gray); text-align: center; padding: 1.5rem; font-size: 0.85rem;">Digite para pesquisar...</p>
        </div>
      </div>
    </div>

    <!-- Lista de Clientes Modal -->
    <div id="listaClientesModal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 95%; max-height: 90vh; overflow-y: auto;">
        <span onclick="fecharListaClientes()" class="modal-close">&times;</span>
        <h2 class="section-card-title" style="color: #10b981; text-align: center;">👥 Lista de Clientes</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.85rem; color: var(--gray);" id="listaClientesCount">${clientesLista.length} registos</span>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="searchListaClientes" class="form-input" placeholder="🔍 Pesquisar..." style="max-width: 250px; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="exportarListaClientesPDF()">📄 PDF</button>
            <button class="btn btn-sm" style="background: #10b981; color: white;" onclick="exportarListaClientesExcel()">📊 Excel</button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table" id="tabelaListaClientes">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th class="cell-center">Verificado</th>
                <th class="cell-center">Último Login</th>
                <th>Registado em</th>
              </tr>
            </thead>
            <tbody>
              ${clientesLista.length > 0 ? clientesLista.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td class="cell-name">${c.nome}</td>
                  <td class="cell-email">${c.email || '-'}</td>
                  <td>${c.telefone || '-'}</td>
                  <td class="cell-center" style="font-size: 1.25rem;">${c.verificado ? '🟢' : '🔴'}</td>
                  <td class="cell-center" style="font-size: 0.85rem; white-space: nowrap;">
                    ${c.ultimo_login ? new Date(c.ultimo_login).toLocaleDateString('pt-MZ') + ' ' + new Date(c.ultimo_login).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) : '<span style="color: #ef4444; font-weight: 600;">Nunca</span>'}
                  </td>
                  <td style="font-size: 0.85rem; color: var(--gray);">${c.created_at ? new Date(c.created_at).toLocaleDateString('pt-MZ') : '-'}</td>
                </tr>
              `).join('') : '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhum cliente registado</div></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lista de Pagamentos Modal -->
    <div id="listaPagamentosModal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 95%; max-height: 90vh; overflow-y: auto;">
        <span onclick="fecharListaPagamentos()" class="modal-close">&times;</span>
        <h2 class="section-card-title" style="color: #f59e0b; text-align: center;">💳 Lista de Pagamentos</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.85rem; color: var(--gray);" id="listaPagamentosCount">${pagamentos.length} registos</span>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="searchListaPagamentos" class="form-input" placeholder="🔍 Pesquisar..." style="max-width: 250px; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="exportarListaPagamentosPDF()">📄 PDF</button>
            <button class="btn btn-sm" style="background: #10b981; color: white;" onclick="exportarListaPagamentosExcel()">📊 Excel</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${pagamentos.filter(p => p.pago).length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Pagos</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${pagamentos.filter(p => !p.pago).length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Por Pagar</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--primary);">${formatCurrency(pagamentos.reduce((sum, p) => sum + (p.pago ? (p.valor_total || 0) : 0), 0))}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Total Recebido</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.25rem; font-weight: 800; color: #ef4444;">${formatCurrency(pagamentos.reduce((sum, p) => sum + (!p.pago ? (p.valor_total || 0) : 0), 0))}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Total Pendente</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table" id="tabelaListaPagamentos">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Area</th>
                <th>Valor</th>
                <th>Data</th>
                <th class="cell-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${pagamentos.length > 0 ? pagamentos.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-weight: 600;">${p.cliente_nome || 'N/A'}</td>
                  <td>${p.tipo_teto || '-'}</td>
                  <td>${p.area ? p.area + ' m\u00B2' : '-'}</td>
                  <td style="font-weight: 700; color: var(--primary);">${formatCurrency(p.valor_total)}</td>
                  <td style="font-size: 0.85rem;">${p.data_servico ? new Date(p.data_servico).toLocaleDateString('pt-MZ') : '-'}</td>
                  <td class="cell-center" style="font-size: 1.25rem;">${p.pago ? '🟢' : '🔴'}</td>
                </tr>
              `).join('') : '<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-text">Nenhum pagamento registado</div></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Lista de Pedidos Modal -->
    <div id="listaPedidosModal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 95%; max-height: 90vh; overflow-y: auto;">
        <span onclick="fecharListaPedidos()" class="modal-close">&times;</span>
        <h2 class="section-card-title" style="color: #8b5cf6; text-align: center;">📨 Lista de Pedidos</h2>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <span style="font-size: 0.85rem; color: var(--gray);" id="listaPedidosCount">${pedidosPortfolio.length} pedidos</span>
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="searchListaPedidos" class="form-input" placeholder="🔍 Pesquisar..." style="max-width: 250px; padding: 0.4rem 0.75rem; font-size: 0.85rem;">
            <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="exportarListaPedidosPDF()">📄 PDF</button>
            <button class="btn btn-sm" style="background: #10b981; color: white;" onclick="exportarListaPedidosExcel()">📊 Excel</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: #ef4444;">${pedidosPortfolio.filter(p => p.status === 'pendente').length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Pendentes</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: #f59e0b;">${pedidosPortfolio.filter(p => p.status === 'visto').length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Vistos</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: #10b981;">${pedidosPortfolio.filter(p => p.status === 'orcamento_criado').length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Com Orçamento</p>
          </div>
          <div class="card text-center" style="padding: 1rem;">
            <h4 style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${pedidosPortfolio.length}</h4>
            <p style="font-size: 0.85rem; color: var(--gray); margin: 0;">Total</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table" id="tabelaListaPedidos">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Projecto</th>
                <th>Tipo</th>
                <th>Mensagem</th>
                <th>Data</th>
                <th class="cell-center">Status</th>
              </tr>
            </thead>
            <tbody>
              ${pedidosPortfolio.length > 0 ? pedidosPortfolio.map((p, i) => {
                const statusLabel = p.status === 'pendente' ? 'Pendente' : p.status === 'visto' ? 'Visto' : 'Orcamento Criado';
                const statusColor = p.status === 'pendente' ? '#ef4444' : p.status === 'visto' ? '#f59e0b' : '#10b981';
                const statusBg = p.status === 'pendente' ? '#fef2f2' : p.status === 'visto' ? '#fffbeb' : '#f0fdf4';
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-weight: 600;">${p.usuario_nome || '-'}</td>
                  <td class="cell-email">${p.usuario_email || '-'}</td>
                  <td style="font-weight: 600;">${p.portfolio_titulo || '-'}</td>
                  <td><span class="badge badge-primary">${p.portfolio_tipo || '-'}</span></td>
                  <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${(p.mensagem || '').replace(/"/g, '&quot;')}">${p.mensagem || '-'}</td>
                  <td style="font-size: 0.85rem; white-space: nowrap;">${p.created_at ? new Date(p.created_at).toLocaleDateString('pt-MZ') : '-'}</td>
                  <td class="cell-center"><span class="badge" style="background: ${statusBg}; color: ${statusColor}; font-weight: 600;">${statusLabel}</span></td>
                </tr>`;
              }).join('') : '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">📨</div><div class="empty-state-text">Nenhum pedido recebido</div></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Editar Lista Funcionários -->
    <div id="editarListaFuncionariosModal" class="modal-overlay" style="display: none;">
        <div class="modal-content" style="max-width: 95%; max-height: 90vh; overflow-y: auto;">
            <span onclick="fecharEditarListaFuncionarios()" class="modal-close">&times;</span>
            <h2 class="section-card-title" style="color: #8b5cf6; text-align: center;">✏️ Editar Lista de Funcionários</h2>
            <p style="text-align: center; color: var(--gray); font-size: 0.9rem; margin-bottom: 1rem;">Edite os dados de todos os funcionários e clique em <strong>Guardar Tudo</strong></p>
            <div class="table-wrap">
                <table class="table" id="tabelaEditarFuncionarios">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">N°</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th class="cell-center">Salário (MZN)</th>
                            <th>Endereço</th>
                            <th>Banco</th>
                            <th>Nº Conta</th>
                            <th>Carteira</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funcionarios.map((f, index) => `
                        <tr data-func-id="${f.id}">
                            <td style="text-align: center; font-weight: 700; color: var(--primary);">${index + 1}</td>
                            <td><input type="text" class="editable-input edit-nome" value="${f.nome || ''}" style="width: 100%;"></td>
                            <td><input type="email" class="editable-input edit-email" value="${f.email || ''}" style="width: 100%;"></td>
                            <td><input type="tel" class="editable-input edit-telefone" value="${f.telefone || ''}" maxlength="9" style="width: 100%;"></td>
                            <td><input type="number" class="editable-input edit-salario cell-center" value="${f.salario || 0}" step="0.01" style="width: 100%;"></td>
                            <td><input type="text" class="editable-input edit-endereco" value="${f.endereco || ''}" style="width: 100%;"></td>
                            <td>
                                <select class="editable-input edit-banco" style="width: 100%;">
                                    <option value="" ${!f.banco ? 'selected' : ''}>Selecionar...</option>
                                    <option value="BIM" ${f.banco === 'BIM' ? 'selected' : ''}>BIM</option>
                                    <option value="BCI" ${f.banco === 'BCI' ? 'selected' : ''}>BCI</option>
                                    <option value="Standard Bank" ${f.banco === 'Standard Bank' ? 'selected' : ''}>Standard Bank</option>
                                </select>
                            </td>
                            <td><input type="text" class="editable-input edit-conta" value="${f.numero_conta || ''}" style="width: 100%;"></td>
                            <td>
                                <select class="editable-input edit-tipo" style="width: 100%;">
                                    <option value="" ${!f.tipo_conta ? 'selected' : ''}>Selecionar...</option>
                                    <option value="mpesa" ${f.tipo_conta === 'mpesa' ? 'selected' : ''}>M-Pesa</option>
                                    <option value="emola" ${f.tipo_conta === 'emola' ? 'selected' : ''}>E-Mola</option>
                                    <option value="emick" ${f.tipo_conta === 'emick' ? 'selected' : ''}>E-Micks</option>
                                </select>
                            </td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: center; flex-wrap: wrap;">
                <button id="btnGuardarEditarLista" class="btn btn-primary" style="background: #8b5cf6; padding: 0.75rem 2rem; font-size: 1rem; border: none; border-radius: var(--radius-lg); color: white; font-weight: 700; cursor: pointer;">💾 Guardar Tudo</button>
                <button onclick="fecharEditarListaFuncionarios()" class="btn btn-sm" style="background: #6b7280; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: var(--radius-lg); font-size: 0.9rem; cursor: pointer;">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- Modal Lista Funcionários -->
    <div id="listaFuncionariosModal" class="modal-overlay" style="display: none;">
        <div class="modal-content" style="max-width: 800px;">
            <span onclick="fecharListaFuncionarios()" class="modal-close">&times;</span>
            <h2 class="section-card-title" style="color: var(--primary); text-align: center;">📋 Lista de Funcionários</h2>
            <p style="text-align: center; color: var(--gray); font-size: 0.9rem; margin-bottom: 1rem;">Total: <strong>${funcionarios.length}</strong> funcionários</p>
            <div class="table-wrap" id="listaFuncionariosContent">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">N°</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th class="cell-center">Salário (MZN)</th>
                            <th>Conta</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funcionarios.length > 0 ? funcionarios.map((f, index) => {
                            const bancoLabel = f.banco ? f.banco : (f.tipo_conta ? ({ mpesa: 'M-Pesa', emola: 'E-Mola', emick: 'E-Micks' }[f.tipo_conta] || f.tipo_conta) : '');
                            const contaLabel = bancoLabel ? `${bancoLabel}${f.numero_conta ? ' · ' + f.numero_conta : ''}` : '';
                            return `
                            <tr>
                                <td style="text-align: center; font-weight: 700; color: var(--primary); font-size: 1.1rem;">${index + 1}</td>
                                <td class="cell-name" style="font-weight: 600;">${f.nome}</td>
                                <td class="cell-email">${f.email || '-'}</td>
                                <td>${f.telefone || '-'}</td>
                                <td class="cell-center" style="font-weight: 700; color: var(--accent);">${formatCurrency(f.salario || 0)}</td>
                                <td style="font-size: 0.82rem;">${contaLabel || '<span style="color: var(--gray-light);">—</span>'}</td>
                            </tr>`;
                        }).join('') : '<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">👷</div><div class="empty-state-text">Nenhum funcionário encontrado</div></div></td></tr>'}
                    </tbody>
                </table>
            </div>
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem; justify-content: center; flex-wrap: wrap;">
                <button id="btnExportListaFuncPDF" class="btn btn-sm" style="background: #ef4444; color: white; padding: 0.6rem 1.2rem; border: none; border-radius: var(--radius-md); font-size: 0.85rem; cursor: pointer;">📄 Exportar PDF</button>
                <button id="btnExportListaFuncExcel" class="btn btn-sm" style="background: #10b981; color: white; padding: 0.6rem 1.2rem; border: none; border-radius: var(--radius-md); font-size: 0.85rem; cursor: pointer;">📊 Exportar Excel</button>
            </div>
        </div>
    </div>

    <!-- Relatorios Modal Admin -->
    <div id="relatoriosModalAdmin" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 920px; position: relative; padding: 1.5rem;">
        <span onclick="fecharSistemaRelatoriosAdmin()" class="modal-close" style="position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; background: var(--light); font-size: 1.5rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; transition: all 0.2s;">&times;</span>
        <h2 class="section-card-title" style="color: var(--primary); text-align: center; margin-bottom: 1.25rem;">📈 Sistema de Relatórios (Admin)</h2>

        <!-- Filtros linha 1 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem; align-items: end;">
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Tipo de Filtro</label>
            <select id="adminRelTipoFiltro" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              <option value="mensal">Mensal</option>
              <option value="anual" selected>Anual</option>
              <option value="6meses">6 Meses</option>
              <option value="geral">Geral</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Mês/Ano Inicial</label>
            <input type="month" id="adminRelDataInicio" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
          </div>
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Mês/Ano Final</label>
            <input type="month" id="adminRelDataFim" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
          </div>
        </div>

        <!-- Filtros linha 2 -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.75rem; margin-bottom: 1.25rem; align-items: end;">
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Forma de Pagamento</label>
            <select id="adminRelFormaPagamento" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              <option value="">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Categoria/Produto</label>
            <select id="adminRelCategoria" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              <option value="">Todos</option>
              <option value="gesso">Gesso</option>
              <option value="pvc">PVC</option>
              <option value="modular">Modular</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.75rem; color: #6b7280; display: block; margin-bottom: 0.25rem;">Centro de Custo</label>
            <select id="adminRelCentro" class="form-input" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;">
              <option value="">Todos</option>
              <option value="materiais">Materiais</option>
              <option value="mao_obra">Mão de Obra</option>
            </select>
          </div>
          <div>
            <button class="btn btn-primary" onclick="pesquisarRelatorioAdmin()" style="padding: 0.5rem 1.25rem; font-size: 0.875rem; white-space: nowrap;">🔍 Pesquisar</button>
          </div>
        </div>

        <!-- Gráfico com cabeçalho e legenda -->
        <div class="section-card" style="margin-bottom: 1.25rem; padding: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <h3 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0;">Receitas e Despesas</h3>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button id="btnToggleReceitasPrevistas" onclick="toggleSerieAdmin(0)" style="display: flex; align-items: center; gap: 0.35rem; background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-radius: 3px; background: white; flex-shrink: 0;"><span style="display: block; width: 8px; height: 8px; margin: 1px; background: #3b82f6; border-radius: 1px;"></span></span>
                Receitas Previstas
              </button>
              <button id="btnToggleReceitasRecebidas" onclick="toggleSerieAdmin(1)" style="display: flex; align-items: center; gap: 0.35rem; background: #10b981; color: white; border: none; border-radius: 6px; padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-radius: 3px; background: white; flex-shrink: 0;"><span style="display: block; width: 8px; height: 8px; margin: 1px; background: #10b981; border-radius: 1px;"></span></span>
                Receitas Recebidas
              </button>
              <button id="btnToggleDespesas" onclick="toggleSerieAdmin(2)" style="display: flex; align-items: center; gap: 0.35rem; background: #ef4444; color: white; border: none; border-radius: 6px; padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-radius: 3px; background: white; flex-shrink: 0;">                <span style="display: block; width: 8px; height: 8px; margin: 1px; background: #ef4444; border-radius: 1px;"></span></span>
                Despesas da Empresa
              </button>
              <button id="btnToggleLucro" onclick="toggleSerieAdmin(3)" style="display: flex; align-items: center; gap: 0.35rem; background: #7c3aed; color: white; border: none; border-radius: 6px; padding: 0.3rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid white; border-radius: 3px; background: white; flex-shrink: 0;"><span style="display: block; width: 8px; height: 8px; margin: 1px; background: #7c3aed; border-radius: 1px;"></span></span>
                Lucro (2%–10%)
              </button>
            </div>
          </div>
          <div style="position: relative; height: 320px;">
            <canvas id="relatorioGraficoAdmin"></canvas>
          </div>
          <div id="adminRelEixoLabel" style="text-align: center; margin-top: 0.5rem; font-size: 0.78rem; color: #6b7280;">Mês</div>
        </div>

        <!-- Resumo Financeiro -->
        <div class="section-card" style="margin-bottom: 1.25rem; padding: 1rem;">
          <h3 style="font-size: 1rem; font-weight: 700; color: #111827; margin: 0 0 0.75rem;">📊 Resumo Financeiro do Período</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 0.75rem;">
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 0.85rem 0.6rem; text-align: center;">
              <div style="font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">💰 Total Recebido</div>
              <div id="adminRelTotalRecebido" style="font-size: 1rem; font-weight: 800; color: #2563eb; margin-top: 0.3rem;">—</div>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fde68a; border-radius: 12px; padding: 0.85rem 0.6rem; text-align: center;">
              <div style="font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">⏳ Total Pendente</div>
              <div id="adminRelTotalPendente" style="font-size: 1rem; font-weight: 800; color: #d97706; margin-top: 0.3rem;">—</div>
            </div>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 0.85rem 0.6rem; text-align: center;">
              <div style="font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">🧾 Despesas da Empresa</div>
              <div id="adminRelTotalDespesas" style="font-size: 1rem; font-weight: 800; color: #dc2626; margin-top: 0.3rem;">—</div>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 0.85rem 0.6rem; text-align: center;">
              <div style="font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">🏢 Total Gerado</div>
              <div id="adminRelTotalGerado" style="font-size: 1rem; font-weight: 800; color: #16a34a; margin-top: 0.3rem;">—</div>
            </div>
            <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 0.85rem 0.6rem; text-align: center;">
              <div style="font-size: 0.7rem; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">📈 Lucro da Empresa (2%–10%)</div>
              <div id="adminRelLucro" style="font-size: 1rem; font-weight: 800; color: #7c3aed; margin-top: 0.3rem;">—</div>
              <div id="adminRelLucroDetalhe" style="font-size: 0.65rem; color: #9ca3af; margin-top: 0.15rem;">Calculado por serviço</div>
            </div>
          </div>
        </div>

        <div class="table-actions">
            <button class="btn" style="flex: 1; background: #ef4444; color: white;" onclick="exportarRelatorioAtualAdmin('pdf')">📄 Exportar PDF</button>
            <button class="btn" style="flex: 1; background: #10b981; color: white;" onclick="exportarRelatorioAtualAdmin('excel')">📊 Exportar Excel</button>
            <button class="btn btn-primary" style="flex: 0; padding: 0.875rem 1.5rem;" onclick="atualizarRelatorioAdmin()">🔄 Atualizar</button>
        </div>
      </div>
    </div>

    <!-- Agente Inteligente Modal -->
    <div id="agenteIntelModal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 900px; position: relative; max-height: 90vh; overflow-y: auto;">
        <span onclick="fecharAgenteIntel()" class="modal-close" style="position: absolute; top: 0.75rem; right: 0.75rem; z-index: 10; background: var(--light); font-size: 1.5rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer;">&times;</span>
        
        <div style="text-align: center; padding: 1.5rem 1rem 1rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🤖</div>
          <h2 style="color: var(--primary); margin: 0; font-size: 1.3rem;">Agente Inteligente</h2>
          <p style="color: var(--gray); font-size: 0.8rem; margin: 0.25rem 0 0;">Assistente AI para administração do sistema</p>
        </div>

        <!-- Tabs do Agente -->
        <div style="display: flex; gap: 0.5rem; padding: 0 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
          <button class="btn btn-sm btn-primary agente-tab" onclick="mostrarAbaAgente('resumo')" id="agenteTabResumo">📊 Resumo</button>
          <button class="btn btn-sm btn-outline agente-tab" onclick="mostrarAbaAgente('atividades')" id="agenteTabAtividades">📜 Atividades</button>
          <button class="btn btn-sm btn-outline agente-tab" onclick="mostrarAbaAgente('backups')" id="agenteTabBackups">🛡️ Backups</button>
        </div>

        <!-- Aba: Resumo -->
        <div id="agenteAbaResumo" style="padding: 0 1rem;">
          <div id="agenteResumoConteudo" style="text-align: center; padding: 2rem; color: var(--gray);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳</div>
            <p>A carregar relatório do sistema...</p>
          </div>
        </div>

        <!-- Aba: Atividades -->
        <div id="agenteAbaAtividades" style="padding: 0 1rem; display: none;">
          <div id="agenteAtividadesConteudo" style="text-align: center; padding: 2rem; color: var(--gray);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳</div>
            <p>A carregar atividades...</p>
          </div>
        </div>

        <!-- Aba: Backups -->
        <div id="agenteAbaBackups" style="padding: 0 1rem; display: none;">
          <div id="agenteBackupsConteudo" style="text-align: center; padding: 2rem; color: var(--gray);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⏳</div>
            <p>A carregar backups...</p>
          </div>
        </div>
      </div>
    </div>
    `);

    // ==================== HISTÓRICO DO SISTEMA ====================
    const LABELS_ACAO = {
        login_sucesso: '🔓 Login',
        login_falha: '🚫 Login falhado',
        login_conta_desativada: '⛔ Conta desativada',
        registro_cliente: '📝 Registo cliente',
        utilizador_criado: '👤 Utilizador criado',
        utilizador_atualizado: '✏️ Utilizador atualizado',
        utilizador_apagado: '🗑️ Utilizador apagado',
        role_atualizada: '🎭 Role atualizada',
        permissao_responder_atualizada: '🔔 Permissão atualizada',
        dados_funcionario_atualizados: '👷 Dados funcionário',
        foto_funcionario_atualizada: '📸 Foto atualizada',
        cliente_criado: '✅ Cliente criado',
        cliente_atualizado: '✏️ Cliente atualizado',
        cliente_apagado: '🗑️ Cliente apagado',
        cliente_verificado: '🔍 Cliente verificado',
        servico_criado: '📋 Serviço criado',
        servico_atualizado: '✏️ Serviço atualizado',
        materiais_atualizados: '🧱 Materiais atualizados',
        pagamento_registado: '💳 Pagamento registado',
        portfolio_criado: '📸 Projeto criado',
        portfolio_atualizado: '✏️ Projeto atualizado',
        portfolio_apagado: '🗑️ Projeto apagado',
        mensagem_contacto_recebida: '📬 Mensagem recebida',
        mensagem_marcada_lida: '👁️ Mensagem lida',
        mensagem_respondida: '📤 Mensagem respondida',
        mensagem_apagada: '🗑️ Mensagem apagada',
        configuracao_atualizada: '⚙️ Config atualizada',
        preco_atualizado: '💰 Preço atualizado',
        falta_registada: '❌ Falta registada',
        falta_justificada: '📄 Falta justificada',
        falta_apagada: '🗑️ Falta apagada',
        pedido_portfolio_enviado: '📩 Pedido enviado',
        pedido_status_atualizado: '🔄 Pedido atualizado',
        pedido_apagado: '🗑️ Pedido apagado',
        historico_apagado: '🧹 Histórico limpo',
        historico_total_apagado: '🧹 Histórico total limpo'
    };

    const getLabelAcao = (acao) => LABELS_ACAO[acao] || acao;

    // Formata "2026-08-12 06:19:51" (SQLite) -> "12/08/2026 às 06:19" sem depender do browser
    const formatarDataHora = (str) => {
        if (!str) return '-';
        const m = String(str).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (!m) return String(str);
        return `${m[3]}/${m[2]}/${m[1]} às ${m[4]}:${m[5]}`;
    };

    const formatarDetalhes = (log) => {
        if (!log || !log.detalhes) return '-';
        try {
            const d = JSON.parse(log.detalhes);
            const partes = Object.entries(d).map(([k, v]) => {
                const val = typeof v === 'object' && v !== null ? JSON.stringify(v) : v;
                return `<span style="color: var(--gray);">${k}:</span> <strong>${String(val).slice(0, 120)}</strong>`;
            });
            return partes.join(' · ') || '-';
        } catch {
            return String(log.detalhes).slice(0, 200);
        }
    };

    const getFiltrosHistorico = () => {
        const params = new URLSearchParams();
        const acao = document.getElementById('filtroAcao')?.value;
        const busca = document.getElementById('filtroBusca')?.value.trim();
        const dataInicio = document.getElementById('filtroDataInicio')?.value;
        const dataFim = document.getElementById('filtroDataFim')?.value;
        if (acao) params.set('acao', acao);
        if (busca) params.set('busca', busca);
        if (dataInicio) params.set('data_inicio', dataInicio);
        if (dataFim) params.set('data_fim', dataFim);
        params.set('por_pagina', '25');
        return params;
    };

    window.carregarHistorico = async (pagina = 1) => {
        const tbody = document.getElementById('tbodyHistorico');
        try {
            paginaHistorico = Math.max(1, pagina);
            const params = getFiltrosHistorico();
            params.set('pagina', String(paginaHistorico));
            const res = await api.get('/auditoria?' + params.toString());
            historicoLogs = res.logs || [];
            historicoTotalPaginas = res.totalPaginas || 1;
            historicoAcoes = res.acoes || [];
            document.getElementById('historicoCount').textContent = `${res.total || 0} registos`;

            // Preencher select de ações (preservar seleção)
            const selAcao = document.getElementById('filtroAcao');
            const valorAtual = selAcao.value;
            selAcao.innerHTML = '<option value="">Todas as ações</option>' +
                historicoAcoes.map(a => `<option value="${a}">${getLabelAcao(a)}</option>`).join('');
            selAcao.value = valorAtual;

            if (!historicoLogs.length) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--gray); padding: 1.5rem;">Nenhum registo encontrado.</td></tr>';
            } else {
                tbody.innerHTML = historicoLogs.map(log => `
                    <tr>
                        <td style="white-space: nowrap; font-size: 0.8rem;">${formatarDataHora(log.created_at)}</td>
                        <td>${log.usuario_nome ? `<strong>${log.usuario_nome}</strong>` : '<span style="color: var(--gray);">— sistema —</span>'}</td>
                        <td><span class="badge" style="background: var(--light); color: var(--primary); font-size: 0.75rem;">${getLabelAcao(log.acao)}</span></td>
                        <td style="font-size: 0.8rem;">${formatarDetalhes(log)}</td>
                        <td style="font-size: 0.8rem; color: var(--gray);">${log.ip || '-'}</td>
                    </tr>`).join('');
            }

            document.getElementById('historicoInfoPagina').textContent = `Página ${paginaHistorico} de ${historicoTotalPaginas}`;
            document.getElementById('btnHistoricoPrev').disabled = paginaHistorico <= 1;
            document.getElementById('btnHistoricoNext').disabled = paginaHistorico >= historicoTotalPaginas;
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #ef4444; padding: 1.5rem;">Erro ao carregar histórico. Verifique se o servidor foi reiniciado com as novas rotas.</td></tr>';
            showError('Erro ao carregar histórico.');
        }
    };

    window.limparFiltrosHistorico = () => {
        document.getElementById('filtroBusca').value = '';
        document.getElementById('filtroAcao').value = '';
        document.getElementById('filtroDataInicio').value = '';
        document.getElementById('filtroDataFim').value = '';
        carregarHistorico(1);
    };

    window.paginaAnterior = () => carregarHistorico(paginaHistorico - 1);
    window.paginaSeguinte = () => carregarHistorico(paginaHistorico + 1);

    window.apagarHistorico = () => {
        const ate = document.getElementById('filtroDataFim')?.value || '';
        if (!confirm('⚠️ Tem a certeza que deseja apagar o histórico de auditoria do sistema?\n\nEsta ação NÃO pode ser revertida!')) return;
        const body = ate ? { ate } : {};
        fetch('/api/auditoria', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('teto_falso_token') || '') },
            body: JSON.stringify(body)
        })
            .then(r => r.json())
            .then(res => {
                if (res.error) return showError(res.error);
                showSuccess(res.message);
                carregarHistorico(1);
            })
            .catch(() => showError('Erro ao apagar histórico.'));
    };

    window.exportarHistoricoPDF = () => {
        try {
            if (!historicoLogs.length) return showError('Sem dados para exportar.');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.setTextColor(99, 102, 241);
            doc.text('Histórico do Sistema', 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total exportado: ${historicoLogs.length} registos | Data: ${new Date().toLocaleDateString('pt')}`, 14, 22);
            const headers = [['Data/Hora', 'Utilizador', 'Ação', 'Detalhes', 'IP']];
            const rows = historicoLogs.map(log => [
                formatarDataHora(log.created_at),
                log.usuario_nome || '-',
                getLabelAcao(log.acao),
                (log.detalhes || '-').slice(0, 150),
                log.ip || '-'
            ]);
            doc.autoTable({ head: headers, body: rows, startY: 28, theme: 'grid', headStyles: { fillColor: [99, 102, 241] }, styles: { fontSize: 8 } });
            doc.save('Historico_Sistema.pdf');
        } catch (e) { console.error(e); showError('Erro ao exportar PDF.'); }
    };

    window.exportarHistoricoExcel = () => {
        try {
            if (!historicoLogs.length) return showError('Sem dados para exportar.');
            const data = historicoLogs.map(log => ({
                'Data/Hora': formatarDataHora(log.created_at),
                'Utilizador': log.usuario_nome || '-',
                'Ação': getLabelAcao(log.acao),
                'Detalhes': log.detalhes || '-',
                'IP': log.ip || '-'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
            XLSX.writeFile(wb, 'Historico_Sistema.xlsx');
        } catch (e) { console.error(e); showError('Erro ao exportar Excel.'); }
    };

    // Carregar histórico sempre que a aba for aberta
    document.querySelector('[data-admin-tab="historico"]')?.addEventListener('click', () => {
        setTimeout(() => carregarHistorico(1), 50);
    });

    // Enter na busca dispara o filtro
    document.getElementById('filtroBusca')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') carregarHistorico(1);
    });

    // ==================== TAB NAVIGATION ====================
    document.querySelectorAll('#adminTabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('#adminTabs .tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-content-admin').forEach(tc => tc.style.display = 'none');
            document.getElementById(`tab-${tab.dataset.adminTab}`).style.display = 'block';
        });
    });

    // ==================== CREATE USER ====================
    document.getElementById('formCreateUser').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nome: document.getElementById('newUserNome').value,
            email: document.getElementById('newUserEmail').value,
            senha: document.getElementById('newUserSenha').value,
            telefone: document.getElementById('newUserTelefone').value,
            role: document.getElementById('newUserRole').value
        };
        try {
            await api.post('/usuarios', data);
            showSuccess('Utilizador criado com sucesso!');
        } catch (error) {
            showError(error.message);
        }
    });

    // ==================== CADASTRAR FUNCIONÁRIO ====================
    const formFunc = document.getElementById('formCreateFuncionario');
    if (formFunc) {
        formFunc.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nome: document.getElementById('newFuncNome').value,
                email: document.getElementById('newFuncEmail').value,
                senha: document.getElementById('newFuncSenha').value,
                telefone: document.getElementById('newFuncTelefone').value,
                role: 'funcionario',
                salario: parseFloat(document.getElementById('newFuncSalario').value) || 0,
                endereco: document.getElementById('newFuncEndereco').value,
                numero_conta: document.getElementById('newFuncConta').value,
                banco: document.getElementById('newFuncBanco').value || null,
                tipo_conta: document.getElementById('newFuncTipoConta').value || null
            };
            try {
                const result = await api.post('/usuarios', data);
                // Upload foto if selected
                const fotoInput = document.getElementById('newFuncFoto');
                if (fotoInput && fotoInput.files.length > 0) {
                    const formData = new FormData();
                    formData.append('foto', fotoInput.files[0]);
                    await api.uploadFile(`/usuarios/${result.id}/foto`, formData);
                }
                showSuccess('Funcionário cadastrado com sucesso!');
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // ==================== PREVIEW DE FOTO (CADASTRO FUNCIONÁRIO) ====================
    const funcFotoInput = document.getElementById('newFuncFoto');
    const funcFotoPreview = document.getElementById('funcFotoPreview');
    if (funcFotoInput && funcFotoPreview) {
        funcFotoInput.addEventListener('change', () => {
            const file = funcFotoInput.files && funcFotoInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showError('Por favor, selecione um ficheiro de imagem válido.');
                funcFotoInput.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                funcFotoPreview.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização da foto">`;
            };
            reader.readAsDataURL(file);
        });
    }

    // ==================== CHANGE USER ROLE ====================
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', async () => {
            const userId = select.dataset.userId;
            const role = select.value;
            if (!confirm(`Alterar permissões para "${role === 'admin' ? 'Administrador' : role === 'funcionario' ? 'Funcionário' : 'Cliente'}"?`)) {
                window.location.reload();
                return;
            }
            try {
                await api.put(`/usuarios/${userId}/role`, { role });
                showSuccess('Permissão actualizada!');
            } catch (error) {
                showError(error.message);
                window.location.reload();
            }
        });
    });

    // ==================== GLOBAL SEARCH LOGIC ====================
    window.abrirPesquisaGeral = () => {
        document.getElementById('pesquisaGeralModal').style.display = 'block';
        const input = document.getElementById('pesquisaGeralInput');
        input.value = '';
        document.getElementById('pesquisaGeralResultados').innerHTML = '<p style="color: var(--gray); text-align: center; padding: 2rem;">Digite para pesquisar em todos os registos...</p>';
        setTimeout(() => input.focus(), 100);
    };

    window.fecharPesquisaGeral = () => {
        document.getElementById('pesquisaGeralModal').style.display = 'none';
    };

    // ==================== LISTA DE CLIENTES ====================
    window.abrirListaClientes = () => {
        document.getElementById('listaClientesModal').style.display = 'block';
        setTimeout(() => document.getElementById('searchListaClientes')?.focus(), 100);
    };

    window.fecharListaClientes = () => {
        document.getElementById('listaClientesModal').style.display = 'none';
    };

    document.getElementById('searchListaClientes')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tabelaListaClientes tbody tr');
        let count = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = text.includes(term);
            row.style.display = match ? '' : 'none';
            if (match) count++;
        });
        document.getElementById('listaClientesCount').textContent = `${count} de ${clientesLista.length} registos`;
    });

    window.exportarListaClientesPDF = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.setTextColor(16, 185, 129);
            doc.text('Lista de Clientes', 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total: ${clientesLista.length} clientes | Data: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 22);
            const headers = [['#', 'Nome', 'Email', 'Telefone', 'Verificado', 'Ultimo Login', 'Registado em']];
            const rows = clientesLista.map((c, i) => [
                i + 1, c.nome || '-', c.email || '-', c.telefone || '-',
                c.verificado ? 'Sim' : 'Nao',
                c.ultimo_login ? new Date(c.ultimo_login).toLocaleDateString('pt-MZ') : 'Nunca',
                c.created_at ? new Date(c.created_at).toLocaleDateString('pt-MZ') : '-'
            ]);
            doc.autoTable({ head: headers, body: rows, startY: 28, theme: 'grid', headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 8 } });
            doc.save('Lista_Clientes.pdf');
        } catch (e) { console.error(e); showError('Erro ao exportar PDF.'); }
    };

    window.exportarListaClientesExcel = () => {
        try {
            const data = clientesLista.map((c, i) => ({
                '#': i + 1, 'Nome': c.nome || '-', 'Email': c.email || '-',
                'Telefone': c.telefone || '-', 'Verificado': c.verificado ? 'Sim' : 'Nao',
                'Ultimo Login': c.ultimo_login ? new Date(c.ultimo_login).toLocaleDateString('pt-MZ') : 'Nunca',
                'Registado em': c.created_at ? new Date(c.created_at).toLocaleDateString('pt-MZ') : '-'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
            XLSX.writeFile(wb, 'Lista_Clientes.xlsx');
        } catch (e) { console.error(e); showError('Erro ao exportar Excel.'); }
    };

    // ==================== LISTA DE PAGAMENTOS ====================
    window.abrirListaPagamentos = () => {
        document.getElementById('listaPagamentosModal').style.display = 'block';
        setTimeout(() => document.getElementById('searchListaPagamentos')?.focus(), 100);
    };

    window.fecharListaPagamentos = () => {
        document.getElementById('listaPagamentosModal').style.display = 'none';
    };

    document.getElementById('searchListaPagamentos')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tabelaListaPagamentos tbody tr');
        let count = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = text.includes(term);
            row.style.display = match ? '' : 'none';
            if (match) count++;
        });
        document.getElementById('listaPagamentosCount').textContent = `${count} de ${pagamentos.length} registos`;
    });

    window.exportarListaPagamentosPDF = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.setTextColor(245, 158, 11);
            doc.text('Lista de Pagamentos', 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total: ${pagamentos.length} registos | Data: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 22);
            const headers = [['#', 'Cliente', 'Tipo', 'Area (m2)', 'Valor', 'Data', 'Status']];
            const rows = pagamentos.map((p, i) => [
                i + 1, p.cliente_nome || 'N/A', p.tipo_teto || '-', p.area || '-',
                formatCurrency(p.valor_total), p.data_servico ? new Date(p.data_servico).toLocaleDateString('pt-MZ') : '-',
                p.pago ? 'Pago' : 'Por Pagar'
            ]);
            doc.autoTable({ head: headers, body: rows, startY: 28, theme: 'grid', headStyles: { fillColor: [245, 158, 11] }, styles: { fontSize: 8 } });
            const totalPago = pagamentos.filter(p => p.pago).reduce((s, p) => s + (p.valor_total || 0), 0);
            const totalPendente = pagamentos.filter(p => !p.pago).reduce((s, p) => s + (p.valor_total || 0), 0);
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL RECEBIDO: ${formatCurrency(totalPago)}  |  TOTAL PENDENTE: ${formatCurrency(totalPendente)}`, 14, finalY);
            doc.save('Lista_Pagamentos.pdf');
        } catch (e) { console.error(e); showError('Erro ao exportar PDF.'); }
    };

    window.exportarListaPagamentosExcel = () => {
        try {
            const data = pagamentos.map((p, i) => ({
                '#': i + 1, 'Cliente': p.cliente_nome || 'N/A', 'Tipo': p.tipo_teto || '-',
                'Area (m2)': p.area || '-', 'Valor': p.valor_total || 0,
                'Data': p.data_servico ? new Date(p.data_servico).toLocaleDateString('pt-MZ') : '-',
                'Status': p.pago ? 'Pago' : 'Por Pagar'
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos');
            XLSX.writeFile(wb, 'Lista_Pagamentos.xlsx');
        } catch (e) { console.error(e); showError('Erro ao exportar Excel.'); }
    };

    // ==================== LISTA DE PEDIDOS ====================
    window.abrirListaPedidos = () => {
        document.getElementById('listaPedidosModal').style.display = 'block';
        setTimeout(() => document.getElementById('searchListaPedidos')?.focus(), 100);
    };

    window.fecharListaPedidos = () => {
        document.getElementById('listaPedidosModal').style.display = 'none';
    };

    document.getElementById('searchListaPedidos')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#tabelaListaPedidos tbody tr');
        let count = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = text.includes(term);
            row.style.display = match ? '' : 'none';
            if (match) count++;
        });
        document.getElementById('listaPedidosCount').textContent = `${count} de ${pedidosPortfolio.length} pedidos`;
    });

    window.exportarListaPedidosPDF = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            doc.setFontSize(18);
            doc.setTextColor(139, 92, 246);
            doc.text('Lista de Pedidos de Portfolio', 14, 15);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total: ${pedidosPortfolio.length} pedidos | Data: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 22);
            const headers = [['#', 'Cliente', 'Email', 'Projecto', 'Tipo', 'Mensagem', 'Data', 'Status']];
            const rows = pedidosPortfolio.map((p, i) => {
                const statusLabel = p.status === 'pendente' ? 'Pendente' : p.status === 'visto' ? 'Visto' : 'Orcamento Criado';
                return [
                    i + 1, p.usuario_nome || '-', p.usuario_email || '-',
                    p.portfolio_titulo || '-', p.portfolio_tipo || '-',
                    (p.mensagem || '-').substring(0, 50),
                    p.created_at ? new Date(p.created_at).toLocaleDateString('pt-MZ') : '-',
                    statusLabel
                ];
            });
            doc.autoTable({ head: headers, body: rows, startY: 28, theme: 'grid', headStyles: { fillColor: [139, 92, 246] }, styles: { fontSize: 7 } });
            doc.save('Lista_Pedidos.pdf');
        } catch (e) { console.error(e); showError('Erro ao exportar PDF.'); }
    };

    window.exportarListaPedidosExcel = () => {
        try {
            const data = pedidosPortfolio.map((p, i) => {
                const statusLabel = p.status === 'pendente' ? 'Pendente' : p.status === 'visto' ? 'Visto' : 'Orcamento Criado';
                return {
                    '#': i + 1, 'Cliente': p.usuario_nome || '-', 'Email': p.usuario_email || '-',
                    'Projecto': p.portfolio_titulo || '-', 'Tipo': p.portfolio_tipo || '-',
                    'Mensagem': p.mensagem || '-', 'Data': p.created_at ? new Date(p.created_at).toLocaleDateString('pt-MZ') : '-',
                    'Status': statusLabel
                };
            });
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
            XLSX.writeFile(wb, 'Lista_Pedidos.xlsx');
        } catch (e) { console.error(e); showError('Erro ao exportar Excel.'); }
    };

    // Fechar modais ao clicar fora
    document.getElementById('listaClientesModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharListaClientes();
    });
    document.getElementById('listaPagamentosModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharListaPagamentos();
    });
    document.getElementById('listaPedidosModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharListaPedidos();
    });

    // ==================== AGENTE INTELIGENTE ====================
    window.abrirAgenteIntel = async () => {
        document.getElementById('agenteIntelModal').style.display = 'block';
        carregarRelatorioAgente();
    };

    window.fecharAgenteIntel = () => {
        document.getElementById('agenteIntelModal').style.display = 'none';
    };

    document.getElementById('agenteIntelModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharAgenteIntel();
    });

    window.mostrarAbaAgente = (aba) => {
        document.querySelectorAll('.agente-tab').forEach(b => { b.className = 'btn btn-sm btn-outline agente-tab'; });
        document.getElementById('agenteAbaResumo').style.display = 'none';
        document.getElementById('agenteAbaAtividades').style.display = 'none';
        document.getElementById('agenteAbaBackups').style.display = 'none';

        if (aba === 'resumo') {
            document.getElementById('agenteTabResumo').className = 'btn btn-sm btn-primary agente-tab';
            document.getElementById('agenteAbaResumo').style.display = 'block';
        } else if (aba === 'atividades') {
            document.getElementById('agenteTabAtividades').className = 'btn btn-sm btn-primary agente-tab';
            document.getElementById('agenteAbaAtividades').style.display = 'block';
            carregarAtividadesAgente();
        } else if (aba === 'backups') {
            document.getElementById('agenteTabBackups').className = 'btn btn-sm btn-primary agente-tab';
            document.getElementById('agenteAbaBackups').style.display = 'block';
            carregarBackupsAgente();
        }
    };

    async function carregarRelatorioAgente() {
        const container = document.getElementById('agenteResumoConteudo');
        try {
            const res = await api.get('/agente-relatorio');
            const r = res.relatorio;

            const f = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v).replace(/MTn|MTN|MZN/g, 'MT');
            const saude = ((r.servicosPagos / (r.totalServicos || 1)) * 100).toFixed(0);
            const corSaude = saude > 70 ? '#10b981' : saude > 40 ? '#f59e0b' : '#ef4444';

            container.innerHTML = `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                <div style="background: #f0f0ff; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.5rem;">👥</div>
                  <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">${r.totalUsuarios}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Utilizadores</div>
                  <div style="font-size: 0.65rem; color: var(--gray);">${r.totalAdmins} admin · ${r.totalFuncionarios} func. · ${r.totalClientes} clientes</div>
                </div>
                <div style="background: #f0fdf4; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.5rem;">📋</div>
                  <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${r.totalServicos}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Serviços</div>
                  <div style="font-size: 0.65rem; color: var(--gray);">${r.servicosPagos} pagos · ${r.servicosPendentes} pendentes</div>
                </div>
                <div style="background: #fef3c7; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.5rem;">💰</div>
                  <div style="font-size: 1.1rem; font-weight: 800; color: #d97706;">${f(r.valorTotalFaturado)}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Total Faturado</div>
                  <div style="font-size: 0.65rem; color: var(--gray);">Pendente: ${f(r.valorPendente)}</div>
                </div>
                <div style="background: #fef2f2; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.5rem;">🛡️</div>
                  <div style="font-size: 1.3rem; font-weight: 800; color: #ef4444;">${r.totalBackups}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Backups</div>
                  <div style="font-size: 0.65rem; color: var(--gray);">Recibos apagados</div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.2rem;">📬</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: ${r.mensagensNaoLidas > 0 ? '#f59e0b' : '#10b981'};">${r.mensagensNaoLidas}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Msgs Não Lidas</div>
                </div>
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.2rem;">👷</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: ${r.faltasNaoJustificadas > 0 ? '#ef4444' : '#10b981'};">${r.faltasNaoJustificadas}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Faltas S/ Justificar</div>
                </div>
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.2rem;">🖼️</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${r.totalPortfolio}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Portfólio</div>
                </div>
                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; text-align: center;">
                  <div style="font-size: 1.2rem;">📨</div>
                  <div style="font-size: 1.1rem; font-weight: 700; color: ${r.pedidosPendentes > 0 ? '#8b5cf6' : '#10b981'};">${r.pedidosPendentes}</div>
                  <div style="font-size: 0.7rem; color: var(--gray);">Pedidos Pendentes</div>
                </div>
              </div>

              <div style="background: linear-gradient(135deg, #f0f0ff, #f0fdf4); border-radius: 10px; padding: 0.75rem; text-align: center; border: 1px solid #e5e7eb;">
                <div style="font-size: 0.75rem; color: var(--gray); margin-bottom: 0.25rem;">Saúde do Sistema</div>
                <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 0.3rem;">
                  <div style="width: ${saude}%; height: 100%; background: ${corSaude}; border-radius: 4px; transition: width 0.5s;"></div>
                </div>
                <div style="font-size: 0.85rem; font-weight: 700; color: ${corSaude};">${saude}% taxa de pagamento</div>
              </div>
            `;
        } catch (e) {
            container.innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao carregar relatório. Verifique a conexão.</p>';
        }
    }

    async function carregarAtividadesAgente() {
        const container = document.getElementById('agenteAtividadesConteudo');
        try {
            const res = await api.get('/agente-relatorio');
            const atividades = res.relatorio.ultimasAtividades || [];

            if (atividades.length === 0) {
                container.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 1rem;">Nenhuma atividade registada ainda.</p>';
                return;
            }

            const icones = {
                'ai_chat': '🤖', 'servico_deletado_com_backup': '🗑️', 'servico_restaurado': '♻️',
                'login': '🔑', 'contact_reply': '📩', 'default': '📝'
            };

            let html = '<div style="max-height: 400px; overflow-y: auto;">';
            atividades.forEach(a => {
                const icone = icones[a.acao] || icones['default'];
                const data = a.created_at ? new Date(a.created_at).toLocaleString('pt-MZ') : '-';
                let detalhes = '';
                try {
                    const d = typeof a.detalhes === 'string' ? JSON.parse(a.detalhes) : a.detalhes;
                    if (d && d.path) detalhes = `${d.method || ''} ${d.path}`;
                } catch(e) { detalhes = a.detalhes || ''; }

                html += `
                  <div style="display: flex; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid #f3f4f6; align-items: flex-start;">
                    <div style="font-size: 1.2rem; min-width: 30px; text-align: center;">${icone}</div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.8rem; font-weight: 600; color: var(--dark);">${a.acao.replace(/_/g, ' ').toUpperCase()}</div>
                      <div style="font-size: 0.7rem; color: var(--gray);">${a.usuario_nome || 'Sistema'} · ${data}</div>
                      ${detalhes ? `<div style="font-size: 0.65rem; color: var(--gray); font-family: monospace;">${detalhes}</div>` : ''}
                    </div>
                  </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao carregar atividades.</p>';
        }
    }

    async function carregarBackupsAgente() {
        const container = document.getElementById('agenteBackupsConteudo');
        try {
            const res = await api.get('/servicos-backup');
            const backups = res.backups || [];

            if (backups.length === 0) {
                container.innerHTML = '<div style="text-align: center; padding: 2rem;"><div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div><p style="color: var(--gray);">Nenhum recibo apagado. Sistema seguro!</p></div>';
                return;
            }

            const tipoMap = { gesso: 'Gesso', pvc: 'PVC', modular: 'Modular' };
            const f = (v) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(v).replace(/MTn|MTN|MZN/g, 'MT');

            let html = `<div style="padding: 0.5rem 0; margin-bottom: 0.75rem; background: #fef3c7; border-radius: 8px; padding: 0.6rem; text-align: center; font-size: 0.8rem; color: #92400e;">
              ⚠️ <strong>${backups.length}</strong> recibo(s) apagado(s) encontrado(s). Pode restaurar qualquer um.
            </div><div style="max-height: 400px; overflow-y: auto;">`;

            backups.forEach(b => {
                const data = b.deleted_at ? new Date(b.deleted_at).toLocaleString('pt-MZ') : '-';
                html += `
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 0.75rem; margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                      <div>
                        <span style="font-weight: 700; color: var(--primary);">#${b.original_id}</span>
                        <span style="font-size: 0.75rem; color: var(--gray); margin-left: 0.25rem;">${tipoMap[b.tipo_teto] || b.tipo_teto}</span>
                      </div>
                      <span style="font-weight: 700; color: #10b981; font-size: 0.9rem;">${f(b.valor_total)}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--gray); margin-bottom: 0.4rem;">
                      👤 ${b.cliente_nome || 'N/A'} · 📐 ${b.area}m² · 📅 ${b.data_servico || '-'}
                    </div>
                    <div style="font-size: 0.65rem; color: #92400e; margin-bottom: 0.5rem;">
                      🗑️ Apagado por ${b.deleted_by_nome || 'N/A'} em ${data}
                    </div>
                    <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem;">
                      <button class="btn btn-sm" style="background: #10b981; color: white; font-size: 0.7rem; padding: 0.3rem 0.8rem;" onclick="restaurarBackupAgente(${b.id})">♻️ Restaurar</button>
                      <button class="btn btn-sm" style="background: #ef4444; color: white; font-size: 0.7rem; padding: 0.3rem 0.8rem;" onclick="apagarBackupAgente(${b.id})">🗑️ Apagar</button>
                    </div>
                  </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p style="color: #ef4444; text-align: center;">Erro ao carregar backups.</p>';
        }
    }

    window.restaurarBackupAgente = async (backupId) => {
        if (!confirm('Tem certeza que deseja restaurar este recibo?')) return;
        try {
            await api.post(`/servicos-backup/${backupId}/restaurar`);
            showSuccess('Recibo restaurado com sucesso!');
            carregarBackupsAgente();
        } catch (e) {
            showError('Erro ao restaurar: ' + (e.message || 'Erro desconhecido'));
        }
    };

    window.apagarBackupAgente = async (backupId) => {
        if (!confirm('⚠️ ATENÇÃO: Isto irá apagar este backup permanentemente.\n\nEsta ação é IRREVERSÍVEL. Deseja continuar?')) return;
        if (!confirm('Tem ABSOLUTA certeza? O backup será apagado para sempre.')) return;
        try {
            await api.delete(`/servicos-backup/${backupId}`);
            showSuccess('Backup apagado permanentemente!');
            carregarBackupsAgente();
        } catch (e) {
            showError('Erro ao apagar: ' + (e.message || 'Erro desconhecido'));
        }
    };

    document.getElementById('pesquisaGeralInput').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        const resultados = document.getElementById('pesquisaGeralResultados');
        if (!q) {
            resultados.innerHTML = '<p style="color: var(--gray); text-align: center; padding: 2rem;">Digite para pesquisar em todos os registos...</p>';
            return;
        }

        let html = '';

        // Search usuarios
        const usuariosEncontrados = usuarios.filter(u =>
            u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        );
        if (usuariosEncontrados.length > 0) {
            html += `<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.85rem; color: var(--primary); margin-bottom: 0.5rem; text-transform: uppercase;">👥 Utilizadores (${usuariosEncontrados.length})</h4>`;
            usuariosEncontrados.forEach(u => {
                html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; border-radius: var(--radius-md); cursor: pointer; transition: background 0.2s;" onmouseenter="this.style.background='var(--light)'" onmouseleave="this.style.background='transparent'" onclick="fecharPesquisaGeral(); document.querySelector('[data-admin-tab=\\'usuarios\\']').click();">
                    <span style="font-weight: 600; font-size: 0.9rem;">${u.nome}</span>
                    <span style="font-size: 0.75rem; color: var(--gray);">${u.email}</span>
                </div>`;
            });
            html += `</div>`;
        }

        // Search clientes
        const clientesEncontrados = clientesLista.filter(c =>
            c.nome.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)) || (c.telefone && c.telefone.includes(q))
        );
        if (clientesEncontrados.length > 0) {
            html += `<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.85rem; color: var(--accent); margin-bottom: 0.5rem; text-transform: uppercase;">✅ Clientes (${clientesEncontrados.length})</h4>`;
            clientesEncontrados.forEach(c => {
                html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; font-size: 0.9rem;">
                    <span style="font-weight: 600;">${c.nome}</span>
                    <span style="font-size: 0.75rem; color: var(--gray);">${c.email || c.telefone || '-'}</span>
                </div>`;
            });
            html += `</div>`;
        }

        // Search mensagens
        const msgsEncontradas = mensagens.filter(m =>
            m.nome.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.mensagem.toLowerCase().includes(q) || (m.assunto && m.assunto.toLowerCase().includes(q))
        );
        if (msgsEncontradas.length > 0) {
            html += `<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.85rem; color: #f59e0b; margin-bottom: 0.5rem; text-transform: uppercase;">📬 Mensagens (${msgsEncontradas.length})</h4>`;
            msgsEncontradas.forEach(m => {
                html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; font-size: 0.9rem;">
                    <span style="font-weight: 600;">${m.nome}</span>
                    <span style="font-size: 0.75rem; color: var(--gray);">${m.assunto || '—'}</span>
                </div>`;
            });
            html += `</div>`;
        }

        // Search servicos/pagamentos
        const servicosEncontrados = servicos.filter(s =>
            (s.cliente_nome && s.cliente_nome.toLowerCase().includes(q)) || (s.tipo_teto && s.tipo_teto.toLowerCase().includes(q))
        );
        if (servicosEncontrados.length > 0) {
            html += `<div style="margin-bottom: 1rem;"><h4 style="font-size: 0.85rem; color: var(--secondary); margin-bottom: 0.5rem; text-transform: uppercase;">📋 Serviços (${servicosEncontrados.length})</h4>`;
            servicosEncontrados.forEach(s => {
                html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0.5rem; font-size: 0.9rem;">
                    <span style="font-weight: 600;">${s.cliente_nome || 'N/A'}</span>
                    <span style="font-size: 0.75rem; color: var(--gray);">${s.tipo_teto || '—'} · ${s.area || '—'}m²</span>
                </div>`;
            });
            html += `</div>`;
        }

        if (!html) {
            html = '<p style="color: var(--gray); text-align: center; padding: 2rem;">Nenhum resultado encontrado para "<strong>' + q + '</strong>".</p>';
        }

        resultados.innerHTML = html;
    });

    // ==================== REPORTING SYSTEM LOGIC (ADMIN) ====================
    let relatorioChartAdmin = null;
    let dadosFiltradosAdmin = [];
    let periodoAtualAdmin = 'anual';
    let datasManuaisAdmin = false; // true quando o admin escolhe datas manualmente
    const seriesVisiveisAdmin = [true, true, true, true]; // [previstas, recebidas, despesas, lucro]

    // Inicializa datas padrão (ano atual)
    (function initAdminRelDatas() {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const inicio = document.getElementById('adminRelDataInicio');
        const fim = document.getElementById('adminRelDataFim');
        if (inicio) inicio.value = `${anoAtual}-01`;
        if (fim) fim.value = `${anoAtual}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    })();

    // Ao mudar o tipo de filtro, recalcula automaticamente o período
    document.getElementById('adminRelTipoFiltro')?.addEventListener('change', () => {
        datasManuaisAdmin = false;
        pesquisarRelatorioAdmin();
    });

    // Se o admin escolher datas manualmente, respeita as mesmas
    document.getElementById('adminRelDataInicio')?.addEventListener('change', () => { datasManuaisAdmin = true; });
    document.getElementById('adminRelDataFim')?.addEventListener('change', () => { datasManuaisAdmin = true; });

    window.abrirSistemaRelatoriosAdmin = () => {
        document.getElementById('relatoriosModalAdmin').style.display = 'block';
        pesquisarRelatorioAdmin();
    };

    window.fecharSistemaRelatoriosAdmin = () => {
        document.getElementById('relatoriosModalAdmin').style.display = 'none';
    };

    window.pesquisarRelatorioAdmin = () => {
        const tipoFiltro = document.getElementById('adminRelTipoFiltro')?.value || 'anual';
        const dataInicioVal = document.getElementById('adminRelDataInicio')?.value;
        const dataFimVal = document.getElementById('adminRelDataFim')?.value;
        const formaPagto = document.getElementById('adminRelFormaPagamento')?.value || '';
        const categoria = document.getElementById('adminRelCategoria')?.value || '';
        const centro = document.getElementById('adminRelCentro')?.value || '';

        periodoAtualAdmin = tipoFiltro;

        // Calcula o intervalo de datas conforme o tipo de filtro escolhido
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();
        let dataInicio, dataFim; // dataFim é exclusivo (fim do mês)

        if (datasManuaisAdmin && dataInicioVal && dataFimVal) {
            // Utilizador escolheu datas manualmente: respeita as mesmas
            const [ai, am] = dataInicioVal.split('-').map(Number);
            const [bi, bm] = dataFimVal.split('-').map(Number);
            dataInicio = new Date(ai, am - 1, 1);
            dataFim = new Date(bi, bm - 1, 1);
            dataFim.setMonth(dataFim.getMonth() + 1);
        } else {
            datasManuaisAdmin = false;

            if (tipoFiltro === 'mensal') {
                // Relatório do mês atual
                dataInicio = new Date(anoAtual, mesAtual, 1);
                dataFim = new Date(anoAtual, mesAtual + 1, 1);
            } else if (tipoFiltro === '6meses') {
                // Últimos 6 meses (incluindo o mês atual)
                dataInicio = new Date(anoAtual, mesAtual - 5, 1);
                dataFim = new Date(anoAtual, mesAtual + 1, 1);
            } else if (tipoFiltro === 'anual' || tipoFiltro === '1ano') {
                // Todo o ano atual
                dataInicio = new Date(anoAtual, 0, 1);
                dataFim = new Date(anoAtual + 1, 0, 1);
            } else {
                // Geral: todos os registos
                dataInicio = new Date(0);
                dataFim = new Date(anoAtual + 20, 0, 1);
            }

            // Sincroniza os campos de mês/ano visíveis com o período aplicado
            const inicioInput = document.getElementById('adminRelDataInicio');
            const fimInput = document.getElementById('adminRelDataFim');
            if (tipoFiltro === 'geral') {
                if (inicioInput) inicioInput.value = '';
                if (fimInput) fimInput.value = '';
            } else {
                if (inicioInput) inicioInput.value = `${dataInicio.getFullYear()}-${String(dataInicio.getMonth() + 1).padStart(2, '0')}`;
                // dataFim é exclusivo: mostra o último mês visível do período
                const fimVisivel = new Date(dataFim.getFullYear(), dataFim.getMonth() - 1, 1);
                if (fimInput) fimInput.value = `${fimVisivel.getFullYear()}-${String(fimVisivel.getMonth() + 1).padStart(2, '0')}`;
            }
        }

        let dados = [...servicos];

        // Aplica o intervalo de datas
        dados = dados.filter(s => {
            const d = new Date(s.data_servico || s.created_at);
            return d >= dataInicio && d < dataFim;
        });

        // Filtro por categoria
        if (categoria) dados = dados.filter(s => s.tipo_teto === categoria);

        // Filtro por forma de pagamento
        if (formaPagto === 'pago') dados = dados.filter(s => s.pago == 1 || s.status === 'pago');
        else if (formaPagto === 'pendente') dados = dados.filter(s => !s.pago || s.status !== 'pago');

        // Filtro por centro de custo (afeta apenas o que é mostrado nas despesas)
        dadosFiltradosAdmin = dados;
        dadosFiltradosAdmin._centroFiltro = centro;

        renderizarGraficoAdmin(dados, tipoFiltro, centro);
    };

    // Mantém compatibilidade com código antigo
    window.filtrarRelatoriosAdmin = (periodo) => {
        const sel = document.getElementById('adminRelTipoFiltro');
        if (sel) sel.value = periodo;
        pesquisarRelatorioAdmin();
    };

    window.toggleSerieAdmin = (idx) => {
        if (!relatorioChartAdmin) return;
        seriesVisiveisAdmin[idx] = !seriesVisiveisAdmin[idx];
        const ds = relatorioChartAdmin.data.datasets[idx];
        ds.hidden = !seriesVisiveisAdmin[idx];
        relatorioChartAdmin.update();

        const btns = ['btnToggleReceitasPrevistas', 'btnToggleReceitasRecebidas', 'btnToggleDespesas', 'btnToggleLucro'];
        const cores = ['#3b82f6', '#10b981', '#ef4444', '#7c3aed'];
        const btn = document.getElementById(btns[idx]);
        if (btn) {
            btn.style.opacity = seriesVisiveisAdmin[idx] ? '1' : '0.45';
        }
    };

    function renderizarGraficoAdmin(dados, periodo, centro) {
        const ctx = document.getElementById('relatorioGraficoAdmin').getContext('2d');
        if (relatorioChartAdmin) relatorioChartAdmin.destroy();

        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();

        // Constrói os períodos ("buckets") que aparecem no gráfico
        let buckets = []; // { label, inicio, fim } — fim é exclusivo

        if (periodo === 'mensal') {
            // Mês atual: um ponto (barra) por dia
            const ref = dados.length > 0 ? new Date(dados[0].data_servico || dados[0].created_at) : hoje;
            const anoM = ref.getFullYear();
            const mesM = ref.getMonth();
            const diasNoMes = new Date(anoM, mesM + 1, 0).getDate();
            for (let dia = 1; dia <= diasNoMes; dia++) {
                buckets.push({
                    label: new Date(anoM, mesM, dia).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' }),
                    inicio: new Date(anoM, mesM, dia),
                    fim: new Date(anoM, mesM, dia + 1)
                });
            }
        } else if (periodo === '6meses') {
            // Últimos 6 meses incluindo o mês atual (um ponto por mês)
            for (let i = 5; i >= 0; i--) {
                const d = new Date(anoAtual, mesAtual - i, 1);
                buckets.push({
                    label: d.toLocaleDateString('pt-MZ', { month: 'short' }) + '/' + d.getFullYear(),
                    inicio: new Date(d.getFullYear(), d.getMonth(), 1),
                    fim: new Date(d.getFullYear(), d.getMonth() + 1, 1)
                });
            }
        } else if (periodo === 'anual' || periodo === '1ano') {
            // Todos os 12 meses do ano atual (um ponto por mês)
            for (let mes = 0; mes < 12; mes++) {
                buckets.push({
                    label: new Date(anoAtual, mes, 1).toLocaleDateString('pt-MZ', { month: 'short' }),
                    inicio: new Date(anoAtual, mes, 1),
                    fim: new Date(anoAtual, mes + 1, 1)
                });
            }
        } else {
            // geral: agrupa por mês/ano com base nos dados existentes
            const mapaKeys = {};
            dados.forEach(s => {
                const d = new Date(s.data_servico || s.created_at);
                const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                if (!mapaKeys[key]) {
                    mapaKeys[key] = {
                        label: d.toLocaleDateString('pt-MZ', { month: 'short' }) + '/' + d.getFullYear(),
                        inicio: new Date(d.getFullYear(), d.getMonth(), 1),
                        fim: new Date(d.getFullYear(), d.getMonth() + 1, 1)
                    };
                }
            });
            buckets = Object.keys(mapaKeys)
                .sort((a, b) => {
                    const [ya, ma] = a.split('-').map(Number);
                    const [yb, mb] = b.split('-').map(Number);
                    return (ya - yb) || (ma - mb);
                })
                .map(k => mapaKeys[k]);
        }

        // Agrega os valores por período
        const mapaP = {}, mapaR = {}, mapaD = {}, mapaL = {};
        buckets.forEach(b => { mapaP[b.label] = 0; mapaR[b.label] = 0; mapaD[b.label] = 0; mapaL[b.label] = 0; });

        dados.forEach(s => {
            const d = new Date(s.data_servico || s.created_at);
            const bucket = buckets.find(b => d >= b.inicio && d < b.fim);
            if (!bucket) return;
            const chave = bucket.label;
            const valor = s.valor_total || 0;

            // Receitas Previstas = valor total gerado
            mapaP[chave] += valor;

            // Receitas Recebidas = apenas pagos
            if (s.pago == 1 || s.status === 'pago') mapaR[chave] += valor;

            // Despesas da Empresa = materiais ou mão de obra (conforme centro de custo)
            if (!centro || centro === 'materiais') mapaD[chave] += (s.valor_materiais || 0);
            if (!centro || centro === 'mao_obra') mapaD[chave] += (s.valor_mao_obra || 0);

            // Lucro da Empresa (2% a 10% progressivo)
            const percentualLucro = calcularPercentualLucro(valor);
            mapaL[chave] += valor * (percentualLucro / 100);
        });

        const labels = buckets.map(b => b.label);

        // Atualiza a legenda do eixo X conforme o tipo de filtro
        const eixoLabel = document.getElementById('adminRelEixoLabel');
        if (eixoLabel) eixoLabel.textContent = periodo === 'mensal' ? 'Dia do Mês' : 'Mês';

        relatorioChartAdmin = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Receitas Previstas',
                        data: labels.map(l => mapaP[l] || 0),
                        backgroundColor: 'rgba(59, 130, 246, 0.85)',
                        borderColor: '#3b82f6',
                        borderWidth: 0,
                        borderRadius: 3,
                        hidden: !seriesVisiveisAdmin[0]
                    },
                    {
                        label: 'Receitas Recebidas',
                        data: labels.map(l => mapaR[l] || 0),
                        backgroundColor: 'rgba(16, 185, 129, 0.85)',
                        borderColor: '#10b981',
                        borderWidth: 0,
                        borderRadius: 3,
                        hidden: !seriesVisiveisAdmin[1]
                    },
                    {
                        label: 'Despesas da Empresa',
                        data: labels.map(l => mapaD[l] || 0),
                        backgroundColor: 'rgba(239, 68, 68, 0.85)',
                        borderColor: '#ef4444',
                        borderWidth: 0,
                        borderRadius: 3,
                        hidden: !seriesVisiveisAdmin[2]
                    },
                    {
                        label: 'Lucro da Empresa',
                        data: labels.map(l => mapaL[l] || 0),
                        backgroundColor: 'rgba(124, 58, 237, 0.85)',
                        borderColor: '#7c3aed',
                        borderWidth: 0,
                        borderRadius: 3,
                        hidden: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y || 0)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { size: 11 }, color: '#6b7280' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.06)' },
                        ticks: {
                            font: { size: 11 },
                            color: '#6b7280',
                            callback: v => `MT ${v.toLocaleString('pt-MZ', { maximumFractionDigits: 0 })}`
                        }
                    }
                }
            }
        });

        // Resumo financeiro do período filtrado
        atualizarResumoFinanceiro(dados, centro);
    }

    // ==================== CÁLCULO DE LUCRO PROGRESSIVO (2% a 10%) ====================
    // Percentagem de lucro baseada no valor do serviço:
    // - Valores baixos → 2%
    // - Valores altos → até 10%
    function calcularPercentualLucro(valor) {
        // Escala: 0 MT → 2%, 250.000+ MT → 10%
        // Fórmula linear: percentual = 2 + (valor / 250000) * 8
        const percentual = 2 + (valor / 250000) * 8;
        return Math.min(10, Math.max(2, percentual));
    }

    // Tabela de referência das percentagens
    function getLabelPercentual(valor) {
        const pct = calcularPercentualLucro(valor);
        return `${pct.toFixed(1)}%`;
    }

    function atualizarResumoFinanceiro(dados, centro) {
        let totalRecebido = 0;
        let totalPendente = 0;
        let totalDespesas = 0;
        let totalGerado = 0;
        let totalLucro = 0;

        dados.forEach(s => {
            const valor = s.valor_total || 0;
            totalGerado += valor;

            if (s.pago == 1 || s.status === 'pago') totalRecebido += valor;
            else totalPendente += valor;

            if (!centro || centro === 'materiais') totalDespesas += (s.valor_materiais || 0);
            if (!centro || centro === 'mao_obra') totalDespesas += (s.valor_mao_obra || 0);

            // Calcular lucro com percentagem progressiva
            const percentualLucro = calcularPercentualLucro(valor);
            totalLucro += valor * (percentualLucro / 100);
        });

        const definir = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.textContent = formatCurrency(valor);
        };

        definir('adminRelTotalRecebido', totalRecebido);
        definir('adminRelTotalPendente', totalPendente);
        definir('adminRelTotalDespesas', totalDespesas);
        definir('adminRelTotalGerado', totalGerado);

        const lucroEl = document.getElementById('adminRelLucro');
        if (lucroEl) {
            lucroEl.textContent = formatCurrency(totalLucro);
            lucroEl.style.color = totalLucro >= 0 ? '#16a34a' : '#dc2626';
        }

        // Mostrar detalhes da percentagem utilizada
        const detalheLucroEl = document.getElementById('adminRelLucroDetalhe');
        if (detalheLucroEl) {
            if (dados.length > 0) {
                const valores = dados.map(s => s.valor_total || 0);
                const menorValor = Math.min(...valores);
                const maiorValor = Math.max(...valores);
                const pctMin = calcularPercentualLucro(menorValor);
                const pctMax = calcularPercentualLucro(maiorValor);
                detalheLucroEl.textContent = `Faixa: ${pctMin.toFixed(1)}% a ${pctMax.toFixed(1)}% (${dados.length} serviços)`;
            } else {
                detalheLucroEl.textContent = 'Sem dados';
            }
        }
    }

    window.atualizarRelatorioAdmin = async () => {
        try {
            const [resS, resE] = await Promise.all([
                api.get('/servicos'),
                api.get('/relatorios/estatisticas')
            ]);
            servicos = resS.servicos || [];
            estatisticas = resE.estatisticas || {};

            const statsCards = document.querySelector('.grid.grid-4.mb-3');
            if (statsCards) {
                const filhos = statsCards.children;
                if (filhos[1]) filhos[1].querySelector('h3').textContent = estatisticas.total_servicos || 0;
                if (filhos[2]) filhos[2].querySelector('h3').textContent = new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(estatisticas.valor_total_faturado || 0);
            }

            pesquisarRelatorioAdmin();
            showSuccess('Relatorio actualizado!');
        } catch (error) {
            showError('Erro ao actualizar relatorio');
        }
    };

    window.exportarRelatorioAtualAdmin = (tipo) => {
        if (dadosFiltradosAdmin.length === 0) {
            showError("Nenhum dado encontrado para o período selecionado.");
            return;
        }

        const titulo = `Relatório Geral (Admin) - ${periodoAtualAdmin.toUpperCase()}`;

        if (tipo === 'excel') {
            try {
                const mapData = dadosFiltradosAdmin.map(s => ({
                    'ID': s.id,
                    'Data': new Date(s.data_servico || s.created_at).toLocaleDateString('pt-MZ'),
                    'Cliente': s.cliente_nome || 'N/A',
                    'Tipo de Teto': s.tipo_teto,
                    'Área (m²)': s.area,
                    'Valor Total': s.valor_total,
                    'Status': s.status || 'pendente'
                }));
                const ws = XLSX.utils.json_to_sheet(mapData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Relatório Admin");
                XLSX.writeFile(wb, `Relatorio_Admin_${periodoAtualAdmin}.xlsx`);
            } catch (e) { console.error(e); showError("Erro ao exportar Excel."); }
        } else if (tipo === 'pdf') {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                doc.setFontSize(16);
                doc.setTextColor(0, 0, 0);
                doc.text(titulo, 14, 20);

                let totalValor = 0;
                doc.setFontSize(10);
                let y = 30;

                dadosFiltradosAdmin.forEach((s, i) => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    const dataStr = new Date(s.data_servico || s.created_at).toLocaleDateString('pt-MZ');
                    totalValor += s.valor_total;
                    doc.setFont("helvetica", "bold");
                    doc.text(`Serviço #${s.id} - ${s.cliente_nome || 'N/A'}`, 14, y);
                    y += 6;
                    doc.setFont("helvetica", "normal");
                    doc.text(`Data: ${dataStr} | Teto: ${s.tipo_teto} | Área: ${s.area}m² | Total: ${formatCurrency(s.valor_total)}`, 14, y);
                    y += 10;
                });

                doc.setFont("helvetica", "bold");
                doc.text(`TOTAL FATURADO NO PERÍODO: ${formatCurrency(totalValor)}`, 14, y + 10);

                doc.save(`Relatorio_Admin_${periodoAtualAdmin}.pdf`);
            } catch (e) { console.error(e); showError("Erro ao exportar PDF."); }
        }
    };

    // ==================== DELETE USER ====================
    document.querySelectorAll('.btn-delete-user').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            if (!confirm('Tem certeza que deseja excluir este utilizador?')) return;
            try {
                await api.delete(`/usuarios/${userId}`);
                showSuccess('Utilizador excluído!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== DELETE CLIENTE ====================
    document.querySelectorAll('.btn-delete-cliente').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.userId;
            if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
            try {
                await api.delete(`/usuarios/${userId}`);
                showSuccess('Cliente excluído!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== DELETE CLIENTE SATISFEITO ====================
    document.querySelectorAll('.btn-delete-cliente-satisfeito').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.clienteId;
            if (!confirm('Tem certeza que deseja excluir este cliente satisfeito?')) return;
            try {
                await api.delete(`/clientes/${id}`);
                showSuccess('Cliente satisfeito excluído!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== MARK MESSAGE AS READ ====================
    document.querySelectorAll('.btn-marcar-lida').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.msgId;
            try {
                await api.put(`/contact/${id}/read`);
                showSuccess('Mensagem marcada como lida');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== REPLY TO MESSAGE ====================
    document.querySelectorAll('.btn-responder-msg').forEach(btn => {
        btn.addEventListener('click', () => {
            const msgId = btn.dataset.msgId;
            const msgNome = btn.dataset.msgNome;

            let orcamentoAnexado = null;

            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div style="background: white; border-radius: var(--radius-xl); padding: 2rem; max-width: 550px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 700; margin: 0;">Responder a ${msgNome}</h3>
                        <button class="close-modal-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <form id="formResponderMsg">
                        <div class="form-group">
                            <label class="form-label">Sua Resposta</label>
                            <textarea class="form-input" id="respostaTexto" rows="5" placeholder="Escreva sua resposta..." style="width: 100%; resize: vertical;" required></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Anexar Orçamento (opcional)</label>
                            <div id="orcamentoAnexoInfo" style="display: none; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 0.75rem;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <span style="font-size: 0.8rem; color: var(--gray);">📎 Orçamento selecionado:</span>
                                        <p id="orcamentoAnexoDetalhes" style="font-weight: 600; margin: 0.25rem 0 0 0; font-size: 0.9rem;"></p>
                                    </div>
                                    <button type="button" id="btnRemoverOrcamento" style="background: #ef4444; color: white; padding: 0.25rem 0.6rem; border-radius: var(--radius-md); font-size: 0.75rem; border: none; cursor: pointer;">Remover</button>
                                </div>
                            </div>
                            <button type="button" id="btnAnexarOrcamento" style="background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; border: none; cursor: pointer; width: 100%;">🔗 Selecionar Orçamento</button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Anexar Recibo (PDF/imagem, opcional)</label>
                            <input type="file" class="form-input" id="anexoRecibo" accept=".pdf,.jpg,.jpeg,.png,.gif" style="padding: 0.5rem;">
                            <small style="color: var(--gray); font-size: 0.8rem;">Formatos aceites: PDF, JPG, PNG, GIF</small>
                        </div>
                        <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.875rem;">
                                Enviar Resposta
                            </button>
                            <button type="button" class="close-modal-btn btn" style="background: #6b7280; color: white; padding: 0.875rem 1.5rem; border-radius: var(--radius-lg); font-weight: 600;">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelectorAll('.close-modal-btn').forEach(b => {
                b.addEventListener('click', () => modal.remove());
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            modal.querySelector('#btnAnexarOrcamento').addEventListener('click', () => {
                const modalOrc = document.createElement('div');
                modalOrc.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10001;';
                modalOrc.innerHTML = `
                    <div style="background: white; border-radius: var(--radius-xl); padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="font-weight: 700; margin: 0;">Selecionar Orçamento</h3>
                            <button class="close-orc-modal-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <input type="text" id="searchOrcamento" class="form-input" placeholder="🔍 Pesquisar por cliente..." style="width: 100%; padding: 0.6rem 1rem;">
                        </div>
                        <div id="orcamentosLista">
                            ${servicos.length > 0 ? servicos.map(s => {
                    const tipoMap = { 'gesso': 'Gesso', 'pvc': 'PVC', 'modular': 'Modular' };
                    return `
                                <div class="orcamento-item" data-orc-id="${s.id}" style="padding: 0.75rem; border: 1px solid var(--light); border-radius: var(--radius-md); margin-bottom: 0.5rem; cursor: pointer; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong>#${s.id}</strong> - ${s.cliente_nome || 'N/A'}
                                        <br>
                                        <span style="font-size: 0.8rem; color: var(--gray);">${tipoMap[s.tipo_teto] || s.tipo_teto} · ${s.area} m² · ${formatCurrency(s.valor_total)}</span>
                                    </div>
                                    <span style="font-size: 0.8rem; color: var(--gray);">${new Date(s.data_servico).toLocaleDateString('pt-MZ')}</span>
                                </div>
                                `;
                }).join('') : '<p style="text-align: center; color: var(--gray); padding: 2rem;">Nenhum orçamento encontrado.</p>'}
                        </div>
                    </div>
                `;
                document.body.appendChild(modalOrc);

                modalOrc.querySelectorAll('.close-orc-modal-btn').forEach(b => {
                    b.addEventListener('click', () => modalOrc.remove());
                });
                modalOrc.addEventListener('click', (e) => { if (e.target === modalOrc) modalOrc.remove(); });

                modalOrc.querySelector('#searchOrcamento').addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase();
                    modalOrc.querySelectorAll('.orcamento-item').forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(term) ? '' : 'none';
                    });
                });

                modalOrc.querySelectorAll('.orcamento-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const orcId = parseInt(item.dataset.orcId);
                        const orc = servicos.find(s => s.id === orcId);
                        if (orc) {
                            orcamentoAnexado = orc;
                            const tipoMap = { 'gesso': 'Gesso', 'pvc': 'PVC', 'modular': 'Modular' };
                            document.getElementById('orcamentoAnexoDetalhes').textContent = `#${orc.id} - ${orc.cliente_nome || 'N/A'} · ${tipoMap[orc.tipo_teto] || orc.tipo_teto} · ${formatCurrency(orc.valor_total)}`;
                            document.getElementById('orcamentoAnexoInfo').style.display = 'block';
                        }
                        modalOrc.remove();
                    });
                });
            });

            modal.querySelector('#btnRemoverOrcamento').addEventListener('click', () => {
                orcamentoAnexado = null;
                document.getElementById('orcamentoAnexoInfo').style.display = 'none';
            });

            modal.querySelector('#formResponderMsg').addEventListener('submit', async (e) => {
                e.preventDefault();
                const resposta = document.getElementById('respostaTexto').value.trim();
                if (!resposta) {
                    showError('Escreva uma resposta antes de enviar.');
                    return;
                }
                try {
                    const formData = new FormData();
                    formData.append('resposta', resposta);
                    if (orcamentoAnexado) {
                        formData.append('resposta_orcamento_id', orcamentoAnexado.id);
                    }
                    const fileInput = document.getElementById('anexoRecibo');
                    if (fileInput && fileInput.files.length > 0) {
                        formData.append('anexo', fileInput.files[0]);
                    }
                    await api.uploadFile(`/contact/${msgId}/reply`, formData, 'PUT');
                    showSuccess('Resposta enviada com sucesso!');
                    modal.remove();
                } catch (error) {
                    showError(error.message);
                }
            });
        });
    });

    // ==================== VIEW ATTACHED RECIBO ====================
    document.querySelectorAll('.btn-ver-recibo-anexado').forEach(btn => {
        btn.addEventListener('click', () => {
            const orcId = parseInt(btn.dataset.orcId);
            const orc = servicos.find(s => s.id === orcId);
            if (orc) {
                gerarReciboPDF(
                    orc.tipo_teto,
                    orc.area,
                    orc.largura || 0,
                    orc.comprimento || 0,
                    orc.valor_materiais,
                    orc.valor_mao_obra,
                    orc.cliente_nome
                );
            }
        });
    });

    // ==================== DELETE MESSAGE ====================
    document.querySelectorAll('.btn-deletar-msg').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.msgId;
            if (!confirm('Excluir esta mensagem?')) return;
            try {
                await api.delete(`/contact/${id}`);
                showSuccess('Mensagem excluída');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== UPDATE PRICE ====================
    document.querySelectorAll('.btn-atualizar-preco').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.precoId;
            const input = document.querySelector(`.preco-input[data-preco-id="${id}"]`);
            const preco = parseFloat(input.value);
            if (isNaN(preco) || preco <= 0) {
                showError('Preço inválido');
                return;
            }
            try {
                await api.put(`/precos/${id}`, { preco });
                showSuccess('Preço actualizado!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== VER TUDO / VOLTAR PREÇOS ====================
    const btnVerTudo = document.getElementById('btnVerTudoPrecos');
    const btnVoltar = document.getElementById('btnVoltarCategoria');
    if (btnVerTudo) {
        btnVerTudo.addEventListener('click', () => {
            document.getElementById('precosPorCategoria').style.display = 'none';
            document.getElementById('precosTudo').style.display = 'block';
        });
    }
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            document.getElementById('precosPorCategoria').style.display = 'block';
            document.getElementById('precosTudo').style.display = 'none';
        });
    }

    // ==================== IMPRIMIR PREÇOS PDF ====================
    document.getElementById('btnImprimirPrecos')?.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showError('Biblioteca PDF não carregada.');
            return;
        }

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;

        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.setFont(undefined, 'bold');
        doc.text('Tabela de Preços - Tecto Falso Sabao', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-MZ')}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        categoriasPrecos.forEach(cat => {
            if (yPos > 180) {
                doc.addPage();
                yPos = 20;
            }

            const catNome = cat === 'gesso' ? 'Gesso' : cat === 'pvc' ? 'PVC' : cat === 'modular' ? 'Modular' : 'Serviços';
            doc.setFontSize(12);
            doc.setTextColor(79, 70, 229);
            doc.setFont(undefined, 'bold');
            doc.text(catNome, margin, yPos);
            yPos += 8;

            const itens = precos.filter(p => p.categoria === cat);
            itens.forEach(item => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFontSize(9);
                doc.setTextColor(50, 50, 50);
                doc.setFont(undefined, 'normal');
                doc.text(`• ${item.item} (${item.unidade})`, margin + 5, yPos);
                doc.text(`${item.preco.toFixed(2)} MZN`, pageWidth - margin - 5, yPos, { align: 'right' });
                yPos += 6;
            });
            yPos += 5;
        });

        doc.save(`Tabela_Precos_${new Date().getTime()}.pdf`);
        showSuccess('PDF gerado com sucesso!');
    });

    // ==================== UPDATE CONFIG ====================
    document.getElementById('formConfig').addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('.config-input');
        let success = true;
        for (const input of inputs) {
            try {
                await api.put(`/configuracoes/${input.dataset.chave}`, { valor: input.value });
            } catch (error) {
                showError(`Erro ao salvar ${input.dataset.chave}`);
                success = false;
            }
        }
        if (success) showSuccess('Configurações salvas!');
    });

    // ==================== GUARDAR DADOS FUNCIONÁRIO ====================
    document.querySelectorAll('.btn-guardar-func').forEach(btn => {
        btn.addEventListener('click', async () => {
            const funcId = btn.dataset.funcId;
            const salario = parseFloat(document.querySelector(`.input-salario[data-func-id="${funcId}"]`).value) || 0;
            const endereco = document.querySelector(`.input-endereco[data-func-id="${funcId}"]`).value;
            try {
                await api.put(`/usuarios/${funcId}/dados`, { salario, endereco });
                showSuccess('Dados guardados com sucesso!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== EDITAR FUNCIONÁRIO ====================
    document.querySelectorAll('.btn-editar-func').forEach(btn => {
        btn.addEventListener('click', () => {
            const funcId = btn.dataset.funcId;
            const nome = btn.dataset.funcNome;
            const email = btn.dataset.funcEmail;
            const telefone = btn.dataset.funcTelefone;
            const salario = btn.dataset.funcSalario;
            const endereco = btn.dataset.funcEndereco;
            const conta = btn.dataset.funcConta;
            const banco = btn.dataset.funcBanco || '';
            const tipo = btn.dataset.funcTipo || '';
            const foto = btn.dataset.funcFoto || '';

            const bancoOptions = ['', 'BIM', 'BCI', 'Standard Bank'].map(b =>
                `<option value="${b}" ${banco === b ? 'selected' : ''}>${b || 'Selecionar banco...'}</option>`
            ).join('');

            const tipoOptions = ['', 'mpesa', 'emola', 'emick'].map(t =>
                `<option value="${t}" ${tipo === t ? 'selected' : ''}>${t ? ({ mpesa: 'M-Pesa', emola: 'E-Mola', emick: 'E-Micks' }[t] || t) : 'Selecionar...'}</option>`
            ).join('');

            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div style="background: white; border-radius: var(--radius-xl); padding: 2rem; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 700; margin: 0;">✏️ Editar Funcionário</h3>
                        <button class="close-modal-btn" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <form id="formEditarFuncionario">
                        ${foto ? `<div style="text-align: center; margin-bottom: 1rem;"><img src="${foto}" alt="Foto" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);"></div>` : ''}
                        <div class="form-group">
                            <label class="form-label">Nome Completo</label>
                            <input type="text" class="form-input" id="editFuncNome" value="${nome}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-input" id="editFuncEmail" value="${email}" required maxlength="54">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone</label>
                            <input type="tel" class="form-input" id="editFuncTelefone" value="${telefone}" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Salário (MZN)</label>
                            <input type="number" class="form-input" id="editFuncSalario" value="${salario}" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Endereço</label>
                            <input type="text" class="form-input" id="editFuncEndereco" value="${endereco}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Foto</label>
                            <input type="file" class="form-input" id="editFuncFoto" accept="image/*" style="padding: 0.5rem;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Banco</label>
                            <select class="form-select" id="editFuncBanco">${bancoOptions}</select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nº Conta Bancária</label>
                            <input type="text" class="form-input" id="editFuncConta" value="${conta}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Carteira Móvel</label>
                            <select class="form-select" id="editFuncTipoConta">${tipoOptions}</select>
                        </div>
                        <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1; padding: 0.875rem;">
                                💾 Salvar Alterações
                            </button>
                            <button type="button" class="close-modal-btn btn" style="background: #6b7280; color: white; padding: 0.875rem 1.5rem; border-radius: var(--radius-lg); font-weight: 600;">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelectorAll('.close-modal-btn').forEach(b => {
                b.addEventListener('click', () => modal.remove());
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            modal.querySelector('#formEditarFuncionario').addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    nome: document.getElementById('editFuncNome').value,
                    email: document.getElementById('editFuncEmail').value,
                    telefone: document.getElementById('editFuncTelefone').value
                };
                try {
                    await api.put(`/usuarios/${funcId}`, data);
                    const salarioVal = parseFloat(document.getElementById('editFuncSalario').value) || 0;
                    const enderecoVal = document.getElementById('editFuncEndereco').value;
                    const contaVal = document.getElementById('editFuncConta').value;
                    const bancoVal = document.getElementById('editFuncBanco').value || null;
                    const tipoVal = document.getElementById('editFuncTipoConta').value || null;
                    await api.put(`/usuarios/${funcId}/dados`, { salario: salarioVal, endereco: enderecoVal, numero_conta: contaVal, banco: bancoVal, tipo_conta: tipoVal });
                    // Upload foto if selected
                    const fotoInput = document.getElementById('editFuncFoto');
                    if (fotoInput && fotoInput.files.length > 0) {
                        const formData = new FormData();
                        formData.append('foto', fotoInput.files[0]);
                        await api.uploadFile(`/usuarios/${funcId}/foto`, formData);
                    }
                    showSuccess('Funcionário actualizado com sucesso!');
                    modal.remove();
                } catch (error) {
                    showError(error.message);
                }
            });
        });
    });

    // ==================== CALENDÁRIO DE FALTAS ====================
    document.querySelectorAll('.btn-calendario-faltas').forEach(btn => {
        btn.addEventListener('click', () => {
            const funcId = parseInt(btn.dataset.funcId);
            const funcNome = btn.dataset.funcNome;
            const faltasFunc = faltas.filter(f => f.usuario_id === funcId);

            let currentMonth = new Date().getMonth();
            let currentYear = new Date().getFullYear();

            function getFaltasMes() {
                return faltasFunc.filter(f => {
                    const d = new Date(f.data);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });
            }

            function calcularDesconto(falta, empId) {
                const emp = usuarios.find(u => u.id === empId);
                const salario = emp ? (emp.salario || 0) : 0;
                const diasUteisMes = 22;
                const valorDia = salario / diasUteisMes;
                return valorDia * getFatorDesconto(falta.tipo_falta);
            }

            function renderCalendar() {
                const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                const faltasMes = getFaltasMes();

                let grid = weekDays.map(d => `<div style="text-align:center;font-size:0.7rem;font-weight:600;color:var(--gray);padding:4px 0;">${d}</div>`).join('');
                for (let d = 0; d < firstDay; d++) {
                    grid += '<div class="cal-day cal-day-empty"></div>';
                }
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const falta = faltasMes.find(f => f.data === dateStr);
                    const isF = !!falta && !falta.justificada;
                    const isJustified = falta?.justificada;
                    const tipoFalta = falta?.tipo_falta || '';
                    let tipoLabel = '';
                    if (tipoFalta === 'meio_dia') tipoLabel = '½';
                    else if (tipoFalta === 'atrazo') tipoLabel = 'A';
                    const statusLabel = isF ? (tipoLabel || 'F') : 'P';
                    const tipo = falta?.tipo || '';
                    const obs = falta?.observacao || '';
                    const faltaId = falta?.id;

                    grid += `
                        <div class="cal-day ${isF ? 'cal-day-f' : 'cal-day-p'}" data-date="${dateStr}" data-falta-id="${faltaId || ''}" data-tipo="${tipo}" data-tipo-falta="${tipoFalta}" data-obs="${obs}" data-justificada="${isJustified ? 1 : 0}">
                            <span class="cal-day-num">${day}</span>
                            <span class="cal-day-status">${statusLabel}</span>
                        </div>
                    `;
                }

                const listaFaltas = faltasMes.length > 0 ? faltasMes.map(f => {
                    const tipoFaltaLabel = getLabelTipoFalta(f.tipo_falta);
                    const desconto = calcularDesconto(f, funcId);
                    return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid var(--light-200); font-size: 0.85rem;">
                        <span>${new Date(f.data).toLocaleDateString('pt-MZ')} <span style="font-size: 0.75rem; color: var(--gray);">(${tipoFaltaLabel})</span></span>
                        <span style="color: ${f.justificada ? '#10b981' : '#ef4444'}; font-weight: 600;">${f.justificada ? (f.tipo ? `Justif. - ${f.tipo}` : 'Justificada') : 'Pendente'}</span>
                        <span style="color: var(--gray); font-size: 0.78rem;">${f.observacao || ''}</span>
                        <span style="color: #ef4444; font-size: 0.78rem; font-weight: 600;">${!f.justificada ? `-${formatCurrency(desconto)}` : ''}</span>
                        ${!f.justificada ? `<button class="btn-justificar-falta-sm" data-falta-id="${f.id}" style="background: #10b981; color: white; padding: 0.2rem 0.5rem; border-radius: var(--radius-md); font-size: 0.7rem; border: none; cursor: pointer;">Justificar</button>` : ''}
                        <button class="btn-apagar-falta-sm" data-falta-id="${f.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;" title="Apagar falta">&times;</button>
                    </div>`;
                }).join('') : '<p style="color: var(--gray); text-align: center; font-size: 0.85rem; padding: 0.5rem 0;">Nenhuma falta este mês.</p>';

                document.getElementById('calFaltasGrid').innerHTML = grid;
                document.getElementById('calFaltasTitulo').textContent = `${monthNames[currentMonth]} ${currentYear}`;
                document.getElementById('calFaltasLista').innerHTML = listaFaltas;

                const totalDescontoMes = faltasMes.filter(f => !f.justificada).reduce((sum, fa) => {
                    const emp = usuarios.find(u => u.id === funcId);
                    const salario = emp ? (emp.salario || 0) : 0;
                    const valorDia = salario / 22;
                    return sum + valorDia * getFatorDesconto(fa.tipo_falta);
                }, 0);
                document.getElementById('calFaltasTotalDesconto').textContent = totalDescontoMes > 0 ? `Total Desconto: -${formatCurrency(totalDescontoMes)}` : '';

                // Clique nos dias
                document.querySelectorAll('.cal-day:not(.cal-day-empty)').forEach(cell => {
                    cell.addEventListener('click', async () => {
                        const dateStr = cell.dataset.date;
                        const faltaId = cell.dataset.faltaId;
                        const isJustified = cell.dataset.justificada === '1';
                        const tipo = cell.dataset.tipo;
                        const isF = cell.classList.contains('cal-day-f');

                        if (isF) {
                            // Falta pendente → justificar ou apagar
                            const acao = confirm(`Falta pendente em ${new Date(dateStr).toLocaleDateString('pt-MZ')}\nClique OK para justificar, Cancelar para apagar.`);
                            if (acao) {
                                const tipoJust = prompt('Tipo de justificação (Doença, Férias, Pessoal, Outro):', tipo || 'Doença');
                                if (!tipoJust) return;
                                try {
                                    await api.put(`/faltas/${faltaId}/justificar`, { tipo: tipoJust });
                                    showSuccess('Falta justificada!');
                                    modal.remove();
                                } catch (error) {
                                    showError(error.message);
                                }
                            } else {
                                if (confirm(`Tem certeza que deseja apagar a falta de ${new Date(dateStr).toLocaleDateString('pt-MZ')}?`)) {
                                    try {
                                        await api.delete(`/faltas/${faltaId}`);
                                        showSuccess('Falta removida!');
                                        modal.remove();
                                    } catch (error) {
                                        showError(error.message);
                                    }
                                }
                            }
                        } else if (faltaId && isJustified) {
                            // Falta justificada (mostra P) → opção de reverter ou apagar
                            const acao = confirm(`Falta justificada${tipo ? ` (${tipo})` : ''} em ${new Date(dateStr).toLocaleDateString('pt-MZ')}\nClique OK para reverter justificação, Cancelar para apagar.`);
                            if (acao) {
                                try {
                                    await api.put(`/faltas/${faltaId}/justificar`, { justificada: 0 });
                                    showSuccess('Justificação revertida!');
                                    modal.remove();
                                } catch (error) {
                                    showError(error.message);
                                }
                            } else {
                                if (confirm(`Apagar falta de ${new Date(dateStr).toLocaleDateString('pt-MZ')}?`)) {
                                    try {
                                        await api.delete(`/faltas/${faltaId}`);
                                        showSuccess('Falta removida!');
                                        modal.remove();
                                    } catch (error) {
                                        showError(error.message);
                                    }
                                }
                            }
                        } else {
                            // P → marcar falta com botoes para escolher tipo
                            const subModal = document.createElement('div');
                            subModal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 11000;';
                            subModal.innerHTML = `
                                <div style="background: white; border-radius: var(--radius-xl); padding: 1.5rem; max-width: 380px; width: 90%; text-align: center;">
                                    <h4 style="font-weight: 700; margin-bottom: 0.25rem;">${new Date(dateStr).toLocaleDateString('pt-MZ')}</h4>
                                    <p style="color: var(--gray); font-size: 0.85rem; margin-bottom: 1.25rem;">Selecione o tipo de falta</p>
                                    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap;">
                                        <button id="subBtnDiaInteiro" style="flex: 1; min-width: 100px; padding: 0.65rem 0.5rem; border: 2px solid var(--primary); border-radius: var(--radius-lg); background: white; color: var(--primary); font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='var(--primary)';this.style.color='white'" onmouseleave="this.style.background='white';this.style.color='var(--primary)'">Dia Inteiro</button>
                                        <button id="subBtnMeioDia" style="flex: 1; min-width: 100px; padding: 0.65rem 0.5rem; border: 2px solid #f59e0b; border-radius: var(--radius-lg); background: white; color: #f59e0b; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='#f59e0b';this.style.color='white'" onmouseleave="this.style.background='white';this.style.color='#f59e0b'">½ Meio Dia</button>
                                        <button id="subBtnAtrazo" style="flex: 1; min-width: 100px; padding: 0.65rem 0.5rem; border: 2px solid #ef4444; border-radius: var(--radius-lg); background: white; color: #ef4444; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;" onmouseenter="this.style.background='#ef4444';this.style.color='white'" onmouseleave="this.style.background='white';this.style.color='#ef4444'">⏰ Atrazo</button>
                                    </div>
                                    <input type="text" id="subObsInput" class="form-input" placeholder="Observação (opcional)" style="width: 100%; padding: 0.5rem 0.75rem; font-size: 0.85rem; margin-bottom: 0.75rem;">
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button id="subBtnCancelar" style="flex: 1; padding: 0.5rem; border: 1px solid var(--light-200); border-radius: var(--radius-lg); background: white; color: var(--gray); font-size: 0.85rem; cursor: pointer;">Cancelar</button>
                                        <button id="subBtnConfirmar" style="flex: 1; padding: 0.5rem; border: none; border-radius: var(--radius-lg); background: var(--primary); color: white; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Confirmar</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(subModal);

                            let selectedTipoFalta = 'dia_inteiro';

                            function resetSubBtns() {
                                const subBtnDiaInteiro = document.getElementById('subBtnDiaInteiro');
                                const subBtnMeioDia = document.getElementById('subBtnMeioDia');
                                const subBtnAtrazo = document.getElementById('subBtnAtrazo');
                                if (subBtnDiaInteiro) { subBtnDiaInteiro.style.background = 'white'; subBtnDiaInteiro.style.color = 'var(--primary)'; }
                                if (subBtnMeioDia) { subBtnMeioDia.style.background = 'white'; subBtnMeioDia.style.color = '#f59e0b'; }
                                if (subBtnAtrazo) { subBtnAtrazo.style.background = 'white'; subBtnAtrazo.style.color = '#ef4444'; }
                            }

                            document.getElementById('subBtnDiaInteiro').addEventListener('click', () => {
                                selectedTipoFalta = 'dia_inteiro';
                                resetSubBtns();
                                document.getElementById('subBtnDiaInteiro').style.background = 'var(--primary)';
                                document.getElementById('subBtnDiaInteiro').style.color = 'white';
                            });

                            document.getElementById('subBtnMeioDia').addEventListener('click', () => {
                                selectedTipoFalta = 'meio_dia';
                                resetSubBtns();
                                document.getElementById('subBtnMeioDia').style.background = '#f59e0b';
                                document.getElementById('subBtnMeioDia').style.color = 'white';
                            });

                            document.getElementById('subBtnAtrazo').addEventListener('click', () => {
                                selectedTipoFalta = 'atrazo';
                                resetSubBtns();
                                document.getElementById('subBtnAtrazo').style.background = '#ef4444';
                                document.getElementById('subBtnAtrazo').style.color = 'white';
                            });

                            document.getElementById('subBtnCancelar').addEventListener('click', () => subModal.remove());

                            document.getElementById('subBtnConfirmar').addEventListener('click', async () => {
                                const obs = document.getElementById('subObsInput').value.trim();
                                const tipoLabel = selectedTipoFalta === 'meio_dia' ? 'Meio Dia' : selectedTipoFalta === 'atrazo' ? 'Atrazo' : 'Dia Inteiro';
                                try {
                                    await api.post('/faltas', { usuario_id: funcId, data: dateStr, tipo: tipoLabel, observacao: obs, tipo_falta: selectedTipoFalta });
                                    showSuccess('Falta registada!');
                                    subModal.remove();
                                    modal.remove();
                                } catch (error) {
                                    showError(error.message);
                                }
                            });

                            subModal.addEventListener('click', (e) => { if (e.target === subModal) subModal.remove(); });
                        }
                    });
                });

                // Justificar no calendário
                document.querySelectorAll('.btn-justificar-falta-sm').forEach(b => {
                    b.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const tipoJust = prompt('Tipo de justificação (Doença, Férias, Pessoal, Outro):', 'Doença');
                        if (!tipoJust) return;
                        try {
                            await api.put(`/faltas/${b.dataset.faltaId}/justificar`, { tipo: tipoJust });
                            showSuccess('Falta justificada!');
                            modal.remove();
                        } catch (error) {
                            showError(error.message);
                        }
                    });
                });

                // Apagar no calendário
                document.querySelectorAll('.btn-apagar-falta-sm').forEach(b => {
                    b.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        if (!confirm('Apagar esta falta?')) return;
                        try {
                            await api.delete(`/faltas/${b.dataset.faltaId}`);
                            showSuccess('Falta removida!');
                            modal.remove();
                        } catch (error) {
                            showError(error.message);
                        }
                    });
                });
            }

            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div style="background: white; border-radius: var(--radius-xl); padding: 1.5rem; max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-weight: 700; font-size: 1.1rem;">📅 ${funcNome}</h3>
                        <button id="closeCalFaltas" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                        <button id="calPrevMonth" style="background: var(--light); border: none; border-radius: var(--radius-md); padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.9rem;">◀</button>
                        <span id="calFaltasTitulo" style="font-weight: 600; font-size: 1rem;"></span>
                        <button id="calNextMonth" style="background: var(--light); border: none; border-radius: var(--radius-md); padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.9rem;">▶</button>
                    </div>
                    <div class="cal-grid" id="calFaltasGrid" style="margin-top: 0.5rem;"></div>
                    <div style="margin-top: 1rem;">
                        <h4 style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--dark-600);">Faltas do Mês <span style="color: var(--gray); font-weight: 400;">(${getFaltasMes().filter(f => !f.justificada).length} pendentes)</span></h4>
                        <div id="calFaltasLista"></div>
                        <div id="calFaltasTotalDesconto" style="margin-top: 0.5rem; text-align: right; font-weight: 700; font-size: 0.9rem; color: #ef4444;"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            renderCalendar();

            document.getElementById('closeCalFaltas').addEventListener('click', () => { modal.remove(); });
            modal.addEventListener('click', (e) => { if (e.target === modal) { modal.remove(); } });
            document.getElementById('calPrevMonth').addEventListener('click', () => { if (currentMonth === 0) { currentMonth = 11; currentYear--; } else { currentMonth--; } renderCalendar(); });
            document.getElementById('calNextMonth').addEventListener('click', () => { if (currentMonth === 11) { currentMonth = 0; currentYear++; } else { currentMonth++; } renderCalendar(); });
        });
    });

    // ==================== VER FALTAS (LISTA) ====================
    document.querySelectorAll('.btn-ver-faltas').forEach(btn => {
        btn.addEventListener('click', () => {
            const funcId = parseInt(btn.dataset.funcId);
            const func = funcionarios.find(f => f.id === funcId);
            const faltasFunc = faltas.filter(f => f.usuario_id === funcId);

            const lista = faltasFunc.map(f =>
                `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--light);">
                    <span>${new Date(f.data).toLocaleDateString('pt-MZ')}</span>
                    <span style="color: ${f.justificada ? '#10b981' : '#ef4444'}; font-weight: 600;">
                        ${f.justificada ? (f.tipo ? `Justificada - ${f.tipo}` : 'Justificada') : 'Pendente'}
                    </span>
                    ${!f.justificada ? `<button class="btn-justificar-falta" data-falta-id="${f.id}" style="background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: var(--radius-md); font-size: 0.75rem; border: none; cursor: pointer;">Justificar</button>` : ''}
                    <span style="font-size: 0.85rem; color: var(--gray);">${f.observacao || ''}</span>
                </div>`
            ).join('') || '<p style="color: var(--gray); text-align: center;">Nenhuma falta registada.</p>';

            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div style="background: white; border-radius: var(--radius-xl); padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-weight: 700;">Faltas - ${func?.nome || ''}</h3>
                        <button id="closeFaltasModal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    ${lista}
                    <div style="margin-top: 1rem; text-align: center;">
                        <span style="font-size: 0.85rem; color: var(--gray);">${faltasFunc.filter(f => !f.justificada).length} pendente(s) · ${faltasFunc.length} total</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#closeFaltasModal').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            modal.querySelectorAll('.btn-justificar-falta').forEach(b => {
                b.addEventListener('click', async () => {
                    const tipoJust = prompt('Tipo de justificação (Doença, Férias, Pessoal, Outro):', 'Doença');
                    if (!tipoJust) return;
                    try {
                        await api.put(`/faltas/${b.dataset.faltaId}/justificar`, { tipo: tipoJust });
                        showSuccess('Falta justificada!');
                        modal.remove();
                    } catch (error) {
                        showError(error.message);
                    }
                });
            });
        });
    });

    // ==================== FOLHA DE SALÁRIO ====================
    document.querySelectorAll('.btn-folha-salario').forEach(btn => {
        btn.addEventListener('click', () => {
            const funcId = parseInt(btn.dataset.funcId);
            const funcNome = btn.dataset.funcNome;
            const func = usuarios.find(u => u.id === funcId);
            if (!func) return;

            const salario = func.salario || 0;
            const faltasFunc = faltas.filter(f => f.usuario_id === funcId);
            const pendentes = faltasFunc.filter(f => !f.justificada);
            const diasInteiros = pendentes.filter(f => f.tipo_falta === 'dia_inteiro' || !f.tipo_falta).length;
            const meiosDias = pendentes.filter(f => f.tipo_falta === 'meio_dia').length;
            const atrazos = pendentes.filter(f => f.tipo_falta === 'atrazo').length;
            const totalDesconto = pendentes.reduce((sum, fa) => {
                const valorDia = salario / 22;
                return sum + valorDia * getFatorDesconto(fa.tipo_falta);
            }, 0);
            const salarioLiquido = salario - totalDesconto;

            const modal = document.createElement('div');
            modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
            modal.innerHTML = `
                <div style="background: white; border-radius: var(--radius-xl); padding: 1.5rem; max-width: 480px; width: 95%; max-height: 90vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 700; font-size: 1.1rem;">📄 Folha de Salário</h3>
                        <button id="closeFolhaSalario" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>

                    <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--light);">
                        <h4 style="font-size: 1.2rem; font-weight: 700;">${funcNome}</h4>
                        <p style="color: var(--gray); font-size: 0.85rem;">${func.email || ''}</p>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                            <span style="font-weight: 600;">Salário Bruto</span>
                            <span style="font-weight: 700; font-size: 1.05rem;">${formatCurrency(salario)}</span>
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem; padding: 1rem; background: #fef2f2; border-radius: var(--radius-lg); border: 1px solid #fecaca;">
                        <h5 style="font-size: 0.9rem; font-weight: 700; color: #ef4444; margin-bottom: 0.75rem;">🔴 Descontos por Faltas (Pendentes)</h5>
                        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                            <span>Dias Inteiros: <strong>${diasInteiros}</strong></span>
                            <span style="color: #ef4444;">-${formatCurrency(diasInteiros * (salario / 22))}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                            <span>Meios Dias: <strong>${meiosDias}</strong></span>
                            <span style="color: #ef4444;">-${formatCurrency(meiosDias * (salario / 44))}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.9rem;">
                            <span>Atrazos: <strong>${atrazos}</strong></span>
                            <span style="color: #ef4444;">-${formatCurrency(atrazos * (salario / 88))}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0 0; margin-top: 0.5rem; border-top: 1px solid #fecaca; font-weight: 700; color: #ef4444;">
                            <span>Total Desconto</span>
                            <span>-${formatCurrency(totalDesconto)}</span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: space-between; padding: 1rem 0 0; border-top: 2px solid var(--light);">
                        <span style="font-size: 1.1rem; font-weight: 700;">Salário Líquido</span>
                        <span style="font-size: 1.3rem; font-weight: 800; color: ${salarioLiquido >= 0 ? 'var(--accent)' : '#ef4444'};">${formatCurrency(salarioLiquido)}</span>
                    </div>

                    <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-primary btn-sm" id="btnVerFaltasFolha" style="padding: 0.5rem 1rem; font-size: 0.85rem;">📅 Ver Faltas</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('closeFolhaSalario').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            document.getElementById('btnVerFaltasFolha').addEventListener('click', () => {
                modal.remove();
                const calBtn = document.querySelector(`.btn-calendario-faltas[data-func-id="${funcId}"]`);
                if (calBtn) calBtn.click();
            });
        });
    });

    // ==================== ALTERNAR PERMISSÃO DE RESPONDER ====================
    document.querySelectorAll('.toggle-responder').forEach(checkbox => {
        checkbox.addEventListener('change', async () => {
            const funcId = checkbox.dataset.funcId;
            const podeResponder = checkbox.checked;
            try {
                await api.put(`/usuarios/${funcId}/responder-permissao`, { pode_responder: podeResponder });
                showSuccess(`Permissão ${podeResponder ? 'concedida' : 'removida'} com sucesso!`);
            } catch (error) {
                checkbox.checked = !podeResponder;
                showError(error.message);
            }
        });
    });

    // ==================== VERIFICAR CLIENTE ====================
    document.querySelectorAll('.btn-verificar-cliente').forEach(btn => {
        btn.addEventListener('click', async () => {
            const clienteId = btn.dataset.clienteId;
            if (!confirm('Verificar este cliente?')) return;
            try {
                await api.put(`/clientes/${clienteId}/verificar`);
                showSuccess('Cliente verificado!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== MARCAR COMO PAGO ====================
    document.querySelectorAll('.btn-marcar-pago').forEach(btn => {
        btn.addEventListener('click', async () => {
            const servicoId = btn.dataset.servicoId;
            if (!confirm('Confirmar que o pagamento foi recebido?')) return;
            try {
                await api.put(`/servicos/${servicoId}/pagar`);
                showSuccess('Pagamento registado!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    // ==================== PESQUISAR UTILIZADORES ====================
    const searchUsuarios = document.getElementById('searchUsuarios');
    if (searchUsuarios) {
        searchUsuarios.addEventListener('input', () => {
            const term = searchUsuarios.value.toLowerCase();
            document.querySelectorAll('#tableUsuarios tbody tr').forEach(row => {
                const nome = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
                row.style.display = nome.includes(term) ? '' : 'none';
            });
        });
    }

    // ==================== PESQUISAR FUNCIONÁRIOS ====================
    const searchFuncionarios = document.getElementById('searchFuncionarios');
    if (searchFuncionarios) {
        searchFuncionarios.addEventListener('input', () => {
            const term = searchFuncionarios.value.toLowerCase();
            document.querySelectorAll('#tab-funcionarios .table tbody tr').forEach(row => {
                const nome = row.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
                row.style.display = nome.includes(term) ? '' : 'none';
            });
        });
    }

    // ==================== EDITAR LISTA FUNCIONÁRIOS ====================
    window.abrirEditarListaFuncionarios = () => {
        document.getElementById('editarListaFuncionariosModal').style.display = 'block';
    };
    window.fecharEditarListaFuncionarios = () => {
        document.getElementById('editarListaFuncionariosModal').style.display = 'none';
    };

    const btnEditarListaFuncionarios = document.getElementById('btnEditarListaFuncionarios');
    if (btnEditarListaFuncionarios) {
        btnEditarListaFuncionarios.addEventListener('click', () => {
            window.abrirEditarListaFuncionarios();
        });
    }

    document.getElementById('editarListaFuncionariosModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) window.fecharEditarListaFuncionarios();
    });

    document.getElementById('btnGuardarEditarLista')?.addEventListener('click', async () => {
        const rows = document.querySelectorAll('#tabelaEditarFuncionarios tbody tr');
        let guardados = 0;
        let erros = 0;

        for (const row of rows) {
            const funcId = row.dataset.funcId;
            const nome = row.querySelector('.edit-nome')?.value || '';
            const email = row.querySelector('.edit-email')?.value || '';
            const telefone = row.querySelector('.edit-telefone')?.value || '';
            const salario = parseFloat(row.querySelector('.edit-salario')?.value) || 0;
            const endereco = row.querySelector('.edit-endereco')?.value || '';
            const banco = row.querySelector('.edit-banco')?.value || null;
            const numero_conta = row.querySelector('.edit-conta')?.value || null;
            const tipo_conta = row.querySelector('.edit-tipo')?.value || null;

            try {
                await api.put(`/usuarios/${funcId}`, { nome, email, telefone });
                await api.put(`/usuarios/${funcId}/dados`, { salario, endereco, numero_conta, banco, tipo_conta });
                guardados++;
            } catch (error) {
                erros++;
            }
        }

        if (erros === 0) {
            showSuccess(`${guardados} funcionário(s) actualizado(s) com sucesso!`);
        } else {
            showError(`${erros} erro(s) ao guardar. ${guardados} guardado(s) com sucesso.`);
        }
    });

    // ==================== LISTA FUNCIONÁRIOS ====================
    window.abrirListaFuncionarios = () => {
        document.getElementById('listaFuncionariosModal').style.display = 'block';
    };
    window.fecharListaFuncionarios = () => {
        document.getElementById('listaFuncionariosModal').style.display = 'none';
    };

    const btnListaFuncionarios = document.getElementById('btnListaFuncionarios');
    if (btnListaFuncionarios) {
        btnListaFuncionarios.addEventListener('click', () => {
            window.abrirListaFuncionarios();
        });
    }

    document.getElementById('listaFuncionariosModal')?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) window.fecharListaFuncionarios();
    });

    // ==================== EXPORTAR LISTA FUNCIONÁRIOS PDF ====================
    document.getElementById('btnExportListaFuncPDF')?.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showError('Biblioteca PDF não carregada.');
            return;
        }

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        let yPos = 20;

        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.setFont(undefined, 'bold');
        doc.text('Lista de Funcionários - Tecto Falso Sabao', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pt-MZ')} | Total: ${funcionarios.length} funcionários`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 12;

        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        const headers = ['N°', 'Nome', 'Email', 'Telefone', 'Salário (MZN)', 'Conta'];
        const colWidths = [15, 55, 60, 35, 40, 55];

        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
        let xPos = margin + 2;
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
        });
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(50, 50, 50);

        funcionarios.forEach((f, index) => {
            if (yPos > 185) {
                doc.addPage();
                yPos = 20;
                doc.setFontSize(9);
                doc.setTextColor(255, 255, 255);
                doc.setFont(undefined, 'bold');
                doc.setFillColor(79, 70, 229);
                doc.rect(margin, yPos - 5, pageWidth - margin * 2, 8, 'F');
                xPos = margin + 2;
                headers.forEach((header, i) => {
                    doc.text(header, xPos, yPos);
                    xPos += colWidths[i];
                });
                yPos += 8;
                doc.setFont(undefined, 'normal');
                doc.setTextColor(50, 50, 50);
            }

            if (index % 2 === 0) {
                doc.setFillColor(245, 245, 250);
                doc.rect(margin, yPos - 4.5, pageWidth - margin * 2, 7, 'F');
            }

            const bancoLabel = f.banco ? f.banco : (f.tipo_conta ? ({ mpesa: 'M-Pesa', emola: 'E-Mola', emick: 'E-Micks' }[f.tipo_conta] || f.tipo_conta) : '');
            const contaLabel = bancoLabel ? `${bancoLabel}${f.numero_conta ? ' · ' + f.numero_conta : ''}` : '-';

            xPos = margin + 2;
            doc.text(`${index + 1}`, xPos, yPos);
            xPos += colWidths[0];
            doc.text(f.nome || '-', xPos, yPos);
            xPos += colWidths[1];
            doc.text(f.email || '-', xPos, yPos);
            xPos += colWidths[2];
            doc.text(f.telefone || '-', xPos, yPos);
            xPos += colWidths[3];
            doc.text(`${(f.salario || 0).toFixed(2)}`, xPos, yPos);
            xPos += colWidths[4];
            doc.text(contaLabel, xPos, yPos);
            yPos += 7;
        });

        yPos += 5;
        doc.setDrawColor(79, 70, 229);
        doc.setLineWidth(0.5);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        const totalSalarios = funcionarios.reduce((sum, f) => sum + (f.salario || 0), 0);
        doc.setFontSize(11);
        doc.setTextColor(79, 70, 229);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL SALÁRIOS: ${formatCurrency(totalSalarios)}`, margin, yPos);
        doc.text(`MÉDIA: ${formatCurrency(totalSalarios / (funcionarios.length || 1))}`, pageWidth - margin, yPos, { align: 'right' });

        doc.save(`Lista_Funcionarios_${new Date().getTime()}.pdf`);
        showSuccess('PDF exportado com sucesso!');
    });

    // ==================== EXPORTAR LISTA FUNCIONÁRIOS EXCEL ====================
    document.getElementById('btnExportListaFuncExcel')?.addEventListener('click', () => {
        if (!window.XLSX) {
            showError('Biblioteca Excel não carregada.');
            return;
        }

        const dados = funcionarios.map((f, index) => ({
            'N°': index + 1,
            'Nome': f.nome || '',
            'Email': f.email || '',
            'Telefone': f.telefone || '',
            'Salário (MZN)': f.salario || 0,
            'Banco': f.banco || '',
            'Nº Conta': f.numero_conta || '',
            'Carteira Móvel': f.tipo_conta || '',
            'Endereço': f.endereco || ''
        }));

        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Funcionários');

        ws['!cols'] = [
            { wch: 5 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 30 }
        ];

        XLSX.writeFile(wb, `Lista_Funcionarios_${new Date().getTime()}.xlsx`);
        showSuccess('Excel exportado com sucesso!');
    });

    // ==================== PESQUISAR CLIENTES ====================
    const searchClientes = document.getElementById('searchClientes');
    if (searchClientes) {
        searchClientes.addEventListener('input', () => {
            const term = searchClientes.value.toLowerCase();
            document.querySelectorAll('#tableClientes tbody tr').forEach(row => {
                const nome = row.querySelector('td:first-child')?.textContent.toLowerCase() || '';
                row.style.display = nome.includes(term) ? '' : 'none';
            });
        });
    }

    // ==================== PORTFOLIO ADMIN ====================
    window.abrirEditarPortfolioAdmin = (id, titulo, descricao, tipo, imagem, video) => {
        document.getElementById('editPortfolioId').value = id;
        document.getElementById('editPortfolioTitulo').value = titulo;
        document.getElementById('editPortfolioDescricao').value = descricao;
        document.getElementById('editPortfolioTipo').value = tipo;
        document.getElementById('editarPortfolioModalAdmin').style.display = 'block';
    };
    window.fecharEditarPortfolioAdmin = () => {
        document.getElementById('editarPortfolioModalAdmin').style.display = 'none';
    };

    document.querySelectorAll('.btn-ver-portfolio-admin').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.card');
            const src = card.querySelector('img')?.src || card.querySelector('video')?.src;
            if (src) window.open(src, '_blank');
        });
    });

    document.querySelectorAll('.btn-editar-portfolio-admin').forEach(btn => {
        btn.addEventListener('click', () => {
            window.abrirEditarPortfolioAdmin(
                btn.dataset.id,
                btn.dataset.titulo,
                btn.dataset.descricao,
                btn.dataset.tipo,
                btn.dataset.imagem,
                btn.dataset.video
            );
        });
    });

    document.querySelectorAll('.btn-deletar-portfolio-admin').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (!confirm('Tem certeza que deseja excluir este projecto do portfólio?')) return;
            try {
                await api.delete(`/portfolio/${id}`);
                showSuccess('Projecto excluído!');
            } catch (error) {
                showError(error.message);
            }
        });
    });

    const formEditPortfolio = document.getElementById('formEditarPortfolioAdmin');
    if (formEditPortfolio) {
        formEditPortfolio.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editPortfolioId').value;
            const formData = new FormData();
            formData.append('titulo', document.getElementById('editPortfolioTitulo').value);
            formData.append('descricao', document.getElementById('editPortfolioDescricao').value);
            formData.append('tipo_servico', document.getElementById('editPortfolioTipo').value);
            const arquivo = document.getElementById('editPortfolioArquivo').files[0];
            if (arquivo) formData.append('arquivo', arquivo);
            try {
                // Barra de progresso do upload
                const prog = createProgressBar(document.getElementById('editUploadProgressContainer'));
                let emUpload = false;

                // Ficheiros grandes (>4MB) vão direto ao Blob pelo browser
                // (o servidor no Vercel Hobby tem limite de ~4.5MB por request).
                // Em desenvolvimento local (sem Blob) usa o fluxo normal.
                if (arquivo && arquivo.size > 4 * 1024 * 1024 && await isDirectUploadAvailable()) {
                    emUpload = true;
                    prog.show('A enviar ficheiro para o armazenamento...');
                    const url = await uploadFileToBlob(arquivo, 'portfolio', (pct) => {
                        prog.set(pct, `A enviar ficheiro para o armazenamento... ${pct}%`);
                    });
                    const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
                    const payload = {
                        titulo: document.getElementById('editPortfolioTitulo').value,
                        descricao: document.getElementById('editPortfolioDescricao').value,
                        tipo_servico: document.getElementById('editPortfolioTipo').value
                    };
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                        payload.imagem_url = url;
                        payload.substituir_imagem = true;
                    } else {
                        payload.video_url = url;
                        payload.substituir_video = true;
                    }
                    prog.set(95, 'A registar as alterações no servidor...');
                    await api.put(`/portfolio/${id}`, payload);
                } else if (arquivo) {
                    emUpload = true;
                    prog.show('A carregar projecto...');
                    await api.uploadFile(`/portfolio/${id}`, formData, 'PUT', (pct) => {
                        prog.set(pct, `A carregar projecto... ${pct}%`);
                    });
                } else {
                    // Sem ficheiro novo — gravar apenas os dados textuais
                    await api.put(`/portfolio/${id}`, {
                        titulo: document.getElementById('editPortfolioTitulo').value,
                        descricao: document.getElementById('editPortfolioDescricao').value,
                        tipo_servico: document.getElementById('editPortfolioTipo').value
                    });
                }
                if (emUpload) prog.done('Projecto actualizado com sucesso!');
                showSuccess('Projecto actualizado!');
                if (emUpload) setTimeout(() => prog.hide(), 1500);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    document.getElementById('editarPortfolioModalAdmin').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharEditarPortfolioAdmin();
    });

    // ==================== SAIR (LOGOUT) ====================
    document.getElementById('btnSairAdmin').addEventListener('click', () => {
        localStorage.removeItem('teto_falso_token');
        localStorage.removeItem('teto_falso_user');
        window.location.hash = 'login';
        window.location.reload();
    });

    // ==================== AGENTE IA ====================
    async function enviarMensagemAI(mensagem) {
        const chatMessages = document.getElementById('aiChatMessages');
        const statusIndicator = document.getElementById('aiStatusIndicator');
        const sendBtn = document.getElementById('aiSendBtn');

        sendBtn.disabled = true;
        sendBtn.textContent = 'A pensar...';
        statusIndicator.textContent = '🤔 A processar...';
        statusIndicator.style.background = '#fef3c7';
        statusIndicator.style.color = '#92400e';

        const userDiv = document.createElement('div');
        userDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: flex-start; flex-direction: row-reverse;';
        userDiv.innerHTML = `
            <span style="font-size: 1.5rem; flex-shrink: 0;">👤</span>
            <div style="background: var(--primary); color: white; padding: 0.75rem 1rem; border-radius: var(--radius-lg) 0 var(--radius-lg) var(--radius-lg); max-width: 85%;">
                <p style="margin: 0; font-size: 0.9rem;">${mensagem}</p>
            </div>
        `;
        chatMessages.appendChild(userDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await api.post('/ai/chat', { mensagem });
            const resposta = res.resposta;

            const aiDiv = document.createElement('div');
            aiDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: flex-start;';
            aiDiv.innerHTML = `
                <span style="font-size: 1.5rem; flex-shrink: 0;">🤖</span>
                <div style="background: white; padding: 0.75rem 1rem; border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg); box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 85%;">
                    <p style="margin: 0; font-size: 0.9rem; white-space: pre-wrap;">${resposta}</p>
                </div>
            `;
            chatMessages.appendChild(aiDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            statusIndicator.textContent = '✅ Online';
            statusIndicator.style.background = '#f0fdf4';
            statusIndicator.style.color = '#166534';
        } catch (error) {
            const errorMsg = error.message || 'Nao foi possivel processar a mensagem';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'display: flex; gap: 0.75rem; align-items: flex-start;';
            errorDiv.innerHTML = `
                <span style="font-size: 1.5rem; flex-shrink: 0;">⚠️</span>
                <div style="background: #fef2f2; padding: 0.75rem 1rem; border-radius: 0 var(--radius-lg) var(--radius-lg) var(--radius-lg); max-width: 85%; border: 1px solid #fecaca;">
                    <p style="margin: 0; font-size: 0.9rem; color: #991b1b;">
                        <strong>Erro:</strong> ${errorMsg}
                    </p>
                </div>
            `;
            chatMessages.appendChild(errorDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            statusIndicator.textContent = '❌ Erro';
            statusIndicator.style.background = '#fef2f2';
            statusIndicator.style.color = '#991b1b';
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Enviar';
        }
    }

    const aiForm = document.getElementById('aiChatForm');
    const aiInput = document.getElementById('aiChatInput');
    if (aiForm) {
        aiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mensagem = aiInput.value.trim();
            if (!mensagem) return;
            aiInput.value = '';
            await enviarMensagemAI(mensagem);
        });
    }

    // Fechar pesquisa geral ao clicar fora
    document.getElementById('pesquisaGeralModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) fecharPesquisaGeral();
    });

    // Verificar status do AI ao carregar
    async function verificarStatusAI() {
        try {
            const res = await api.get('/security/status');
            const isConfigured = res.status && res.status.openai && res.status.openai.configurado;
            const statusIndicator = document.getElementById('aiStatusIndicator');
            if (statusIndicator) {
                if (isConfigured) {
                    statusIndicator.textContent = '✅ Online';
                    statusIndicator.style.background = '#f0fdf4';
                    statusIndicator.style.color = '#166534';
                } else {
                    statusIndicator.textContent = '⚠️ Nao configurado';
                    statusIndicator.style.background = '#fef3c7';
                    statusIndicator.style.color = '#92400e';
                }
            }
        } catch (e) {
            // Ignore
        }
    }
    verificarStatusAI();

    // ==================== EXPORTACAO AI CHAT ====================
    document.getElementById('btnExportAIPdf').addEventListener('click', () => {
        const messages = document.querySelectorAll('#aiChatMessages > div');
        if (messages.length <= 1) {
            showError('Nenhuma conversa para exportar');
            return;
        }
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            showError('Biblioteca PDF nao carregada');
            return;
        }
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setFontSize(18);
        doc.setTextColor(79, 70, 229);
        doc.setFont(undefined, 'bold');
        doc.text('Conversa - Agente IA', pageWidth / 2, y, { align: 'center' });
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont(undefined, 'normal');
        doc.text(`Exportado em: ${new Date().toLocaleString('pt-MZ')}`, pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, pageWidth - 20, y);
        y += 10;

        messages.forEach((msg, i) => {
            if (i === 0) return;
            const textEl = msg.querySelector('p');
            if (!textEl) return;
            const text = textEl.innerText || textEl.textContent;
            const isUser = msg.style.flexDirection === 'row-reverse';
            const label = isUser ? `👤 Admin (${new Date().toLocaleTimeString('pt-MZ')})` : `🤖 Agente IA`;

            doc.setFontSize(10);
            doc.setTextColor(isUser ? 79 : 37, isUser ? 70 : 99, isUser ? 229 : 235);
            doc.setFont(undefined, 'bold');
            doc.text(label, 20, y);
            y += 6;

            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.setFont(undefined, 'normal');

            const lines = doc.splitTextToSize(text, pageWidth - 40);
            lines.forEach(line => {
                if (y > 275) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 5;
            });
            y += 5;
        });

        doc.save(`Conversa_AI_${new Date().getTime()}.pdf`);
        showSuccess('PDF exportado com sucesso!');
    });

    document.getElementById('btnExportAIExcel').addEventListener('click', () => {
        const messages = document.querySelectorAll('#aiChatMessages > div');
        if (messages.length <= 1) {
            showError('Nenhuma conversa para exportar');
            return;
        }
        if (!window.XLSX) {
            showError('Biblioteca Excel nao carregada');
            return;
        }

        const dados = [];
        messages.forEach((msg, i) => {
            if (i === 0) return;
            const textEl = msg.querySelector('p');
            if (!textEl) return;
            const text = textEl.innerText || textEl.textContent;
            const isUser = msg.style.flexDirection === 'row-reverse';
            dados.push({
                'Tipo': isUser ? 'Pergunta (Admin)' : 'Resposta (IA)',
                'Conteudo': text,
                'Data': new Date().toLocaleDateString('pt-MZ'),
                'Hora': new Date().toLocaleTimeString('pt-MZ')
            });
        });

        const wb = window.XLSX.utils.book_new();
        const ws = window.XLSX.utils.json_to_sheet(dados);
        window.XLSX.utils.book_append_sheet(wb, ws, 'Conversa AI');
        window.XLSX.writeFile(wb, `Conversa_AI_${new Date().getTime()}.xlsx`);
        showSuccess('Excel exportado com sucesso!');
    });

    document.getElementById('btnClearAIChat').addEventListener('click', () => {
        const chatMessages = document.getElementById('aiChatMessages');
        const primeiro = chatMessages.querySelector('div');
        chatMessages.innerHTML = '';
        if (primeiro) chatMessages.appendChild(primeiro);
        showSuccess('Conversa limpa!');
    });

    // ==================== PEDIDOS DE PORTFOLIO ====================
    document.querySelectorAll('.btn-pedido-visto').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            try {
                await api.put(`/pedidos-portfolio/${id}/status`, { status: 'visto' });
                showSuccess('Pedido marcado como visto!');
            } catch (err) {
                showError('Erro: ' + (err.message || 'Tente novamente'));
            }
        });
    });

    document.querySelectorAll('.btn-criar-orcamento-pedido').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const clienteNome = btn.dataset.clienteNome;
            const clienteEmail = btn.dataset.clienteEmail;
            const titulo = btn.dataset.titulo;
            const tipo = btn.dataset.tipo;

            // Mark as orcamento_criado
            try {
                await api.put(`/pedidos-portfolio/${id}/status`, { status: 'orcamento_criado' });
            } catch (e) { /* ignore */ }

            // Navigate to orcamentos page with pre-fill info in sessionStorage
            sessionStorage.setItem('pedido_orcamento', JSON.stringify({
                clienteNome, clienteEmail, titulo, tipo
            }));
            window.location.hash = 'orcamentos';
            showSuccess(`A abrir formulário de orçamento para ${clienteNome}...`);
        });
    });

    document.querySelectorAll('.btn-eliminar-pedido').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Tem a certeza que quer eliminar este pedido?')) return;
            const id = btn.dataset.id;
            try {
                await api.delete(`/pedidos-portfolio/${id}`);
                showSuccess('Pedido eliminado!');
            } catch (err) {
                showError('Erro: ' + (err.message || 'Tente novamente'));
            }
        });
    });

    // ==================== VER PROJETO DO PEDIDO ====================
    function abrirProjetoPedido(titulo, imagem, video) {
        let overlay = document.getElementById('pedidoProjetoOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'pedidoProjetoOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;flex-direction:column;padding:1rem;';
            document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
            <div style="position:absolute;top:1rem;right:1rem;color:white;font-size:2rem;cursor:pointer;z-index:10000;" id="fecharProjetoPedido">&times;</div>
            <p style="color:white;font-weight:700;font-size:1.1rem;margin-bottom:0.75rem;text-align:center;max-width:90vw;" id="pedidoProjetoTitulo"></p>
            <div style="max-width:90vw;max-height:80vh;display:flex;align-items:center;justify-content:center;border-radius:0.75rem;overflow:hidden;background:#000;" id="pedidoProjetoMedia"></div>
            <p style="color:rgba(255,255,255,0.6);font-size:0.8rem;margin-top:0.75rem;">Clique fora da imagem ou no ✕ para fechar</p>
        `;
        document.getElementById('pedidoProjetoTitulo').textContent = titulo || 'Projeto';
        const media = document.getElementById('pedidoProjetoMedia');
        media.innerHTML = '';
        if (video) {
            const v = document.createElement('video');
            v.src = video;
            v.controls = true;
            v.autoplay = true;
            v.style.cssText = 'max-width:90vw;max-height:80vh;object-fit:contain;';
            media.appendChild(v);
        } else if (imagem) {
            const img = document.createElement('img');
            img.src = imagem;
            img.alt = titulo;
            img.style.cssText = 'max-width:90vw;max-height:80vh;object-fit:contain;';
            media.appendChild(img);
        } else {
            media.innerHTML = '<span style="font-size:5rem;">🏗️</span>';
        }
        overlay.style.display = 'flex';
        overlay.onclick = (e) => {
            if (e.target === overlay || e.target.id === 'fecharProjetoPedido') {
                overlay.style.display = 'none';
                const vid = overlay.querySelector('video');
                if (vid) vid.pause();
            }
        };
    }

    document.querySelectorAll('.btn-ver-projeto-pedido').forEach(btn => {
        btn.addEventListener('click', () => {
            abrirProjetoPedido(btn.dataset.titulo, btn.dataset.imagem, btn.dataset.video);
        });
    });

    document.querySelectorAll('.pedido-preview').forEach(preview => {
        preview.addEventListener('click', () => {
            abrirProjetoPedido(preview.dataset.pedidoTitulo, preview.dataset.pedidoImagem, preview.dataset.pedidoVideo);
        });
        preview.addEventListener('mouseenter', () => { preview.style.transform = 'scale(1.05)'; });
        preview.addEventListener('mouseleave', () => { preview.style.transform = 'scale(1)'; });
    });

    // ==================== SELEÇÃO EM LOTE (SELECT ALL + DELETE) ====================
    // Função genérica para configurar seleção em lote
    function configurarSelecaoLote({ selectAllId, checkboxClass, btnApagarId, countId, deleteEndpoint, onDeleted }) {
        const selectAll = document.getElementById(selectAllId);
        const btnApagar = document.getElementById(btnApagarId);
        const countSpan = document.getElementById(countId);

        if (!selectAll) return;

        function atualizarContador() {
            const checks = document.querySelectorAll(`.${checkboxClass}:checked`);
            const count = checks.length;
            if (countSpan) countSpan.textContent = count;
            if (btnApagar) btnApagar.style.display = count > 0 ? 'inline-flex' : 'none';
        }

        selectAll.addEventListener('change', () => {
            document.querySelectorAll(`.${checkboxClass}`).forEach(cb => {
                cb.checked = selectAll.checked;
            });
            atualizarContador();
        });

        document.querySelectorAll(`.${checkboxClass}`).forEach(cb => {
            cb.addEventListener('change', atualizarContador);
        });

        if (btnApagar) {
            btnApagar.addEventListener('click', async () => {
                const checks = document.querySelectorAll(`.${checkboxClass}:checked`);
                const ids = Array.from(checks).map(cb => cb.dataset.id);
                if (ids.length === 0) return;

                if (!confirm(`⚠️ Tem a certeza que deseja apagar ${ids.length} item(s)?\n\nEsta ação NÃO pode ser revertida!`)) return;

                try {
                    for (const id of ids) {
                        await api.delete(`${deleteEndpoint}/${id}`);
                    }
                    showSuccess(`${ids.length} item(s) apagado(s) com sucesso!`);
                    if (onDeleted) onDeleted();
                    else adminPage();
                } catch (error) {
                    showError('Erro ao apagar: ' + (error.message || 'Erro desconhecido'));
                }
            });
        }
    }

    // Utilizadores
    configurarSelecaoLote({
        selectAllId: 'selectAllUsuarios',
        checkboxClass: 'checkbox-usuario',
        btnApagarId: 'btnApagarSelecionadosUsuarios',
        countId: 'countSelecionadosUsuarios',
        deleteEndpoint: '/usuarios'
    });

    // Clientes
    configurarSelecaoLote({
        selectAllId: 'selectAllClientes',
        checkboxClass: 'checkbox-cliente',
        btnApagarId: 'btnApagarSelecionadosClientes',
        countId: 'countSelecionadosClientes',
        deleteEndpoint: '/usuarios'
    });

    // Clientes Satisfeitos
    configurarSelecaoLote({
        selectAllId: 'selectAllSatisfeitos',
        checkboxClass: 'checkbox-satisfeito',
        btnApagarId: 'btnApagarSelecionadosSatisfeitos',
        countId: 'countSelecionadosSatisfeitos',
        deleteEndpoint: '/clientes'
    });

    // Mensagens
    configurarSelecaoLote({
        selectAllId: 'selectAllMsgs',
        checkboxClass: 'checkbox-msg',
        btnApagarId: 'btnApagarSelecionadasMsgs',
        countId: 'countSelecionadasMsgs',
        deleteEndpoint: '/contact'
    });

    // Portfólio
    configurarSelecaoLote({
        selectAllId: 'selectAllPortfolio',
        checkboxClass: 'checkbox-portfolio',
        btnApagarId: 'btnApagarSelecionadosPortfolio',
        countId: 'countSelecionadosPortfolio',
        deleteEndpoint: '/portfolio'
    });

    // Pedidos
    configurarSelecaoLote({
        selectAllId: 'selectAllPedidos',
        checkboxClass: 'checkbox-pedido',
        btnApagarId: 'btnApagarSelecionadosPedidos',
        countId: 'countSelecionadosPedidos',
        deleteEndpoint: '/pedidos-portfolio'
    });
}

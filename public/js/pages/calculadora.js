import { render, api, formatCurrency, showSuccess, showError } from '../app.js';
import { calcularGesso } from '../calculators/gesso.js';
import { calcularPVC } from '../calculators/pvc.js';
import { calcularModular } from '../calculators/modular.js';
import { gerarReciboPDF } from '../utils/pdfGenerator.js';

export default async function calculadoraPage() {
  // Load prices
  let precos = {};
  try {
    console.log('Fetching prices...');
    const response = await api.get('/precos');
    console.log('Prices response:', response);
    response.precos.forEach(p => {
      if (!precos[p.categoria]) precos[p.categoria] = {};
      precos[p.categoria][p.item] = p.preco;
    });
    console.log('Processed prices:', precos);
  } catch (error) {
    console.error('Error loading prices:', error);
  }

  console.log('Rendering calculator page...');
  render(`
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <h1 style="font-size: 3rem; font-weight: 800; margin: 0;">Calculadora de Materiais</h1>
        <div style="display: flex; gap: 0.5rem;">
          <a href="#orcamentos" class="btn btn-outline btn-sm" style="white-space: nowrap; padding: 0.5rem 1rem; font-size: 0.85rem;">📜 Ver Histórico</a>
          <button id="btnSairCalc" class="btn btn-sm" style="background: #ef4444; color: white; white-space: nowrap; padding: 0.5rem 1rem; font-size: 0.85rem;">🚪 Sair</button>
        </div>
      </div>
      <p class="text-center mb-3" style="font-size: 1.25rem; color: var(--gray); max-width: 800px; margin: 0 auto 1.5rem;">
        Insira a área total do projeto para calcular os materiais necessários.
      </p>
 
      <!-- Tabs -->
      <div class="tabs" id="calculatorTabs">
        <button class="tab active" data-tipo="gesso">🏛️ Teto de Gesso</button>
        <button class="tab" data-tipo="pvc">📦 Teto de PVC</button>
        <button class="tab" data-tipo="modular">⬜ Teto Modular</button>
      </div>

      <!-- Gesso Calculator -->
      <div class="tab-content active" id="gesso-content">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--primary);">
            Cálculo de Tecto de Gesso
          </h2>
          <p style="color: var(--gray); margin-bottom: 2rem;">
            Cálculo baseado na área (m²)
          </p>
          <form id="gessoForm">
            <div class="form-group">
              <label class="form-label">Área Total (m²)</label>
              <input type="number" class="form-input" id="gesso-area" step="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 1rem;">
              Calcular Materiais
            </button>
          </form>

          <div id="gesso-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>

      <!-- PVC Calculator -->
      <div class="tab-content" id="pvc-content">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--secondary);">
            Cálculo de Tecto de PVC
          </h2>
          <p style="color: var(--gray); margin-bottom: 2rem;">
             Cálculo baseado na área (m²)
          </p>

          <form id="pvcForm">
            <div class="form-group">
              <label class="form-label">Área Total (m²)</label>
              <input type="number" class="form-input" id="pvc-area" step="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 1rem;">
              Calcular Materiais
            </button>
          </form>

          <div id="pvc-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>

      <!-- Modular Calculator -->
      <div class="tab-content" id="modular-content">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--accent);">
            Cálculo de Tecto Modular
          </h2>
          <p style="color: var(--gray); margin-bottom: 2rem;">
             Cálculo baseado na área (m²)
          </p>

          <form id="modularForm">
            <div class="form-group">
              <label class="form-label">Área Total (m²)</label>
              <input type="number" class="form-input" id="modular-area" step="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 1rem;">
              Calcular Materiais
            </button>
          </form>

      <div id="modular-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>
    </div>

    <!-- Save Budget Modal -->
    <div id="saveModal" class="modal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div class="modal-content" style="background-color: #fefefe; margin: 2rem auto; padding: 1.5rem; border: 1px solid #888; width: 90%; max-width: 500px; border-radius: var(--radius-lg); position: relative; max-height: 90vh; overflow-y: auto;">
        <span class="close" style="position: absolute; right: 1.5rem; top: 1rem; font-size: 1.5rem; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-bottom: 1.5rem; color: var(--primary);">Salvar Orçamento</h2>
        <form id="saveBudgetForm">
          <div class="form-group">
            <label class="form-label">Nome do Cliente</label>
            <input type="text" class="form-input" id="cliente-nome" required placeholder="Nome completo">
          </div>
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input type="tel" class="form-input" id="cliente-telefone" required placeholder="Ex: 84 123 4567" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
          </div>
          <div class="form-group">
            <label class="form-label">Observações (Opcional)</label>
            <textarea class="form-input" id="orcamento-obs" rows="3"></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Confirmar e Salvar</button>
        </form>
      </div>
    </div>
  `);

  // Modal Logic
  const modal = document.getElementById('saveModal');
  const closeBtn = document.querySelector('.close');
  const saveForm = document.getElementById('saveBudgetForm');
  let currentSaveData = null;

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
  };

  saveForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { tipo, area, materiais, total_materiais, mao_obra, total_geral } = window.currentCalculation;

    if (!tipo || !area) return;

    const btn = saveForm.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Salvando...';
    btn.disabled = true;

    try {
      // 1. Create Client
      const clienteData = {
        nome: document.getElementById('cliente-nome').value,
        telefone: document.getElementById('cliente-telefone').value,
        email: '', // Optional
        endereco: '' // Optional
      };

      console.log('Creating client...', clienteData);
      const clientRes = await api.post('/clientes', clienteData);
      const clienteId = clientRes.id;

      // 3. Save Service/Budget
      const servicoData = {
        cliente_id: clienteId,
        tipo_teto: tipo,
        area: area,
        largura: 0, // Not used anymore
        comprimento: 0, // Not used anymore
        materiais_json: JSON.stringify(materiais),
        servicos_adicionais_json: '[]',
        valor_materiais: total_materiais,
        valor_mao_obra: mao_obra,
        valor_total: total_geral,
        data_servico: new Date().toISOString().split('T')[0],
        status: 'orcamento',
        observacoes: document.getElementById('orcamento-obs').value
      };

      console.log('Saving budget...', servicoData);
      await api.post('/servicos', servicoData);

      showSuccess('Orçamento salvo com sucesso!');
      modal.style.display = "none";
      saveForm.reset();

    } catch (error) {
      console.error('Error saving budget:', error);
      showError('Erro ao salvar orçamento: ' + error.message);
    } finally {
      btn.innerText = originalText;
      btn.disabled = false;
    }
  });

  // ... (rest of the file) ...



  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tipo = tab.dataset.tipo;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      contents.forEach(c => c.classList.remove('active'));
      document.getElementById(`${tipo}-content`).classList.add('active');
    });
  });

  // Gesso form
  const gessoForm = document.getElementById('gessoForm');
  if (gessoForm) {
    gessoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const area = parseFloat(document.getElementById('gesso-area').value);
      const resultado = calcularGesso(area, precos.gesso || {});
      mostrarResultado('gesso', resultado, area);
    });
  }

  // PVC form
  document.getElementById('pvcForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const area = parseFloat(document.getElementById('pvc-area').value);
    const resultado = calcularPVC(area, precos.pvc || {});
    mostrarResultado('pvc', resultado, area);
  });

  // Modular form
  document.getElementById('modularForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const area = parseFloat(document.getElementById('modular-area').value);
    const resultado = calcularModular(area, precos.modular || {});
    mostrarResultado('modular', resultado, area);
  });
}

// Global state for the current calculation
window.currentCalculation = {
  tipo: null,
  area: 0,
  materiais: [],
  total_materiais: 0,
  mao_obra: 0,
  total_geral: 0
};

function mostrarResultado(tipo, resultado, area) {
  // Initialize global state
  window.currentCalculation = {
    tipo,
    area,
    materiais: resultado.materiais.map(m => ({ ...m })), // Deep copy
    total_materiais: resultado.total_materiais,
    mao_obra: resultado.mao_obra,
    total_geral: resultado.total_geral
  };

  renderResultado();
}

const SERVICOS_POR_TIPO = {
  'gesso': [
    'Barramento de tecto falso de gesso',
    'Barramento de paredes',
    'Instalação elétrica',
    'Lixar e pintura',
    'Acabamento profissional'
  ],
  'pvc': [
    'Instalação elétrica',
    'Barramento de paredes',
    'Pinturas de paredes',
    'Acabamento profissional'
  ],
  'modular': [
    'Instalação elétrica',
    'Barramentos de paredes',
    'Pinturas de paredes',
    'Acabamentos profissional'
  ]
};

function renderResultado() {
  const { tipo, area, materiais, total_materiais, mao_obra, total_geral } = window.currentCalculation;
  const container = document.getElementById(`${tipo}-resultado`);

  let html = `
    <div style="background: var(--light); padding: 2rem; border-radius: var(--radius-lg);">
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--primary);">
        📊 Resultado do Cálculo
      </h3>
      
      <div style="margin-bottom: 1.5rem;">
        <p style="color: var(--gray);"><strong>Área:</strong> ${area.toFixed(2)} m²</p>
      </div>

      <h4 style="font-weight: 600; margin-bottom: 1rem;">Materiais Necessários:</h4>
      <table class="table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Quantidade</th>
            <th>Unidade</th>
            <th>Valor Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${materiais.map(m => `
            <tr>
              <td>${m.nome}</td>
              <td>${m.quantidade}</td>
              <td>${m.unidade}</td>
              <td>${formatCurrency(m.preco_unitario || 0)}</td>
              <td>${formatCurrency(m.total || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 1rem;">
        <button class="btn btn-outline btn-sm" onclick="editarMateriais()">✏️ Editar Materiais</button>
      </div>

      <div style="margin-top: 2rem;">
        <h4 style="font-weight: 600; margin-bottom: 1rem;">Serviços Adicionais:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; background: white; padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--light);">
          ${(SERVICOS_POR_TIPO[tipo] || []).map((servico, index) => `
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" class="servico-checkbox" value="${servico}" style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
              <span>${servico}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <div style="margin-top: 2rem; padding: 1.5rem; background: white; border-radius: var(--radius-lg);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
          <span style="font-weight: 600;">Total Materiais:</span>
          <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${formatCurrency(total_materiais)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
          <span style="font-weight: 600;">Mão de Obra (${area.toFixed(2)} m²):</span>
          <span style="font-size: 1.25rem; font-weight: 700; color: var(--secondary);">${formatCurrency(mao_obra)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 2px solid var(--light);">
          <span style="font-size: 1.25rem; font-weight: 700;">TOTAL GERAL:</span>
          <span style="font-size: 1.75rem; font-weight: 800; color: var(--accent);">${formatCurrency(total_geral)}</span>
        </div>
      </div>

      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
        <button class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="salvarOrcamento()">
          💾 Salvar Orçamento
        </button>
        <button class="btn btn-secondary btn-sm" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="gerarRecibo()">
          📄 Gerar Recibo PDF
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  container.style.display = 'block';
}

window.editarMateriais = function () {
  const { tipo, materiais } = window.currentCalculation;
  const container = document.getElementById(`${tipo}-resultado`);

  let html = `
    <div style="background: var(--light); padding: 2rem; border-radius: var(--radius-lg);">
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--primary);">
        ✏️ Editando Materiais
      </h3>

      <table class="table" id="edit-table">
        <thead>
          <tr>
            <th>Material</th>
            <th style="width: 100px;">Qtd</th>
            <th>Unidade</th>
            <th style="width: 120px;">Valor Unit.</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${materiais.map((m, index) => `
            <tr data-index="${index}">
              <td><input type="text" class="form-input" value="${m.nome}" style="width: 100%"></td>
              <td><input type="number" class="form-input" value="${m.quantidade}" step="0.01" style="width: 100%"></td>
              <td>${m.unidade}</td>
              <td><input type="number" class="form-input preco-input" value="${m.preco_unitario || 0}" step="0.01" style="width: 100%"></td>
              <td>
                <button class="btn btn-sm btn-danger" onclick="removerItem(this)" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">🗑️</button>
              </td>
              <input type="hidden" class="unidade-val" value="${m.unidade}">
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 1rem;">
        <button class="btn btn-sm btn-secondary" onclick="adicionarItem()">➕ Adicionar Item</button>
      </div>

      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
        <button class="btn btn-primary btn-sm" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="salvarEdicao()">
          💾 Salvar Alterações
        </button>
        <button class="btn btn-outline btn-sm" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="cancelarEdicao()">
          ❌ Cancelar
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

window.adicionarItem = function () {
  const tbody = document.querySelector('#edit-table tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="form-input" value="Novo Item" style="width: 100%"></td>
    <td><input type="number" class="form-input" value="1" step="0.01" style="width: 100%"></td>
    <td>unidade</td>
    <td><input type="number" class="form-input preco-input" value="0" step="0.01" style="width: 100%"></td>
    <td>
      <button class="btn btn-sm btn-danger" onclick="removerItem(this)" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">🗑️</button>
    </td>
    <input type="hidden" class="unidade-val" value="unidade">
  `;
  tbody.appendChild(tr);
}

window.removerItem = function (btn) {
  btn.closest('tr').remove();
}

window.cancelarEdicao = function () {
  renderResultado();
}

window.salvarEdicao = function () {
  const rows = document.querySelectorAll('#edit-table tbody tr');
  const novosMateriais = [];
  let novoTotalMateriais = 0;

  rows.forEach(row => {
    const nome = row.querySelector('td:nth-child(1) input').value;
    const quantidade = parseFloat(row.querySelector('td:nth-child(2) input').value) || 0;
    const precoUnitario = parseFloat(row.querySelector('.preco-input').value) || 0;
    const unidade = row.querySelector('.unidade-val').value;
    const total = quantidade * precoUnitario;

    novosMateriais.push({
      nome,
      quantidade,
      unidade,
      preco_unitario: precoUnitario,
      total
    });

    novoTotalMateriais += total;
  });

  // Update global state
  window.currentCalculation.materiais = novosMateriais;
  window.currentCalculation.total_materiais = novoTotalMateriais;
  window.currentCalculation.total_geral = novoTotalMateriais + window.currentCalculation.mao_obra;

  renderResultado();
}

window.gerarRecibo = function () {
  const { tipo, area, materiais, total_materiais, mao_obra } = window.currentCalculation;
  const nome = prompt("Digite o nome do cliente para o recibo:");

  const checkboxes = document.querySelectorAll('.servico-checkbox:checked');
  const servicosSelecionados = Array.from(checkboxes).map(cb => cb.value);

  if (nome !== null) {
    gerarReciboPDF(tipo, area, 0, 0, total_materiais, mao_obra, nome, servicosSelecionados);
  }
};

document.getElementById('btnSairCalc')?.addEventListener('click', () => {
  localStorage.removeItem('teto_falso_token');
  localStorage.removeItem('teto_falso_user');
  window.location.hash = 'login';
  window.location.reload();
});

window.salvarOrcamento = function () {
  const modal = document.getElementById('saveModal');
  if (modal) {
    modal.style.display = "block";
    const nomeInput = document.getElementById('cliente-nome');
    if (nomeInput) nomeInput.focus();
  } else {
    console.error('Modal de salvar não encontrado!');
    showError('Erro: Modal de salvar não disponível.');
  }
};

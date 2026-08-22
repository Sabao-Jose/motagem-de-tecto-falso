import { render, api, formatCurrency, showSuccess, showError } from '../app.js';
import { calcularGesso } from '../calculators/gesso.js';
import { calcularPVC } from '../calculators/pvc.js';
import { calcularModular } from '../calculators/modular.js';
import { calcularParede } from '../calculators/parede.js';
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

  // Armazenar precos globalmente para recálculos ao editar área
  window.currentPrecos = precos;

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
        <div class="card" style="border: 2px solid #e0e7ff; background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="font-size: 2rem;">🏛️</span>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--primary);">Cálculo de Tecto de Gesso</h2>
              <p style="color: var(--gray); margin: 0; font-size: 0.92rem;">Cálculo dos materiais necessários baseado na área (m²)</p>
            </div>
          </div>
          
          <form id="gessoForm" style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700;">📐 Área Total (m²)</label>
              <input type="number" class="form-input" id="gesso-area" step="0.01" min="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem; white-space: nowrap; flex-shrink: 0;">
              🔢 Calcular Materiais
            </button>
          </form>

          <div id="gesso-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>

      <!-- PVC Calculator -->
      <div class="tab-content" id="pvc-content">
        <div class="card" style="border: 2px solid #dcfce7; background: linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.04) 100%);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="font-size: 2rem;">📦</span>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--secondary);">Cálculo de Tecto de PVC</h2>
              <p style="color: var(--gray); margin: 0; font-size: 0.92rem;">Cálculo dos materiais necessários baseado na área (m²)</p>
            </div>
          </div>

          <form id="pvcForm" style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700;">📐 Área Total (m²)</label>
              <input type="number" class="form-input" id="pvc-area" step="0.01" min="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem; white-space: nowrap; flex-shrink: 0; background: var(--secondary);">
              🔢 Calcular Materiais
            </button>
          </form>

          <div id="pvc-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>

      <!-- Modular Calculator -->
      <div class="tab-content" id="modular-content">
        <div class="card" style="border: 2px solid #fef08a; background: linear-gradient(135deg, rgba(234,179,8,0.04) 0%, rgba(202,138,4,0.04) 100%);">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
            <span style="font-size: 2rem;">⬜</span>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--accent);">Cálculo de Tecto Modular</h2>
              <p style="color: var(--gray); margin: 0; font-size: 0.92rem;">Cálculo dos materiais necessários baseado na área (m²)</p>
            </div>
          </div>

          <form id="modularForm" style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
            <div class="form-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
              <label class="form-label" style="font-weight: 700;">📐 Área Total (m²)</label>
              <input type="number" class="form-input" id="modular-area" step="0.01" min="0.01" required placeholder="Ex: 200">
            </div>

            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem; white-space: nowrap; flex-shrink: 0; background: var(--accent); color: white;">
              🔢 Calcular Materiais
            </button>
          </form>

          <div id="modular-resultado" style="display: none; margin-top: 2rem;"></div>
        </div>
      </div>
    </div>

    <!-- Massa de Gesso Calculator -->
    <div class="card" style="margin-top: 2.5rem; border: 2px solid #e0e7ff; background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%);">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <span style="font-size: 2rem;">🪣</span>
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--primary);">Calculadora de Massa de Gesso</h2>
          <p style="color: var(--gray); margin: 0; font-size: 0.92rem;">Calcula quantos sacos de gesso são necessários para barrar a superfície</p>
        </div>
      </div>

      <form id="gessoMassaForm" style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="flex: 1; min-width: 180px; margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700;">📐 Área a Barrar (m²)</label>
          <input type="number" class="form-input" id="gesso-massa-area" step="0.01" min="0.01" required placeholder="Ex: 200">
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem; white-space: nowrap; flex-shrink: 0;">
          🔢 Calcular Sacos
        </button>
      </form>

      <div id="gesso-massa-resultado" style="display: none; margin-top: 2rem;"></div>
    </div>

    <!-- Divisão de Paredes Calculator -->
    <div class="card" style="margin-top: 2.5rem; border: 2px solid #dcfce7; background: linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(5,150,105,0.04) 100%);">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <span style="font-size: 2rem;">🧱</span>
        <div>
          <h2 style="font-size: 1.5rem; font-weight: 800; margin: 0; color: var(--secondary);">Divisão de Paredes</h2>
        </div>
      </div>

      <form id="paredeForm" style="margin-top: 1.5rem; display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="flex: 1; min-width: 150px; margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700;">📐 Altura da Parede (m)</label>
          <input type="number" class="form-input" id="parede-altura" step="0.01" min="0.1" required placeholder="Ex: 3.00" value="3.00">
        </div>
        <div class="form-group" style="flex: 1; min-width: 150px; margin-bottom: 0;">
          <label class="form-label" style="font-weight: 700;">📏 Comprimento da Parede (m)</label>
          <input type="number" class="form-input" id="parede-comprimento" step="0.01" min="0.1" required placeholder="Ex: 6.00" value="6.00">
        </div>
        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem; white-space: nowrap; flex-shrink: 0; background: var(--secondary);">
          🔢 Calcular Materiais
        </button>
      </form>

      <div id="parede-resultado" style="display: none; margin-top: 2rem;"></div>
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

  // Massa de Gesso form
  const gessoMassaForm = document.getElementById('gessoMassaForm');
  if (gessoMassaForm) {
    gessoMassaForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const area = parseFloat(document.getElementById('gesso-massa-area').value);
      if (!area || area <= 0) return;
      calcularMassaGesso(area);
    });

    // Live calculation on input
    const areaInput = document.getElementById('gesso-massa-area');
    if (areaInput) {
      areaInput.addEventListener('input', () => {
        const area = parseFloat(areaInput.value);
        if (area > 0) calcularMassaGesso(area);
        else document.getElementById('gesso-massa-resultado').style.display = 'none';
      });
    }
  }

  // Divisão de Paredes form
  const paredeForm = document.getElementById('paredeForm');
  if (paredeForm) {
    paredeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const altura = parseFloat(document.getElementById('parede-altura').value);
      const comprimento = parseFloat(document.getElementById('parede-comprimento').value);
      if (!altura || !comprimento || altura <= 0 || comprimento <= 0) return;
      calcularDivisaoParede(altura, comprimento);
    });
  }
}

function calcularMassaGesso(area) {
  const COB_20KG = 12; // m² por saco de 20 kg
  const COB_25KG = 20; // m² por saco de 25 kg
  const PRECO_20KG = 950; // MT por saco de 20 kg
  const PRECO_25KG = 1300; // MT por saco de 25 kg
  const PRECO_MAO_OBRA_M2 = 250; // MT por m² de mão de obra

  const sacos20 = Math.ceil(area / COB_20KG);
  const sacos25 = Math.ceil(area / COB_25KG);

  const custo_sacos20 = sacos20 * PRECO_20KG;
  const custo_sacos25 = sacos25 * PRECO_25KG;
  const mao_obra = area * PRECO_MAO_OBRA_M2;
  const total_geral_20 = custo_sacos20 + mao_obra;
  const total_geral_25 = custo_sacos25 + mao_obra;

  // Store calculation data for saving
  window.currentMassaCalculation = {
    tipo: 'gesso_massa',
    area,
    sacos20,
    sacos25,
    preco_20: PRECO_20KG,
    preco_25: PRECO_25KG,
    custo_sacos20,
    custo_sacos25,
    mao_obra,
    total_geral_20,
    total_geral_25,
    total_kg_20: sacos20 * 20,
    total_kg_25: sacos25 * 25,
    cobertura_20: sacos20 * COB_20KG,
    cobertura_25: sacos25 * COB_25KG
  };

  const container = document.getElementById('gesso-massa-resultado');
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem;">

      <!-- Saco 20 kg -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: var(--radius-lg); padding: 1.5rem; color: white; box-shadow: 0 4px 20px rgba(99,102,241,0.3);">
        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem;">
          <span style="font-size: 1.75rem;">📦</span>
          <div>
            <p style="margin: 0; font-size: 0.82rem; opacity: 0.85;">Saco de 20 kg (cobre 12 m²)</p>
            <p style="margin: 0; font-size: 0.82rem; opacity: 0.75;">Área: <strong>${area.toFixed(2)} m²</strong></p>
          </div>
        </div>
        <div style="font-size: 3rem; font-weight: 900; line-height: 1;">${sacos20}</div>
        <div style="font-size: 1rem; opacity: 0.9; margin-top: 0.25rem;">sacos necessários</div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; opacity: 0.75; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.6rem;">
          ${sacos20} × 20 kg = <strong>${(sacos20 * 20).toFixed(0)} kg</strong> total &nbsp;·&nbsp; cobre até <strong>${(sacos20 * COB_20KG).toFixed(0)} m²</strong>
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.6rem; opacity: 0.95;">
          Preço unitário: <strong>${formatCurrency(PRECO_20KG)}</strong><br>
          Custo dos sacos: <strong>${formatCurrency(custo_sacos20)}</strong>
        </div>
      </div>

      <!-- Saco 25 kg -->
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: var(--radius-lg); padding: 1.5rem; color: white; box-shadow: 0 4px 20px rgba(16,185,129,0.3);">
        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem;">
          <span style="font-size: 1.75rem;">📦</span>
          <div>
            <p style="margin: 0; font-size: 0.82rem; opacity: 0.85;">Saco de 25 kg (cobre 20 m²)</p>
            <p style="margin: 0; font-size: 0.82rem; opacity: 0.75;">Área: <strong>${area.toFixed(2)} m²</strong></p>
          </div>
        </div>
        <div style="font-size: 3rem; font-weight: 900; line-height: 1;">${sacos25}</div>
        <div style="font-size: 1rem; opacity: 0.9; margin-top: 0.25rem;">sacos necessários</div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; opacity: 0.75; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.6rem;">
          ${sacos25} × 25 kg = <strong>${(sacos25 * 25).toFixed(0)} kg</strong> total &nbsp;·&nbsp; cobre até <strong>${(sacos25 * COB_25KG).toFixed(0)} m²</strong>
        </div>
        <div style="margin-top: 0.75rem; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.25); padding-top: 0.6rem; opacity: 0.95;">
          Preço unitário: <strong>${formatCurrency(PRECO_25KG)}</strong><br>
          Custo dos sacos: <strong>${formatCurrency(custo_sacos25)}</strong>
        </div>
      </div>

    </div>

    <!-- Resumo de Custos -->
    <div style="margin-top: 1.25rem; padding: 1.25rem; background: white; border: 1px solid var(--light); border-radius: var(--radius-lg);">
      <h4 style="font-weight: 700; margin-bottom: 1rem; color: var(--primary);">💰 Resumo de Custos</h4>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">

        <!-- Opção 20 kg -->
        <div style="background: #eef2ff; border-radius: var(--radius-lg); padding: 1rem; border: 1px solid #c7d2fe;">
          <p style="font-weight: 700; margin-bottom: 0.5rem; color: #4338ca;">📦 Opção Sacos de 20 kg</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
            <span>Sacos (${sacos20} × ${formatCurrency(PRECO_20KG)}):</span>
            <strong>${formatCurrency(custo_sacos20)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
            <span>Mão de Obra (${area.toFixed(2)} m² × ${formatCurrency(PRECO_MAO_OBRA_M2)}):</span>
            <strong>${formatCurrency(mao_obra)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; padding-top: 0.5rem; border-top: 2px solid #c7d2fe;">
            <span>TOTAL:</span>
            <span style="color: var(--primary);">${formatCurrency(total_geral_20)}</span>
          </div>
        </div>

        <!-- Opção 25 kg -->
        <div style="background: #ecfdf5; border-radius: var(--radius-lg); padding: 1rem; border: 1px solid #a7f3d0;">
          <p style="font-weight: 700; margin-bottom: 0.5rem; color: #047857;">📦 Opção Sacos de 25 kg</p>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
            <span>Sacos (${sacos25} × ${formatCurrency(PRECO_25KG)}):</span>
            <strong>${formatCurrency(custo_sacos25)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
            <span>Mão de Obra (${area.toFixed(2)} m² × ${formatCurrency(PRECO_MAO_OBRA_M2)}):</span>
            <strong>${formatCurrency(mao_obra)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; padding-top: 0.5rem; border-top: 2px solid #a7f3d0;">
            <span>TOTAL:</span>
            <span style="color: var(--secondary);">${formatCurrency(total_geral_25)}</span>
          </div>
        </div>

      </div>
    </div>

    <div style="margin-top: 1rem; padding: 0.85rem 1rem; background: #fef9c3; border: 1px solid #fde68a; border-radius: var(--radius-lg); font-size: 0.85rem; color: #78350f;">
      ⚠️ <strong>Nota:</strong> Os valores incluem 1 saco extra de margem para perdas (arredondado para cima). Mão de obra calculada a 250 MT/m².
    </div>

    <!-- Save Budget Button -->
    <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
      <button class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 1rem;" onclick="salvarOrcamentoMassa('20')">
        💾 Salvar Orçamento de Massa de Gesso Fino (20 kg)
      </button>
      <button class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 1rem; background: var(--secondary);" onclick="salvarOrcamentoMassa('25')">
        💾 Salvar Orçamento de Massa de Gesso Fino (25 kg)
      </button>
    </div>
  `;
  container.style.display = 'block';
}

// ========== Calculadora de Divisão de Paredes ==========
function calcularDivisaoParede(altura, comprimento) {
  const resultado = calcularParede(altura, comprimento, window.currentPrecos?.parede || {});
  
  // Store for saving
  window.currentCalculation = {
    tipo: 'parede',
    area: resultado.areaTotal,
    materiais: resultado.materiais.map(m => ({ ...m })),
    total_materiais: resultado.total_materiais,
    mao_obra: resultado.mao_obra,
    total_geral: resultado.total_geral
  };

  const container = document.getElementById('parede-resultado');
  
  container.innerHTML = `
    <div style="background: var(--light); padding: 2rem; border-radius: var(--radius-lg);">
      <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--secondary);">
        🧱 Resultado - Divisão de Paredes
      </h3>
      <p style="color: var(--gray); margin-bottom: 1.5rem; font-size: 0.95rem;">
        Gypsum Board Regular 1200x2400x12mm | Raias 3m | Espaçamento 60cm
      </p>

      <!-- Resumo das Dimensões -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: white; padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--secondary);">
          <p style="margin: 0; font-size: 0.8rem; color: var(--gray);">Altura</p>
          <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--secondary);">${altura.toFixed(2)} m</p>
        </div>
        <div style="background: white; padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--secondary);">
          <p style="margin: 0; font-size: 0.8rem; color: var(--gray);">Comprimento</p>
          <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--secondary);">${comprimento.toFixed(2)} m</p>
        </div>
        <div style="background: white; padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--primary);">
          <p style="margin: 0; font-size: 0.8rem; color: var(--gray);">Área por lado</p>
          <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--primary);">${resultado.detalhes.areaPorLado} m²</p>
        </div>
        <div style="background: white; padding: 1rem; border-radius: var(--radius); border-left: 4px solid var(--accent);">
          <p style="margin: 0; font-size: 0.8rem; color: var(--gray);">Área Total (2 lados)</p>
          <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: var(--accent);">${resultado.detalhes.areaTotal} m²</p>
        </div>
      </div>

      <!-- Esquema de Raias -->
      <div style="background: white; padding: 1.25rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem; border: 1px solid #d1d5db;">
        <h4 style="font-weight: 700; margin-bottom: 0.75rem; color: var(--secondary);">📐 Esquema de Raias (Espaçamento 60cm)</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.9rem;">
          <div>📍 Raias por lado: <strong>${resultado.detalhes.raiasPorLado}</strong></div>
          <div>📏 Total de raias: <strong>${resultado.materiais.find(m => m.nome.includes('Raia'))?.quantidade || 'N/A'}</strong></div>
          <div>📄 Chapas por lado: <strong>${resultado.detalhes.chapasPorLado}</strong></div>
          <div>➕ Margem de corte: <strong>${resultado.detalhes.margem}</strong></div>
        </div>
      </div>

      <!-- Lista de Materiais -->
      <h4 style="font-weight: 600; margin-bottom: 1rem;">📦 Lista de Materiais:</h4>
      <div style="display: grid; gap: 0.75rem;">
        ${resultado.materiais.map(m => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: var(--radius); border-left: 4px solid var(--secondary);">
            <div style="flex: 1;">
              <div style="font-weight: 700; color: #1f2937;">${m.nome}</div>
              <div style="font-size: 0.82rem; color: var(--gray);">${m.especificacao || ''}</div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="font-size: 1.1rem; font-weight: 800; color: var(--secondary);">${m.quantidade} ${m.unidade}</div>
              <div style="font-size: 0.85rem; color: var(--gray);">${formatCurrency(m.total)}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Resumo Financeiro -->
      <div style="margin-top: 1.5rem; padding: 1.5rem; background: white; border-radius: var(--radius-lg); border: 2px solid #d1fae5;">
        <h4 style="font-weight: 700; margin-bottom: 1rem; color: var(--secondary);">💰 Resumo Financeiro</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="font-weight: 600;">Total Materiais:</span>
          <span style="font-size: 1.25rem; font-weight: 700; color: var(--secondary);">${formatCurrency(resultado.total_materiais)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
          <span style="font-weight: 600;">Mão de Obra (${resultado.areaTotal.toFixed(2)} m²):</span>
          <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${formatCurrency(resultado.mao_obra)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 2px solid #d1fae5;">
          <span style="font-size: 1.25rem; font-weight: 700;">TOTAL GERAL:</span>
          <span style="font-size: 1.75rem; font-weight: 800; color: var(--accent);">${formatCurrency(resultado.total_geral)}</span>
        </div>
      </div>

      <!-- Botões -->
      <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-primary" style="padding: 0.75rem 1.5rem; font-size: 1rem;" onclick="salvarOrcamentoParede()">
          💾 Salvar Orçamento
        </button>
      </div>
    </div>
  `;
  container.style.display = 'block';
}

window.salvarOrcamentoParede = function () {
  const modal = document.getElementById('saveModal');
  if (modal) {
    modal.style.display = 'block';
    const nomeInput = document.getElementById('cliente-nome');
    if (nomeInput) nomeInput.focus();
  }
};

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
  ],
  'parede': [
    'Divisão de paredes com Gypsum Drywall',
    'Barramento de paredes',
    'Instalação elétrica',
    'Isolamento acústico',
    'Acabamento e pintura'
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
      
      <div style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
        <p style="color: var(--gray); margin: 0;"><strong>Área:</strong> <span id="area-display">${area.toFixed(2)}</span> m²</p>
        <button class="btn btn-outline btn-sm" onclick="editarArea()" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">✏️ Editar Área</button>
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
              <td>
                ${m.nome}
                ${m.detalhe ? `<br><small style="color: var(--gray); font-style: italic;">${m.detalhe}</small>` : ''}
              </td>
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

window.editarArea = function () {
  const { area } = window.currentCalculation;
  const areaDisplay = document.getElementById('area-display');
  if (!areaDisplay) return;

  // Substituir o texto por um campo de input inline
  const parent = areaDisplay.parentElement;
  parent.innerHTML = `
    <span style="color: var(--gray);"><strong>Área:</strong></span>
    <input type="number" id="area-edit-input" class="form-input" value="${area}" step="0.01" min="0.01"
      style="width: 120px; display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.95rem;">
    <span style="color: var(--gray);">m²</span>
    <button class="btn btn-primary btn-sm" onclick="salvarArea()" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">✅ Confirmar</button>
    <button class="btn btn-outline btn-sm" onclick="cancelarEdicaoArea()" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">❌ Cancelar</button>
  `;

  document.getElementById('area-edit-input').focus();
  document.getElementById('area-edit-input').select();
}

window.cancelarEdicaoArea = function () {
  renderResultado();
}

window.salvarArea = function () {
  const input = document.getElementById('area-edit-input');
  if (!input) return;

  const novaArea = parseFloat(input.value);
  if (!novaArea || novaArea <= 0) {
    showError('Insira uma área válida maior que zero.');
    return;
  }

  const { tipo, area: areaAnterior, materiais: materiaisAtuais } = window.currentCalculation;
  const precos = window.currentPrecos || {};
  const precosTipo = precos[tipo] || {};

  const diferencaArea = novaArea - areaAnterior;

  if (Math.abs(diferencaArea) < 0.001) {
    // Área não mudou, apenas fechar o editor
    renderResultado();
    return;
  }

  // Calcular incremento para a diferença de área (usar valor absoluto para quantidade)
  const areaCalculo = Math.abs(diferencaArea);
  let resultadoIncremento;
  switch (tipo) {
    case 'gesso':
      resultadoIncremento = calcularGesso(areaCalculo, precosTipo);
      break;
    case 'pvc':
      resultadoIncremento = calcularPVC(areaCalculo, precosTipo);
      break;
    case 'modular':
      resultadoIncremento = calcularModular(areaCalculo, precosTipo);
      break;
    default:
      showError('Tipo de teto desconhecido.');
      return;
  }

  // Se a área diminuiu, inverter os sinais das quantidades (subtrair)
  if (diferencaArea < 0) {
    resultadoIncremento.materiais.forEach(m => {
      m.quantidade = -m.quantidade;
      m.total = -m.total;
    });
    resultadoIncremento.mao_obra = -resultadoIncremento.mao_obra;
  }

  // Adicionar o incremento aos materiais existentes (preserva edições manuais)
  const novosMateriais = materiaisAtuais.map(m => ({ ...m })); // Deep copy

  resultadoIncremento.materiais.forEach(matIncremento => {
    const existente = novosMateriais.find(m => m.nome === matIncremento.nome);
    if (existente) {
      // Material já existe → somar/subtrair a quantidade e recalcular total da linha
      existente.quantidade = Math.max(0, existente.quantidade + matIncremento.quantidade);
      existente.total = existente.quantidade * existente.preco_unitario;
    } else if (matIncremento.quantidade > 0) {
      // Material novo (apenas se incremento positivo) → adicionar à lista
      novosMateriais.push({ ...matIncremento });
    }
  });

  // Remover materiais que ficaram com quantidade zero
  const materiaisValidos = novosMateriais.filter(m => m.quantidade > 0);

  const novoTotalMateriais = materiaisValidos.reduce((sum, m) => sum + m.total, 0);

  // Calcular mão de obra proporcional à nova área
  const taxaMaoObraM2 = areaCalculo > 0
    ? Math.abs(resultadoIncremento.mao_obra) / areaCalculo
    : (materiaisAtuais.length > 0 ? window.currentCalculation.mao_obra / areaAnterior : 250);
  const novaMaoObra = novaArea * taxaMaoObraM2;

  // Atualizar o estado global com valores anteriores + incremento
  window.currentCalculation = {
    tipo,
    area: novaArea,
    materiais: materiaisValidos,
    total_materiais: novoTotalMateriais,
    mao_obra: novaMaoObra,
    total_geral: novoTotalMateriais + novaMaoObra
  };

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

window.salvarOrcamentoMassa = function (tipoSaco) {
  const modal = document.getElementById('saveModal');
  const calc = window.currentMassaCalculation;
  
  if (!calc || !calc.area) {
    showError('Nenhum cálculo de massa de gesso disponível. Faça o cálculo primeiro.');
    return;
  }

  // Determinar a opção escolhida (20 kg por padrão)
  const usar20 = tipoSaco !== '25';

  const nomeMaterial = usar20
    ? 'Saco de Gesso Fino 20kg'
    : 'Saco de Gesso Fino 25kg';
  const quantidade = usar20 ? calc.sacos20 : calc.sacos25;
  const precoUnitario = usar20 ? calc.preco_20 : calc.preco_25;
  const custoSacos = usar20 ? calc.custo_sacos20 : calc.custo_sacos25;
  const totalGeral = usar20 ? calc.total_geral_20 : calc.total_geral_25;

  // Set the calculation data for the save form to use
  window.currentCalculation = {
    tipo: 'gesso_massa',
    area: calc.area,
    materiais: [
      { nome: nomeMaterial, quantidade, unidade: 'saco', preco_unitario: precoUnitario, total: custoSacos }
    ],
    total_materiais: custoSacos,
    mao_obra: calc.mao_obra,
    total_geral: totalGeral
  };

  if (modal) {
    modal.style.display = "block";
    const nomeInput = document.getElementById('cliente-nome');
    if (nomeInput) nomeInput.focus();
  } else {
    console.error('Modal de salvar não encontrado!');
    showError('Erro: Modal de salvar não disponível.');
  }
};

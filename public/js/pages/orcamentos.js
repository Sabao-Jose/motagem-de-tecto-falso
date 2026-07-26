import { render, api, formatCurrency, showSuccess, showError } from '../app.js';
import { gerarReciboPDF } from '../utils/pdfGenerator.js';

export default async function orcamentosPage() {
    let servicos = [];

    try {
        const response = await api.get('/servicos');
        servicos = response.servicos || [];
    } catch (error) {
        console.error('Error loading budgets:', error);
        showError('Erro ao carregar histórico de orçamentos.');
    }

    let searchTerm = '';

    const getFilteredServicos = () => {
        if (!searchTerm) return servicos;
        const term = searchTerm.toLowerCase();
        return servicos.filter(s => {
            const tipoMap = {
                'gesso': 'Teto de Gesso',
                'pvc': 'Teto de PVC',
                'modular': 'Teto Modular'
            };
            const tipo = tipoMap[s.tipo_teto] || s.tipo_teto;
            return (s.cliente_nome && s.cliente_nome.toLowerCase().includes(term)) ||
                   tipo.toLowerCase().includes(term) ||
                   (s.area && s.area.toString().includes(term)) ||
                   (s.valor_total && s.valor_total.toString().includes(term)) ||
                   (s.data_servico && new Date(s.data_servico).toLocaleDateString('pt-MZ').includes(term));
        });
    };

    const renderTable = () => {
        const filtered = getFilteredServicos();
        if (filtered.length === 0) {
            return `
        <div class="text-center" style="padding: 3rem; color: var(--gray);">
          <p style="font-size: 1.25rem;">${servicos.length === 0 ? 'Nenhum orçamento salvo encontrado.' : 'Nenhum orçamento corresponde à pesquisa.'}</p>
          ${servicos.length === 0 ? '<a href="#calculadora" class="btn btn-primary" style="margin-top: 1rem;">Criar Novo Orçamento</a>' : ''}
        </div>
      `;
        }

        return `
      <div class="card" style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Área</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((s, i) => {
            const data = new Date(s.data_servico).toLocaleDateString('pt-MZ');
            const tipoMap = {
                'gesso': 'Teto de Gesso',
                'pvc': 'Teto de PVC',
                'modular': 'Teto Modular'
            };
            const tipo = tipoMap[s.tipo_teto] || s.tipo_teto;

            return `
                <tr>
                  <td style="font-weight: bold;">${i + 1}</td>
                  <td>${data}</td>
                  <td>${s.cliente_nome || 'N/A'}</td>
                  <td>${tipo}</td>
                  <td>${s.area} m²</td>
                  <td style="font-weight: bold; color: var(--primary);">${formatCurrency(s.valor_total)}</td>
                  <td style="white-space: nowrap;">
                    <div style="display: flex; gap: 0.25rem; align-items: center;">
                      <button class="btn btn-sm btn-secondary" onclick="regerarRecibo(${s.id})" title="Gerar PDF" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        📄 PDF
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="editarOrcamento(${s.id})" title="Editar" style="border-color: var(--primary); color: var(--primary); padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        ✏️ Editar
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="abrirEditarMateriais(${s.id})" title="Editar Materiais" style="border-color: var(--secondary); color: var(--secondary); padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        📦 Materiais
                      </button>
                      <button class="btn btn-sm" onclick="apagarOrcamento(${s.id})" title="Apagar" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                        🗑️ Apagar
                      </button>
                    </div>
                  </td>
                </tr>
              `;
        }).join('')}
          </tbody>
        </table>
      </div>
    `;
    };

    const renderListaOrcamentos = (lista) => {
        if (lista.length === 0) {
            return `<div class="text-center" style="padding: 2rem; color: var(--gray);"><p>Nenhum orçamento encontrado.</p></div>`;
        }
        return `
      <div class="card" style="overflow-x: auto;">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Área</th>
              <th>Materiais</th>
              <th>Mão de Obra</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${lista.map((s, i) => {
            const data = new Date(s.data_servico).toLocaleDateString('pt-MZ');
            const tipoMap = { 'gesso': 'Gesso', 'pvc': 'PVC', 'modular': 'Modular' };
            const tipo = tipoMap[s.tipo_teto] || s.tipo_teto;
            return `
                <tr>
                  <td style="font-weight: bold;">${i + 1}</td>
                  <td>${data}</td>
                  <td>${s.cliente_nome || 'N/A'}</td>
                  <td>${tipo}</td>
                  <td>${s.area} m²</td>
                  <td>${formatCurrency(s.valor_materiais)}</td>
                  <td>${formatCurrency(s.valor_mao_obra)}</td>
                  <td style="font-weight: bold; color: var(--primary);">${formatCurrency(s.valor_total)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    };

    render(`
    <div class="container">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h1 style="font-size: 2.5rem; font-weight: 800;">Histórico de Orçamentos</h1>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="toggleListaOrcamentos()" style="transition: all 0.3s ease;" onmouseenter="this.style.boxShadow='0 0 25px rgba(16, 185, 129, 0.7)'; this.style.borderColor='#10b981'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.boxShadow='none'; this.style.borderColor='var(--primary)'; this.style.transform='none';">📋 Lista</button>
          <button class="btn btn-outline btn-sm" style="transition: all 0.3s ease;" onclick="abrirSistemaRelatorios()" onmouseenter="this.style.boxShadow='0 0 25px rgba(79, 70, 229, 0.7)'; this.style.borderColor='var(--primary-dark)'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.boxShadow='none'; this.style.borderColor='var(--primary)'; this.style.transform='none';">📈 Relatórios</button>
          <a href="#calculadora" class="btn btn-primary btn-sm">➕ Novo</a>
          <button id="btnSairOrc" class="btn btn-sm" style="background: #ef4444; color: white;">🚪 Sair</button>
        </div>
      </div>

      <div class="table-toolbar" style="margin-bottom: 1rem;">
        <input type="text" id="searchOrcamentos" class="table-toolbar-search" placeholder="🔍 Pesquisar por cliente, tipo, área..." style="max-width: 400px;">
        <span style="font-size: 0.85rem; color: var(--gray);" id="searchCount">${servicos.length} registos</span>
      </div>

      <div id="orcamentos-table-container">
        ${renderTable()}
      </div>
    </div>

    <!-- Edit Modal -->
    <div id="editModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div style="background: white; margin: 2rem auto; padding: 2rem; border-radius: var(--radius-lg); width: 90%; max-width: 500px; position: relative;">
        <span onclick="fecharEditModal()" style="position: absolute; right: 1.5rem; top: 1rem; font-size: 1.5rem; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-bottom: 1.5rem; color: var(--primary);">✏️ Editar Orçamento</h2>
        <form id="editForm">
          <div class="form-group">
            <label class="form-label">Nome do Cliente</label>
            <input type="text" class="form-input" id="edit-cliente-nome" required>
          </div>
          <div class="form-group">
            <label class="form-label">Área (m²)</label>
            <input type="number" class="form-input" id="edit-area" step="0.01" required>
          </div>
          <div class="form-group">
            <label class="form-label">Observações</label>
            <textarea class="form-input" id="edit-obs" rows="3"></textarea>
          </div>
          <input type="hidden" id="edit-id">
          <button type="submit" class="btn btn-primary" style="width: 100%;">💾 Salvar Alterações</button>
        </form>
      </div>
    </div>

    <!-- Edit Materials Modal -->
    <div id="editMaterialsModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div style="background: white; margin: 2rem auto; padding: 2rem; border-radius: var(--radius-lg); width: 90%; max-width: 800px; position: relative;">
        <span onclick="fecharEditarMateriaisModal()" style="position: absolute; right: 1.5rem; top: 1rem; font-size: 1.5rem; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-bottom: 1.5rem; color: var(--secondary);">📦 Editar Materiais</h2>
        <div style="overflow-x: auto;">
          <table class="table" id="edit-materials-table">
            <thead>
              <tr>
                <th>Material</th>
                <th style="width: 100px;">Qtd</th>
                <th>Unidade</th>
                <th style="width: 120px;">Valor Unit.</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="edit-materials-tbody">
            </tbody>
          </table>
        </div>
        <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-sm btn-secondary" onclick="adicionarMaterialOrcamento()">➕ Adicionar Item</button>
          <div style="font-size: 1.25rem; font-weight: bold;">Total: <span id="edit-materials-total">0.00 MT</span></div>
        </div>
        <input type="hidden" id="edit-materials-id">
        <button class="btn btn-primary" style="width: 100%; margin-top: 2rem;" onclick="salvarMateriaisOrcamento()">💾 Salvar Materiais</button>
      </div>
    </div>

    <!-- Lista de Orçamentos Modal -->
    <div id="listaOrcamentosModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div style="background: white; margin: 2rem auto; padding: 2rem; border-radius: var(--radius-lg); width: 90%; max-width: 900px; position: relative;">
        <span onclick="toggleListaOrcamentos()" style="position: absolute; right: 1.5rem; top: 1rem; font-size: 1.5rem; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-bottom: 1.5rem; color: #10b981;">📋 Lista de Orçamentos</h2>
        <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
          <input type="text" id="searchListaOrcamentos" class="table-toolbar-search" placeholder="🔍 Pesquisar..." style="max-width: 300px;">
          <span style="font-size: 0.85rem; color: var(--gray);" id="listaSearchCount">${servicos.length} registos</span>
          <div style="margin-left: auto; display: flex; gap: 0.5rem;">
            <button class="btn btn-sm" style="background: #ef4444; color: white;" onclick="exportarListaPDF()">📄 PDF</button>
            <button class="btn btn-sm" style="background: #10b981; color: white;" onclick="exportarListaExcel()">📊 Excel</button>
          </div>
        </div>
        <div id="listaOrcamentosContainer">
          ${renderListaOrcamentos(servicos)}
        </div>
      </div>
    </div>

    <!-- Relatorios Modal -->
    <div id="relatoriosModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); overflow-y: auto;">
      <div style="background: white; margin: 2rem auto; padding: 2rem; border-radius: var(--radius-lg); width: 90%; max-width: 800px; position: relative;">
        <span onclick="fecharSistemaRelatorios()" style="position: absolute; right: 1.5rem; top: 1rem; font-size: 1.5rem; font-weight: bold; cursor: pointer;">&times;</span>
        <h2 style="margin-bottom: 1.5rem; color: var(--primary);">📈 Sistema de Relatórios & Gráficos</h2>
        
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;" id="botoesPeriodo">
            <button class="btn btn-sm btn-primary" onclick="filtrarRelatorios('mensal')">📅 Mensal (Este Mês)</button>
            <button class="btn btn-sm btn-outline" onclick="filtrarRelatorios('6meses')">📅 6 Meses</button>
            <button class="btn btn-sm btn-outline" onclick="filtrarRelatorios('1ano')">📅 1 Ano</button>
            <button class="btn btn-sm btn-outline" onclick="filtrarRelatorios('geral')">🌍 Geral</button>
        </div>

        <div style="margin-bottom: 2rem; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid var(--light);">
            <canvas id="relatorioGrafico" style="width: 100%; max-height: 350px;"></canvas>
        </div>

        <div style="display: flex; gap: 1rem;">
            <button class="btn" style="flex: 1; background: #ef4444; color: white;" onclick="exportarRelatorioAtual('pdf')">📄 Exportar PDF</button>
            <button class="btn" style="flex: 1; background: #10b981; color: white;" onclick="exportarRelatorioAtual('excel')">📊 Exportar Excel</button>
        </div>
      </div>
    </div>
  `);

    // Lista de Orçamentos
    window.toggleListaOrcamentos = () => {
        const modal = document.getElementById('listaOrcamentosModal');
        if (modal.style.display === 'none' || !modal.style.display) {
            modal.style.display = 'block';
            document.getElementById('listaOrcamentosContainer').innerHTML = renderListaOrcamentos(servicos);
        } else {
            modal.style.display = 'none';
        }
    };

    document.getElementById('searchListaOrcamentos')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = servicos.filter(s => {
            const tipoMap = { 'gesso': 'Gesso', 'pvc': 'PVC', 'modular': 'Modular' };
            const tipo = tipoMap[s.tipo_teto] || s.tipo_teto;
            return (s.cliente_nome && s.cliente_nome.toLowerCase().includes(term)) ||
                   tipo.toLowerCase().includes(term) ||
                   (s.area && s.area.toString().includes(term)) ||
                   (s.valor_total && s.valor_total.toString().includes(term)) ||
                   (s.id && s.id.toString().includes(term));
        });
        document.getElementById('listaOrcamentosContainer').innerHTML = renderListaOrcamentos(filtered);
        document.getElementById('listaSearchCount').textContent = `${filtered.length} de ${servicos.length} registos`;
    });

    // Exportar Lista PDF
    window.exportarListaPDF = () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('landscape');
            
            doc.setFontSize(18);
            doc.setTextColor(16, 185, 129);
            doc.text('Lista de Orcamentos', 14, 15);
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Total: ${servicos.length} orcamentos | Data: ${new Date().toLocaleDateString('pt-MZ')}`, 14, 22);
            
            const headers = [['#', 'Data', 'Cliente', 'Tipo', 'Area (m2)', 'Materiais', 'Mao de Obra', 'Total']];
            const rows = servicos.map(s => [
                s.id,
                new Date(s.data_servico).toLocaleDateString('pt-MZ'),
                s.cliente_nome || 'N/A',
                s.tipo_teto === 'gesso' ? 'Gesso' : s.tipo_teto === 'pvc' ? 'PVC' : 'Modular',
                s.area + ' m2',
                formatCurrency(s.valor_materiais),
                formatCurrency(s.valor_mao_obra),
                formatCurrency(s.valor_total)
            ]);

            let totalGeral = 0;
            servicos.forEach(s => totalGeral += s.valor_total);

            doc.autoTable({
                head: headers,
                body: rows,
                startY: 28,
                theme: 'grid',
                headStyles: { fillColor: [16, 185, 129] },
                styles: { fontSize: 8 },
                columnStyles: { 0: { cellWidth: 15 } }
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL GERAL: ${formatCurrency(totalGeral)}`, 14, finalY);
            
            doc.save('Lista_Orcamentos.pdf');
        } catch (e) {
            console.error(e);
            showError('Erro ao exportar PDF. Verifique se a biblioteca jsPDF esta carregada.');
        }
    };

    // Exportar Lista Excel
    window.exportarListaExcel = () => {
        try {
            const data = servicos.map(s => ({
                'ID': s.id,
                'Data': new Date(s.data_servico).toLocaleDateString('pt-MZ'),
                'Cliente': s.cliente_nome || 'N/A',
                'Tipo': s.tipo_teto === 'gesso' ? 'Gesso' : s.tipo_teto === 'pvc' ? 'PVC' : 'Modular',
                'Area (m2)': s.area,
                'Materiais': s.valor_materiais,
                'Mao de Obra': s.valor_mao_obra,
                'Total': s.valor_total,
                'Observacoes': s.observacoes || ''
            }));
            
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Orcamentos');
            XLSX.writeFile(wb, 'Lista_Orcamentos.xlsx');
        } catch (e) {
            console.error(e);
            showError('Erro ao exportar Excel. Verifique se a biblioteca XLSX esta carregada.');
        }
    };

    // PDF
    window.regerarRecibo = (id) => {
        const servico = servicos.find(s => s.id === id);
        if (servico) {
            gerarReciboPDF(
                servico.tipo_teto,
                servico.area,
                servico.largura || 0,
                servico.comprimento || 0,
                servico.valor_materiais,
                servico.valor_mao_obra,
                servico.cliente_nome
            );
        }
    };

    // Delete
    window.apagarOrcamento = async (id) => {
        if (!confirm('Tem certeza que deseja apagar este orçamento? Esta ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/servicos/${id}`);
            servicos = servicos.filter(s => s.id !== id);
            document.getElementById('orcamentos-table-container').innerHTML = renderTable();
            bindEvents();
            showSuccess('Orçamento apagado com sucesso!');
        } catch (error) {
            console.error('Error deleting:', error);
            showError('Erro ao apagar orçamento: ' + error.message);
        }
    };

    // Edit
    window.editarOrcamento = (id) => {
        const servico = servicos.find(s => s.id === id);
        if (!servico) return;
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-cliente-nome').value = servico.cliente_nome || '';
        document.getElementById('edit-area').value = servico.area || '';
        document.getElementById('edit-obs').value = servico.observacoes || '';
        document.getElementById('editModal').style.display = 'block';
    };

    window.fecharEditModal = () => {
        document.getElementById('editModal').style.display = 'none';
    };

    window.onclick = (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) modal.style.display = 'none';
    };

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-id').value);
        const btn = e.target.querySelector('button[type="submit"]');
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        try {
            const updateData = {
                cliente_nome: document.getElementById('edit-cliente-nome').value,
                area: parseFloat(document.getElementById('edit-area').value),
                observacoes: document.getElementById('edit-obs').value
            };

            await api.put(`/servicos/${id}`, updateData);

            // Update local state
            const idx = servicos.findIndex(s => s.id === id);
            if (idx !== -1) {
                servicos[idx] = { ...servicos[idx], ...updateData };
            }

            document.getElementById('editModal').style.display = 'none';
            document.getElementById('orcamentos-table-container').innerHTML = renderTable();
            bindEvents();
            showSuccess('Orçamento atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating:', error);
            showError('Erro ao atualizar orçamento: ' + error.message);
        } finally {
            btn.textContent = '💾 Salvar Alterações';
            btn.disabled = false;
        }
    });

    document.getElementById('searchOrcamentos')?.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        document.getElementById('orcamentos-table-container').innerHTML = renderTable();
        const count = getFilteredServicos().length;
        document.getElementById('searchCount').textContent = `${count} de ${servicos.length} registos`;
    });

    document.getElementById('btnSairOrc')?.addEventListener('click', () => {
        localStorage.removeItem('teto_falso_token');
        localStorage.removeItem('teto_falso_user');
        window.location.hash = 'login';
        window.location.reload();
    });

    // ==================== REPORTING SYSTEM LOGIC ====================
    let relatorioChart = null;
    let dadosFiltrados = [];
    let periodoAtual = 'mensal';

    window.abrirSistemaRelatorios = () => {
        document.getElementById('relatoriosModal').style.display = 'block';
        filtrarRelatorios('mensal');
    };

    window.fecharSistemaRelatorios = () => {
        document.getElementById('relatoriosModal').style.display = 'none';
    };

    window.filtrarRelatorios = (periodo) => {
        periodoAtual = periodo;
        
        // Update buttons styling
        const container = document.getElementById('botoesPeriodo');
        if (container) {
            Array.from(container.children).forEach(btn => {
                if (btn.textContent.toLowerCase().includes(periodo.replace('1ano', 'ano').replace('6meses', 'meses'))) {
                    btn.className = 'btn btn-sm btn-primary';
                } else {
                    btn.className = 'btn btn-sm btn-outline';
                }
            });
            // Fixed hardcoded match for Geral
            if (periodo === 'geral') {
                container.children[3].className = 'btn btn-sm btn-primary';
                container.children[0].className = 'btn btn-sm btn-outline';
            } else if (periodo === 'mensal') {
                container.children[0].className = 'btn btn-sm btn-primary';
                container.children[3].className = 'btn btn-sm btn-outline';
            }
        }

        const hoje = new Date();
        let limiteData = new Date(0); // Para 'geral', o limite é o início dos tempos

        if (periodo === 'mensal') {
            limiteData = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        } else if (periodo === '6meses') {
            limiteData = new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1);
        } else if (periodo === '1ano') {
            limiteData = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
        }

        // Filtra os serviços que têm data maior ou igual ao limite
        dadosFiltrados = servicos.filter(s => {
            const dataS = new Date(s.data_servico || s.created_at);
            return dataS >= limiteData;
        });

        renderizarGrafico(dadosFiltrados, periodo);
    };

    function renderizarGrafico(dados, periodo) {
        const ctx = document.getElementById('relatorioGrafico').getContext('2d');
        if (relatorioChart) relatorioChart.destroy();

        // Agrupar dados
        const faturacaoPorTempo = {};
        
        dados.forEach(s => {
            const d = new Date(s.data_servico || s.created_at);
            let chave;
            if (periodo === 'mensal') {
                chave = d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
            } else {
                chave = d.toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' });
            }
            if (!faturacaoPorTempo[chave]) faturacaoPorTempo[chave] = 0;
            faturacaoPorTempo[chave] += s.valor_total;
        });

        // Ordenar chaves pela data real, se possível, ou confiar na inserção
        const labels = Object.keys(faturacaoPorTempo);
        const values = Object.values(faturacaoPorTempo);

        relatorioChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Faturação (MZN)',
                    data: values,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Crescimento e Faturação da Empresa',
                        font: { size: 16 }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    window.exportarRelatorioAtual = (tipo) => {
        if (dadosFiltrados.length === 0) {
            showError("Nenhum dado encontrado para o período selecionado.");
            return;
        }

        const titulo = `Relatório de Orçamentos (${periodoAtual.toUpperCase()})`;

        if (tipo === 'excel') {
            try {
                const mapData = dadosFiltrados.map(s => ({
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
                XLSX.utils.book_append_sheet(wb, ws, "Relatório");
                XLSX.writeFile(wb, `Relatorio_${periodoAtual}.xlsx`);
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
                
                dadosFiltrados.forEach((s, i) => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    const dataStr = new Date(s.data_servico || s.created_at).toLocaleDateString('pt-MZ');
                    totalValor += s.valor_total;
                    doc.setFont("helvetica", "bold");
                    doc.text(`Orçamento #${s.id} - ${s.cliente_nome || 'N/A'}`, 14, y);
                    y += 6;
                    doc.setFont("helvetica", "normal");
                    doc.text(`Data: ${dataStr} | Teto: ${s.tipo_teto} | Área: ${s.area}m² | Total: ${formatCurrency(s.valor_total)}`, 14, y);
                    y += 10;
                });

                doc.setFont("helvetica", "bold");
                doc.text(`TOTAL FATURADO NO PERÍODO: ${formatCurrency(totalValor)}`, 14, y + 10);
                
                doc.save(`Relatorio_${periodoAtual}.pdf`);
            } catch (e) { console.error(e); showError("Erro ao exportar PDF."); }
        }
    };

    // ==================== MATERIALS EDITING LOGIC ====================
    window.abrirEditarMateriais = (id) => {
        const servico = servicos.find(s => s.id === id);
        if (!servico) return;
        
        document.getElementById('edit-materials-id').value = id;
        
        let materiais = [];
        try {
            materiais = JSON.parse(servico.materiais_json || '[]');
        } catch (e) {
            console.error("Error parsing materials json", e);
        }

        renderMaterialsTable(materiais);
        document.getElementById('editMaterialsModal').style.display = 'block';
    };

    window.fecharEditarMateriaisModal = () => {
        document.getElementById('editMaterialsModal').style.display = 'none';
    };

    const renderMaterialsTable = (materiais) => {
        const tbody = document.getElementById('edit-materials-tbody');
        tbody.innerHTML = '';
        
        materiais.forEach((m, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td><input type="text" class="form-input mat-nome" value="${m.nome}" style="width: 100%"></td>
              <td><input type="number" class="form-input mat-qtd" value="${m.quantidade}" step="0.01" style="width: 100%" oninput="calcularTotalMateriaisOrc()"></td>
              <td><input type="text" class="form-input mat-unid" value="${m.unidade || 'unidade'}" style="width: 100%"></td>
              <td><input type="number" class="form-input mat-preco" value="${m.preco_unitario || 0}" step="0.01" style="width: 100%" oninput="calcularTotalMateriaisOrc()"></td>
              <td>
                <button class="btn btn-sm btn-danger" onclick="removerMaterialOrcamento(this)" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">🗑️</button>
              </td>
            `;
            tbody.appendChild(tr);
        });
        
        calcularTotalMateriaisOrc();
    };

    window.adicionarMaterialOrcamento = () => {
        const tbody = document.getElementById('edit-materials-tbody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-input mat-nome" value="Novo Item" style="width: 100%"></td>
            <td><input type="number" class="form-input mat-qtd" value="1" step="0.01" style="width: 100%" oninput="calcularTotalMateriaisOrc()"></td>
            <td><input type="text" class="form-input mat-unid" value="unidade" style="width: 100%"></td>
            <td><input type="number" class="form-input mat-preco" value="0" step="0.01" style="width: 100%" oninput="calcularTotalMateriaisOrc()"></td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="removerMaterialOrcamento(this)" style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
        calcularTotalMateriaisOrc();
    };

    window.removerMaterialOrcamento = (btn) => {
        btn.closest('tr').remove();
        calcularTotalMateriaisOrc();
    };

    window.calcularTotalMateriaisOrc = () => {
        const rows = document.querySelectorAll('#edit-materials-tbody tr');
        let total = 0;
        rows.forEach(row => {
            const qtd = parseFloat(row.querySelector('.mat-qtd').value) || 0;
            const preco = parseFloat(row.querySelector('.mat-preco').value) || 0;
            total += (qtd * preco);
        });
        document.getElementById('edit-materials-total').innerText = formatCurrency(total);
        return total;
    };

    window.salvarMateriaisOrcamento = async () => {
        const id = parseInt(document.getElementById('edit-materials-id').value);
        const servico = servicos.find(s => s.id === id);
        if (!servico) return;

        const rows = document.querySelectorAll('#edit-materials-tbody tr');
        const novosMateriais = [];
        let novoTotalMateriais = 0;

        rows.forEach(row => {
            const nome = row.querySelector('.mat-nome').value;
            const quantidade = parseFloat(row.querySelector('.mat-qtd').value) || 0;
            const preco_unitario = parseFloat(row.querySelector('.mat-preco').value) || 0;
            const unidade = row.querySelector('.mat-unid').value;
            const total = quantidade * preco_unitario;

            novosMateriais.push({ nome, quantidade, unidade, preco_unitario, total });
            novoTotalMateriais += total;
        });

        // Recalcular total geral
        const mao_obra = servico.valor_mao_obra || 0;
        const total_geral = novoTotalMateriais + mao_obra;

        try {
            const updateData = {
                materiais_json: JSON.stringify(novosMateriais),
                valor_materiais: novoTotalMateriais,
                valor_total: total_geral
            };

            await api.put(`/servicos/${id}/materiais`, updateData);

            // Update local state
            const idx = servicos.findIndex(s => s.id === id);
            if (idx !== -1) {
                servicos[idx] = { ...servicos[idx], ...updateData };
            }

            fecharEditarMateriaisModal();
            document.getElementById('orcamentos-table-container').innerHTML = renderTable();
            showSuccess('Materiais atualizados com sucesso!');
        } catch (error) {
            console.error('Error updating materials:', error);
            showError('Erro ao atualizar materiais: ' + error.message);
        }
    };

    window.onclick = (e) => {
        const modalEdit = document.getElementById('editModal');
        const modalMat = document.getElementById('editMaterialsModal');
        const modalLista = document.getElementById('listaOrcamentosModal');
        if (e.target === modalEdit) modalEdit.style.display = 'none';
        if (e.target === modalMat) modalMat.style.display = 'none';
        if (e.target === modalLista) modalLista.style.display = 'none';
    };

    function bindEvents() {
        // Re-bind after table re-render if needed
    }
}

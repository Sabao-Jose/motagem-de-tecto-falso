import { render, api, formatCurrency } from '../app.js';
import { gerarReciboPDF } from '../utils/pdfGenerator.js';

export default async function mensagensPage() {
    const userData = localStorage.getItem('teto_falso_user');
    const user = userData ? JSON.parse(userData) : null;
    const podeResponder = user && (user.role === 'admin' || user.pode_responder_mensagens);
    const isAdmin = user && user.role === 'admin';

    let mensagens = [];
    let servicos = [];

    try {
        const [msgRes, servRes] = await Promise.all([
            api.get('/contact'),
            api.get('/servicos')
        ]);
        mensagens = msgRes.messages || [];
        servicos = servRes.servicos || [];
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }

    const mensagensNaoLidas = mensagens.filter(m => !m.lido).length;

    render(`
        <div class="container-sm">
            <div class="section-card">
                <div class="table-toolbar">
                    <div>
                        <h2 class="table-toolbar-title">📬 Mensagens de Contacto <span class="table-toolbar-count">${mensagens.length} mensagens · ${mensagensNaoLidas} não lidas</span></h2>
                    </div>
                </div>
                <div id="listaMensagens">
                    ${mensagens.length > 0 ? mensagens.map(m => `
                        <div class="card" style="margin-bottom: 1rem; padding: 1.25rem; ${!m.lido ? 'border-left: 4px solid var(--primary);' : ''}">
                            <div class="table-actions" style="justify-content: space-between; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                                <div>
                                    <strong>${m.nome}</strong>
                                    <span style="color: var(--gray); font-size: 0.85rem; margin-left: 0.75rem;">${m.email}</span>
                                    <span style="color: var(--gray); font-size: 0.85rem; margin-left: 0.75rem;">${m.telefone}</span>
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
                                <div class="table-actions" style="gap: 0.5rem; margin-bottom: 0.5rem;">
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
                                ${m.resposta_orcamento_id ? (() => { const orcSel = servicos.find(s => s.id === m.resposta_orcamento_id); return orcSel ? `
                                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed #bbf7d0;">
                                    <span style="font-size: 0.75rem; color: var(--gray);">📎 Orçamento anexado:</span>
                                    <div class="table-actions" style="justify-content: space-between; margin-top: 0.25rem;">
                                        <span style="font-weight: 600; font-size: 0.9rem;">#${orcSel.id} - ${orcSel.cliente_nome || 'N/A'} (${formatCurrency(orcSel.valor_total)})</span>
                                        <button class="btn-ver-recibo-anexado" data-orc-id="${orcSel.id}" style="background: var(--primary); color: white; padding: 0.25rem 0.6rem; border-radius: var(--radius-md); font-size: 0.75rem; border: none; cursor: pointer;">📄 Ver Recibo</button>
                                    </div>
                                </div>` : '' })() : ''}
                            </div>` : ''}
                            <div class="table-actions" style="justify-content: space-between; margin-top: 0.75rem;">
                                <span style="font-size: 0.8rem; color: var(--gray);">${new Date(m.created_at).toLocaleString('pt-MZ')}</span>
                                <div class="table-actions">
                                    ${!m.lido ? `<button class="btn-marcar-lida" data-msg-id="${m.id}" style="background: var(--primary); color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Marcar como Lida</button>` : ''}
                                    ${!m.respondida && podeResponder ? `<button class="btn-responder-msg" data-msg-id="${m.id}" data-msg-nome="${m.nome}" style="background: #10b981; color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Responder</button>` : ''}
                                    ${isAdmin ? `<button class="btn-deletar-msg" data-msg-id="${m.id}" style="background: #ef4444; color: white; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; border: none; cursor: pointer;">Excluir</button>` : ''}
                                </div>
                            </div>
                        </div>
                    `).join('') : '<div class="empty-state">Nenhuma mensagem recebida.</div>'}
                </div>
            </div>
        </div>
    `);

    bindMessageEvents(mensagens, servicos);
}

function bindMessageEvents(mensagens, servicos) {
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
}

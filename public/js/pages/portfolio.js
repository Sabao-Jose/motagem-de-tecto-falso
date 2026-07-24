import { render, api, showSuccess, showError } from '../app.js';

function getUserRole() {
  const data = localStorage.getItem('teto_falso_user');
  return data ? JSON.parse(data).role : null;
}

export default async function portfolioPage() {
  let portfolio = [];
  let config = {};
  const role = getUserRole();
  const podeGerir = role === 'admin' || role === 'funcionario';

  try {
    const [portfolioRes, configRes] = await Promise.all([
      api.get('/portfolio'),
      api.get('/configuracoes').catch(() => ({ configuracoes: {} }))
    ]);
    portfolio = portfolioRes.portfolio;
    config = configRes.configuracoes || {};
  } catch (error) {
    console.error('Error loading portfolio:', error);
  }

  const empresaTelefone = config.empresa_telefone || '+258870296633';
  const empresaEmail = config.empresa_email || 'tectofalsosabao@gmail.com';
  const telefoneLimpo = empresaTelefone.replace(/[^\d]/g, '');

  const tipos = ['Todos', 'Gesso', 'PVC', 'Modular', 'Pintura', 'Elétrica', 'Acabamentos'];

  render(`
    <div class="container">
      <h1 class="text-center mb-3" style="font-size: 3rem; font-weight: 800;">Nosso Portfólio</h1>
      <p class="text-center mb-3" style="font-size: 1.25rem; color: var(--gray); max-width: 800px; margin: 0 auto 3rem;">
        Confira alguns dos nossos projetos realizados com excelência e dedicação.
      </p>

      <!-- Filters -->
      <div class="tabs" id="portfolioTabs">
        ${tipos.map((tipo, index) => `
          <button class="tab ${index === 0 ? 'active' : ''}" data-tipo="${tipo}">
            ${tipo}
          </button>
        `).join('')}
      </div>

      <!-- Portfolio Grid -->
      <div id="portfolioGrid" class="grid grid-3">
        ${portfolio.length > 0 ? portfolio.map(item => `
          <div class="card portfolio-item" data-tipo="${item.tipo_servico || 'Outros'}" style="position: relative;">
            ${podeGerir ? `
              <button class="btn-delete-portfolio" data-id="${item.id}" title="Excluir projeto" style="position: absolute; bottom: 1rem; right: 1rem; background: #ef4444; color: white; border-radius: var(--radius-md); padding: 0.5rem; display: flex; align-items: center; justify-content: center; z-index: 20; cursor: pointer; border: none; box-shadow: var(--shadow-sm);">
                <span style="font-size: 0.875rem; font-weight: 600; margin-right: 0.5rem;">Excluir</span>
                <span style="font-size: 1rem;">🗑️</span>
              </button>
            ` : ''}
            ${item.imagem_url ? `
              <img src="${item.imagem_url}" class="portfolio-media" alt="${item.titulo}" style="width: 100%; height: 250px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 1rem; cursor: pointer;">
            ` : item.video_url ? `
              <div style="position: relative;">
                <video src="${item.video_url}" class="portfolio-media" style="width: 100%; height: 250px; object-fit: cover; border-radius: var(--radius-lg); margin-bottom: 1rem; cursor: pointer;"></video>
                <div class="flex-center" style="position: absolute; top: 0; left: 0; right: 0; bottom: 1rem; background: rgba(0,0,0,0.2); border-radius: var(--radius-lg); pointer-events: none;">
                  <span style="font-size: 3rem; color: white; opacity: 0.8;">▶️</span>
                </div>
              </div>
            ` : `
              <div style="width: 100%; height: 250px; background: var(--gradient-primary); border-radius: var(--radius-lg); margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 4rem; color: white;">
                🏗️
              </div>
            `}
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${item.titulo}</h3>
            <p style="color: var(--gray); margin-bottom: 0.5rem;">${item.descricao || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
              <span class="badge badge-primary">${item.tipo_servico || 'Outros'}</span>
              ${!podeGerir ? `
                <button class="btn-enviar-portfolio" data-id="${item.id}" data-titulo="${item.titulo}" data-imagem="${item.imagem_url || ''}" data-video="${item.video_url || ''}" style="background: #25D366; color: white; border: none; border-radius: var(--radius-md); padding: 0.4rem 0.75rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
                  📤 Enviar
                </button>
              ` : ''}
            </div>
          </div>
        `).join('') : `
          <div class="card text-center" style="grid-column: 1 / -1; padding: 3rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">📸</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Nenhum Projeto Cadastrado</h3>
            <p style="color: var(--gray);">Em breve adicionaremos nossos projetos aqui.</p>
          </div>
        `}
      </div>

      ${podeGerir ? `
        <!-- Upload Section (Admin/Funcionário) -->
        <section class="section">
          <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
              ➕ Adicionar Novo Projeto
            </h2>
            <form id="portfolioForm">
              <div class="form-group">
                <label class="form-label">Título do Projeto</label>
                <input type="text" class="form-input" id="titulo" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Descrição</label>
                <textarea class="form-textarea" id="descricao"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Tipo de Serviço</label>
                <select class="form-select" id="tipo_servico" required>
                  <option value="">Selecione...</option>
                  <option value="Gesso">Teto de Gesso</option>
                  <option value="PVC">Teto de PVC</option>
                  <option value="Modular">Teto Modular</option>
                  <option value="Pintura">Pintura</option>
                  <option value="Elétrica">Instalação Elétrica</option>
                  <option value="Acabamentos">Acabamentos</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Imagem ou Vídeo</label>
                <input type="file" class="form-input" id="arquivo" accept="image/*,video/*">
              </div>
              
              <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">
                Adicionar ao Portfólio
              </button>
            </form>
          </div>
        </section>
      ` : ''}
    </div>

    <!-- Lightbox -->
    <div id="lightbox" class="lightbox">
      <span class="lightbox-close">&times;</span>
      <div id="lightboxContent" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      </div>
    </div>

    <!-- Share Modal -->
    <div id="shareModal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h3 class="modal-title" id="shareModalTitle">📤 Enviar Projeto</h3>
          <span class="modal-close" id="shareModalClose">&times;</span>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 1rem;">
            <div id="sharePreview" style="width: 100%; height: 180px; border-radius: var(--radius-lg); overflow: hidden; background: var(--light); margin-bottom: 0.75rem;">
              <img id="shareImg" src="" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; display: none;">
              <video id="shareVideo" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" controls></video>
            </div>
            <p id="shareProjectName" style="font-weight: 600; color: var(--dark-700); margin: 0;"></p>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size: 0.9rem;">Sua Mensagem</label>
            <textarea class="form-textarea" id="shareMessage" style="min-height: 100px;" placeholder="Escreva sua mensagem...">Gostei deste modelo! Quero usar este modelo para minha casa.</textarea>
          </div>

          <button id="btnShareAdmin" class="btn" style="width: 100%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem; margin-bottom: 0.75rem; font-weight: 700; font-size: 1rem;">
            📨 Enviar ao Admin (Pedir Orçamento)
          </button>

          <p style="font-size: 0.82rem; color: var(--gray); text-align: center; margin-bottom: 0.75rem;">Ou partilhar por:</p>

          <div style="display: flex; gap: 0.75rem;">
            <button id="btnShareWhatsApp" class="btn" style="flex: 1; background: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem;">
              💬 WhatsApp
            </button>
            <button id="btnShareEmail" class="btn" style="flex: 1; background: #EA4335; color: white; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem;">
              ✉️ Email
            </button>
          </div>
        </div>
      </div>
    </div>
  `);

  // Lightbox functionality
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxClose = document.querySelector('.lightbox-close');
  const portfolioMedia = document.querySelectorAll('.portfolio-media');

  portfolioMedia.forEach(media => {
    media.addEventListener('click', () => {
      const src = media.getAttribute('src');
      if (media.tagName === 'IMG') {
        lightboxContent.innerHTML = `<img src="${src}" class="lightbox-content">`;
      } else if (media.tagName === 'VIDEO') {
        lightboxContent.innerHTML = `<video src="${src}" class="lightbox-content" controls autoplay></video>`;
      }
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    });
  });

  // Delete functionality
  const deleteButtons = document.querySelectorAll('.btn-delete-portfolio');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent opening lightbox
      const id = btn.dataset.id;
      if (confirm('Tem certeza que deseja excluir este projeto do portfólio?')) {
        try {
          await api.delete(`/portfolio/${id}`);
          alert('Projeto excluído com sucesso!');
          window.location.reload();
        } catch (error) {
          console.error('Error deleting:', error);
          alert('Erro ao excluir projeto');
        }
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightboxContent.innerHTML = '';
    document.body.style.overflow = '';
  };

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightboxClose || e.target.classList.contains('lightbox-close')) {
      closeLightbox();
    }
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Filter functionality
  const tabs = document.querySelectorAll('.tab');
  const items = document.querySelectorAll('.portfolio-item');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tipo = tab.dataset.tipo;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Filter items
      items.forEach(item => {
        if (tipo === 'Todos' || item.dataset.tipo === tipo) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Form submission (admin/funcionario only)
  const form = document.getElementById('portfolioForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append('titulo', document.getElementById('titulo').value);
      formData.append('descricao', document.getElementById('descricao').value);
      formData.append('tipo_servico', document.getElementById('tipo_servico').value);

      const arquivo = document.getElementById('arquivo').files[0];
      if (arquivo) {
        formData.append('arquivo', arquivo);
      }

      try {
        await api.uploadFile('/portfolio', formData);
        alert('Projeto adicionado com sucesso!');
        window.location.reload();
      } catch (error) {
        console.error('Error uploading:', error);
        alert('Erro ao adicionar projeto');
      }
    });
  }

  // ==================== SHARE MODAL ====================
  const shareModal = document.getElementById('shareModal');
  const shareModalClose = document.getElementById('shareModalClose');
  let shareItemTitulo = '';
  let shareItemId = '';
  let shareItemImagem = '';
  let shareItemVideo = '';
  let shareItemTipo = '';

  document.querySelectorAll('.btn-enviar-portfolio').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareItemId = btn.dataset.id;
      shareItemTitulo = btn.dataset.titulo;
      shareItemImagem = btn.dataset.imagem;
      shareItemVideo = btn.dataset.video;
      shareItemTipo = btn.dataset.tipo || '';

      document.getElementById('shareModalTitle').textContent = `📤 ${shareItemTitulo}`;
      document.getElementById('shareProjectName').textContent = shareItemTitulo;

      const imgEl = document.getElementById('shareImg');
      const videoEl = document.getElementById('shareVideo');
      imgEl.style.display = 'none';
      videoEl.style.display = 'none';

      if (shareItemVideo) {
        videoEl.src = shareItemVideo;
        videoEl.style.display = 'block';
      } else if (shareItemImagem) {
        imgEl.src = shareItemImagem;
        imgEl.style.display = 'block';
      }

      document.getElementById('shareMessage').value = 'Gostei deste modelo! Quero usar este modelo para minha casa.';
      shareModal.style.display = 'flex';
    });
  });

  // Enviar ao Admin via sistema interno
  document.getElementById('btnShareAdmin').addEventListener('click', async () => {
    const token = localStorage.getItem('teto_falso_token');
    if (!token) {
      shareModal.style.display = 'none';
      if (confirm('Precisa de fazer login para enviar um pedido ao admin.\nDeseja ir para a página de login?')) {
        window.location.hash = 'login';
      }
      return;
    }
    const mensagem = document.getElementById('shareMessage').value || '';
    const btn = document.getElementById('btnShareAdmin');
    btn.disabled = true;
    btn.textContent = 'A enviar...';
    try {
      await api.post('/pedidos-portfolio', {
        portfolio_id: parseInt(shareItemId),
        portfolio_titulo: shareItemTitulo,
        portfolio_imagem: shareItemImagem,
        portfolio_video: shareItemVideo,
        portfolio_tipo: shareItemTipo,
        mensagem
      });
      shareModal.style.display = 'none';
      showSuccess('✅ Pedido enviado! O admin irá contactá-lo em breve.');
    } catch (err) {
      showError('Erro ao enviar pedido: ' + (err.message || 'Tente novamente.'));
    } finally {
      btn.disabled = false;
      btn.textContent = '📨 Enviar ao Admin (Pedir Orçamento)';
    }
  });

  shareModalClose.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) {
      shareModal.style.display = 'none';
    }
  });

  document.getElementById('btnShareWhatsApp').addEventListener('click', () => {
    const message = document.getElementById('shareMessage').value || `Gostei deste modelo! Quero usar este modelo para minha casa.`;
    const texto = `*Portfólio - ${shareItemTitulo}*\n\n${message}`;
    const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
    shareModal.style.display = 'none';
    showSuccess('Redirecionando para WhatsApp...');
  });

  document.getElementById('btnShareEmail').addEventListener('click', () => {
    const message = document.getElementById('shareMessage').value || `Gostei deste modelo! Quero usar este modelo para minha casa.`;
    const assunto = `Interesse no Projeto: ${shareItemTitulo}`;
    const corpo = `Portfólio - ${shareItemTitulo}\n\n${message}`;
    const url = `mailto:${empresaEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    shareModal.style.display = 'none';
    showSuccess('Redirecionando para Email...');
  });
}

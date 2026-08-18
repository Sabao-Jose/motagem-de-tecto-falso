import { render, api, showSuccess, showError } from '../app.js';
import { uploadFileToBlob, isDirectUploadAvailable } from '../utils/blobUploader.js';
import { createProgressBar } from '../utils/uploadProgress.js';

// Ficheiros acima deste limite vão direto ao Blob pelo browser
// (contorna o limite de ~4.5MB do servidor no Vercel Hobby)
const DIRECT_UPLOAD_MIN = 4 * 1024 * 1024; // 4MB

function getUserRole() {
  const data = localStorage.getItem('teto_falso_user');
  return data ? JSON.parse(data).role : null;
}

// ==================== TEXTOS CHAMATIVOS ====================
const FALLBACK_DESCRICOES = {
  'Gesso': 'Tectos de gesso com design elegante e acabamento impecável.',
  'PVC': 'Tectos de PVC resistentes, práticos e fáceis de manter.',
  'Modular': 'Tectos modulares modernos e versáteis para qualquer ambiente.',
  'Pintura': 'Pintura profissional que dá vida e cor aos seus espaços.',
  'Elétrica': 'Instalações elétricas seguras e bem integradas ao tecto.',
  'Acabamentos': 'Acabamentos de alto padrão que valorizam o seu imóvel.'
};

const FILTROS = [
  { nome: 'Todos', icono: '✨' },
  { nome: 'Gesso', icono: '🧱' },
  { nome: 'PVC', icono: '🔵' },
  { nome: 'Modular', icono: '🔳' },
  { nome: 'Pintura', icono: '🎨' },
  { nome: 'Elétrica', icono: '⚡' },
  { nome: 'Acabamentos', icono: '🛠️' }
];

// Evita injeção de HTML (XSS) nos textos vindos da API
const escapeHtml = (str = '') => String(str).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

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

  const tiposUnicos = [...new Set(portfolio.map(p => p.tipo_servico).filter(Boolean))];
  const totalProjetos = portfolio.length;
  const anosExperiencia = new Date().getFullYear() - 2011;

  // Link do WhatsApp para o CTA
  const textoOrcamento = encodeURIComponent('Olá! Vi o portfólio da Tecto Falso Sabão e quero pedir um orçamento para o meu projeto.');
  const whatsappCta = `https://wa.me/${telefoneLimpo}?text=${textoOrcamento}`;

  // ==================== HELPERS DE RENDERIZAÇÃO ====================
  const mediaProjeto = (item) => {
    if (item.imagem_url) {
      return `<img src="${escapeHtml(item.imagem_url)}" class="pf-media" alt="${escapeHtml(item.titulo)}" loading="lazy">`;
    }
    if (item.video_url) {
      return `
        <video src="${escapeHtml(item.video_url)}" class="pf-media" muted playsinline preload="metadata"></video>
        <span class="pf-play">▶</span>
      `;
    }
    return `<div class="pf-media pf-media-placeholder">🏗️</div>`;
  };

  const statsHtml = totalProjetos > 0 ? `
    <div class="pf-stats">
      <div class="pf-stat">
        <span class="pf-stat-value">${totalProjetos}</span>
        <span class="pf-stat-label">Projetos Realizados</span>
      </div>
      <div class="pf-stat">
        <span class="pf-stat-value">${anosExperiencia}+</span>
        <span class="pf-stat-label">Anos de Experiência</span>
      </div>
      <div class="pf-stat">
        <span class="pf-stat-value">${tiposUnicos.length || 6}</span>
        <span class="pf-stat-label">Tipos de Serviço</span>
      </div>
      <div class="pf-stat">
        <span class="pf-stat-value">100%</span>
        <span class="pf-stat-label">Satisfação Garantida</span>
      </div>
    </div>
  ` : '';

  const cardsHtml = portfolio.length > 0 ? portfolio.map((item, index) => `
    <article class="pf-card portfolio-item" data-tipo="${escapeHtml(item.tipo_servico || 'Outros')}">
      <div class="pf-media-wrap" data-index="${index}">
        ${mediaProjeto(item)}
        <span class="pf-badge">${escapeHtml(item.tipo_servico || 'Projeto')}</span>
        <span class="pf-num">${String(index + 1).padStart(2, '0')}</span>
      </div>
      <div class="pf-card-body">
        <h3 class="pf-card-title">${escapeHtml(item.titulo)}</h3>
        <p class="pf-card-desc">${escapeHtml(item.descricao || FALLBACK_DESCRICOES[item.tipo_servico] || 'Projeto exclusivo realizado com excelência e dedicação.')}</p>
        <div class="pf-card-actions">
          ${podeGerir ? `
            <button class="pf-btn pf-btn-danger btn-delete-portfolio" data-id="${item.id}" title="Excluir projeto">
              🗑️ Excluir
            </button>
          ` : ''}
          <button class="pf-btn pf-btn-send btn-enviar-portfolio" data-id="${item.id}" data-titulo="${escapeHtml(item.titulo)}" data-imagem="${escapeHtml(item.imagem_url || '')}" data-video="${escapeHtml(item.video_url || '')}" data-tipo="${escapeHtml(item.tipo_servico || '')}">
            ${podeGerir ? '📤 Partilhar' : '📤 Pedir Orçamento'}
          </button>
        </div>
      </div>
    </article>
  `).join('') : `
    <div class="pf-empty">
      <div class="pf-empty-icon">📸</div>
      <h3>Nenhum Projeto Cadastrado</h3>
      <p>Em breve adicionaremos nossos projetos aqui. Fique atento!</p>
    </div>
  `;

  render(`
    <div class="pf-page">

      <!-- ==================== HERO ==================== -->
      <section class="pf-hero">
        <div class="pf-hero-inner">
          <span class="pf-hero-badge">★ Portfólio de Excelência</span>
          <h1 class="pf-hero-title">Projetos que <span class="pf-hero-gradient">Transformam</span> Ambientes</h1>
          <p class="pf-hero-sub">
            Cada obra conta uma história de qualidade, precisão e design. Explore os nossos projetos
            e inspire-se para criar o espaço dos seus sonhos.
          </p>
          ${statsHtml}
        </div>
      </section>

      <div class="container">

        <!-- ==================== FILTROS ==================== -->
        <div class="pf-filters" id="portfolioTabs">
          ${FILTROS.map((f, index) => `
            <button class="pf-filter ${index === 0 ? 'active' : ''}" data-tipo="${f.nome}">
              <span class="pf-filter-icon">${f.icono}</span> ${f.nome}
            </button>
          `).join('')}
        </div>

        <!-- ==================== QUADRO 2D DE PROJETOS (ROLAGEM AUTOMÁTICA) ==================== -->
        <div class="pf-section-head">
          <h2 class="pf-section-title">Nossos Projetos</h2>
        </div>

        <div class="pf-board" id="pfBoard">
          <div class="pf-board-inner">
            ${cardsHtml}
          </div>
        </div>

        <!-- ==================== CTA ==================== -->
        <section class="pf-cta">
          <div class="pf-cta-text">
            <h3>Pronto para transformar o seu espaço?</h3>
            <p>Peça um orçamento gratuito e veja o seu projeto ganhar vida com a nossa equipa especializada.</p>
          </div>
          <a class="pf-cta-btn" href="${whatsappCta}" target="_blank" rel="noopener">
            💬 Pedir Orçamento Grátis
          </a>
        </section>

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

                <div id="uploadProgressContainer"></div>

                <button type="submit" class="btn btn-primary btn-large" style="width: 100%;">
                  Adicionar ao Portfólio
                </button>
              </form>
            </div>
          </section>
        ` : ''}
      </div>
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

    <!-- Orçamento Modal (escolha WhatsApp / Email) -->
    <div id="orcamentoModal" class="modal" style="display: none;">
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <h3 class="modal-title">📤 Pedir Orçamento</h3>
          <span class="modal-close" id="orcamentoModalClose">&times;</span>
        </div>
        <div class="modal-body" style="text-align: center;">
          <div id="orcamentoPreview" style="width: 100%; height: 160px; border-radius: var(--radius-lg); overflow: hidden; background: var(--light); margin-bottom: 0.75rem;">
            <img id="orcamentoImg" src="" alt="Preview" style="width: 100%; height: 100%; object-fit: cover; display: none;">
            <video id="orcamentoVideo" src="" style="width: 100%; height: 100%; object-fit: cover; display: none;" muted></video>
          </div>
          <p id="orcamentoProjectName" style="font-weight: 700; color: var(--dark-700); margin: 0 0 1.25rem; font-size: 1.05rem;"></p>
          <p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 1.25rem;">
            Escolha a forma de contacto que preferir e receba o seu orçamento rapidamente:
          </p>

          <button id="btnOrcWhatsApp" class="pf-choix-btn" style="width: 100%; background: #25D366; color: white; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.95rem; margin-bottom: 0.75rem; font-weight: 700; font-size: 1.05rem; box-shadow: 0 6px 16px rgba(37, 211, 102, 0.35);">
            💬 WhatsApp
          </button>

          <button id="btnOrcEmail" class="pf-choix-btn" style="width: 100%; background: #EA4335; color: white; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.95rem; margin-bottom: 0.75rem; font-weight: 700; font-size: 1.05rem; box-shadow: 0 6px 16px rgba(234, 67, 53, 0.35);">
            ✉️ Email
          </button>

          <div style="border-top: 1px solid var(--light, #e2e8f0); margin: 0.75rem 0; padding-top: 0.75rem; text-align: center;">
            <p style="color: var(--gray, #94a3b8); font-size: 0.82rem; margin-bottom: 0.75rem;">Ou envie directamente pelo sistema:</p>
            <button id="btnOrcEnviarAdmin" class="pf-choix-btn" style="width: 100%; background: linear-gradient(135deg, #6366f1, #818cf8); color: white; display: flex; align-items: center; justify-content: center; gap: 0.6rem; padding: 0.95rem; font-weight: 700; font-size: 1.05rem; box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);">
              📨 Enviar Pedido ao Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  `);

  // ==================== LIGHTBOX ====================
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxClose = document.querySelector('.lightbox-close');

  // Flag: evita abrir o lightbox após um arraste no carrossel
  let draggedFar = false;

  document.querySelectorAll('.pf-media-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      if (draggedFar) return;
      const media = wrap.querySelector('.pf-media');
      const src = media.getAttribute('src');
      if (media.tagName === 'IMG') {
        lightboxContent.innerHTML = `<img src="${src}" class="lightbox-content">`;
      } else if (media.tagName === 'VIDEO') {
        lightboxContent.innerHTML = `<video src="${src}" class="lightbox-content" controls autoplay></video>`;
      } else {
        return; // placeholder sem mídia
      }
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // ==================== EXCLUIR PROJETO ====================
  document.querySelectorAll('.btn-delete-portfolio').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('Tem certeza que deseja excluir este projeto do portfólio?')) {
        try {
          await api.delete(`/portfolio/${id}`);
          showSuccess('Projecto apagado com sucesso!');
        } catch (error) {
          console.error('Error deleting:', error);
          showError('Erro ao excluir projeto');
        }
      }
    });
  });

  // ==================== FILTROS ====================
  const filters = document.querySelectorAll('.pf-filter');
  const items = document.querySelectorAll('.portfolio-item');

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const tipo = filter.dataset.tipo;

      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');

      items.forEach(item => {
        item.style.display = (tipo === 'Todos' || item.dataset.tipo === tipo) ? 'block' : 'none';
      });
    });
  });

  // ==================== QUADRO 2D (ROLAGEM AUTOMÁTICA) ====================
  const board = document.getElementById('pfBoard');

  const PASSO = 360;

  // Rola automaticamente o quadro (percorre ↑ ↓ ← → sem interação)
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const VELOCIDADE_AUTO = 2;   // px por frame (~83px/s) — ajuste aqui para mais rápido/lento
  const INTERVALO_AUTO = 24;   // ms entre frames
  let autoPanId = null;
  let autoPanPaused = false;

  const stopAutoPan = () => {
    if (autoPanId) { clearInterval(autoPanId); autoPanId = null; }
  };

  const startAutoPan = () => {
    if (prefersReduced) return;
    stopAutoPan();
    let phase = 'right';
    autoPanId = setInterval(() => {
      if (autoPanPaused || document.hidden) return;
      const maxX = board.scrollWidth - board.clientWidth;
      const maxY = board.scrollHeight - board.clientHeight;
      if (maxX <= 0 && maxY <= 0) { stopAutoPan(); return; }
      switch (phase) {
        case 'right':
          if (board.scrollLeft < maxX) board.scrollLeft += VELOCIDADE_AUTO;
          else phase = maxY > 0 ? 'down' : 'left';
          break;
        case 'down':
          if (board.scrollTop < maxY) board.scrollTop += VELOCIDADE_AUTO;
          else phase = 'left';
          break;
        case 'left':
          if (board.scrollLeft > 0) board.scrollLeft -= VELOCIDADE_AUTO;
          else phase = maxY > 0 ? 'up' : 'right';
          break;
        case 'up':
          if (board.scrollTop > 0) board.scrollTop -= VELOCIDADE_AUTO;
          else phase = 'right';
          break;
      }
    }, INTERVALO_AUTO);
  };

  // Pausa ao passar o rato / tocar, para o utilizador ver os projetos com calma
  board.addEventListener('mouseenter', () => { autoPanPaused = true; });
  board.addEventListener('mouseleave', () => { autoPanPaused = false; });
  board.addEventListener('touchstart', () => { autoPanPaused = true; }, { passive: true });
  board.addEventListener('touchend', () => { setTimeout(() => { autoPanPaused = false; }, 3000); });

  startAutoPan();

  // Arraste com o rato em qualquer direção (pan 2D)
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartScrollLeft = 0;
  let dragStartScrollTop = 0;
  let movedTotal = 0;

  board.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    isDragging = true;
    dragStartX = e.pageX;
    dragStartY = e.pageY;
    dragStartScrollLeft = board.scrollLeft;
    dragStartScrollTop = board.scrollTop;
    movedTotal = 0;
    board.classList.add('pf-dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.pageX - dragStartX;
    const dy = e.pageY - dragStartY;
    movedTotal = Math.max(Math.abs(dx), Math.abs(dy));
    if (movedTotal > 8) draggedFar = true;
    board.scrollLeft = dragStartScrollLeft - dx;
    board.scrollTop = dragStartScrollTop - dy;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    board.classList.remove('pf-dragging');
    setTimeout(() => { draggedFar = false; }, 80);
  });

  // Teclado ↑ ↓ ← → quando o quadro está focado
  board.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const delta = {
        ArrowUp: { top: -PASSO },
        ArrowDown: { top: PASSO },
        ArrowLeft: { left: -PASSO },
        ArrowRight: { left: PASSO }
      }[e.key];
      board.scrollBy({ ...delta, behavior: 'smooth' });
    }
  });
  board.setAttribute('tabindex', '0');
  // A rodinha do rato rola para cima/baixo e, com Shift, para os lados
  // (comportamento nativo de um contentor com overflow em ambas as direções)

  // ==================== ANIMAÇÃO DE ENTRADA ====================
  const revealCards = () => {
    if (typeof IntersectionObserver !== 'undefined') {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pf-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('.pf-card').forEach(card => revealObserver.observe(card));
    } else {
      // Fallback: mostrar todos os cards imediatamente
      document.querySelectorAll('.pf-card').forEach(card => card.classList.add('pf-visible'));
    }
  };
  revealCards();

  // ==================== FORMULÁRIO (ADMIN/FUNCIONÁRIO) ====================
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
        // Barra de progresso do upload
        const prog = createProgressBar(document.getElementById('uploadProgressContainer'));
        let emUpload = false;

        // Detectar se é vídeo
        const isVideo = arquivo && (arquivo.type.startsWith('video/') || 
          ['mp4', 'avi', 'mov', 'mkv', 'webm', '3gp', 'ogg'].includes((arquivo.name.split('.').pop() || '').toLowerCase()));

        // 1. Vídeos E ficheiros grandes (>4MB): upload direto ao Blob pelo browser
        //    (contorna o limite de ~4.5MB do Vercel Hobby)
        // 2. Ficheiros pequenos normais: upload via servidor (multer)
        if (arquivo && isDirectUploadAvailable() && (isVideo || arquivo.size > DIRECT_UPLOAD_MIN)) {
          emUpload = true;
          const isVid = isVideo ? 'vídeo' : 'ficheiro';
          prog.show(`A enviar ${isVid} para o armazenamento...`);
          const url = await uploadFileToBlob(arquivo, 'portfolio', (pct) => {
            prog.set(pct, `A enviar ${isVid} para o armazenamento... ${pct}%`);
          });
          const ext = (arquivo.name.split('.').pop() || '').toLowerCase();
          const payload = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            tipo_servico: document.getElementById('tipo_servico').value
          };
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            payload.imagem_url = url;
          } else {
            payload.video_url = url;
          }
          prog.set(95, 'A registar o projecto no servidor...');
          await api.post('/portfolio', payload);
        } else if (arquivo && isVideo) {
          // Vídeo mas Blob não disponível: informar o utilizador
          throw new Error('Vídeos grandes precisam de upload directo. Por favor, use uma ligação de Internet estável ou reduza o tamanho do vídeo (máx 4MB).');
        } else if (arquivo) {
          // Imagem pequena: upload normal via multer
          emUpload = true;
          prog.show('A carregar projecto...');
          await api.uploadFile('/portfolio', formData, 'POST', (pct) => {
            prog.set(pct, `A carregar projecto... ${pct}%`);
          });
        } else {
          // Sem arquivo: enviar como JSON directo
          prog.show('A registar projecto...');
          await api.post('/portfolio', {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            tipo_servico: document.getElementById('tipo_servico').value
          });
          emUpload = true;
        }
        if (emUpload) prog.done('Projecto carregado com sucesso!');
        showSuccess('Projecto adicionado com sucesso!');
        if (emUpload) setTimeout(() => prog.hide(), 1500);
        // Limpar formulário e recarregar a página
        form.reset();
        setTimeout(() => portfolioPage(), 1000);
      } catch (error) {
        console.error('Error uploading:', error);
        const msg = error.message || 'Erro ao adicionar projeto';
        showError(msg);
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

  // ==================== ORÇAMENTO MODAL (ESCOLHA WHATSAPP / EMAIL) ====================
  const orcamentoModal = document.getElementById('orcamentoModal');
  const orcamentoModalClose = document.getElementById('orcamentoModalClose');

  document.querySelectorAll('.btn-enviar-portfolio').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareItemId = btn.dataset.id;
      shareItemTitulo = btn.dataset.titulo;
      shareItemImagem = btn.dataset.imagem;
      shareItemVideo = btn.dataset.video;
      shareItemTipo = btn.dataset.tipo || '';

      // Cliente: modal de escolha (WhatsApp / Email)
      if (!podeGerir) {
        document.getElementById('orcamentoProjectName').textContent = shareItemTitulo;

        const imgOrc = document.getElementById('orcamentoImg');
        const videoOrc = document.getElementById('orcamentoVideo');
        imgOrc.style.display = 'none';
        videoOrc.style.display = 'none';

        if (shareItemVideo) {
          videoOrc.src = shareItemVideo;
          videoOrc.style.display = 'block';
        } else if (shareItemImagem) {
          imgOrc.src = shareItemImagem;
          imgOrc.style.display = 'block';
        }

        orcamentoModal.style.display = 'flex';
        return;
      }

      // Admin/Funcionário: modal de partilha completo
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

  // Botões do modal de orçamento (WhatsApp / Email)
  document.getElementById('btnOrcWhatsApp').addEventListener('click', () => {
    const tipoInfo = shareItemTipo ? ` (${shareItemTipo})` : '';
    const mensagem = `Olá! Vi o projeto *${shareItemTitulo}*${tipoInfo} no portfólio da Tecto Falso Sabão e gostaria de pedir um orçamento.`;
    const url = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
    orcamentoModal.style.display = 'none';
    showSuccess('Redirecionando para WhatsApp...');
  });

  document.getElementById('btnOrcEmail').addEventListener('click', () => {
    const assunto = `Pedido de Orçamento - ${shareItemTitulo}`;
    const corpo = `Olá! Vi o projeto "${shareItemTitulo}" no portfólio da Tecto Falso Sabão e gostaria de pedir um orçamento.\n\nMensagem:`;
    const url = `mailto:${empresaEmail}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.location.href = url;
    orcamentoModal.style.display = 'none';
    showSuccess('Redirecionando para Email...');
  });

  // Enviar pedido ao admin via sistema interno (botão no modal do cliente)
  document.getElementById('btnOrcEnviarAdmin').addEventListener('click', async () => {
    const token = localStorage.getItem('teto_falso_token');
    if (!token) {
      orcamentoModal.style.display = 'none';
      if (confirm('Precisa de fazer login para enviar um pedido ao admin.\nDeseja ir para a página de login?')) {
        window.location.hash = 'login';
      }
      return;
    }
    const btn = document.getElementById('btnOrcEnviarAdmin');
    btn.disabled = true;
    btn.textContent = 'A enviar...';
    try {
      await api.post('/pedidos-portfolio', {
        portfolio_id: parseInt(shareItemId),
        portfolio_titulo: shareItemTitulo,
        portfolio_imagem: shareItemImagem,
        portfolio_video: shareItemVideo,
        portfolio_tipo: shareItemTipo,
        mensagem: `Gostei deste projeto! Gostaria de um orçamento para algo semelhante.`
      });
      orcamentoModal.style.display = 'none';
      showSuccess('✅ Pedido enviado ao admin! Será contactado em breve.');
    } catch (err) {
      showError('Erro ao enviar pedido: ' + (err.message || 'Tente novamente.'));
    } finally {
      btn.disabled = false;
      btn.textContent = '📨 Enviar Pedido ao Admin';
    }
  });

  orcamentoModalClose.addEventListener('click', () => {
    orcamentoModal.style.display = 'none';
  });

  orcamentoModal.addEventListener('click', (e) => {
    if (e.target === orcamentoModal) {
      orcamentoModal.style.display = 'none';
    }
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

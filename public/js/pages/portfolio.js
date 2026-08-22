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
  'Gesso': 'Crie ambientes luxuosos com os nossos tectos em gesso. Acabamento perfeito e design sofisticado que transforma qualquer espaço.',
  'PVC': 'Elegância e praticidade. Tectos em PVC altamente resistentes, fáceis de limpar e com acabamentos modernos.',
  'Modular': 'A escolha ideal para escritórios e áreas comerciais. Tectos modulares com isolamento acústico e visual premium.',
  'Pintura': 'Renove o seu ambiente com a nossa pintura profissional. Cores vibrantes, texturas suaves e acabamento de alto padrão.',
  'Elétrica': 'Iluminação e instalações elétricas integradas ao design do tecto, criando cenários de luz incríveis e acolhedores.',
  'Acabamentos': 'Detalhes que fazem a diferença. Acabamentos minuciosos que elevam a qualidade e valorizam o seu imóvel.'
};

const FILTROS = [
  { nome: 'Todos', icono: '✨' },
  { nome: 'Gesso', icono: '🏛️' },
  { nome: 'PVC', icono: '💠' },
  { nome: 'Modular', icono: '🔳' },
  { nome: 'Pintura', icono: '🎨' },
  { nome: 'Elétrica', icono: '💡' },
  { nome: 'Acabamentos', icono: '🛠️' }
];

// Evita injeção de HTML (XSS) nos textos vindos da API
const escapeHtml = (str = '') => String(str).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

let globListenersAdded = false;

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
      <section class="pf-hero" style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 4rem 1rem; border-radius: var(--radius-lg); margin-bottom: 2rem; color: white; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
        <div class="pf-hero-inner" style="max-width: 800px; margin: 0 auto;">
          <span class="pf-hero-badge" style="background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; font-weight: 600; color: #38bdf8; display: inline-block; margin-bottom: 1rem;">★ Portfólio de Excelência</span>
          <h1 class="pf-hero-title" style="font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; margin-bottom: 1rem; line-height: 1.2;">Projetos que <span class="pf-hero-gradient" style="background: linear-gradient(to right, #38bdf8, #818cf8); -webkit-background-clip: text; color: transparent;">Transformam</span> Ambientes</h1>
          <p class="pf-hero-sub" style="font-size: 1.1rem; color: #94a3b8; margin-bottom: 2rem; line-height: 1.6;">
            Cada obra conta uma história de qualidade, precisão e design. Explore os nossos projetos
            exclusivos e inspire-se para criar o espaço dos seus sonhos.
          </p>
          ${statsHtml}
        </div>
      </section>

      <div class="container">

        <!-- ==================== FILTROS ==================== -->
        <div class="pf-filters" id="portfolioTabs" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; margin-bottom: 2rem;">
          ${FILTROS.map((f, index) => `
            <button class="pf-filter ${index === 0 ? 'active' : ''}" data-tipo="${f.nome}" style="padding: 0.6rem 1.2rem; border-radius: 20px; border: 1px solid var(--light); background: white; cursor: pointer; transition: all 0.3s ease; font-weight: 600; color: var(--dark);">
              <span class="pf-filter-icon">${f.icono}</span> ${f.nome}
            </button>
          `).join('')}
        </div>

        <!-- ==================== QUADRO DE PROJETOS ==================== -->
        <div class="pf-section-head" style="text-align: center; margin-bottom: 2rem;">
          <h2 class="pf-section-title" style="font-size: 2rem; font-weight: 700; color: var(--dark-900);">Nossos Projetos</h2>
          <p style="color: var(--gray); font-size: 1rem; max-width: 600px; margin: 0.5rem auto 0;">Clique nas imagens para ampliar ou peça um orçamento diretamente do projeto que mais gostar.</p>
        </div>

        <div class="pf-board" id="pfBoard" style="margin-bottom: 4rem;">
          <div class="pf-board-inner" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; justify-content: center;">
            ${cardsHtml}
          </div>
        </div>

        <!-- ==================== CTA ==================== -->
        <section class="pf-cta" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 3rem 1.5rem; border-radius: var(--radius-lg); text-align: center; color: white; margin-bottom: 3rem; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);">
          <div class="pf-cta-text" style="margin-bottom: 1.5rem;">
            <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem;">Pronto para transformar o seu espaço?</h3>
            <p style="font-size: 1.1rem; opacity: 0.9;">Peça um orçamento gratuito e veja o seu projeto ganhar vida com a nossa equipa especializada.</p>
          </div>
          <a class="pf-cta-btn" href="${whatsappCta}" target="_blank" rel="noopener" style="display: inline-block; background: white; color: #3b82f6; padding: 1rem 2rem; border-radius: var(--radius-full); font-weight: 700; font-size: 1.1rem; text-decoration: none; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">
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

  document.querySelectorAll('.pf-media-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const media = wrap.querySelector('.pf-media');
      const src = media.getAttribute('src');
      lightboxContent.innerHTML = '';
      if (media.tagName === 'IMG') {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'lightbox-content';
        lightboxContent.appendChild(img);
      } else if (media.tagName === 'VIDEO') {
        const vid = document.createElement('video');
        vid.src = src;
        vid.className = 'lightbox-content';
        vid.controls = true;
        vid.autoplay = true;
        lightboxContent.appendChild(vid);
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

  if (!globListenersAdded) {
    document.addEventListener('keydown', (e) => {
      const lb = document.getElementById('lightbox');
      if (e.key === 'Escape' && lb && lb.classList.contains('active')) {
        lb.classList.remove('active');
        const lbContent = document.getElementById('lightboxContent');
        if (lbContent) lbContent.innerHTML = '';
        document.body.style.overflow = '';
      }
    });
  }

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

      filters.forEach(f => {
        f.classList.remove('active');
        f.style.background = 'white';
        f.style.color = 'var(--dark)';
      });
      filter.classList.add('active');
      filter.style.background = 'var(--primary)';
      filter.style.color = 'white';

      items.forEach(item => {
        item.style.display = (tipo === 'Todos' || item.dataset.tipo === tipo) ? 'block' : 'none';
      });
    });
  });

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
        const blobDiretoDisponivel = await isDirectUploadAvailable();
        if (arquivo && blobDiretoDisponivel && (isVideo || arquivo.size > DIRECT_UPLOAD_MIN)) {
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

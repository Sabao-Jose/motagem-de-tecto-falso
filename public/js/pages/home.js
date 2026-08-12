import { render, api, formatCurrency } from '../app.js';

export default async function homePage() {
  const userData = localStorage.getItem('teto_falso_user');
  const user = userData ? JSON.parse(userData) : null;
  const role = user ? user.role : null;
  const isAdminOrFunc = role === 'admin' || role === 'funcionario';

  let stats = { total_clientes: 0, total_servicos: 0, valor_total_faturado: 0, area_total: 0 };

  try {
    const response = await api.get('/relatorios/estatisticas');
    stats = response.estatisticas;
  } catch (error) {
    console.error('Error loading statistics:', error);
  }

  render(`
    <div class="container hm-page">

      <!-- ============ HERO ============ -->
      <section class="hm-hero">
        <div class="hm-hero-inner">
          <div>
            <span class="hm-hero-badge">🏠 Bem-vindo à Tecto Falso J J Sabao</span>
            <h1 class="hm-hero-title">
              <span class="hm-brand-blue">Tecto Falso</span> <span class="hm-brand-red">J J Sabao</span>
            </h1>
            <p class="hm-hero-sub">
              Excelência em montagem de tectos falsos — Gesso, PVC e Modular, e barramento
              de paredes. Qualidade, precisão e compromisso em cada projeto.
            </p>
            <span class="hm-availability">
              <span class="hm-pulse"></span>
              🗺️ Estamos disponíveis para qualquer canto do país
            </span>
            <div class="hm-hero-chips">
              <span class="hm-chip">✅ Orçamento Grátis</span>
              <span class="hm-chip">🛡️ Garantia de Qualidade</span>
              <span class="hm-chip">👷 Equipa Especializada</span>
            </div>
          </div>
          <div class="hm-founder">
            <div class="hm-founder-img">
              <img src="images/jaime4.jpg" alt="Jaime J J Sabao" onerror="this.onerror=null; this.src='images/logo.png'; this.style.objectFit='contain'; this.style.padding='1rem'; this.style.background='white';">
            </div>
            <p class="hm-founder-caption">Veja os trabalhos no <a href="#portfolio">Portfolio</a> →</p>
          </div>
        </div>
      </section>

      <!-- ============ ESTATÍSTICAS ============ -->
      <section class="hm-stats ${isAdminOrFunc ? 'hm-stats--4' : ''}">
        <div class="hm-stat">
          <div class="hm-stat-icon blue">👥</div>
          <div class="hm-stat-value">${stats.total_servicos}</div>
          <p class="hm-stat-label">Clientes Satisfeitos</p>
        </div>

        <div class="hm-stat">
          <div class="hm-stat-icon pink">🏗️</div>
          <div class="hm-stat-value pink">${stats.total_servicos}</div>
          <p class="hm-stat-label">Projetos Realizados</p>
        </div>

        ${isAdminOrFunc ? `
        <div class="hm-stat">
          <div class="hm-stat-icon green">💰</div>
          <div class="hm-stat-value green">${formatCurrency(stats.valor_total_faturado || 0)}</div>
          <p class="hm-stat-label">Valor Faturado</p>
        </div>
        ` : ''}

        <div class="hm-stat">
          <div class="hm-stat-icon teal">📐</div>
          <div class="hm-stat-value teal">${Math.round(stats.area_total || 0)}m²</div>
          <p class="hm-stat-label">Área Trabalhada</p>
        </div>
      </section>

      <!-- ============ NOSSOS SERVIÇOS ============ -->
      <section class="hm-section">
        <div class="hm-section-head">
          <span class="hm-eyebrow">Nossos Serviços</span>
          <h2 class="hm-section-title">Soluções para <span class="grad">cada espaço</span></h2>
          <p class="hm-section-sub">Instalação profissional de tectos falsos com acabamento impecável e durabilidade garantida.</p>
        </div>

        <div class="hm-svc-grid">
          <div class="hm-svc-card">
            <div class="hm-svc-media">
              <img src="images/tecto_gesso.jpg" alt="Tecto de Gesso">
            </div>
            <div class="hm-svc-body">
              <h3 class="hm-svc-title">Tecto de Gesso</h3>
              <p class="hm-svc-desc">Instalação profissional de tecto falso em gesso. Acabamento perfeito e durabilidade garantida.</p>
            </div>
          </div>

          <div class="hm-svc-card">
            <div class="hm-svc-media">
              <img src="images/tecto_pvc.jpg" alt="Tecto de PVC">
            </div>
            <div class="hm-svc-body">
              <h3 class="hm-svc-title">Tecto de PVC</h3>
              <p class="hm-svc-desc">Solução prática e económica. Resistente à humidade, ideal para banheiros e cozinhas.</p>
            </div>
          </div>

          <div class="hm-svc-card">
            <div class="hm-svc-media">
              <img src="images/tecto_modular.jpg" alt="Tecto Modular">
            </div>
            <div class="hm-svc-body">
              <h3 class="hm-svc-title">Tecto Modular</h3>
              <p class="hm-svc-desc">Sistema modular profissional. Fácil manutenção e acesso às instalações.</p>
            </div>
          </div>
        </div>

        <div class="hm-svc-more">
          <a href="#servicos" class="hm-btn">Ver Todos os Serviços →</a>
        </div>
      </section>

      <!-- ============ POR QUE NOS ESCOLHER ============ -->
      <section class="hm-section">
        <div class="hm-section-head">
          <span class="hm-eyebrow">Por Que Nos Escolher?</span>
          <h2 class="hm-section-title">Vantagens de <span class="grad">trabalhar connosco</span></h2>
          <p class="hm-section-sub">Razões pelas quais clientes de todo o país confiam na Tecto Falso J J Sabao.</p>
        </div>

        <div class="hm-feature-grid">
          <div class="hm-feature-card">
            <div class="hm-feature-icon blue">✅</div>
            <h4>Cálculos Precisos</h4>
            <p>Sistema automatizado de cálculo de materiais garante orçamentos exatos sem desperdício.</p>
          </div>

          <div class="hm-feature-card">
            <div class="hm-feature-icon pink">⚡</div>
            <h4>Atendimento Rápido</h4>
            <p>Orçamentos e recibos gerados instantaneamente. Agilidade no atendimento.</p>
          </div>

          <div class="hm-feature-card">
            <div class="hm-feature-icon green">🎯</div>
            <h4>Qualidade Garantida</h4>
            <p>Equipa técnica qualificada e materiais de primeira linha.</p>
          </div>

          <div class="hm-feature-card">
            <div class="hm-feature-icon violet">📊</div>
            <h4>Transparência Total</h4>
            <p>Relatórios detalhados de materiais e custos. Você sabe exatamente o que está a pagar.</p>
          </div>
        </div>
      </section>

      <!-- ============ CTA ============ -->
      <section class="hm-section">
        <div class="hm-cta">
          <div class="hm-cta-inner">
            <h3>Pronto para Começar? 🚀</h3>
            <p>
              Use a nossa calculadora para obter um orçamento instantâneo ou entre em
              contacto connosco e transforme o seu ambiente hoje mesmo.
            </p>
            <a href="#contato" class="hm-cta-btn">Solicite Nossos Serviços</a>
          </div>
        </div>
      </section>
    </div>
  `);
}

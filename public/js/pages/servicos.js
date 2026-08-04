import { render } from '../app.js';

export default async function servicosPage() {
  render(`
    <div class="container svc-page">

      <!-- ============ HERO ============ -->
      <section class="svc-hero">
        <div class="svc-hero-inner">
          <span class="svc-hero-badge">🔧 Nossos Serviços</span>
          <h1 class="svc-hero-title"><span style="color: #f87171;">Soluções Profissionais em</span> <span class="grad">Tectos Falsos</span></h1>
          <p class="svc-hero-sub">
            Do gesso ao PVC, instalamos tectos falsos com acabamento impecável para casas,
            escritórios e indústrias. Qualidade garantida e orçamento gratuito.
          </p>
        </div>
      </section>

      <!-- ============ SERVIÇOS PRINCIPAIS ============ -->
      <section class="svc-section">
        <div class="svc-section-head">
          <span class="svc-section-eyebrow">Principais Soluções</span>
          <h2 class="svc-section-title">Tectos falsos para <span class="grad">cada necessidade</span></h2>
          <p class="svc-section-sub">Escolha a solução ideal para o seu espaço — todas instaladas por profissionais certificados.</p>
        </div>

        <div class="svc-main-grid">
          <!-- Tecto de Gesso -->
          <div class="svc-card">
            <div class="svc-media">
              <img src="images/tecto_gesso.jpg" alt="Tecto de Gesso">
              <div class="svc-media-badge">🧱</div>
            </div>
            <div class="svc-card-body">
              <h3 class="svc-card-title">Tecto de Gesso</h3>
              <p class="svc-card-desc">
                Instalação profissional em gesso cartonado (drywall). Ideal para ambientes
                internos que necessitam de um acabamento refinado e elegante.
              </p>
              <ul class="svc-features">
                <li>Chapas de 1,20m x 2,40m</li>
                <li>Acabamento liso e uniforme</li>
                <li>Possibilidade de pintura</li>
                <li>Isolamento térmico e acústico</li>
              </ul>
            </div>
          </div>

          <!-- Tecto de PVC -->
          <div class="svc-card">
            <div class="svc-media">
              <img src="images/tecto_pvc.jpg" alt="Tecto de PVC">
              <div class="svc-media-badge">🪣</div>
            </div>
            <div class="svc-card-body">
              <h3 class="svc-card-title">Tecto de PVC</h3>
              <p class="svc-card-desc">
                Solução prática e económica para ambientes húmidos. Resistente à água
                e de fácil manutenção — perfeito para banheiros e cozinhas.
              </p>
              <ul class="svc-features">
                <li>Chapas de 5,80m x 0,25m</li>
                <li>Resistente à humidade</li>
                <li>Fácil limpeza</li>
                <li>Ideal para banheiros e cozinhas</li>
              </ul>
            </div>
          </div>

          <!-- Tecto Modular -->
          <div class="svc-card">
            <div class="svc-media">
              <img src="images/tecto_modular.jpg" alt="Tecto Modular">
              <div class="svc-media-badge">🏢</div>
            </div>
            <div class="svc-card-body">
              <h3 class="svc-card-title">Tecto Modular</h3>
              <p class="svc-card-desc">
                Sistema modular profissional com estrutura metálica. Perfeito para ambientes
                comerciais e industriais que exigem praticidade.
              </p>
              <ul class="svc-features">
                <li>Placas de 60x60cm ou 60x120cm</li>
                <li>Estrutura em perfis T24/T15</li>
                <li>Fácil acesso às instalações</li>
                <li>Manutenção simplificada</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ SERVIÇOS ADICIONAIS ============ -->
      <section class="svc-section">
        <div class="svc-section-head">
          <span class="svc-section-eyebrow">Mais Soluções</span>
          <h2 class="svc-section-title">Serviços <span class="grad">adicionais</span></h2>
          <p class="svc-section-sub">Complementos que garantem um resultado completo e impecável.</p>
        </div>

        <div class="svc-add-grid">
          <div class="svc-add-card">
            <div class="svc-add-icon blue">🎨</div>
            <h4>Barramento</h4>
            <p>Barramento profissional de paredes e tectos para acabamento perfeito.</p>
          </div>

          <div class="svc-add-card">
            <div class="svc-add-icon pink">🖌️</div>
            <h4>Pintura</h4>
            <p>Aplicação de massa de gesso fina e pintura profissional com acabamento impecável.</p>
          </div>

          <div class="svc-add-card">
            <div class="svc-add-icon amber">💡</div>
            <h4>Instalação Elétrica</h4>
            <p>Instalação de pontos de luz e tomadas integradas ao tecto falso.</p>
          </div>

          <div class="svc-add-card">
            <div class="svc-add-icon teal">🔧</div>
            <h4>Reparações</h4>
            <p>Manutenção e reparação de tectos falsos existentes, com acabamento invisível.</p>
          </div>

          <div class="svc-add-card">
            <div class="svc-add-icon violet">📏</div>
            <h4>Nivelamento</h4>
            <p>Preparação e nivelamento de superfícies para uma instalação perfeita.</p>
          </div>

          <div class="svc-add-card">
            <div class="svc-add-icon rose">✨</div>
            <h4>Acabamentos Finos</h4>
            <p>Detalhes finais para um resultado impecável e duradouro.</p>
          </div>
        </div>
      </section>

      <!-- ============ CTA ============ -->
      <section class="svc-section">
        <div class="svc-cta">
          <div class="svc-cta-inner">
            <h3>Interessado nos nossos serviços? 💬</h3>
            <p>
              Peça um orçamento gratuito e sem compromisso. A nossa equipa está pronta
              para transformar o seu espaço com qualidade e no prazo combinado.
            </p>
            <div class="svc-cta-actions">
              <a href="#contato" class="svc-btn svc-btn-ghost">📞 Fale Conosco</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `);
}

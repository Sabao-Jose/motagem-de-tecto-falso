import { render, api } from '../app.js';

export default async function empresaPage() {
  // Carrega dados reais (configurações) para contactos
  let config = {};
  try {
    const configRes = await api.get('/configuracoes').catch(() => ({ configuracoes: {} }));
    config = configRes.configuracoes || {};
  } catch (e) {
    // usa valores padrão em caso de erro
  }

  const telefone = config.empresa_telefone || '+258870296633';
  const telefoneLimpo = telefone.replace(/[^+\d]/g, '');
  const email = config.empresa_email || 'tectofalsosabao@gmail.com';
  const whatsappUrl = `https://wa.me/${telefoneLimpo}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre a Tecto Falso Sabao.')}`;

  render(`
    <div class="container emp-page">

      <!-- ============ HERO ============ -->
      <section class="emp-hero">
        <div class="emp-hero-inner">
          <span class="emp-hero-badge">🏢 Nossa Empresa</span>
          <h1 class="emp-hero-title">
            <span class="emp-brand-blue">Tecto Falso</span> <span class="emp-brand-red">Sabao</span>
          </h1>
          <p class="emp-hero-sub">
            Referência em montagem de tectos falsos em Moçambique desde 2011.
            Qualidade, precisão e dedicação em cada projeto — do primeiro contacto à entrega final.
          </p>
          <div class="emp-stats">
            <div class="emp-stat">
              <div class="emp-stat-value">15+</div>
              <div class="emp-stat-label">Anos de Experiência</div>
            </div>
            <div class="emp-stat">
              <div class="emp-stat-value">100%</div>
              <div class="emp-stat-label">Clientes Satisfeitos</div>
            </div>
            <div class="emp-stat">
              <div class="emp-stat-value">Garantia</div>
              <div class="emp-stat-label">Qualidade Garantida</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ NOSSA HISTÓRIA ============ -->
      <section class="emp-section">
        <div class="emp-section-head">
          <span class="emp-section-eyebrow">Quem Somos</span>
          <h2 class="emp-section-title">Uma história construída com <span class="grad">excelência</span></h2>
          <p class="emp-section-sub">Mais de uma década dedicada a transformar ambientes com tectos falsos de qualidade superior.</p>
        </div>

        <div class="emp-history">
          <div class="emp-history-text">
            <p>
              Fundada em <strong>2011</strong>, a <strong>Tecto Falso Sabao</strong> nasceu com o objetivo de
              revolucionar o mercado de montagem de tectos falsos em Moçambique. Com uma equipa altamente
              qualificada e comprometida com a excelência, rapidamente nos tornámos referência no sector.
            </p>
            <p>
              O nosso diferencial está na combinação de técnicas tradicionais de construção civil com tecnologia
              moderna de gestão e cálculo de materiais. Desenvolvemos um sistema próprio que garante precisão nos
              orçamentos e elimina desperdícios.
            </p>
            <p>
              Hoje, atendemos clientes <strong>residenciais, comerciais e industriais</strong>, sempre com o mesmo
              compromisso: entregar qualidade superior e satisfação total.
            </p>
            <ul class="emp-history-list">
              <li><span class="emp-hi-icon">✓</span> Fundada em 2011, líder em Moçambique</li>
              <li><span class="emp-hi-icon">✓</span> Equipa certificada e em formação contínua</li>
              <li><span class="emp-hi-icon">✓</span> Sistema próprio de cálculo de materiais</li>
              <li><span class="emp-hi-icon">✓</span> Compromisso com prazos e qualidade</li>
            </ul>
          </div>

          <div class="emp-founder">
            <div class="emp-founder-img">
              <img src="images/sabao5.jpg" alt="JOSE JAIME SABAO MATIQUE" onerror="this.style.display='none'">
            </div>
            <p class="emp-founder-name">JOSE JAIME SABAO MATIQUE</p>
            <p class="emp-founder-role">Fundador &amp; Diretor Geral</p>
            <span class="emp-founder-tag">Desde 2011</span>
          </div>
        </div>
      </section>

      <!-- ============ MISSÃO / VISÃO / VALORES ============ -->
      <section class="emp-section">
        <div class="emp-section-head">
          <span class="emp-section-eyebrow">Os Nossos Pilares</span>
          <h2 class="emp-section-title">O que nos <span class="grad">move</span> todos os dias</h2>
        </div>

        <div class="emp-mvv-grid">
          <div class="emp-mvv-card">
            <div class="emp-mvv-icon blue">🎯</div>
            <h3 class="emp-mvv-title">Missão</h3>
            <p class="emp-mvv-desc">
              Proporcionar soluções em tectos falsos com excelência técnica, transparência e compromisso
              com a satisfação do cliente.
            </p>
          </div>

          <div class="emp-mvv-card">
            <div class="emp-mvv-icon pink">👁️</div>
            <h3 class="emp-mvv-title">Visão</h3>
            <p class="emp-mvv-desc">
              Ser a empresa mais confiável e inovadora do sector de tectos falsos em Moçambique até 2030.
            </p>
          </div>

          <div class="emp-mvv-card">
            <div class="emp-mvv-icon teal">⭐</div>
            <h3 class="emp-mvv-title">Valores</h3>
            <p class="emp-mvv-desc">
              Qualidade, Transparência, Inovação, Compromisso e Respeito ao Cliente — em cada detalhe do nosso trabalho.
            </p>
          </div>
        </div>
      </section>

      <!-- ============ COMO TRABALHAMOS ============ -->
      <section class="emp-section">
        <div class="emp-section-head">
          <span class="emp-section-eyebrow">Processo Simples</span>
          <h2 class="emp-section-title">Como <span class="grad">trabalhamos</span></h2>
          <p class="emp-section-sub">Do primeiro contacto à entrega final, um processo claro e sem complicações.</p>
        </div>

        <div class="emp-steps">
          <div class="emp-step">
            <span class="emp-step-num">01</span>
            <div class="emp-step-icon">📞</div>
            <h4>Contacto</h4>
            <p>Fale connosco e explique o seu projeto. Respondemos rapidamente com total atenção às suas necessidades.</p>
          </div>
          <div class="emp-step">
            <span class="emp-step-num">02</span>
            <div class="emp-step-icon">📐</div>
            <h4>Orçamento Grátis</h4>
            <p>Visita técnica e orçamento detalhado sem compromisso, com precisão e sem surpresas nos preços.</p>
          </div>
          <div class="emp-step">
            <span class="emp-step-num">03</span>
            <div class="emp-step-icon">🔨</div>
            <h4>Execução</h4>
            <p>A nossa equipa especializada executa com qualidade, cumprindo prazos e mantendo o local limpo.</p>
          </div>
        </div>
      </section>

      <!-- ============ DIFERENCIAIS ============ -->
      <section class="emp-section">
        <div class="emp-section-head">
          <span class="emp-section-eyebrow">Porquê Escolher-nos</span>
          <h2 class="emp-section-title">Nossos <span class="grad">diferenciais</span></h2>
          <p class="emp-section-sub">Motivos pelos quais centenas de clientes confiam na Tecto Falso Sabao.</p>
        </div>

        <div class="emp-feature-grid">
          <div class="emp-feature-card">
            <div class="emp-feature-icon">👷</div>
            <div>
              <h4>Equipa Qualificada</h4>
              <p>Profissionais certificados e com vasta experiência em montagem de tectos falsos.</p>
            </div>
          </div>

          <div class="emp-feature-card">
            <div class="emp-feature-icon">💡</div>
            <div>
              <h4>Tecnologia Própria</h4>
              <p>Sistema exclusivo de cálculo de materiais que garante precisão e economia.</p>
            </div>
          </div>

          <div class="emp-feature-card">
            <div class="emp-feature-icon">🏆</div>
            <div>
              <h4>Materiais de Qualidade</h4>
              <p>Trabalhamos apenas com fornecedores certificados e materiais de primeira linha.</p>
            </div>
          </div>

          <div class="emp-feature-card">
            <div class="emp-feature-icon">🛡️</div>
            <div>
              <h4>Garantia Total</h4>
              <p>Todos os nossos serviços possuem garantia de qualidade e durabilidade.</p>
            </div>
          </div>

          <div class="emp-feature-card">
            <div class="emp-feature-icon">🤝</div>
            <div>
              <h4>Atendimento Personalizado</h4>
              <p>Cada projeto é único e recebe atenção especial da nossa equipa.</p>
            </div>
          </div>

          <div class="emp-feature-card">
            <div class="emp-feature-icon">⏰</div>
            <div>
              <h4>Prazos Cumpridos</h4>
              <p>Comprometimento com cronogramas e entrega dentro do prazo acordado.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ============ CERTIFICAÇÕES ============ -->
      <section class="emp-section">
        <div class="emp-section-head">
          <span class="emp-section-eyebrow">Confiança</span>
          <h2 class="emp-section-title">Certificações e <span class="grad">qualificações</span></h2>
        </div>

        <div class="emp-cert-grid">
          <div class="emp-cert-card">
            <div class="emp-cert-icon">🏆</div>
            <p>Empresa Certificada</p>
          </div>
          <div class="emp-cert-card">
            <div class="emp-cert-icon">👷</div>
            <p>Equipa Treinada</p>
          </div>
          <div class="emp-cert-card">
            <div class="emp-cert-icon">🔒</div>
            <p>Segurança no Trabalho</p>
          </div>
          <div class="emp-cert-card">
            <div class="emp-cert-icon">♻️</div>
            <p>Práticas Sustentáveis</p>
          </div>
        </div>
      </section>

      <!-- ============ CTA ============ -->
      <section class="emp-section">
        <div class="emp-cta">
          <div class="emp-cta-inner">
            <h3>Pronto para transformar o seu ambiente? 🚀</h3>
            <p>
              Peça o seu orçamento gratuito hoje mesmo. A nossa equipa está pronta para
              tornar o seu projeto em realidade com qualidade e no prazo.
            </p>
            <div class="emp-cta-actions">
              <a href="${whatsappUrl}" target="_blank" rel="noopener" class="emp-btn emp-btn-whatsapp">💬 Pedir Orçamento no WhatsApp</a>
              <a href="mailto:${email}" class="emp-btn emp-btn-ghost">✉️ Enviar Email</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `);
}

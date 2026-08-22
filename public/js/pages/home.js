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
      <section class="hm-hero" style="background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 6rem 2rem; border-radius: 24px; margin-bottom: 3rem; position: relative; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
        <div style="position: absolute; top: -100px; right: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%); border-radius: 50%;"></div>
        <div style="position: absolute; bottom: -100px; left: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%); border-radius: 50%;"></div>
        <div class="hm-hero-inner" style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 2rem;">
          <div style="max-width: 800px;">
            <span class="hm-hero-badge" style="display: inline-block; background: rgba(255,255,255,0.1); padding: 0.5rem 1.5rem; border-radius: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 1.5rem; letter-spacing: 1px; backdrop-filter: blur(5px);">🏠 BEM-VINDO À TECTO FALSO SABAO</span>
            <h1 class="hm-hero-title" style="font-size: clamp(2.5rem, 5vw, 4.5rem); font-weight: 900; line-height: 1.1; margin-bottom: 1.5rem;">
              <span style="color: white;">Tecto Falso</span> <span style="background: linear-gradient(135deg, #ef4444, #f87171); -webkit-background-clip: text; color: transparent;">Sabao</span>
            </h1>
            <p class="hm-hero-sub" style="font-size: 1.25rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2rem;">
              Transformamos espaços comuns em ambientes extraordinários. Excelência em montagem de tectos falsos — Gesso, PVC, Modular e barramento. Qualidade, precisão e compromisso em cada detalhe.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
              <span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">✅ Orçamento Grátis</span>
              <span style="background: rgba(99,102,241,0.15); color: #818cf8; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">🛡️ Garantia de Qualidade</span>
              <span style="background: rgba(245,158,11,0.15); color: #fbbf24; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">👷 Equipa Especializada</span>
            </div>
            <a href="#portfolio" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 1rem 2.5rem; border-radius: 30px; font-weight: 700; font-size: 1.1rem; text-decoration: none; box-shadow: 0 10px 20px rgba(37,99,235,0.4); transition: transform 0.2s;">Explorar Portfólio →</a>
          </div>
        </div>
      </section>

      <!-- ============ ESTATÍSTICAS ============ -->
      <section class="hm-stats ${isAdminOrFunc ? 'hm-stats--4' : ''}" style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; margin-bottom: 4rem;">
        <div class="hm-stat" style="flex: 1; min-width: 200px; background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; border: 1px solid rgba(0,0,0,0.02); transition: transform 0.3s;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">👥</div>
          <div style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; color: transparent; margin-bottom: 0.5rem;">${stats.total_servicos}</div>
          <p style="font-size: 1rem; color: #64748b; font-weight: 600;">Clientes Satisfeitos</p>
        </div>

        <div class="hm-stat" style="flex: 1; min-width: 200px; background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; border: 1px solid rgba(0,0,0,0.02); transition: transform 0.3s;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">🏗️</div>
          <div style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #ec4899, #f43f5e); -webkit-background-clip: text; color: transparent; margin-bottom: 0.5rem;">${stats.total_servicos}</div>
          <p style="font-size: 1rem; color: #64748b; font-weight: 600;">Projetos Realizados</p>
        </div>

        ${isAdminOrFunc ? `
        <div class="hm-stat" style="flex: 1; min-width: 200px; background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; border: 1px solid rgba(0,0,0,0.02); transition: transform 0.3s;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">💰</div>
          <div style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #10b981, #059669); -webkit-background-clip: text; color: transparent; margin-bottom: 0.5rem;">${formatCurrency(stats.valor_total_faturado || 0)}</div>
          <p style="font-size: 1rem; color: #64748b; font-weight: 600;">Valor Faturado</p>
        </div>
        ` : ''}

        <div class="hm-stat" style="flex: 1; min-width: 200px; background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; border: 1px solid rgba(0,0,0,0.02); transition: transform 0.3s;">
          <div style="font-size: 2.5rem; margin-bottom: 1rem;">📐</div>
          <div style="font-size: 2.5rem; font-weight: 900; background: linear-gradient(135deg, #14b8a6, #0d9488); -webkit-background-clip: text; color: transparent; margin-bottom: 0.5rem;">${Math.round(stats.area_total || 0)}m²</div>
          <p style="font-size: 1rem; color: #64748b; font-weight: 600;">Área Trabalhada</p>
        </div>
      </section>

      <!-- ============ NOSSOS SERVIÇOS ============ -->
      <section class="hm-section" style="padding: 4rem 2rem; text-align: center;">
        <div class="hm-section-head" style="margin-bottom: 3rem;">
          <span class="hm-eyebrow" style="color: #3b82f6; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem;">Nossos Serviços</span>
          <h2 class="hm-section-title" style="font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 0.5rem 0;">Soluções para <span class="grad" style="background: linear-gradient(135deg, #3b82f6, #ec4899); -webkit-background-clip: text; color: transparent;">cada espaço</span></h2>
          <p class="hm-section-sub" style="font-size: 1.1rem; color: #64748b; max-width: 600px; margin: 0 auto;">Instalação profissional de tectos falsos com acabamento impecável e durabilidade garantida.</p>
        </div>

        <div class="hm-svc-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1100px; margin: 0 auto;">
          <div class="hm-svc-card" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); transition: transform 0.3s; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-svc-media" style="height: 220px; overflow: hidden;">
              <img src="images/tecto_gesso.jpg" alt="Tecto de Gesso" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
            </div>
            <div class="hm-svc-body" style="padding: 1.5rem; text-align: left;">
              <h3 class="hm-svc-title" style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Tecto de Gesso</h3>
              <p class="hm-svc-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Instalação profissional de tecto falso em gesso. Acabamento perfeito e durabilidade garantida para a sua casa ou escritório.</p>
            </div>
          </div>

          <div class="hm-svc-card" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); transition: transform 0.3s; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-svc-media" style="height: 220px; overflow: hidden;">
              <img src="images/tecto_pvc.jpg" alt="Tecto de PVC" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
            </div>
            <div class="hm-svc-body" style="padding: 1.5rem; text-align: left;">
              <h3 class="hm-svc-title" style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Tecto de PVC</h3>
              <p class="hm-svc-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Solução prática e económica. Resistente à humidade, ideal para banheiros, cozinhas e áreas de serviço.</p>
            </div>
          </div>

          <div class="hm-svc-card" style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); transition: transform 0.3s; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-svc-media" style="height: 220px; overflow: hidden;">
              <img src="images/tecto_modular.jpg" alt="Tecto Modular" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
            </div>
            <div class="hm-svc-body" style="padding: 1.5rem; text-align: left;">
              <h3 class="hm-svc-title" style="font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Tecto Modular</h3>
              <p class="hm-svc-desc" style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Sistema modular profissional. Fácil manutenção, versatilidade e acesso simples às instalações acima do teto.</p>
            </div>
          </div>
        </div>

        <div class="hm-svc-more">
          <a href="#servicos" class="hm-btn">Ver Todos os Serviços →</a>
        </div>
      </section>

      <!-- ============ POR QUE NOS ESCOLHER ============ -->
      <section class="hm-section" style="padding: 4rem 2rem; text-align: center; background: #f8fafc; border-radius: 24px; margin: 3rem 0;">
        <div class="hm-section-head" style="margin-bottom: 3rem;">
          <span class="hm-eyebrow" style="color: #ec4899; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 0.9rem;">Por Que Nos Escolher?</span>
          <h2 class="hm-section-title" style="font-size: 2.5rem; font-weight: 800; color: #1e293b; margin: 0.5rem 0;">Vantagens de <span class="grad" style="background: linear-gradient(135deg, #ec4899, #8b5cf6); -webkit-background-clip: text; color: transparent;">trabalhar connosco</span></h2>
          <p class="hm-section-sub" style="font-size: 1.1rem; color: #64748b; max-width: 600px; margin: 0 auto;">Razões pelas quais clientes de todo o país confiam na Tecto Falso J J Sabao.</p>
        </div>

        <div class="hm-feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; max-width: 1100px; margin: 0 auto;">
          <div class="hm-feature-card" style="background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: center; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-feature-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">✅</div>
            <h4 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Cálculos Precisos</h4>
            <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Sistema automatizado de cálculo de materiais garante orçamentos exatos sem desperdício.</p>
          </div>

          <div class="hm-feature-card" style="background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: center; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-feature-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">⚡</div>
            <h4 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Atendimento Rápido</h4>
            <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Orçamentos e recibos gerados instantaneamente. Agilidade e compromisso no atendimento.</p>
          </div>

          <div class="hm-feature-card" style="background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: center; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-feature-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">🎯</div>
            <h4 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Qualidade Garantida</h4>
            <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Equipa técnica altamente qualificada e materiais de primeira linha em todos os projetos.</p>
          </div>

          <div class="hm-feature-card" style="background: white; padding: 2rem 1.5rem; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); text-align: center; border: 1px solid rgba(0,0,0,0.03);">
            <div class="hm-feature-icon" style="font-size: 2.5rem; margin-bottom: 1rem;">📊</div>
            <h4 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem;">Transparência Total</h4>
            <p style="color: #64748b; font-size: 0.95rem; line-height: 1.6;">Relatórios detalhados de materiais e custos. Você sabe exatamente o que está a pagar.</p>
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

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
    <div class="container">
      <section class="hero" style="background: linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('images/mario3.jpg') no-repeat center center; background-size: cover;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 2.5rem; flex-wrap: wrap;">
          <div style="text-align: left; flex: 1; min-width: 260px;">
            <h1 style="margin-bottom: 1rem;"><span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span></h1>
            <p style="margin-bottom: 0.75rem;">Excelencia em montagem de tectos falsos - Gesso, PVC e Modular e barramento de paredes</p>
            <p style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.45); border-radius: 999px; padding: 0.35rem 1rem; font-size: 0.88rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; backdrop-filter: blur(6px); box-shadow: 0 2px 12px rgba(0,0,0,0.15);">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #4ade80; display: inline-block; box-shadow: 0 0 0 3px rgba(74,222,128,0.3); animation: pulse-green 1.5s infinite;"></span>
                🗺️ Estamos disponiveis para qualquer canto do pais
              </span>
            </p>
          </div>
          <div style="flex-shrink: 0; text-align: center;">
            <img src="images/jaime4.jpg" alt="Jaime J J Sabao" style="width: 220px; height: 220px; object-fit: cover; border-radius: 50%; border: 4px solid rgba(255,255,255,0.5); box-shadow: 0 8px 32px rgba(0,0,0,0.3);" onerror="this.src='images/logo.png'; this.style.objectFit='contain'; this.style.padding='1rem'; this.style.background='white';">
            <p style="margin-top: 0.75rem; font-size: 0.85rem; opacity: 0.9;">Veja os trabalhos no <a href="#portfolio" style="color: white; font-weight: 700; text-decoration: underline;">Portfolio</a></p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="grid ${isAdminOrFunc ? 'grid-4' : 'grid-3'}">
          <div class="card text-center" style="overflow: hidden;">
            <div style="font-size: 3rem; color: var(--primary); margin-bottom: 0.5rem;">👥</div>
            <h3 style="font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 800; color: var(--primary); word-break: break-word; line-height: 1.2;">${stats.total_clientes}</h3>
            <p style="color: var(--gray); margin-top: 0.5rem;">Clientes Satisfeitos</p>
          </div>
          
          <div class="card text-center" style="overflow: hidden;">
            <div style="font-size: 3rem; color: var(--secondary); margin-bottom: 0.5rem;">🏗️</div>
            <h3 style="font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 800; color: var(--secondary); word-break: break-word; line-height: 1.2;">${stats.total_servicos}</h3>
            <p style="color: var(--gray); margin-top: 0.5rem;">Projetos Realizados</p>
          </div>

          ${isAdminOrFunc ? `
          <div class="card text-center" style="overflow: hidden;">
            <div style="font-size: 3rem; color: #10b981; margin-bottom: 0.5rem;">💰</div>
            <h3 style="font-size: clamp(1.2rem, 3vw, 2rem); font-weight: 800; color: #10b981; word-break: break-word; line-height: 1.2;">${formatCurrency(stats.valor_total_faturado || 0)}</h3>
            <p style="color: var(--gray); margin-top: 0.5rem;">Valor Faturado</p>
          </div>
          ` : ''}
          
          <div class="card text-center" style="overflow: hidden;">
            <div style="font-size: 3rem; color: var(--accent); margin-bottom: 0.5rem;">📐</div>
            <h3 style="font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 800; color: var(--accent); word-break: break-word; line-height: 1.2;">${Math.round(stats.area_total || 0)}m²</h3>
            <p style="color: var(--gray); margin-top: 0.5rem;">Area Trabalhada</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="text-center mb-3" style="font-size: 2.5rem; font-weight: 800;">Nossos Servicos</h2>
        <div class="grid grid-3">
          <div class="card">
            <div style="height: 200px; border-radius: var(--radius-lg); margin-bottom: 1rem; overflow: hidden; background: #e0e7ff; display: flex; align-items: center; justify-content: center;">
              <img src="images/tecto_gesso.jpg" alt="Tecto de Gesso" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h3 class="card-title">Tecto de Gesso</h3>
            <p style="color: var(--gray); margin-bottom: 1rem;">Instalacao profissional de tecto falso em gesso. Acabamento perfeito e durabilidade garantida.</p>
          </div>
          
          <div class="card">
            <div style="height: 200px; border-radius: var(--radius-lg); margin-bottom: 1rem; overflow: hidden; background: #dcfce7; display: flex; align-items: center; justify-content: center;">
              <img src="images/tecto_pvc.jpg" alt="Tecto de PVC" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h3 class="card-title">Tecto de PVC</h3>
            <p style="color: var(--gray); margin-bottom: 1rem;">Solucao pratica e economica. Resistente a umidade, ideal para banheiros e cozinhas.</p>
          </div>
          
          <div class="card">
            <div style="height: 200px; border-radius: var(--radius-lg); margin-bottom: 1rem; overflow: hidden; background: #fef3c7; display: flex; align-items: center; justify-content: center;">
              <img src="images/tecto_modular.jpg" alt="Tecto Modular" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <h3 class="card-title">Tecto Modular</h3>
            <p style="color: var(--gray); margin-bottom: 1rem;">Sistema modular profissional. Facil manutencao e acesso as instalacoes.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="text-center mb-3" style="font-size: 2.5rem; font-weight: 800;">Por Que Nos Escolher?</h2>
        <div class="grid grid-2">
          <div class="card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Calculos Precisos</h3>
            <p style="color: var(--gray);">Sistema automatizado de calculo de materiais garante orcamentos exatos sem desperdicio.</p>
          </div>
          <div class="card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚡</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Atendimento Rapido</h3>
            <p style="color: var(--gray);">Orcamentos e recibos gerados instantaneamente. Agilidade no atendimento.</p>
          </div>
          <div class="card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Qualidade Garantida</h3>
            <p style="color: var(--gray);">Equipe tecnica qualificada e materiais de primeira linha.</p>
          </div>
          <div class="card">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Transparencia Total</h3>
            <p style="color: var(--gray);">Relatorios detalhados de materiais e custos. Voce sabe exatamente o que esta pagando.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="card" style="background: var(--gradient-primary); color: white; text-align: center; padding: 3rem;">
          <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem;">Pronto para Comecar?</h2>
          <p style="font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.95;">
            Use nossa calculadora para obter um orcamento instantaneo ou entre em contato conosco.
          </p>
          <div class="flex-center gap-2">
            <a href="#contato" class="btn btn-outline btn-large" style="color: white; border-color: white;">Solicite nossos Servicos</a>
          </div>
        </div>
      </section>
    </div>
  `);
}

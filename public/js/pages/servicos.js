import { render, api } from '../app.js';

export default async function servicosPage() {
  render(`
    <div class="container">
      <h1 class="text-center mb-3" style="font-size: 3rem; font-weight: 800;">Nossos Servicos</h1>
      <p class="text-center mb-3" style="font-size: 1.25rem; color: var(--gray); max-width: 800px; margin: 0 auto 3rem;">
      </p>

      <section class="section">
        <div class="grid grid-3">
          <!-- Tecto de Gesso -->
          <div class="card" style="display: flex; flex-direction: column;">
            <div style="height: 200px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem; background: #e0e7ff;">
              <img src="images/tecto_gesso.jpg" alt="Tecto de Gesso" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column;">
              <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--primary);">Tecto de Gesso</h2>
              <p style="color: var(--gray); margin-bottom: 1rem; font-size: 0.95rem;">Instalacao profissional de teto falso em gesso cartonado (drywall). Ideal para ambientes internos que necessitam de acabamento refinado.</p>
              <h4 style="font-weight: 600; margin-bottom: 0.5rem; font-size: 1rem;">Caracteristicas:</h4>
              <ul style="color: var(--gray); margin-bottom: 1.5rem; padding-left: 1.25rem; font-size: 0.9rem; flex: 1;">
                <li>✓ Chapas de 1,20m x 2,40m</li>
                <li>✓ Acabamento liso e uniforme</li>
                <li>✓ Possibilidade de pintura</li>
                <li>✓ Isolamento termico/acustico</li>
              </ul>
            </div>
          </div>

          <!-- Tecto de PVC -->
          <div class="card" style="display: flex; flex-direction: column;">
            <div style="height: 200px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem; background: #dcfce7;">
              <img src="images/tecto_pvc.jpg" alt="Tecto de PVC" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column;">
              <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--secondary);">Tecto de PVC</h2>
              <p style="color: var(--gray); margin-bottom: 1rem; font-size: 0.95rem;">Solucao pratica e economica para ambientes umidos. Resistente a agua e de facil manutencao.</p>
              <h4 style="font-weight: 600; margin-bottom: 0.5rem; font-size: 1rem;">Caracteristicas:</h4>
              <ul style="color: var(--gray); margin-bottom: 1.5rem; padding-left: 1.25rem; font-size: 0.9rem; flex: 1;">
                <li>✓ Chapas de 5,80m x 0,25m</li>
                <li>✓ Resistente a umidade</li>
                <li>✓ Facil limpeza</li>
                <li>✓ Ideal para banheiros/cozinhas</li>
              </ul>
            </div>
          </div>

          <!-- Tecto Modular -->
          <div class="card" style="display: flex; flex-direction: column;">
            <div style="height: 200px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 1.5rem; background: #fef3c7;">
              <img src="images/tecto_modular.jpg" alt="Tecto Modular" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div style="flex: 1; display: flex; flex-direction: column;">
              <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; color: var(--accent);">Tecto Modular</h2>
              <p style="color: var(--gray); margin-bottom: 1rem; font-size: 0.95rem;">Sistema modular profissional com estrutura metalica. Perfeito para ambientes comerciais e industriais.</p>
              <h4 style="font-weight: 600; margin-bottom: 0.5rem; font-size: 1rem;">Caracteristicas:</h4>
              <ul style="color: var(--gray); margin-bottom: 1.5rem; padding-left: 1.25rem; font-size: 0.9rem; flex: 1;">
                <li>✓ Placas de 60x60cm ou 60x120cm</li>
                <li>✓ Estrutura em perfis T24/T15</li>
                <li>✓ Facil acesso as instalacoes</li>
                <li>✓ Manutencao simplificada</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <h2 class="text-center mb-3" style="font-size: 2.5rem; font-weight: 800;">Servicos Adicionais</h2>
        
        <div class="grid grid-3">
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🎨</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Barramento</h3>
            <p style="color: var(--gray);">Barramento profissional de paredes e tectos para acabamento perfeito.</p>
          </div>
          
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🖌️</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Pintura</h3>
            <p style="color: var(--gray);">Aplicacao de massa de gesso fina e pintura profissional com acabamento impecavel.</p>
          </div>
          
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">💡</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Instalacao Eletrica</h3>
            <p style="color: var(--gray);">Instalacao de pontos de luz e tomadas integradas ao tecto falso.</p>
          </div>
          
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">🔧</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Reparacoes</h3>
            <p style="color: var(--gray);">Manutencao e reparacao de tectos falsos existentes.</p>
          </div>
          
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">📏</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Nivelamento</h3>
            <p style="color: var(--gray);">Preparacao e nivelamento de superficies para instalacao.</p>
          </div>
          
          <div class="card text-center">
            <div style="font-size: 4rem; margin-bottom: 1rem;">✨</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Acabamentos Finos</h3>
            <p style="color: var(--gray);">Detalhes finais para um resultado impecavel.</p>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="card text-center" style="background: var(--gradient-primary); color: white; padding: 3rem;">
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem;">Interessado em Nossos Servicos?</h2>
          <p style="font-size: 1.125rem; margin-bottom: 2rem; opacity: 0.95;">Entre em contato conosco ou use nossa calculadora para obter um orcamento instantaneo.</p>
          <div class="flex-center gap-2">
            <a href="#contato" class="btn btn-outline btn-large" style="color: white; border-color: white;">Falar Conosco</a>
          </div>
        </div>
      </section>
    </div>
  `);
}

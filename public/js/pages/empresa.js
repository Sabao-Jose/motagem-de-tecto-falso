import { render } from '../app.js';

export default async function empresaPage() {
  render(`
    <div class="container">
      <h1 class="text-center mb-3" style="font-size: 3rem; font-weight: 800;">Sobre Nossa Empresa</h1>
      
      <!-- Hero -->
      <section class="section">
        <div style="
          position: relative;
          border-radius: var(--radius-lg);
          overflow: hidden;
          height: 420px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        ">
          <img 
            src="images/empresa_hero.jpg" 
            alt="Tecto Falso Sabao" 
            style="
              width: 100%; 
              height: 100%; 
              object-fit: cover; 
              object-position: center;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
              filter: contrast(1.08) saturate(1.1) brightness(0.95);
              display: block;
            "
          >
          <!-- Overlay gradiente escuro por baixo para legibilidade do texto -->
          <div style="
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%);
          "></div>
          <!-- Texto por cima da imagem -->
          <div style="
            position: absolute;
            bottom: 4rem; left: 0; right: 0;
            padding: 2.5rem 3rem;
            color: white;
            text-align: center;
          ">
            <h2 style="font-size: 2.8rem; font-weight: 800; margin-bottom: 0.75rem; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">Sabao</span>
            </h2>
            <p style="font-size: 1.2rem; opacity: 0.95; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
              Referência em montagem de tectos falsos em Moçambique desde 2011
            </p>
          </div>
        </div>
      </section>

      <!-- Nossa História -->
      <section class="section">
        <div class="card">
          <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 250px;">
              <h2 style="font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--primary);">
                📖 Nossa História
              </h2>
              <p style="color: var(--gray); line-height: 1.8; margin-bottom: 1rem;">
                Fundada em 2020, a <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">Sabao</span> nasceu com o objetivo de revolucionar o mercado de montagem de tetos falsos em Moçambique. Com uma equipe altamente qualificada e comprometida com a excelência, rapidamente nos tornamos referência no setor.
              </p>
              <p style="color: var(--gray); line-height: 1.8; margin-bottom: 1rem;">
                Nosso diferencial está na combinação de técnicas tradicionais de construção civil com tecnologia moderna de gestão e cálculo de materiais. Desenvolvemos um sistema próprio que garante precisão nos orçamentos e elimina desperdícios.
              </p>
              <p style="color: var(--gray); line-height: 1.8;">
                Hoje, atendemos clientes residenciais, comerciais e industriais, sempre com o mesmo compromisso: entregar qualidade superior e satisfação total.
              </p>
            </div>
            <div style="flex-shrink: 0; text-align: center;">
              <img src="images/sabao5.jpg" alt="Jaime J J Sabao" style="width: 200px; height: 200px; object-fit: cover; border-radius: 50%; border: 4px solid var(--primary); box-shadow: 0 8px 32px rgba(0,0,0,0.15);" onerror="this.style.display='none'">
              <p style="margin-top: 0.75rem; font-weight: 600; color: var(--primary);">JOSE JAIME SABAO MATIQUE</p>
              <p style="font-size: 0.85rem; color: var(--gray);">Fundador</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Missão, Visão e Valores -->
      <section class="section">
        <div class="grid grid-3">
          <div class="card">
            <div style="font-size: 4rem; text-align: center; margin-bottom: 1rem;">🎯</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-align: center; color: var(--primary);">
              Missão
            </h3>
            <p style="color: var(--gray); text-align: center; line-height: 1.6;">
              Proporcionar soluções em tetos falsos com excelência técnica, transparência e compromisso com a satisfação do cliente.
            </p>
          </div>
          
          <div class="card">
            <div style="font-size: 4rem; text-align: center; margin-bottom: 1rem;">👁️</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-align: center; color: var(--secondary);">
              Visão
            </h3>
            <p style="color: var(--gray); text-align: center; line-height: 1.6;">
              Ser a empresa mais confiável e inovadora do setor de tetos falsos em Moçambique até 2030.
            </p>
          </div>
          
          <div class="card">
            <div style="font-size: 4rem; text-align: center; margin-bottom: 1rem;">⭐</div>
            <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem; text-align: center; color: var(--accent);">
              Valores
            </h3>
            <p style="color: var(--gray); text-align: center; line-height: 1.6;">
              Qualidade, Transparência, Inovação, Compromisso e Respeito ao Cliente.
            </p>
          </div>
        </div>
      </section>

      <!-- Diferenciais -->
      <section class="section">
        <h2 class="text-center mb-3" style="font-size: 2.5rem; font-weight: 800;">Nossos Diferenciais</h2>
        
        <div class="grid grid-2">
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Equipe Qualificada
            </h3>
            <p style="color: var(--gray);">
              Profissionais certificados e com vasta experiência em montagem de tetos falsos.
            </p>
          </div>
          
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Tecnologia Própria
            </h3>
            <p style="color: var(--gray);">
              Sistema exclusivo de cálculo de materiais que garante precisão e economia.
            </p>
          </div>
          
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Materiais de Qualidade
            </h3>
            <p style="color: var(--gray);">
              Trabalhamos apenas com fornecedores certificados e materiais de primeira linha.
            </p>
          </div>
          
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Garantia Total
            </h3>
            <p style="color: var(--gray);">
              Todos os nossos serviços possuem garantia de qualidade e durabilidade.
            </p>
          </div>
          
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Atendimento Personalizado
            </h3>
            <p style="color: var(--gray);">
              Cada projeto é único e recebe atenção especial da nossa equipe.
            </p>
          </div>
          
          <div class="card">
            <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--primary);">
              ✅ Prazos Cumpridos
            </h3>
            <p style="color: var(--gray);">
              Comprometimento com cronogramas e entrega dentro do prazo acordado.
            </p>
          </div>
        </div>
      </section>

      <!-- Certificações -->
      <section class="section">
        <div class="card text-center" style="background: var(--light); padding: 3rem;">
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1.5rem;">Certificações e Qualificações</h2>
          <div class="grid grid-4">
            <div>
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
              <p style="font-weight: 600;">Empresa Certificada</p>
            </div>
            <div>
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">👷</div>
              <p style="font-weight: 600;">Equipe Treinada</p>
            </div>
            <div>
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">🔒</div>
              <p style="font-weight: 600;">Segurança no Trabalho</p>
            </div>
            <div>
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">♻️</div>
              <p style="font-weight: 600;">Práticas Sustentáveis</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="section">
        <div class="card text-center" style="background: var(--gradient-primary); color: white; padding: 3rem;">
          <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 1rem;">Faça Parte da Nossa História</h2>
          <p style="font-size: 1.125rem; margin-bottom: 2rem; opacity: 0.95;">
            Entre em contato e descubra como podemos transformar seu projeto em realidade.
          </p>
          <a href="#contato" class="btn btn-secondary btn-large" style="transition: all 0.3s ease;" onmouseenter="this.style.boxShadow='0 0 30px rgba(99, 102, 241, 0.8)'; this.style.transform='translateY(-2px)';" onmouseleave="this.style.boxShadow='none'; this.style.transform='none';">Fale Conosco</a>
        </div>
      </section>
    </div>
  `);
}

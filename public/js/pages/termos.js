import { render } from '../app.js';

export default async function termosPage() {
  render(`
    <div class="container tg-page">

      <!-- ============ HERO ============ -->
      <section class="tg-hero">
        <div class="tg-hero-inner">
          <span class="tg-hero-badge">⚖️ Transparência Total</span>
          <h1 class="tg-hero-title">Termos Legais</h1>
          <p class="tg-hero-sub">
            Conheça os nossos termos de uso, políticas de privacidade e garantias.
            Trabalhamos com total transparência e respeito pelos nossos clientes.
          </p>
        </div>
      </section>

      <div class="tg-stack">

        <!-- ============ TERMOS DE USO ============ -->
        <section class="tg-card tg-card--primary">
          <div class="tg-card-head">
            <div class="tg-card-icon">📜</div>
            <div>
              <h2 class="tg-card-title">Termos de Uso do Serviço</h2>
              <p class="tg-card-sub">Condições gerais para a contratação dos nossos serviços</p>
            </div>
          </div>

          <div class="tg-article">
            <span class="tg-article-num">1</span>
            <div>
              <h3 class="tg-article-title">Aceitação dos Termos</h3>
              <p class="tg-article-text">
                Ao contratar os serviços da <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span>, o cliente concorda com todos os termos e condições aqui estabelecidos. É responsabilidade do cliente ler e compreender estes termos antes da contratação.
              </p>
            </div>
          </div>

          <div class="tg-article">
            <span class="tg-article-num">2</span>
            <div>
              <h3 class="tg-article-title">Serviços Oferecidos</h3>
              <p class="tg-article-text">
                A <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span> oferece serviços de montagem de tectos falsos em gesso, PVC e sistemas modulares, além de serviços complementares como barramento, pintura e instalações elétricas. Todos os serviços são executados por profissionais qualificados.
              </p>
            </div>
          </div>

          <div class="tg-article">
            <span class="tg-article-num">3</span>
            <div>
              <h3 class="tg-article-title">Orçamentos e Pagamentos</h3>
              <p class="tg-article-text">
                Os orçamentos são válidos por 10 dias a partir da data de emissão. Os valores podem sofrer alterações em caso de mudanças nos preços dos materiais. O pagamento pode ser realizado em dinheiro, transferência bancária ou cheque e E-mola e tambem por M-pesa, conforme acordado.
              </p>
            </div>
          </div>

          <div class="tg-article">
            <span class="tg-article-num">4</span>
            <div>
              <h3 class="tg-article-title">Prazos de Execução</h3>
              <p class="tg-article-text">
                Os prazos de execução são estimados e podem variar de acordo com a complexidade do projeto, disponibilidade de materiais e condições climáticas. A empresa se compromete a informar o cliente sobre qualquer alteração no cronograma.
              </p>
            </div>
          </div>

          <div class="tg-article">
            <span class="tg-article-num">5</span>
            <div>
              <h3 class="tg-article-title">Garantia</h3>
              <p class="tg-article-text">
                Todos os serviços possuem garantia de 3 meses contra defeitos de execução. A garantia não cobre danos causados por uso inadequado, alterações realizadas por terceiros ou eventos de força maior.
              </p>
            </div>
          </div>
        </section>

        <!-- ============ DIREITOS E DEVERES DO CLIENTE ============ -->
        <section class="tg-card tg-card--secondary">
          <div class="tg-card-head">
            <div class="tg-card-icon">👤</div>
            <div>
              <h2 class="tg-card-title">Direitos e Deveres do Cliente</h2>
              <p class="tg-card-sub">O que você pode esperar de nós — e o que esperamos de você</p>
            </div>
          </div>

          <div class="tg-col2">
            <div>
              <h3 class="tg-col-head"><span class="tg-mini green">✓</span> Direitos do Cliente</h3>
              <ul class="tg-list tg-list--check">
                <li>Receber orçamento detalhado antes do início dos trabalhos</li>
                <li>Acompanhar a execução do serviço</li>
                <li>Receber recibo de pagamento</li>
                <li>Solicitar esclarecimentos sobre materiais e técnicas utilizadas</li>
                <li>Receber garantia por escrito</li>
                <li>Cancelar o serviço antes do início, sem custos</li>
              </ul>
            </div>

            <div>
              <h3 class="tg-col-head"><span class="tg-mini pink">→</span> Deveres do Cliente</h3>
              <ul class="tg-list tg-list--duty">
                <li>Fornecer informações precisas sobre o local de instalação</li>
                <li>Garantir acesso ao local nos horários acordados</li>
                <li>Efetuar os pagamentos conforme acordado</li>
                <li>Informar sobre qualquer problema ou irregularidade</li>
                <li>Preservar o serviço executado</li>
                <li>Não realizar alterações sem consultar a empresa</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- ============ RESPONSABILIDADE TÉCNICA ============ -->
        <section class="tg-card tg-card--teal">
          <div class="tg-card-head">
            <div class="tg-card-icon">🔧</div>
            <div>
              <h2 class="tg-card-title">Responsabilidade Técnica</h2>
              <p class="tg-card-sub">O nosso compromisso com a qualidade de cada serviço</p>
            </div>
          </div>

          <p class="tg-article-text" style="margin-bottom: 1.25rem;">
            A <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span> assume total responsabilidade técnica pelos serviços executados, garantindo:
          </p>

          <ul class="tg-list tg-list--check">
            <li>Uso de materiais de qualidade certificada</li>
            <li>Execução conforme normas técnicas vigentes</li>
            <li>Equipe qualificada e treinada</li>
            <li>Segurança durante a execução</li>
            <li>Limpeza do local após conclusão</li>
            <li>Suporte pós-venda</li>
          </ul>

          <div class="tg-note">
            <span>⚠️</span>
            <p>A empresa não se responsabiliza por problemas estruturais preexistentes no imóvel ou por danos causados por terceiros após a conclusão do serviço.</p>
          </div>
        </section>

        <!-- ============ POLÍTICA DE PRIVACIDADE ============ -->
        <section class="tg-card tg-card--green">
          <div class="tg-card-head">
            <div class="tg-card-icon">🔒</div>
            <div>
              <h2 class="tg-card-title">Política de Privacidade</h2>
              <p class="tg-card-sub">Como protegemos os seus dados pessoais</p>
            </div>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Coleta de Dados</h3>
            <p>
              Coletamos apenas os dados necessários para a prestação dos serviços: nome, telefone, e-mail e endereço. Estes dados são armazenados de forma segura e não são compartilhados com terceiros.
            </p>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Uso dos Dados</h3>
            <p>
              Os dados coletados são utilizados exclusivamente para: comunicação com o cliente, emissão de orçamentos e recibos, execução dos serviços e suporte pós-venda.
            </p>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Direitos do Titular</h3>
            <p>
              O cliente tem direito a solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, entrando em contato através dos nossos canais oficiais.
            </p>
          </div>
        </section>

        <!-- ============ CANCELAMENTO E REEMBOLSO ============ -->
        <section class="tg-card tg-card--amber">
          <div class="tg-card-head">
            <div class="tg-card-icon">↩️</div>
            <div>
              <h2 class="tg-card-title">Política de Cancelamento e Reembolso</h2>
              <p class="tg-card-sub">Regras claras para garantir tranquilidade em qualquer situação</p>
            </div>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Cancelamento antes do início</h3>
            <p>O cliente pode cancelar o serviço sem custos até 1 horas antes do início programado.</p>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Cancelamento após início</h3>
            <p>Caso o serviço já tenha sido iniciado, será cobrado o valor proporcional ao trabalho executado e materiais utilizados.</p>
          </div>

          <div class="tg-block">
            <h3 class="tg-block-title">Reembolso</h3>
            <p>Em caso de cancelamento válido, o reembolso será realizado em até 15 dias úteis através do mesmo método de pagamento utilizado.</p>
          </div>
        </section>

        <!-- ============ CTA ============ -->
        <section class="tg-cta">
          <div class="tg-cta-inner">
            <h3>Dúvidas sobre os Termos? 💬</h3>
            <p>Entre em contato connosco para esclarecimentos. A nossa equipa está pronta para ajudar.</p>
            <a href="#contato" class="tg-cta-btn">Fale Conosco</a>
          </div>
        </section>
      </div>

      <p class="tg-update">
        <span class="tg-update-pill">📅 Última atualização: Dezembro de 2024</span>
      </p>
    </div>
  `);
}

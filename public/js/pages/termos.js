import { render } from '../app.js';

export default async function termosPage() {
  render(`
    <div class="container-sm">
      <h1 class="text-center mb-3" style="font-size: 3rem; font-weight: 800;">Termos Legais</h1>
      
      <!-- Termos de Uso -->
      <section class="section">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--primary);">
            📜 Termos de Uso do Serviço
          </h2>
          
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            1. Aceitação dos Termos
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Ao contratar os serviços da <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span>, o cliente concorda com todos os termos e condições aqui estabelecidos. É responsabilidade do cliente ler e compreender estes termos antes da contratação.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            2. Serviços Oferecidos
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            A <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span> oferece serviços de montagem de tectos falsos em gesso, PVC e sistemas modulares, além de serviços complementares como barramento, pintura e instalações elétricas. Todos os serviços são executados por profissionais qualificados.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            3. Orçamentos e Pagamentos
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Os orçamentos são válidos por 10 dias a partir da data de emissão. Os valores podem sofrer alterações em caso de mudanças nos preços dos materiais. O pagamento pode ser realizado em dinheiro, transferência bancária ou cheque e E-mola e tambem por M-pesa, conforme acordado.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            4. Prazos de Execução
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Os prazos de execução são estimados e podem variar de acordo com a complexidade do projeto, disponibilidade de materiais e condições climáticas. A empresa se compromete a informar o cliente sobre qualquer alteração no cronograma.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            5. Garantia
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Todos os serviços possuem garantia de 3 meses contra defeitos de execução. A garantia não cobre danos causados por uso inadequado, alterações realizadas por terceiros ou eventos de força maior.
          </p>
        </div>
      </section>

      <!-- Direitos e Deveres do Cliente -->
      <section class="section">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--secondary);">
            👤 Direitos e Deveres do Cliente
          </h2>
          
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            Direitos do Cliente:
          </h3>
          <ul style="color: var(--gray); line-height: 1.8; padding-left: 1.5rem;">
            <li>Receber orçamento detalhado antes do início dos trabalhos</li>
            <li>Acompanhar a execução do serviço</li>
            <li>Receber recibo de pagamento</li>
            <li>Solicitar esclarecimentos sobre materiais e técnicas utilizadas</li>
            <li>Receber garantia por escrito</li>
            <li>Cancelar o serviço antes do início, sem custos</li>
          </ul>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            Deveres do Cliente:
          </h3>
          <ul style="color: var(--gray); line-height: 1.8; padding-left: 1.5rem;">
            <li>Fornecer informações precisas sobre o local de instalação</li>
            <li>Garantir acesso ao local nos horários acordados</li>
            <li>Efetuar os pagamentos conforme acordado</li>
            <li>Informar sobre qualquer problema ou irregularidade</li>
            <li>Preservar o serviço executado</li>
            <li>Não realizar alterações sem consultar a empresa</li>
          </ul>
        </div>
      </section>

      <!-- Responsabilidade Técnica -->
      <section class="section">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--accent);">
            🔧 Responsabilidade Técnica
          </h2>
          
          <p style="color: var(--gray); line-height: 1.8; margin-bottom: 1rem;">
            A <span style="color: #3b82f6;">Tecto Falso</span> <span style="color: #ef4444;">J J Sabao</span> assume total responsabilidade técnica pelos serviços executados, garantindo:
          </p>
          
          <ul style="color: var(--gray); line-height: 1.8; padding-left: 1.5rem; margin-bottom: 1rem;">
            <li>Uso de materiais de qualidade certificada</li>
            <li>Execução conforme normas técnicas vigentes</li>
            <li>Equipe qualificada e treinada</li>
            <li>Segurança durante a execução</li>
            <li>Limpeza do local após conclusão</li>
            <li>Suporte pós-venda</li>
          </ul>

          <p style="color: var(--gray); line-height: 1.8;">
            A empresa não se responsabiliza por problemas estruturais preexistentes no imóvel ou por danos causados por terceiros após a conclusão do serviço.
          </p>
        </div>
      </section>

      <!-- Política de Privacidade -->
      <section class="section">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: #10b981;">
            🔒 Política de Privacidade
          </h2>
          
          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            Coleta de Dados
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Coletamos apenas os dados necessários para a prestação dos serviços: nome, telefone, e-mail e endereço. Estes dados são armazenados de forma segura e não são compartilhados com terceiros.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            Uso dos Dados
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            Os dados coletados são utilizados exclusivamente para: comunicação com o cliente, emissão de orçamentos e recibos, execução dos serviços e suporte pós-venda.
          </p>

          <h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem;">
            Direitos do Titular
          </h3>
          <p style="color: var(--gray); line-height: 1.8;">
            O cliente tem direito a solicitar acesso, correção ou exclusão dos seus dados a qualquer momento, entrando em contato através dos nossos canais oficiais.
          </p>
        </div>
      </section>

      <!-- Cancelamento e Reembolso -->
      <section class="section">
        <div class="card">
          <h2 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: #f59e0b;">
            ↩️ Política de Cancelamento e Reembolso
          </h2>
          
          <p style="color: var(--gray); line-height: 1.8; margin-bottom: 1rem;">
            <strong>Cancelamento antes do início:</strong> O cliente pode cancelar o serviço sem custos até 1 horas antes do início programado.
          </p>
          
          <p style="color: var(--gray); line-height: 1.8; margin-bottom: 1rem;">
            <strong>Cancelamento após início:</strong> Caso o serviço já tenha sido iniciado, será cobrado o valor proporcional ao trabalho executado e materiais utilizados.
          </p>
          
          <p style="color: var(--gray); line-height: 1.8;">
            <strong>Reembolso:</strong> Em caso de cancelamento válido, o reembolso será realizado em até 15 dias úteis através do mesmo método de pagamento utilizado.
          </p>
        </div>
      </section>

      <!-- Contato -->
      <section class="section">
        <div class="card text-center" style="background: var(--gradient-primary); color: white; padding: 2rem;">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Dúvidas sobre os Termos?</h2>
          <p style="opacity: 0.95; margin-bottom: 1.5rem;">
            Entre em contato conosco para esclarecimentos.
          </p>
          <a href="#contato" class="btn btn-secondary">Fale Conosco</a>
        </div>
      </section>

      <p class="text-center" style="color: var(--gray); font-size: 0.875rem; margin-top: 2rem;">
        Última atualização: Dezembro de 2024
      </p>
    </div>
  `);
}

import { render, showError, showSuccess } from '../app.js';

const API_URL = window.location.origin + '/api';

export default async function contatoPage() {
  render(`
    <div class="container ct-page">

      <!-- ============ HERO ============ -->
      <section class="ct-hero">
        <div class="ct-hero-inner">
          <span class="ct-hero-badge">📞 Fale Connosco</span>
          <h1 class="ct-hero-title">Entre em Contato</h1>
          <p class="ct-hero-sub">
            Estamos prontos para atender você. Envie a sua mensagem ou fale connosco
            pelos nossos canais — respondemos com rapidez e atenção.
          </p>
        </div>
      </section>

      <div class="ct-grid">
        <!-- ============ FORMULÁRIO ============ -->
        <div class="ct-card">
          <h2 class="ct-card-title">
            <span class="ct-title-icon">📧</span>
            Envie uma Mensagem
          </h2>

          <form id="contactForm">
            <div class="ct-form-grid">
              <div class="ct-field">
                <label>👤 Nome Completo <span class="req">*</span></label>
                <input type="text" class="ct-input" id="nome" required>
              </div>

              <div class="ct-field">
                <label>📱 Telefone <span class="req">*</span></label>
                <input type="tel" class="ct-input" id="telefone" required maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
              </div>

              <div class="ct-field">
                <label>✉️ E-mail <span class="req">*</span></label>
                <input type="email" class="ct-input" id="email" required maxlength="54">
              </div>

              <div class="ct-field">
                <label>🏷️ Assunto <span class="req">*</span></label>
                <select class="ct-select" id="assunto" required>
                  <option value="">Selecione...</option>
                  <option value="Orçamento">Solicitar Orçamento</option>
                  <option value="Dúvida">Tirar Dúvida</option>
                  <option value="Reclamação">Reclamação</option>
                  <option value="Elogio">Elogio</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div class="ct-field full">
                <label>💬 Mensagem <span class="req">*</span></label>
                <textarea class="ct-textarea" id="mensagem" rows="5" required></textarea>
              </div>
            </div>

            <button type="submit" class="ct-submit" id="btnEnviar">
              Enviar Mensagem
            </button>
          </form>
        </div>

        <!-- ============ INFORMAÇÕES + REDES ============ -->
        <div>
          <div class="ct-card mb-2">
            <h2 class="ct-card-title">
              <span class="ct-title-icon">📍</span>
              Informações de Contato
            </h2>

            <div class="ct-info-list">
              <div class="ct-info-item">
                <div class="ct-info-icon blue">📞</div>
                <div>
                  <p class="ct-info-label">Telefone</p>
                  <p class="ct-info-value">+258 870296633/844200152</p>
                </div>
              </div>

              <div class="ct-info-item">
                <div class="ct-info-icon pink">📧</div>
                <div>
                  <p class="ct-info-label">E-mail</p>
                  <p class="ct-info-value">
                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=tectofalsosabao@gmail.com" target="_blank" rel="noopener">
                      tectofalsosabao@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div class="ct-info-item">
                <div class="ct-info-icon teal">📍</div>
                <div>
                  <p class="ct-info-label">Endereço</p>
                  <p class="ct-info-value">Beira, Moçambique</p>
                </div>
              </div>

              <div class="ct-info-item">
                <div class="ct-info-icon green">🕐</div>
                <div>
                  <p class="ct-info-label">Horário</p>
                  <p class="ct-info-value">Seg - Sex: 8h - 18h<br>Sáb: 8h - 13h</p>
                </div>
              </div>
            </div>
          </div>

          <div class="ct-card">
            <h2 class="ct-card-title">
              <span class="ct-title-icon">🌐</span>
              Redes Sociais
            </h2>

            <div class="ct-social-list">
              <a href="https://www.facebook.com/profile.php?id=100083056498498" target="_blank" rel="noopener" class="ct-social-row">
                <div class="ct-social-icon fb">f</div>
                <span class="ct-social-name">Facebook - Sabao Tectos &amp; Design</span>
              </a>

              <a href="https://wa.me/258870296633" target="_blank" rel="noopener" class="ct-social-row">
                <div class="ct-social-icon wa">📱</div>
                <span class="ct-social-name">WhatsApp</span>
              </a>

              <a href="https://www.instagram.com/jsab.ao" target="_blank" rel="noopener" class="ct-social-row">
                <div class="ct-social-icon ig">📷</div>
                <span class="ct-social-name">Instagram</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  // Form submission - salvar no banco de dados
  const form = document.getElementById('contactForm');
  const btn = document.getElementById('btnEnviar');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      nome: document.getElementById('nome').value,
      telefone: document.getElementById('telefone').value,
      email: document.getElementById('email').value,
      assunto: document.getElementById('assunto').value,
      mensagem: document.getElementById('mensagem').value
    };

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao enviar mensagem');
      }

      showSuccess('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      form.reset();
    } catch (error) {
      showError(error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar Mensagem';
    }
  });
}

import { render, showError, showSuccess } from '../app.js';

const API_URL = window.location.origin + '/api';

export default async function contatoPage() {
  render(`
    <div class="container-sm">
      <h1 class="text-center mb-3" style="font-size: 3rem; font-weight: 800;">Entre em Contato</h1>
      <p class="text-center mb-3" style="font-size: 1.25rem; color: var(--gray);">
        Estamos prontos para atender você. Envie sua mensagem ou entre em contato pelos nossos canais.
      </p>

      <div class="grid grid-2" style="gap: 2rem; margin-top: 3rem;">
        <!-- Contact Form -->
        <div class="card">
          <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
            📧 Envie uma Mensagem
          </h2>
          
          <form id="contactForm">
            <div class="grid grid-2" style="gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Nome Completo</label>
                <input type="text" class="form-input" id="nome" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Telefone</label>
                <input type="tel" class="form-input" id="telefone" required maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
              </div>
              
              <div class="form-group">
                <label class="form-label">E-mail</label>
                <input type="email" class="form-input" id="email" required maxlength="54">
              </div>
              
              <div class="form-group">
                <label class="form-label">Assunto</label>
                <select class="form-select" id="assunto" required>
                  <option value="">Selecione...</option>
                  <option value="Orçamento">Solicitar Orçamento</option>
                  <option value="Dúvida">Tirar Dúvida</option>
                  <option value="Reclamação">Reclamação</option>
                  <option value="Elogio">Elogio</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Mensagem</label>
              <textarea class="form-textarea" id="mensagem" rows="5" required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-large" style="width: 100%;" id="btnEnviar">
              Enviar Mensagem
            </button>
          </form>
        </div>

        <!-- Contact Info -->
        <div>
          <div class="card mb-2">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
              📍 Informações de Contato
            </h2>
            
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 50px; height: 50px; background: var(--primary); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                  📞
                </div>
                <div>
                  <p style="font-weight: 600; margin-bottom: 0.25rem;">Telefone</p>
                  <p style="color: var(--gray);">+258 870296633/844200152</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 50px; height: 50px; background: var(--secondary); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                  📧
                </div>
                <div>
                  <p style="font-weight: 600; margin-bottom: 0.25rem;">E-mail</p>
                  <a href="https://mail.google.com/mail/?view=cm&fs=1&to=tectofalsosabao@gmail.com" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-dark)'" onmouseout="this.style.color='var(--primary)'">tectofalsosabao@gmail.com</a>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 50px; height: 50px; background: var(--accent); border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                  📍
                </div>
                <div>
                  <p style="font-weight: 600; margin-bottom: 0.25rem;">Endereço</p>
                  <p style="color: var(--gray);">Beira, Moçambique</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 50px; height: 50px; background: #10b981; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">
                  🕐
                </div>
                <div>
                  <p style="font-weight: 600; margin-bottom: 0.25rem;">Horário</p>
                  <p style="color: var(--gray);">Seg - Sex: 8h - 18h<br>Sáb: 8h - 13h</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">
              🌐 Redes Sociais
            </h2>
            
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <a href="https://www.facebook.com/profile.php?id=100083056498498" target="_blank" style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit; padding: 0.5rem; border-radius: var(--radius-md); transition: background 0.2s;" onmouseover="this.style.background='var(--light)'" onmouseout="this.style.background='transparent'">
                <div style="width: 40px; height: 40px; background: #1877F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                  f
                </div>
                <span style="font-weight: 600;">Facebook - Sabao Tectos & Design</span>
              </a>

              <a href="https://wa.me/258870296633" target="_blank" style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit; padding: 0.5rem; border-radius: var(--radius-md); transition: background 0.2s;" onmouseover="this.style.background='var(--light)'" onmouseout="this.style.background='transparent'">
                <div style="width: 40px; height: 40px; background: #25D366; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                  📱
                </div>
                <span style="font-weight: 600;">WhatsApp</span>
              </a>

              <a href="https://www.instagram.com/jsab.ao" target="_blank" style="display: flex; align-items: center; gap: 1rem; text-decoration: none; color: inherit; padding: 0.5rem; border-radius: var(--radius-md); transition: background 0.2s;" onmouseover="this.style.background='var(--light)'" onmouseout="this.style.background='transparent'">
                <div style="width: 40px; height: 40px; background: #E1306C; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                  📷
                </div>
                <span style="font-weight: 600;">Instagram</span>
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

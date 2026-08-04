/**
 * Barra de progresso reutilizável para uploads (ficheiros de projetos,
 * imagens, vídeos, etc.).
 *
 * Uso:
 *   const prog = createProgressBar(containerElement);
 *   prog.show('A enviar ficheiro...');
 *   prog.set(45, 'A enviar ficheiro... 45%');
 *   prog.done('Carregado com sucesso!'); // 100% + texto de conclusão
 *   prog.hide(); // esconder quando quiser
 */

export function createProgressBar(container) {
  if (!container) return null;

  container.innerHTML = `
    <div class="upload-progress" style="display: none;">
      <div class="upload-progress-track">
        <div class="upload-progress-fill" style="width: 0%;"></div>
      </div>
      <div class="upload-progress-status"></div>
    </div>
  `;

  const wrap = container.firstElementChild;
  const fill = wrap.querySelector('.upload-progress-fill');
  const status = wrap.querySelector('.upload-progress-status');

  function pct(value) {
    const n = Number(value);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  return {
    el: wrap,

    /** Mostra a barra com uma mensagem inicial */
    show(text) {
      wrap.style.display = 'block';
      fill.style.width = '0%';
      if (status) status.textContent = text || '';
    },

    /** Atualiza o percentual (0-100) e, opcionalmente, a mensagem */
    set(value, text) {
      fill.style.width = pct(value) + '%';
      if (text !== undefined && status) status.textContent = text;
    },

    /** Marca 100% com mensagem de conclusão */
    done(text) {
      fill.style.width = '100%';
      if (status) status.textContent = text || 'Concluído!';
    },

    hide() {
      wrap.style.display = 'none';
    }
  };
}

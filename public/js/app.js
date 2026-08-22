// ==================== CONFIGURATION ====================
const API_URL = window.location.origin + '/api';

// ==================== STATE MANAGEMENT ====================
const state = {
    currentPage: null,
    clientes: [],
    servicos: [],
    portfolio: [],
    precos: {},
    configuracoes: {}
};

// ==================== ROUTER ====================
class Router {
    constructor() {
        this.routes = {};
        this.init();
    }

    register(path, handler) {
        this.routes[path] = handler;
    }

    async navigate(path) {
        if (state.currentPage === path) return;
        state.currentPage = path;

        // Update active sidebar link
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === path) {
                link.classList.add('active');
            }
        });

        // Update URL hash
        window.location.hash = path;

        // Load page
        const handler = this.routes[path];
        if (handler) {
            showLoading();
            try {
                await handler();
            } catch (error) {
                console.error('Error loading page:', error);
                showError('Erro ao carregar página');
            }
            hideLoading();
        } else {
            console.error('Route not found:', path);
            this.navigate('home');
        }

        // Toggle body class for fullscreen pages (login)
        document.body.classList.toggle('page-login', path === 'login');

        // Close sidebar on mobile after navigation
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar && overlay && window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('visible');
        }
    }

    init() {
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'home';
            if (hash !== state.currentPage) {
                this.navigate(hash);
            }
        });

        // Handle sidebar link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('.sidebar-link, .sidebar-dropdown-link');
            if (link && link.dataset.page) {
                e.preventDefault();
                this.navigate(link.dataset.page);
            }
        });

        // Sidebar toggle (mobile)
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                if (window.innerWidth > 768) {
                    sidebar.classList.toggle('collapsed');
                    document.body.classList.toggle('sidebar-collapsed');
                } else {
                    sidebar.classList.toggle('open');
                    if (overlay) overlay.classList.toggle('visible');
                }
                if (sidebar.classList.contains('collapsed') && overlay) {
                    overlay.classList.remove('visible');
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebar.classList.remove('collapsed');
                document.body.classList.remove('sidebar-collapsed');
                overlay.classList.remove('visible');
            });
        }

        // Sidebar close button (inside sidebar header)
        const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
                if (overlay) overlay.classList.remove('visible');
            });
        }

        // Admin dropdown toggle in sidebar
        const adminToggle = document.getElementById('sidebarAdminToggle');
        if (adminToggle) {
            adminToggle.addEventListener('click', () => {
                adminToggle.closest('.sidebar-dropdown').classList.toggle('open');
            });
        }

        // Logout buttons in sidebar
        const handleLogout = () => {
            localStorage.removeItem('teto_falso_token');
            localStorage.removeItem('teto_falso_refresh_token');
            localStorage.removeItem('teto_falso_user');
            sessionStorage.removeItem('teto_falso_session');
            sessionStorage.removeItem('teto_falso_session_expiry');
            window.location.hash = 'login';
            window.location.reload();
        };

        const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);

        const sidebarLogout = document.getElementById('sidebarLogout');
        if (sidebarLogout) sidebarLogout.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}

// ==================== AUTH HEADERS HELPER ====================
function getAuthHeaders() {
    const token = localStorage.getItem('teto_falso_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// ==================== TOKEN REFRESH ====================
let isRefreshing = false;
let refreshPromise = null;

async function tryRefreshToken() {
    if (isRefreshing) {
        return refreshPromise;
    }
    isRefreshing = true;
    refreshPromise = (async () => {
        const refreshToken = localStorage.getItem('teto_falso_refresh_token');
        if (!refreshToken) {
            throw new Error('Sem refresh token');
        }
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        if (!response.ok) {
            throw new Error('Falha ao renovar token');
        }
        const data = await response.json();
        localStorage.setItem('teto_falso_token', data.token);
        if (data.refreshToken) {
            localStorage.setItem('teto_falso_refresh_token', data.refreshToken);
        }
        return data.token;
    })();

    try {
        return await refreshPromise;
    } finally {
        isRefreshing = false;
        refreshPromise = null;
    }
}

function clearAuthAndRedirect() {
    localStorage.removeItem('teto_falso_token');
    localStorage.removeItem('teto_falso_refresh_token');
    localStorage.removeItem('teto_falso_user');
    sessionStorage.removeItem('teto_falso_session');
    sessionStorage.removeItem('teto_falso_session_expiry');
    router.navigate('login');
}

// ==================== API FUNCTIONS ====================
const api = {
    async get(endpoint) {
        let response = await fetch(`${API_URL}${endpoint}`, {
            headers: { ...getAuthHeaders() }
        });
        if (response.status === 401) {
            try {
                await tryRefreshToken();
                response = await fetch(`${API_URL}${endpoint}`, {
                    headers: { ...getAuthHeaders() }
                });
            } catch {
                clearAuthAndRedirect();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }
        if (response.status === 403) {
            clearAuthAndRedirect();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (!response.ok) {
            let msg = 'API request failed';
            try { const d = await response.json(); if (d && d.error) msg = d.error; } catch { /* sem corpo JSON */ }
            throw new Error(msg);
        }
        return response.json();
    },

    async post(endpoint, data) {
        let response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            try {
                await tryRefreshToken();
                response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(data)
                });
            } catch {
                clearAuthAndRedirect();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }
        if (response.status === 403) {
            clearAuthAndRedirect();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        const dataJson = await response.json();
        if (!response.ok) throw new Error(dataJson.error || 'API request failed');
        return dataJson;
    },

    async put(endpoint, data) {
        let response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data)
        });
        if (response.status === 401) {
            try {
                await tryRefreshToken();
                response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                    body: JSON.stringify(data)
                });
            } catch {
                clearAuthAndRedirect();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }
        if (response.status === 403) {
            clearAuthAndRedirect();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (!response.ok) {
            let msg = 'API request failed';
            try { const d = await response.json(); if (d && d.error) msg = d.error; } catch { /* sem corpo JSON */ }
            throw new Error(msg);
        }
        return response.json();
    },

    async delete(endpoint) {
        let response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() }
        });
        if (response.status === 401) {
            try {
                await tryRefreshToken();
                response = await fetch(`${API_URL}${endpoint}`, {
                    method: 'DELETE',
                    headers: { ...getAuthHeaders() }
                });
            } catch {
                clearAuthAndRedirect();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }
        if (response.status === 403) {
            clearAuthAndRedirect();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (!response.ok) {
            let msg = 'API request failed';
            try { const d = await response.json(); if (d && d.error) msg = d.error; } catch { /* sem corpo JSON */ }
            throw new Error(msg);
        }
        return response.json();
    },

    async uploadFile(endpoint, formData, method = 'POST', onProgress = null) {
        // Com callback de progresso usa XMLHttpRequest (o fetch não expõe o
        // progresso do upload) para alimentar a barra de carregamento.
        if (onProgress) {
            const token = localStorage.getItem('teto_falso_token');
            const send = (tk, retried = false) => new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open(method, `${API_URL}${endpoint}`);
                if (tk) xhr.setRequestHeader('Authorization', `Bearer ${tk}`);
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
                };
                xhr.onload = () => {
                    let data = {};
                    try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch { /* resposta não-JSON */ }
                    if (xhr.status === 401) {
                        if (retried) {
                            clearAuthAndRedirect();
                            reject(new Error('Sessão expirada. Faça login novamente.'));
                            return;
                        }
                        tryRefreshToken().then(() => {
                            send(localStorage.getItem('teto_falso_token'), true).then(resolve).catch(reject);
                        }).catch(() => {
                            clearAuthAndRedirect();
                            reject(new Error('Sessão expirada. Faça login novamente.'));
                        });
                        return;
                    }
                    if (xhr.status === 403) {
                        clearAuthAndRedirect();
                        reject(new Error('Sessão expirada. Faça login novamente.'));
                        return;
                    }
                    if (xhr.status >= 200 && xhr.status < 300) resolve(data);
                    else reject(new Error(data.error || 'Upload failed'));
                };
                xhr.onerror = () => reject(new Error('Erro de rede ao enviar o ficheiro'));
                xhr.onabort = () => reject(new Error('Envio do ficheiro cancelado'));
                xhr.ontimeout = () => reject(new Error('Tempo esgotado ao enviar o ficheiro'));
                xhr.timeout = 10 * 60 * 1000;
                xhr.send(formData);
            });
            return send(token);
        }

        let token = localStorage.getItem('teto_falso_token');
        let headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        let response = await fetch(`${API_URL}${endpoint}`, {
            method: method,
            headers: headers,
            body: formData
        });
        if (response.status === 401) {
            try {
                await tryRefreshToken();
                token = localStorage.getItem('teto_falso_token');
                headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                response = await fetch(`${API_URL}${endpoint}`, {
                    method: method,
                    headers: headers,
                    body: formData
                });
            } catch {
                clearAuthAndRedirect();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
        }
        if (response.status === 403) {
            clearAuthAndRedirect();
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    },

    async postWithoutAuth(endpoint, data) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }
};

// ==================== UTILITY FUNCTIONS ====================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, type) {
    const existing = document.getElementById('toastNotification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toastNotification';
    toast.style.cssText = `
        position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10000;
        padding: 1rem 1.5rem; border-radius: var(--radius-lg);
        font-weight: 600; font-size: 0.95rem;
        color: white; max-width: 400px;
        box-shadow: var(--shadow-xl);
        animation: slideIn 0.3s ease-out;
        ${type === 'error' ? 'background: #ef4444;' : 'background: #10b981;'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 4000);

    const style = document.createElement('style');
    style.id = 'toastKeyframes';
    if (!document.getElementById('toastKeyframes')) {
        style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message, reload = true) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-sucesso-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
        <div class="modal-sucesso-box">
            <div class="modal-sucesso-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="modal-sucesso-msg"></div>
            <button class="modal-sucesso-btn" id="modalSucessoOk">OK</button>
        </div>
    `;
    // Inserir mensagem como textContent para evitar XSS
    overlay.querySelector('.modal-sucesso-msg').textContent = message;
    document.body.appendChild(overlay);

    const btn = overlay.querySelector('#modalSucessoOk');
    btn.focus();

    const cleanup = () => {
        overlay.remove();
        document.removeEventListener('keydown', keydownHandler);
        clearTimeout(autoDismiss);
    };

    const handleOk = () => {
        cleanup();
        if (reload) window.location.reload();
    };

    btn.addEventListener('click', handleOk);

    const keydownHandler = (e) => {
        if (e.key === 'Escape') {
            cleanup();
        }
    };
    document.addEventListener('keydown', keydownHandler);

    const autoDismiss = setTimeout(() => {
        handleOk();
    }, 4000);
}

function formatCurrency(value) {
    const formatted = new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN'
    }).format(value);
    return formatted.replace(/MTn|MTN|MZN/g, 'MT');
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-MZ');
}

function render(html) {
    document.getElementById('app').innerHTML = html;
}

// ==================== SIDEBAR UPDATE BY ROLE ====================
function atualizarNav() {
    const token = localStorage.getItem('teto_falso_token');
    const userData = localStorage.getItem('teto_falso_user');
    const user = userData ? JSON.parse(userData) : null;
    const role = user ? user.role : null;
    const isLoggedIn = !!token;

    // Elementos da sidebar
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sidebarUser = document.getElementById('sidebarUser');
    const sidebarAdminItem = document.getElementById('sidebarAdminItem');
    const sidebarFooter = document.querySelector('.sidebar-footer');
    const userName = document.getElementById('sidebarUserName');
    const userRole = document.getElementById('sidebarUserRole');
    const userIcon = document.getElementById('sidebarUserIcon');

    // Mostrar/ocultar links baseado na role
    sidebarLinks.forEach(link => {
        const page = link.dataset.page;

        if (!page) return;

        // Se não estiver logado, esconder links restritos
        if (!isLoggedIn) {
            link.style.display = page === 'login' ? '' : 'none';
            return;
        }

        // Links que apenas admin/funcionario veem
        if (page === 'calculadora' || page === 'orcamentos' || page === 'mensagens') {
            link.style.display = (role === 'admin' || role === 'funcionario') ? '' : 'none';
        }
        // Links que todos os logados veem
        else if (['home', 'servicos', 'empresa', 'portfolio', 'contato', 'termos', 'login'].includes(page)) {
            link.style.display = '';
        }
        // Admin panel
        else if (page === 'admin') {
            // handled by sidebarAdminItem
        } else {
            link.style.display = '';
        }
    });

    // Admin dropdown visibility
    if (sidebarAdminItem) {
        sidebarAdminItem.style.display = role === 'admin' ? '' : 'none';
    }

    // Atualizar info do usuário na sidebar
    if (isLoggedIn && user) {
        if (sidebarUser) sidebarUser.style.display = 'flex';
        if (sidebarFooter) sidebarFooter.style.display = 'block';
        if (userName) userName.textContent = user.nome;
        if (userRole) {
            const roleNames = { admin: 'Administrador', funcionario: 'Funcionário', cliente: 'Cliente' };
            userRole.textContent = roleNames[user.role] || user.role;
        }
        if (userIcon) {
            const icons = { admin: '⚙️', funcionario: '👷', cliente: '👤' };
            userIcon.textContent = icons[user.role] || '👤';
        }
    } else {
        if (sidebarUser) sidebarUser.style.display = 'none';
        if (sidebarFooter) sidebarFooter.style.display = 'none';
    }
}



// ==================== ROLE-BASED REDIRECT ====================
function redirectAfterLogin(user) {
    if (user.role === 'admin') {
        return 'admin';
    } else if (user.role === 'funcionario') {
        return 'calculadora';
    } else {
        return 'home';
    }
}

// ==================== ROLE-BASED ACCESS CONTROL ====================
function verificarAcesso(path) {
    const token = localStorage.getItem('teto_falso_token');
    const userData = localStorage.getItem('teto_falso_user');
    const user = userData ? JSON.parse(userData) : null;
    const role = user ? user.role : null;

    // Apenas login e register sao acessiveis sem autenticacao
    if (path === 'login') return path;

    // Se nao estiver logado, SEMPRE redirecionar para login
    if (!token || !role) {
        return 'login';
    }

    // Verificar se a sessao expirou (baseado no tempo do token)
    const sessionExpiry = sessionStorage.getItem('teto_falso_session_expiry');
    if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
        // Sessao expirou: limpar e redirecionar para login
        localStorage.removeItem('teto_falso_token');
        localStorage.removeItem('teto_falso_refresh_token');
        localStorage.removeItem('teto_falso_user');
        sessionStorage.removeItem('teto_falso_session');
        sessionStorage.removeItem('teto_falso_session_expiry');
        return 'login';
    }

    // Páginas apenas para admin
    const paginasAdmin = ['admin'];
    if (paginasAdmin.includes(path) && role !== 'admin') {
        showError('Acesso não autorizado');
        return 'home';
    }

    // Páginas apenas para admin e funcionario
    const paginasAdminFunc = ['calculadora', 'orcamentos', 'mensagens'];
    if (paginasAdminFunc.includes(path) && role !== 'admin' && role !== 'funcionario') {
        showError('Acesso não autorizado');
        return 'home';
    }

    return path;
}

// Override navigate to check access
const originalNavigate = Router.prototype.navigate;
Router.prototype.navigate = function(path) {
    const allowedPath = verificarAcesso(path);
    if (allowedPath !== path) {
        path = allowedPath;
        // Atualizar o hash da URL para refletir o redirecionamento
        window.location.hash = path;
    }
    return originalNavigate.call(this, path);
};

// ==================== SESSION TIMEOUT & AUTO LOGOUT ====================
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

function verificarSessaoExpirada() {
    const token = localStorage.getItem('teto_falso_token');
    const sessionExpiry = sessionStorage.getItem('teto_falso_session_expiry');
    
    if (token && sessionExpiry) {
        if (Date.now() > parseInt(sessionExpiry)) {
            // Sessao expirou
            clearAuthAndRedirect();
            return true;
        }
    }
    return false;
}

// Verificar sessao periodicamente (a cada 5 minutos)
setInterval(() => {
    if (verificarSessaoExpirada()) {
        showError('Sessao expirada. Faca login novamente.');
    }
}, 5 * 60 * 1000);

// Verificar sessao quando o utilizador volta a aba
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        verificarSessaoExpirada();
    }
});

// Verificar sessao em cada navegacao
window.addEventListener('hashchange', () => {
    verificarSessaoExpirada();
});

// ==================== INITIALIZE APP ====================
const router = new Router();

// Import and register pages
Promise.all([
    import('./pages/home.js').then(module => router.register('home', module.default)),
    import('./pages/servicos.js').then(module => router.register('servicos', module.default)),
    import('./pages/empresa.js').then(module => router.register('empresa', module.default)),
    import('./pages/portfolio.js').then(module => router.register('portfolio', module.default)),
    import('./pages/calculadora.js').then(module => router.register('calculadora', module.default)),
    import('./pages/orcamentos.js').then(module => router.register('orcamentos', module.default)),
    import('./pages/contato.js').then(module => router.register('contato', module.default)),
    import('./pages/mensagens.js').then(module => router.register('mensagens', module.default)),
    import('./pages/termos.js').then(module => router.register('termos', module.default)),
    import('./pages/login.js').then(module => router.register('login', module.default)),
    import('./pages/admin.js').then(module => router.register('admin', module.default))
  ]).then(async () => {
      // ==================== SEGURANCA TOTAL: GATE DE AUTENTICACAO ====================
      // QUALQUER pessoa que acessar o link do sistema é direcionada à tela de
      // LOGIN primeiro. Só entra sem login se já existir uma sessão ATIVA nesta
      // aba/janela E o token for confirmado diretamente com o servidor.
      const removerAuthGate = () => {
          const gate = document.getElementById('authGate');
          if (gate) {
              gate.style.opacity = '0';
              setTimeout(() => gate.remove(), 250);
          }
      };

      // Valida o token atual junto ao servidor; se estiver expirado tenta
      // renovar com o refresh token (uma única vez). Devolve o user ou null.
      async function validarSessaoComServidor() {
          let tk = localStorage.getItem('teto_falso_token');
          if (!tk) return null;

          let resp = await fetch(`${API_URL}/auth/me`, {
              headers: { 'Authorization': `Bearer ${tk}` }
          });

          // Token expirado: tentar renovar UMA vez e repetir a validação
          if (resp.status === 401) {
              try {
                  await tryRefreshToken();
                  tk = localStorage.getItem('teto_falso_token');
                  resp = await fetch(`${API_URL}/auth/me`, {
                      headers: { 'Authorization': `Bearer ${tk}` }
                  });
              } catch {
                  return null;
              }
          }

          if (!resp.ok) return null;
          try {
              const data = await resp.json();
              localStorage.setItem('teto_falso_user', JSON.stringify(data.user));
              return data.user;
          } catch {
              return null;
          }
      }

      const token = localStorage.getItem('teto_falso_token');
      const hasSession = sessionStorage.getItem('teto_falso_session');
      const expiry = parseInt(sessionStorage.getItem('teto_falso_session_expiry') || '0', 10);
      const sessaoAtivaNestaAba = hasSession === '1' && expiry > Date.now();

      let destino = 'login'; // POR DEFEITO: SEMPRE LOGIN

      if (token && sessaoAtivaNestaAba) {
          // Sessão ativa nesta aba: confirmar credenciais com o servidor
          const user = await validarSessaoComServidor();
          if (user && user.role) {
              // Autenticado e autorizado: respeitar permissões da página pedida.
              // verificarAcesso devolve 'login' se não autenticado, corrige
              // páginas restritas por role, ou mantém o pedido original.
              destino = verificarAcesso(window.location.hash.slice(1) || 'home');
          }
      }

      // Sem sessão válida => limpar TODAS as credenciais antigas e IR PARA LOGIN
      if (destino === 'login') {
          localStorage.removeItem('teto_falso_token');
          localStorage.removeItem('teto_falso_refresh_token');
          localStorage.removeItem('teto_falso_user');
          sessionStorage.removeItem('teto_falso_session');
          sessionStorage.removeItem('teto_falso_session_expiry');
      }

      atualizarNav();
      removerAuthGate();

      window.location.hash = destino;
      router.navigate(destino);
  }).catch(error => {
      console.error('Error loading pages:', error);
      // Se as páginas falharem ao carregar, avisar DENTRO do authGate
      // (o gate cobre todo o ecrã com z-index máximo)
      const msg = document.querySelector('#authGate p');
      if (msg) {
          msg.style.color = '#ef4444';
          msg.textContent = 'Erro ao carregar o sistema: ' + error.message + '. Recarregue a página.';
      }
  });

// Export for use in other modules
export { router, api, state, render, formatCurrency, formatDate, showLoading, hideLoading, showError, showSuccess, atualizarNav, redirectAfterLogin };

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
// Páginas públicas acessíveis sem autenticação
const PAGINAS_PUBLICAS = ['home', 'servicos', 'empresa', 'portfolio', 'contato', 'termos', 'login'];

function verificarAcesso(path) {
    const token = localStorage.getItem('teto_falso_token');
    const userData = localStorage.getItem('teto_falso_user');
    const user = userData ? JSON.parse(userData) : null;
    const role = user ? user.role : null;

    // Páginas públicas são sempre acessíveis
    if (PAGINAS_PUBLICAS.includes(path)) return path;

    // Se não estiver logado, redirecionar para login
    if (!token || !role) {
        return 'login';
    }

    // Páginas apenas para admin
    const paginasAdmin = ['admin'];
    if (paginasAdmin.includes(path) && role !== 'admin') {
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
]).then(() => {
    // Atualizar nav baseado na role
    atualizarNav();

    // Determinar página inicial
    const hasSession = sessionStorage.getItem('teto_falso_session');
    const token = localStorage.getItem('teto_falso_token');
    let initialPage;
    if (hasSession && token) {
        // Sessão ativa: fica onde está ou vai para home
        initialPage = window.location.hash.slice(1) || 'home';
    } else if (token) {
        // Tem token mas não tem sessão: ativar sessão e ficar onde está
        sessionStorage.setItem('teto_falso_session', '1');
        initialPage = window.location.hash.slice(1) || 'home';
    } else {
        // Sem sessão e sem token: fica na home como visitante
        initialPage = window.location.hash.slice(1) || 'home';
    }
    window.location.hash = initialPage;
    router.navigate(initialPage);
}).catch(error => {
    console.error('Error loading pages:', error);
    showError(`Erro ao carregar o sistema: ${error.message}. Por favor, recarregue a página.`);
});

// Export for use in other modules
export { router, api, state, render, formatCurrency, formatDate, showLoading, hideLoading, showError, showSuccess, atualizarNav, redirectAfterLogin };

const API_URL = window.location.origin + '/api';
const TOKEN_KEY = 'teto_falso_token';
const REFRESH_TOKEN_KEY = 'teto_falso_refresh_token';
const USER_KEY = 'teto_falso_user';

export const Auth = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    getUser() {
        const data = localStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    isLoggedIn() {
        return !!this.getToken();
    },

    getRole() {
        const user = this.getUser();
        return user ? user.role : null;
    },

    isAdmin() {
        return this.getRole() === 'admin';
    },

    isFuncionario() {
        return this.getRole() === 'funcionario';
    },

    isCliente() {
        return this.getRole() === 'cliente';
    },

    isAdminOrFuncionario() {
        return this.isAdmin() || this.isFuncionario();
    },

    async login(email, senha) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao fazer login');
        }

        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
    },

    async register(nome, email, senha, telefone) {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, telefone })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao registar');
        }

        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
    },

    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error('Sem refresh token');
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });

        if (!response.ok) {
            this.clearSession();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        return data.token;
    },

    clearSession() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    logout() {
        this.clearSession();
        window.location.hash = 'home';
        window.location.reload();
    },

    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

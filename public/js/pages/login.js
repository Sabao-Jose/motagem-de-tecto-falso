import { render, router, showError, showSuccess, atualizarNav, redirectAfterLogin } from '../app.js';

function fazerLogout() {
    localStorage.removeItem('teto_falso_token');
    localStorage.removeItem('teto_falso_user');
    window.location.reload();
}

export default async function loginPage() {
    const userData = localStorage.getItem('teto_falso_user');
    const user = userData ? JSON.parse(userData) : null;

    if (user) {
        render(`
        <div style="width: 100%; max-width: 460px; margin: 0 auto; padding: 2rem;">
            <div style="width: 100%;">
                <div class="card text-center">
                    <div style="font-size: 2.5rem; font-weight: 900; margin-bottom: 1rem; letter-spacing: 0.1em;">
                        <span style="color: #3b82f6;">F</span><span style="color: #ef4444;">T</span><span style="color: #3b82f6;">S</span>
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Faça o novo login</h2>
                    <p style="color: var(--gray); margin-bottom: 0.25rem;">
                        <strong>${user.nome}</strong>
                    </p>
                    <p style="color: var(--gray); font-size: 0.9rem; margin-bottom: 1.5rem;">
                        ${user.email} · 
                        <span class="badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'funcionario' ? 'badge-warning' : 'badge-success'}">
                            ${user.role === 'admin' ? 'Admin' : user.role === 'funcionario' ? 'Funcionário' : 'Cliente'}
                        </span>
                    </p>
                    <div style="display: flex; justify-content: center;">
                        <button id="btnLogoutLogin" class="btn" style="background: #ef4444; color: white; padding: 0.875rem 2rem; border-radius: var(--radius-lg); font-weight: 600;">
                            Terminar Sessão
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `);
        document.getElementById('btnLogoutLogin').addEventListener('click', fazerLogout);
        return;
    }

    render(`
    <div style="width: 100%; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <div style="width: 100%;">
            <!-- Tabs -->
            <div class="tabs" id="authTabs" style="justify-content: center; border-bottom: none; gap: 0;">
                <button class="tab active" data-tab="login" style="border: 2px solid var(--light); border-right: none; border-radius: var(--radius-lg) 0 0 var(--radius-lg); padding: 0.75rem 2rem;">
                    Entrar
                </button>
                <button class="tab" data-tab="register" style="border: 2px solid var(--light); border-radius: 0 var(--radius-lg) var(--radius-lg) 0; padding: 0.75rem 2rem;">
                    Registar
                </button>
            </div>

            <!-- Login Form -->
            <div class="card" id="loginForm" style="margin-top: 1.5rem;">
                <div style="display: flex; justify-content: center; margin-bottom: 1.5rem;">
                    <img src="images/logo.png" alt="Tecto Falso Sabao" style="width: 100px; height: auto;">
                </div>
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; text-align: center;"><span style="color: #3b82f6;">TECTO FALSO</span> <span style="color: #ef4444;">SABAO</span></h2>
                <p style="color: var(--gray); text-align: center; margin-bottom: 0.25rem;">SEJA BEM VINDO A CORPORACAO SABAO</p>
                <p style="color: var(--gray); text-align: center; margin-bottom: 1.5rem; font-size: 0.9rem;">Entre com as suas credenciais</p>

                <form id="formLogin">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="loginEmail" placeholder="seu@email.com" required maxlength="54">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Senha</label>
                        <input type="password" class="form-input" id="loginSenha" placeholder="Sua senha" required maxlength="12">
                    </div>
                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%;" id="btnLoginSubmit">
                        Entrar
                    </button>
                </form>
                <p style="text-align: center; margin-top: 1rem; font-size: 0.85rem; color: var(--gray);">
                    Ainda não tem conta? <a href="#" id="linkRegister" style="color: var(--primary); font-weight: 600;">Registe-se</a>
                </p>
            </div>

            <!-- Register Form -->
            <div class="card" id="registerForm" style="margin-top: 1.5rem; display: none;">
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center;">Criar Conta</h2>
                <p style="color: var(--gray); text-align: center; margin-bottom: 1.5rem;">Registe-se como cliente</p>

                <form id="formRegister">
                    <div class="form-group">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" class="form-input" id="regNome" placeholder="Seu nome" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="regEmail" placeholder="seu@email.com" required maxlength="54">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Telefone</label>
                        <input type="tel" class="form-input" id="regTelefone" placeholder="84 123 4567" maxlength="9" oninput="this.value = this.value.replace(/[^0-9]/g, '').slice(0, 9)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Senha</label>
                        <input type="password" class="form-input" id="regSenha" placeholder="Crie uma senha" required minlength="4" maxlength="12">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirmar Senha</label>
                        <input type="password" class="form-input" id="regConfirmarSenha" placeholder="Confirme a senha" required maxlength="12">
                    </div>
                    <button type="submit" class="btn btn-primary btn-large" style="width: 100%;" id="btnRegisterSubmit">
                        Criar Conta
                    </button>
                </form>
                <p style="text-align: center; margin-top: 1rem; font-size: 0.85rem; color: var(--gray);">
                    Já tem conta? <a href="#" id="linkLogin" style="color: var(--primary); font-weight: 600;">Entre aqui</a>
                </p>
            </div>
        </div>
    </div>
    `);

    // Tab switching
    const showLoginForm = () => {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.querySelectorAll('#authTabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelector('#authTabs .tab[data-tab="login"]').classList.add('active');
    };

    const showRegisterForm = () => {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.querySelectorAll('#authTabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelector('#authTabs .tab[data-tab="register"]').classList.add('active');
    };

    document.querySelectorAll('#authTabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'login') showLoginForm();
            else showRegisterForm();
        });
    });

    document.getElementById('linkRegister').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    document.getElementById('linkLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // Login form
    document.getElementById('formLogin').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;
        const btn = document.getElementById('btnLoginSubmit');
        btn.disabled = true;
        btn.textContent = 'Entrando...';

        try {
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fazer login');
            }

            localStorage.setItem('teto_falso_token', data.token);
            localStorage.setItem('teto_falso_user', JSON.stringify(data.user));
            sessionStorage.setItem('teto_falso_session', '1');
            atualizarNav();
            showSuccess(`Bem-vindo, ${data.user.nome}!`);
            router.navigate(redirectAfterLogin(data.user));
        } catch (error) {
            showError(error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    });

    // Register form
    document.getElementById('formRegister').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('regNome').value;
        const email = document.getElementById('regEmail').value;
        const telefone = document.getElementById('regTelefone').value;
        const senha = document.getElementById('regSenha').value;
        const confirmarSenha = document.getElementById('regConfirmarSenha').value;
        const btn = document.getElementById('btnRegisterSubmit');
        btn.disabled = true;
        btn.textContent = 'Registando...';

        if (senha !== confirmarSenha) {
            showError('As senhas não coincidem');
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, telefone })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao registar');
            }

            localStorage.setItem('teto_falso_token', data.token);
            localStorage.setItem('teto_falso_user', JSON.stringify(data.user));
            sessionStorage.setItem('teto_falso_session', '1');
            atualizarNav();
            showSuccess('Conta criada com sucesso!');
            router.navigate('home');
        } catch (error) {
            showError(error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
        }
    });
}

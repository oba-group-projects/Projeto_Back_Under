/**
 * Modal / Tela de Autenticação e Solicitação de Cadastro
 * Suporte a Login e Novo Cadastro com Nome / WhatsApp / Cidade
 */
import { authManager } from '../core/authManager.js';

export class LoginModal {
  constructor(onLoginSuccess) {
    this.onLoginSuccess = onLoginSuccess;
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'login-modal-overlay';
    this.overlay.id = 'loginModalOverlay';

    this.overlay.innerHTML = `
      <div class="login-card" style="max-width: 440px;">
        <div class="login-header">
          <div class="brand-icon" style="margin: 0 auto 0.6rem auto; width: 46px; height: 46px; font-size: 1.35rem;">⚽</div>
          <h2 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.25;">PRECIFICAÇÃO JUSTA<br><span style="color: #38bdf8;">BACK AO UNDER</span></h2>
          <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.25rem;">Terminal de Trading Esportivo Profissional</p>
        </div>

        <!-- Seletor de Modo (Entrar vs Solicitar Cadastro) -->
        <div class="login-tabs-toggle">
          <button id="tabLoginBtn" class="login-tab-btn active">🔑 Entrar</button>
          <button id="tabRegisterBtn" class="login-tab-btn">📝 Solicitar Cadastro</button>
        </div>

        <!-- FORMULÁRIO 1: LOGIN -->
        <form id="loginForm" class="login-form">
          <div class="login-input-group">
            <label class="login-label">E-MAIL:</label>
            <input type="email" id="loginEmailInput" class="login-input" placeholder="seu@email.com" required autocomplete="username">
          </div>

          <div class="login-input-group">
            <label class="login-label">SENHA:</label>
            <input type="password" id="loginPasswordInput" class="login-input" placeholder="••••••••" required autocomplete="current-password">
          </div>

          <div id="loginErrorMessage" class="login-error-msg" style="display: none;"></div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.65rem; font-size: 0.9rem; margin-top: 0.2rem;">
            🔓 Entrar no Cockpit
          </button>
        </form>

        <!-- FORMULÁRIO 2: SOLICITAÇÃO DE CADASTRO (NOME, WHATSAPP, CIDADE) -->
        <form id="registerForm" class="login-form" style="display: none;">
          <div class="login-input-group">
            <label class="login-label">NOME COMPLETO:</label>
            <input type="text" id="regNameInput" class="login-input" placeholder="Ex: Carlos Eduardo" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
            <div class="login-input-group">
              <label class="login-label">WHATSAPP:</label>
              <input type="tel" id="regWhatsInput" class="login-input" placeholder="(11) 99999-9999" required>
            </div>
            <div class="login-input-group">
              <label class="login-label">CIDADE / UF:</label>
              <input type="text" id="regCityInput" class="login-input" placeholder="Ex: Curitiba / PR" required>
            </div>
          </div>

          <div class="login-input-group">
            <label class="login-label">E-MAIL:</label>
            <input type="email" id="regEmailInput" class="login-input" placeholder="seu@email.com" required>
          </div>

          <div class="login-input-group">
            <label class="login-label">CRIE UMA SENHA:</label>
            <input type="password" id="regPasswordInput" class="login-input" placeholder="••••••••" required>
          </div>

          <div id="registerSuccessMessage" class="login-success-msg" style="display: none;"></div>
          <div id="registerErrorMessage" class="login-error-msg" style="display: none;"></div>

          <button type="submit" class="btn btn-success" style="width: 100%; padding: 0.65rem; font-size: 0.9rem; margin-top: 0.2rem;">
            🚀 Enviar Solicitação para o Admin
          </button>
        </form>

        <div class="login-footer-info" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.75rem; text-align: center;">
          <p style="font-size: 0.68rem; color: var(--text-muted); margin: 0;">
            🔒 Acesso restrito para usuários cadastrados e aprovados.<br>
            <span style="color: var(--text-secondary);">Dúvidas ou suporte: contate o Administrador.</span>
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const tabLogin = this.overlay.querySelector('#tabLoginBtn');
    const tabReg = this.overlay.querySelector('#tabRegisterBtn');
    const loginForm = this.overlay.querySelector('#loginForm');
    const regForm = this.overlay.querySelector('#registerForm');

    // Alternador de abas
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabReg.classList.remove('active');
      loginForm.style.display = 'flex';
      regForm.style.display = 'none';
    });

    tabReg.addEventListener('click', () => {
      tabReg.classList.add('active');
      tabLogin.classList.remove('active');
      loginForm.style.display = 'none';
      regForm.style.display = 'flex';
    });

    // Submit de Login
    const emailInput = this.overlay.querySelector('#loginEmailInput');
    const passInput = this.overlay.querySelector('#loginPasswordInput');
    const loginError = this.overlay.querySelector('#loginErrorMessage');

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value;
      const pass = passInput.value;

      const res = authManager.login(email, pass);
      if (res.success) {
        this.hide();
        if (this.onLoginSuccess) this.onLoginSuccess(res.user);
      } else {
        loginError.textContent = res.message;
        loginError.style.display = 'block';
      }
    });

    // Submit de Cadastro
    const regName = this.overlay.querySelector('#regNameInput');
    const regWhats = this.overlay.querySelector('#regWhatsInput');
    const regCity = this.overlay.querySelector('#regCityInput');
    const regEmail = this.overlay.querySelector('#regEmailInput');
    const regPass = this.overlay.querySelector('#regPasswordInput');
    const regSuccess = this.overlay.querySelector('#registerSuccessMessage');
    const regError = this.overlay.querySelector('#registerErrorMessage');

    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      regError.style.display = 'none';
      regSuccess.style.display = 'none';

      const res = authManager.requestRegistration({
        name: regName.value,
        whatsapp: regWhats.value,
        city: regCity.value,
        email: regEmail.value,
        password: regPass.value
      });

      if (res.success) {
        regSuccess.innerHTML = `
          <strong>🎉 Solicitação Enviada!</strong><br>
          Seus dados foram enviados para análise do Administrador. Assim que for aprovado, você poderá acessar o cockpit com seu e-mail e senha.
        `;
        regSuccess.style.display = 'block';
        regForm.reset();
      } else {
        regError.textContent = res.message;
        regError.style.display = 'block';
      }
    });
  }

  show() {
    const loginError = this.overlay.querySelector('#loginErrorMessage');
    const regError = this.overlay.querySelector('#registerErrorMessage');
    const regSuccess = this.overlay.querySelector('#registerSuccessMessage');
    if (loginError) loginError.style.display = 'none';
    if (regError) regError.style.display = 'none';
    if (regSuccess) regSuccess.style.display = 'none';

    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

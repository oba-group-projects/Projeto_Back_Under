/**
 * Modal / Tela de Autenticação (Login)
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
      <div class="login-card">
        <div class="login-header">
          <div class="brand-icon" style="margin: 0 auto 0.5rem auto; width: 44px; height: 44px; font-size: 1.3rem;">⚽</div>
          <h2 style="font-size: 1.3rem; font-weight: 800; color: #ffffff; margin: 0;">PROJETO BACK UNDER</h2>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">Cockpit de Trading Esportivo de Alta Performance</p>
        </div>

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

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.65rem; font-size: 0.9rem; margin-top: 0.35rem;">
            🔓 Entrar no Sistema
          </button>
        </form>

        <div class="login-quick-demo">
          <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Acesso Rápido para Testes:</span>
          <div style="display: flex; gap: 0.4rem; margin-top: 0.35rem;">
            <button id="quickLoginAdminBtn" class="btn btn-secondary btn-sm" style="flex: 1; border-color: #eab308; color: #fef08a;">👑 Administrador</button>
            <button id="quickLoginTraderBtn" class="btn btn-secondary btn-sm" style="flex: 1; border-color: #38bdf8; color: #bae6fd;">👤 Trader Teste</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const form = this.overlay.querySelector('#loginForm');
    const emailInput = this.overlay.querySelector('#loginEmailInput');
    const passInput = this.overlay.querySelector('#loginPasswordInput');
    const errorMsg = this.overlay.querySelector('#loginErrorMessage');
    const quickAdmin = this.overlay.querySelector('#quickLoginAdminBtn');
    const quickTrader = this.overlay.querySelector('#quickLoginTraderBtn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value;
      const pass = passInput.value;

      const res = authManager.login(email, pass);
      if (res.success) {
        this.hide();
        if (this.onLoginSuccess) this.onLoginSuccess(res.user);
      } else {
        errorMsg.textContent = res.message;
        errorMsg.style.display = 'block';
      }
    });

    quickAdmin.addEventListener('click', () => {
      emailInput.value = 'admin@backunder.pro';
      passInput.value = 'admin';
      const res = authManager.login('admin@backunder.pro', 'admin');
      if (res.success) {
        this.hide();
        if (this.onLoginSuccess) this.onLoginSuccess(res.user);
      }
    });

    quickTrader.addEventListener('click', () => {
      emailInput.value = 'trader@teste.com';
      passInput.value = 'teste';
      const res = authManager.login('trader@teste.com', 'teste');
      if (res.success) {
        this.hide();
        if (this.onLoginSuccess) this.onLoginSuccess(res.user);
      }
    });
  }

  show() {
    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

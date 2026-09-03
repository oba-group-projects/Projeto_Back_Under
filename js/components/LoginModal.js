/**
 * Modal / Tela de Autenticação (Login Profissional)
 * Acesso exclusivo para Administrador e Assinantes Autorizados
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
          <div class="brand-icon" style="margin: 0 auto 0.65rem auto; width: 48px; height: 48px; font-size: 1.4rem;">⚽</div>
          <h2 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.3;">PRECIFICAÇÃO JUSTA<br><span style="color: #38bdf8;">BACK AO UNDER</span></h2>
          <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.35rem;">Terminal de Trading Esportivo Profissional</p>
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
            🔓 Entrar no Cockpit
          </button>
        </form>

        <div class="login-footer-info" style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.85rem; text-align: center;">
          <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0;">
            🔒 Acesso restrito para usuários cadastrados.<br>
            <span style="color: var(--text-secondary);">Dúvidas ou suporte: contate o Administrador.</span>
          </p>
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
  }

  show() {
    const errorMsg = this.overlay.querySelector('#loginErrorMessage');
    if (errorMsg) errorMsg.style.display = 'none';
    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

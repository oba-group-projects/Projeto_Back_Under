/**
 * Modal de Identificação — Modo sem Autenticação
 *
 * Substitui o fluxo de login+senha por identificação simples via e-mail.
 * Cadastro aceito automaticamente, sem senha e sem aprovação pendente.
 */
import { authManager } from '../core/authManager.js?v=3.0';
import { themeManager } from '../core/themeManager.js?v=2.5';

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

    const theme = themeManager.getTheme();
    const cleanWhats = (theme.supportWhatsApp || '').replace(/\D/g, '');
    const whatsMsg = encodeURIComponent(
      theme.supportMsg ||
        'Olá! Gostaria de tirar uma dúvida/suporte no Cockpit Precificação Justa Back ao Under.'
    );

    this.overlay.innerHTML = `
      <div class="login-card" style="max-width: 440px;">
        <div class="login-header">
          <div class="brand-icon" style="margin: 0 auto 0.6rem auto; width: 46px; height: 46px; font-size: 1.35rem;">⚽</div>
          <h2 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0; line-height: 1.25;">
            PRECIFICAÇÃO JUSTA<br><span style="color: #38bdf8;">BACK AO UNDER</span>
          </h2>
          <p style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Terminal de Trading Esportivo Profissional
          </p>
        </div>

        <!-- Seletor de Modo -->
        <div class="login-tabs-toggle">
          <button id="tabIdentifyBtn" class="login-tab-btn active">▶️ Entrar</button>
          <button id="tabRegisterBtn" class="login-tab-btn">✨ Cadastrar</button>
        </div>

        <!-- FORMULÁRIO 1: IDENTIFICAÇÃO (sem senha) -->
        <form id="identifyForm" class="login-form">
          <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.75rem 0; text-align: center;">
            Informe seu e-mail para acessar o cockpit.<br>
            Nenhuma senha é necessária nesta versão.
          </p>

          <div class="login-input-group">
            <label class="login-label">E-MAIL:</label>
            <input
              type="email"
              id="identifyEmailInput"
              class="login-input"
              placeholder="seu@email.com"
              required
              autocomplete="email"
            >
          </div>

          <div id="identifyErrorMessage" class="login-error-msg" style="display: none;"></div>

          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.65rem; font-size: 0.9rem; margin-top: 0.4rem;">
            🚀 Acessar Cockpit
          </button>
        </form>

        <!-- FORMULÁRIO 2: CADASTRO (sem senha, sem aprovação) -->
        <form id="registerForm" class="login-form" style="display: none;">
          <p style="font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.75rem 0; text-align: center;">
            Cadastre seu perfil. O acesso é liberado imediatamente.
          </p>

          <div class="login-input-group">
            <label class="login-label">NOME COMPLETO:</label>
            <input
              type="text"
              id="regNameInput"
              class="login-input"
              placeholder="Ex: Carlos Eduardo"
              required
            >
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
            <div class="login-input-group">
              <label class="login-label">WHATSAPP (COM DDD):</label>
              <input
                type="tel"
                id="regWhatsInput"
                class="login-input"
                placeholder="(51) 99999-9999"
              >
            </div>
            <div class="login-input-group">
              <label class="login-label">CIDADE / UF:</label>
              <input
                type="text"
                id="regCityInput"
                class="login-input"
                placeholder="Ex: Porto Alegre / RS"
              >
            </div>
          </div>

          <div class="login-input-group">
            <label class="login-label">E-MAIL:</label>
            <input
              type="email"
              id="regEmailInput"
              class="login-input"
              placeholder="seu@email.com"
              required
            >
          </div>

          <div id="registerSuccessMessage" class="login-success-msg" style="display: none;"></div>
          <div id="registerErrorMessage" class="login-error-msg" style="display: none;"></div>

          <button type="submit" class="btn btn-success" style="width: 100%; padding: 0.65rem; font-size: 0.9rem; margin-top: 0.4rem;">
            ✅ Concluir Cadastro
          </button>
        </form>

        <!-- RODAPÉ: SUPORTE -->
        ${
          cleanWhats
            ? `
        <div class="login-footer-info" style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.85rem; margin-top: 0.85rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.45rem;">
          <span style="font-size: 0.72rem; color: #94a3b8;">Dúvidas ou suporte?</span>
          <a id="loginWhatsSupportLink"
             href="https://wa.me/55${cleanWhats}?text=${whatsMsg}"
             target="_blank"
             rel="noopener noreferrer"
             style="display: inline-flex; align-items: center; gap: 0.4rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 0.45rem 0.95rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700;">
            <span>💬 Falar no WhatsApp</span>
          </a>
        </div>`
            : ''
        }
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const tabIdentify = this.overlay.querySelector('#tabIdentifyBtn');
    const tabReg = this.overlay.querySelector('#tabRegisterBtn');
    const identifyForm = this.overlay.querySelector('#identifyForm');
    const regForm = this.overlay.querySelector('#registerForm');

    // ── Alternador de abas ──────────────────────────────────────────────────
    tabIdentify.addEventListener('click', () => {
      tabIdentify.classList.add('active');
      tabReg.classList.remove('active');
      identifyForm.style.display = 'flex';
      regForm.style.display = 'none';
    });

    tabReg.addEventListener('click', () => {
      tabReg.classList.add('active');
      tabIdentify.classList.remove('active');
      identifyForm.style.display = 'none';
      regForm.style.display = 'flex';
    });

    // ── Submit de Identificação ─────────────────────────────────────────────
    const emailInput = this.overlay.querySelector('#identifyEmailInput');
    const identifyError = this.overlay.querySelector('#identifyErrorMessage');

    identifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      identifyError.style.display = 'none';

      const res = authManager.identify(emailInput.value.trim());

      if (res.success) {
        this.hide();
        if (this.onLoginSuccess) this.onLoginSuccess(res.user);
      } else {
        identifyError.textContent = res.message;
        identifyError.style.display = 'block';
      }
    });

    // ── Submit de Cadastro ──────────────────────────────────────────────────
    const regName = this.overlay.querySelector('#regNameInput');
    const regWhats = this.overlay.querySelector('#regWhatsInput');
    const regCity = this.overlay.querySelector('#regCityInput');
    const regEmail = this.overlay.querySelector('#regEmailInput');
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
      });

      if (res.success) {
        // Faz login automático após cadastro
        const sessionRes = authManager.identify(regEmail.value.trim(), regName.value.trim());
        regSuccess.innerHTML = `
          <strong>✅ Cadastro realizado com sucesso!</strong><br>
          Acesso liberado imediatamente. Bem-vindo, ${res.user.name}!
        `;
        regSuccess.style.display = 'block';
        regForm.reset();

        // Fecha modal e entra no cockpit após 1.5 s
        setTimeout(() => {
          this.hide();
          if (this.onLoginSuccess && sessionRes.success) {
            this.onLoginSuccess(sessionRes.user);
          }
        }, 1500);
      } else {
        regError.textContent = res.message;
        regError.style.display = 'block';
      }
    });
  }

  show() {
    const identifyError = this.overlay.querySelector('#identifyErrorMessage');
    const regError = this.overlay.querySelector('#registerErrorMessage');
    const regSuccess = this.overlay.querySelector('#registerSuccessMessage');
    if (identifyError) identifyError.style.display = 'none';
    if (regError) regError.style.display = 'none';
    if (regSuccess) regSuccess.style.display = 'none';

    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

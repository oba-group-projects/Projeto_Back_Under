/**
 * Modal de Perfil do Usuário - Edição de Dados e Troca de Senha
 * - Atualização de Nome, WhatsApp, Cidade e E-mail
 * - Medidor de Força de Senha em Tempo Real
 * - Gerador de Senhas Fortes Automático
 */
import { authManager } from '../core/authManager.js';

export class UserProfileModal {
  constructor(onProfileUpdated) {
    this.onProfileUpdated = onProfileUpdated;
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay user-profile-modal-overlay';
    this.overlay.id = 'userProfileModal';

    this.overlay.innerHTML = `
      <div class="modal-content" style="max-width: 520px; max-height: 90vh;">
        <div class="modal-header" style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 58, 138, 0.6) 100%);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">👤</span>
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 800; color: #ffffff; margin: 0;">MEU PERFIL & DADOS</h3>
              <p style="font-size: 0.7rem; color: #93c5fd; margin: 0;">Atualize seus dados de cadastro e segurança</p>
            </div>
          </div>
          <button id="closeProfileModalBtn" class="modal-close-btn">&times;</button>
        </div>

        <div class="modal-body" style="padding: 1.25rem;">
          <form id="userProfileForm" style="display: flex; flex-direction: column; gap: 0.85rem;">
            
            <!-- Dados Pessoais -->
            <div class="login-input-group">
              <label class="login-label">NOME COMPLETO:</label>
              <input type="text" id="profNameInput" class="login-input" required>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <div class="login-input-group">
                <label class="login-label">WHATSAPP:</label>
                <input type="tel" id="profWhatsInput" class="login-input" placeholder="(11) 99999-9999" required>
              </div>
              <div class="login-input-group">
                <label class="login-label">CIDADE / UF:</label>
                <input type="text" id="profCityInput" class="login-input" placeholder="São Paulo / SP" required>
              </div>
            </div>

            <div class="login-input-group">
              <label class="login-label">E-MAIL:</label>
              <input type="email" id="profEmailInput" class="login-input" required>
            </div>

            <!-- Divisor Alteração de Senha -->
            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0.4rem 0 0.2rem 0; padding-top: 0.65rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.45rem;">
                <span style="font-size: 0.75rem; font-weight: 800; color: #fef08a;">🔐 ALTERAR SENHA (OPCIONAL):</span>
                <button type="button" id="btnGenerateStrongPassword" class="btn btn-secondary btn-sm" style="font-size: 0.65rem; padding: 0.15rem 0.45rem; border-color: #38bdf8; color: #bae6fd;">
                  🎲 Sugerir Senha Forte
                </button>
              </div>

              <div class="login-input-group" style="margin-bottom: 0.5rem;">
                <label class="login-label">SENHA ATUAL (obrigatória caso deseje mudar a senha):</label>
                <input type="password" id="profCurrentPassInput" class="login-input" placeholder="Digite sua senha atual">
              </div>

              <div class="login-input-group" style="margin-bottom: 0.4rem;">
                <label class="login-label">NOVA SENHA:</label>
                <input type="password" id="profNewPassInput" class="login-input" placeholder="Nova senha segura">
              </div>

              <!-- Medidor de Força de Senha -->
              <div id="passwordStrengthBox" style="display: none; flex-direction: column; gap: 0.3rem; background: #020617; border: 1px solid #334155; border-radius: 6px; padding: 0.5rem; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.68rem; font-weight: 800;">
                  <span style="color: var(--text-secondary);">FORÇA DA SENHA:</span>
                  <span id="strengthLabel" style="color: #f87171;">FRACA</span>
                </div>
                
                <!-- Barra Colorida -->
                <div style="width: 100%; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden;">
                  <div id="strengthBar" style="width: 20%; height: 100%; background: #ef4444; transition: all 0.3s ease;"></div>
                </div>

                <!-- Checklist de Requisitos -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.2rem; font-size: 0.62rem; color: var(--text-muted); margin-top: 0.2rem;">
                  <span id="reqLength">❌ Mínimo 8 caracteres</span>
                  <span id="reqUpper">❌ Letra maiúscula (A-Z)</span>
                  <span id="reqLower">❌ Letra minúscula (a-z)</span>
                  <span id="reqNumber">❌ Número (0-9)</span>
                  <span id="reqSpecial" style="grid-column: span 2;">❌ Símbolo especial (!@#$%^&*)</span>
                </div>
              </div>

              <div class="login-input-group">
                <label class="login-label">CONFIRMAR NOVA SENHA:</label>
                <input type="password" id="profConfirmPassInput" class="login-input" placeholder="Repita a nova senha">
              </div>
            </div>

            <div id="profErrorMessage" class="login-error-msg" style="display: none;"></div>
            <div id="profSuccessMessage" class="login-success-msg" style="display: none;"></div>

            <button type="submit" class="btn btn-primary" style="padding: 0.65rem; font-size: 0.9rem; margin-top: 0.35rem;">
              💾 Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const closeBtn = this.overlay.querySelector('#closeProfileModalBtn');
    closeBtn.addEventListener('click', () => this.hide());

    const form = this.overlay.querySelector('#userProfileForm');
    const newPassInput = this.overlay.querySelector('#profNewPassInput');
    const genBtn = this.overlay.querySelector('#btnGenerateStrongPassword');

    // Medidor de Força em Tempo Real
    newPassInput.addEventListener('input', (e) => {
      this.evaluatePasswordStrength(e.target.value);
    });

    // Gerador de Senha Forte
    genBtn.addEventListener('click', () => {
      const strong = this.generateStrongPassword();
      newPassInput.value = strong;
      newPassInput.type = 'text'; // Mostra a senha gerada
      const confirmPass = this.overlay.querySelector('#profConfirmPassInput');
      confirmPass.value = strong;
      confirmPass.type = 'text';

      this.evaluatePasswordStrength(strong);
      alert(`🎲 Senha forte gerada: ${strong}\n\nCopie e guarde em local seguro!`);
    });

    // Submit de Atualização
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const session = authManager.getCurrentSession();
      if (!session) return;

      const name = this.overlay.querySelector('#profNameInput').value;
      const whats = this.overlay.querySelector('#profWhatsInput').value;
      const city = this.overlay.querySelector('#profCityInput').value;
      const email = this.overlay.querySelector('#profEmailInput').value;
      const currentPass = this.overlay.querySelector('#profCurrentPassInput').value;
      const newPass = this.overlay.querySelector('#profNewPassInput').value;
      const confirmPass = this.overlay.querySelector('#profConfirmPassInput').value;
      const errorMsg = this.overlay.querySelector('#profErrorMessage');
      const successMsg = this.overlay.querySelector('#profSuccessMessage');

      errorMsg.style.display = 'none';
      successMsg.style.display = 'none';

      if (newPass && newPass !== confirmPass) {
        errorMsg.textContent = 'A confirmação de senha não confere com a nova senha.';
        errorMsg.style.display = 'block';
        return;
      }

      const res = authManager.updateProfile(session.userId, {
        name,
        whatsapp: whats,
        city,
        email,
        currentPassword: currentPass,
        newPassword: newPass
      });

      if (res.success) {
        successMsg.textContent = '✅ Perfil e dados atualizados com sucesso!';
        successMsg.style.display = 'block';
        this.overlay.querySelector('#profCurrentPassInput').value = '';
        this.overlay.querySelector('#profNewPassInput').value = '';
        this.overlay.querySelector('#profConfirmPassInput').value = '';
        this.overlay.querySelector('#passwordStrengthBox').style.display = 'none';

        if (this.onProfileUpdated) this.onProfileUpdated(res.user);
        setTimeout(() => this.hide(), 1500);
      } else {
        errorMsg.textContent = res.message;
        errorMsg.style.display = 'block';
      }
    });
  }

  evaluatePasswordStrength(password) {
    const box = this.overlay.querySelector('#passwordStrengthBox');
    const bar = this.overlay.querySelector('#strengthBar');
    const label = this.overlay.querySelector('#strengthLabel');

    const reqLen = this.overlay.querySelector('#reqLength');
    const reqUp = this.overlay.querySelector('#reqUpper');
    const reqLow = this.overlay.querySelector('#reqLower');
    const reqNum = this.overlay.querySelector('#reqNumber');
    const reqSpec = this.overlay.querySelector('#reqSpecial');

    if (!password || password.length === 0) {
      box.style.display = 'none';
      return;
    }

    box.style.display = 'flex';

    const hasLen = password.length >= 8;
    const hasUp = /[A-Z]/.test(password);
    const hasLow = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    reqLen.innerHTML = hasLen ? '✅ Mínimo 8 caracteres' : '❌ Mínimo 8 caracteres';
    reqLen.style.color = hasLen ? '#4ade80' : 'var(--text-muted)';

    reqUp.innerHTML = hasUp ? '✅ Letra maiúscula (A-Z)' : '❌ Letra maiúscula (A-Z)';
    reqUp.style.color = hasUp ? '#4ade80' : 'var(--text-muted)';

    reqLow.innerHTML = hasLow ? '✅ Letra minúscula (a-z)' : '❌ Letra minúscula (a-z)';
    reqLow.style.color = hasLow ? '#4ade80' : 'var(--text-muted)';

    reqNum.innerHTML = hasNum ? '✅ Número (0-9)' : '❌ Número (0-9)';
    reqNum.style.color = hasNum ? '#4ade80' : 'var(--text-muted)';

    reqSpec.innerHTML = hasSpec ? '✅ Símbolo especial (!@#$%...)' : '❌ Símbolo especial (!@#$%...)';
    reqSpec.style.color = hasSpec ? '#4ade80' : 'var(--text-muted)';

    let score = 0;
    if (hasLen) score++;
    if (hasUp) score++;
    if (hasLow) score++;
    if (hasNum) score++;
    if (hasSpec) score++;

    if (score <= 2) {
      label.textContent = 'FRACA 🔴';
      label.style.color = '#f87171';
      bar.style.width = '25%';
      bar.style.background = '#ef4444';
    } else if (score === 3) {
      label.textContent = 'MÉDIA 🟡';
      label.style.color = '#fbbf24';
      bar.style.width = '50%';
      bar.style.background = '#f59e0b';
    } else if (score === 4) {
      label.textContent = 'FORTE 🟢';
      label.style.color = '#34d399';
      bar.style.width = '75%';
      bar.style.background = '#10b981';
    } else {
      label.textContent = 'EXCELENTE 🛡️';
      label.style.color = '#38bdf8';
      bar.style.width = '100%';
      bar.style.background = '#06b6d4';
    }
  }

  generateStrongPassword() {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%^&*_-+=';
    const all = uppers + lowers + numbers + specials;

    let pwd = '';
    pwd += uppers.charAt(Math.floor(Math.random() * uppers.length));
    pwd += lowers.charAt(Math.floor(Math.random() * lowers.length));
    pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
    pwd += specials.charAt(Math.floor(Math.random() * specials.length));

    for (let i = 4; i < 12; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }

    // Embaralha os caracteres
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  }

  show() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    this.overlay.querySelector('#profNameInput').value = user.name || '';
    this.overlay.querySelector('#profWhatsInput').value = user.whatsapp || '';
    this.overlay.querySelector('#profCityInput').value = user.city || '';
    this.overlay.querySelector('#profEmailInput').value = user.email || '';
    this.overlay.querySelector('#profCurrentPassInput').value = '';
    this.overlay.querySelector('#profNewPassInput').value = '';
    this.overlay.querySelector('#profConfirmPassInput').value = '';
    this.overlay.querySelector('#profErrorMessage').style.display = 'none';
    this.overlay.querySelector('#profSuccessMessage').style.display = 'none';
    this.overlay.querySelector('#passwordStrengthBox').style.display = 'none';

    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

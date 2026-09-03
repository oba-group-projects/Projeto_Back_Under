/**
 * Painel / Dashboard do Administrador - PRECIFICAÇÃO JUSTA BACK AO UNDER
 * - Gerenciamento de Usuários e Aprovação de Solicitações Pendentes
 * - Atalhos Rápidos para WhatsApp Direto e Envio de E-mail
 * - Monitor de Acessos e Auditoria em Tempo Real
 */
import { authManager } from '../core/authManager.js?v=2.5';
import { themeManager, DEFAULT_THEME } from '../core/themeManager.js?v=2.5';

function formatPhoneDisplay(raw) {
  if (!raw) return '-';
  const clean = raw.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return raw;
}

export class AdminDashboard {
  constructor(onUserUpdated) {
    this.onUserUpdated = onUserUpdated;
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay admin-modal-overlay';
    this.overlay.id = 'adminDashboardModal';

    this.overlay.innerHTML = `
      <div class="modal-content" style="max-width: 1080px; max-height: 90vh;">
        <div class="modal-header" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.3rem;">👑</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0;">PAINEL DO ADMINISTRADOR</h3>
              <p style="font-size: 0.7rem; color: #93c5fd; margin: 0;">PRECIFICAÇÃO JUSTA BACK AO UNDER • Gestão de Cadastros e Auditoria</p>
            </div>
          </div>
          <button id="closeAdminModalBtn" class="modal-close-btn">&times;</button>
        </div>

        <!-- Abas do Painel -->
        <div class="admin-tabs-bar">
          <button class="admin-tab-btn active" data-admin-tab="pending">
            ⏳ Solicitações Pendentes <span id="pendingBadgeCount" class="admin-tab-badge">0</span>
          </button>
          <button class="admin-tab-btn" data-admin-tab="users">👥 Usuários Aprovados</button>
          <button class="admin-tab-btn" data-admin-tab="customizer">🎨 Customização & Cores</button>
          <button class="admin-tab-btn" data-admin-tab="logs">📍 Monitor de Acessos</button>
          <button class="admin-tab-btn" data-admin-tab="sheets">📊 Planilha & Fórmulas</button>
        </div>

        <div class="modal-body" style="padding: 1rem;">
          
          <!-- ABA 1: SOLICITAÇÕES PENDENTES (APROVAR / REPROVAR) -->
          <div id="adminTabPending" class="admin-tab-content active">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #fef08a;">⏳ Cadastros Aguardando Sua Aprovação:</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Clique no WhatsApp ou E-mail para falar direto com o aluno</span>
            </div>

            <div style="overflow-x: auto;">
              <table class="pendulo-table" style="font-size: 0.75rem;">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>WhatsApp (Link Direto)</th>
                    <th>Cidade / UF</th>
                    <th>E-mail (Link Direto)</th>
                    <th>Data Solicitação</th>
                    <th style="text-align: center;">Ações do Admin</th>
                  </tr>
                </thead>
                <tbody id="adminPendingTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- ABA 2: USUÁRIOS APROVADOS & CADASTRO DIRETO -->
          <div id="adminTabUsers" class="admin-tab-content" style="display: none;">
            
            <!-- Formulário Novo Usuário -->
            <div class="admin-create-user-box">
              <h4 style="font-size: 0.8rem; font-weight: 800; color: #fef08a; margin: 0 0 0.5rem 0;">➕ Cadastrar Novo Usuário Diretamente:</h4>
              <form id="adminCreateUserForm" style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <input type="text" id="newUserName" placeholder="Nome Completo" required class="select-control" style="flex: 1; min-width: 120px; font-size: 0.75rem;">
                <input type="tel" id="newUserWhats" placeholder="WhatsApp (DDD)" class="select-control" style="width: 125px; font-size: 0.75rem;">
                <input type="text" id="newUserCity" placeholder="Cidade/UF" class="select-control" style="width: 110px; font-size: 0.75rem;">
                <input type="email" id="newUserEmail" placeholder="E-mail" required class="select-control" style="flex: 1; min-width: 140px; font-size: 0.75rem;">
                <input type="password" id="newUserPassword" placeholder="Senha" required class="select-control" style="width: 90px; font-size: 0.75rem;">
                <select id="newUserRole" class="select-control" style="width: 85px; font-size: 0.75rem;">
                  <option value="user">Trader</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" class="btn btn-success btn-sm">Criar Acesso</button>
              </form>
            </div>

            <!-- Tabela de Usuários Aprovados -->
            <div style="margin-top: 1rem; overflow-x: auto;">
              <table class="pendulo-table" style="font-size: 0.75rem;">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>WhatsApp (Link Direto)</th>
                    <th>Cidade</th>
                    <th>E-mail (Link Direto)</th>
                    <th>Papel</th>
                    <th>Status</th>
                    <th>Último Acesso</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="adminUsersTableBody"></tbody>
              </table>
            </div>

          </div>

          <!-- ABA 3: CUSTOMIZAÇÃO & IDENTIDADE VISUAL -->
          <div id="adminTabCustomizer" class="admin-tab-content" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
              <div>
                <h4 style="font-size: 0.9rem; font-weight: 800; color: #fef08a; margin: 0;">🎨 Módulo de Customização & Identidade Visual</h4>
                <p style="font-size: 0.7rem; color: var(--text-muted); margin: 0.15rem 0 0 0;">Defina as cores, tipografia e dados de suporte oficiais para todos os traders.</p>
              </div>
              <div style="display: flex; gap: 0.4rem;">
                <button type="button" id="btnResetTheme" class="btn btn-secondary btn-sm" style="font-size: 0.72rem;">↺ Restaurar Padrões</button>
                <button type="button" id="btnSaveTheme" class="btn btn-success btn-sm" style="font-size: 0.75rem; padding: 0.35rem 0.85rem;">💾 Salvar Identidade</button>
              </div>
            </div>

            <div class="admin-customizer-grid">
              
              <!-- CARD 1: TIPOGRAFIA OFICIAL -->
              <div class="admin-customizer-card">
                <div class="admin-customizer-card-header">
                  <span>🔤</span>
                  <h5 class="admin-customizer-title">TIPOGRAFIA DO COCKPIT</h5>
                </div>
                <div class="admin-font-options-grid" id="themeFontOptions">
                  <label class="admin-font-choice-label active" data-font="calibri">
                    <input type="radio" name="adminFontTheme" value="calibri" checked>
                    <span style="font-family: var(--font-calibri);">Calibri Pro (Padrão)</span>
                  </label>
                  <label class="admin-font-choice-label" data-font="outfit">
                    <input type="radio" name="adminFontTheme" value="outfit">
                    <span style="font-family: var(--font-outfit);">Outfit (Moderna)</span>
                  </label>
                  <label class="admin-font-choice-label" data-font="jakarta">
                    <input type="radio" name="adminFontTheme" value="jakarta">
                    <span style="font-family: var(--font-jakarta);">Plus Jakarta (Tech)</span>
                  </label>
                  <label class="admin-font-choice-label" data-font="rajdhani">
                    <input type="radio" name="adminFontTheme" value="rajdhani">
                    <span style="font-family: var(--font-rajdhani);">Rajdhani (HUD)</span>
                  </label>
                  <label class="admin-font-choice-label" data-font="inter" style="grid-column: span 2;">
                    <input type="radio" name="adminFontTheme" value="inter">
                    <span style="font-family: var(--font-inter);">Inter (Clássica Minimalista)</span>
                  </label>
                </div>
              </div>

              <!-- CARD 2: ESCALA E ZOOM -->
              <div class="admin-customizer-card">
                <div class="admin-customizer-card-header">
                  <span>📐</span>
                  <h5 class="admin-customizer-title">ESCALA & ZOOM DO HUD</h5>
                </div>
                <div style="display: flex; gap: 0.5rem;" id="themeScaleOptions">
                  <label class="admin-font-choice-label" style="flex: 1;" data-scale="compact">
                    <input type="radio" name="adminHudScale" value="compact">
                    <span>Compacto (93%)</span>
                  </label>
                  <label class="admin-font-choice-label active" style="flex: 1;" data-scale="normal">
                    <input type="radio" name="adminHudScale" value="normal" checked>
                    <span>Padrão (100%)</span>
                  </label>
                  <label class="admin-font-choice-label" style="flex: 1;" data-scale="large">
                    <input type="radio" name="adminHudScale" value="large">
                    <span>Amplo / TV (107%)</span>
                  </label>
                </div>
              </div>

              <!-- CARD 3: CORES DOS SLOTS 1 A 4 -->
              <div class="admin-customizer-card">
                <div class="admin-customizer-card-header">
                  <span>🎮</span>
                  <h5 class="admin-customizer-title">CORES DOS 4 SLOTS (HEADER)</h5>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Slot #1 (Jogo 1):</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorSlot1" class="admin-color-input-picker" value="#1e3a8a">
                      <input type="text" id="themeTextSlot1" class="admin-color-hex-text" value="#1e3a8a">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Slot #2 (Jogo 2):</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorSlot2" class="admin-color-input-picker" value="#064e3b">
                      <input type="text" id="themeTextSlot2" class="admin-color-hex-text" value="#064e3b">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Slot #3 (Jogo 3):</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorSlot3" class="admin-color-input-picker" value="#581c87">
                      <input type="text" id="themeTextSlot3" class="admin-color-hex-text" value="#581c87">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Slot #4 (Jogo 4):</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorSlot4" class="admin-color-input-picker" value="#78350f">
                      <input type="text" id="themeTextSlot4" class="admin-color-hex-text" value="#78350f">
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD 4: CORES DOS BLOCOS 1 E 2 -->
              <div class="admin-customizer-card">
                <div class="admin-customizer-card-header">
                  <span>📊</span>
                  <h5 class="admin-customizer-title">CORES DOS BLOCOS (TOPO & FUNDO)</h5>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.45rem;">
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Topo (Back) Fundo:</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorTopoBg" class="admin-color-input-picker" value="#e0f2fe">
                      <input type="text" id="themeTextTopoBg" class="admin-color-hex-text" value="#e0f2fe">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Topo (Back) Texto:</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorTopoText" class="admin-color-input-picker" value="#0369a1">
                      <input type="text" id="themeTextTopoText" class="admin-color-hex-text" value="#0369a1">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Fundo (Lay) Fundo:</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorFundoBg" class="admin-color-input-picker" value="#ffe4e6">
                      <input type="text" id="themeTextFundoBg" class="admin-color-hex-text" value="#ffe4e6">
                    </div>
                  </div>
                  <div class="admin-color-picker-row">
                    <span class="admin-color-label">Fundo (Lay) Texto:</span>
                    <div class="admin-color-input-wrapper">
                      <input type="color" id="themeColorFundoText" class="admin-color-input-picker" value="#be123c">
                      <input type="text" id="themeTextFundoText" class="admin-color-hex-text" value="#be123c">
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD 5: DADOS DE SUPORTE WHATSAPP -->
              <div class="admin-customizer-card" style="grid-column: 1 / -1;">
                <div class="admin-customizer-card-header">
                  <span>📲</span>
                  <h5 class="admin-customizer-title">SUPORTE WHATSAPP OFICIAL</h5>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.65rem;">
                  <div class="login-input-group">
                    <label class="login-label">WHATSAPP (COM DDD):</label>
                    <input type="tel" id="themeSupportWhats" class="login-input" placeholder="(51) 99606-9505" value="51996069505">
                  </div>
                  <div class="login-input-group">
                    <label class="login-label">MENSAGEM AUTOMÁTICA DO BOTÃO:</label>
                    <input type="text" id="themeSupportMsg" class="login-input" placeholder="Mensagem pré-formatada">
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- ABA 4: LOGS DE ACESSO -->
          <div id="adminTabLogs" class="admin-tab-content" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #ffffff;">📍 Registro de Acessos em Tempo Real:</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Monitor de segurança e auditoria</span>
            </div>
            <div style="overflow-x: auto;">
              <table class="pendulo-table" style="font-size: 0.75rem;">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Usuário</th>
                    <th>IP de Origem</th>
                    <th>Dispositivo</th>
                    <th>Status</th>
                    <th>Observação</th>
                  </tr>
                </thead>
                <tbody id="adminLogsTableBody"></tbody>
              </table>
            </div>
          </div>

          <!-- ABA 5: PLANILHA & FÓRMULAS -->
          <div id="adminTabSheets" class="admin-tab-content" style="display: none;">
            <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1rem;">
              <h4 style="font-size: 0.9rem; font-weight: 800; color: #ffffff; margin: 0 0 0.5rem 0;">📊 Planilha Mestre Google Sheets (Área Restrita):</h4>
              <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.85rem;">
                Este link está oculto para usuários comuns para proteger suas fórmulas proprietárias.
              </p>
              <a href="https://docs.google.com/spreadsheets/d/1N1qP-n4e4LJTXvUGVm9CNiGySE9mvOrriGlvIZUWV0k/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn btn-sheets" style="padding: 0.6rem 1rem; font-size: 0.85rem;">
                📊 Abrir Planilha Oficial no Google Docs
              </a>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  bindEvents() {
    const closeBtn = this.overlay.querySelector('#closeAdminModalBtn');
    closeBtn.addEventListener('click', () => this.hide());

    // Alternador de Abas
    const tabButtons = this.overlay.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-admin-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.overlay.querySelector('#adminTabPending').style.display = tab === 'pending' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabUsers').style.display = tab === 'users' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabCustomizer').style.display = tab === 'customizer' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabLogs').style.display = tab === 'logs' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabSheets').style.display = tab === 'sheets' ? 'block' : 'none';

        if (tab === 'pending') this.renderPending();
        if (tab === 'users') this.renderUsers();
        if (tab === 'customizer') this.renderCustomizer();
        if (tab === 'logs') this.renderLogs();
      });
    });

    // Form Criar Usuário
    const form = this.overlay.querySelector('#adminCreateUserForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.overlay.querySelector('#newUserName').value;
      const whats = this.overlay.querySelector('#newUserWhats').value;
      const city = this.overlay.querySelector('#newUserCity').value;
      const email = this.overlay.querySelector('#newUserEmail').value;
      const pass = this.overlay.querySelector('#newUserPassword').value;
      const role = this.overlay.querySelector('#newUserRole').value;

      const res = authManager.createUser({ name, whatsapp: whats, city, email, password: pass, role });
      if (res.success) {
        form.reset();
        this.renderUsers();
      } else {
        alert(res.message);
      }
    });

    this.bindCustomizerEvents();
  }

  bindCustomizerEvents() {
    // 1. Tipografia (Radios)
    const fontLabels = this.overlay.querySelectorAll('#themeFontOptions .admin-font-choice-label');
    fontLabels.forEach(label => {
      label.addEventListener('click', () => {
        const radio = label.querySelector('input');
        if (radio) {
          radio.checked = true;
          fontLabels.forEach(l => l.classList.remove('active'));
          label.classList.add('active');
          themeManager.applyTheme({ ...this.getCustomizerFormValues(), fontTheme: radio.value });
        }
      });
    });

    // 2. Escala / Zoom (Radios)
    const scaleLabels = this.overlay.querySelectorAll('#themeScaleOptions .admin-font-choice-label');
    scaleLabels.forEach(label => {
      label.addEventListener('click', () => {
        const radio = label.querySelector('input');
        if (radio) {
          radio.checked = true;
          scaleLabels.forEach(l => l.classList.remove('active'));
          label.classList.add('active');
          themeManager.applyTheme({ ...this.getCustomizerFormValues(), hudScale: radio.value });
        }
      });
    });

    // 3. Sincronização e Live Preview de Color Pickers
    const pairs = [
      { picker: 'themeColorSlot1', text: 'themeTextSlot1' },
      { picker: 'themeColorSlot2', text: 'themeTextSlot2' },
      { picker: 'themeColorSlot3', text: 'themeTextSlot3' },
      { picker: 'themeColorSlot4', text: 'themeTextSlot4' },
      { picker: 'themeColorTopoBg', text: 'themeTextTopoBg' },
      { picker: 'themeColorTopoText', text: 'themeTextTopoText' },
      { picker: 'themeColorFundoBg', text: 'themeTextFundoBg' },
      { picker: 'themeColorFundoText', text: 'themeTextFundoText' }
    ];

    pairs.forEach(({ picker, text }) => {
      const pEl = this.overlay.querySelector(`#${picker}`);
      const tEl = this.overlay.querySelector(`#${text}`);
      if (pEl && tEl) {
        pEl.addEventListener('input', (e) => {
          tEl.value = e.target.value;
          themeManager.applyTheme(this.getCustomizerFormValues());
        });
        tEl.addEventListener('input', (e) => {
          if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            pEl.value = e.target.value;
            themeManager.applyTheme(this.getCustomizerFormValues());
          }
        });
      }
    });

    // 4. Botão Salvar
    const btnSave = this.overlay.querySelector('#btnSaveTheme');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        const values = this.getCustomizerFormValues();
        themeManager.saveTheme(values);
        alert('✅ Identidade visual e configurações salvas com sucesso para todos os usuários!');
      });
    }

    // 5. Botão Restaurar
    const btnReset = this.overlay.querySelector('#btnResetTheme');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm('Deseja restaurar todas as cores, fontes e padrões originais?')) {
          themeManager.resetToDefaults();
          this.renderCustomizer();
          alert('↺ Padrões de fábrica restaurados!');
        }
      });
    }
  }

  getCustomizerFormValues() {
    const selectedFont = this.overlay.querySelector('input[name="adminFontTheme"]:checked')?.value || 'calibri';
    const selectedScale = this.overlay.querySelector('input[name="adminHudScale"]:checked')?.value || 'normal';

    return {
      fontTheme: selectedFont,
      hudScale: selectedScale,
      slot1Color: this.overlay.querySelector('#themeTextSlot1')?.value || '#1e3a8a',
      slot2Color: this.overlay.querySelector('#themeTextSlot2')?.value || '#064e3b',
      slot3Color: this.overlay.querySelector('#themeTextSlot3')?.value || '#581c87',
      slot4Color: this.overlay.querySelector('#themeTextSlot4')?.value || '#78350f',
      topoBg: this.overlay.querySelector('#themeTextTopoBg')?.value || '#e0f2fe',
      topoText: this.overlay.querySelector('#themeTextTopoText')?.value || '#0369a1',
      fundoBg: this.overlay.querySelector('#themeTextFundoBg')?.value || '#ffe4e6',
      fundoText: this.overlay.querySelector('#themeTextFundoText')?.value || '#be123c',
      supportWhatsApp: this.overlay.querySelector('#themeSupportWhats')?.value || '51996069505',
      supportMsg: this.overlay.querySelector('#themeSupportMsg')?.value || 'Olá! Gostaria de suporte/liberação de acesso no Cockpit Precificação Justa Back ao Under.'
    };
  }

  renderCustomizer() {
    const theme = themeManager.getTheme();

    // 1. Tipografia
    const fontRadio = this.overlay.querySelector(`input[name="adminFontTheme"][value="${theme.fontTheme || 'calibri'}"]`);
    if (fontRadio) {
      fontRadio.checked = true;
      this.overlay.querySelectorAll('#themeFontOptions .admin-font-choice-label').forEach(l => l.classList.remove('active'));
      fontRadio.closest('.admin-font-choice-label')?.classList.add('active');
    }

    // 2. Escala
    const scaleRadio = this.overlay.querySelector(`input[name="adminHudScale"][value="${theme.hudScale || 'normal'}"]`);
    if (scaleRadio) {
      scaleRadio.checked = true;
      this.overlay.querySelectorAll('#themeScaleOptions .admin-font-choice-label').forEach(l => l.classList.remove('active'));
      scaleRadio.closest('.admin-font-choice-label')?.classList.add('active');
    }

    // 3. Cores dos Slots
    const setColors = (pickerId, textId, val) => {
      const p = this.overlay.querySelector(`#${pickerId}`);
      const t = this.overlay.querySelector(`#${textId}`);
      if (p) p.value = val;
      if (t) t.value = val;
    };

    setColors('themeColorSlot1', 'themeTextSlot1', theme.slot1Color || DEFAULT_THEME.slot1Color);
    setColors('themeColorSlot2', 'themeTextSlot2', theme.slot2Color || DEFAULT_THEME.slot2Color);
    setColors('themeColorSlot3', 'themeTextSlot3', theme.slot3Color || DEFAULT_THEME.slot3Color);
    setColors('themeColorSlot4', 'themeTextSlot4', theme.slot4Color || DEFAULT_THEME.slot4Color);

    // 4. Cores dos Blocos
    setColors('themeColorTopoBg', 'themeTextTopoBg', theme.topoBg || DEFAULT_THEME.topoBg);
    setColors('themeColorTopoText', 'themeTextTopoText', theme.topoText || DEFAULT_THEME.topoText);
    setColors('themeColorFundoBg', 'themeTextFundoBg', theme.fundoBg || DEFAULT_THEME.fundoBg);
    setColors('themeColorFundoText', 'themeTextFundoText', theme.fundoText || DEFAULT_THEME.fundoText);

    // 5. Suporte
    const whatsInput = this.overlay.querySelector('#themeSupportWhats');
    const msgInput = this.overlay.querySelector('#themeSupportMsg');
    if (whatsInput) whatsInput.value = theme.supportWhatsApp || DEFAULT_THEME.supportWhatsApp;
    if (msgInput) msgInput.value = theme.supportMsg || DEFAULT_THEME.supportMsg;
  }

  renderPending() {
    const tbody = this.overlay.querySelector('#adminPendingTableBody');
    const badge = this.overlay.querySelector('#pendingBadgeCount');
    if (!tbody) return;

    const users = authManager.getUsers();
    const pendingUsers = users.filter(u => u.status === 'pending');

    if (badge) {
      badge.textContent = pendingUsers.length;
      badge.style.display = pendingUsers.length > 0 ? 'inline-block' : 'none';
    }

    if (pendingUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">🎉 Nenhuma solicitação pendente no momento!</td></tr>';
      return;
    }

    tbody.innerHTML = pendingUsers.map(u => {
      const cleanWhats = (u.whatsapp || '').replace(/\D/g, '');
      const whatsFormatted = formatPhoneDisplay(u.whatsapp);
      const whatsUrl = cleanWhats ? `https://wa.me/55${cleanWhats}?text=${encodeURIComponent(`Olá ${u.name}! Seu cadastro no Cockpit Precificação Justa Back ao Under foi aprovado com sucesso! Acesse em: https://bora-group-projects.github.io/Projeto_Back_Under/`)}` : '#';
      const mailtoUrl = `mailto:${u.email}?subject=${encodeURIComponent('Acesso ao Cockpit Precificação Justa Back ao Under')}&body=${encodeURIComponent(`Olá ${u.name},\n\nSeu cadastro no Cockpit Precificação Justa Back ao Under foi aprovado!\n\nAcesse o link: https://bora-group-projects.github.io/Projeto_Back_Under/\nSeu E-mail: ${u.email}\n\nBons trades!`)}`;

      return `
        <tr>
          <td style="font-weight: 700; color: #ffffff;">${u.name}</td>
          <td>
            ${cleanWhats ? `
              <a href="${whatsUrl}" target="_blank" rel="noopener noreferrer" class="admin-contact-link whats-link" title="Clique para abrir no WhatsApp">
                📲 ${whatsFormatted}
              </a>
            ` : '-'}
          </td>
          <td style="color: var(--text-secondary);">${u.city || '-'}</td>
          <td>
            <a href="${mailtoUrl}" class="admin-contact-link email-link" title="Clique para enviar um e-mail">
              ✉️ ${u.email}
            </a>
          </td>
          <td style="color: var(--text-muted);">${new Date(u.createdAt).toLocaleString('pt-BR')}</td>
          <td style="text-align: center; white-space: nowrap;">
            <button class="btn btn-success btn-sm admin-approve-btn" data-user-id="${u.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">
              ✔️ Aprovar
            </button>
            <button class="btn btn-danger btn-sm admin-reject-btn" data-user-id="${u.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; margin-left: 0.2rem;">
              ❌ Recusar
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Binds de aprovação e recusa
    tbody.querySelectorAll('.admin-approve-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-user-id');
        authManager.approveUser(id);
        this.renderPending();
        this.renderUsers();
      });
    });

    tbody.querySelectorAll('.admin-reject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-user-id');
        if (confirm('Deseja recusar e remover esta solicitação?')) {
          authManager.rejectUser(id);
          this.renderPending();
        }
      });
    });
  }

  renderUsers() {
    const tbody = this.overlay.querySelector('#adminUsersTableBody');
    if (!tbody) return;

    const users = authManager.getUsers();
    const approvedUsers = users.filter(u => u.status !== 'pending');

    tbody.innerHTML = approvedUsers.map(u => {
      const isActive = u.status === 'active';
      const isMasterAdmin = u.id === 'usr_admin_1';
      const cleanWhats = (u.whatsapp || '').replace(/\D/g, '');
      const whatsFormatted = formatPhoneDisplay(u.whatsapp);
      const whatsUrl = cleanWhats ? `https://wa.me/55${cleanWhats}?text=${encodeURIComponent(`Olá ${u.name}! Tudo bem?`)}` : '#';
      const mailtoUrl = `mailto:${u.email}?subject=${encodeURIComponent('Suporte Precificação Justa Back ao Under')}`;

      return `
        <tr>
          <td style="font-weight: 700; color: #ffffff;">${u.name}</td>
          <td>
            ${cleanWhats ? `
              <a href="${whatsUrl}" target="_blank" rel="noopener noreferrer" class="admin-contact-link whats-link" title="Clique para abrir no WhatsApp">
                📲 ${whatsFormatted}
              </a>
            ` : '-'}
          </td>
          <td style="color: var(--text-secondary); font-size: 0.7rem;">${u.city || '-'}</td>
          <td>
            <a href="${mailtoUrl}" class="admin-contact-link email-link" title="Clique para enviar um e-mail">
              ✉️ ${u.email}
            </a>
          </td>
          <td><span style="font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${u.role === 'admin' ? 'rgba(234, 179, 8, 0.2); color: #fef08a;' : 'rgba(56, 189, 248, 0.2); color: #bae6fd;'}">${u.role.toUpperCase()}</span></td>
          <td><span style="font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${isActive ? 'rgba(16, 185, 129, 0.2); color: #34d399;' : 'rgba(239, 68, 68, 0.2); color: #f87171;'}">${isActive ? '🟢 ATIVO' : '🔴 BLOQUEADO'}</span></td>
          <td style="color: var(--text-secondary); font-size: 0.7rem;">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('pt-BR') : 'Nunca'}</td>
          <td>
            ${!isMasterAdmin ? `
              <button class="btn btn-secondary btn-sm admin-toggle-user-btn" data-user-id="${u.id}" style="padding: 0.15rem 0.4rem; font-size: 0.65rem;">
                ${isActive ? '🔒 Bloquear' : '🔓 Liberar'}
              </button>
              <button class="btn btn-danger btn-sm admin-delete-user-btn" data-user-id="${u.id}" style="padding: 0.15rem 0.4rem; font-size: 0.65rem; margin-left: 0.2rem;">
                🗑️
              </button>
            ` : '<span style="color: var(--text-muted); font-size: 0.65rem;">Master</span>'}
          </td>
        </tr>
      `;
    }).join('');

    // Binds de ações
    tbody.querySelectorAll('.admin-toggle-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-user-id');
        authManager.toggleUserStatus(id);
        this.renderUsers();
      });
    });

    tbody.querySelectorAll('.admin-delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-user-id');
        if (confirm('Deseja realmente excluir este usuário?')) {
          authManager.deleteUser(id);
          this.renderUsers();
        }
      });
    });
  }

  renderLogs() {
    const tbody = this.overlay.querySelector('#adminLogsTableBody');
    if (!tbody) return;

    const logs = authManager.getAccessLogs();
    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum log registrado ainda.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td style="color: var(--text-muted);">${l.dateFormatted}</td>
        <td style="font-weight: 700; color: #ffffff;">${l.name} <span style="font-size: 0.65rem; color: var(--text-secondary);">(${l.email})</span></td>
        <td style="color: var(--color-cyan); font-family: var(--font-mono);">${l.ip}</td>
        <td style="color: var(--text-secondary); font-size: 0.7rem;">${l.device}</td>
        <td><span style="font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${l.success ? 'rgba(16, 185, 129, 0.2); color: #34d399;' : 'rgba(239, 68, 68, 0.2); color: #f87171;'}">${l.success ? 'AUTORIZADO' : 'NEGADO'}</span></td>
        <td style="color: var(--text-muted); font-size: 0.7rem;">${l.reason || '-'}</td>
      </tr>
    `).join('');
  }

  show() {
    this.renderPending();
    this.renderUsers();
    this.renderCustomizer();
    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

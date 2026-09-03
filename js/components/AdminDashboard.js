/**
 * Painel / Dashboard do Administrador - PRECIFICAÇÃO JUSTA BACK AO UNDER
 * - Gerenciamento de Usuários e Aprovação de Solicitações Pendentes
 * - Atalhos Rápidos para WhatsApp Direto e Envio de E-mail
 * - Monitor de Acessos e Auditoria em Tempo Real
 */
import { authManager } from '../core/authManager.js';

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

          <!-- ABA 3: LOGS DE ACESSO -->
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

          <!-- ABA 4: PLANILHA & FÓRMULAS -->
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
        this.overlay.querySelector('#adminTabLogs').style.display = tab === 'logs' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabSheets').style.display = tab === 'sheets' ? 'block' : 'none';

        if (tab === 'pending') this.renderPending();
        if (tab === 'users') this.renderUsers();
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
      const whatsUrl = cleanWhats ? `https://wa.me/55${cleanWhats}?text=${encodeURIComponent(`Olá ${u.name}! Seu cadastro no Cockpit Precificação Justa Back ao Under foi aprovado com sucesso! Acesse em: https://obadoceria-gif.github.io/Projeto_Back_Under/`)}` : '#';
      const mailtoUrl = `mailto:${u.email}?subject=${encodeURIComponent('Acesso ao Cockpit Precificação Justa Back ao Under')}&body=${encodeURIComponent(`Olá ${u.name},\n\nSeu cadastro no Cockpit Precificação Justa Back ao Under foi aprovado!\n\nAcesse o link: https://obadoceria-gif.github.io/Projeto_Back_Under/\nSeu E-mail: ${u.email}\n\nBons trades!`)}`;

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
    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

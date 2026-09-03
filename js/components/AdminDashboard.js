/**
 * Painel / Dashboard do Administrador
 * - Gerenciamento de Usuários (Criar, Bloquear, Excluir)
 * - Monitor de Acessos e Auditoria em Tempo Real
 * - Links e Tabelas Mestre
 */
import { authManager } from '../core/authManager.js';

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
      <div class="modal-content" style="max-width: 960px; max-height: 90vh;">
        <div class="modal-header" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.3rem;">👑</span>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #ffffff; margin: 0;">PAINEL DO ADMINISTRADOR</h3>
              <p style="font-size: 0.7rem; color: #93c5fd; margin: 0;">Controle de Usuários, Acessos em Tempo Real e Planilha Mestre</p>
            </div>
          </div>
          <button id="closeAdminModalBtn" class="modal-close-btn">&times;</button>
        </div>

        <!-- Abas do Painel -->
        <div class="admin-tabs-bar">
          <button class="admin-tab-btn active" data-admin-tab="users">👥 Usuários & Assinantes</button>
          <button class="admin-tab-btn" data-admin-tab="logs">📍 Monitor de Acessos</button>
          <button class="admin-tab-btn" data-admin-tab="sheets">📊 Planilha & Fórmulas</button>
        </div>

        <div class="modal-body" style="padding: 1rem;">
          
          <!-- ABA 1: USUÁRIOS -->
          <div id="adminTabUsers" class="admin-tab-content active">
            
            <!-- Formulário Novo Usuário -->
            <div class="admin-create-user-box">
              <h4 style="font-size: 0.8rem; font-weight: 800; color: #fef08a; margin: 0 0 0.5rem 0;">➕ Cadastrar Novo Usuário / Assinante:</h4>
              <form id="adminCreateUserForm" style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <input type="text" id="newUserName" placeholder="Nome Completo" required class="select-control" style="flex: 1; min-width: 130px; font-size: 0.8rem;">
                <input type="email" id="newUserEmail" placeholder="e-mail@exemplo.com" required class="select-control" style="flex: 1; min-width: 150px; font-size: 0.8rem;">
                <input type="password" id="newUserPassword" placeholder="Senha" required class="select-control" style="width: 100px; font-size: 0.8rem;">
                <select id="newUserRole" class="select-control" style="width: 100px; font-size: 0.8rem;">
                  <option value="user">Trader</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" class="btn btn-success btn-sm">Criar Acesso</button>
              </form>
            </div>

            <!-- Tabela de Usuários -->
            <div style="margin-top: 1rem; overflow-x: auto;">
              <table class="pendulo-table" style="font-size: 0.75rem;">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Papel</th>
                    <th>Status</th>
                    <th>Último Acesso</th>
                    <th>Dispositivo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody id="adminUsersTableBody"></tbody>
              </table>
            </div>

          </div>

          <!-- ABA 2: LOGS DE ACESSO -->
          <div id="adminTabLogs" class="admin-tab-content" style="display: none;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span style="font-size: 0.8rem; font-weight: 800; color: #ffffff;">📍 Registro de Tentativas e Acessos Recentes:</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">Atualizado a cada login</span>
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

          <!-- ABA 3: PLANILHA & FÓRMULAS -->
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

        this.overlay.querySelector('#adminTabUsers').style.display = tab === 'users' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabLogs').style.display = tab === 'logs' ? 'block' : 'none';
        this.overlay.querySelector('#adminTabSheets').style.display = tab === 'sheets' ? 'block' : 'none';

        if (tab === 'users') this.renderUsers();
        if (tab === 'logs') this.renderLogs();
      });
    });

    // Form Criar Usuário
    const form = this.overlay.querySelector('#adminCreateUserForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = this.overlay.querySelector('#newUserName').value;
      const email = this.overlay.querySelector('#newUserEmail').value;
      const pass = this.overlay.querySelector('#newUserPassword').value;
      const role = this.overlay.querySelector('#newUserRole').value;

      const res = authManager.createUser({ name, email, password: pass, role });
      if (res.success) {
        form.reset();
        this.renderUsers();
      } else {
        alert(res.message);
      }
    });
  }

  renderUsers() {
    const tbody = this.overlay.querySelector('#adminUsersTableBody');
    if (!tbody) return;

    const users = authManager.getUsers();
    tbody.innerHTML = users.map(u => {
      const isActive = u.status === 'active';
      const isMasterAdmin = u.id === 'usr_admin_1';
      return `
        <tr>
          <td style="font-weight: 700; color: #ffffff;">${u.name}</td>
          <td style="color: var(--color-cyan);">${u.email}</td>
          <td><span style="font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${u.role === 'admin' ? 'rgba(234, 179, 8, 0.2); color: #fef08a;' : 'rgba(56, 189, 248, 0.2); color: #bae6fd;'}">${u.role.toUpperCase()}</span></td>
          <td><span style="font-size: 0.65rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 3px; background: ${isActive ? 'rgba(16, 185, 129, 0.2); color: #34d399;' : 'rgba(239, 68, 68, 0.2); color: #f87171;'}">${isActive ? '🟢 ATIVO' : '🔴 BLOQUEADO'}</span></td>
          <td style="color: var(--text-secondary);">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('pt-BR') : 'Nunca'}</td>
          <td style="color: var(--text-muted); font-size: 0.7rem;">${u.lastDevice || '-'}</td>
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
    this.renderUsers();
    this.overlay.classList.add('open');
  }

  hide() {
    this.overlay.classList.remove('open');
  }
}

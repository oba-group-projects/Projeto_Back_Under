/**
 * Gerenciador de Sessão e Perfis de Usuário — Modo sem Autenticação
 *
 * NOTA: Este módulo opera sem senha nem aprovação. Todos os cadastros são
 * aceitos automaticamente e salvos no localStorage. Autenticação segura
 * (bcrypt, JWT, backend) será adicionada em versão futura quando houver
 * infraestrutura de servidor.
 */

const USERS_STORAGE_KEY = 'projeto_back_under_users_v2';
const SESSION_STORAGE_KEY = 'projeto_back_under_session_v2';
const LOGS_STORAGE_KEY = 'projeto_back_under_access_logs_v2';

export class AuthManager {
  constructor() {
    this.initDefaultUsers();
  }

  // ── Inicialização ──────────────────────────────────────────────────────────

  initDefaultUsers() {
    let users = [];
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        users = JSON.parse(saved);
      } catch (_e) {
        users = [];
      }
    }

    // Garante usuário admin padrão sem senha
    let admin = users.find((u) => u.id === 'usr_admin_1' || u.role === 'admin');
    if (!admin) {
      admin = {
        id: 'usr_admin_1',
        name: 'Administrador',
        email: 'admin@backunder.pro',
        whatsapp: '',
        city: '',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      users.unshift(admin);
    } else {
      // Migra registros antigos: garante que não há campo password
      delete admin.password;
      admin.status = 'active';
    }

    // Migra usuários antigos: remove campos de senha e pending
    users = users.map((u) => {
      const { password: _pw, ...rest } = u;
      // Usuários que estavam pendentes agora ficam ativos automaticamente
      if (rest.status === 'pending') rest.status = 'active';
      return rest;
    });

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  // ── Persistência ──────────────────────────────────────────────────────────

  getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_e) {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  // ── Logs de Acesso ────────────────────────────────────────────────────────

  getAccessLogs() {
    try {
      const data = localStorage.getItem(LOGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (_e) {
      return [];
    }
  }

  addAccessLog(user, success = true, reason = '') {
    const logs = this.getAccessLogs();
    const device =
      typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile')
        ? 'Mobile (Smartphone)'
        : 'Desktop (Computador)';
    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pt-BR'),
      email: user ? user.email : 'desconhecido',
      name: user ? user.name : 'Anônimo',
      role: user ? user.role : '-',
      device,
      success,
      reason,
    };

    logs.unshift(newLog);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  }

  // ── Identificação (substitui login com senha) ─────────────────────────────

  /**
   * Identifica o usuário pelo e-mail sem exigir senha.
   * Se o usuário não existir, cria um novo perfil automaticamente.
   */
  identify(email, name = '') {
    const users = this.getUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, message: 'Informe um e-mail para continuar.' };
    }

    let user = users.find((u) => u.email && u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      // Cria perfil novo automaticamente — sem senha, sem aprovação
      user = {
        id: 'usr_' + Date.now(),
        name: (name || '').trim() || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        whatsapp: '',
        city: '',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      users.push(user);
      this.saveUsers(users);
      this.addAccessLog(user, true, 'Perfil criado automaticamente');
    }

    if (user.status === 'blocked') {
      return {
        success: false,
        message: 'Este acesso está bloqueado. Entre em contato com o administrador.',
      };
    }

    // Atualiza último acesso
    user.lastLogin = new Date().toISOString();
    this.saveUsers(this.getUsers().map((u) => (u.id === user.id ? user : u)));

    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp || '',
      city: user.city || '',
      loginAt: new Date().toISOString(),
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.addAccessLog(user, true, 'Acesso identificado');

    return { success: true, user: session };
  }

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  // ── Sessão ────────────────────────────────────────────────────────────────

  getCurrentSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (_e) {
      return null;
    }
  }

  getCurrentUser() {
    const session = this.getCurrentSession();
    if (!session) return null;
    const users = this.getUsers();
    return users.find((u) => u.id === session.userId) || null;
  }

  /**
   * Sempre retorna true no modo sem autenticação.
   * A ferramenta é acessível sem credenciais.
   */
  isAuthenticated() {
    return true;
  }

  isAdmin() {
    const session = this.getCurrentSession();
    return session ? session.role === 'admin' : false;
  }

  getAdminContact() {
    const users = this.getUsers();
    const admin = users.find((u) => u.id === 'usr_admin_1' || u.role === 'admin') || {
      name: 'Administrador',
      email: 'admin@backunder.pro',
      whatsapp: '',
    };
    const cleanWhats = (admin.whatsapp || '').replace(/\D/g, '');
    return {
      name: admin.name || 'Administrador',
      email: admin.email || 'admin@backunder.pro',
      whatsapp: admin.whatsapp || '',
      whatsappClean: cleanWhats,
      city: admin.city || '',
    };
  }

  // ── Perfil ────────────────────────────────────────────────────────────────

  /**
   * Atualiza o perfil do usuário logado (sem validação de senha).
   */
  updateProfile(userId, { name, whatsapp, city, email }) {
    const users = this.getUsers();
    let user = users.find((u) => u.id === userId);

    if (!user && this.isAdmin()) {
      user = users.find((u) => u.id === 'usr_admin_1' || u.role === 'admin');
    }
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const normalizedEmail = (email || '').trim().toLowerCase();

    const emailInUse = users.some(
      (u) => u.id !== user.id && u.email && u.email.toLowerCase() === normalizedEmail
    );
    if (emailInUse) {
      return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
    }

    user.name = (name || '').trim();
    user.whatsapp = (whatsapp || '').trim();
    user.city = (city || '').trim();
    user.email = normalizedEmail;

    this.saveUsers(users);

    // Atualiza sessão ativa
    const session = this.getCurrentSession();
    if (session) {
      Object.assign(session, {
        name: user.name,
        email: user.email,
        whatsapp: user.whatsapp,
        city: user.city,
      });
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    this.addAccessLog(user, true, 'Perfil atualizado');
    return { success: true, user };
  }

  // ── Cadastro / Gestão ─────────────────────────────────────────────────────

  /**
   * Cadastro público sem senha — usuário fica ativo imediatamente.
   */
  requestRegistration({ name, whatsapp, city, email }) {
    const users = this.getUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, message: 'Informe um e-mail válido.' };
    }

    if (users.some((u) => u.email && u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'Já existe um cadastro com este e-mail.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: (name || '').trim(),
      whatsapp: (whatsapp || '').trim(),
      city: (city || '').trim(),
      email: normalizedEmail,
      role: 'user',
      status: 'active', // ativo direto — sem aprovação pendente
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    users.push(newUser);
    this.saveUsers(users);
    this.addAccessLog(newUser, true, 'Cadastro realizado');
    return { success: true, user: newUser };
  }

  /**
   * Criação direta pelo Administrador.
   */
  createUser({ name, email, whatsapp = '', city = '', role = 'user' }) {
    const users = this.getUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      return { success: false, message: 'Informe um e-mail válido.' };
    }

    if (users.some((u) => u.email && u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'Já existe um usuário com este e-mail.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: (name || '').trim(),
      whatsapp: (whatsapp || '').trim(),
      city: (city || '').trim(),
      email: normalizedEmail,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  }

  toggleUserStatus(userId) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user || (user.role === 'admin' && user.id === 'usr_admin_1')) return false;

    user.status = user.status === 'active' ? 'blocked' : 'active';
    this.saveUsers(users);
    return true;
  }

  deleteUser(userId) {
    let users = this.getUsers();
    const target = users.find((u) => u.id === userId);
    if (!target || (target.role === 'admin' && target.id === 'usr_admin_1')) return false;

    users = users.filter((u) => u.id !== userId);
    this.saveUsers(users);
    return true;
  }

  getPendingUsersCount() {
    // Sem aprovação pendente no modo sem autenticação — sempre zero
    return 0;
  }
}

export const authManager = new AuthManager();

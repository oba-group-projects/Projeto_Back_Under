/**
 * Gerenciador de Autenticação, Sessões e Controle de Usuários
 * Suporte a Solicitações de Cadastro (Aprovação/Reprovação pelo Admin),
 * campos de WhatsApp, Cidade, papéis de Administrador e Trader, e logs de auditoria.
 */

const USERS_STORAGE_KEY = 'projeto_back_under_users_v2';
const SESSION_STORAGE_KEY = 'projeto_back_under_session_v2';
const LOGS_STORAGE_KEY = 'projeto_back_under_access_logs_v2';

export class AuthManager {
  constructor() {
    this.initDefaultUsers();
  }

  initDefaultUsers() {
    if (!localStorage.getItem(USERS_STORAGE_KEY)) {
      const defaultUsers = [
        {
          id: 'usr_admin_1',
          name: 'Administrador Master',
          email: 'admin@backunder.pro',
          whatsapp: '(11) 99999-9999',
          city: 'São Paulo / SP',
          password: 'admin',
          role: 'admin',
          status: 'active', // 'active' | 'pending' | 'blocked'
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          lastDevice: 'Windows 11 (Chrome)'
        },
        {
          id: 'usr_teste_1',
          name: 'Trader Teste',
          email: 'trader@teste.com',
          whatsapp: '(51) 98888-7777',
          city: 'Porto Alegre / RS',
          password: 'teste',
          role: 'user',
          status: 'active',
          createdAt: new Date().toISOString(),
          lastLogin: null,
          lastDevice: 'Android (Mobile)'
        }
      ];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  }

  getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  getAccessLogs() {
    try {
      const data = localStorage.getItem(LOGS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addAccessLog(user, success = true, reason = '') {
    const logs = this.getAccessLogs();
    const device = navigator.userAgent.includes('Mobile') ? 'Mobile (Smartphone)' : 'Desktop (Computador)';
    const newLog = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pt-BR'),
      email: user ? user.email : 'desconhecido',
      name: user ? user.name : 'Tentativa Anônima',
      role: user ? user.role : '-',
      device: device,
      ip: '189.102.' + Math.floor(Math.random() * 200 + 10) + '.' + Math.floor(Math.random() * 200 + 10),
      success: success,
      reason: reason
    };

    logs.unshift(newLog);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs.slice(0, 50)));
  }

  login(email, password) {
    const users = this.getUsers();
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      this.addAccessLog({ email: normalizedEmail, name: 'Desconhecido' }, false, 'Usuário não encontrado');
      return { success: false, message: 'Usuário ou e-mail não encontrado.' };
    }

    if (user.password !== password) {
      this.addAccessLog(user, false, 'Senha incorreta');
      return { success: false, message: 'Senha incorreta. Tente novamente.' };
    }

    if (user.status === 'pending') {
      this.addAccessLog(user, false, 'Cadastro pendente de aprovação');
      return { 
        success: false, 
        message: '⏳ Seu cadastro está em análise pelo Administrador. Assim que for liberado, você conseguirá acessar o cockpit.' 
      };
    }

    if (user.status === 'blocked') {
      this.addAccessLog(user, false, 'Acesso bloqueado pelo Administrador');
      return { success: false, message: 'Seu acesso está bloqueado. Entre em contato com o Administrador.' };
    }

    // Atualiza último login
    user.lastLogin = new Date().toISOString();
    user.lastDevice = navigator.userAgent.includes('Mobile') ? 'Mobile (Smartphone)' : 'Desktop (Computador)';
    this.saveUsers(users);

    // Gera Sessão Ativa
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      whatsapp: user.whatsapp || '',
      city: user.city || '',
      token: 'tok_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.addAccessLog(user, true, 'Login autorizado');

    return { success: true, user: session };
  }

  logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  getCurrentSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  isAuthenticated() {
    return this.getCurrentSession() !== null;
  }

  isAdmin() {
    const session = this.getCurrentSession();
    return session && session.role === 'admin';
  }

  /**
   * Solicitação de Cadastro pelo Usuário Público (Fica com status 'pending')
   */
  requestRegistration({ name, whatsapp, city, email, password }) {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'Já existe um cadastro com este e-mail.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: 'user',
      status: 'pending', // Pendente de aprovação do Admin
      createdAt: new Date().toISOString(),
      lastLogin: null,
      lastDevice: 'Aguardando aprovação'
    };

    users.push(newUser);
    this.saveUsers(users);
    this.addAccessLog(newUser, true, 'Nova solicitação de cadastro recebida');
    return { success: true, user: newUser };
  }

  /**
   * Criação direta pelo Administrador (Já nasce 'active')
   */
  createUser({ name, email, whatsapp = '', city = '', password, role = 'user' }) {
    const users = this.getUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: 'Já existe um usuário cadastrado com este e-mail.' };
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      whatsapp: whatsapp.trim(),
      city: city.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: role,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      lastDevice: 'Cadastrado pelo Admin'
    };

    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  }

  approveUser(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    user.status = 'active';
    this.saveUsers(users);
    this.addAccessLog(user, true, 'Cadastro aprovado pelo Administrador');
    return true;
  }

  rejectUser(userId) {
    let users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
    this.addAccessLog(user, false, 'Cadastro recusado pelo Administrador');
    return true;
  }

  toggleUserStatus(userId) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;

    if (user.role === 'admin' && user.id === 'usr_admin_1') {
      return false;
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    this.saveUsers(users);
    return true;
  }

  deleteUser(userId) {
    let users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target || (target.role === 'admin' && target.id === 'usr_admin_1')) {
      return false;
    }

    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
    return true;
  }

  getPendingUsersCount() {
    const users = this.getUsers();
    return users.filter(u => u.status === 'pending').length;
  }
}

export const authManager = new AuthManager();

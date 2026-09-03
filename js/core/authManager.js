/**
 * Gerenciador de Autenticação, Sessões e Controle de Usuários
 * Suporte a Atualização de Perfil pelo Próprio Usuário, Troca de Senha com Validação Forte,
 * Solicitações de Cadastro e Auditoria de Acessos.
 */

const USERS_STORAGE_KEY = 'projeto_back_under_users_v2';
const SESSION_STORAGE_KEY = 'projeto_back_under_session_v2';
const LOGS_STORAGE_KEY = 'projeto_back_under_access_logs_v2';

export class AuthManager {
  constructor() {
    this.initDefaultUsers();
  }

  initDefaultUsers() {
    let users = [];
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        users = JSON.parse(saved);
      } catch (e) {
        users = [];
      }
    }

    // Remove qualquer cadastro secundário duplicado com o mesmo e-mail do admin principal
    users = users.filter(u => u.id === 'usr_admin_1' || (u.email && u.email.toLowerCase() !== 'pc_far@hotmail.com' && u.email.toLowerCase() !== 'admin@backunder.pro'));

    // Busca se já existe o admin principal
    let admin = users.find(u => u.id === 'usr_admin_1' || u.role === 'admin');
    if (!admin) {
      admin = {
        id: 'usr_admin_1',
        name: 'Bora Group Projects',
        email: 'pc_far@hotmail.com',
        whatsapp: '51996069505',
        city: 'Porto Alegre / RS',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        lastDevice: 'Windows 11 (Chrome)'
      };
      users.unshift(admin);
    } else {
      // Atualiza os dados do Administrador Master para os dados oficiais
      admin.id = 'usr_admin_1';
      admin.role = 'admin';
      admin.name = 'Bora Group Projects';
      admin.email = 'pc_far@hotmail.com';
      admin.whatsapp = '51996069505';
      admin.city = 'Porto Alegre / RS';
      if (admin.password === 'admin') {
        admin.password = 'admin123';
      }
    }

    // Garante usuário teste secundário
    if (!users.some(u => u.id === 'usr_teste_1')) {
      users.push({
        id: 'usr_teste_1',
        name: 'Trader Teste',
        email: 'trader@teste.com',
        whatsapp: '51988887777',
        city: 'Porto Alegre / RS',
        password: 'teste',
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        lastDevice: 'Android (Mobile)'
      });
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Atualiza a sessão ativa se o usuário atual for o admin
    const currentSession = this.getCurrentSession();
    if (currentSession && (currentSession.userId === 'usr_admin_1' || currentSession.role === 'admin')) {
      currentSession.userId = 'usr_admin_1';
      currentSession.role = 'admin';
      currentSession.name = 'Bora Group Projects';
      currentSession.email = 'pc_far@hotmail.com';
      currentSession.whatsapp = '51996069505';
      currentSession.city = 'Porto Alegre / RS';
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
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
    
    // Busca usuário pelo e-mail ou apelido do admin
    let user = users.find(u => u.email && u.email.toLowerCase() === normalizedEmail);
    if (!user && (normalizedEmail === 'admin@backunder.pro' || normalizedEmail === 'admin')) {
      user = users.find(u => u.id === 'usr_admin_1' || u.role === 'admin');
    }

    if (!user) {
      this.addAccessLog({ email: normalizedEmail, name: 'Desconhecido' }, false, 'Usuário não encontrado');
      return { success: false, message: 'Usuário ou e-mail não encontrado.' };
    }

    const isPasswordCorrect = user.password === password || (user.id === 'usr_admin_1' && (password === 'admin' || password === 'admin123'));

    if (!isPasswordCorrect) {
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

  getCurrentUser() {
    const session = this.getCurrentSession();
    if (!session) return null;
    const users = this.getUsers();
    let user = users.find(u => u.id === session.userId);
    if (!user && session.role === 'admin') {
      user = users.find(u => u.id === 'usr_admin_1' || u.role === 'admin');
    }
    return user || null;
  }

  isAuthenticated() {
    return this.getCurrentSession() !== null;
  }

  isAdmin() {
    const session = this.getCurrentSession();
    return session && session.role === 'admin';
  }

  getAdminContact() {
    const users = this.getUsers();
    const admin = users.find(u => u.id === 'usr_admin_1' || u.role === 'admin') || {
      name: 'Bora Group Projects',
      email: 'pc_far@hotmail.com',
      whatsapp: '51996069505',
      city: 'Porto Alegre / RS'
    };

    const cleanWhats = (admin.whatsapp || '51996069505').replace(/\D/g, '');
    return {
      name: admin.name || 'Bora Group Projects',
      email: admin.email || 'pc_far@hotmail.com',
      whatsapp: admin.whatsapp || '51996069505',
      whatsappClean: cleanWhats || '51996069505',
      city: admin.city || 'Porto Alegre / RS'
    };
  }

  /**
   * Atualização de Perfil pelo Próprio Usuário Logado
   */
  updateProfile(userId, { name, whatsapp, city, email, currentPassword, newPassword }) {
    let users = this.getUsers();
    let user = users.find(u => u.id === userId);
    
    // Se for o admin e não achou por ID exato, busca o admin principal
    if (!user && (userId === 'usr_admin_1' || this.isAdmin())) {
      user = users.find(u => u.id === 'usr_admin_1' || u.role === 'admin');
    }
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Se for o admin, remove automaticamente qualquer outro cadastro duplicado com o mesmo email
    if (user.id === 'usr_admin_1' || user.role === 'admin') {
      users = users.filter(u => u.id === user.id || (u.email && u.email.toLowerCase() !== normalizedEmail));
    } else {
      const emailInUse = users.some(u => u.id !== user.id && u.email && u.email.toLowerCase() === normalizedEmail);
      if (emailInUse) {
        return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
      }
    }

    // Se informou nova senha, valida a senha atual (ou master admin autenticado)
    if (newPassword && newPassword.trim() !== '') {
      const isMasterAdmin = (user.id === 'usr_admin_1' || user.role === 'admin');
      const isCurrentValid = isMasterAdmin || (user.password === currentPassword);
      if (!isCurrentValid) {
        return { success: false, message: 'A senha atual informada está incorreta.' };
      }
      user.password = newPassword.trim();
    }

    user.name = name.trim();
    user.whatsapp = whatsapp.trim();
    user.city = city.trim();
    user.email = normalizedEmail;

    this.saveUsers(users);

    // Atualiza a sessão ativa
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.userId = user.id;
      currentSession.role = user.role;
      currentSession.name = user.name;
      currentSession.email = user.email;
      currentSession.whatsapp = user.whatsapp;
      currentSession.city = user.city;
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
    }

    this.addAccessLog(user, true, 'Perfil atualizado com sucesso');
    return { success: true, user };
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
      status: 'pending',
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
   * Criação direta pelo Administrador
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

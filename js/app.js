/**
 * Controlador Principal da Aplicação - PRECIFICAÇÃO JUSTA BACK AO UNDER
 * - Autenticação e Perfis (Administrador Master e Trader)
 * - Dashboard do Administrador e Modal de Meu Perfil (Edição e Senha Forte)
 * - Gestão dos Slots 1 a 4 com Layouts Centralizados (1, 2, 3 e 4 Jogos)
 */
import { GameSlot } from './components/GameSlot.js';
import { PenduloModal } from './components/PenduloModal.js';
import { LoginModal } from './components/LoginModal.js';
import { AdminDashboard } from './components/AdminDashboard.js';
import { UserProfileModal } from './components/UserProfileModal.js';
import { authManager } from './core/authManager.js';

class App {
  constructor() {
    this.masterRed = 200;
    this.viewMode = 'view-4'; // 'view-1' | 'view-2' | 'view-3' | 'view-4'
    this.fontTheme = 'calibri'; // 'calibri' | 'outfit' | 'jakarta' | 'rajdhani' | 'inter'
    this.slots = [];
    this.penduloModal = null;
    this.loginModal = null;
    this.adminDashboard = null;
    this.userProfileModal = null;

    this.init();
  }

  init() {
    this.loadSettings();
    this.applyFontTheme(this.fontTheme);
    this.initAuth();
    this.initSlots();
    this.initPenduloModal();
    this.initAdminDashboard();
    this.initUserProfileModal();
    this.bindHeaderEvents();
    this.updateUserUI();
  }

  applyFontTheme(theme) {
    this.fontTheme = theme || 'calibri';
    document.body.classList.remove('font-theme-calibri', 'font-theme-outfit', 'font-theme-jakarta', 'font-theme-rajdhani', 'font-theme-inter');
    document.body.classList.add(`font-theme-${this.fontTheme}`);
    
    const fontSelect = document.getElementById('fontThemeSelect');
    if (fontSelect && fontSelect.value !== this.fontTheme) {
      fontSelect.value = this.fontTheme;
    }
  }

  initAuth() {
    this.loginModal = new LoginModal((user) => {
      this.updateUserUI();
      this.showToast(`Bem-vindo, ${user.name}!`);
    });

    // Se não estiver autenticado, exibe a tela de login
    if (!authManager.isAuthenticated()) {
      this.loginModal.show();
    }
  }

  initAdminDashboard() {
    this.adminDashboard = new AdminDashboard(() => {
      this.updateUserUI();
    });
  }

  initUserProfileModal() {
    this.userProfileModal = new UserProfileModal((updatedUser) => {
      this.updateUserUI();
      this.showToast('Dados salvos com sucesso!');
    });
  }

  updateUserUI() {
    const session = authManager.getCurrentSession();
    const userArea = document.getElementById('userHeaderArea');
    const nameDisplay = document.getElementById('userNameDisplay');
    const roleIcon = document.getElementById('userRoleIcon');
    const adminBtn = document.getElementById('adminDashboardBtn');

    if (session) {
      if (userArea) userArea.style.display = 'flex';
      if (nameDisplay) nameDisplay.textContent = session.name;
      if (roleIcon) roleIcon.textContent = session.role === 'admin' ? '👑' : '👤';

      if (adminBtn) {
        adminBtn.style.display = session.role === 'admin' ? 'inline-flex' : 'none';
      }
    } else {
      if (userArea) userArea.style.display = 'none';
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('projeto_back_under_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.masterRed) this.masterRed = parsed.masterRed;
        if (parsed.viewMode) this.viewMode = parsed.viewMode;
        if (parsed.fontTheme) this.fontTheme = parsed.fontTheme;
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações salvas:', e);
    }
  }

  saveSettings() {
    try {
      const data = {
        masterRed: this.masterRed,
        viewMode: this.viewMode,
        fontTheme: this.fontTheme
      };
      localStorage.setItem('projeto_back_under_settings', JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar configurações:', e);
    }
  }

  initSlots() {
    const slotContainers = [
      document.getElementById('slotCard1'),
      document.getElementById('slotCard2'),
      document.getElementById('slotCard3'),
      document.getElementById('slotCard4')
    ];

    slotContainers.forEach((container, index) => {
      if (container) {
        const slot = new GameSlot(index + 1, container, {
          getMasterRed: () => this.masterRed,
          onTradeCompleted: (tradeData) => this.handleTradeCompleted(tradeData),
          onOpenPendulos: (slotId) => this.openPenduloModalForSlot(slotId)
        });
        this.slots.push(slot);
      }
    });
  }

  bindHeaderEvents() {
    // Clique no Badge de Perfil abre o Modal de Edição / Troca de Senha
    const profileBadge = document.getElementById('userProfileBadge');
    if (profileBadge) {
      profileBadge.addEventListener('click', () => {
        if (this.userProfileModal) this.userProfileModal.show();
      });
    }

    // Botão Abrir Painel Admin
    const adminBtn = document.getElementById('adminDashboardBtn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        if (authManager.isAdmin() && this.adminDashboard) {
          this.adminDashboard.show();
        }
      });
    }

    // Botão Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authManager.logout();
        this.updateUserUI();
        if (this.loginModal) this.loginModal.show();
      });
    }

    // Seletor de estilo da fonte
    const fontSelect = document.getElementById('fontThemeSelect');
    if (fontSelect) {
      fontSelect.value = this.fontTheme;
      fontSelect.addEventListener('change', (e) => {
        this.applyFontTheme(e.target.value);
        this.saveSettings();
        this.showToast(`Fonte alterada para ${e.target.options[e.target.selectedIndex].text}`);
      });
    }

    // Seletor de visualização (1, 2, 3, 4 jogos)
    const viewButtons = document.querySelectorAll('.view-toggle-btn');
    const gamesGrid = document.getElementById('gamesGrid');

    viewButtons.forEach(btn => {
      const mode = btn.getAttribute('data-view');
      if (mode === this.viewMode) {
        btn.classList.add('active');
        if (gamesGrid) gamesGrid.className = `games-grid ${mode}`;
      } else {
        btn.classList.remove('active');
      }

      btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.viewMode = mode;
        if (gamesGrid) gamesGrid.className = `games-grid ${mode}`;
        this.saveSettings();
      });
    });
  }

  initPenduloModal() {
    this.penduloModal = new PenduloModal((selectedOdd365, targetSlotId) => {
      if (targetSlotId && this.slots[targetSlotId - 1]) {
        this.slots[targetSlotId - 1].setOdd365(selectedOdd365);
        this.showToast(`Pêndulo (365: ${selectedOdd365.toFixed(2)}) aplicado ao Slot #${targetSlotId}`);
      }
    });
  }

  openPenduloModalForSlot(slotId) {
    if (this.penduloModal) {
      this.penduloModal.open(slotId);
    }
  }

  handleTradeCompleted(tradeData) {
    this.showToast(`Operação concluída no ${tradeData.gameName}!`);
  }

  showToast(message) {
    const existing = document.querySelector('.app-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.85rem;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    `;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Inicializa a aplicação ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

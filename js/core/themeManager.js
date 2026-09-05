/**
 * Gerenciador Central de Temas, Cores e Identidade Visual (ThemeManager)
 * - Controlado exclusivamente pelo Administrador Master
 * - Ambientes: Escuro (OLED), Neutro (Slate/Bloomberg) e Claro (Planilha Pro)
 * - Efeitos de Glow / Brilho Neon
 * - Aplicação em tempo real no DOM (:root e classes dinâmicas)
 * - Persistência no LocalStorage com suporte a restauração padrão
 */

const THEME_STORAGE_KEY = 'projeto_back_under_theme_config_v2';

export const DEFAULT_THEME = {
  // 1. Ambiente Global de Contraste
  colorTheme: 'dark',   // 'dark' (OLED) | 'slate' (Neutro / Bloomberg) | 'light' (Claro / Planilha Pro)
  glowFx: true,         // true (Neon Glow Ativo) | false (Minimalista Sem Brilho)

  // 2. Tipografia & Escala
  fontTheme: 'calibri', // 'calibri' | 'outfit' | 'jakarta' | 'rajdhani' | 'inter'
  hudScale: 'normal',   // 'compact' (93%) | 'normal' (100%) | 'large' (107%)
  
  // 3. Cores dos Headers dos 4 Slots
  slot1Color: '#1e3a8a', // Azul Índigo
  slot2Color: '#064e3b', // Verde Esmeralda
  slot3Color: '#581c87', // Roxo Violeta
  slot4Color: '#78350f', // Âmbar Laranja

  // 4. Cores dos Blocos 1 e 2 (Topo & Fundo)
  topoBg: '#e0f2fe',
  topoText: '#0369a1',
  fundoBg: '#ffe4e6',
  fundoText: '#be123c',

  // 5. Configurações de Suporte e Contato
  supportWhatsApp: '51996069505',
  supportMsg: 'Olá! Gostaria de suporte/liberação de acesso no Cockpit Precificação Justa Back ao Under.'
};

export class ThemeManager {
  constructor() {
    this.currentTheme = { ...DEFAULT_THEME };
    this.init();
  }

  init() {
    this.loadTheme();
    this.applyTheme(this.currentTheme);
  }

  getTheme() {
    return { ...this.currentTheme };
  }

  loadTheme() {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentTheme = { ...DEFAULT_THEME, ...parsed };
      } else {
        this.currentTheme = { ...DEFAULT_THEME };
      }
    } catch (e) {
      console.warn('Erro ao carregar tema:', e);
      this.currentTheme = { ...DEFAULT_THEME };
    }
  }

  saveTheme(themeUpdates) {
    this.currentTheme = { ...this.currentTheme, ...themeUpdates };
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(this.currentTheme));
    } catch (e) {
      console.warn('Erro ao salvar tema:', e);
    }
    this.applyTheme(this.currentTheme);
  }

  resetToDefaults() {
    this.currentTheme = { ...DEFAULT_THEME };
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(this.currentTheme));
    } catch (e) {
      console.warn('Erro ao resetar tema:', e);
    }
    this.applyTheme(this.currentTheme);
    return this.getTheme();
  }

  applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;

    // 1. Ambiente Global (Dark / Slate / Light)
    body.classList.remove('theme-dark', 'theme-slate', 'theme-light');
    body.classList.add(`theme-${theme.colorTheme || 'dark'}`);

    // 2. Efeitos Neon / Glow
    if (theme.glowFx === false) {
      body.classList.add('glow-fx-off');
    } else {
      body.classList.remove('glow-fx-off');
    }

    // 3. Tipografia
    body.classList.remove('font-theme-calibri', 'font-theme-outfit', 'font-theme-jakarta', 'font-theme-rajdhani', 'font-theme-inter');
    body.classList.add(`font-theme-${theme.fontTheme || 'calibri'}`);

    // 4. Escala / Zoom do HUD
    let scaleZoom = '1';
    if (theme.hudScale === 'compact') scaleZoom = '0.93';
    else if (theme.hudScale === 'large') scaleZoom = '1.07';
    root.style.setProperty('--hud-scale-zoom', scaleZoom);

    // 5. Cores dos Headers dos Slots
    const makeGradient = (hex) => `linear-gradient(135deg, ${hex}e6 0%, rgba(15, 23, 42, 0.95) 100%)`;
    root.style.setProperty('--slot1-header-bg', makeGradient(theme.slot1Color || DEFAULT_THEME.slot1Color));
    root.style.setProperty('--slot2-header-bg', makeGradient(theme.slot2Color || DEFAULT_THEME.slot2Color));
    root.style.setProperty('--slot3-header-bg', makeGradient(theme.slot3Color || DEFAULT_THEME.slot3Color));
    root.style.setProperty('--slot4-header-bg', makeGradient(theme.slot4Color || DEFAULT_THEME.slot4Color));

    // 6. Cores dos Blocos Topo e Fundo
    root.style.setProperty('--color-topo-bg', theme.topoBg || DEFAULT_THEME.topoBg);
    root.style.setProperty('--color-topo-text', theme.topoText || DEFAULT_THEME.topoText);
    root.style.setProperty('--color-topo-border', theme.topoBg ? theme.topoText : '#7dd3fc');

    root.style.setProperty('--color-fundo-bg', theme.fundoBg || DEFAULT_THEME.fundoBg);
    root.style.setProperty('--color-fundo-text', theme.fundoText || DEFAULT_THEME.fundoText);
    root.style.setProperty('--color-fundo-border', theme.fundoBg ? theme.fundoText : '#fda4af');

    // 7. Atualiza link de suporte no DOM se existir
    const cleanWhats = (theme.supportWhatsApp || '51996069505').replace(/\D/g, '');
    const whatsLinks = document.querySelectorAll('.login-whats-btn, .login-support-btn, a[href*="wa.me"]');
    const msgEncoded = encodeURIComponent(theme.supportMsg || DEFAULT_THEME.supportMsg);
    whatsLinks.forEach(link => {
      link.href = `https://wa.me/55${cleanWhats}?text=${msgEncoded}`;
    });
  }
}

export const themeManager = new ThemeManager();

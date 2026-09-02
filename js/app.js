/**
 * Orquestrador Principal do Terminal - Projeto Back Under
 */
import { GameSlot } from './components/GameSlot.js';
import { PenduloModal } from './components/PenduloModal.js';
import { OperationsHistory } from './components/OperationsHistory.js';
import { formatCurrency, formatPercent } from './core/oddsCalculator.js';

class BackUnderApp {
  constructor() {
    this.masterRed = 200; // Padrão da planilha
    this.viewMode = 'view-4'; // 'view-4' | 'view-2' | 'view-1'
    this.audioEnabled = true;
    this.slots = [];
    this.audioCtx = null;

    this.init();
  }

  init() {
    this.loadSettings();
    this.initAudio();
    this.initElements();
    this.initPenduloModal();
    this.initHistory();
    this.initGameSlots();
    this.updateGlobalStats();
  }

  loadSettings() {
    try {
      const savedRed = localStorage.getItem('projeto_back_under_master_red');
      if (savedRed) this.masterRed = parseFloat(savedRed) || 200;

      const savedView = localStorage.getItem('projeto_back_under_view_mode');
      if (savedView) this.viewMode = savedView;
    } catch (e) {
      console.warn('Erro ao carregar configurações locais:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('projeto_back_under_master_red', this.masterRed.toString());
      localStorage.setItem('projeto_back_under_view_mode', this.viewMode);
    } catch (e) {
      console.warn('Erro ao salvar configurações locais:', e);
    }
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Audio Context não suportado no navegador.');
    }
  }

  playBeep(type = 'green') {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (type === 'green') {
        osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.25);
      } else if (type === 'red') {
        osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
      } else {
        osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      // Ignora erro de áudio
    }
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : '⚠️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  initElements() {
    // Red Global Input
    const masterRedInput = document.getElementById('masterRedInput');
    if (masterRedInput) {
      masterRedInput.value = this.masterRed;
      masterRedInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 0) {
          this.masterRed = val;
          this.saveSettings();
          this.slots.forEach(slot => slot.recalculate());
        }
      });
    }

    // Botão de Áudio
    const soundToggleBtn = document.getElementById('soundToggleBtn');
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        this.audioEnabled = !this.audioEnabled;
        soundToggleBtn.textContent = this.audioEnabled ? '🔔 Som Ativo' : '🔕 Mudo';
        if (this.audioEnabled) this.playBeep('green');
      });
    }

    // Botão Abrir Modal de Pêndulos no Header
    const openPendulosHeaderBtn = document.getElementById('openPendulosHeaderBtn');
    if (openPendulosHeaderBtn) {
      openPendulosHeaderBtn.addEventListener('click', () => {
        if (this.penduloModal) this.penduloModal.open();
      });
    }

    // Seletor de visualização (1, 2, 4 jogos)
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
      } else {
        // Aplica ao primeiro slot livre
        this.slots[0].setOdd365(selectedOdd365);
        this.showToast(`Pêndulo (365: ${selectedOdd365.toFixed(2)}) aplicado ao Slot #1`);
      }
      this.playBeep('click');
    });
  }

  initHistory() {
    this.history = new OperationsHistory((stats) => {
      this.updateGlobalStats(stats);
    });
  }

  initGameSlots() {
    const slotContainers = [
      document.getElementById('slotCard1'),
      document.getElementById('slotCard2'),
      document.getElementById('slotCard3'),
      document.getElementById('slotCard4')
    ];

    this.slots = slotContainers.map((container, idx) => {
      const slotId = idx + 1;
      return new GameSlot(slotId, container, {
        getMasterRed: () => this.masterRed,
        onOpenPendulos: (id) => this.penduloModal.open(id),
        onTradeCompleted: (tradeData) => {
          const registered = this.history.addTrade(tradeData);
          if (registered.status === 'GREEN') {
            this.playBeep('green');
            this.showToast(`Green registrado: +${formatCurrency(registered.lucroLiquido)} em ${registered.gameName}`, 'success');
          } else if (registered.status === 'RED') {
            this.playBeep('red');
            this.showToast(`Red registrado: ${formatCurrency(registered.lucroLiquido)} em ${registered.gameName}`, 'error');
          } else {
            this.playBeep('click');
            this.showToast(`Operação zerada (0x0) em ${registered.gameName}`, 'info');
          }
        }
      });
    });
  }

  updateGlobalStats(stats = null) {
    if (!stats && this.history) {
      stats = this.history.getStats();
    }
    if (!stats) return;

    const totalTradesEl = document.getElementById('statTotalTrades');
    const winrateEl = document.getElementById('statWinRate');
    const plTotalEl = document.getElementById('statPLTotal');
    const roiGeralEl = document.getElementById('statROIGeral');

    if (totalTradesEl) totalTradesEl.textContent = stats.totalTrades;
    if (winrateEl) winrateEl.textContent = `${stats.winRate.toFixed(1)}% (${stats.totalGreens}G / ${stats.totalReds}R)`;
    
    if (plTotalEl) {
      const isGreen = stats.totalPL > 0;
      const isRed = stats.totalPL < 0;
      plTotalEl.className = `summary-card-value ${isGreen ? 'text-green' : (isRed ? 'text-red' : 'text-primary')}`;
      plTotalEl.textContent = formatCurrency(stats.totalPL);
    }

    if (roiGeralEl) {
      const isGreen = stats.roiGeral > 0;
      const isRed = stats.roiGeral < 0;
      roiGeralEl.className = `summary-card-value ${isGreen ? 'text-green' : (isRed ? 'text-red' : 'text-primary')}`;
      roiGeralEl.textContent = formatPercent(stats.roiGeral);
    }
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BackUnderApp();
});

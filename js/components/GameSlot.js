/**
 * Componente do Slot de Jogo Individual (Suporte até 4 jogos em paralelo)
 * Integrado ao Motor de Decaimento Minuto a Minuto (Planilha IN LIVE / HTFT)
 */
import { STRATEGIES, calculateStakeFromRed } from '../core/stakeManager.js';
import { calculateMinuteCurve, getMinuteMetrics, applyGoalOddShift } from '../core/minuteDecayEngine.js';
import { moveOddTicks, calculateTicksDistance, formatCurrency, formatPercent, normalizeOdd } from '../core/oddsCalculator.js';
import { calculateHedge } from '../core/hedgeEngine.js';

export class GameSlot {
  constructor(slotId, containerElement, { getMasterRed, onTradeCompleted, onOpenPendulos }) {
    this.slotId = slotId;
    this.container = containerElement;
    this.getMasterRed = getMasterRed;
    this.onTradeCompleted = onTradeCompleted;
    this.onOpenPendulos = onOpenPendulos;

    // Estado do Slot
    this.state = {
      gameName: `Jogo ${slotId}`,
      period: 'HT', // 'HT' | 'FT'
      strategyKey: 'back_under_pendulos',
      customRed: null, // null herda do global
      initialOdd: 3.35,
      addedMinutes: 2,
      currentMinute: 1,
      liveOddInput: 3.35,
      liveCorrections: {},
      
      // Métricas calculadas
      minuteCurve: [],
      currentMetrics: null,
      stakeCalculada: 0,
      lucroMedio: 0,
      redMedio: 0,
      
      inTrade: false,
      timerSeconds: 0,
      timerRunning: false,
      showFullTable: false
    };

    this.timerInterval = null;
    this.recomputeCurve();
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  getEffectiveRed() {
    return this.state.customRed !== null && this.state.customRed !== undefined 
      ? this.state.customRed 
      : this.getMasterRed();
  }

  recomputeCurve() {
    this.state.minuteCurve = calculateMinuteCurve({
      period: this.state.period,
      initialOdd: this.state.initialOdd,
      addedMinutes: this.state.addedMinutes,
      liveCorrections: this.state.liveCorrections
    });
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
  }

  setPeriod(period) {
    this.state.period = period;
    this.state.currentMinute = period === 'HT' ? 1 : 46;
    this.state.initialOdd = period === 'HT' ? 3.35 : 5.10;
    this.state.addedMinutes = period === 'HT' ? 2 : 5;
    this.state.liveOddInput = this.state.initialOdd;
    this.state.timerSeconds = (this.state.currentMinute - (period === 'HT' ? 1 : 46)) * 60;
    this.recomputeCurve();
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  setInitialOdd(odd) {
    this.state.initialOdd = Number(odd);
    this.state.liveOddInput = Number(odd);
    this.recomputeCurve();
    this.recalculate();
  }

  setMinute(min) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    this.state.currentMinute = Math.max(minStart, Math.min(maxMin, min));
    this.state.timerSeconds = (this.state.currentMinute - minStart) * 60;
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    this.recalculate();
    this.updateTimerDisplay();
  }

  applyGoal(isFavor) {
    const newOdd = applyGoalOddShift(this.state.liveOddInput || this.state.currentMetrics.oddJusta, isFavor);
    this.state.liveOddInput = newOdd;
    this.state.liveCorrections[this.state.currentMinute] = newOdd;
    this.recomputeCurve();
    this.recalculate();
  }

  recalculate() {
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    const red = this.getEffectiveRed();
    const metrics = calculateStakeFromRed(this.state.strategyKey, red, {
      valorBloco: 4.0,
      stopLossPct: 0.25
    });

    this.state.stakeCalculada = metrics.stake;
    this.state.lucroMedio = metrics.lucroMedio;
    this.state.redMedio = metrics.redMedio;

    // Recalcula Hedge do minuto
    const oddEntrada = this.state.initialOdd;
    const oddAtual = this.state.liveOddInput || this.state.currentMetrics.oddJusta;
    const hedge = calculateHedge({
      oddEntrada: oddEntrada,
      stakeEntrada: this.state.stakeCalculada,
      oddAtual: oddAtual,
      comissaoPct: 0.0325
    });

    this.updateUI(metrics, hedge);
  }

  updateUI(metrics, hedge) {
    const cm = this.state.currentMetrics;
    if (!cm) return;

    // Minuto e Odd Justa
    const minuteBadge = this.container.querySelector('.slot-current-minute-badge');
    const oddJustaDisplay = this.container.querySelector('.slot-odd-justa-display');
    const bloco1Display = this.container.querySelector('.slot-bloco1-display');
    const bloco2Display = this.container.querySelector('.slot-bloco2-display');
    const zoneBadge = this.container.querySelector('.slot-zone-badge');
    const valueDiffBadge = this.container.querySelector('.slot-value-diff-badge');

    if (minuteBadge) minuteBadge.textContent = `${cm.minute}'`;
    if (oddJustaDisplay) oddJustaDisplay.textContent = cm.oddJusta.toFixed(2);
    if (bloco1Display) bloco1Display.textContent = `T: ${cm.topo1.toFixed(2)} | F: ${cm.fundo1.toFixed(2)}`;
    if (bloco2Display) bloco2Display.textContent = `T: ${cm.topo2.toFixed(2)} | F: ${cm.fundo2.toFixed(2)}`;

    if (zoneBadge) {
      zoneBadge.className = `zone-badge slot-zone-badge ${
        cm.zona === 'Rápida' ? 'zone-rapida' : (cm.zona === 'Média' ? 'zone-media' : 'zone-lenta')
      }`;
      zoneBadge.textContent = `Zona ${cm.zona}`;
    }

    // Diferença de Valor entre Mercado Live e Odd Justa
    if (valueDiffBadge) {
      const live = Number(this.state.liveOddInput) || cm.oddJusta;
      const diff = ((live / cm.oddJusta) - 1) * 100;
      const sign = diff > 0 ? '+' : '';
      const isGoodForUnder = diff > 0.5; // Odd de mercado está acima da justa (tem valor no Under)
      const isExpensive = diff < -0.5;

      valueDiffBadge.className = `badge-valordiff ${isGoodForUnder ? 'val-good' : (isExpensive ? 'val-bad' : 'val-fair')}`;
      valueDiffBadge.innerHTML = `
        <span>Mercado vs Justa:</span>
        <strong>${sign}${diff.toFixed(1)}% ${isGoodForUnder ? '📈 (VALOR UNDER)' : (isExpensive ? '📉 (SEM VALOR)' : '⚖️ (JUSTO)')}</strong>
      `;
    }

    // Stake e Retornos
    const stakeDisplay = this.container.querySelector('.slot-stake-display');
    const lucroDisplay = this.container.querySelector('.slot-lucro-display');
    const redDisplay = this.container.querySelector('.slot-red-display');
    const hedgeResult = this.container.querySelector('.slot-hedge-result');

    if (stakeDisplay) stakeDisplay.textContent = formatCurrency(metrics.stake);
    if (lucroDisplay) lucroDisplay.textContent = formatCurrency(metrics.lucroMedio);
    if (redDisplay) redDisplay.textContent = formatCurrency(metrics.redMedio);

    if (hedgeResult) {
      hedgeResult.className = `hedge-result-display slot-hedge-result ${
        hedge.isGreen ? 'green' : (hedge.isRed ? 'red' : 'neutral')
      }`;
      const sign = hedge.lucroLiquido > 0 ? '+' : '';
      hedgeResult.innerHTML = `
        <span style="font-size: 0.75rem; text-transform: uppercase;">Cashout / P&L Atual</span>
        <span style="font-size: 1.05rem; font-weight: 800;">${sign}${formatCurrency(hedge.lucroLiquido)} (${sign}${formatPercent(hedge.roiPct)})</span>
      `;
    }

    if (this.state.inTrade) {
      this.container.classList.add('active-trade');
    } else {
      this.container.classList.remove('active-trade');
    }

    if (this.state.showFullTable) {
      this.renderMinuteTable();
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state.timerRunning = true;
    const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
    if (playPauseBtn) playPauseBtn.textContent = '⏸️';

    this.timerInterval = setInterval(() => {
      this.state.timerSeconds++;
      this.updateTimerDisplay();

      // A cada 60 segundos passados, avança 1 minuto no cálculo automaticamente
      const isHT = this.state.period === 'HT';
      const baseMin = isHT ? 1 : 46;
      const calcMinute = baseMin + Math.floor(this.state.timerSeconds / 60);
      const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);

      if (calcMinute !== this.state.currentMinute && calcMinute <= maxMin) {
        this.state.currentMinute = calcMinute;
        this.recalculate();
      }
    }, 1000);
  }

  pauseTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.state.timerRunning = false;
    const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
    if (playPauseBtn) playPauseBtn.textContent = '▶️';
  }

  resetTimer() {
    this.pauseTimer();
    this.state.timerSeconds = 0;
    this.state.currentMinute = this.state.period === 'HT' ? 1 : 46;
    this.updateTimerDisplay();
    this.recalculate();
  }

  updateTimerDisplay() {
    const timerDisplay = this.container.querySelector('.timer-display');
    if (timerDisplay) {
      const minutes = Math.floor(this.state.timerSeconds / 60);
      const seconds = this.state.timerSeconds % 60;
      const isHT = this.state.period === 'HT';
      const matchMin = (isHT ? 1 : 46) + minutes;
      timerDisplay.textContent = `${String(matchMin).padStart(2, '0')}:${String(seconds).padStart(2, '0')}'`;
    }
  }

  adjustLiveOdd(ticks) {
    this.state.liveOddInput = moveOddTicks(this.state.liveOddInput, ticks);
    const liveOddInput = this.container.querySelector('.slot-live-odd-input');
    if (liveOddInput) liveOddInput.value = this.state.liveOddInput.toFixed(2);
    this.recalculate();
  }

  renderMinuteTable() {
    const tbody = this.container.querySelector('.minute-table-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.state.minuteCurve.map(row => {
      const isCurrent = row.minute === this.state.currentMinute;
      return `
        <tr style="${isCurrent ? 'background: rgba(59, 130, 246, 0.25); font-weight: 800;' : ''}">
          <td style="color: ${isCurrent ? '#facc15' : 'var(--text-primary)'};">${row.minute}'</td>
          <td style="color: #60a5fa;">${row.oddJusta.toFixed(2)}</td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">${row.topo1.toFixed(2)} - ${row.fundo1.toFixed(2)}</td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">${row.topo2.toFixed(2)} - ${row.fundo2.toFixed(2)}</td>
          <td><span class="zone-badge ${row.zona === 'Rápida' ? 'zone-rapida' : (row.zona === 'Média' ? 'zone-media' : 'zone-lenta')}" style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">${row.zona}</span></td>
        </tr>
      `;
    }).join('');
  }

  bindEvents() {
    // Nome do jogo
    const titleInput = this.container.querySelector('.game-title-input');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.state.gameName = e.target.value.trim() || `Jogo ${this.slotId}`;
      });
    }

    // Período (HT vs FT)
    this.container.querySelectorAll('.period-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-period');
        this.setPeriod(p);
      });
    });

    // Odd Inicial (Campo Amarelo)
    const initialOddInput = this.container.querySelector('.slot-initial-odd-input');
    if (initialOddInput) {
      initialOddInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.setInitialOdd(val);
        }
      });
    }

    // Acréscimos
    const addedMinutesInput = this.container.querySelector('.slot-added-minutes-input');
    if (addedMinutesInput) {
      addedMinutesInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.addedMinutes = isNaN(val) || val < 0 ? 0 : val;
        this.recomputeCurve();
        this.recalculate();
      });
    }

    // Red Aceitável (Campo Amarelo)
    const redInput = this.container.querySelector('.slot-red-input');
    if (redInput) {
      redInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.customRed = isNaN(val) || val <= 0 ? null : val;
        this.recalculate();
      });
    }

    // Odd do Mercado Live
    const liveOddInput = this.container.querySelector('.slot-live-odd-input');
    if (liveOddInput) {
      liveOddInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.state.liveOddInput = val;
          this.recalculate();
        }
      });
    }

    // Botões de Minuto (+1 / -1)
    const btnMinMinus = this.container.querySelector('.slot-min-minus-btn');
    const btnMinPlus = this.container.querySelector('.slot-min-plus-btn');
    if (btnMinMinus) btnMinMinus.addEventListener('click', () => this.setMinute(this.state.currentMinute - 1));
    if (btnMinPlus) btnMinPlus.addEventListener('click', () => this.setMinute(this.state.currentMinute + 1));

    // Steppers de Odd Live (+/- 1 tick, +/- 5 ticks)
    this.container.querySelectorAll('[data-live-tick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticks = parseInt(btn.getAttribute('data-live-tick'), 10);
        this.adjustLiveOdd(ticks);
      });
    });

    // Botões de Gol (Favor x2.5 / Contra /2.5)
    const btnGolFav = this.container.querySelector('.slot-gol-fav-btn');
    const btnGolContra = this.container.querySelector('.slot-gol-contra-btn');
    if (btnGolFav) btnGolFav.addEventListener('click', () => this.applyGoal(true));
    if (btnGolContra) btnGolContra.addEventListener('click', () => this.applyGoal(false));

    // Timer buttons
    const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
    const resetTimerBtn = this.container.querySelector('.timer-reset-btn');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        if (this.state.timerRunning) this.pauseTimer();
        else this.startTimer();
      });
    }
    if (resetTimerBtn) {
      resetTimerBtn.addEventListener('click', () => this.resetTimer());
    }

    // Toggle Tabela Completa
    const toggleTableBtn = this.container.querySelector('.slot-toggle-table-btn');
    const fullTableContainer = this.container.querySelector('.slot-full-table-container');
    if (toggleTableBtn && fullTableContainer) {
      toggleTableBtn.addEventListener('click', () => {
        this.state.showFullTable = !this.state.showFullTable;
        fullTableContainer.style.display = this.state.showFullTable ? 'block' : 'none';
        toggleTableBtn.textContent = this.state.showFullTable ? '▲ Ocultar Curva' : '▼ Ver Curva Minuto a Minuto';
        if (this.state.showFullTable) this.renderMinuteTable();
      });
    }

    // Ações de Trade
    const enterTradeBtn = this.container.querySelector('.slot-enter-trade-btn');
    const cashoutBtn = this.container.querySelector('.slot-cashout-btn');
    const resetSlotBtn = this.container.querySelector('.slot-reset-btn');

    if (enterTradeBtn) {
      enterTradeBtn.addEventListener('click', () => {
        this.state.inTrade = !this.state.inTrade;
        enterTradeBtn.textContent = this.state.inTrade ? '🟢 Em Aberto' : '🎯 Abrir Posição';
        if (this.state.inTrade && !this.state.timerRunning) {
          this.startTimer();
        }
        this.recalculate();
      });
    }

    if (cashoutBtn) {
      cashoutBtn.addEventListener('click', () => {
        const hedge = calculateHedge({
          oddEntrada: this.state.initialOdd,
          stakeEntrada: this.state.stakeCalculada,
          oddAtual: this.state.liveOddInput || this.state.currentMetrics.oddJusta,
          comissaoPct: 0.0325
        });

        if (this.onTradeCompleted) {
          this.onTradeCompleted({
            gameName: this.state.gameName,
            strategyName: `Back Under ${this.state.period} (Min ${this.state.currentMinute}')`,
            oddEntrada: this.state.initialOdd,
            oddSaida: this.state.liveOddInput || this.state.currentMetrics.oddJusta,
            stake: this.state.stakeCalculada,
            lucroLiquido: hedge.lucroLiquido,
            roiPct: hedge.roiPct,
            ticks: calculateTicksDistance(this.state.initialOdd, this.state.liveOddInput || this.state.currentMetrics.oddJusta)
          });
        }

        this.state.inTrade = false;
        if (enterTradeBtn) enterTradeBtn.textContent = '🎯 Abrir Posição';
        this.recalculate();
      });
    }

    if (resetSlotBtn) {
      resetSlotBtn.addEventListener('click', () => {
        this.resetTimer();
        this.state.inTrade = false;
        this.state.liveCorrections = {};
        this.setInitialOdd(this.state.period === 'HT' ? 3.35 : 5.10);
      });
    }
  }

  render() {
    const isHT = this.state.period === 'HT';

    this.container.innerHTML = `
      <!-- Cabeçalho do Slot -->
      <div class="game-card-header">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <span class="game-slot-badge">SLOT #${this.slotId}</span>
          <input type="text" class="game-title-input" value="${this.state.gameName}" placeholder="Ex: Time A x Time B">
        </div>

        <!-- Seletor de Período (HT / FT) -->
        <div class="period-toggle-group">
          <button class="period-tab-btn ${isHT ? 'active' : ''}" data-period="HT">1ºT (HT)</button>
          <button class="period-tab-btn ${!isHT ? 'active' : ''}" data-period="FT">2ºT (FT)</button>
        </div>

        <!-- Cronômetro -->
        <div class="game-timer-box">
          <span class="timer-display">${isHT ? '01:00' : '46:00'}'</span>
          <button class="timer-btn timer-play-pause-btn" title="Iniciar/Pausar">▶️</button>
          <button class="timer-btn timer-reset-btn" title="Zerar cronômetro">🔄</button>
        </div>
      </div>

      <div class="game-card-body">
        <!-- Inputs Principais em Amarelo -->
        <div class="primary-inputs-grid">
          <!-- Campo 1: Odd Inicial -->
          <div class="input-group-yellow">
            <label class="input-label-yellow">
              <span>🎯 Odd Inicial ${this.state.period}</span>
            </label>
            <input type="number" step="0.01" class="input-control-yellow slot-initial-odd-input" value="${this.state.initialOdd.toFixed(2)}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
              <span style="font-size: 0.65rem; color: var(--text-muted);">Acréscimos:</span>
              <input type="number" class="slot-added-minutes-input" value="${this.state.addedMinutes}" style="width: 45px; background: var(--bg-input); border: 1px solid var(--border-subtle); color: #fff; text-align: center; border-radius: 4px; font-size: 0.75rem;">
            </div>
          </div>

          <!-- Campo 2: Red Aceitável (R$) -->
          <div class="input-group-yellow">
            <label class="input-label-yellow">
              <span>🛡️ Red Aceitável (R$)</span>
            </label>
            <input type="number" step="10" class="input-control-yellow slot-red-input" placeholder="Padrão Geral">
            <div style="font-size: 0.6rem; color: var(--text-muted); text-align: right; margin-top: 0.25rem;">
              Em branco = usa Red global
            </div>
          </div>
        </div>

        <!-- Banner do Minuto Atual e Decaimento -->
        <div class="minute-live-card">
          <div class="minute-live-header">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="minute-pill slot-current-minute-badge">${this.state.currentMinute}'</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Odd Justa do Minuto:</span>
              <span class="minute-justa-value slot-odd-justa-display">0.00</span>
            </div>
            <div style="display: flex; gap: 0.25rem;">
              <button class="step-btn slot-min-minus-btn" title="Minuto Anterior">-1'</button>
              <button class="step-btn slot-min-plus-btn" title="Próximo Minuto">+1'</button>
            </div>
          </div>

          <!-- Blocos 1 e 2 & Zona -->
          <div class="minute-blocos-grid">
            <div class="bloco-item">
              <span class="bloco-label">Bloco Justo 1:</span>
              <span class="bloco-val slot-bloco1-display">-</span>
            </div>
            <div class="bloco-item">
              <span class="bloco-label">Bloco Justo 2:</span>
              <span class="bloco-val slot-bloco2-display">-</span>
            </div>
            <div class="bloco-item" style="text-align: right;">
              <span class="zone-badge slot-zone-badge zone-media">Zona Média</span>
            </div>
          </div>
        </div>

        <!-- Painel de Comparação Mercado Live & Gols -->
        <div class="live-hedge-box">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Odd Real no Mercado Live:</span>
            <input type="number" step="0.01" class="hedge-odd-input slot-live-odd-input" value="${this.state.liveOddInput ? this.state.liveOddInput.toFixed(2) : ''}">
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <div class="stepper-row" style="margin: 0;">
              <button class="step-btn" data-live-tick="-5">-5 ticks</button>
              <button class="step-btn" data-live-tick="-1">-1 tick</button>
              <button class="step-btn" data-live-tick="1">+1 tick</button>
              <button class="step-btn" data-live-tick="5">+5 ticks</button>
            </div>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm slot-gol-fav-btn" title="Gol a Favor (x2.5)" style="padding: 0.2rem 0.4rem; font-size: 0.65rem;">⚽ Gol Fav</button>
              <button class="btn btn-secondary btn-sm slot-gol-contra-btn" title="Gol Contra (/2.5)" style="padding: 0.2rem 0.4rem; font-size: 0.65rem; color: #f87171;">🔴 Gol Contra</button>
            </div>
          </div>

          <!-- Indicador de Valor -->
          <div class="slot-value-diff-badge badge-valordiff val-fair">
            <span>Mercado vs Justa:</span>
            <strong>0,0% ⚖️ (JUSTO)</strong>
          </div>

          <!-- P&L Cashout do Minuto -->
          <div class="hedge-result-display slot-hedge-result green">
            <span style="font-size: 0.75rem; text-transform: uppercase;">Cashout / P&L Atual</span>
            <span style="font-size: 1.05rem; font-weight: 800;">+R$ 0,00 (+0,0%)</span>
          </div>
        </div>

        <!-- Resumo de Stake & Risco -->
        <div class="auto-results-panel" style="padding: 0.5rem 0.75rem;">
          <div class="results-grid-3col">
            <div class="metric-pill">
              <span class="metric-pill-title">Stake</span>
              <span class="metric-pill-value slot-stake-display text-cyan">R$ 0,00</span>
            </div>
            <div class="metric-pill">
              <span class="metric-pill-title">Lucro Méd.</span>
              <span class="metric-pill-value slot-lucro-display text-green">R$ 0,00</span>
            </div>
            <div class="metric-pill">
              <span class="metric-pill-title">Red Máx.</span>
              <span class="metric-pill-value slot-red-display text-red">R$ 0,00</span>
            </div>
          </div>
        </div>

        <!-- Botão Ver Curva Completa Minuto a Minuto -->
        <button class="btn btn-secondary btn-sm slot-toggle-table-btn" style="width: 100%;">
          ▼ Ver Curva Minuto a Minuto
        </button>

        <!-- Container da Tabela Minuto a Minuto (Oculto por padrão) -->
        <div class="slot-full-table-container" style="display: none; max-height: 220px; overflow-y: auto; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm);">
          <table class="history-table" style="font-size: 0.75rem;">
            <thead>
              <tr>
                <th>Min</th>
                <th>Justa</th>
                <th>Bloco 1</th>
                <th>Bloco 2</th>
                <th>Zona</th>
              </tr>
            </thead>
            <tbody class="minute-table-tbody"></tbody>
          </table>
        </div>

        <!-- Botões de Ação -->
        <div class="game-actions-row">
          <button class="btn btn-secondary slot-enter-trade-btn">🎯 Abrir Posição</button>
          <button class="btn btn-success slot-cashout-btn" title="Registrar fechamento no histórico">💰 Fechar (Cashout)</button>
          <button class="btn btn-secondary slot-reset-btn" style="flex: 0.25;" title="Resetar Slot">🔄</button>
        </div>
      </div>
    `;
  }
}

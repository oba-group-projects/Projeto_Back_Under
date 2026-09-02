/**
 * Componente do Slot de Jogo Individual (Suporte até 4 jogos em paralelo)
 */
import { STRATEGIES, calculateStakeFromRed } from '../core/stakeManager.js';
import { findClosestPendulo } from '../core/pendulosData.js';
import { moveOddTicks, calculateTicksDistance, formatCurrency, formatPercent, normalizeOdd } from '../core/oddsCalculator.js';
import { calculateHedge, calculateFreebet } from '../core/hedgeEngine.js';

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
      strategyKey: 'back_under_pendulos',
      customRed: null, // null herda do global
      odd365: 3.50,
      oddEntrada: 3.96, // Odd justa do pêndulo ou entrada
      oddSaidaAlvo: 3.85,
      oddAtualHedge: 3.85,
      stakeCalculada: 0,
      lucroMedio: 0,
      redMedio: 0,
      ticks: 2,
      zona: 'Média',
      valorBlocoPct: 2.44,
      inTrade: false,
      timerSeconds: 0,
      timerRunning: false
    };

    this.timerInterval = null;
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  getEffectiveRed() {
    return this.state.customRed !== null && this.state.customRed !== undefined 
      ? this.state.customRed 
      : this.getMasterRed();
  }

  setOdd365(odd) {
    this.state.odd365 = Number(odd);
    const odd365Input = this.container.querySelector('.slot-odd-365');
    if (odd365Input) odd365Input.value = odd.toFixed(2);
    this.recalculateFromPendulo();
  }

  recalculateFromPendulo() {
    const pendulo = findClosestPendulo(this.state.odd365, '365');
    if (pendulo) {
      this.state.oddEntrada = pendulo.oddJusta;
      this.state.oddSaidaAlvo = pendulo.saida;
      this.state.oddAtualHedge = pendulo.saida;
      this.state.ticks = pendulo.ticks;
      this.state.zona = pendulo.zona;
      this.state.valorBlocoPct = pendulo.valorBloco;

      const oddEntradaInput = this.container.querySelector('.slot-odd-entrada');
      const oddHedgeInput = this.container.querySelector('.slot-odd-hedge');
      if (oddEntradaInput) oddEntradaInput.value = pendulo.oddJusta.toFixed(2);
      if (oddHedgeInput) oddHedgeInput.value = pendulo.saida.toFixed(2);
    }
    this.recalculate();
  }

  recalculate() {
    const red = this.getEffectiveRed();
    const metrics = calculateStakeFromRed(this.state.strategyKey, red, {
      valorBloco: this.state.valorBlocoPct,
      stopLossPct: 0.25
    });

    this.state.stakeCalculada = metrics.stake;
    this.state.lucroMedio = metrics.lucroMedio;
    this.state.redMedio = metrics.redMedio;

    // Recalcula Hedge em tempo real
    const hedge = calculateHedge({
      oddEntrada: this.state.oddEntrada,
      stakeEntrada: this.state.stakeCalculada,
      oddAtual: this.state.oddAtualHedge,
      comissaoPct: 0.0325
    });

    this.updateUI(metrics, hedge);
  }

  updateUI(metrics, hedge) {
    // Stake & Métricas
    const stakeBadge = this.container.querySelector('.slot-stake-display');
    const lucroDisplay = this.container.querySelector('.slot-lucro-display');
    const redDisplay = this.container.querySelector('.slot-red-display');
    const penduloBanner = this.container.querySelector('.slot-pendulo-banner');
    const zoneBadge = this.container.querySelector('.slot-zone-badge');
    const ticksDisplay = this.container.querySelector('.slot-ticks-display');
    const hedgeResult = this.container.querySelector('.slot-hedge-result');

    if (stakeBadge) stakeBadge.textContent = formatCurrency(metrics.stake);
    if (lucroDisplay) lucroDisplay.textContent = `${formatCurrency(metrics.lucroMedio)} (${formatPercent(metrics.roiEstimadoPct)})`;
    if (redDisplay) redDisplay.textContent = formatCurrency(metrics.redMedio);

    if (ticksDisplay) ticksDisplay.textContent = `${this.state.ticks} ticks`;

    if (zoneBadge) {
      zoneBadge.className = `zone-badge slot-zone-badge ${
        this.state.zona === 'Rápida' ? 'zone-rapida' : (this.state.zona === 'Média' ? 'zone-media' : 'zone-lenta')
      }`;
      zoneBadge.textContent = `Zona ${this.state.zona}`;
    }

    if (penduloBanner) {
      const oddJustaEl = penduloBanner.querySelector('.pendulo-odd-justa');
      const oddSaidaEl = penduloBanner.querySelector('.pendulo-odd-saida');
      if (oddJustaEl) oddJustaEl.textContent = this.state.oddEntrada ? this.state.oddEntrada.toFixed(2) : '-';
      if (oddSaidaEl) oddSaidaEl.textContent = this.state.oddSaidaAlvo ? this.state.oddSaidaAlvo.toFixed(2) : '-';
    }

    // Hedge Result Display
    if (hedgeResult) {
      hedgeResult.className = `hedge-result-display slot-hedge-result ${
        hedge.isGreen ? 'green' : (hedge.isRed ? 'red' : 'neutral')
      }`;
      const sign = hedge.lucroLiquido > 0 ? '+' : '';
      hedgeResult.innerHTML = `
        <span style="font-size: 0.75rem; text-transform: uppercase;">Retorno Líquido</span>
        <span style="font-size: 1.05rem; font-weight: 800;">${sign}${formatCurrency(hedge.lucroLiquido)} (${sign}${formatPercent(hedge.roiPct)})</span>
      `;
    }

    // Status do card se em operação
    if (this.state.inTrade) {
      this.container.classList.add('active-trade');
    } else {
      this.container.classList.remove('active-trade');
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
    this.updateTimerDisplay();
  }

  updateTimerDisplay() {
    const timerDisplay = this.container.querySelector('.timer-display');
    if (timerDisplay) {
      const minutes = Math.floor(this.state.timerSeconds / 60);
      const seconds = this.state.timerSeconds % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}'`;
    }
  }

  adjustHedgeOdd(ticks) {
    this.state.oddAtualHedge = moveOddTicks(this.state.oddAtualHedge, ticks);
    const hedgeInput = this.container.querySelector('.slot-odd-hedge');
    if (hedgeInput) hedgeInput.value = this.state.oddAtualHedge.toFixed(2);
    this.recalculate();
  }

  bindEvents() {
    // Nome do jogo
    const titleInput = this.container.querySelector('.game-title-input');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.state.gameName = e.target.value.trim() || `Jogo ${this.slotId}`;
      });
    }

    // Seletor de estratégia
    const stratSelect = this.container.querySelector('.slot-strategy-select');
    if (stratSelect) {
      stratSelect.addEventListener('change', (e) => {
        this.state.strategyKey = e.target.value;
        this.recalculate();
      });
    }

    // Odd 365 (Campo Amarelo)
    const odd365Input = this.container.querySelector('.slot-odd-365');
    if (odd365Input) {
      odd365Input.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.state.odd365 = val;
          this.recalculateFromPendulo();
        }
      });
    }

    // Red Aceitável customizado (Campo Amarelo)
    const redInput = this.container.querySelector('.slot-red-input');
    if (redInput) {
      redInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.state.customRed = isNaN(val) || val <= 0 ? null : val;
        this.recalculate();
      });
    }

    // Odd Entrada Customizada
    const oddEntradaInput = this.container.querySelector('.slot-odd-entrada');
    if (oddEntradaInput) {
      oddEntradaInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.state.oddEntrada = val;
          this.recalculate();
        }
      });
    }

    // Odd Atual Hedge
    const oddHedgeInput = this.container.querySelector('.slot-odd-hedge');
    if (oddHedgeInput) {
      oddHedgeInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.state.oddAtualHedge = val;
          this.recalculate();
        }
      });
    }

    // Steppers de Odd Atual (+/- 1 tick, +/- 2 ticks, +/- 5 ticks)
    this.container.querySelectorAll('[data-hedge-tick]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticks = parseInt(btn.getAttribute('data-hedge-tick'), 10);
        this.adjustHedgeOdd(ticks);
      });
    });

    // Abrir Mapa de Pêndulos para este slot
    const openPenduloBtn = this.container.querySelector('.slot-open-pendulo-btn');
    if (openPenduloBtn) {
      openPenduloBtn.addEventListener('click', () => {
        if (this.onOpenPendulos) this.onOpenPendulos(this.slotId);
      });
    }

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
          oddEntrada: this.state.oddEntrada,
          stakeEntrada: this.state.stakeCalculada,
          oddAtual: this.state.oddAtualHedge,
          comissaoPct: 0.0325
        });

        const strategyObj = STRATEGIES[this.state.strategyKey];

        if (this.onTradeCompleted) {
          this.onTradeCompleted({
            gameName: this.state.gameName,
            strategyName: strategyObj ? strategyObj.name : 'Back Under',
            oddEntrada: this.state.oddEntrada,
            oddSaida: this.state.oddAtualHedge,
            stake: this.state.stakeCalculada,
            lucroLiquido: hedge.lucroLiquido,
            roiPct: hedge.roiPct,
            ticks: calculateTicksDistance(this.state.oddEntrada, this.state.oddAtualHedge)
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
        if (enterTradeBtn) enterTradeBtn.textContent = '🎯 Abrir Posição';
        this.setOdd365(3.50);
      });
    }
  }

  render() {
    const strategiesOptions = Object.values(STRATEGIES).map(s => {
      return `<option value="${s.id}" ${s.id === this.state.strategyKey ? 'selected' : ''}>${s.name} (${s.oddsBase})</option>`;
    }).join('');

    this.container.innerHTML = `
      <div class="game-card-header">
        <span class="game-slot-badge">SLOT #${this.slotId}</span>
        <input type="text" class="game-title-input" value="${this.state.gameName}" placeholder="Ex: Time A x Time B">
        <div class="game-timer-box">
          <span class="timer-display">00:00'</span>
          <button class="timer-btn timer-play-pause-btn" title="Iniciar/Pausar">▶️</button>
          <button class="timer-btn timer-reset-btn" title="Zerar cronômetro">🔄</button>
        </div>
      </div>

      <div class="game-card-body">
        <!-- Seleção de Estratégia -->
        <div class="strategy-selector-row">
          <label class="field-label">
            <span>Estratégia / Método</span>
            <button class="btn btn-secondary btn-sm slot-open-pendulo-btn" style="padding: 0.15rem 0.4rem; font-size: 0.65rem;">📖 Ver Pêndulos V6</button>
          </label>
          <select class="select-control slot-strategy-select">
            ${strategiesOptions}
          </select>
        </div>

        <!-- Inputs Principais (Campos em Destaque Amarelo da Planilha) -->
        <div class="primary-inputs-grid">
          <!-- Campo 1: Odd 365 / Referência -->
          <div class="input-group-yellow">
            <label class="input-label-yellow">
              <span>🎯 Odd 365 (Parede)</span>
            </label>
            <input type="number" step="0.01" class="input-control-yellow slot-odd-365" value="${this.state.odd365.toFixed(2)}">
            <div class="stepper-row">
              <button class="step-btn" data-hedge-tick="-1">-1 tick</button>
              <button class="step-btn" data-hedge-tick="1">+1 tick</button>
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

        <!-- Banner Automatizado do Pêndulo V6 -->
        <div class="pendulo-target-banner slot-pendulo-banner">
          <div class="pendulo-info-block">
            <span class="pendulo-info-label">Pêndulo Parede V6</span>
            <div class="pendulo-info-values">
              <span>Justa:</span>
              <span class="pendulo-odd-justa">${this.state.oddEntrada.toFixed(2)}</span>
              <span class="pendulo-arrow">➔</span>
              <span>Saída:</span>
              <span class="pendulo-odd-saida">${this.state.oddSaidaAlvo.toFixed(2)}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem;">
            <span class="zone-badge slot-zone-badge zone-media">Zona ${this.state.zona}</span>
            <span style="font-size: 0.7rem; color: var(--color-cyan); font-weight: 700;" class="slot-ticks-display">${this.state.ticks} ticks</span>
          </div>
        </div>

        <!-- Painel de Resultados Automáticos (Stake, Lucro, Red) -->
        <div class="auto-results-panel">
          <div class="results-grid-3col">
            <div class="metric-pill">
              <span class="metric-pill-title">Stake Ideal</span>
              <span class="metric-pill-value slot-stake-display text-cyan">R$ 0,00</span>
            </div>
            <div class="metric-pill">
              <span class="metric-pill-title">Lucro Médio</span>
              <span class="metric-pill-value slot-lucro-display text-green">R$ 0,00</span>
            </div>
            <div class="metric-pill">
              <span class="metric-pill-title">Red Máximo</span>
              <span class="metric-pill-value slot-red-display text-red">R$ 0,00</span>
            </div>
          </div>
        </div>

        <!-- Seção de Fechamento / Live Hedge -->
        <div class="live-hedge-box">
          <div class="hedge-odd-row">
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-secondary);">Odd Atual / Saída Lay</span>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Ajuste ticks para simular cashout</span>
            </div>
            <input type="number" step="0.01" class="hedge-odd-input slot-odd-hedge" value="${this.state.oddAtualHedge.toFixed(2)}">
          </div>

          <div class="stepper-row" style="justify-content: flex-start; gap: 0.35rem;">
            <button class="step-btn" data-hedge-tick="-5">-5 ticks</button>
            <button class="step-btn" data-hedge-tick="-1">-1 tick</button>
            <button class="step-btn" data-hedge-tick="1">+1 tick</button>
            <button class="step-btn" data-hedge-tick="5">+5 ticks</button>
          </div>

          <div class="hedge-result-display slot-hedge-result green">
            <span style="font-size: 0.75rem; text-transform: uppercase;">Retorno Líquido</span>
            <span style="font-size: 1.05rem; font-weight: 800;">+R$ 0,00 (+0,0%)</span>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="game-actions-row">
          <button class="btn btn-secondary slot-enter-trade-btn">🎯 Abrir Posição</button>
          <button class="btn btn-success slot-cashout-btn" title="Registrar lucro/fechamento no histórico">💰 Fechar (Cashout)</button>
          <button class="btn btn-secondary slot-reset-btn" style="flex: 0.3;" title="Resetar Slot">🔄</button>
        </div>
      </div>
    `;
  }
}

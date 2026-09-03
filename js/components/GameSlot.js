/**
 * Componente do Slot de Jogo Individual - Cockpit de Alta Visibilidade (HUD)
 * Focado 100% no Minuto Atual, Sincronização Rápida e Decaimento da Planilha Google Docs
 */
import { calculateMinuteCurve, getMinuteMetrics, applyGoalOddShift } from '../core/minuteDecayEngine.js';
import { moveOddTicks, calculateTicksDistance, formatCurrency, formatPercent } from '../core/oddsCalculator.js';
import { calculateHedge } from '../core/hedgeEngine.js';
import { findClosestLadder } from '../core/ladderData.js';

export class GameSlot {
  constructor(slotId, containerElement, { getMasterRed, onTradeCompleted, onOpenPendulos }) {
    this.slotId = slotId;
    this.container = containerElement;
    this.getMasterRed = getMasterRed || (() => 200);
    this.onTradeCompleted = onTradeCompleted;
    this.onOpenPendulos = onOpenPendulos;

    // Estado do Slot
    this.state = {
      gameName: `Jogo ${slotId}`,
      period: 'HT', // 'HT' | 'FT'
      initialOdd: 3.35,
      addedMinutes: 2,
      currentMinute: 1,
      liveOddCurrentMinute: '', // odd informada pelo trader para o minuto atual
      liveCorrections: {},
      
      // Velocidade do tempo
      ticksPorMinuto: 0,
      pctPorMinuto: 0,
      
      // Métricas calculadas
      minuteCurve: [],
      currentMetrics: null,
      stakeBase: 800,
      
      inTrade: false,
      timerSeconds: 0,
      timerRunning: false
    };

    this.timerInterval = null;
    this.recomputeCurve();
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  recomputeCurve() {
    this.state.minuteCurve = calculateMinuteCurve({
      period: this.state.period,
      initialOdd: this.state.initialOdd,
      addedMinutes: this.state.addedMinutes,
      liveCorrections: this.state.liveCorrections
    });
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);

    // Ticks por minuto e % por minuto base
    const ladderItem = findClosestLadder(this.state.initialOdd);
    const totalMin = 45 + (Number(this.state.addedMinutes) || 0);
    this.state.ticksPorMinuto = Number((ladderItem.tickIndex / totalMin).toFixed(2));
    this.state.pctPorMinuto = Number(((Math.pow(1.01 / this.state.initialOdd, 1 / totalMin) - 1) * 100).toFixed(2));
  }

  setPeriod(period) {
    this.state.period = period;
    this.state.currentMinute = period === 'HT' ? 1 : 46;
    this.state.initialOdd = period === 'HT' ? 3.35 : 5.10;
    this.state.addedMinutes = period === 'HT' ? 2 : 5;
    this.state.liveOddCurrentMinute = '';
    this.state.liveCorrections = {};
    this.state.timerSeconds = 0;
    this.pauseTimer();
    this.recomputeCurve();
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  setInitialOdd(odd) {
    this.state.initialOdd = Number(odd) || 2.00;
    this.recomputeCurve();
    this.recalculate();
  }

  setMinute(min) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    const newMin = Math.max(minStart, Math.min(maxMin, parseInt(min, 10) || minStart));
    
    // Ao mudar o minuto, se for um novo minuto, limpa o input de odd live para nova leitura
    if (newMin !== this.state.currentMinute) {
      this.state.currentMinute = newMin;
      this.state.liveOddCurrentMinute = this.state.liveCorrections[newMin] ? this.state.liveCorrections[newMin].toString() : '';
      this.state.timerSeconds = (newMin - minStart) * 60;
      
      const liveInput = this.container.querySelector('.hud-live-odd-input');
      if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;

      const tvMinInput = this.container.querySelector('.hud-tv-min-input');
      if (tvMinInput) tvMinInput.value = newMin;
    }

    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    this.recalculate();
    this.updateTimerDisplay();
  }

  syncFromTV(min) {
    this.setMinute(min);
    this.startTimer();
  }

  applyGoal(isFavor) {
    const currentJusta = this.state.currentMetrics ? this.state.currentMetrics.oddJusta : this.state.initialOdd;
    const baseOdd = parseFloat(this.state.liveOddCurrentMinute) || currentJusta;
    const newOdd = applyGoalOddShift(baseOdd, isFavor);
    this.state.liveOddCurrentMinute = newOdd.toFixed(2);
    this.state.liveCorrections[this.state.currentMinute] = newOdd;
    
    const liveInput = this.container.querySelector('.hud-live-odd-input');
    if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;

    this.recomputeCurve();
    this.recalculate();
  }

  recalculate() {
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    const cm = this.state.currentMetrics;
    if (!cm) return;

    // Recalcula Hedge do minuto
    const liveOdd = parseFloat(this.state.liveOddCurrentMinute) || cm.oddJusta;
    const hedge = calculateHedge({
      oddEntrada: this.state.initialOdd,
      stakeEntrada: this.state.stakeBase,
      oddAtual: liveOdd,
      comissaoPct: 0.0325
    });

    this.updateUI(hedge);
  }

  updateUI(hedge) {
    const cm = this.state.currentMetrics;
    if (!cm) return;

    // Minuto e Odd Justa
    const minuteBadge = this.container.querySelector('.hud-minute-badge');
    const oddJustaDisplay = this.container.querySelector('.hud-odd-justa');
    const bloco1Display = this.container.querySelector('.hud-bloco1');
    const bloco2Display = this.container.querySelector('.hud-bloco2');
    const zoneBadge = this.container.querySelector('.hud-zone-badge');
    const valueDiffBadge = this.container.querySelector('.hud-diff-badge');
    const speedDisplay = this.container.querySelector('.hud-speed-display');
    const cashoutDisplay = this.container.querySelector('.hud-cashout-display');

    if (minuteBadge) minuteBadge.textContent = `${cm.minute}'`;
    if (oddJustaDisplay) oddJustaDisplay.textContent = cm.oddJusta.toFixed(2);
    if (bloco1Display) bloco1Display.textContent = `${cm.topo1.toFixed(2)} ➔ ${cm.fundo1.toFixed(2)}`;
    if (bloco2Display) bloco2Display.textContent = `${cm.topo2.toFixed(2)} ➔ ${cm.fundo2.toFixed(2)}`;

    if (speedDisplay) {
      speedDisplay.textContent = `⚡ ${this.state.ticksPorMinuto} ticks/min (${this.state.pctPorMinuto}%/min)`;
    }

    if (zoneBadge) {
      zoneBadge.className = `zone-badge ${
        cm.zona === 'Rápida' ? 'zone-rapida' : (cm.zona === 'Média' ? 'zone-media' : 'zone-lenta')
      }`;
      zoneBadge.textContent = `Zona ${cm.zona}`;
    }

    // Diferença % Mercado vs Justa
    if (valueDiffBadge) {
      const live = parseFloat(this.state.liveOddCurrentMinute);
      if (live && live > 1.0) {
        const diff = ((live / cm.oddJusta) - 1) * 100;
        const sign = diff > 0 ? '+' : '';
        const isGood = diff > 0.5; // Odd acima da justa = valor no Under
        const isBad = diff < -0.5;

        valueDiffBadge.className = `hud-diff-badge ${isGood ? 'diff-good' : (isBad ? 'diff-bad' : 'diff-fair')}`;
        valueDiffBadge.innerHTML = `
          <span>DIF:</span>
          <strong>${sign}${diff.toFixed(1)}% ${isGood ? '📈 VALOR' : (isBad ? '📉 CARO' : '⚖️ JUSTO')}</strong>
        `;
      } else {
        valueDiffBadge.className = `hud-diff-badge diff-fair`;
        valueDiffBadge.innerHTML = `<span>DIF:</span><strong>0.0% ⚖️ JUSTO</strong>`;
      }
    }

    // Cashout retorno
    if (cashoutDisplay) {
      const sign = hedge.lucroLiquido > 0 ? '+' : '';
      const isGreen = hedge.lucroLiquido > 0.01;
      const isRed = hedge.lucroLiquido < -0.01;
      cashoutDisplay.className = `hud-cashout-display ${isGreen ? 'text-green' : (isRed ? 'text-red' : 'text-primary')}`;
      cashoutDisplay.textContent = `${sign}${formatCurrency(hedge.lucroLiquido)} (${sign}${formatPercent(hedge.roiPct)})`;
    }

    if (this.state.inTrade) {
      this.container.classList.add('active-trade');
    } else {
      this.container.classList.remove('active-trade');
    }

    // Atualiza mini contexto de minutos anteriores e próximos
    this.updateContextMiniRows();
  }

  updateContextMiniRows() {
    const prevEl = this.container.querySelector('.hud-prev-minute');
    const nextEl = this.container.querySelector('.hud-next-minute');
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);

    if (prevEl) {
      const prevMin = this.state.currentMinute - 1;
      if (prevMin >= minStart) {
        const prevM = getMinuteMetrics(this.state.minuteCurve, prevMin);
        prevEl.innerHTML = `<span>${prevMin}':</span> <strong>${prevM.oddJusta.toFixed(2)}</strong>`;
      } else {
        prevEl.innerHTML = `<span>-</span>`;
      }
    }

    if (nextEl) {
      const nextMin = this.state.currentMinute + 1;
      if (nextMin <= maxMin) {
        const nextM = getMinuteMetrics(this.state.minuteCurve, nextMin);
        nextEl.innerHTML = `<span>${nextMin}':</span> <strong>${nextM.oddJusta.toFixed(2)}</strong>`;
      } else {
        nextEl.innerHTML = `<span>Fim</span>`;
      }
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

      // Ao completar 60s, avança o minuto
      const isHT = this.state.period === 'HT';
      const baseMin = isHT ? 1 : 46;
      const calcMinute = baseMin + Math.floor(this.state.timerSeconds / 60);
      const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);

      if (calcMinute !== this.state.currentMinute && calcMinute <= maxMin) {
        this.setMinute(calcMinute);
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
    this.setMinute(this.state.period === 'HT' ? 1 : 46);
  }

  updateTimerDisplay() {
    const timerDisplay = this.container.querySelector('.timer-display');
    if (timerDisplay) {
      const isHT = this.state.period === 'HT';
      const minStart = isHT ? 1 : 46;
      const minutes = minStart + Math.floor(this.state.timerSeconds / 60);
      const seconds = this.state.timerSeconds % 60;
      timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}'`;
    }
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
    const initialOddInput = this.container.querySelector('.hud-initial-odd-input');
    if (initialOddInput) {
      initialOddInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 1.01) {
          this.setInitialOdd(val);
        }
      });
    }

    // Acréscimos
    const addedMinutesInput = this.container.querySelector('.hud-added-min-input');
    if (addedMinutesInput) {
      addedMinutesInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.state.addedMinutes = isNaN(val) || val < 0 ? 0 : val;
        this.recomputeCurve();
        this.recalculate();
      });
    }

    // Sincronização Minuto na TV
    const tvMinInput = this.container.querySelector('.hud-tv-min-input');
    const syncBtn = this.container.querySelector('.hud-sync-btn');
    if (syncBtn && tvMinInput) {
      syncBtn.addEventListener('click', () => {
        const minVal = parseInt(tvMinInput.value, 10);
        if (!isNaN(minVal)) {
          this.syncFromTV(minVal);
        }
      });
      tvMinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const minVal = parseInt(tvMinInput.value, 10);
          if (!isNaN(minVal)) this.syncFromTV(minVal);
        }
      });
    }

    // Odd Live no Minuto Atual
    const liveInput = this.container.querySelector('.hud-live-odd-input');
    if (liveInput) {
      liveInput.addEventListener('input', (e) => {
        this.state.liveOddCurrentMinute = e.target.value.trim();
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val > 1.0) {
          this.state.liveCorrections[this.state.currentMinute] = val;
        } else {
          delete this.state.liveCorrections[this.state.currentMinute];
        }
        this.recalculate();
      });
    }

    // Botões de Minuto (+1 / -1)
    const btnMinMinus = this.container.querySelector('.hud-min-minus');
    const btnMinPlus = this.container.querySelector('.hud-min-plus');
    if (btnMinMinus) btnMinMinus.addEventListener('click', () => this.setMinute(this.state.currentMinute - 1));
    if (btnMinPlus) btnMinPlus.addEventListener('click', () => this.setMinute(this.state.currentMinute + 1));

    // Botões de Gol (Favor x2.5 / Contra /2.5)
    const btnGolFav = this.container.querySelector('.hud-gol-fav-btn');
    const btnGolContra = this.container.querySelector('.hud-gol-contra-btn');
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

    // Ações de Trade
    const enterTradeBtn = this.container.querySelector('.hud-enter-trade-btn');
    const cashoutBtn = this.container.querySelector('.hud-cashout-btn');
    const resetSlotBtn = this.container.querySelector('.hud-reset-slot-btn');

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
        const liveOdd = parseFloat(this.state.liveOddCurrentMinute) || (this.state.currentMetrics ? this.state.currentMetrics.oddJusta : this.state.initialOdd);
        const hedge = calculateHedge({
          oddEntrada: this.state.initialOdd,
          stakeEntrada: this.state.stakeBase,
          oddAtual: liveOdd,
          comissaoPct: 0.0325
        });

        if (this.onTradeCompleted) {
          this.onTradeCompleted({
            gameName: this.state.gameName,
            strategyName: `Back Under ${this.state.period} (Min ${this.state.currentMinute}')`,
            oddEntrada: this.state.initialOdd,
            oddSaida: liveOdd,
            stake: this.state.stakeBase,
            lucroLiquido: hedge.lucroLiquido,
            roiPct: hedge.roiPct,
            ticks: calculateTicksDistance(this.state.initialOdd, liveOdd)
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
        this.state.liveOddCurrentMinute = '';
        this.setInitialOdd(this.state.period === 'HT' ? 3.35 : 5.10);
      });
    }
  }

  render() {
    const isHT = this.state.period === 'HT';

    this.container.innerHTML = `
      <!-- Topo do Card -->
      <div class="hud-card-header">
        <div style="display: flex; align-items: center; gap: 0.4rem; flex: 1;">
          <span class="game-slot-badge">SLOT #${this.slotId}</span>
          <input type="text" class="game-title-input" value="${this.state.gameName}" placeholder="Nome do Jogo">
        </div>

        <div class="period-toggle-group">
          <button class="period-tab-btn ${isHT ? 'active' : ''}" data-period="HT">1ºT (HT)</button>
          <button class="period-tab-btn ${!isHT ? 'active' : ''}" data-period="FT">2ºT (FT)</button>
        </div>

        <div class="game-timer-box">
          <span class="timer-display">${isHT ? '01:00' : '46:00'}'</span>
          <button class="timer-btn timer-play-pause-btn" title="Iniciar / Pausar">▶️</button>
          <button class="timer-btn timer-reset-btn" title="Zerar">🔄</button>
        </div>
      </div>

      <div class="hud-card-body">
        <!-- Linha 1: Configuração Inicial + Sincronização na TV -->
        <div class="hud-config-bar">
          <!-- Odd Inicial -->
          <div class="hud-input-box-yellow">
            <span class="hud-input-label">🎯 Odd Inicial:</span>
            <input type="number" step="0.01" class="hud-input-field hud-initial-odd-input" value="${this.state.initialOdd.toFixed(2)}">
          </div>

          <!-- Acréscimos -->
          <div class="hud-input-box-compact">
            <span class="hud-input-label">➕ Acr:</span>
            <input type="number" class="hud-input-field hud-added-min-input" value="${this.state.addedMinutes}" style="width: 38px;">
          </div>

          <!-- Sincronização Minuto na TV -->
          <div class="hud-sync-box">
            <span class="hud-input-label">📺 Minuto TV:</span>
            <input type="number" class="hud-input-field hud-tv-min-input" value="${this.state.currentMinute}" style="width: 44px;">
            <button class="btn btn-primary btn-sm hud-sync-btn" title="Sincronizar e Iniciar Cronômetro">⚡ Sync</button>
          </div>
        </div>

        <!-- Linha 2: A LINHA MESTRA DO MINUTO ATUAL (Destaque Principal) -->
        <div class="hud-main-minute-banner">
          <div class="hud-banner-top-row">
            <!-- Minuto Badge & Stepper -->
            <div style="display: flex; align-items: center; gap: 0.35rem;">
              <span class="hud-minute-badge">${this.state.currentMinute}'</span>
              <div style="display: flex; flex-direction: column; gap: 1px;">
                <button class="hud-step-mini-btn hud-min-plus" title="+1 minuto">▲</button>
                <button class="hud-step-mini-btn hud-min-minus" title="-1 minuto">▼</button>
              </div>
            </div>

            <!-- Odd Justa (Valor Gigante) -->
            <div class="hud-metric-group">
              <span class="hud-metric-label">ODD JUSTA</span>
              <span class="hud-odd-justa">0.00</span>
            </div>

            <!-- Campo de Odd Live no Minuto Atual -->
            <div class="hud-metric-group" style="background: rgba(0,0,0,0.4); padding: 0.2rem 0.5rem; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3);">
              <span class="hud-metric-label" style="color: var(--color-cyan);">ODD MERCADO LIVE</span>
              <input type="number" step="0.01" class="hud-live-odd-input" placeholder="Ex: 2.26" value="${this.state.liveOddCurrentMinute}">
            </div>

            <!-- Diferença % (Valor) -->
            <div class="hud-diff-badge diff-fair">
              <span>DIF:</span>
              <strong>0.0% ⚖️</strong>
            </div>

            <!-- Zona -->
            <span class="zone-badge hud-zone-badge zone-media">Zona Média</span>
          </div>

          <!-- Linha Inferior do Banner: Blocos e Velocidade -->
          <div class="hud-banner-bottom-row">
            <div class="hud-bloco-col">
              <span class="hud-bloco-title">Bloco Justo 1:</span>
              <span class="hud-bloco-val hud-bloco1">-</span>
            </div>
            <div class="hud-bloco-col">
              <span class="hud-bloco-title">Bloco Justo 2:</span>
              <span class="hud-bloco-val hud-bloco2">-</span>
            </div>
            <div class="hud-bloco-col" style="text-align: right;">
              <span class="hud-speed-display">⚡ 0 ticks/min</span>
            </div>
          </div>
        </div>

        <!-- Mini-Fita de Contexto (Minuto Anterior e Próximo) -->
        <div class="hud-mini-context-strip">
          <div class="hud-context-item hud-prev-minute"><span>-</span></div>
          <div class="hud-context-active"><span>📍 Ponto Atual</span></div>
          <div class="hud-context-item hud-next-minute"><span>-</span></div>
        </div>

        <!-- Botões de Ação Rápida e Gols -->
        <div class="hud-quick-actions">
          <div style="display: flex; gap: 0.35rem; flex: 1;">
            <button class="btn btn-secondary btn-sm hud-gol-fav-btn" title="Gol a Favor (x2.5)" style="flex: 1; padding: 0.25rem 0.4rem; font-size: 0.7rem;">⚽ Gol Fav (x2.5)</button>
            <button class="btn btn-secondary btn-sm hud-gol-contra-btn" title="Gol Contra (/2.5)" style="flex: 1; padding: 0.25rem 0.4rem; font-size: 0.7rem; color: #f87171;">🔴 Gol Contra (/2.5)</button>
          </div>

          <div style="display: flex; align-items: center; gap: 0.4rem; background: var(--bg-surface); padding: 0.25rem 0.5rem; border-radius: 6px; border: 1px solid var(--border-subtle);">
            <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700;">CASHOUT:</span>
            <span class="hud-cashout-display text-green" style="font-family: var(--font-mono); font-size: 0.8rem; font-weight: 800;">R$ 0,00</span>
          </div>
        </div>

        <!-- Botões Finais de Operação -->
        <div class="hud-bottom-actions">
          <button class="btn btn-secondary btn-sm hud-enter-trade-btn">🎯 Abrir Posição</button>
          <button class="btn btn-success btn-sm hud-cashout-btn">💰 Fechar (Cashout)</button>
          <button class="btn btn-secondary btn-sm hud-reset-slot-btn" style="flex: 0.2;" title="Resetar Slot">🔄</button>
        </div>
      </div>
    `;
  }
}

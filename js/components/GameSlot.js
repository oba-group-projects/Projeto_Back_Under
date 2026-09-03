/**
 * Componente do Slot de Jogo Individual - Cockpit de Alta Visibilidade (HUD V2)
 * Focado nos Blocos 1 & 2 em destaque gigante, inputs amarelos e sistema de eventos de jogo.
 */
import { calculateMinuteCurve, getMinuteMetrics, applyGoalOddShift } from '../core/minuteDecayEngine.js';
import { moveOddTicks, calculateTicksDistance, formatCurrency, formatPercent } from '../core/oddsCalculator.js';
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
      liveOddCurrentMinute: '', // odd informada no minuto atual
      liveCorrections: {}, // overrides por minuto
      
      // Estado de Evento Ativo
      activeEvent: null, // null | 'gol' | 'vermelho' | 'var' | 'penalti'
      eventSuggestedOdd: 0,
      
      // Velocidade do tempo
      ticksPorMinuto: 0,
      pctPorMinuto: 0,
      
      // Métricas calculadas
      minuteCurve: [],
      currentMetrics: null,
      
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
    this.state.activeEvent = null;
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
    
    // Ao mudar o minuto, limpa a odd live para aguardar a nova leitura do minuto atual
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

  triggerEvent(eventType) {
    this.state.activeEvent = eventType;
    const cm = this.state.currentMetrics;
    const currentOdd = parseFloat(this.state.liveOddCurrentMinute) || (cm ? cm.oddJusta : this.state.initialOdd);
    
    if (eventType === 'gol') {
      this.state.eventSuggestedOdd = applyGoalOddShift(currentOdd, true);
    } else {
      this.state.eventSuggestedOdd = currentOdd;
    }

    this.renderEventBanner();
  }

  confirmEventRecalibration(newOdd) {
    const parsedOdd = parseFloat(newOdd);
    if (!isNaN(parsedOdd) && parsedOdd >= 1.01) {
      this.state.liveOddCurrentMinute = parsedOdd.toFixed(2);
      this.state.liveCorrections[this.state.currentMinute] = parsedOdd;
      
      const liveInput = this.container.querySelector('.hud-live-odd-input');
      if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;
      
      this.recomputeCurve();
      this.recalculate();
    }
    this.state.activeEvent = null;
    this.renderEventBanner();
  }

  cancelEvent() {
    this.state.activeEvent = null;
    this.renderEventBanner();
  }

  recalculate() {
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    const cm = this.state.currentMetrics;
    if (!cm) return;

    this.updateUI();
  }

  updateUI() {
    const cm = this.state.currentMetrics;
    if (!cm) return;

    // Minuto e Odd Justa
    const minuteBadge = this.container.querySelector('.hud-minute-badge');
    const oddJustaDisplay = this.container.querySelector('.hud-odd-justa');
    const zoneBadge = this.container.querySelector('.hud-zone-badge');
    const valueDiffBadge = this.container.querySelector('.hud-diff-badge');

    // Blocos Grandes
    const bloco1Topo = this.container.querySelector('.bloco1-topo-val');
    const bloco1Fundo = this.container.querySelector('.bloco1-fundo-val');
    const bloco2Topo = this.container.querySelector('.bloco2-topo-val');
    const bloco2Fundo = this.container.querySelector('.bloco2-fundo-val');

    if (minuteBadge) minuteBadge.textContent = `${cm.minute}'`;
    if (oddJustaDisplay) oddJustaDisplay.textContent = cm.oddJusta.toFixed(2);

    if (bloco1Topo) bloco1Topo.textContent = cm.topo1.toFixed(2);
    if (bloco1Fundo) bloco1Fundo.textContent = cm.fundo1.toFixed(2);
    if (bloco2Topo) bloco2Topo.textContent = cm.topo2.toFixed(2);
    if (bloco2Fundo) bloco2Fundo.textContent = cm.fundo2.toFixed(2);

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
        const isGood = diff > 0.5;
        const isBad = diff < -0.5;

        valueDiffBadge.className = `hud-diff-badge ${isGood ? 'diff-good' : (isBad ? 'diff-bad' : 'diff-fair')}`;
        valueDiffBadge.innerHTML = `
          <span>DIF:</span>
          <strong>${sign}${diff.toFixed(1)}% ${isGood ? '📈 VALOR UNDER' : (isBad ? '📉 CARO' : '⚖️ JUSTO')}</strong>
        `;
      } else {
        valueDiffBadge.className = `hud-diff-badge diff-fair`;
        valueDiffBadge.innerHTML = `<span>DIF:</span><strong>0.0% ⚖️ JUSTO</strong>`;
      }
    }
  }

  renderEventBanner() {
    const eventContainer = this.container.querySelector('.hud-event-modal-container');
    if (!eventContainer) return;

    if (!this.state.activeEvent) {
      eventContainer.style.display = 'none';
      eventContainer.innerHTML = '';
      return;
    }

    const eventNames = {
      gol: '⚽ GOL',
      vermelho: '🟥 CARTÃO VERMELHO',
      var: '⏸️ VAR / PARADA TÉCNICA',
      penalti: '🎯 PÊNALTI'
    };

    const title = eventNames[this.state.activeEvent] || 'EVENTO';

    eventContainer.style.display = 'block';
    eventContainer.innerHTML = `
      <div class="hud-event-banner">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 800; color: #facc15; font-size: 0.75rem;">${title} no minuto ${this.state.currentMinute}'</span>
          <button class="event-close-btn">&times;</button>
        </div>
        <p style="font-size: 0.68rem; color: var(--text-secondary); margin: 0.2rem 0;">
          Quando o mercado reabrir, digite a nova Odd para recalibrar a curva até o final do jogo:
        </p>
        <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.3rem;">
          <span style="font-size: 0.7rem; font-weight: 700; color: #fff;">Odd Retorno:</span>
          <input type="number" step="0.01" class="event-odd-input" value="${this.state.eventSuggestedOdd.toFixed(2)}" style="width: 75px; background: #000; border: 1.5px solid #facc15; color: #facc15; font-family: var(--font-mono); font-weight: 800; font-size: 0.95rem; text-align: center; border-radius: 4px; padding: 0.15rem 0.3rem;">
          <button class="btn btn-success btn-sm event-confirm-btn" style="padding: 0.25rem 0.55rem; font-size: 0.75rem;">✔️ Confirmar e Recalibrar</button>
        </div>
      </div>
    `;

    // Bind dos botões do banner
    const confirmBtn = eventContainer.querySelector('.event-confirm-btn');
    const closeBtn = eventContainer.querySelector('.event-close-btn');
    const oddInput = eventContainer.querySelector('.event-odd-input');

    if (confirmBtn && oddInput) {
      confirmBtn.addEventListener('click', () => {
        this.confirmEventRecalibration(oddInput.value);
      });
      oddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.confirmEventRecalibration(oddInput.value);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.cancelEvent());
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

    // Acréscimos (Campo Amarelo)
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

    // Botões de Eventos de Jogo (Gol, Vermelho, VAR, Pênalti)
    this.container.querySelectorAll('[data-event-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        const eventType = btn.getAttribute('data-event-type');
        this.triggerEvent(eventType);
      });
    });

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
        <!-- Linha 1: Configuração Inicial Obrigatória (Destaque Amarelo) -->
        <div class="hud-config-bar">
          <!-- Odd Inicial -->
          <div class="hud-yellow-box">
            <span class="hud-yellow-label">🎯 ODD INICIAL:</span>
            <input type="number" step="0.01" class="hud-yellow-input hud-initial-odd-input" value="${this.state.initialOdd.toFixed(2)}">
          </div>

          <!-- Acréscimos -->
          <div class="hud-yellow-box" style="flex: 0.65;">
            <span class="hud-yellow-label">➕ ACR:</span>
            <input type="number" class="hud-yellow-input hud-added-min-input" value="${this.state.addedMinutes}" style="width: 40px;">
          </div>

          <!-- Sincronização Minuto na TV -->
          <div class="hud-yellow-box hud-sync-box" style="flex: 1.2;">
            <span class="hud-yellow-label">📺 MINUTO TV:</span>
            <input type="number" class="hud-yellow-input hud-tv-min-input" value="${this.state.currentMinute}" style="width: 44px;">
            <button class="btn btn-primary btn-sm hud-sync-btn" title="Sincronizar e Iniciar Cronômetro">⚡ Sync</button>
          </div>
        </div>

        <!-- Linha 2: O PAINEL PRINCIPAL DO MINUTO ATUAL -->
        <div class="hud-main-minute-banner">
          
          <!-- Top Row: Minuto, Odd Justa, Odd Live e Desvio -->
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
            <div class="hud-yellow-box" style="padding: 0.2rem 0.5rem; background: rgba(0,0,0,0.5); border-color: #facc15;">
              <span class="hud-yellow-label" style="font-size: 0.6rem;">ODD LIVE:</span>
              <input type="number" step="0.01" class="hud-yellow-input hud-live-odd-input" placeholder="Ex: 2.26" value="${this.state.liveOddCurrentMinute}" style="width: 72px; font-size: 1.15rem; color: #facc15;">
            </div>

            <!-- Diferença % (Valor) -->
            <div class="hud-diff-badge diff-fair">
              <span>DIF:</span>
              <strong>0.0% ⚖️</strong>
            </div>

            <!-- Zona -->
            <span class="zone-badge hud-zone-badge zone-media">Zona Média</span>
          </div>

          <!-- BLOCOS 1 E 2 EM DESTAQUE GIGANTE (Topo e Fundo) -->
          <div class="hud-blocos-giant-grid">
            <!-- Card Bloco Justo 1 -->
            <div class="giant-bloco-card card-bloco1">
              <div class="giant-bloco-header">
                <span class="giant-bloco-title">🛡️ BLOCO JUSTO 1</span>
              </div>
              <div class="giant-bloco-body">
                <div class="bloco-subcol">
                  <span class="bloco-sublabel">TOPO</span>
                  <span class="bloco-big-number bloco1-topo-val">0.00</span>
                </div>
                <div class="bloco-arrow">➔</div>
                <div class="bloco-subcol">
                  <span class="bloco-sublabel">FUNDO</span>
                  <span class="bloco-big-number bloco1-fundo-val">0.00</span>
                </div>
              </div>
            </div>

            <!-- Card Bloco Justo 2 -->
            <div class="giant-bloco-card card-bloco2">
              <div class="giant-bloco-header">
                <span class="giant-bloco-title">🛡️ BLOCO JUSTO 2</span>
              </div>
              <div class="giant-bloco-body">
                <div class="bloco-subcol">
                  <span class="bloco-sublabel">TOPO</span>
                  <span class="bloco-big-number bloco2-topo-val">0.00</span>
                </div>
                <div class="bloco-arrow">➔</div>
                <div class="bloco-subcol">
                  <span class="bloco-sublabel">FUNDO</span>
                  <span class="bloco-big-number bloco2-fundo-val">0.00</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Container do Banner de Evento Ativo (Oculto até disparar evento) -->
        <div class="hud-event-modal-container" style="display: none;"></div>

        <!-- Linha 3: Barra de Eventos Rápidos do Jogo -->
        <div class="hud-events-bar">
          <span class="hud-events-title">⚡ EVENTOS:</span>
          <div class="hud-events-buttons">
            <button class="btn btn-secondary btn-sm event-btn" data-event-type="gol" title="Registrar Gol e Recalibrar Curva">⚽ Gol</button>
            <button class="btn btn-secondary btn-sm event-btn" data-event-type="vermelho" title="Registrar Cartão Vermelho">🟥 Vermelho</button>
            <button class="btn btn-secondary btn-sm event-btn" data-event-type="var" title="Registrar VAR ou Parada Técnica">⏸️ VAR/Parada</button>
            <button class="btn btn-secondary btn-sm event-btn" data-event-type="penalti" title="Registrar Pênalti">🎯 Pênalti</button>
          </div>
        </div>

      </div>
    `;
  }
}

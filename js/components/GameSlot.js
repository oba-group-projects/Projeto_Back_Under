/**
 * Componente do Slot de Jogo Individual - Cockpit de Alta Visibilidade (HUD V4)
 * - Destaque Hero para Minuto Atual e Odd Justa (tamanho gigante)
 * - Diferença % centralizada diretamente abaixo da Odd Justa
 * - Zona de velocidade destacada com cores vivas (Rápida 🟢, Média 🟡, Lenta 🔵)
 * - Blocos 1 e 2 com células Topo (Azul Pastel) e Fundo (Rosa Pastel) da imagem do usuário
 * - Painel de Evento simplificado (Minuto + Nova Odd + Botão Recalcular)
 */
import { calculateMinuteCurve, getMinuteMetrics } from '../core/minuteDecayEngine.js';
import { moveOddTicks } from '../core/oddsCalculator.js';
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
      tvMinuteInput: 1,
      currentMinute: 1,
      liveOddCurrentMinute: '', // odd informada no minuto atual
      liveCorrections: {}, // overrides por minuto
      
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
    const startMin = period === 'HT' ? 1 : 46;
    this.state.currentMinute = startMin;
    this.state.tvMinuteInput = startMin;
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
    const val = Number(odd);
    if (!isNaN(val) && val >= 1.01) {
      this.state.initialOdd = val;
      const oddInput = this.container.querySelector('.hud-initial-odd-input');
      if (oddInput) oddInput.value = val.toFixed(2);
      this.recomputeCurve();
      this.recalculate();
    }
  }

  adjustInitialOdd(ticks) {
    const newOdd = moveOddTicks(this.state.initialOdd, ticks);
    this.setInitialOdd(newOdd);
  }

  setAddedMinutes(mins) {
    const val = parseInt(mins, 10);
    this.state.addedMinutes = isNaN(val) || val < 0 ? 0 : val;
    const addedInput = this.container.querySelector('.hud-added-min-input');
    if (addedInput) addedInput.value = this.state.addedMinutes;
    this.recomputeCurve();
    this.recalculate();
  }

  adjustAddedMinutes(delta) {
    this.setAddedMinutes(this.state.addedMinutes + delta);
  }

  setTVMinute(mins) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    const val = parseInt(mins, 10);
    this.state.tvMinuteInput = Math.max(minStart, Math.min(maxMin, isNaN(val) ? minStart : val));
    const tvInput = this.container.querySelector('.hud-tv-min-input');
    if (tvInput) tvInput.value = this.state.tvMinuteInput;
  }

  adjustTVMinute(delta) {
    this.setTVMinute((parseInt(this.state.tvMinuteInput, 10) || this.state.currentMinute) + delta);
  }

  setMinute(min) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    const newMin = Math.max(minStart, Math.min(maxMin, parseInt(min, 10) || minStart));
    
    // Ao mudar o minuto, atualiza os campos
    this.state.currentMinute = newMin;
    this.state.tvMinuteInput = newMin;
    this.state.liveOddCurrentMinute = this.state.liveCorrections[newMin] ? this.state.liveCorrections[newMin].toString() : '';
    this.state.timerSeconds = (newMin - minStart) * 60;
    
    const liveInput = this.container.querySelector('.hud-live-odd-input');
    if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;

    const tvMinInput = this.container.querySelector('.hud-tv-min-input');
    if (tvMinInput) tvMinInput.value = newMin;

    const eventMinInput = this.container.querySelector('.event-min-input');
    if (eventMinInput) eventMinInput.value = newMin;

    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    this.recalculate();
    this.updateTimerDisplay();
  }

  adjustCurrentMinute(delta) {
    this.setMinute(this.state.currentMinute + delta);
  }

  syncFromTV() {
    const min = parseInt(this.state.tvMinuteInput, 10) || this.state.currentMinute;
    this.setMinute(min);
    this.startTimer();
  }

  applyEventOverride(minute, newOdd) {
    const targetMin = parseInt(minute, 10) || this.state.currentMinute;
    const parsedOdd = parseFloat(newOdd);
    if (!isNaN(parsedOdd) && parsedOdd >= 1.01) {
      this.state.liveCorrections[targetMin] = parsedOdd;
      if (targetMin === this.state.currentMinute) {
        this.state.liveOddCurrentMinute = parsedOdd.toFixed(2);
        const liveInput = this.container.querySelector('.hud-live-odd-input');
        if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;
      }
      this.recomputeCurve();
      this.recalculate();
    }
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
    const minuteBadge = this.container.querySelector('.hud-minute-hero-badge');
    const oddJustaDisplay = this.container.querySelector('.hud-odd-justa-hero');
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

    // Zona com cores e badges destacados
    if (zoneBadge) {
      const zClass = cm.zona === 'Rápida' ? 'zone-rapida' : (cm.zona === 'Média' || cm.zona === 'Normal' ? 'zone-media' : 'zone-lenta');
      const zIcon = cm.zona === 'Rápida' ? '🟢' : (cm.zona === 'Média' || cm.zona === 'Normal' ? '🟡' : '🔵');
      zoneBadge.className = `zone-badge ${zClass}`;
      zoneBadge.innerHTML = `<span>${zIcon} ZONA ${cm.zona.toUpperCase()}</span>`;
    }

    // Diferença % Centralizada abaixo da Odd Justa
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

    // Odd Inicial (Input + Botão Set + Steppers + / -)
    const initialOddInput = this.container.querySelector('.hud-initial-odd-input');
    const setOddBtn = this.container.querySelector('.hud-set-odd-btn');
    const oddMinusBtn = this.container.querySelector('.hud-odd-minus-btn');
    const oddPlusBtn = this.container.querySelector('.hud-odd-plus-btn');

    if (initialOddInput) {
      initialOddInput.addEventListener('change', (e) => this.setInitialOdd(e.target.value));
      initialOddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.setInitialOdd(e.target.value);
      });
    }
    if (setOddBtn && initialOddInput) {
      setOddBtn.addEventListener('click', () => this.setInitialOdd(initialOddInput.value));
    }
    if (oddMinusBtn) {
      oddMinusBtn.addEventListener('click', () => this.adjustInitialOdd(-1));
    }
    if (oddPlusBtn) {
      oddPlusBtn.addEventListener('click', () => this.adjustInitialOdd(1));
    }

    // Acréscimos (Input + Steppers + / -)
    const addedMinutesInput = this.container.querySelector('.hud-added-min-input');
    const addedMinusBtn = this.container.querySelector('.hud-added-minus-btn');
    const addedPlusBtn = this.container.querySelector('.hud-added-plus-btn');

    if (addedMinutesInput) {
      addedMinutesInput.addEventListener('change', (e) => this.setAddedMinutes(e.target.value));
      addedMinutesInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.setAddedMinutes(e.target.value);
      });
    }
    if (addedMinusBtn) {
      addedMinusBtn.addEventListener('click', () => this.adjustAddedMinutes(-1));
    }
    if (addedPlusBtn) {
      addedPlusBtn.addEventListener('click', () => this.adjustAddedMinutes(1));
    }

    // Sincronização Minuto na TV (Input + Steppers + / - + Botão Sync)
    const tvMinInput = this.container.querySelector('.hud-tv-min-input');
    const syncBtn = this.container.querySelector('.hud-sync-btn');
    const tvMinusBtn = this.container.querySelector('.hud-tv-minus-btn');
    const tvPlusBtn = this.container.querySelector('.hud-tv-plus-btn');

    if (tvMinInput) {
      tvMinInput.addEventListener('change', (e) => this.setTVMinute(e.target.value));
      tvMinInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.syncFromTV();
      });
    }
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncFromTV());
    }
    if (tvMinusBtn) {
      tvMinusBtn.addEventListener('click', () => this.adjustTVMinute(-1));
    }
    if (tvPlusBtn) {
      tvPlusBtn.addEventListener('click', () => this.adjustTVMinute(1));
    }

    // Odd Live no Minuto Atual (Input rápido)
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
      liveInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = parseFloat(e.target.value);
          if (!isNaN(val) && val > 1.0) {
            this.applyEventOverride(this.state.currentMinute, val);
          }
        }
      });
    }

    // Botões de Minuto Atual no Painel Central (▲ / ▼)
    const btnMinMinus = this.container.querySelector('.hud-min-minus');
    const btnMinPlus = this.container.querySelector('.hud-min-plus');
    if (btnMinMinus) btnMinMinus.addEventListener('click', () => this.adjustCurrentMinute(-1));
    if (btnMinPlus) btnMinPlus.addEventListener('click', () => this.adjustCurrentMinute(1));

    // Módulo de Eventos de Jogo / Retorno
    const eventMinInput = this.container.querySelector('.event-min-input');
    const eventOddInput = this.container.querySelector('.event-odd-input');
    const eventApplyBtn = this.container.querySelector('.event-apply-btn');

    if (eventApplyBtn && eventOddInput && eventMinInput) {
      eventApplyBtn.addEventListener('click', () => {
        this.applyEventOverride(eventMinInput.value, eventOddInput.value);
      });
      eventOddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.applyEventOverride(eventMinInput.value, eventOddInput.value);
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
        
        <!-- Linha 1: Configuração Obrigatória (Campos Amarelos com Botões + e -) -->
        <div class="hud-config-bar">
          
          <!-- Odd Inicial -->
          <div class="hud-input-cell-yellow">
            <span class="hud-cell-label">🎯 ODD INICIAL:</span>
            <div class="hud-cell-input-row">
              <button class="hud-mini-stepper-btn hud-odd-minus-btn" title="Diminuir Odd">-</button>
              <input type="number" step="0.01" class="hud-yellow-field hud-initial-odd-input" value="${this.state.initialOdd.toFixed(2)}">
              <button class="hud-mini-stepper-btn hud-odd-plus-btn" title="Aumentar Odd">+</button>
              <button class="hud-mini-action-btn hud-set-odd-btn" title="Aplicar Odd">⚡</button>
            </div>
          </div>

          <!-- Acréscimos -->
          <div class="hud-input-cell-yellow" style="flex: 0.7;">
            <span class="hud-cell-label">➕ ACR:</span>
            <div class="hud-cell-input-row">
              <button class="hud-mini-stepper-btn hud-added-minus-btn" title="Diminuir Acréscimo">-</button>
              <input type="number" class="hud-yellow-field hud-added-min-input" value="${this.state.addedMinutes}" style="width: 36px;">
              <button class="hud-mini-stepper-btn hud-added-plus-btn" title="Aumentar Acréscimo">+</button>
            </div>
          </div>

          <!-- Minuto TV e Sincronização -->
          <div class="hud-input-cell-yellow" style="flex: 1.15;">
            <span class="hud-cell-label">📺 MINUTO TV:</span>
            <div class="hud-cell-input-row">
              <button class="hud-mini-stepper-btn hud-tv-minus-btn" title="Minuto Anterior">-</button>
              <input type="number" class="hud-yellow-field hud-tv-min-input" value="${this.state.tvMinuteInput}" style="width: 40px;">
              <button class="hud-mini-stepper-btn hud-tv-plus-btn" title="Próximo Minuto">+</button>
              <button class="btn btn-primary btn-sm hud-sync-btn" title="Sincronizar Minuto e Iniciar Cronômetro">⚡ Sync</button>
            </div>
          </div>

        </div>

        <!-- Linha 2: O PAINEL PRINCIPAL DO MINUTO ATUAL (HERO DESTAQUE) -->
        <div class="hud-main-minute-banner">
          
          <!-- Cabeçalho do Painel: Minuto Gigante, Coluna Central Odd Justa + Diferença %, e Odd Live + Zona -->
          <div class="hud-hero-metrics-grid">
            
            <!-- Coluna 1: Minuto Atual Gigante -->
            <div class="hud-minute-hero-col">
              <span class="hud-metric-label">MINUTO</span>
              <div style="display: flex; align-items: center; gap: 0.25rem;">
                <span class="hud-minute-hero-badge">${this.state.currentMinute}'</span>
                <div style="display: flex; flex-direction: column; gap: 1px;">
                  <button class="hud-step-mini-btn hud-min-plus" title="+1 minuto">▲</button>
                  <button class="hud-step-mini-btn hud-min-minus" title="-1 minuto">▼</button>
                </div>
              </div>
            </div>

            <!-- Coluna 2 Central: Odd Justa Gigante + DIFERENÇA % Centralizada Abaixo -->
            <div class="hud-odd-justa-central-col">
              <span class="hud-metric-label">ODD JUSTA DO MINUTO</span>
              <span class="hud-odd-justa-hero">0.00</span>
              
              <!-- DIFERENÇA % CENTRALIZADA LOGO ABAIXO DA ODD JUSTA -->
              <div class="hud-diff-badge diff-fair">
                <span>DIF:</span>
                <strong>0.0% ⚖️ JUSTO</strong>
              </div>
            </div>

            <!-- Coluna 3: Odd Live (Amarelo Claro) + Zona Destacada -->
            <div class="hud-live-zone-col">
              <!-- Campo Odd Live -->
              <div class="hud-live-cell-yellow">
                <span class="hud-live-cell-label">ODD LIVE:</span>
                <input type="number" step="0.01" class="hud-yellow-field hud-live-odd-input" placeholder="Ex: 2.26" value="${this.state.liveOddCurrentMinute}" style="width: 78px; font-size: 1.15rem; font-weight: 900;">
              </div>

              <!-- Zona Destacada com Cores Vivas -->
              <div class="zone-badge hud-zone-badge zone-media">
                <span>🟡 ZONA MÉDIA</span>
              </div>
            </div>

          </div>

          <!-- BLOCOS 1 E 2 COM AS CORES PASTEL DA IMAGEM (AZUL TOPO / ROSA FUNDO) -->
          <div class="hud-blocos-giant-grid">
            
            <!-- Card Bloco Justo 1 -->
            <div class="giant-bloco-card card-bloco1">
              <div class="giant-bloco-header">
                <span class="giant-bloco-title">🛡️ BLOCO JUSTO 1</span>
              </div>
              <div class="giant-bloco-body">
                <!-- Topo (Azul Pastel do Excel) -->
                <div class="bloco-pastel-cell bloco-topo-pastel">
                  <span class="bloco-pastel-label">TOPO</span>
                  <span class="bloco-pastel-number bloco1-topo-val">0.00</span>
                </div>
                
                <!-- Fundo (Rosa Pastel do Excel) -->
                <div class="bloco-pastel-cell bloco-fundo-pastel">
                  <span class="bloco-pastel-label">FUNDO</span>
                  <span class="bloco-pastel-number bloco1-fundo-val">0.00</span>
                </div>
              </div>
            </div>

            <!-- Card Bloco Justo 2 -->
            <div class="giant-bloco-card card-bloco2">
              <div class="giant-bloco-header">
                <span class="giant-bloco-title">🛡️ BLOCO JUSTO 2</span>
              </div>
              <div class="giant-bloco-body">
                <!-- Topo (Azul Pastel do Excel) -->
                <div class="bloco-pastel-cell bloco-topo-pastel">
                  <span class="bloco-pastel-label">TOPO</span>
                  <span class="bloco-pastel-number bloco2-topo-val">0.00</span>
                </div>
                
                <!-- Fundo (Rosa Pastel do Excel) -->
                <div class="bloco-pastel-cell bloco-fundo-pastel">
                  <span class="bloco-pastel-label">FUNDO</span>
                  <span class="bloco-pastel-number bloco2-fundo-val">0.00</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        <!-- Linha 3: REGISTRO DE EVENTO / RETORNO DE JOGO (SIMPLIFICADO) -->
        <div class="hud-event-recalc-bar">
          <span class="event-recalc-title">⚡ REGISTRAR EVENTO:</span>

          <div class="event-recalc-inputs">
            <div class="event-input-wrapper">
              <span class="event-mini-label">Minuto:</span>
              <input type="number" class="hud-yellow-field event-min-input" value="${this.state.currentMinute}" style="width: 44px; font-size: 0.9rem;">
            </div>

            <div class="event-input-wrapper">
              <span class="event-mini-label">Nova Odd:</span>
              <input type="number" step="0.01" class="hud-yellow-field event-odd-input" placeholder="Ex: 5.60" style="width: 76px; font-size: 0.95rem;">
            </div>

            <button class="btn btn-success btn-sm event-apply-btn" title="Aplicar e Recalcular Curva">✔️ Recalcular</button>
          </div>
        </div>

      </div>
    `;
  }
}

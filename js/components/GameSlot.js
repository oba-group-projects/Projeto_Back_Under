/**
 * Componente do Slot de Jogo Individual - Cockpit de Alta Visibilidade (HUD V5)
 * - Espaço maior para Minuto TV e inputs
 * - Odd Justa com card de fundo destacado
 * - Remoção de 'Ex:' de todos os placeholders
 * - Diferença % concisa (sem quebras de linha)
 * - Zona centralizada abaixo do campo de Odd Live
 * - Remoção dos botões de spinner do navegador
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
      periodStartTimes: this.loadPeriodStartTimes(),
       initialOdd: 3.35,
      currentOddBase: 3.35,
      currentOddBaseMinute: null,
       addedMinutes: 2,
      addedMinutesActive: false,
       pendingAddedMinutes: null,
       tvMinuteInput: 1,
       currentMinute: 1,
       liveMinute: 1,
       projectedMinute: 1,
       liveOddCurrentMinute: '',
       liveCorrections: {},
      timerPaused: true,
       isSimulating: false,
      sheetLog: this.loadSheetLog(),
       lastSheetRow: null,
       
       // Velocidade do tempo
       ticksPorMinuto: 0,
       pctPorMinuto: 0,
       
       // Métricas calculadas
       minuteCurve: [],
       currentMetrics: null,
       
       timerSeconds: 0,
       timerRunning: false
     };

    this.hydrateEventCorrections();
    this.timerInterval = null;
    this.recomputeCurve();
    this.render();
    this.bindEvents();
    this.recalculate();
  }

  loadSheetLog() {
    try {
      const saved = localStorage.getItem(`projeto_back_under_events_slot_${this.slotId}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  loadPeriodStartTimes() {
    try {
      const saved = localStorage.getItem(`projeto_back_under_period_start_slot_${this.slotId}`);
      return saved ? JSON.parse(saved) : { HT: null, FT: null };
    } catch (error) {
      return { HT: null, FT: null };
    }
  }

  savePeriodStartTimes() {
    try {
      localStorage.setItem(`projeto_back_under_period_start_slot_${this.slotId}`, JSON.stringify(this.state.periodStartTimes));
    } catch (error) {
      console.warn('Não foi possível salvar os horários de início.', error);
    }
  }

  formatPeriodStartTime(value) {
    if (!value) return 'não registrado';
    return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  getDisplayMinute(minute) {
    return Math.max(0, Number(minute) - 1);
  }

  registerPeriodStart(minute) {
    const startOffsetMinutes = Math.max(0, Number(minute) - (this.state.period === 'HT' ? 1 : 46));
    this.state.periodStartTimes[this.state.period] = new Date(Date.now() - startOffsetMinutes * 60000).toISOString();
    this.savePeriodStartTimes();
    this.updatePeriodStartUI();
  }

  updatePeriodStartUI() {
    const startDisplay = this.container.querySelector('.period-start-time');
    if (startDisplay) {
      startDisplay.textContent = `${this.state.period}: ${this.formatPeriodStartTime(this.state.periodStartTimes[this.state.period])}`;
    }
  }

  saveSheetLog() {
    try {
      localStorage.setItem(`projeto_back_under_events_slot_${this.slotId}`, JSON.stringify(this.state.sheetLog));
    } catch (error) {
      console.warn('Não foi possível salvar o registro de eventos.', error);
    }
  }

  hydrateEventCorrections() {
    const latestEvent = this.state.sheetLog[0];
    this.state.sheetLog.forEach(row => {
      this.state.liveCorrections[row.minute] = row.newOdd;
    });
    if (latestEvent) {
      this.state.currentOddBase = latestEvent.newOdd;
      this.state.currentOddBaseMinute = latestEvent.minute;
    }
  }

  clearEvents() {
    this.state.sheetLog = [];
    this.state.lastSheetRow = null;
    this.state.liveCorrections = {};
    this.state.currentOddBase = this.state.initialOdd;
    this.state.currentOddBaseMinute = null;
    this.recomputeCurve();
    this.recalculate();
    this.saveSheetLog();
    this.render();
    this.bindEvents();
  }

  startNewGame() {
    this.clearEvents();
    this.state.periodStartTimes = { HT: null, FT: null };
    this.savePeriodStartTimes();
    this.state.tvMinuteInput = 1;
    this.state.currentMinute = 1;
    this.state.liveMinute = 1;
    this.state.projectedMinute = 1;
    this.state.timerSeconds = 0;
    this.state.addedMinutes = 2;
    this.state.addedMinutesActive = false;
    this.state.pendingAddedMinutes = null;
    this.state.isSimulating = false;
    this.setPeriod('HT');
  }

  getNominalEndMinute() {
    return this.state.period === 'HT' ? 45 : 90;
  }

  getEffectiveAddedMinutes(referenceMinute = this.state.liveMinute) {
    const additionsAreInView = this.state.isSimulating && this.state.projectedMinute >= this.getNominalEndMinute();
    return this.state.addedMinutesActive || additionsAreInView ? this.state.addedMinutes : 0;
  }

  getMaxMinute(referenceMinute = this.state.liveMinute) {
    return this.getNominalEndMinute() + this.getEffectiveAddedMinutes(referenceMinute);
  }

  getMinuteMetricsFor(minute) {
    const targetMinute = Number(minute);
    const curve = targetMinute >= this.getNominalEndMinute() && !this.state.addedMinutesActive
      ? calculateMinuteCurve({
          period: this.state.period,
          initialOdd: this.state.initialOdd,
          addedMinutes: this.state.addedMinutes,
          liveCorrections: this.state.liveCorrections
        })
      : this.state.minuteCurve;
    return getMinuteMetrics(curve, targetMinute);
  }

  activateAddedMinutesIfReached(minute) {
    if (!this.state.addedMinutesActive && minute >= this.getNominalEndMinute()) {
      this.state.addedMinutesActive = this.state.addedMinutes > 0;
      this.recomputeCurve();
      return true;
    }
    return false;
  }

  recomputeCurve() {
    this.state.minuteCurve = calculateMinuteCurve({
      period: this.state.period,
      initialOdd: this.state.initialOdd,
      addedMinutes: this.getEffectiveAddedMinutes(),
      liveCorrections: this.state.liveCorrections,
      baseMinute: this.state.currentOddBaseMinute,
      baseOdd: this.state.currentOddBaseMinute === null ? null : this.state.currentOddBase
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
     this.state.liveMinute = startMin;
     this.state.projectedMinute = startMin;
     this.state.tvMinuteInput = startMin;
     this.state.initialOdd = period === 'HT' ? 3.35 : 5.10;
    this.state.currentOddBase = this.state.initialOdd;
    this.state.currentOddBaseMinute = null;
     this.state.addedMinutes = period === 'HT' ? 2 : 5;
    this.state.addedMinutesActive = false;
     this.state.pendingAddedMinutes = null;
     this.state.liveOddCurrentMinute = '';
     this.state.liveCorrections = {};
     this.state.timerSeconds = 0;
    this.updatePeriodStartUI();
     this.state.isSimulating = false;
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
      this.state.currentOddBase = val;
      this.state.currentOddBaseMinute = null;
      this.state.liveCorrections = {};
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
     const pending = isNaN(val) || val < 0 ? 0 : val;
     this.state.pendingAddedMinutes = pending;
     const addedInput = this.container.querySelector('.hud-added-min-input');
     if (addedInput) addedInput.value = pending;
   }

   syncAddedMinutes() {
     if (this.state.pendingAddedMinutes !== null) {
       this.state.addedMinutes = this.state.pendingAddedMinutes;
       this.state.pendingAddedMinutes = null;
       this.state.addedMinutesActive = this.state.liveMinute >= this.getNominalEndMinute();
       this.recomputeCurve();
       this.recalculate();
       if (!this.state.currentMetrics) {
         this.state.currentMinute = this.state.liveMinute;
         this.recomputeCurve();
       }
       this.render();
       this.bindEvents();
       this.recalculate();
     }
   }

   adjustAddedMinutes(delta) {
     const currentVal = this.state.pendingAddedMinutes !== null ? this.state.pendingAddedMinutes : this.state.addedMinutes;
     const newVal = currentVal + delta;
     this.setAddedMinutes(newVal);
   }

  setTVMinute(mins) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    const displayMinStart = this.getDisplayMinute(minStart);
    const displayMax = this.getDisplayMinute(maxMin);
    const displayValue = parseInt(mins, 10);
    const safeDisplay = Math.max(displayMinStart, Math.min(displayMax, isNaN(displayValue) ? displayMinStart : displayValue));
    this.state.tvMinuteInput = safeDisplay + 1;
    const tvInput = this.container.querySelector('.hud-tv-min-input');
    if (tvInput) tvInput.value = this.getDisplayMinute(this.state.tvMinuteInput);
  }

  adjustTVMinute(delta) {
    this.setTVMinute(this.getDisplayMinute(this.state.tvMinuteInput) + delta);
  }

  getLiveGameMinute() {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = this.getMaxMinute();
    const m = minStart + Math.floor(this.state.timerSeconds / 60);
    return Math.max(minStart, Math.min(maxMin, m));
  }

  setMinute(min) {
    const isHT = this.state.period === 'HT';
    const minStart = isHT ? 1 : 46;
    const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
    const newMin = Math.max(minStart, Math.min(maxMin, parseInt(min, 10) || minStart));
    
    // Ao mudar o minuto, atualiza os campos
    this.state.currentMinute = newMin;
    this.state.liveMinute = newMin;
    this.state.projectedMinute = newMin;
    this.state.tvMinuteInput = newMin;
    this.state.isSimulating = false;
    this.state.liveOddCurrentMinute = this.state.liveCorrections[newMin] ? this.state.liveCorrections[newMin].toString() : '';
    this.state.timerSeconds = (newMin - minStart) * 60;
    
    const liveInput = this.container.querySelector('.hud-live-odd-input');
    if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;

    const tvMinInput = this.container.querySelector('.hud-tv-min-input');
    if (tvMinInput) tvMinInput.value = this.getDisplayMinute(newMin);

    const eventMinInput = this.container.querySelector('.event-min-input');
    if (eventMinInput) eventMinInput.value = this.getDisplayMinute(newMin);

    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
    this.recalculate();
    this.updateTimerDisplay();
  }

   setSimulatedMinute(targetMin) {
     const isHT = this.state.period === 'HT';
     const minStart = isHT ? 1 : 46;
     const maxMin = isHT ? (45 + this.state.addedMinutes) : (90 + this.state.addedMinutes);
     const newMin = Math.max(minStart, Math.min(maxMin, parseInt(targetMin, 10) || minStart));
     
     this.state.projectedMinute = newMin;
     this.state.isSimulating = (newMin !== this.getLiveGameMinute());
     this.recomputeCurve();
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.projectedMinute);
     this.recalculate();
     this.updateTimerDisplay();
     const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
     if (playPauseBtn) playPauseBtn.textContent = this.state.timerPaused ? '▶️' : '⏸️';
   }

  adjustCurrentMinute(delta) {
    this.setSimulatedMinute(this.state.projectedMinute + delta);
  }

   returnToLiveMinute() {
     this.state.isSimulating = false;
     this.state.timerPaused = false;
     this.state.liveMinute = this.getLiveGameMinute();
     this.state.projectedMinute = this.state.liveMinute;
     this.state.currentMinute = this.state.liveMinute;
     this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
     this.recalculate();
     this.updateTimerDisplay();
     const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
     if (playPauseBtn) playPauseBtn.textContent = '⏸️';
   }

   syncFromTV() {
     const isHT = this.state.period === 'HT';
     const minStart = isHT ? 1 : 46;
     const min = parseInt(this.state.tvMinuteInput, 10) || this.state.currentMinute;
     this.state.timerSeconds = (min - minStart) * 60;
    this.registerPeriodStart(min);
    this.activateAddedMinutesIfReached(min);
     this.state.isSimulating = false;
    this.state.liveMinute = min;
    this.state.projectedMinute = min;
     this.state.currentMinute = min;
    this.state.timerPaused = false;
     this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
     this.updateTimerDisplay();
     this.startTimer();
     this.recalculate();
   }

  applyEventOverride(minute, newOdd) {
    const targetMin = parseInt(minute, 10) || this.state.liveMinute;
    const parsedOdd = parseFloat(newOdd);
    if (!isNaN(parsedOdd) && parsedOdd >= 1.01) {
      const oldOdd = this.state.liveCorrections[targetMin] ?? this.getMinuteMetricsFor(targetMin)?.oddJusta ?? null;
      this.state.liveCorrections[targetMin] = parsedOdd;
      this.state.currentOddBase = parsedOdd;
      this.state.currentOddBaseMinute = targetMin;
      if (targetMin === this.state.liveMinute) {
        this.state.liveOddCurrentMinute = parsedOdd.toFixed(2);
        const liveInput = this.container.querySelector('.hud-live-odd-input');
        if (liveInput) liveInput.value = this.state.liveOddCurrentMinute;
      }
      this.recomputeCurve();
      this.recalculate();

      const row = {
        minute: targetMin,
        period: this.state.period,
        oldOdd: oldOdd !== null ? Number(oldOdd.toFixed(2)) : null,
        newOdd: Number(parsedOdd.toFixed(2)),
        fairOddAfterUpdate: Number(this.getMinuteMetricsFor(targetMin).oddJusta.toFixed(2)),
        bloco1: this.getMinuteMetricsFor(targetMin).topo1 && this.getMinuteMetricsFor(targetMin).fundo1 ? {
          topo: Number(this.getMinuteMetricsFor(targetMin).topo1.toFixed(2)),
          fundo: Number(this.getMinuteMetricsFor(targetMin).fundo1.toFixed(2))
        } : null,
        bloco2: this.getMinuteMetricsFor(targetMin).topo2 && this.getMinuteMetricsFor(targetMin).fundo2 ? {
          topo: Number(this.getMinuteMetricsFor(targetMin).topo2.toFixed(2)),
          fundo: Number(this.getMinuteMetricsFor(targetMin).fundo2.toFixed(2))
        } : null,
        ts: new Date().toISOString()
      };

      this.state.sheetLog.unshift(row);
      this.state.lastSheetRow = row;
      this.saveSheetLog();
      this.renderEventLog();
    }
  }

  renderEventLog() {
    const eventLogBody = this.container.querySelector('.event-log-body');
    if (!eventLogBody) return;

    eventLogBody.innerHTML = this.state.sheetLog.slice(0, 8).map(row => `
      <tr>
        <td>${row.period} ${row.minute}'</td>
        <td>${row.oldOdd === null ? '-' : row.oldOdd.toFixed(2)}</td>
        <td>${row.newOdd.toFixed(2)}</td>
        <td>${row.fairOddAfterUpdate.toFixed(2)}</td>
        <td>${row.bloco1 ? `${row.bloco1.topo.toFixed(2)} / ${row.bloco1.fundo.toFixed(2)}` : '-'}</td>
        <td>${row.bloco2 ? `${row.bloco2.topo.toFixed(2)} / ${row.bloco2.fundo.toFixed(2)}` : '-'}</td>
      </tr>
    `).join('');
  }

  recalculate() {
    const metricsMinute = this.state.isSimulating ? this.state.projectedMinute : this.state.liveMinute;
    this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, metricsMinute);
    const cm = this.state.currentMetrics;
    if (!cm) return;

    this.updateUI();
    this.updateSimulationUI();
  }

  updateSimulationUI() {
    const minuteBadge = this.container.querySelector('.hud-minute-hero-badge');
    const simTag = this.container.querySelector('.hud-sim-tag');
    const liveReturnBtn = this.container.querySelector('.hud-live-return-btn');
    const liveMin = this.getLiveGameMinute();

    if (this.state.isSimulating && this.state.projectedMinute !== liveMin) {
      const delta = this.state.projectedMinute - liveMin;
      const sign = delta > 0 ? `+${delta}` : `${delta}`;
      if (minuteBadge) minuteBadge.classList.add('simulating-active');
      if (simTag) {
        simTag.style.display = 'inline-block';
        simTag.textContent = `🔮 PROJEÇÃO (${sign}m)`;
      }
      if (liveReturnBtn) {
        liveReturnBtn.style.display = 'inline-flex';
        liveReturnBtn.innerHTML = `⚡ AO VIVO (${liveMin}')`;
      }
    } else {
      this.state.isSimulating = false;
      if (minuteBadge) minuteBadge.classList.remove('simulating-active');
      if (simTag) simTag.style.display = 'none';
      if (liveReturnBtn) liveReturnBtn.style.display = 'none';
    }
  }

  updateUI() {
    const cm = this.state.currentMetrics;
    if (!cm) return;

    const displayMinute = this.state.isSimulating ? this.state.projectedMinute : this.state.liveMinute;

    // Minuto e Odd Justa
    const minuteBadge = this.container.querySelector('.hud-minute-hero-badge');
    const oddJustaDisplay = this.container.querySelector('.hud-odd-justa-hero');
    const zoneBadge = this.container.querySelector('.hud-zone-badge');
    const valueDiffBadge = this.container.querySelector('.hud-diff-badge');
    const liveMinuteLabel = this.container.querySelector('.hud-live-minute-label');
    const projectedMinuteLabel = this.container.querySelector('.hud-projected-minute-label');

    // Blocos Grandes
    const bloco1Topo = this.container.querySelector('.bloco1-topo-val');
    const bloco1Fundo = this.container.querySelector('.bloco1-fundo-val');
    const bloco2Topo = this.container.querySelector('.bloco2-topo-val');
    const bloco2Fundo = this.container.querySelector('.bloco2-fundo-val');

    if (minuteBadge) minuteBadge.textContent = `${displayMinute}'`;
    if (liveMinuteLabel) liveMinuteLabel.textContent = `AO VIVO: ${this.state.liveMinute}'`;
    if (projectedMinuteLabel) projectedMinuteLabel.textContent = `PROJEÇÃO: ${this.state.projectedMinute}'`;
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

    // Diferença % Concisa e Centralizada Abaixo da Odd Justa
    if (valueDiffBadge) {
      const live = parseFloat(this.state.liveOddCurrentMinute);
      if (live && live > 1.0) {
        const diff = ((live / cm.oddJusta) - 1) * 100;
        const sign = diff > 0 ? '+' : '';
        const isGood = diff > 0.5;
        const isBad = diff < -0.5;

        valueDiffBadge.className = `hud-diff-badge ${isGood ? 'diff-good' : (isBad ? 'diff-bad' : 'diff-fair')}`;
        valueDiffBadge.innerHTML = `
          <strong>${sign}${diff.toFixed(1)}% ${isGood ? '📈 VALOR' : (isBad ? '📉 SEM VALOR' : '⚖️ JUSTO')}</strong>
        `;
      } else {
        valueDiffBadge.className = `hud-diff-badge diff-fair`;
        valueDiffBadge.innerHTML = `<strong>0.0% ⚖️ JUSTO</strong>`;
      }
    }
  }

   startTimer() {
     if (this.timerInterval) clearInterval(this.timerInterval);
     this.state.timerRunning = true;
     const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
     if (playPauseBtn) playPauseBtn.textContent = this.state.timerPaused ? '▶️' : '⏸️';

     this.timerInterval = setInterval(() => {
       if (this.state.timerPaused) {
         this.updateTimerDisplay();
         return;
       }

       const isHT = this.state.period === 'HT';
       const nominalEndMinute = this.getNominalEndMinute();
       const nominalEndSeconds = (nominalEndMinute - (isHT ? 1 : 46)) * 60;

       if (!this.state.addedMinutesActive && this.state.timerSeconds >= nominalEndSeconds && this.state.addedMinutes > 0) {
         this.state.addedMinutesActive = true;
         this.recomputeCurve();
       }

       const maxMin = this.getMaxMinute();
       const maxSeconds = (maxMin - (isHT ? 1 : 46)) * 60;

       if (this.state.timerSeconds >= maxSeconds) {
         this.state.timerSeconds = maxSeconds;
         this.state.liveMinute = maxMin;
         this.state.currentMinute = maxMin;
         this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
         this.recalculate();
         this.updateTimerDisplay();
         this.pauseTimer();
         return;
       }

       this.state.timerSeconds++;
       this.state.liveMinute = this.getLiveGameMinute();
       this.updateTimerDisplay();

       if (!this.state.isSimulating) {
         if (this.state.liveMinute !== this.state.currentMinute && this.state.liveMinute <= maxMin) {
           this.state.currentMinute = this.state.liveMinute;
           this.state.currentMetrics = getMinuteMetrics(this.state.minuteCurve, this.state.currentMinute);
           this.recalculate();
         }
       } else {
         this.updateUI();
         this.updateSimulationUI();
       }
     }, 1000);
   }

   pauseTimer() {
     if (this.timerInterval) clearInterval(this.timerInterval);
     this.state.timerRunning = false;
     this.state.timerPaused = true;
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
      const maxMin = this.getMaxMinute();
      const liveMin = this.getLiveGameMinute();
      const minutes = this.getDisplayMinute(Math.min(maxMin, liveMin));
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

     // Acréscimos (Input + Steppers + Botão Sync de Validação)
     const addedMinutesInput = this.container.querySelector('.hud-added-min-input');
     const addedMinusBtn = this.container.querySelector('.hud-added-minus-btn');
     const addedPlusBtn = this.container.querySelector('.hud-added-plus-btn');
     const addedSyncBtn = this.container.querySelector('.hud-added-sync-btn');

     if (addedMinutesInput) {
       addedMinutesInput.addEventListener('change', (e) => this.setAddedMinutes(e.target.value));
       addedMinutesInput.addEventListener('keydown', (e) => {
         if (e.key === 'Enter') this.setAddedMinutes(e.target.value);
       });
     }
     if (addedPlusBtn) {
       addedPlusBtn.addEventListener('click', () => this.adjustAddedMinutes(1));
     }
     if (addedMinusBtn) {
       addedMinusBtn.addEventListener('click', () => this.adjustAddedMinutes(-1));
     }
     if (addedSyncBtn) {
       addedSyncBtn.addEventListener('click', () => this.syncAddedMinutes());
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
          this.state.liveCorrections[this.state.liveMinute] = val;
        } else {
          delete this.state.liveCorrections[this.state.liveMinute];
        }
        this.recalculate();
      });
      liveInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = parseFloat(e.target.value);
          if (!isNaN(val) && val > 1.0) {
            this.applyEventOverride(this.state.liveMinute, val);
          }
        }
      });
    }

    // Botões de Minuto Atual no Painel Central (▲ / ▼)
    const btnMinMinus = this.container.querySelector('.hud-min-minus');
    const btnMinPlus = this.container.querySelector('.hud-min-plus');
    if (btnMinMinus) btnMinMinus.addEventListener('click', () => this.adjustCurrentMinute(-1));
    if (btnMinPlus) btnMinPlus.addEventListener('click', () => this.adjustCurrentMinute(1));

    // Botão Voltar ao Tempo Real
    const liveReturnBtn = this.container.querySelector('.hud-live-return-btn');
    if (liveReturnBtn) {
      liveReturnBtn.addEventListener('click', () => this.returnToLiveMinute());
    }

    // Módulo de Eventos de Jogo / Retorno
    const eventMinInput = this.container.querySelector('.event-min-input');
    const eventOddInput = this.container.querySelector('.event-odd-input');
    const eventApplyBtn = this.container.querySelector('.event-apply-btn');
    const eventClearBtn = this.container.querySelector('.event-clear-btn');

    if (eventApplyBtn && eventOddInput && eventMinInput) {
      eventApplyBtn.addEventListener('click', () => {
        this.applyEventOverride(eventMinInput.value, eventOddInput.value);
      });
      eventOddInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.applyEventOverride(eventMinInput.value, eventOddInput.value);
      });
    }
    if (eventClearBtn) {
      eventClearBtn.addEventListener('click', () => this.clearEvents());
    }

    this.renderEventLog();

     // Timer buttons
     const playPauseBtn = this.container.querySelector('.timer-play-pause-btn');
     const resetTimerBtn = this.container.querySelector('.timer-reset-btn');
    const newGameBtn = this.container.querySelector('.new-game-btn');
     if (playPauseBtn) {
       playPauseBtn.addEventListener('click', () => {
         if (this.state.timerPaused) {
           this.registerPeriodStart(this.state.liveMinute);
           this.state.timerPaused = false;
           this.startTimer();
         } else {
           this.pauseTimer();
         }
       });
     }
     if (resetTimerBtn) {
       resetTimerBtn.addEventListener('click', () => this.resetTimer());
     }
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        if (confirm('Iniciar novo jogo e limpar eventos deste slot?')) this.startNewGame();
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
          <span class="period-start-time" title="Horário estimado de início do período">${this.state.period}: ${this.formatPeriodStartTime(this.state.periodStartTimes[this.state.period])}</span>
        </div>

        <div class="game-timer-box">
          <span class="timer-display">${isHT ? '00:00' : '45:00'}'</span>
          <button class="timer-btn timer-play-pause-btn" title="Iniciar / Pausar">▶️</button>
          <button class="timer-btn timer-reset-btn" title="Zerar">🔄</button>
          <button class="timer-btn new-game-btn" title="Novo jogo e limpar eventos">🆕</button>
        </div>
      </div>

      <div class="hud-card-body">
        
        <!-- Linha 1: Configuração Obrigatória (Campos Amarelos com Botões + e - e Mais Espaço) -->
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

           <!-- Acréscimos (com botão Sync de validação) -->
           <div class="hud-input-cell-yellow" style="flex: 0.75;">
             <span class="hud-cell-label">➕ ACR:</span>
             <div class="hud-cell-input-row">
               <button class="hud-mini-stepper-btn hud-added-minus-btn" title="Diminuir Acréscimo">-</button>
               <input type="number" class="hud-yellow-field hud-added-min-input" value="${this.state.pendingAddedMinutes !== null ? this.state.pendingAddedMinutes : this.state.addedMinutes}">
               <button class="hud-mini-stepper-btn hud-added-plus-btn" title="Aumentar Acréscimo">+</button>
               <button class="btn btn-warning btn-sm hud-added-sync-btn" title="Sincronizar Acréscimos" style="display: inline-flex; padding: 2px 6px; font-size: 0.7rem;">🔒 Sync</button>
             </div>
           </div>

          <!-- Minuto TV e Sincronização (Espaçoso) -->
          <div class="hud-input-cell-yellow hud-tv-cell" style="flex: 1.3;">
            <span class="hud-cell-label">📺 MINUTO TV:</span>
            <div class="hud-cell-input-row">
              <button class="hud-mini-stepper-btn hud-tv-minus-btn" title="Minuto Anterior">-</button>
              <input type="number" class="hud-yellow-field hud-tv-min-input" value="${this.getDisplayMinute(this.state.tvMinuteInput)}">
              <button class="hud-mini-stepper-btn hud-tv-plus-btn" title="Próximo Minuto">+</button>
              <button class="btn btn-primary btn-sm hud-sync-btn" title="Sincronizar Minuto e Iniciar Cronômetro">⚡ Sync</button>
            </div>
          </div>

        </div>

        <!-- Linha 2: O PAINEL PRINCIPAL DO MINUTO ATUAL (HERO DESTAQUE) -->
        <div class="hud-main-minute-banner">
          
          <!-- Cabeçalho do Painel: Minuto Gigante, Coluna Central Odd Justa com Fundo Destacado, e Odd Live + Zona -->
          <div class="hud-hero-metrics-grid">
            
            <!-- Coluna 1: Minuto Atual / Simulação -->
            <div class="hud-minute-hero-col">
              <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 0.3rem;">
                  <span class="hud-metric-label">MINUTO</span>
                <span class="hud-sim-tag" style="display: none;">🔮 PROJEÇÃO</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.15rem; flex-wrap: wrap;">
                <span class="hud-minute-hero-badge">${this.state.isSimulating ? this.state.projectedMinute : this.state.liveMinute}'</span>
                <div style="display: flex; flex-direction: column; gap: 2px;">
                  <button class="hud-step-mini-btn hud-min-plus" title="Projetar +1 minuto">▲</button>
                  <button class="hud-step-mini-btn hud-min-minus" title="Projetar -1 minuto">▼</button>
                </div>
                <button class="hud-live-return-btn" style="display: none;" title="Voltar ao tempo real do jogo">⚡ AO VIVO</button>
              </div>
              <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; font-size: 0.68rem; font-weight: 700; color: #dbeafe;">
                <span class="hud-live-minute-label">AO VIVO: ${this.getDisplayMinute(this.state.liveMinute)}'</span>
                <span class="hud-projected-minute-label">PROJEÇÃO: ${this.getDisplayMinute(this.state.projectedMinute)}'</span>
              </div>
            </div>

            <!-- Coluna 2 Central: Card Destacado com Odd Justa + Diferença % Concisa Abaixo -->
            <div class="hud-odd-justa-card-container">
              <div class="hud-odd-justa-highlight-card">
                <span class="hud-metric-label" style="color: #93c5fd;">ODD JUSTA DO MINUTO</span>
                <span class="hud-odd-justa-hero">0.00</span>
              </div>
              
              <!-- DIFERENÇA % CONCISA E CENTRALIZADA ABAIXO DA ODD JUSTA -->
              <div class="hud-diff-badge diff-fair">
                <strong>0.0% ⚖️ JUSTO</strong>
              </div>
            </div>

            <!-- Coluna 3: Odd Live (Sem 'Ex:') + Zona Centralizada Abaixo -->
            <div class="hud-live-zone-col">
              <!-- Campo Odd Live -->
              <div class="hud-live-cell-yellow">
                <span class="hud-live-cell-label">ODD LIVE:</span>
                <input type="number" step="0.01" class="hud-yellow-field hud-live-odd-input" value="${this.state.liveOddCurrentMinute}">
              </div>

              <!-- Zona Centralizada Abaixo -->
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

        <!-- Linha 3: REGISTRO DE EVENTO / RETORNO DE JOGO (SIMPLIFICADO, SEM 'Ex:') -->
        <div class="hud-event-recalc-bar">
          <span class="event-recalc-title">⚡ REGISTRAR EVENTO:</span>

          <div class="event-recalc-inputs">
            <div class="event-input-wrapper">
              <span class="event-mini-label">Minuto:</span>
              <input type="number" class="hud-yellow-field event-min-input" value="${this.state.liveMinute}" style="width: 48px;">
            </div>

            <div class="event-input-wrapper">
              <span class="event-mini-label">Nova Odd:</span>
              <input type="number" step="0.01" class="hud-yellow-field event-odd-input" style="width: 72px;">
            </div>

            <button class="btn btn-success btn-sm event-apply-btn" title="Aplicar e Recalcular Curva">✔️ Recalcular</button>
            <button class="btn btn-secondary btn-sm event-clear-btn" title="Limpar eventos e voltar à odd inicial">🧹 Limpar</button>
          </div>
        </div>

        <div class="event-log-panel">
          <div class="event-log-title">📋 EVENTOS RECALCULADOS</div>
          <div class="event-log-scroll">
            <table class="event-log-table">
              <thead>
                <tr>
                  <th>Tempo</th>
                  <th>Anterior</th>
                  <th>Nova odd</th>
                  <th>Justa</th>
                  <th>Bloco 1</th>
                  <th>Bloco 2</th>
                </tr>
              </thead>
              <tbody class="event-log-body"></tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }
}

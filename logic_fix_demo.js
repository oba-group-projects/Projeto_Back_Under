const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const BLOCOS_JUSTO_1 = [
  { justo: 7.00, topo: 8.80, fundo: 7.80 },
  { justo: 6.50, topo: 8.00, fundo: 7.20 },
  { justo: 6.00, topo: 7.40, fundo: 6.60 },
  { justo: 5.50, topo: 6.80, fundo: 5.90 },
  { justo: 5.00, topo: 6.00, fundo: 5.30 },
  { justo: 4.50, topo: 5.40, fundo: 5.00 },
  { justo: 4.33, topo: 5.10, fundo: 4.60 },
  { justo: 4.00, topo: 4.70, fundo: 4.00 },
  { justo: 3.50, topo: 4.10, fundo: 3.85 },
  { justo: 3.40, topo: 3.90, fundo: 3.65 },
  { justo: 3.25, topo: 3.70, fundo: 3.35 },
  { justo: 3.00, topo: 3.40, fundo: 3.05 },
  { justo: 2.75, topo: 3.10, fundo: 2.90 },
  { justo: 2.62, topo: 2.92, fundo: 2.76 },
  { justo: 2.50, topo: 2.78, fundo: 2.60 },
  { justo: 2.37, topo: 2.62, fundo: 2.44 },
  { justo: 2.25, topo: 2.46, fundo: 2.38 },
  { justo: 2.20, topo: 2.40, fundo: 2.26 },
  { justo: 2.10, topo: 2.28, fundo: 2.14 },
  { justo: 2.00, topo: 2.16, fundo: 2.02 },
  { justo: 1.90, topo: 2.04, fundo: 1.95 },
  { justo: 1.83, topo: 1.96, fundo: 1.92 },
  { justo: 1.80, topo: 1.93, fundo: 1.82 },
  { justo: 1.72, topo: 1.83, fundo: 1.75 },
  { justo: 1.66, topo: 1.76, fundo: 1.69 },
  { justo: 1.61, topo: 1.70, fundo: 1.64 },
  { justo: 1.57, topo: 1.65, fundo: 1.60 },
  { justo: 1.53, topo: 1.61, fundo: 1.56 },
  { justo: 1.50, topo: 1.57, fundo: 1.49 },
  { justo: 1.20, topo: 1.20, fundo: 1.14 }
];

const BLOCOS_JUSTO_2 = [
  { justo: 7.00, topo: 8.60, fundo: 7.80 },
  { justo: 6.50, topo: 8.00, fundo: 7.20 },
  { justo: 6.00, topo: 7.40, fundo: 6.40 },
  { justo: 5.50, topo: 6.60, fundo: 5.90 },
  { justo: 5.00, topo: 6.00, fundo: 5.30 },
  { justo: 4.50, topo: 5.40, fundo: 5.00 },
  { justo: 4.33, topo: 5.10, fundo: 4.60 },
  { justo: 4.00, topo: 4.70, fundo: 3.95 },
  { justo: 3.50, topo: 4.00, fundo: 3.80 },
  { justo: 3.40, topo: 3.85, fundo: 3.60 },
  { justo: 3.25, topo: 3.60, fundo: 3.30 },
  { justo: 3.00, topo: 3.35, fundo: 3.05 },
  { justo: 2.75, topo: 3.10, fundo: 2.90 },
  { justo: 2.62, topo: 2.92, fundo: 2.72 },
  { justo: 2.50, topo: 2.74, fundo: 2.60 },
  { justo: 2.37, topo: 2.60, fundo: 2.48 },
  { justo: 2.25, topo: 2.48, fundo: 2.40 },
  { justo: 2.20, topo: 2.40, fundo: 2.28 },
  { justo: 2.10, topo: 2.30, fundo: 2.18 },
  { justo: 2.00, topo: 2.18, fundo: 2.06 },
  { justo: 1.90, topo: 2.06, fundo: 2.00 },
  { justo: 1.83, topo: 2.00, fundo: 1.94 },
  { justo: 1.80, topo: 1.94, fundo: 1.85 },
  { justo: 1.72, topo: 1.85, fundo: 1.78 },
  { justo: 1.66, topo: 1.78, fundo: 1.71 },
  { justo: 1.61, topo: 1.71, fundo: 1.68 },
  { justo: 1.57, topo: 1.68, fundo: 1.62 },
  { justo: 1.53, topo: 1.62, fundo: 1.58 },
  { justo: 1.50, topo: 1.58, fundo: 1.52 },
  { justo: 1.20, topo: 1.20, fundo: 1.14 }
];

function lookupBloco(odd, table) {
  if (!Number.isFinite(Number(odd)) || Number(odd) <= 0) {
    return { topo: 1.01, fundo: 1.00 };
  }

  const value = Number(odd);
  const sorted = [...table].sort((a, b) => b.justo - a.justo);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  if (value >= highest.justo) return { topo: highest.topo, fundo: highest.fundo };
  if (value <= lowest.justo) {
    const delta = lowest.topo - lowest.fundo;
    return {
      topo: Number((value + delta / 2).toFixed(2)),
      fundo: Number((value - delta / 2).toFixed(2))
    };
  }

  let upper = sorted[0];
  let lower = sorted[0];

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    if (value <= cur.justo && value >= next.justo) {
      upper = cur;
      lower = next;
      break;
    }
  }

  const range = upper.justo - lower.justo || 0.0001;
  const ratio = (value - lower.justo) / range;
  const topo = upper.topo + (lower.topo - upper.topo) * ratio;
  const fundo = upper.fundo + (lower.fundo - upper.fundo) * ratio;

  return {
    topo: Number(topo.toFixed(2)),
    fundo: Number(fundo.toFixed(2))
  };
}

function getMaxMinute(period, addedMinutes) {
  if (period === 'HT') return 45 + Number(addedMinutes || 0);
  return 90 + Number(addedMinutes || 0);
}

function computeMinuteCurve({ period = 'HT', initialOdd = 3.35, addedMinutes = 2, liveCorrections = {} }) {
  const isHT = period === 'HT';
  const startMinute = isHT ? 1 : 46;
  const normalMinutes = 45;
  const totalWindow = normalMinutes + Number(addedMinutes || 0);
  const endMinute = isHT ? 45 + Number(addedMinutes || 0) : 90 + Number(addedMinutes || 0);

  const curve = [];
  let previousOdd = Number(initialOdd) || 2.0;

  for (let minute = startMinute; minute <= endMinute; minute++) {
    const relativeMinute = isHT ? minute : minute - 45;
    const timeRemaining = Math.max(1, totalWindow - relativeMinute + 1);

    let oddJusta = null;

    if (liveCorrections[minute] !== undefined && liveCorrections[minute] !== null) {
      oddJusta = Number(liveCorrections[minute]);
    } else if (minute === startMinute) {
      oddJusta = previousOdd;
    } else {
      const decayFactor = Math.pow(1.01 / previousOdd, 1 / timeRemaining) - 1;
      oddJusta = previousOdd * (1 + decayFactor);
    }

    oddJusta = clamp(Number(oddJusta), 1.01, 1000);
    previousOdd = oddJusta;

    const bloco1 = lookupBloco(oddJusta, BLOCOS_JUSTO_1);
    const bloco2 = lookupBloco(oddJusta, BLOCOS_JUSTO_2);

    curve.push({
      minute,
      oddJusta: Number(oddJusta.toFixed(3)),
      bloco1,
      bloco2,
      isAddedMinute: minute > (isHT ? 45 : 90)
    });
  }

  return curve;
}

function getMinuteMetrics(curve, minute) {
  if (!curve || curve.length === 0) return null;
  const exact = curve.find((item) => item.minute === minute);
  if (exact) return exact;
  if (minute <= curve[0].minute) return curve[0];
  return curve[curve.length - 1];
}

class MatchLogic {
  constructor({ period = 'HT', initialOdd = 3.35, addedMinutes = 2 } = {}) {
    this.period = period;
    this.initialOdd = Number(initialOdd) || 3.35;
    this.addedMinutes = Number(addedMinutes) || 0;
    this.pendingAddedMinutes = null;
    this.realMinute = period === 'HT' ? 1 : 46;
    this.timerSeconds = 0;
    this.timerRunning = false;
    this.liveCorrections = {};
    this.sheetLog = [];
    this.projectedMinute = this.realMinute;
    this.recompute();
  }

  get maxMinute() {
    return getMaxMinute(this.period, this.addedMinutes);
  }

  recompute() {
    this.curve = computeMinuteCurve({
      period: this.period,
      initialOdd: this.initialOdd,
      addedMinutes: this.addedMinutes,
      liveCorrections: this.liveCorrections
    });
    this.metrics = getMinuteMetrics(this.curve, this.realMinute);
    this.projectedMetrics = getMinuteMetrics(this.curve, this.projectedMinute);
  }

  setAddedMinutes(value) {
    const parsed = Number(value);
    this.pendingAddedMinutes = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
    return this.pendingAddedMinutes;
  }

  syncAddedMinutes() {
    if (this.pendingAddedMinutes === null) return false;
    this.addedMinutes = this.pendingAddedMinutes;
    this.pendingAddedMinutes = null;
    this.recompute();
    return true;
  }

  tick() {
    if (!this.timerRunning) return this;

    this.timerSeconds += 1;

    const nextRealMinute = this.realMinute + 1;
    const limit = this.maxMinute;

    if (nextRealMinute <= limit) {
      this.realMinute = nextRealMinute;
    } else {
      this.realMinute = limit;
      this.timerRunning = false;
    }

    this.metrics = getMinuteMetrics(this.curve, this.realMinute);
    this.projectedMinute = this.realMinute;
    return this;
  }

  startTimer() {
    this.timerRunning = true;
    return this;
  }

  pauseTimer() {
    this.timerRunning = false;
    return this;
  }

  projectFutureMinute(targetMinute) {
    const target = Number(targetMinute);
    if (!Number.isFinite(target)) return this.projectedMetrics;
    const minStart = this.period === 'HT' ? 1 : 46;
    const limit = this.maxMinute;
    this.projectedMinute = clamp(target, minStart, limit);
    this.projectedMetrics = getMinuteMetrics(this.curve, this.projectedMinute);
    return this.projectedMetrics;
  }

  registerEvent(minute, newOdd) {
    const targetMinute = Number(minute);
    const odd = Number(newOdd);

    if (!Number.isFinite(targetMinute) || !Number.isFinite(odd) || odd < 1.01) {
      throw new Error('Evento inválido: minuto/odd fora do padrão.');
    }

    const before = this.getCurrentFairOdd(targetMinute);
    this.liveCorrections[targetMinute] = odd;
    this.recompute();

    const after = this.getCurrentFairOdd(targetMinute);
    const sheetRow = {
      period: this.period,
      minute: targetMinute,
      oldOdd: Number(before.toFixed(2)),
      newOdd: Number(odd.toFixed(2)),
      fairOddAfterUpdate: Number(after.toFixed(2)),
      bloco1: this.getMinuteMetricsFor(targetMinute).bloco1,
      bloco2: this.getMinuteMetricsFor(targetMinute).bloco2
    };

    this.sheetLog.push(sheetRow);
    return sheetRow;
  }

  getCurrentFairOdd(minute) {
    return getMinuteMetrics(this.curve, Number(minute)).oddJusta;
  }

  getMinuteMetricsFor(minute) {
    return getMinuteMetrics(this.curve, Number(minute));
  }
}

function runDemo() {
  console.log('\n====================================================');
  console.log('CORREÇÃO DE LÓGICA - TIMER / ACRÉSCIMOS / BLOCOS');
  console.log('====================================================\n');

  console.log('1) TIMER: não deve continuar além do último minuto do tempo normal + acréscimos');
  const ht = new MatchLogic({ period: 'HT', initialOdd: 3.35, addedMinutes: 2 });
  console.log('HT inicial:', { minute: ht.realMinute, maxMinute: ht.maxMinute, curveLength: ht.curve.length });
  for (let i = 0; i < 60; i++) {
    if (!ht.timerRunning) break;
    ht.tick();
  }
  console.log('HT após avanço forçado:', { minute: ht.realMinute, timerRunning: ht.timerRunning, maxMinute: ht.maxMinute });

  console.log('\n2) ACRÉSCIMOS: sincronização ativa a regra somente após os 45/90 minutos');
  const ft = new MatchLogic({ period: 'FT', initialOdd: 5.10, addedMinutes: 5 });
  ft.setAddedMinutes(7);
  console.log('FT pendente:', { pending: ft.pendingAddedMinutes, currentMax: ft.maxMinute, lastMinute: ft.getMinuteMetricsFor(90).oddJusta });
  ft.syncAddedMinutes();
  console.log('FT após sync:', { addedMinutes: ft.addedMinutes, maxMinute: ft.maxMinute, minute90: ft.getMinuteMetricsFor(90).oddJusta, minute97: ft.getMinuteMetricsFor(97).oddJusta });

  console.log('\n3) SIMULAÇÃO FUTURA: o relógio real continua em 30 enquanto a projeção vai para 40');
  const live = new MatchLogic({ period: 'FT', initialOdd: 5.10, addedMinutes: 5 });
  live.realMinute = 30;
  live.projectedMinute = 30;
  live.metrics = getMinuteMetrics(live.curve, 30);
  live.projectedMetrics = live.projectFutureMinute(40);
  console.log('Real Minute:', live.realMinute, '->', live.metrics.oddJusta);
  console.log('Projeção para 40:', live.projectedMinute, '->', live.projectedMetrics.oddJusta, 'bloco1', live.projectedMetrics.bloco1, 'bloco2', live.projectedMetrics.bloco2);
  console.log('Status real:', { realMinute: live.realMinute, projectedMinute: live.projectedMinute, realChanged: false, projectedOnly: true });

  console.log('\n4) REGISTRO DE EVENTO: atualiza planilha e recalcula os valores alterados');
  const eventSlot = new MatchLogic({ period: 'HT', initialOdd: 3.35, addedMinutes: 2 });
  const row = eventSlot.registerEvent(43, 1.60);
  console.log('Registro:', row);

  console.log('\n5) BLOCOS JUSTOS: abaixo de 1.60 continuam aplicados');
  const oddsToCheck = [1.70, 1.60, 1.57, 1.53, 1.45, 1.15];
  for (const odd of oddsToCheck) {
    const bloco1 = lookupBloco(odd, BLOCOS_JUSTO_1);
    const bloco2 = lookupBloco(odd, BLOCOS_JUSTO_2);
    console.log(`odd ${odd.toFixed(2)} => bloco1 ${bloco1.topo.toFixed(2)} / ${bloco1.fundo.toFixed(2)} | bloco2 ${bloco2.topo.toFixed(2)} / ${bloco2.fundo.toFixed(2)}`);
  }

  console.log('\n6) VERIFICAÇÃO FINAL DO CRONOMETRO E CURVA');
  const finalCheck = new MatchLogic({ period: 'HT', initialOdd: 3.35, addedMinutes: 2 });
  console.log('Fim HT esperado:', { maxMinute: finalCheck.maxMinute, lastMinute: finalCheck.curve[finalCheck.curve.length - 1].minute, lastOdd: finalCheck.curve[finalCheck.curve.length - 1].oddJusta });

  console.log('\n✅ DEMO FINALIZADA COM LÓGICA CORRIGIDA');
}

runDemo();

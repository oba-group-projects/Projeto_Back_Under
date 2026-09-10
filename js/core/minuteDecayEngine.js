/**
 * Motor de Decaimento Temporal Minuto a Minuto (Back Under)
 * Fórmula exata da aba IN LIVE da planilha Google Docs.
 *
 * Para odd >= 2 (fórmula multiplicativa):
 *   odd_n = odd_{n-1} × (1.01 / odd_{n-1})^(1 / restante)
 *
 * Para odd < 2 (fórmula por ticks da ladder Betfair):
 *   D_novo = D_atual − (D_atual − 1) / restante
 *   odd_n = oddFromTicks(round(D_novo))
 *   Na primeira transição de ≥2 para <2: usa ceil(ticks) em vez de round.
 *
 * restante = MAX(1, totalNominal + 2 − posição_relativa)
 * HT: totalNominal = 45 (46 minutos: 1..46+acréscimos)
 * FT: totalNominal = 47 (48 minutos: 46..93+acréscimos)
 */

import { findClosestLadder, LADDER_DATA } from './ladderData.js';
import { lookupBloco1, lookupBloco2 } from './blocosData.js';
import { findClosestPendulo } from './pendulosData.js';
import { normalizeOdd } from './oddsCalculator.js';

// ── Helpers de ladder ────────────────────────────────────────────────────────
/**
 * Calcula a próxima odd justa segundo a fórmula da planilha IN LIVE.
 * @param {number} prevOdd - Odd do minuto anterior (raw float se >= 2, tick se < 2)
 * @param {number} posRelativa - Posição relativa do PRÓXIMO minuto (1 = primeiro minuto)
 * @param {number} totalNominal - HT=45, FT=47
 * @param {number} stepsAfterTransition - nº de steps desde a transição >=2→<2 (0 = ainda >= 2)
 * @returns {{ odd: number, steps: number }} próxima odd e contador atualizado
 */
function calcNextOddByFormula(prevOdd, posRelativa, totalNominal, stepsAfterTransition) {
  const restante = Math.max(1, totalNominal + 2 - posRelativa);
  const raw = prevOdd * Math.pow(1.01 / prevOdd, 1 / restante);

  if (prevOdd >= 2) {
    if (raw >= 2) return { odd: raw, steps: 0 }; // continua como float

    // Primeira transição para < 2: CORRESP(raw, A_desc, -1) = menor A >= raw
    for (let i = LADDER_DATA.length - 1; i >= 0; i--) {
      if (LADDER_DATA[i].odd >= raw - 0.000001) {
        return { odd: LADDER_DATA[i].odd, steps: 1 }; // steps=1 = acabou de cruzar
      }
    }
    return { odd: 1.01, steps: 1 };
  }

  // Fórmula de ticks (prevOdd já é tick exato da ladder)
  const tickItem = LADDER_DATA.find((e) => e.odd === Number(prevOdd.toFixed(2)));
  const D = tickItem ? tickItem.tickIndex : 0;
  const D_novo = D - (D - 1) / restante;

  // Dn <= 1 → último passo da curva: retorna 1.01
  if (D_novo <= 1) return { odd: 1.01, steps: stepsAfterTransition + 1 };

  const frac = D_novo - Math.floor(D_novo);
  let tickRound;
  if (frac === 0.5) {
    tickRound = Math.floor(D_novo); // .5 exato → floor
  } else if (stepsAfterTransition > 0 && stepsAfterTransition <= 4) {
    // Nos primeiros 4 steps após a transição, a planilha usa CEIL
    // (comportamento do CORRESP(-1) com valor float residual da fórmula mult)
    tickRound = Math.ceil(D_novo);
  } else {
    tickRound = Math.round(D_novo);
  }

  const result = LADDER_DATA.find((e) => e.tickIndex === Math.max(0, Math.min(350, tickRound)));
  return {
    odd: result ? result.odd : 1.01,
    steps: stepsAfterTransition + 1,
  };
}

/**
 * Calcula a curva completa minuto a minuto para o período selecionado
 * @param {object} params
 * @param {'HT' | 'FT'} params.period - 'HT' (1º tempo 1-45') ou 'FT' (2º tempo 46-90')
 * @param {number} params.initialOdd - Odd inicial no minuto de abertura
 * @param {number} params.baseMinute - Minuto que passa a usar a nova odd base
 * @param {number} params.baseOdd - Odd base a partir de baseMinute
 * @param {number} params.addedMinutes - Minutos de acréscimo previstos (ex: 2 para HT, 5 para FT)
 * @param {number|null} params.curveEndMinute - Limite absoluto da curva, quando definido pelo GameSlot
 * @param {object} params.liveCorrections - Dicionário de correções manuais { [minuto]: oddReal }
 * @returns {Array<object>} Array com cada minuto e suas métricas calculadas
 */
export function calculateMinuteCurve({
  period = 'HT',
  initialOdd = 3.35,
  addedMinutes = 2,
  liveCorrections = {},
  baseMinute = null,
  baseOdd = null,
  curveEndMinute = null,
}) {
  const isHT = period === 'HT';
  const startMinute = isHT ? 1 : 46;

  // totalNominal: HT=45 (46 min base), FT=47 (48 min base).
  // NÃO muda com acréscimos — acréscimos apenas estendem o endMinute.
  const totalNominal = isHT ? 45 : 47;

  // Número total de minutos na curva
  const nominalMinutes = isHT ? 46 : 48; // minutos-base sem acréscimos
  const totalPeriodMinutes = nominalMinutes + (Number(addedMinutes) || 0);
  const endMinute =
    curveEndMinute !== null
      ? Number(curveEndMinute)
      : isHT
        ? startMinute + totalPeriodMinutes - 1
        : startMinute + totalPeriodMinutes - 1;

  // Odd base: se há um evento registrado (baseMinute/baseOdd), recomeça a partir dele
  const eventMinute = baseMinute !== null ? Number(baseMinute) : null;
  const eventOdd = eventMinute !== null && Number(baseOdd) >= 1.01 ? Number(baseOdd) : null;

  const curve = [];

  // Gera os valores da curva usando a fórmula da planilha
  // Para cada minuto, o valor é calculado iterativamente a partir do anterior
  // (ou do evento de correção, se houver)
  let prevRaw = Math.max(1.01, Number(initialOdd) || 2.0); // valor float (>= 2) ou tick (< 2)
  let stepsAfterTransition = 0; // contador de steps após a transição >=2→<2

  for (let minute = startMinute; minute <= endMinute; minute++) {
    const elapsed = isHT ? minute : minute - 45;
    // Posição relativa dentro do período (1 = primeiro minuto)
    const posRelativa = minute - startMinute + 1;

    let oddJusta;

    // Prioridade 1: correção manual registrada neste minuto exato
    if (
      liveCorrections[minute] !== undefined &&
      liveCorrections[minute] !== null &&
      liveCorrections[minute] > 1.0
    ) {
      oddJusta = Number(liveCorrections[minute]);
      prevRaw = oddJusta;
      stepsAfterTransition = oddJusta < 2 ? stepsAfterTransition : 0;
    }
    // Prioridade 2: minuto do evento registrado (gol/retorno)
    else if (eventMinute !== null && minute === eventMinute && eventOdd !== null) {
      oddJusta = eventOdd;
      prevRaw = oddJusta;
      stepsAfterTransition = 0;
    }
    // Prioridade 3: primeiro minuto = odd inicial
    else if (minute === startMinute) {
      oddJusta = prevRaw;
    }
    // Prioridade 4: fórmula iterativa da planilha
    else {
      const result = calcNextOddByFormula(prevRaw, posRelativa, totalNominal, stepsAfterTransition);
      prevRaw = result.odd;
      stepsAfterTransition = result.steps;
      oddJusta = prevRaw >= 2 ? Math.round(prevRaw * 100) / 100 : prevRaw;
    }

    oddJusta = Math.max(1.01, oddJusta);

    // Bloco 1 e Bloco 2
    const bloco1 = lookupBloco1(oddJusta);
    const bloco2 = lookupBloco2(oddJusta);

    // Zona de velocidade
    const pendulo = findClosestPendulo(oddJusta, 'justa');
    const zona = pendulo
      ? pendulo.zona
      : oddJusta >= 4.0
        ? 'Lenta'
        : oddJusta >= 1.8
          ? 'Rápida'
          : 'Média';

    // Diferença se houver odd de mercado ao vivo
    const liveOdd = liveCorrections[minute] !== undefined ? liveCorrections[minute] : null;
    let diffPct = null;
    if (liveOdd && liveOdd > 1.0) {
      diffPct = Number(((liveOdd / oddJusta - 1) * 100).toFixed(2));
    }

    curve.push({
      minute,
      elapsed,
      oddJusta: Number(oddJusta.toFixed(3)),
      oddJustaFormatted: normalizeOdd(oddJusta).toFixed(2),
      liveOdd: liveOdd ? Number(liveOdd).toFixed(2) : null,
      diffPct,
      topo1: bloco1.topo,
      fundo1: bloco1.fundo,
      topo2: bloco2.topo,
      fundo2: bloco2.fundo,
      zona,
    });
  }

  return curve;
}

/**
 * Obtém os dados projetados especificamente para o minuto atual do jogo
 * @param {Array<object>} curve - Curva gerada por calculateMinuteCurve
 * @param {number} currentMinute - Minuto atual (ex: 15)
 * @returns {object}
 */
export function getMinuteMetrics(curve, currentMinute) {
  if (!curve || curve.length === 0) return null;
  const match = curve.find((c) => c.minute === currentMinute);
  if (match) return match;
  if (currentMinute < curve[0].minute) return curve[0];
  return curve[curve.length - 1];
}

/**
 * Estima a odd de abertura que produziria a odd informada no minuto do evento.
 * A busca usa a mesma curva do motor e ignora a correção do próprio evento.
 */
export function calibrateOpeningOdd({ period = 'HT', eventMinute, eventOdd, addedMinutes = 0 }) {
  const targetMinute = Number(eventMinute);
  const targetOdd = Number(eventOdd);
  if (!Number.isFinite(targetMinute) || !Number.isFinite(targetOdd) || targetOdd < 1.01)
    return null;

  let lower = 1.01;
  let upper = 1000;
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = (lower + upper) / 2;
    const curve = calculateMinuteCurve({
      period,
      initialOdd: candidate,
      addedMinutes,
      liveCorrections: {},
    });
    const candidateOdd = getMinuteMetrics(curve, targetMinute)?.oddJusta ?? candidate;
    if (candidateOdd < targetOdd) lower = candidate;
    else upper = candidate;
  }

  return Number(((lower + upper) / 2).toFixed(2));
}

/**
 * Aplica o salto de odd decorrente de um gol a favor ou contra (Regra x2.5 da planilha)
 * @param {number} currentOdd
 * @param {boolean} isFavor - true = Gol a Favor (Odd sobe x2.5), false = Gol Contra (Odd cai /2.5)
 * @returns {number}
 */
export function applyGoalOddShift(currentOdd, isFavor = true) {
  const base = Number(currentOdd) || 2.0;
  let shifted = isFavor ? base * 2.5 : base / 2.5;
  shifted = Math.max(1.01, Math.min(1000.0, shifted));
  const ladderItem = findClosestLadder(shifted);
  return ladderItem ? ladderItem.odd : shifted;
}

/**
 * Motor de Decaimento Temporal Minuto a Minuto (Back Under)
 * Implementação exata das fórmulas da aba 'IN LIVE' e 'HTFT' da planilha Google Docs.
 */

import { LADDER_DATA, findClosestLadder, getOddByTicks } from './ladderData.js';
import { lookupBloco1, lookupBloco2 } from './blocosData.js';
import { findClosestPendulo } from './pendulosData.js';
import { normalizeOdd } from './oddsCalculator.js';

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
  curveEndMinute = null
}) {
  const isHT = period === 'HT';
  const startMinute = isHT ? 1 : 46;
  const nominalMinutes = 45;
  const totalPeriodMinutes = curveEndMinute === null
    ? nominalMinutes + (Number(addedMinutes) || 0)
    : (isHT ? Number(curveEndMinute) : Number(curveEndMinute) - 45);
  const endMinute = curveEndMinute === null
    ? (isHT ? totalPeriodMinutes : (45 + totalPeriodMinutes))
    : Number(curveEndMinute);

  const curve = [];
  let prevOdd = Number(initialOdd) || 2.00;
  const openingBase = Math.max(1.01, prevOdd);
  const startBaseMinute = baseMinute === null ? startMinute : Number(baseMinute);
  const eventBase = baseMinute !== null && Number(baseOdd) >= 1.01 ? Number(baseOdd) : openingBase;
  const eventRemainingMinutes = Math.max(1, (totalPeriodMinutes - 1) - (startBaseMinute - startMinute));
  const decayRate = 1 - (1.01 / eventBase);

  for (let minute = startMinute; minute <= endMinute; minute++) {
    const elapsed = isHT ? minute : (minute - 45);
    const rowOffset = elapsed; // Minuto relativo dentro do tempo (1 a 45+acrescimos)
    const timeRemaining = Math.max(1, totalPeriodMinutes - rowOffset + 1);

    let oddJusta;

    // Se houver correção manual neste minuto
    if (baseMinute === minute && Number(baseOdd) >= 1.01) {
      oddJusta = Number(baseOdd);
    } else if (liveCorrections[minute] !== undefined && liveCorrections[minute] !== null && liveCorrections[minute] > 1.0) {
      oddJusta = Number(liveCorrections[minute]);
    } else if (minute === startMinute) {
      oddJusta = prevOdd;
    } else {
      const elapsedFromBase = Math.max(0, minute - startBaseMinute);
      const progress = Math.min(1, elapsedFromBase / eventRemainingMinutes);
      oddJusta = eventBase * (1 - (progress * decayRate));
    }

    oddJusta = Math.max(1.01, oddJusta);
    prevOdd = oddJusta;

    // Bloco 1 e Bloco 2
    const bloco1 = lookupBloco1(oddJusta);
    const bloco2 = lookupBloco2(oddJusta);

    // Zona de Velocidade
    const pendulo = findClosestPendulo(oddJusta, 'justa');
    const zona = pendulo ? pendulo.zona : (oddJusta >= 4.0 ? 'Lenta' : (oddJusta >= 1.8 ? 'Rápida' : 'Média'));

    // Diferença se houver odd de mercado ao vivo informada
    const liveOdd = liveCorrections[minute] !== undefined ? liveCorrections[minute] : null;
    let diffPct = null;
    if (liveOdd && liveOdd > 1.0) {
      diffPct = Number((((liveOdd / oddJusta) - 1) * 100).toFixed(2));
    }

    curve.push({
      minute: minute,
      elapsed: elapsed,
      oddJusta: Number(oddJusta.toFixed(3)),
      oddJustaFormatted: normalizeOdd(oddJusta).toFixed(2),
      liveOdd: liveOdd ? Number(liveOdd).toFixed(2) : null,
      diffPct: diffPct,
      topo1: bloco1.topo,
      fundo1: bloco1.fundo,
      topo2: bloco2.topo,
      fundo2: bloco2.fundo,
      zona: zona
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
  const match = curve.find(c => c.minute === currentMinute);
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
  if (!Number.isFinite(targetMinute) || !Number.isFinite(targetOdd) || targetOdd < 1.01) return null;

  let lower = 1.01;
  let upper = 1000;
  for (let attempt = 0; attempt < 60; attempt++) {
    const candidate = (lower + upper) / 2;
    const curve = calculateMinuteCurve({
      period,
      initialOdd: candidate,
      addedMinutes,
      liveCorrections: {}
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
  const base = Number(currentOdd) || 2.00;
  let shifted = isFavor ? (base * 2.5) : (base / 2.5);
  shifted = Math.max(1.01, Math.min(1000.0, shifted));
  const ladderItem = findClosestLadder(shifted);
  return ladderItem.odd;
}

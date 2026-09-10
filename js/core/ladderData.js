/**
 * Escada Oficial Betfair (Ladder) de 1.01 a 1000.00
 * Extraída da planilha oficial para cálculo exato de ticks e decaimento temporal.
 */

// Gera a lista completa de 350 odds da Betfair
export function generateBetfairLadder() {
  const tiers = [
    { min: 1.01, max: 2.0, step: 0.01 },
    { min: 2.0, max: 3.0, step: 0.02 },
    { min: 3.0, max: 4.0, step: 0.05 },
    { min: 4.0, max: 6.0, step: 0.1 },
    { min: 6.0, max: 10.0, step: 0.2 },
    { min: 10.0, max: 20.0, step: 0.5 },
    { min: 20.0, max: 30.0, step: 1.0 },
    { min: 30.0, max: 50.0, step: 2.0 },
    { min: 50.0, max: 100.0, step: 5.0 },
    { min: 100.0, max: 1000.0, step: 10.0 },
  ];

  const oddsList = [];
  for (const tier of tiers) {
    const current = tier.min;
    // Evita duplicata na fronteira
    const start = oddsList.length > 0 ? Number((current + tier.step).toFixed(4)) : current;
    for (let o = start; o <= tier.max + 0.0001; o += tier.step) {
      const rounded = Number(o.toFixed(2));
      if (!oddsList.includes(rounded)) {
        oddsList.push(rounded);
      }
    }
  }

  // Ordena do maior (1000) para o menor (1.01) para indexação decrescente da planilha
  oddsList.sort((a, b) => b - a);

  const total = oddsList.length;
  const ladder = oddsList.map((odd, idx) => {
    const ticksToBottom = total - 1 - idx; // ticks até 1.01
    return {
      odd: odd,
      tickIndex: ticksToBottom, // 0 para 1.01, 350 para 1000.00
      orderIndex: idx,
    };
  });

  return ladder;
}

export const LADDER_DATA = generateBetfairLadder();

/**
 * Encontra a odd mais próxima na escada Betfair.
 * @param {number} targetOdd - Valor de odd a localizar (deve ser um número finito ≥ 1.01)
 * @returns {object|null} Entrada da ladder mais próxima, ou null se a entrada for inválida
 */
export function findClosestLadder(targetOdd) {
  if (!Number.isFinite(targetOdd) || targetOdd <= 0) return null;
  if (targetOdd <= 1.01) return LADDER_DATA[LADDER_DATA.length - 1];
  if (targetOdd >= 1000.0) return LADDER_DATA[0];

  let closest = LADDER_DATA[0];
  let minDiff = Infinity;
  for (const item of LADDER_DATA) {
    const diff = Math.abs(item.odd - targetOdd);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
    // Otimização: a ladder está ordenada de forma decrescente; se a diferença
    // começa a crescer após ter diminuído, já encontramos o mais próximo.
    if (diff > minDiff) break;
  }
  return closest;
}

/**
 * Busca odd pelo número de ticks acumulados até 1.01.
 * @param {number} ticks - Índice de ticks (0 = 1.01, 350 = 1000.00)
 * @returns {number} Valor de odd correspondente, ou 1.01 se não encontrado
 */
export function getOddByTicks(ticks) {
  if (!Number.isFinite(ticks)) return 1.01;
  const clampedTicks = Math.max(0, Math.min(350, Math.round(ticks)));
  // Busca direta por índice: tickIndex 0 = posição final do array (odd 1.01)
  const item = LADDER_DATA.find((entry) => entry.tickIndex === clampedTicks);
  return item ? item.odd : 1.01;
}

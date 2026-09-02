/**
 * Escada Oficial Betfair (Ladder) de 1.01 a 1000.00
 * Extraída da planilha oficial para cálculo exato de ticks e decaimento temporal.
 */

// Gera a lista completa de 350 odds da Betfair
export function generateBetfairLadder() {
  const tiers = [
    { min: 1.01, max: 2.00, step: 0.01 },
    { min: 2.00, max: 3.00, step: 0.02 },
    { min: 3.00, max: 4.00, step: 0.05 },
    { min: 4.00, max: 6.00, step: 0.10 },
    { min: 6.00, max: 10.00, step: 0.20 },
    { min: 10.00, max: 20.00, step: 0.50 },
    { min: 20.00, max: 30.00, step: 1.00 },
    { min: 30.00, max: 50.00, step: 2.00 },
    { min: 50.00, max: 100.00, step: 5.00 },
    { min: 100.00, max: 1000.00, step: 10.00 }
  ];

  let oddsList = [];
  for (const tier of tiers) {
    let current = tier.min;
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
      orderIndex: idx
    };
  });

  return ladder;
}

export const LADDER_DATA = generateBetfairLadder();

/**
 * Encontra a odd mais próxima na escada
 * @param {number} targetOdd 
 * @returns {object}
 */
export function findClosestLadder(targetOdd) {
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
  }
  return closest;
}

/**
 * Busca odd pelo número de ticks acumulados até 1.01
 * @param {number} ticks 
 * @returns {number}
 */
export function getOddByTicks(ticks) {
  const clampedTicks = Math.max(0, Math.min(350, Math.round(ticks)));
  for (const item of LADDER_DATA) {
    if (item.tickIndex === clampedTicks) {
      return item.odd;
    }
  }
  return 1.01;
}

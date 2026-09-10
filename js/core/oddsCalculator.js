/**
 * Motor de Cálculo de Odds e Ticks da Escada Oficial da Betfair
 */

export const TICK_INCREMENTS = [
  { min: 1.01, max: 2.0, increment: 0.01, decimals: 2 },
  { min: 2.0, max: 3.0, increment: 0.02, decimals: 2 },
  { min: 3.0, max: 4.0, increment: 0.05, decimals: 2 },
  { min: 4.0, max: 6.0, increment: 0.1, decimals: 2 },
  { min: 6.0, max: 10.0, increment: 0.2, decimals: 2 },
  { min: 10.0, max: 20.0, increment: 0.5, decimals: 1 },
  { min: 20.0, max: 30.0, increment: 1.0, decimals: 0 },
  { min: 30.0, max: 50.0, increment: 2.0, decimals: 0 },
  { min: 50.0, max: 100.0, increment: 5.0, decimals: 0 },
  { min: 100.0, max: 1000.0, increment: 10.0, decimals: 0 },
];

/**
 * Retorna o tamanho do tick (incremento) para uma dada odd
 * @param {number} odd
 * @returns {number}
 */
export function getTickSize(odd) {
  if (odd < 1.01) return 0.01;
  for (let i = 0; i < TICK_INCREMENTS.length; i++) {
    const tier = TICK_INCREMENTS[i];
    if (odd >= tier.min && (odd < tier.max || (tier.max === 1000.0 && odd <= tier.max))) {
      return tier.increment;
    }
  }
  return 10.0;
}

/**
 * Normaliza e arredonda a odd para o tick válido mais próximo
 * @param {number} odd
 * @returns {number}
 */
export function normalizeOdd(odd) {
  if (!odd || isNaN(odd)) return 1.01;
  if (odd < 1.01) return 1.01;
  if (odd > 1000.0) return 1000.0;

  const tick = getTickSize(odd);
  const rounded = Math.round(odd / tick) * tick;
  return Number(rounded.toFixed(2));
}

/**
 * Move uma odd por N ticks (positivo = sobe odd, negativo = desce odd)
 * @param {number} odd
 * @param {number} ticksCount
 * @returns {number}
 */
export function moveOddTicks(odd, ticksCount) {
  let currentOdd = normalizeOdd(odd);
  const direction = ticksCount >= 0 ? 1 : -1;
  let remaining = Math.abs(ticksCount);

  while (remaining > 0) {
    if (direction > 0) {
      if (currentOdd >= 1000.0) break;
      const tick = getTickSize(currentOdd);
      currentOdd = Number((currentOdd + tick).toFixed(4));
    } else {
      if (currentOdd <= 1.01) break;
      // Ao descer, se estiver na fronteira (ex: 2.00 descendo), o tick abaixo é o do intervalo anterior
      const checkOdd = Number((currentOdd - 0.001).toFixed(4));
      const tick = getTickSize(checkOdd);
      currentOdd = Number((currentOdd - tick).toFixed(4));
    }
    currentOdd = normalizeOdd(currentOdd);
    remaining--;
  }
  return currentOdd;
}

/**
 * Calcula a quantidade exata de ticks entre duas odds
 * @param {number} fromOdd
 * @param {number} toOdd
 * @returns {number} (positivo se toOdd > fromOdd, negativo se toOdd < fromOdd)
 */
export function calculateTicksDistance(fromOdd, toOdd) {
  const start = normalizeOdd(fromOdd);
  const end = normalizeOdd(toOdd);
  if (start === end) return 0;

  let current = start;
  let ticks = 0;
  const direction = end > start ? 1 : -1;

  while ((direction > 0 && current < end) || (direction < 0 && current > end)) {
    if (direction > 0) {
      const tick = getTickSize(current);
      current = normalizeOdd(current + tick);
    } else {
      const checkOdd = Number((current - 0.001).toFixed(4));
      const tick = getTickSize(checkOdd);
      current = normalizeOdd(current - tick);
    }
    ticks += direction;
    if (Math.abs(ticks) > 5000) break; // Trava de segurança
  }
  return ticks;
}

/**
 * Formata um valor de odd para visualização com casas decimais adequadas
 * @param {number} odd
 * @returns {string}
 */
export function formatOdd(odd) {
  if (odd === undefined || odd === null || isNaN(odd)) return '-';
  const num = Number(odd);
  return num.toFixed(2);
}

/**
 * Formata um valor monetário em R$
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value === undefined || value === null || isNaN(value)) return 'R$ 0,00';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um percentual
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  if (value === undefined || value === null || isNaN(value)) return '0,0%';
  return `${Number(value).toFixed(1).replace('.', ',')}%`;
}

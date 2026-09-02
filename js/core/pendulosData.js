/**
 * Mapa de Pêndulos - Under Limit / Escada até 10 (Parede V6)
 * Base de dados otimizada para consulta em tempo real no Back Under.
 */
export const PENDULOS_DATA = [
  { ref365: 7.00, oddJusta: 8.56, caminho: [8.40, 8.20], saida: 8.00, ticks: 2, valorTick: 1.94, valorBloco: 3.96, zona: 'Lenta' },
  { ref365: 6.50, oddJusta: 7.91, caminho: [7.80, 7.60], saida: 7.40, ticks: 2, valorTick: 2.44, valorBloco: 5.00, zona: 'Lenta' },
  { ref365: 6.00, oddJusta: 7.30, caminho: [7.20, 7.00, 6.80], saida: 6.60, ticks: 3, valorTick: 2.44, valorBloco: 7.70, zona: 'Lenta' },
  { ref365: 5.50, oddJusta: 6.57, caminho: [6.40, 6.20], saida: 6.00, ticks: 2, valorTick: 2.44, valorBloco: 5.00, zona: 'Lenta' },
  { ref365: 5.00, oddJusta: 5.92, caminho: [5.90, 5.80, 5.70, 5.60, 5.50], saida: 5.40, ticks: 5, valorTick: 1.61, valorBloco: 8.64, zona: 'Lenta' },
  { ref365: 4.50, oddJusta: 5.34, caminho: [5.30, 5.20], saida: 5.10, ticks: 2, valorTick: 1.61, valorBloco: 3.28, zona: 'Lenta' },
  { ref365: 4.33, oddJusta: 5.03, caminho: [5.00, 4.90, 4.80], saida: 4.70, ticks: 3, valorTick: 1.94, valorBloco: 6.06, zona: 'Lenta' },
  { ref365: 4.00, oddJusta: 4.65, caminho: [4.60, 4.50, 4.40, 4.30, 4.20, 4.10], saida: 4.00, ticks: 6, valorTick: 1.94, valorBloco: 12.95, zona: 'Lenta' },
  { ref365: 3.50, oddJusta: 3.96, caminho: [3.95, 3.90], saida: 3.85, ticks: 2, valorTick: 1.20, valorBloco: 2.44, zona: 'Média' },
  { ref365: 3.40, oddJusta: 3.81, caminho: [3.80, 3.75, 3.70], saida: 3.65, ticks: 3, valorTick: 1.20, valorBloco: 3.70, zona: 'Média' },
  { ref365: 3.25, oddJusta: 3.60, caminho: [3.60, 3.55, 3.50, 3.45, 3.40], saida: 3.35, ticks: 5, valorTick: 1.20, valorBloco: 6.33, zona: 'Média' },
  { ref365: 3.00, oddJusta: 3.34, caminho: [3.30, 3.25, 3.20, 3.15], saida: 3.10, ticks: 4, valorTick: 1.38, valorBloco: 5.76, zona: 'Lenta' },
  { ref365: 2.75, oddJusta: 3.08, caminho: [3.05, 3.00, 2.98, 2.96, 2.94], saida: 2.92, ticks: 5, valorTick: 1.38, valorBloco: 7.31, zona: 'Lenta' },
  { ref365: 2.62, oddJusta: 2.91, caminho: [2.90, 2.88, 2.86, 2.84, 2.82, 2.80, 2.78, 2.76], saida: 2.74, ticks: 8, valorTick: 0.64, valorBloco: 5.35, zona: 'Rápida' },
  { ref365: 2.50, oddJusta: 2.73, caminho: [2.72, 2.70, 2.68, 2.66, 2.64], saida: 2.62, ticks: 5, valorTick: 0.68, valorBloco: 3.52, zona: 'Rápida' },
  { ref365: 2.37, oddJusta: 2.60, caminho: [2.60, 2.58, 2.56, 2.54, 2.52], saida: 2.50, ticks: 5, valorTick: 0.74, valorBloco: 3.80, zona: 'Rápida' },
  { ref365: 2.25, oddJusta: 2.48, caminho: [2.48, 2.46, 2.44], saida: 2.42, ticks: 3, valorTick: 0.74, valorBloco: 2.24, zona: 'Rápida' },
  { ref365: 2.20, oddJusta: 2.40, caminho: [2.40, 2.38, 2.36, 2.34, 2.32], saida: 2.30, ticks: 5, valorTick: 0.80, valorBloco: 4.13, zona: 'Rápida' },
  { ref365: 2.10, oddJusta: 2.29, caminho: [2.28, 2.26, 2.24, 2.22], saida: 2.20, ticks: 4, valorTick: 0.80, valorBloco: 3.28, zona: 'Lenta' },
  { ref365: 2.00, oddJusta: 2.18, caminho: [2.18, 2.16, 2.14, 2.12, 2.10], saida: 2.08, ticks: 5, valorTick: 0.87, valorBloco: 4.52, zona: 'Lenta' },
  { ref365: 1.90, oddJusta: 2.06, caminho: [2.06, 2.04], saida: 2.02, ticks: 2, valorTick: 0.87, valorBloco: 1.76, zona: 'Lenta' },
  { ref365: 1.83, oddJusta: 2.00, caminho: [2.00, 1.99, 1.98, 1.97, 1.96], saida: 1.95, ticks: 5, valorTick: 0.48, valorBloco: 2.44, zona: 'Rápida' },
  { ref365: 1.80, oddJusta: 1.94, caminho: [1.94, 1.93, 1.92, 1.91, 1.90, 1.89, 1.88, 1.87], saida: 1.86, ticks: 8, valorTick: 0.48, valorBloco: 3.96, zona: 'Rápida' },
  { ref365: 1.72, oddJusta: 1.85, caminho: [1.85, 1.84, 1.83, 1.82, 1.81, 1.80], saida: 1.79, ticks: 6, valorTick: 0.50, valorBloco: 3.10, zona: 'Rápida' },
  { ref365: 1.66, oddJusta: 1.78, caminho: [1.78, 1.77, 1.76, 1.75, 1.74, 1.73], saida: 1.72, ticks: 6, valorTick: 0.53, valorBloco: 3.28, zona: 'Média' },
  { ref365: 1.61, oddJusta: 1.71, caminho: [1.71, 1.70], saida: 1.69, ticks: 2, valorTick: 0.53, valorBloco: 1.07, zona: 'Média' },
  { ref365: 1.57, oddJusta: 1.68, caminho: [1.68, 1.67, 1.66, 1.65, 1.64], saida: 1.63, ticks: 5, valorTick: 0.56, valorBloco: 2.88, zona: 'Rápida' },
  { ref365: 1.53, oddJusta: 1.62, caminho: [1.62, 1.61, 1.60], saida: 1.59, ticks: 3, valorTick: 0.56, valorBloco: 1.71, zona: 'Rápida' },
  { ref365: 1.50, oddJusta: 1.58, caminho: [1.58, 1.57, 1.56, 1.55, 1.54], saida: 1.53, ticks: 5, valorTick: 0.60, valorBloco: 3.06, zona: 'Rápida' },
  { ref365: 1.44, oddJusta: 1.52, caminho: [1.52, 1.51, 1.50], saida: 1.49, ticks: 3, valorTick: 0.60, valorBloco: 1.82, zona: 'Rápida' },
  { ref365: 1.40, oddJusta: 1.48, caminho: [1.48, 1.47, 1.46, 1.45], saida: 1.44, ticks: 4, valorTick: 0.64, valorBloco: 2.60, zona: 'Média' },
  { ref365: 1.36, oddJusta: 1.43, caminho: [1.43, 1.42, 1.41, 1.40], saida: 1.39, ticks: 4, valorTick: 0.64, valorBloco: 2.60, zona: 'Média' },
  { ref365: 1.33, oddJusta: 1.38, caminho: [1.38], saida: 1.37, ticks: 1, valorTick: 0.68, valorBloco: 0.68, zona: 'Média' },
  { ref365: 1.30, oddJusta: 1.36, caminho: [1.36], saida: 1.35, ticks: 1, valorTick: 0.68, valorBloco: 0.68, zona: 'Média' },
  { ref365: 1.28, oddJusta: 1.34, caminho: [1.34, 1.33, 1.32], saida: 1.31, ticks: 3, valorTick: 0.68, valorBloco: 2.08, zona: 'Média' },
  { ref365: 1.25, oddJusta: 1.30, caminho: [1.30, 1.29], saida: 1.28, ticks: 2, valorTick: 0.74, valorBloco: 1.48, zona: 'Lenta' },
  { ref365: 1.22, oddJusta: 1.27, caminho: [1.27], saida: 1.26, ticks: 1, valorTick: 0.74, valorBloco: 0.74, zona: 'Lenta' },
  { ref365: 1.20, oddJusta: 1.25, caminho: [1.25], saida: 1.24, ticks: 1, valorTick: 0.74, valorBloco: 0.74, zona: 'Lenta' },
  { ref365: 1.18, oddJusta: 1.23, caminho: [1.23, 1.22], saida: 1.21, ticks: 2, valorTick: 0.74, valorBloco: 1.48, zona: 'Lenta' },
  { ref365: 1.16, oddJusta: 1.20, caminho: [1.20], saida: 1.19, ticks: 1, valorTick: 0.80, valorBloco: 0.80, zona: 'Lenta' },
  { ref365: 1.14, oddJusta: 1.18, caminho: [1.18], saida: 1.17, ticks: 1, valorTick: 0.80, valorBloco: 0.80, zona: 'Lenta' },
  { ref365: 1.12, oddJusta: 1.16, caminho: [1.16], saida: 1.15, ticks: 1, valorTick: 0.80, valorBloco: 0.80, zona: 'Lenta' },
  { ref365: 1.11, oddJusta: 1.14, caminho: [], saida: 1.14, ticks: 0, valorTick: 0, valorBloco: 0, zona: 'Lenta' }
];

/**
 * Encontra a melhor correspondência de pêndulo com base na Odd 365 ou Odd do Mercado
 * @param {number} inputOdd - Odd inserida
 * @param {'365' | 'justa'} mode - Modo de busca
 */
export function findClosestPendulo(inputOdd, mode = '365') {
  if (!inputOdd || isNaN(inputOdd) || inputOdd <= 1.0) return null;
  
  let closest = PENDULOS_DATA[0];
  let minDiff = Infinity;
  
  for (const item of PENDULOS_DATA) {
    const compareValue = mode === '365' ? item.ref365 : item.oddJusta;
    const diff = Math.abs(compareValue - inputOdd);
    if (diff < minDiff) {
      minDiff = diff;
      closest = item;
    }
  }
  return closest;
}

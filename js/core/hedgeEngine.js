/**
 * Motor de Hedge, Cashout e Equalização de Lucro para Trade Esportivo
 */

/**
 * Calcula o Cashout / Hedge equalizado (Greenbook)
 * @param {number} oddEntrada - Odd do Back inicial
 * @param {number} stakeEntrada - Stake do Back inicial
 * @param {number} oddAtual - Odd atual para Lay (saída)
 * @param {number} comissaoPct - Comissão da Betfair (padrão 3.25% = 0.0325)
 * @returns {object} Resultado do Hedge
 */
export function calculateHedge({
  oddEntrada,
  stakeEntrada,
  oddAtual,
  comissaoPct = 0.0325
}) {
  const oddBack = Number(oddEntrada);
  const stakeBack = Number(stakeEntrada);
  const oddLay = Number(oddAtual);
  
  if (!oddBack || !stakeBack || !oddLay || oddLay <= 1.0) {
    return {
      stakeLay: 0,
      lucroBruto: 0,
      lucroLiquido: 0,
      roiPct: 0,
      isGreen: false,
      isRed: false
    };
  }
  
  // Stake necessária no Lay para equalizar o lucro em qualquer resultado
  const stakeLay = (stakeBack * oddBack) / oddLay;
  
  // Lucro / Prejuízo bruto equalizado
  // Se o Under vencer: Ganho do Back (stakeBack * (oddBack - 1)) - Responsabilidade do Lay (stakeLay * (oddLay - 1))
  // Se o Over vencer: -stakeBack + stakeLay = stakeLay - stakeBack
  // Ambos resultam exatamente em: stakeLay - stakeBack
  const lucroBruto = stakeLay - stakeBack;
  
  let lucroLiquido = lucroBruto;
  if (lucroBruto > 0) {
    lucroLiquido = lucroBruto * (1 - comissaoPct);
  }
  
  const roiPct = stakeBack > 0 ? (lucroLiquido / stakeBack) * 100 : 0;
  
  return {
    stakeBack: Number(stakeBack.toFixed(2)),
    oddBack: Number(oddBack.toFixed(2)),
    stakeLay: Number(stakeLay.toFixed(2)),
    oddLay: Number(oddLay.toFixed(2)),
    lucroBruto: Number(lucroBruto.toFixed(2)),
    lucroLiquido: Number(lucroLiquido.toFixed(2)),
    roiPct: Number(roiPct.toFixed(2)),
    isGreen: lucroLiquido > 0.01,
    isRed: lucroLiquido < -0.01,
    isBreakeven: Math.abs(lucroLiquido) <= 0.01
  };
}

/**
 * Calcula a opção de Freebet (Lucro 100% no Under, Risco Zero no Over)
 * @param {number} oddEntrada 
 * @param {number} stakeEntrada 
 * @param {number} oddAtual 
 * @param {number} comissaoPct 
 */
export function calculateFreebet({
  oddEntrada,
  stakeEntrada,
  oddAtual,
  comissaoPct = 0.0325
}) {
  const oddBack = Number(oddEntrada);
  const stakeBack = Number(stakeEntrada);
  const oddLay = Number(oddAtual);
  
  if (!oddBack || !stakeBack || !oddLay || oddLay <= 1.0) {
    return { stakeLay: 0, lucroUnderLiquido: 0, lucroOver: 0 };
  }
  
  // No Freebet, vendemos apenas a stake inicial
  const stakeLay = stakeBack;
  const ganhoBrutoUnder = (stakeBack * (oddBack - 1)) - (stakeLay * (oddLay - 1));
  const ganhoLiquidoUnder = ganhoBrutoUnder > 0 ? ganhoBrutoUnder * (1 - comissaoPct) : ganhoBrutoUnder;
  
  return {
    stakeLay: Number(stakeLay.toFixed(2)),
    lucroUnderBruto: Number(ganhoBrutoUnder.toFixed(2)),
    lucroUnderLiquido: Number(ganhoLiquidoUnder.toFixed(2)),
    lucroOver: 0.00
  };
}

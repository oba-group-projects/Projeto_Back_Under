/**
 * Gerenciador de Stake e Controle de Red / Risco
 * Implementa 100% das fórmulas da Planilha Base de Gestão de Stake
 */

export const STRATEGIES = {
  'back_under_pendulos': {
    id: 'back_under_pendulos',
    name: 'Back Under (Pêndulo Parede V6)',
    category: 'Under Limit',
    oddsBase: '1.14 a 8.56',
    contexto: 'Escada de descida rápida / Pêndulos de Under HT e FT',
    stakeMultiplier: 1.0,
    lucroMedioPct: 0.04, // Variável conforme pêndulo
    redMedioPct: 0.20,
    lucroEstimadoTexto: '2% a 13% (por bloco)',
    redEstimadoTexto: 'Stop configurado',
    isUnder: true
  },
  'lay_parelho_ht': {
    id: 'lay_parelho_ht',
    name: 'Lay Parelho 1º Tempo',
    category: '1º Tempo',
    oddsBase: 'Abaixo de 5.0',
    contexto: 'Fav. Parelho 2.50 x 3.00 Z. Parelho',
    stakeMultiplier: 2.5,
    lucroMedioPct: 0.20,
    redMedioPct: 0.40,
    lucroEstimadoTexto: '15% à 25%',
    redEstimadoTexto: '40%',
    isUnder: false
  },
  'lay_zebra_ht': {
    id: 'lay_zebra_ht',
    name: 'Lay Zebra 1º Tempo',
    category: '1º Tempo',
    oddsBase: 'De 5.5 a 10',
    contexto: 'Favorito 1.65 x 6.5 Zebra',
    stakeMultiplier: 3.33,
    lucroMedioPct: 0.10,
    redMedioPct: 0.30,
    lucroEstimadoTexto: '8% à 12%',
    redEstimadoTexto: '25% à 30%',
    isUnder: false
  },
  'lay_super_zebra_ht': {
    id: 'lay_super_zebra_ht',
    name: 'Lay Super Zebra 1º Tempo',
    category: '1º Tempo',
    oddsBase: 'De 11.0 a 15.0',
    contexto: 'S. Favorito 1.15 x 15+ S. Zebra',
    stakeMultiplier: 5.55,
    lucroMedioPct: 0.06,
    redMedioPct: 0.18,
    lucroEstimadoTexto: '5% à 7%',
    redEstimadoTexto: '18%',
    isUnder: false
  },
  'drakito_ht_parelho': {
    id: 'drakito_ht_parelho',
    name: 'Drakito 1º Tempo Parelho',
    category: '1º Tempo',
    oddsBase: 'De 8.0 a 13.0',
    contexto: 'Jogo Parelho - Pressão no HT',
    stakeMultiplier: 4.0,
    lucroMedioPct: 0.075,
    redMedioPct: 0.25,
    lucroEstimadoTexto: '5% à 10%',
    redEstimadoTexto: '20% à 25%',
    isUnder: false
  },
  'drakito_ht_favorito': {
    id: 'drakito_ht_favorito',
    name: 'Drakito 1º Tempo Favorito',
    category: '1º Tempo',
    oddsBase: 'De 13.0 a 20.0',
    contexto: 'Super Favorito perdendo ou empatando no HT',
    stakeMultiplier: 6.66,
    lucroMedioPct: 0.05,
    redMedioPct: 0.15,
    lucroEstimadoTexto: '4% à 6%',
    redEstimadoTexto: '10% à 15%',
    isUnder: false
  },
  'vovo_back_favorito': {
    id: 'vovo_back_favorito',
    name: 'Vovô Favorito (Back 1.04-1.05)',
    category: 'Final de Jogo',
    oddsBase: 'Back 1.04 - 1.05',
    contexto: 'Favorito vencendo nos minutos finais',
    stakeMultiplier: 8.34,
    lucroMedioPct: 0.035,
    redMedioPct: 0.12,
    lucroEstimadoTexto: '2% à 5%',
    redEstimadoTexto: '8% á 15%',
    isUnder: false
  },
  'vovo_lay_tempo': {
    id: 'vovo_lay_tempo',
    name: 'Vovô Favorito (Lay 35/50 - 70min)',
    category: 'Final de Jogo',
    oddsBase: 'Lay 35 ou 50 - 70min',
    contexto: 'Favorito controlando aos 70min',
    stakeMultiplier: 12.5,
    lucroMedioPct: 0.02,
    redMedioPct: 0.08,
    lucroEstimadoTexto: '2% à 3%',
    redEstimadoTexto: '8% na tampa',
    isUnder: false
  }
};

/**
 * Calcula a stake e as métricas financeiras a partir do Red Aceitável
 * @param {string} strategyKey - Chave da estratégia
 * @param {number} redAceitavel - Valor em R$ do Red Aceitável (ex: 200)
 * @param {object} customParams - Parâmetros opcionais adicionais
 * @returns {object} Métricas calculadas
 */
export function calculateStakeFromRed(strategyKey, redAceitavel, customParams = {}) {
  const red = Math.max(0, Number(redAceitavel) || 0);
  const strategy = STRATEGIES[strategyKey] || STRATEGIES['back_under_pendulos'];
  
  let stake = 0;
  let lucroMedio = 0;
  let redMedio = 0;
  
  if (strategy.id === 'back_under_pendulos') {
    // No Back Under, se o usuário definir stop loss de X% da stake, calculamos a stake proporcional
    const stopLossPct = customParams.stopLossPct || 0.25; // Stop padrão de 25% ou perda de 1 gol
    stake = stopLossPct > 0 ? (red / stopLossPct) : red;
    
    // Se foi passado valor de bloco do pêndulo
    const blocoPct = customParams.valorBloco ? (customParams.valorBloco / 100) : strategy.lucroMedioPct;
    lucroMedio = stake * blocoPct;
    redMedio = red;
  } else {
    // Fórmulas diretas da planilha
    stake = red * strategy.stakeMultiplier;
    lucroMedio = stake * strategy.lucroMedioPct;
    redMedio = stake * strategy.redMedioPct;
  }
  
  return {
    strategyId: strategy.id,
    strategyName: strategy.name,
    category: strategy.category,
    oddsBase: strategy.oddsBase,
    redAceitavel: red,
    stake: Number(stake.toFixed(2)),
    lucroMedio: Number(lucroMedio.toFixed(2)),
    redMedio: Number(redMedio.toFixed(2)),
    lucroEstimadoTexto: strategy.lucroEstimadoTexto,
    redEstimadoTexto: strategy.redEstimadoTexto,
    roiEstimadoPct: stake > 0 ? Number(((lucroMedio / stake) * 100).toFixed(2)) : 0,
    relacaoRiscoRetorno: lucroMedio > 0 ? Number((redMedio / lucroMedio).toFixed(2)) : 0
  };
}

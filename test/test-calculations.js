import { PENDULOS_DATA, findClosestPendulo } from '../js/core/pendulosData.js';
import { getTickSize, normalizeOdd, moveOddTicks, calculateTicksDistance } from '../js/core/oddsCalculator.js';
import { STRATEGIES, calculateStakeFromRed } from '../js/core/stakeManager.js';
import { calculateHedge } from '../js/core/hedgeEngine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('==================================================');
console.log('🧪 INICIANDO TESTES DO PROJETO BACK UNDER');
console.log('==================================================\n');

// 1. Teste de Gestão de Stake (Planilha Base - Red = R$ 200)
console.log('--- 1. Testes de Gestão de Stake (Planilha Original com Red = R$ 200) ---');
const red200 = 200;

// Lay Parelho 1º Tempo: D11 = D8*2.5 = 500, E11 = D11*20% = 100, F11 = D11*40% = 200
const parelho = calculateStakeFromRed('lay_parelho_ht', red200);
assert(parelho.stake === 500, `Lay Parelho Stake: esperado 500, obtido ${parelho.stake}`);
assert(parelho.lucroMedio === 100, `Lay Parelho Lucro Médio: esperado 100, obtido ${parelho.lucroMedio}`);
assert(parelho.redMedio === 200, `Lay Parelho Red Médio: esperado 200, obtido ${parelho.redMedio}`);

// Lay Zebra 1º Tempo: D12 = D8*3.33 = 666, E12 = D12*10% = 66.60, F12 = D12*30% = 199.80
const zebra = calculateStakeFromRed('lay_zebra_ht', red200);
assert(zebra.stake === 666, `Lay Zebra Stake: esperado 666, obtido ${zebra.stake}`);
assert(zebra.lucroMedio === 66.6, `Lay Zebra Lucro Médio: esperado 66.6, obtido ${zebra.lucroMedio}`);
assert(Math.round(zebra.redMedio) === 200, `Lay Zebra Red Médio: esperado ~200, obtido ${zebra.redMedio}`);

// Lay Super Zebra: D13 = D8*5.55 = 1110, E13 = 6% = 66.6, F13 = 18% = 199.80
const superZebra = calculateStakeFromRed('lay_super_zebra_ht', red200);
assert(superZebra.stake === 1110, `Lay Super Zebra Stake: esperado 1110, obtido ${superZebra.stake}`);
assert(superZebra.lucroMedio === 66.6, `Lay Super Zebra Lucro Médio: esperado 66.6, obtido ${superZebra.lucroMedio}`);

// Drakito HT Parelho: D14 = D8*4 = 800, E14 = 7.5% = 60, F14 = 25% = 200
const drakitoParelho = calculateStakeFromRed('drakito_ht_parelho', red200);
assert(drakitoParelho.stake === 800, `Drakito Parelho Stake: esperado 800, obtido ${drakitoParelho.stake}`);
assert(drakitoParelho.lucroMedio === 60, `Drakito Parelho Lucro Médio: esperado 60, obtido ${drakitoParelho.lucroMedio}`);
assert(drakitoParelho.redMedio === 200, `Drakito Parelho Red Médio: esperado 200, obtido ${drakitoParelho.redMedio}`);

// Drakito HT Favorito: D15 = D8*6.66 = 1332, E15 = 5% = 66.60, F15 = 15% = 199.80
const drakitoFav = calculateStakeFromRed('drakito_ht_favorito', red200);
assert(drakitoFav.stake === 1332, `Drakito Fav Stake: esperado 1332, obtido ${drakitoFav.stake}`);
assert(drakitoFav.lucroMedio === 66.6, `Drakito Fav Lucro Médio: esperado 66.6, obtido ${drakitoFav.lucroMedio}`);

// Vovô Back: D16 = D8*8.34 = 1668, E16 = 3.5% = 58.38, F16 = 12% = 200.16
const vovoBack = calculateStakeFromRed('vovo_back_favorito', red200);
assert(vovoBack.stake === 1668, `Vovô Back Stake: esperado 1668, obtido ${vovoBack.stake}`);
assert(vovoBack.lucroMedio === 58.38, `Vovô Back Lucro Médio: esperado 58.38, obtido ${vovoBack.lucroMedio}`);

// Vovô Lay: D17 = D8*12.5 = 2500, E17 = 2% = 50, F17 = 8% = 200
const vovoLay = calculateStakeFromRed('vovo_lay_tempo', red200);
assert(vovoLay.stake === 2500, `Vovô Lay Stake: esperado 2500, obtido ${vovoLay.stake}`);
assert(vovoLay.lucroMedio === 50, `Vovô Lay Lucro Médio: esperado 50, obtido ${vovoLay.lucroMedio}`);
assert(vovoLay.redMedio === 200, `Vovô Lay Red Médio: esperado 200, obtido ${vovoLay.redMedio}`);

console.log('\n--- 2. Testes da Escada de Odds e Ticks Betfair ---');
assert(getTickSize(1.50) === 0.01, 'Tick size de 1.50 é 0.01');
assert(getTickSize(2.50) === 0.02, 'Tick size de 2.50 é 0.02');
assert(getTickSize(3.50) === 0.05, 'Tick size de 3.50 é 0.05');
assert(getTickSize(5.50) === 0.10, 'Tick size de 5.50 é 0.10');
assert(getTickSize(8.00) === 0.20, 'Tick size de 8.00 é 0.20');

// Mover odds
assert(moveOddTicks(3.50, -2) === 3.40, `Move 3.50 por -2 ticks (passo 0.05): esperado 3.40, obtido ${moveOddTicks(3.50, -2)}`);
assert(moveOddTicks(2.04, -3) === 1.99, `Move 2.04 por -3 ticks cruzando fronteira 2.00: esperado 1.99, obtido ${moveOddTicks(2.04, -3)}`);

// Distância em ticks
assert(calculateTicksDistance(3.50, 3.40) === -2, `Distância 3.50 -> 3.40: esperado -2 ticks, obtido ${calculateTicksDistance(3.50, 3.40)}`);
assert(calculateTicksDistance(2.02, 1.98) === -3, `Distância 2.02 -> 1.98: esperado -3 ticks, obtido ${calculateTicksDistance(2.02, 1.98)}`);

console.log('\n--- 3. Testes do Mapa de Pêndulos Parede V6 ---');
const pendulo350 = findClosestPendulo(3.50, '365');
assert(pendulo350 !== null, 'Encontrou pêndulo para 365 = 3.50');
assert(pendulo350.oddJusta === 3.96, `Odd Justa para 3.50 é 3.96 (obtido ${pendulo350.oddJusta})`);
assert(pendulo350.saida === 3.85, `Saída para 3.50 é 3.85 (obtido ${pendulo350.saida})`);
assert(pendulo350.zona === 'Média', `Zona para 3.50 é Média (obtido ${pendulo350.zona})`);

const pendulo180 = findClosestPendulo(1.80, '365');
assert(pendulo180.oddJusta === 1.94, `Odd Justa para 1.80 é 1.94 (obtido ${pendulo180.oddJusta})`);
assert(pendulo180.saida === 1.86, `Saída para 1.80 é 1.86 (obtido ${pendulo180.saida})`);
assert(pendulo180.zona === 'Rápida', `Zona para 1.80 é Rápida (obtido ${pendulo180.zona})`);

console.log('\n--- 4. Testes do Motor de Hedge / Cashout ---');
// Back R$ 100 @ 2.00, Lay @ 1.90, Comissao 3.25%
// stakeLay = (100 * 2.00) / 1.90 = 105.26
// lucroBruto = 105.26 - 100 = 5.26
// lucroLiquido = 5.26 * (1 - 0.0325) = 5.09
const hedgeGreen = calculateHedge({ oddEntrada: 2.00, stakeEntrada: 100, oddAtual: 1.90, comissaoPct: 0.0325 });
assert(hedgeGreen.stakeLay === 105.26, `Stake Lay: esperado 105.26, obtido ${hedgeGreen.stakeLay}`);
assert(hedgeGreen.lucroLiquido === 5.09, `Lucro Líquido: esperado 5.09, obtido ${hedgeGreen.lucroLiquido}`);
assert(hedgeGreen.isGreen === true, 'Hedge resultou em Green');

console.log('\n==================================================');
console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
console.log('==================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 TODOS OS CÁLCULOS ESTÃO 100% PRECISOS E ALINHADOS COM A PLANILHA!');
}

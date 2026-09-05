import { calculateMinuteCurve, getMinuteMetrics, applyGoalOddShift } from '../js/core/minuteDecayEngine.js';

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
console.log('🧪 TESTES DO MOTOR DE DECAIMENTO MINUTO A MINUTO (IN LIVE)');
console.log('==================================================\n');

// Teste 1: Curva HT com Odd Inicial 3.35 e Acréscimos = 2
console.log('--- 1. Teste de Decaimento HT (Odd Inicial 3.35, +2 min) ---');
const htCurve = calculateMinuteCurve({
  period: 'HT',
  initialOdd: 3.35,
  addedMinutes: 2
});

assert(htCurve.length === 47, `Total de minutos no HT: esperado 47 (45+2), obtido ${htCurve.length}`);
assert(htCurve[0].minute === 1, `Primeiro minuto é 1, obtido ${htCurve[0].minute}`);
assert(htCurve[0].oddJusta === 3.35, `Odd no minuto 1 é 3.35, obtido ${htCurve[0].oddJusta}`);

// Minuto 10
const min10 = getMinuteMetrics(htCurve, 10);
console.log('Minuto 10:', min10);
assert(min10.oddJusta < 3.35, `Odd no minuto 10 decaiu para menos de 3.35 (obtido ${min10.oddJusta})`);
assert(min10.topo1 > min10.fundo1, `Bloco 1 tem Topo (${min10.topo1}) > Fundo (${min10.fundo1})`);
assert(min10.topo2 > min10.fundo2, `Bloco 2 tem Topo (${min10.topo2}) > Fundo (${min10.fundo2})`);

// Minuto 45 e 47 (Fim do HT)
const min45 = getMinuteMetrics(htCurve, 45);
const min47 = getMinuteMetrics(htCurve, 47);
console.log('Minuto 45:', min45);
console.log('Minuto 47 (Fim):', min47);
assert(min47.oddJusta <= min45.oddJusta, `Odd no minuto 47 (${min47.oddJusta}) <= minuto 45 (${min45.oddJusta})`);
assert(min47.oddJusta <= 1.05, `Odd no fim do tempo está próxima de 1.01 (obtido ${min47.oddJusta})`);

// Cenário extra: relógio real e projeção futura devem ser independentes
assert(getMinuteMetrics(htCurve, 30).oddJusta > 1.6, `Odd justa no minuto 30 continua acima de 1.60 (obtido ${getMinuteMetrics(htCurve, 30).oddJusta})`);
assert(getMinuteMetrics(htCurve, 40).oddJusta > 1.2 && getMinuteMetrics(htCurve, 40).oddJusta < 1.6, `Odd justa no minuto 40 está dentro da faixa esperada (obtido ${getMinuteMetrics(htCurve, 40).oddJusta})`);

// Cenário extra: blocos justos continuam funcionando abaixo de 1.60
const blocoAbaixo160 = getMinuteMetrics(htCurve, 47);
assert(blocoAbaixo160.topo1 > 1.00 && blocoAbaixo160.fundo1 > 1.00, `Blocos justos abaixo de 1.60 continuam processados (topo1=${blocoAbaixo160.topo1}, fundo1=${blocoAbaixo160.fundo1})`);

// Teste 2: Curva FT com Odd Inicial 5.10 e Acréscimos = 5
console.log('\n--- 2. Teste de Decaimento FT (Odd Inicial 5.10, +5 min) ---');
const ftCurve = calculateMinuteCurve({
  period: 'FT',
  initialOdd: 5.10,
  addedMinutes: 5
});

assert(ftCurve.length === 50, `Total de minutos no FT: esperado 50 (45+5), obtido ${ftCurve.length}`);
assert(ftCurve[0].minute === 46, `Primeiro minuto do FT é 46, obtido ${ftCurve[0].minute}`);
assert(ftCurve[0].oddJusta === 5.10, `Odd no minuto 46 é 5.10, obtido ${ftCurve[0].oddJusta}`);

// Teste 3: Troca de período preserva os limites e reinicia a curva corretamente
console.log('\n--- 3. Teste de Troca de Período e Acréscimos ---');
const htComAcr = calculateMinuteCurve({ period: 'HT', initialOdd: 3.35, addedMinutes: 4 });
const ftSemAcr = calculateMinuteCurve({ period: 'FT', initialOdd: 5.10, addedMinutes: 0 });
assert(htComAcr.at(-1).minute === 49, `HT com +4 termina no minuto 49, obtido ${htComAcr.at(-1).minute}`);
assert(ftSemAcr[0].minute === 46, `FT reinicia no minuto 46, obtido ${ftSemAcr[0].minute}`);
assert(ftSemAcr[0].oddJusta === 5.10, `Troca para FT preserva a odd inicial 5.10, obtido ${ftSemAcr[0].oddJusta}`);

// Teste 4: Gol a favor e contra em HT e FT
console.log('\n--- 4. Teste de Gol em HT e FT ---');
const golHtFavor = applyGoalOddShift(getMinuteMetrics(htCurve, 30).oddJusta, true);
const golHtContra = applyGoalOddShift(getMinuteMetrics(htCurve, 30).oddJusta, false);
const golFtFavor = applyGoalOddShift(getMinuteMetrics(ftCurve, 60).oddJusta, true);
const golFtContra = applyGoalOddShift(getMinuteMetrics(ftCurve, 60).oddJusta, false);
assert(golHtFavor > getMinuteMetrics(htCurve, 30).oddJusta, `Gol a favor no HT aumenta a odd (${golHtFavor})`);
assert(golHtContra < getMinuteMetrics(htCurve, 30).oddJusta, `Gol contra no HT reduz a odd (${golHtContra})`);
assert(golFtFavor > getMinuteMetrics(ftCurve, 60).oddJusta, `Gol a favor no FT aumenta a odd (${golFtFavor})`);
assert(golFtContra < getMinuteMetrics(ftCurve, 60).oddJusta, `Gol contra no FT reduz a odd (${golFtContra})`);

// Teste 5: Evento vira a base dos minutos seguintes
console.log('\n--- 5. Teste de Reprecificação Após Evento ---');
const curvaComEvento = calculateMinuteCurve({
  period: 'HT',
  initialOdd: 3.35,
  addedMinutes: 2,
  liveCorrections: { 30: 4.00 }
});
assert(getMinuteMetrics(curvaComEvento, 30).oddJusta === 4, `Odd do evento no minuto 30 é 4.00, obtido ${getMinuteMetrics(curvaComEvento, 30).oddJusta}`);
assert(getMinuteMetrics(curvaComEvento, 31).oddJusta > getMinuteMetrics(htCurve, 31).oddJusta, `Minutos seguintes partem da nova odd do evento (${getMinuteMetrics(curvaComEvento, 31).oddJusta})`);

// Teste 6: Correção de Gol
console.log('\n--- 6. Teste de Salto de Gol (Regra x2.5) ---');
const golFav = applyGoalOddShift(3.00, true);
assert(golFav === 7.60 || golFav === 7.40 || golFav === 7.50, `Gol a favor de odd 3.00 saltou para ~7.50 (obtido ${golFav})`);

const golContra = applyGoalOddShift(5.00, false);
assert(golContra === 2.00, `Gol contra de odd 5.00 caiu para 2.00 (obtido ${golContra})`);

// Cenário extra: múltiplos acréscimos não quebram a curva máxima do período
const curveComAcr = calculateMinuteCurve({ period: 'FT', initialOdd: 5.10, addedMinutes: 7 });
assert(curveComAcr.length === 52, `FT com +7 acrescimos deve ter 52 minutos (45+7), obtido ${curveComAcr.length}`);
assert(curveComAcr[curveComAcr.length - 1].minute === 97, `Último minuto do FT com +7 acrescimos deve ser 97, obtido ${curveComAcr[curveComAcr.length - 1].minute}`);

console.log('\n==================================================');
console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSOU | ${failed} FALHOU`);
console.log('==================================================');

if (failed > 0) process.exit(1);

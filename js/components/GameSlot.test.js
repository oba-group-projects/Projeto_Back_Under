/**
 * GameSlot.test.js
 * Testes Jest para as 6 correções aplicadas em GameSlot.js.
 *
 * Estratégia:
 * - Mocks dos módulos core (minuteDecayEngine, oddsCalculator, ladderData)
 *   permitem controlar o retorno de cada função e forçar os casos extremos.
 * - O DOM é simulado pelo jsdom (ambiente padrão do Jest).
 * - beforeEach cria um container limpo e instancia GameSlot com estado mínimo.
 */

// ─── Mocks dos módulos core ──────────────────────────────────────────────────

jest.mock('../core/minuteDecayEngine.js', () => ({
  calculateMinuteCurve: jest.fn(() => []),
  getMinuteMetrics: jest.fn(() => ({
    oddJusta: 3.35,
    zona: 'Normal',
    topo1: 3.5,
    fundo1: 3.2,
    topo2: 3.7,
    fundo2: 3.0,
  })),
  calibrateOpeningOdd: jest.fn(() => null),
}));

jest.mock('../core/oddsCalculator.js', () => ({
  moveOddTicks: jest.fn((odd, ticks) => odd + ticks * 0.05),
}));

jest.mock('../core/ladderData.js', () => ({
  findClosestLadder: jest.fn(() => ({ tickIndex: 100, odd: 3.35 })),
}));

// ─── Imports (depois dos mocks) ──────────────────────────────────────────────

import { GameSlot } from './GameSlot.js';
import {
  calculateMinuteCurve,
  getMinuteMetrics,
  calibrateOpeningOdd,
} from '../core/minuteDecayEngine.js';
import { findClosestLadder } from '../core/ladderData.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Cria um container DOM completo com todos os elementos que GameSlot espera. */
function buildContainer() {
  const div = document.createElement('div');
  div.innerHTML = `
    <input class="game-title-input" value="Jogo 1" />
    <button class="period-tab-btn" data-period="HT"></button>
    <button class="period-tab-btn" data-period="FT"></button>
    <input class="hud-initial-odd-input" value="3.35" />
    <button class="hud-set-odd-btn"></button>
    <button class="hud-odd-minus-btn"></button>
    <button class="hud-odd-plus-btn"></button>
    <input class="hud-added-min-input" value="2" />
    <button class="hud-added-minus-btn"></button>
    <button class="hud-added-plus-btn"></button>
    <button class="hud-added-sync-btn"></button>
    <input class="hud-tv-min-input" value="0" />
    <button class="hud-sync-btn"></button>
    <button class="hud-tv-minus-btn"></button>
    <button class="hud-tv-plus-btn"></button>
    <input class="hud-live-odd-input" value="" />
    <button class="hud-min-minus"></button>
    <button class="hud-min-plus"></button>
    <button class="hud-live-return-btn"></button>
    <input class="event-min-input" value="0" />
    <input class="event-odd-input" value="" />
    <button class="event-apply-btn"></button>
    <button class="event-clear-btn"></button>
    <button class="timer-play-pause-btn"></button>
    <button class="timer-reset-btn"></button>
    <button class="new-game-btn"></button>
    <span class="hud-minute-hero-badge"></span>
    <span class="hud-odd-justa-hero"></span>
    <span class="hud-zone-badge zone-media"></span>
    <span class="hud-diff-badge diff-fair"></span>
    <span class="hud-sim-tag" style="display:none;"></span>
    <span class="hud-live-return-btn" style="display:none;"></span>
    <span class="hud-live-minute-label"></span>
    <span class="hud-projected-minute-label"></span>
    <span class="bloco1-topo-val"></span>
    <span class="bloco1-fundo-val"></span>
    <span class="bloco2-topo-val"></span>
    <span class="bloco2-fundo-val"></span>
    <span class="timer-display"></span>
    <span class="period-start-time"></span>
    <tbody class="event-log-body"></tbody>
  `;
  document.body.appendChild(div);
  return div;
}

// ─── Setup global ─────────────────────────────────────────────────────────────

let container;
let slot;

beforeEach(() => {
  jest.clearAllMocks();

  // Restaura retorno padrão dos mocks antes de cada teste
  getMinuteMetrics.mockReturnValue({
    oddJusta: 3.35,
    zona: 'Normal',
    topo1: 3.5,
    fundo1: 3.2,
    topo2: 3.7,
    fundo2: 3.0,
  });
  calculateMinuteCurve.mockReturnValue([]);
  calibrateOpeningOdd.mockReturnValue(null);
  findClosestLadder.mockReturnValue({ tickIndex: 100, odd: 3.35 });

  // Limpa containers anteriores
  document.body.innerHTML = '';
  container = buildContainer();

  slot = new GameSlot(1, container, {
    getMasterRed: () => 200,
    onTradeCompleted: jest.fn(),
    onOpenPendulos: jest.fn(),
  });
});

afterEach(() => {
  // Limpa timer para evitar vazamento entre testes
  if (slot.timerInterval) clearInterval(slot.timerInterval);
});

// ─── 1. updateUI: guards para propriedades nulas ──────────────────────────────

describe('Correção 1 – updateUI: guards para propriedades nulas em cm', () => {
  test('não lança erro quando topo1/fundo1/topo2/fundo2 são null', () => {
    getMinuteMetrics.mockReturnValue({
      oddJusta: 3.35,
      zona: 'Normal',
      topo1: null,
      fundo1: null,
      topo2: null,
      fundo2: null,
    });

    expect(() => slot.updateUI()).not.toThrow();
  });

  test('exibe "--" nas células de bloco quando propriedades são null', () => {
    getMinuteMetrics.mockReturnValue({
      oddJusta: 3.35,
      zona: 'Normal',
      topo1: null,
      fundo1: null,
      topo2: null,
      fundo2: null,
    });

    slot.recalculate();

    expect(container.querySelector('.bloco1-topo-val').textContent).toBe('--');
    expect(container.querySelector('.bloco1-fundo-val').textContent).toBe('--');
    expect(container.querySelector('.bloco2-topo-val').textContent).toBe('--');
    expect(container.querySelector('.bloco2-fundo-val').textContent).toBe('--');
  });

  test('exibe valores formatados quando propriedades existem', () => {
    getMinuteMetrics.mockReturnValue({
      oddJusta: 3.35,
      zona: 'Normal',
      topo1: 3.5,
      fundo1: 3.2,
      topo2: 3.7,
      fundo2: 3.0,
    });

    slot.recalculate();

    expect(container.querySelector('.bloco1-topo-val').textContent).toBe('3.50');
    expect(container.querySelector('.bloco1-fundo-val').textContent).toBe('3.20');
    expect(container.querySelector('.bloco2-topo-val').textContent).toBe('3.70');
    expect(container.querySelector('.bloco2-fundo-val').textContent).toBe('3.00');
  });

  test('não lança erro quando currentMetrics é null (recalculate retorna cedo)', () => {
    getMinuteMetrics.mockReturnValue(null);
    expect(() => slot.recalculate()).not.toThrow();
  });
});

// ─── 2. applyEventOverride: cache único e guard para null ─────────────────────

describe('Correção 2 – applyEventOverride: guard quando getMinuteMetricsFor retorna null', () => {
  test('não lança erro quando getMinuteMetricsFor retorna null após recomputeCurve', () => {
    // Primeira chamada (para oldOdd) retorna valor; após recomputeCurve, retorna null
    getMinuteMetrics
      .mockReturnValueOnce({
        oddJusta: 3.35,
        zona: 'Normal',
        topo1: 3.5,
        fundo1: 3.2,
        topo2: 3.7,
        fundo2: 3.0,
      }) // construtor
      .mockReturnValueOnce(null); // chamada dentro de applyEventOverride após recomputeCurve

    expect(() => slot.applyEventOverride(0, 3.5)).not.toThrow();
  });

  test('não adiciona linha no sheetLog quando updatedMetrics é null', () => {
    const initialLogLength = slot.state.sheetLog.length;

    // Após recomputeCurve, metrics retorna null
    getMinuteMetrics.mockReturnValue(null);

    slot.applyEventOverride(0, 3.5);

    expect(slot.state.sheetLog.length).toBe(initialLogLength);
  });

  test('adiciona linha no sheetLog quando metrics é válido', () => {
    const initialLogLength = slot.state.sheetLog.length;

    getMinuteMetrics.mockReturnValue({
      oddJusta: 3.35,
      zona: 'Normal',
      topo1: 3.5,
      fundo1: 3.2,
      topo2: 3.7,
      fundo2: 3.0,
    });

    slot.applyEventOverride(0, 3.5);

    expect(slot.state.sheetLog.length).toBe(initialLogLength + 1);
  });

  test('bloco1/bloco2 são null quando topo/fundo são null no metrics', () => {
    getMinuteMetrics.mockReturnValue({
      oddJusta: 3.35,
      zona: 'Normal',
      topo1: null,
      fundo1: null,
      topo2: null,
      fundo2: null,
    });

    slot.applyEventOverride(0, 3.6);

    expect(slot.state.sheetLog[0].bloco1).toBeNull();
    expect(slot.state.sheetLog[0].bloco2).toBeNull();
  });
});

// ─── 3. renderEventLog: guard para fairOddAfterUpdate ────────────────────────

describe('Correção 3 – renderEventLog: guard para fairOddAfterUpdate nulo', () => {
  test('não lança erro quando fairOddAfterUpdate é undefined (registro legado)', () => {
    slot.state.sheetLog = [
      {
        minute: 1,
        period: 'HT',
        oldOdd: null,
        newOdd: 3.5,
        openingOdd: 3.35,
        fairOddAfterUpdate: undefined, // campo ausente em registros legados
        bloco1: null,
        bloco2: null,
      },
    ];

    expect(() => slot.renderEventLog()).not.toThrow();
  });

  test('exibe "-" quando fairOddAfterUpdate é null', () => {
    slot.state.sheetLog = [
      {
        minute: 1,
        period: 'HT',
        oldOdd: null,
        newOdd: 3.5,
        openingOdd: 3.35,
        fairOddAfterUpdate: null,
        bloco1: null,
        bloco2: null,
      },
    ];

    slot.renderEventLog();

    const cells = container.querySelectorAll('.event-log-body td');
    // A 5ª célula (índice 4) é fairOddAfterUpdate
    expect(cells[4].textContent).toBe('-');
  });

  test('exibe valor formatado quando fairOddAfterUpdate é número válido', () => {
    slot.state.sheetLog = [
      {
        minute: 1,
        period: 'HT',
        oldOdd: null,
        newOdd: 3.5,
        openingOdd: 3.35,
        fairOddAfterUpdate: 3.4,
        bloco1: null,
        bloco2: null,
      },
    ];

    slot.renderEventLog();

    const cells = container.querySelectorAll('.event-log-body td');
    expect(cells[4].textContent).toBe('3.40');
  });
});

// ─── 4. recomputeCurve: guard para findClosestLadder retornando null ──────────

describe('Correção 4 – recomputeCurve: guard quando findClosestLadder retorna null', () => {
  test('não lança erro quando findClosestLadder retorna null', () => {
    findClosestLadder.mockReturnValue(null);
    expect(() => slot.recomputeCurve()).not.toThrow();
  });

  test('atribui ticksPorMinuto = 0 quando findClosestLadder retorna null', () => {
    findClosestLadder.mockReturnValue(null);
    slot.recomputeCurve();
    expect(slot.state.ticksPorMinuto).toBe(0);
  });

  test('atribui ticksPorMinuto correto quando findClosestLadder retorna objeto válido', () => {
    findClosestLadder.mockReturnValue({ tickIndex: 94, odd: 3.35 });
    slot.recomputeCurve();
    // totalMin = 45 + 2 (addedMinutes padrão HT) = 47
    const expected = Number((94 / 47).toFixed(2));
    expect(slot.state.ticksPorMinuto).toBe(expected);
  });

  test('não lança erro quando findClosestLadder retorna undefined', () => {
    findClosestLadder.mockReturnValue(undefined);
    expect(() => slot.recomputeCurve()).not.toThrow();
    expect(slot.state.ticksPorMinuto).toBe(0);
  });
});

// ─── 5. syncAddedMinutes: recalculate chamado apenas uma vez ─────────────────

describe('Correção 5 – syncAddedMinutes: recalculate chamado apenas uma vez', () => {
  test('recalculate é chamado exatamente uma vez após render + bindEvents', () => {
    slot.state.pendingAddedMinutes = 3;
    const recalculateSpy = jest.spyOn(slot, 'recalculate');
    const renderSpy = jest.spyOn(slot, 'render');
    const bindEventsSpy = jest.spyOn(slot, 'bindEvents');

    slot.syncAddedMinutes();

    expect(renderSpy).toHaveBeenCalledTimes(1);
    expect(bindEventsSpy).toHaveBeenCalledTimes(1);
    expect(recalculateSpy).toHaveBeenCalledTimes(1);
  });

  test('pendingAddedMinutes é limpo após sync', () => {
    slot.state.pendingAddedMinutes = 4;
    slot.syncAddedMinutes();
    expect(slot.state.pendingAddedMinutes).toBeNull();
  });

  test('addedMinutes é atualizado com o valor pendente', () => {
    slot.state.pendingAddedMinutes = 5;
    slot.syncAddedMinutes();
    expect(slot.state.addedMinutes).toBe(5);
  });

  test('não faz nada quando pendingAddedMinutes é null', () => {
    slot.state.pendingAddedMinutes = null;
    const recalculateSpy = jest.spyOn(slot, 'recalculate');
    slot.syncAddedMinutes();
    expect(recalculateSpy).not.toHaveBeenCalled();
  });
});

// ─── 6. syncFromTV: não recria timer se já estiver rodando ───────────────────

describe('Correção 6 – syncFromTV: evita timer duplicado', () => {
  test('não chama startTimer quando timerRunning já é true', () => {
    slot.state.timerRunning = true;
    const startTimerSpy = jest.spyOn(slot, 'startTimer');

    slot.syncFromTV();

    expect(startTimerSpy).not.toHaveBeenCalled();
  });

  test('chama startTimer quando timerRunning é false', () => {
    slot.state.timerRunning = false;
    const startTimerSpy = jest.spyOn(slot, 'startTimer').mockImplementation(() => {
      slot.state.timerRunning = true;
    });

    slot.syncFromTV();

    expect(startTimerSpy).toHaveBeenCalledTimes(1);
  });

  test('sincroniza estado corretamente independente do timerRunning', () => {
    slot.state.timerRunning = true;
    slot.state.tvMinuteInput = 10; // minuto TV = 10 (display) → interno = 11

    slot.syncFromTV();

    expect(slot.state.isSimulating).toBe(false);
    expect(slot.state.timerPaused).toBe(false);
    expect(slot.state.currentMinute).toBe(slot.state.liveMinute);
  });

  test('não cria intervalo duplicado ao chamar syncFromTV duas vezes com timer rodando', () => {
    // Simula timer já rodando antes da segunda chamada
    slot.state.timerRunning = false;

    // Primeira chamada: inicia o timer normalmente
    jest.spyOn(slot, 'startTimer').mockImplementation(() => {
      slot.state.timerRunning = true;
    });

    slot.syncFromTV(); // deve chamar startTimer (timerRunning era false)
    expect(slot.startTimer).toHaveBeenCalledTimes(1);

    // Segunda chamada: timer já está rodando
    slot.syncFromTV(); // NÃO deve chamar startTimer novamente
    expect(slot.startTimer).toHaveBeenCalledTimes(1); // ainda 1, não 2
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 7 — Funções de consulta e cálculo de minuto
// ═══════════════════════════════════════════════════════════════════════════

describe('getNominalEndMinute / getProjectionMaxMinute', () => {
  test('retorna 45 para HT e 90 para FT em getNominalEndMinute', () => {
    expect(slot.getNominalEndMinute()).toBe(45);
    slot.state.period = 'FT';
    expect(slot.getNominalEndMinute()).toBe(90);
  });

  test('retorna 46 para HT e 93 para FT em getProjectionMaxMinute', () => {
    expect(slot.getProjectionMaxMinute()).toBe(46);
    slot.state.period = 'FT';
    expect(slot.getProjectionMaxMinute()).toBe(93);
  });
});

describe('getDisplayMinute / getInternalMinute', () => {
  test('getDisplayMinute retorna minute - 1 (mínimo 0)', () => {
    expect(slot.getDisplayMinute(10)).toBe(9);
    expect(slot.getDisplayMinute(1)).toBe(0);
    expect(slot.getDisplayMinute(0)).toBe(0); // clamp em 0
  });

  test('getInternalMinute retorna displayMinute + 1', () => {
    expect(slot.getInternalMinute(9)).toBe(10);
    expect(slot.getInternalMinute(0)).toBe(1);
  });

  test('getInternalMinute retorna liveMinute para entrada inválida', () => {
    slot.state.liveMinute = 5;
    expect(slot.getInternalMinute('abc')).toBe(slot.state.liveMinute);
    expect(slot.getInternalMinute(NaN)).toBe(slot.state.liveMinute);
  });
});

describe('getEffectiveAddedMinutes', () => {
  test('retorna 0 quando addedMinutesActive é false e não está simulando', () => {
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = false;
    expect(slot.getEffectiveAddedMinutes()).toBe(0);
  });

  test('retorna addedMinutes quando addedMinutesActive é true', () => {
    slot.state.addedMinutesActive = true;
    slot.state.addedMinutes = 3;
    expect(slot.getEffectiveAddedMinutes()).toBe(3);
  });

  test('retorna addedMinutes quando simulando além do nominalEnd', () => {
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = true;
    slot.state.projectedMinute = 46; // >= 45 (nominalEnd HT)
    slot.state.addedMinutes = 2;
    expect(slot.getEffectiveAddedMinutes()).toBe(2);
  });
});

describe('getCurveEndMinute', () => {
  test('retorna nominalEnd + addedMinutes quando addedMinutesSynced é true', () => {
    slot.state.addedMinutesSynced = true;
    slot.state.addedMinutes = 3;
    // HT: 45 + 3 = 48
    expect(slot.getCurveEndMinute()).toBe(48);
  });

  test('retorna getProjectionMaxMinute quando não synced', () => {
    slot.state.addedMinutesSynced = false;
    expect(slot.getCurveEndMinute()).toBe(slot.getProjectionMaxMinute());
  });
});

describe('getMaxMinute', () => {
  test('retorna nominalEnd + effective addedMinutes', () => {
    slot.state.addedMinutesActive = true;
    slot.state.addedMinutes = 2;
    // HT: 45 + 2 = 47
    expect(slot.getMaxMinute()).toBe(47);
  });

  test('retorna nominalEnd quando addedMinutes não ativos', () => {
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = false;
    expect(slot.getMaxMinute()).toBe(45);
  });
});

describe('getLiveGameMinute', () => {
  test('calcula minuto corretamente a partir de timerSeconds', () => {
    slot.state.period = 'HT';
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = false;
    slot.state.timerSeconds = 120; // 2 minutos
    // HT: minStart=1, m = 1 + floor(120/60) = 3
    expect(slot.getLiveGameMinute()).toBe(3);
  });

  test('não ultrapassa getMaxMinute', () => {
    slot.state.period = 'HT';
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = false;
    slot.state.timerSeconds = 99999;
    expect(slot.getLiveGameMinute()).toBe(slot.getMaxMinute());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 8 — setPeriod
// ═══════════════════════════════════════════════════════════════════════════

describe('setPeriod', () => {
  test('troca para FT e ajusta estado', () => {
    slot.setPeriod('FT');
    expect(slot.state.period).toBe('FT');
    expect(slot.state.currentMinute).toBe(46);
    expect(slot.state.liveMinute).toBe(46);
    expect(slot.state.initialOdd).toBe(5.1);
    expect(slot.state.addedMinutes).toBe(5);
  });

  test('troca de volta para HT e ajusta estado', () => {
    slot.setPeriod('FT');
    slot.setPeriod('HT');
    expect(slot.state.period).toBe('HT');
    expect(slot.state.currentMinute).toBe(1);
    expect(slot.state.initialOdd).toBe(3.35);
    expect(slot.state.addedMinutes).toBe(2);
  });

  test('limpa liveCorrections e liveOddCurrentMinute ao trocar período', () => {
    slot.state.liveCorrections = { 10: 3.5 };
    slot.state.liveOddCurrentMinute = '3.50';
    slot.setPeriod('FT');
    expect(slot.state.liveCorrections).toEqual({});
    expect(slot.state.liveOddCurrentMinute).toBe('');
  });

  test('reseta isSimulating e addedMinutesActive', () => {
    slot.state.isSimulating = true;
    slot.state.addedMinutesActive = true;
    slot.setPeriod('HT');
    expect(slot.state.isSimulating).toBe(false);
    expect(slot.state.addedMinutesActive).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 9 — setInitialOdd / adjustInitialOdd
// ═══════════════════════════════════════════════════════════════════════════

describe('setInitialOdd', () => {
  test('atualiza initialOdd e limpa correções', () => {
    slot.state.liveCorrections = { 5: 3.0 };
    slot.setInitialOdd(4.0);
    expect(slot.state.initialOdd).toBe(4.0);
    expect(slot.state.currentOddBase).toBe(4.0);
    expect(slot.state.currentOddBaseMinute).toBeNull();
    expect(slot.state.liveCorrections).toEqual({});
  });

  test('ignora valores inválidos abaixo de 1.01', () => {
    const prev = slot.state.initialOdd;
    slot.setInitialOdd(0.5);
    expect(slot.state.initialOdd).toBe(prev);
  });

  test('ignora NaN', () => {
    const prev = slot.state.initialOdd;
    slot.setInitialOdd('abc');
    expect(slot.state.initialOdd).toBe(prev);
  });
});

describe('adjustInitialOdd', () => {
  test('chama moveOddTicks com o tick correto', () => {
    const { moveOddTicks } = jest.requireMock('../core/oddsCalculator.js');
    const oddBefore = slot.state.initialOdd;
    slot.adjustInitialOdd(2);
    expect(moveOddTicks).toHaveBeenCalledWith(oddBefore, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 10 — setAddedMinutes / adjustAddedMinutes
// ═══════════════════════════════════════════════════════════════════════════

describe('setAddedMinutes / adjustAddedMinutes', () => {
  test('setAddedMinutes armazena em pendingAddedMinutes', () => {
    slot.setAddedMinutes(4);
    expect(slot.state.pendingAddedMinutes).toBe(4);
  });

  test('setAddedMinutes clampeia negativos para 0', () => {
    slot.setAddedMinutes(-3);
    expect(slot.state.pendingAddedMinutes).toBe(0);
  });

  test('adjustAddedMinutes usa pendingAddedMinutes quando presente', () => {
    slot.state.pendingAddedMinutes = 3;
    slot.adjustAddedMinutes(1);
    expect(slot.state.pendingAddedMinutes).toBe(4);
  });

  test('adjustAddedMinutes usa addedMinutes quando pending é null', () => {
    slot.state.pendingAddedMinutes = null;
    slot.state.addedMinutes = 2;
    slot.adjustAddedMinutes(1);
    expect(slot.state.pendingAddedMinutes).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 11 — setTVMinute / adjustTVMinute
// ═══════════════════════════════════════════════════════════════════════════

describe('setTVMinute / adjustTVMinute', () => {
  test('setTVMinute clampeia ao range do período', () => {
    slot.state.period = 'HT';
    slot.state.addedMinutes = 2;
    slot.setTVMinute(100); // acima do max (display 46)
    // display max = getDisplayMinute(45+2) = 46, interno = 47
    expect(slot.state.tvMinuteInput).toBe(47);
  });

  test('setTVMinute aceita valor válido dentro do range', () => {
    slot.state.period = 'HT';
    slot.setTVMinute(10); // display 10 → interno 11
    expect(slot.state.tvMinuteInput).toBe(11);
  });

  test('adjustTVMinute incrementa corretamente', () => {
    slot.state.period = 'HT';
    slot.setTVMinute(10);
    const before = slot.state.tvMinuteInput;
    slot.adjustTVMinute(1);
    expect(slot.state.tvMinuteInput).toBe(before + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 12 — setMinute
// ═══════════════════════════════════════════════════════════════════════════

describe('setMinute', () => {
  test('atualiza currentMinute, liveMinute, timerSeconds', () => {
    slot.state.period = 'HT';
    slot.setMinute(10);
    expect(slot.state.currentMinute).toBe(10);
    expect(slot.state.liveMinute).toBe(10);
    expect(slot.state.timerSeconds).toBe((10 - 1) * 60);
  });

  test('clampeia abaixo do mínimo para minStart', () => {
    slot.state.period = 'HT';
    slot.setMinute(-5);
    expect(slot.state.currentMinute).toBe(1);
  });

  test('clampeia acima do máximo para maxMin', () => {
    slot.state.period = 'HT';
    slot.state.addedMinutes = 2;
    slot.setMinute(999);
    expect(slot.state.currentMinute).toBe(47);
  });

  test('carrega liveOddCurrentMinute da correção registrada', () => {
    slot.state.liveCorrections[5] = 3.8;
    slot.setMinute(5);
    expect(slot.state.liveOddCurrentMinute).toBe('3.8');
  });

  test('reseta isSimulating', () => {
    slot.state.isSimulating = true;
    slot.setMinute(3);
    expect(slot.state.isSimulating).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 13 — setSimulatedMinute / adjustCurrentMinute / returnToLiveMinute
// ═══════════════════════════════════════════════════════════════════════════

describe('setSimulatedMinute', () => {
  test('define projectedMinute e projectionOffset', () => {
    slot.state.liveMinute = 10;
    slot.setSimulatedMinute(12);
    expect(slot.state.projectedMinute).toBe(12);
    expect(slot.state.projectionOffset).toBe(2);
  });

  test('marca isSimulating quando projectedMinute difere do live', () => {
    slot.state.timerSeconds = 540; // minuto 10 no HT
    slot.state.liveMinute = 10;
    slot.setSimulatedMinute(15);
    expect(slot.state.isSimulating).toBe(true);
  });

  test('clampeia ao getProjectionMaxMinute', () => {
    slot.state.liveMinute = 1;
    slot.setSimulatedMinute(999);
    expect(slot.state.projectedMinute).toBe(slot.getProjectionMaxMinute());
  });
});

describe('adjustCurrentMinute', () => {
  test('delega para setSimulatedMinute com offset', () => {
    slot.state.liveMinute = 10;
    slot.state.projectedMinute = 10;
    const spy = jest.spyOn(slot, 'setSimulatedMinute');
    slot.adjustCurrentMinute(3);
    expect(spy).toHaveBeenCalledWith(13);
  });
});

describe('returnToLiveMinute', () => {
  test('reseta isSimulating, projectionOffset e alinha currentMinute ao live', () => {
    slot.state.isSimulating = true;
    slot.state.projectionOffset = 5;
    slot.state.timerSeconds = 480; // minuto 9 no HT
    slot.returnToLiveMinute();
    expect(slot.state.isSimulating).toBe(false);
    expect(slot.state.projectionOffset).toBe(0);
    expect(slot.state.currentMinute).toBe(slot.state.liveMinute);
  });

  test('define timerPaused como false', () => {
    slot.state.timerPaused = true;
    slot.returnToLiveMinute();
    expect(slot.state.timerPaused).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 14 — activateAddedMinutesIfReached
// ═══════════════════════════════════════════════════════════════════════════

describe('activateAddedMinutesIfReached', () => {
  test('ativa addedMinutes quando atinge o nominalEnd', () => {
    slot.state.addedMinutesActive = false;
    slot.state.addedMinutes = 2;
    const result = slot.activateAddedMinutesIfReached(45);
    expect(result).toBe(true);
    expect(slot.state.addedMinutesActive).toBe(true);
  });

  test('não ativa quando já está ativo', () => {
    slot.state.addedMinutesActive = true;
    const result = slot.activateAddedMinutesIfReached(45);
    expect(result).toBe(false);
  });

  test('não ativa antes do nominalEnd', () => {
    slot.state.addedMinutesActive = false;
    const result = slot.activateAddedMinutesIfReached(30);
    expect(result).toBe(false);
    expect(slot.state.addedMinutesActive).toBe(false);
  });

  test('não ativa quando addedMinutes é 0', () => {
    slot.state.addedMinutesActive = false;
    slot.state.addedMinutes = 0;
    slot.activateAddedMinutesIfReached(45);
    expect(slot.state.addedMinutesActive).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 15 — clearEvents / startNewGame
// ═══════════════════════════════════════════════════════════════════════════

describe('clearEvents', () => {
  test('limpa sheetLog, liveCorrections e reseta oddBase', () => {
    slot.state.sheetLog = [{ minute: 1 }];
    slot.state.liveCorrections = { 5: 3.0 };
    slot.state.currentOddBase = 4.0;
    slot.clearEvents();
    expect(slot.state.sheetLog).toHaveLength(0);
    expect(slot.state.liveCorrections).toEqual({});
    expect(slot.state.currentOddBase).toBe(slot.state.initialOdd);
    expect(slot.state.currentOddBaseMinute).toBeNull();
    expect(slot.state.lastSheetRow).toBeNull();
  });
});

describe('startNewGame', () => {
  test('reseta minutos e acréscimos para HT', () => {
    slot.state.currentMinute = 30;
    slot.state.addedMinutes = 5;
    slot.startNewGame();
    expect(slot.state.tvMinuteInput).toBe(1);
    expect(slot.state.currentMinute).toBe(1);
    expect(slot.state.addedMinutes).toBe(2);
    expect(slot.state.isSimulating).toBe(false);
  });

  test('limpa periodStartTimes', () => {
    slot.state.periodStartTimes = { HT: '2024-01-01', FT: '2024-01-01' };
    slot.startNewGame();
    expect(slot.state.periodStartTimes).toEqual({ HT: null, FT: null });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 16 — registerPeriodStart / updatePeriodStartUI / formatPeriodStartTime
// ═══════════════════════════════════════════════════════════════════════════

describe('registerPeriodStart', () => {
  test('registra timestamp para o período atual', () => {
    slot.state.period = 'HT';
    slot.registerPeriodStart(1);
    expect(slot.state.periodStartTimes.HT).not.toBeNull();
    expect(typeof slot.state.periodStartTimes.HT).toBe('string');
  });
});

describe('formatPeriodStartTime', () => {
  test('retorna "não registrado" para valor nulo', () => {
    expect(slot.formatPeriodStartTime(null)).toBe('não registrado');
    expect(slot.formatPeriodStartTime(undefined)).toBe('não registrado');
    expect(slot.formatPeriodStartTime('')).toBe('não registrado');
  });

  test('retorna string de hora formatada para ISO válido', () => {
    const result = slot.formatPeriodStartTime('2024-01-15T14:30:00.000Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 17 — pauseTimer / resetTimer / updateTimerDisplay
// ═══════════════════════════════════════════════════════════════════════════

describe('pauseTimer', () => {
  test('para o intervalo e marca timerPaused=true, timerRunning=false', () => {
    slot.state.timerRunning = true;
    slot.state.timerPaused = false;
    slot.pauseTimer();
    expect(slot.state.timerRunning).toBe(false);
    expect(slot.state.timerPaused).toBe(true);
    expect(slot.timerInterval).toBeNull();
  });
});

describe('resetTimer', () => {
  test('pausa e volta para o minuto inicial do período', () => {
    slot.state.period = 'HT';
    slot.state.timerSeconds = 600;
    slot.resetTimer();
    expect(slot.state.timerPaused).toBe(true);
    expect(slot.state.currentMinute).toBe(1);
    expect(slot.state.timerSeconds).toBe(0);
  });

  test('volta para minuto 46 em FT', () => {
    slot.setPeriod('FT');
    slot.state.timerSeconds = 600;
    slot.resetTimer();
    expect(slot.state.currentMinute).toBe(46);
  });
});

describe('updateTimerDisplay', () => {
  test('atualiza o textContent do timer-display', () => {
    slot.state.period = 'HT';
    slot.state.addedMinutesActive = false;
    slot.state.isSimulating = false;
    slot.state.timerSeconds = 65; // 1m05s → display "01:05'"
    slot.updateTimerDisplay();
    const display = container.querySelector('.timer-display');
    expect(display.textContent).toBe("01:05'");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOCO 18 — hydrateEventCorrections / loadSheetLog / loadPeriodStartTimes
// ═══════════════════════════════════════════════════════════════════════════

describe('hydrateEventCorrections', () => {
  test('popula liveCorrections a partir de sheetLog existente', () => {
    slot.state.sheetLog = [
      { minute: 10, newOdd: 3.5 },
      { minute: 5, newOdd: 3.8 },
    ];
    slot.hydrateEventCorrections();
    expect(slot.state.liveCorrections[10]).toBe(3.5);
    expect(slot.state.liveCorrections[5]).toBe(3.8);
  });

  test('define currentOddBase a partir do primeiro evento (mais recente)', () => {
    slot.state.sheetLog = [{ minute: 10, newOdd: 3.9 }];
    slot.hydrateEventCorrections();
    expect(slot.state.currentOddBase).toBe(3.9);
    expect(slot.state.currentOddBaseMinute).toBe(10);
  });

  test('não falha com sheetLog vazio', () => {
    slot.state.sheetLog = [];
    expect(() => slot.hydrateEventCorrections()).not.toThrow();
  });
});

describe('loadSheetLog / loadPeriodStartTimes (localStorage)', () => {
  let testSlot;
  let testContainer;
  const TEST_SLOT_ID = 99; // ID isolado para não interferir com o slot global

  beforeEach(() => {
    // Remove apenas as chaves deste slot de teste, sem afetar o slot global
    localStorage.removeItem(`projeto_back_under_events_slot_${TEST_SLOT_ID}`);
    localStorage.removeItem(`projeto_back_under_period_start_slot_${TEST_SLOT_ID}`);

    testContainer = buildContainer();
    testSlot = new GameSlot(TEST_SLOT_ID, testContainer, {
      getMasterRed: () => 200,
      onTradeCompleted: jest.fn(),
      onOpenPendulos: jest.fn(),
    });
  });

  afterEach(() => {
    if (testSlot.timerInterval) clearInterval(testSlot.timerInterval);
  });

  test('loadSheetLog retorna [] quando não há dados salvos', () => {
    localStorage.removeItem(`projeto_back_under_events_slot_${TEST_SLOT_ID}`);
    expect(testSlot.loadSheetLog()).toEqual([]);
  });

  test('loadSheetLog retorna dados salvos corretamente', () => {
    const data = [{ minute: 5, newOdd: 3.5 }];
    localStorage.setItem(`projeto_back_under_events_slot_${TEST_SLOT_ID}`, JSON.stringify(data));
    expect(testSlot.loadSheetLog()).toEqual(data);
  });

  test('loadSheetLog retorna [] para JSON inválido', () => {
    localStorage.setItem(`projeto_back_under_events_slot_${TEST_SLOT_ID}`, 'invalid{json');
    expect(testSlot.loadSheetLog()).toEqual([]);
  });

  test('loadPeriodStartTimes retorna {HT:null,FT:null} sem dados', () => {
    localStorage.removeItem(`projeto_back_under_period_start_slot_${TEST_SLOT_ID}`);
    expect(testSlot.loadPeriodStartTimes()).toEqual({ HT: null, FT: null });
  });
});

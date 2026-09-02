/**
 * Gerenciador e Visualizador do Histórico de Operações (Trade Logger)
 */
import { formatCurrency, formatPercent } from '../core/oddsCalculator.js';

export class OperationsHistory {
  constructor(onHistoryChange) {
    this.storageKey = 'projeto_back_under_history_v1';
    this.trades = this.loadTrades();
    this.onHistoryChange = onHistoryChange;
    this.initElements();
  }

  loadTrades() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
      return [];
    }
  }

  saveTrades() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.trades));
      if (this.onHistoryChange) {
        this.onHistoryChange(this.getStats());
      }
    } catch (e) {
      console.error('Erro ao salvar histórico:', e);
    }
  }

  addTrade(trade) {
    const newTrade = {
      id: 'trade_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      dateStr: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      gameName: trade.gameName || 'Jogo Avulso',
      strategyName: trade.strategyName || 'Back Under',
      oddEntrada: Number(trade.oddEntrada) || 0,
      oddSaida: Number(trade.oddSaida) || 0,
      stake: Number(trade.stake) || 0,
      lucroLiquido: Number(trade.lucroLiquido) || 0,
      roiPct: Number(trade.roiPct) || 0,
      ticks: Number(trade.ticks) || 0,
      status: trade.lucroLiquido > 0.01 ? 'GREEN' : (trade.lucroLiquido < -0.01 ? 'RED' : '0X0')
    };

    this.trades.unshift(newTrade);
    this.saveTrades();
    this.render();
    return newTrade;
  }

  clearHistory() {
    if (confirm('Deseja realmente limpar todo o histórico de operações desta sessão?')) {
      this.trades = [];
      this.saveTrades();
      this.render();
    }
  }

  getStats() {
    const totalTrades = this.trades.length;
    let totalGreens = 0;
    let totalReds = 0;
    let totalBreakeven = 0;
    let totalPL = 0;
    let totalStakeVolume = 0;

    this.trades.forEach(t => {
      totalPL += t.lucroLiquido;
      totalStakeVolume += t.stake;
      if (t.status === 'GREEN') totalGreens++;
      else if (t.status === 'RED') totalReds++;
      else totalBreakeven++;
    });

    const winRate = totalTrades > 0 ? (totalGreens / totalTrades) * 100 : 0;
    const roiGeral = totalStakeVolume > 0 ? (totalPL / totalStakeVolume) * 100 : 0;

    return {
      totalTrades,
      totalGreens,
      totalReds,
      totalBreakeven,
      totalPL,
      totalStakeVolume,
      winRate,
      roiGeral
    };
  }

  initElements() {
    this.tableBody = document.getElementById('historyTableBody');
    this.exportBtn = document.getElementById('exportHistoryBtn');
    this.clearBtn = document.getElementById('clearHistoryBtn');
    this.emptyMessage = document.getElementById('emptyHistoryMessage');

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportCSV());
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clearHistory());
    }

    this.render();
  }

  render() {
    if (!this.tableBody) return;

    if (this.trades.length === 0) {
      this.tableBody.innerHTML = '';
      if (this.emptyMessage) this.emptyMessage.style.display = 'block';
      return;
    }

    if (this.emptyMessage) this.emptyMessage.style.display = 'none';

    this.tableBody.innerHTML = this.trades.slice(0, 30).map(t => {
      const isGreen = t.status === 'GREEN';
      const isRed = t.status === 'RED';
      const plClass = isGreen ? 'text-green' : (isRed ? 'text-red' : 'text-secondary');
      const badgeStyle = isGreen ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);' 
                                 : (isRed ? 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);' 
                                          : 'background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3);');

      return `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.75rem;">${t.dateStr}</td>
          <td style="font-weight: 600; color: #ffffff;">${t.gameName}</td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">${t.strategyName}</td>
          <td style="color: #facc15; font-weight: 700;">${t.oddEntrada.toFixed(2)}</td>
          <td style="color: #60a5fa; font-weight: 700;">${t.oddSaida.toFixed(2)}</td>
          <td style="color: var(--text-primary); font-weight: 600;">${formatCurrency(t.stake)}</td>
          <td class="${plClass}" style="font-weight: 800; font-size: 0.9rem;">${formatCurrency(t.lucroLiquido)}</td>
          <td class="${plClass}" style="font-weight: 700;">${formatPercent(t.roiPct)}</td>
          <td><span style="display: inline-block; padding: 0.15rem 0.45rem; border-radius: var(--radius-sm); font-size: 0.65rem; font-weight: 800; ${badgeStyle}">${t.status}</span></td>
        </tr>
      `;
    }).join('');
  }

  exportCSV() {
    if (this.trades.length === 0) {
      alert('Não há operações registradas para exportar.');
      return;
    }

    const headers = ['Data_Hora', 'Jogo', 'Estrategia', 'Odd_Entrada', 'Odd_Saida', 'Stake', 'Lucro_Liquido_R$', 'ROI_%', 'Status'];
    const rows = this.trades.map(t => [
      `"${t.timestamp}"`,
      `"${t.gameName}"`,
      `"${t.strategyName}"`,
      t.oddEntrada,
      t.oddSaida,
      t.stake,
      t.lucroLiquido,
      t.roiPct,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Back_Under_Trades_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

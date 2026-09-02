/**
 * Modal e Visualizador do Mapa de Pêndulos (Parede V6)
 */
import { PENDULOS_DATA } from '../core/pendulosData.js';

export class PenduloModal {
  constructor(onSelectPendulo) {
    this.onSelectPendulo = onSelectPendulo;
    this.isOpen = false;
    this.filterQuery = '';
    this.activeSlotId = null;
    this.initElements();
  }

  initElements() {
    this.overlay = document.getElementById('penduloModal');
    this.searchInput = document.getElementById('penduloSearchInput');
    this.tableBody = document.getElementById('penduloTableBody');
    this.closeBtn = document.getElementById('closePenduloModalBtn');

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.filterQuery = e.target.value.trim().toLowerCase();
        this.renderTable();
      });
    }

    // Esc para fechar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    this.renderTable();
  }

  open(slotId = null) {
    this.activeSlotId = slotId;
    this.isOpen = true;
    if (this.overlay) {
      this.overlay.classList.add('open');
    }
    if (this.searchInput) {
      this.searchInput.value = '';
      this.filterQuery = '';
      this.searchInput.focus();
    }
    this.renderTable();
  }

  close() {
    this.isOpen = false;
    if (this.overlay) {
      this.overlay.classList.remove('open');
    }
  }

  renderTable() {
    if (!this.tableBody) return;

    let filtered = PENDULOS_DATA;
    if (this.filterQuery) {
      filtered = PENDULOS_DATA.filter(item => {
        return item.ref365.toString().includes(this.filterQuery) ||
               item.oddJusta.toString().includes(this.filterQuery) ||
               item.saida.toString().includes(this.filterQuery) ||
               item.zona.toLowerCase().includes(this.filterQuery);
      });
    }

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Nenhum pêndulo encontrado para "${this.filterQuery}"
          </td>
        </tr>
      `;
      return;
    }

    this.tableBody.innerHTML = filtered.map(item => {
      let zonaClass = 'zone-lenta';
      if (item.zona === 'Rápida') zonaClass = 'zone-rapida';
      else if (item.zona === 'Média') zonaClass = 'zone-media';

      const caminhoStr = item.caminho.length > 0 ? item.caminho.join(' › ') : '-';

      return `
        <tr style="cursor: pointer;" data-odd-365="${item.ref365}" data-odd-justa="${item.oddJusta}">
          <td style="font-weight: 800; color: #facc15;">${item.ref365.toFixed(2)}</td>
          <td style="font-weight: 700; color: #ffffff;">${item.oddJusta.toFixed(2)}</td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">${caminhoStr}</td>
          <td style="font-weight: 700; color: var(--color-green);">${item.saida.toFixed(2)}</td>
          <td style="text-align: center; color: var(--color-cyan); font-weight: 700;">${item.ticks}</td>
          <td style="color: var(--text-secondary);">${item.valorTick.toFixed(2)}%</td>
          <td style="font-weight: 700; color: var(--color-green);">${item.valorBloco.toFixed(2)}%</td>
          <td><span class="zone-badge ${zonaClass}">${item.zona}</span></td>
        </tr>
      `;
    }).join('');

    // Adiciona evento de clique para aplicar ao slot ativo
    const rows = this.tableBody.querySelectorAll('tr[data-odd-365]');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const odd365 = parseFloat(row.getAttribute('data-odd-365'));
        if (this.onSelectPendulo) {
          this.onSelectPendulo(odd365, this.activeSlotId);
        }
        this.close();
      });
    });
  }
}

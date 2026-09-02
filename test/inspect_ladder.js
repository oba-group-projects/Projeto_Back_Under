import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

const sheet = wb.Sheets['LADDER'];
const range = XLSX.utils.decode_range(sheet['!ref']);

console.log('=== LADDER DUMP (First 30 rows) ===');
for (let r = 0; r <= 30; r++) {
  let line = `R${r + 1}: `;
  for (let c = 0; c <= Math.min(range.e.c, 10); c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (cell && (cell.v !== undefined || cell.f)) {
      line += `${addr}=[${cell.v}${cell.f ? ' f:' + cell.f : ''}] | `;
    }
  }
  console.log(line);
}

import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

const sheet = wb.Sheets['IN LIVE'];
const range = XLSX.utils.decode_range(sheet['!ref']);

for (let r = 0; r <= 8; r++) {
  let rowObj = {};
  for (let c = 0; c <= Math.min(range.e.c, 30); c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const colName = XLSX.utils.encode_col(c);
    const cell = sheet[addr];
    if (cell && (cell.v !== undefined || cell.f)) {
      rowObj[colName] = cell.f ? `[f: ${cell.f}]` : cell.v;
    }
  }
  console.log(`\n=== ROW ${r + 1} ===`, JSON.stringify(rowObj, null, 2));
}

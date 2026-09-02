import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

const sheet = wb.Sheets['IN LIVE'];
const range = XLSX.utils.decode_range(sheet['!ref']);

for (let r = 0; r <= 10; r++) {
  console.log(`\n--- ROW ${r + 1} ---`);
  for (let c = 0; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cell = sheet[addr];
    if (cell && (cell.v !== undefined || cell.f)) {
      console.log(`  ${addr} = [v: "${cell.v}"] ${cell.f ? 'f: ' + cell.f : ''}`);
    }
  }
}

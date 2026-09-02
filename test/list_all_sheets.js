import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

console.log('List of Sheet Names:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  console.log(`\n======================================================`);
  console.log(`Sheet: "${sheetName}" -> Range: ${sheet['!ref']}`);
  console.log(`======================================================`);
  
  // Vamos ler o cabeçalho e as primeiras 25 linhas
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 30); r++) {
    let rowCells = [];
    let hasContent = false;
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 20); c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      if (cell && (cell.v !== undefined || cell.f)) {
        hasContent = true;
        let desc = `${cellAddress}:`;
        if (cell.f) desc += `[f=${cell.f}]`;
        if (cell.v !== undefined) desc += `[v=${cell.v}]`;
        rowCells.push(desc);
      }
    }
    if (hasContent) {
      console.log(`L${r + 1}: ` + rowCells.join(' | '));
    }
  }
});

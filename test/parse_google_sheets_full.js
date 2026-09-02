import XLSX from 'xlsx';
import path from 'path';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
console.log('Reading Google Spreadsheet from:', filePath);

const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });
console.log('Sheets found:', wb.SheetNames);

wb.SheetNames.forEach(sheetName => {
  console.log(`\n======================================================================`);
  console.log(`📊 ABA: ${sheetName}`);
  console.log(`======================================================================`);
  
  const sheet = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  console.log(`Dimensão: ${sheet['!ref']} (Linhas 1 a ${range.e.r + 1}, Colunas 1 a ${range.e.c + 1})`);
  
  // Vamos ler as primeiras 120 linhas para entender o layout completo
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + 150); r++) {
    let rowCells = [];
    let hasContent = false;
    
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + 40); c++) {
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

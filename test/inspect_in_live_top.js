import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

function inspectSheetRows(sheetName, startRow = 1, endRow = 45) {
  console.log(`\n======================================================`);
  console.log(`🔍 ROWS ${startRow} to ${endRow} of sheet: "${sheetName}"`);
  console.log(`======================================================`);
  const sheet = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  
  for (let r = startRow - 1; r < endRow; r++) {
    let rowCells = [];
    let hasContent = false;
    for (let c = range.s.c; c <= range.e.c; c++) {
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
}

inspectSheetRows('IN LIVE', 1, 45);
inspectSheetRows('HTFT', 1, 30);

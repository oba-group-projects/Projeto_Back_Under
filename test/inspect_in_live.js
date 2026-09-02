import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

function inspectSheet(sheetName, maxRows = 60, maxCols = 25) {
  console.log(`\n======================================================================`);
  console.log(`📑 ABA: "${sheetName}"`);
  console.log(`======================================================================`);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    console.log('Sheet not found!');
    return;
  }
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
  console.log(`Range: ${sheet['!ref']} (Linhas 1-${range.e.r + 1}, Colunas 1-${range.e.c + 1})`);

  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + maxRows); r++) {
    let rowCells = [];
    let hasContent = false;
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + maxCols); c++) {
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

// Inspecionar 'IN LIVE', 'HTFT', 'BLOCOS (JUSTO 1)' e 'LADDER'
inspectSheet('IN LIVE', 80, 20);

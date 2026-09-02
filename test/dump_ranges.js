import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

function dumpCells(sheetName, minRow, maxRow, minCol, maxCol) {
  console.log(`\n======================================================`);
  console.log(`Dumping ${sheetName} [Rows ${minRow}-${maxRow}, Cols ${minCol}-${maxCol}]`);
  console.log(`======================================================`);
  const sheet = wb.Sheets[sheetName];
  for (let r = minRow - 1; r < maxRow; r++) {
    let line = `R${r + 1}: `;
    for (let c = minCol - 1; c < maxCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      if (cell && (cell.v !== undefined || cell.f)) {
        line += `${addr}=[v:${cell.v}${cell.f ? ' f:' + cell.f : ''}] | `;
      }
    }
    console.log(line);
  }
}

dumpCells('IN LIVE', 1, 10, 1, 30);
dumpCells('HTFT', 1, 10, 1, 30);
dumpCells('BLOCOS (JUSTO 1)', 1, 10, 1, 15);
dumpCells('BLOCOS (JUSTO 2)', 1, 10, 1, 15);

import XLSX from 'xlsx';

const filePath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';
const wb = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true, cellNF: true });

function inspectHeader(sheetName) {
  console.log(`\n======================================================`);
  console.log(`📋 CABEÇALHOS E ENTRADAS DA ABA: "${sheetName}"`);
  console.log(`======================================================`);
  const sheet = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

  for (let r = 0; r < Math.min(range.e.r + 1, 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      if (cell && (cell.v !== undefined || cell.f)) {
        let text = `${cellAddress}: `;
        if (cell.v !== undefined) text += `[v="${cell.v}"] `;
        if (cell.f) text += `[f=${cell.f}]`;
        console.log(text);
      }
    }
  }
}

inspectHeader('IN LIVE');
inspectHeader('HTFT');

import https from 'https';
import fs from 'fs';
import path from 'path';

const spreadsheetId = '1N1qP-n4e4LJTXvUGVm9CNiGySE9mvOrriGlvIZUWV0k';
const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
const destPath = 'c:/Users/pc_fa/Documents/Projeto_Back_Under/docs/planilha_google_docs.xlsx';

console.log('Downloading spreadsheet from Google Sheets...');
console.log('URL:', exportUrl);

function downloadFile(url, dest, callback) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    // Handle redirects if any (302/307)
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      console.log('Redirecting to:', response.headers.location);
      return downloadFile(response.headers.location, dest, callback);
    }
    
    if (response.statusCode !== 200) {
      console.error(`Download failed with status: ${response.statusCode} - ${response.statusMessage}`);
      return;
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        console.log(`Download completed successfully: ${dest} (${fs.statSync(dest).size} bytes)`);
        if (callback) callback();
      });
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Download error:', err.message);
  });
}

downloadFile(exportUrl, destPath, () => {
  console.log('Ready to parse sheets!');
});

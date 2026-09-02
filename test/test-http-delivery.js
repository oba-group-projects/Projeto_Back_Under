import http from 'http';

const paths = [
  '/',
  '/index.html',
  '/css/design-system.css',
  '/css/components.css',
  '/css/grid.css',
  '/js/app.js',
  '/js/components/GameSlot.js',
  '/js/components/PenduloModal.js',
  '/js/components/OperationsHistory.js',
  '/js/core/oddsCalculator.js',
  '/js/core/pendulosData.js',
  '/js/core/stakeManager.js',
  '/js/core/hedgeEngine.js'
];

async function checkUrl(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:8080${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          contentType: res.headers['content-type'],
          size: data.length
        });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

console.log('Validating HTTP server asset delivery...');
const results = await Promise.all(paths.map(checkUrl));

let allOk = true;
results.forEach(r => {
  if (r.status === 200 && r.size > 0) {
    console.log(`  ✅ [${r.status}] ${r.path} (${r.contentType}, ${r.size} bytes)`);
  } else {
    console.error(`  ❌ FAIL: ${r.path}`, r);
    allOk = false;
  }
});

if (allOk) {
  console.log('\n🎉 Todos os 13 arquivos e módulos do Projeto Back Under estão sendo servidos perfeitamente com código 200!');
} else {
  process.exit(1);
}

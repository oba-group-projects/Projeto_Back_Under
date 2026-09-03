import http from 'http';

const filesToTest = [
  '/',
  '/index.html',
  '/css/design-system.css',
  '/css/components.css',
  '/css/grid.css',
  '/js/app.js',
  '/js/components/GameSlot.js',
  '/js/components/PenduloModal.js',
  '/js/components/OperationsHistory.js',
  '/js/components/LoginModal.js',
  '/js/components/AdminDashboard.js',
  '/js/components/UserProfileModal.js',
  '/js/core/authManager.js',
  '/js/core/oddsCalculator.js',
  '/js/core/pendulosData.js',
  '/js/core/stakeManager.js',
  '/js/core/hedgeEngine.js'
];

console.log('Validating HTTP server asset delivery...');

function testUrl(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:8080${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ✅ [200] ${urlPath} (${res.headers['content-type']}, ${data.length} bytes)`);
          resolve(true);
        } else {
          console.error(`  ❌ [${res.statusCode}] ${urlPath}`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.error(`  ❌ Error fetching ${urlPath}:`, err.message);
      resolve(false);
    });
  });
}

async function runAll() {
  let allOk = true;
  for (const path of filesToTest) {
    const ok = await testUrl(path);
    if (!ok) allOk = false;
  }

  if (allOk) {
    console.log(`\n🎉 Todos os ${filesToTest.length} arquivos e módulos do Projeto Back Under estão sendo servidos perfeitamente com código 200!\n`);
  } else {
    console.error('\n⚠️ Alguns arquivos falharam na entrega HTTP.\n');
    process.exit(1);
  }
}

runAll();

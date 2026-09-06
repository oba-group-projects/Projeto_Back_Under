import { test, expect } from '@playwright/test';

async function openCockpit(page) {
  await page.addInitScript(() => {
    localStorage.setItem('projeto_back_under_session_v2', JSON.stringify({
      userId: 'usr_admin_1',
      role: 'admin',
      name: 'Teste',
      email: 'teste@example.com'
    }));
  });
  await page.goto('/');
  await expect(page.locator('#slotCard1')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openCockpit(page);
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#slotCard1 .new-game-btn').click();
});

test('inicia HT em 0 e sincroniza minuto TV sem deslocar para 11', async ({ page }) => {
  const slot = page.locator('#slotCard1');
  await expect(slot.locator('.timer-display')).toHaveText("00:00'");
  await slot.locator('.hud-tv-min-input').fill('10');
  await slot.locator('.hud-sync-btn').click();
  await expect(slot.locator('.hud-live-minute-label')).toHaveText("AO VIVO: 10'");
  await expect(slot.locator('.hud-minute-hero-badge')).toHaveText("10'");
  await expect(slot.locator('.hud-odd-justa-hero')).not.toHaveText('0.00');
});

test('projeta odd e blocos sem alterar o minuto ao vivo', async ({ page }) => {
  const slot = page.locator('#slotCard1');
  await slot.locator('.hud-tv-min-input').fill('10');
  await slot.locator('.hud-sync-btn').click();
  const liveBefore = await slot.locator('.hud-live-minute-label').textContent();
  const oddBefore = await slot.locator('.hud-odd-justa-hero').textContent();
  await slot.locator('.hud-min-plus').click();
  await expect(slot.locator('.hud-live-minute-label')).toHaveText(liveBefore.trim());
  await expect(slot.locator('.hud-projected-minute-label')).toHaveText("PROJEÇÃO: 11'");
  await expect(slot.locator('.hud-odd-justa-hero')).not.toHaveText(oddBefore.trim());
  await expect(slot.locator('.bloco1-topo-val')).not.toHaveText('0.00');
  await expect(slot.locator('.bloco2-topo-val')).not.toHaveText('0.00');
});

test('sincroniza acréscimos sem zerar as métricas', async ({ page }) => {
  const slot = page.locator('#slotCard1');
  await slot.locator('.hud-added-min-input').fill('5');
  await slot.locator('.hud-added-sync-btn').click();
  await expect(slot.locator('.hud-odd-justa-hero')).not.toHaveText('0.00');
  await expect(slot.locator('.bloco1-topo-val')).not.toHaveText('0.00');
  await expect(slot.locator('.bloco2-topo-val')).not.toHaveText('0.00');
});

test('registra evento e mostra abertura estimada', async ({ page }) => {
  const slot = page.locator('#slotCard1');
  await slot.locator('.event-min-input').fill('13');
  await slot.locator('.event-odd-input').fill('1.50');
  await slot.locator('.event-apply-btn').click();
  const eventCells = slot.locator('.event-log-body tr').first().locator('td');
  await expect(eventCells).toHaveCount(7);
  await expect(eventCells.nth(3)).not.toHaveText('-');
  await expect(eventCells.nth(3)).not.toHaveText('0.00');
  await expect(slot.locator('.hud-initial-odd-input')).not.toHaveValue('3.35');
});

test('limita a projeção em 46 no HT e 93 no FT', async ({ page }) => {
  const slot = page.locator('#slotCard1');
  for (let click = 0; click < 60; click++) await slot.locator('.hud-min-plus').click();
  await expect.poll(() => page.evaluate(() => window.app.slots[0].state.projectedMinute)).toBe(46);
  await expect(slot.locator('.hud-odd-justa-hero')).not.toHaveText('0.00');

  await slot.locator('.period-tab-btn[data-period="FT"]').click();
  for (let click = 0; click < 60; click++) await slot.locator('.hud-min-plus').click();
  await expect.poll(() => page.evaluate(() => window.app.slots[0].state.projectedMinute)).toBe(93);
  await expect(slot.locator('.hud-odd-justa-hero')).not.toHaveText('0.00');
});

const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';

async function login(page, email, password) {
  await page.goto(BASE + '/painel', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.toString().includes('/painel'), { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(2000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push({ type: 'pageerror', message: err.message }));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Function components cannot be given refs')) return;
      errors.push({ type: 'console.error', message: text });
    }
  });

  try {
    console.log('\n=== TEST 1: Admin - Settings Z-API (nova seção) ===');
    await login(page, 'admin@burgerhouse.com', '123456');

    await page.goto(BASE + '/admin/configuracoes');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_zapi_menu.png' });

    // Click "WhatsApp" section
    await page.locator('button:has-text("WhatsApp")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_zapi_form.png' });

    // Fill Z-API fields
    const instanceIdInput = page.locator('input[placeholder*="3A0BC"]').first();
    if (await instanceIdInput.isVisible().catch(() => false)) {
      await instanceIdInput.fill('TEST-INSTANCE-XYZ-789');
      console.log('Instance ID preenchido');
    } else {
      console.log('Campo Instance ID não encontrado');
    }

    const tokenInput = page.locator('input[placeholder*="AB12CD"]').first();
    if (await tokenInput.isVisible().catch(() => false)) {
      await tokenInput.fill('TEST-TOKEN-ABC-123456');
      console.log('API Token preenchido');
    } else {
      console.log('Campo API Token não encontrado');
    }

    // Toggle active
    const toggleBtn = page.locator('button.w-12.h-6.rounded-full').first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(500);
      console.log('Toggle Z-API ativo clicado');
    }

    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_zapi_filled.png' });

    // Click "Salvar Z-API"
    const saveZapiBtn = page.locator('button:has-text("Salvar Z-API")').first();
    if (await saveZapiBtn.isVisible().catch(() => false)) {
      await saveZapiBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_zapi_saved.png' });
      console.log('Z-API salvo');
    } else {
      console.log('Botão Salvar Z-API não encontrado');
    }

    // Reload and check persisted
    await page.reload();
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("WhatsApp")').first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_zapi_persisted.png' });

    // ========== TEST 2: N8n com nome (deve funcionar agora) ==========
    console.log('\n=== TEST 2: N8n webhook com name ===');
    await page.goto(BASE + '/admin/n8n');
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Novo webhook")').first().click();
    await page.waitForTimeout(1000);
    await page.locator('input[placeholder*="Nome do webhook"]').first().fill('CRM Teste 2');
    await page.locator('input[placeholder*="URL do webhook"]').first().fill('https://n8n.exemplo.com/webhook/crm-test2');
    await page.locator('button:has-text("Criar webhook")').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_n8n_created_v2.png' });

    // Reload to confirm
    await page.reload();
    await page.waitForTimeout(2000);
    const webhookCount = await page.locator('text=CRM Teste 2').count();
    console.log(`Webhooks "CRM Teste 2" encontrados: ${webhookCount}`);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_n8n_persisted.png' });

    // ========== TEST 3: Master - Whitelabel ==========
    console.log('\n=== TEST 3: Master Whitelabel ===');
    await page.goto(BASE + '/painel');
    await page.waitForTimeout(2000);
    // Master doesn't logout by email
    // Just go to master login
    await page.goto(BASE + '/master/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'master@peddi.com.br');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.toString().includes('/master') && !url.toString().includes('/login'), { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2000);
    console.log('URL após master login:', page.url());

    await page.goto(BASE + '/master/whitelabel');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel.png', fullPage: true });

    // ========== RESUMO ==========
    console.log('\n=== RESUMO ===');
    if (errors.length > 0) {
      console.log(`\nERROS (${errors.length}):`);
      errors.forEach((e, i) => console.log(`  ${i+1}. [${e.type}] ${e.message.substring(0, 150)}`));
    } else {
      console.log('Nenhum erro!');
    }

  } catch (e) {
    console.error('ERRO:', e.message);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Temp\\opencode\\test_error.png' });
  } finally {
    await browser.close();
  }
})();

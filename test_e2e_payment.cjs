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
      errors.push({ type: 'console.error', message: text.substring(0, 200) });
    }
  });

  try {
    // ========== TEST 1: Master Whitelabel mostra payment pendente ==========
    console.log('\n=== TEST 1: Master vê pizzaria pendente no Whitelabel ===');
    await login(page, 'master@peddi.com.br', '123456');
    await page.goto(BASE + '/master/whitelabel');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_with_pizzaria.png' });

    // Check if "Pizzaria Teste E2E" is in the list
    const pizzariaText = await page.locator('text=Pizzaria').count();
    console.log('Restaurantes com "Pizzaria" no Whitelabel:', pizzariaText);

    // ========== TEST 2: Configurar Pizzaria ==========
    console.log('\n=== TEST 2: Configurar Pizzaria no Whitelabel ===');
    const pizzaria = page.locator('button:has-text("Pizzaria")').first();
    if (await pizzaria.isVisible().catch(() => false)) {
      await pizzaria.click();
      await page.waitForTimeout(2000);

      // Preencher credenciais
      await page.locator('input[placeholder*="admin@restaurante"]').first().fill('admin@pizzaria.com');
      await page.locator('input[placeholder*="mínimo 6"]').first().fill('123456');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_pizzaria_filled.png', fullPage: true });

      // Preencher WhatsApp
      const whatsappInput = page.locator('input[placeholder*="5511999999999"]').first();
      if (await whatsappInput.isVisible().catch(() => false)) {
        await whatsappInput.fill('5511988887777');
        console.log('WhatsApp preenchido');
      }

      // Preencher Z-API
      const zapiInstance = page.locator('input[placeholder*="3A0BC"]').first();
      if (await zapiInstance.isVisible().catch(() => false)) {
        await zapiInstance.fill('PIZZARIA-INSTANCE-XYZ');
      }
      const zapiToken = page.locator('input[placeholder*="AB12CD"]').first();
      if (await zapiToken.isVisible().catch(() => false)) {
        await zapiToken.fill('PIZZARIA-TOKEN-ABC');
      }

      // Preencher N8n
      const n8nName = page.locator('input[placeholder*="CRM principal"]').first();
      if (await n8nName.isVisible().catch(() => false)) {
        await n8nName.fill('CRM Pizzaria');
      }
      const n8nUrl = page.locator('input[placeholder*="n8n.cliente.com"]').first();
      if (await n8nUrl.isVisible().catch(() => false)) {
        await n8nUrl.fill('https://n8n.pizzaria.com/webhook/pedidos');
      }

      await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_pizzaria_allfilled.png', fullPage: true });

      // Clicar "Configurar painel e enviar email"
      const submitBtn = page.locator('button:has-text("Configurar painel")').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(8000);
        await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_pizzaria_done.png' });
        console.log('Configurar painel clicado');
      }
    }

    // ========== TEST 3: Tentar login com admin@pizzaria.com ==========
    console.log('\n=== TEST 3: Login como novo admin da Pizzaria ===');
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE + '/painel');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'admin@pizzaria.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_pizzaria_login.png' });
    console.log('URL após login admin pizzaria:', page.url());

    // ========== RESUMO ==========
    console.log('\n=== RESUMO ===');
    if (errors.length > 0) {
      console.log(`\nERROS (${errors.length}):`);
      errors.forEach((e, i) => console.log(`  ${i+1}. [${e.type}] ${e.message}`));
    } else {
      console.log('Nenhum erro!');
    }

  } catch (e) {
    console.error('ERRO:', e.message);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_error.png' });
  } finally {
    await browser.close();
  }
})();

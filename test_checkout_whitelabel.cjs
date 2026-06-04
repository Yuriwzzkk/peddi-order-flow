const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:5173';

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
      if (text.includes('Failed to load resource') && text.includes('400')) {
        errors.push({ type: '400error', message: text });
        return;
      }
      errors.push({ type: 'console.error', message: text });
    }
  });

  try {
    // ========== TEST 1: Landing page carrega ==========
    console.log('\n=== TEST 1: Landing page ===');
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_landing.png', fullPage: true });
    console.log('Landing page URL:', page.url());

    // ========== TEST 2: Clica "Começar agora" (vai para checkout) ==========
    console.log('\n=== TEST 2: Ir para checkout ===');
    await page.locator('a:has-text("Começar agora")').first().click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_checkout_form.png' });
    console.log('Checkout URL:', page.url());

    // Fill form
    await page.locator('input[placeholder*="Burger House"]').first().fill('Pizzaria Teste E2E');
    await page.locator('input[placeholder*="João Silva"]').first().fill('Carlos Teste');
    await page.locator('input[placeholder*="seu@email"]').first().fill('carlos.teste@example.com');
    await page.locator('input[placeholder*="000.000.000"]').first().fill('12345678900');
    await page.locator('input[placeholder*="(11) 99999"]').first().fill('11999887766');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_checkout_filled.png' });

    // Click pay
    console.log('Clicando em pagar...');
    await page.locator('button:has-text("Pagar R$")').first().click();
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_checkout_pix.png' });
    console.log('URL após pagar:', page.url());

    // ========== TEST 3: Master Whitelabel expandido ==========
    console.log('\n=== TEST 3: Master Whitelabel com N8n + WhatsApp ===');
    await page.goto(BASE + '/master/login');
    await page.waitForTimeout(2000);
    await page.fill('input[type="email"]', 'master@peddi.com.br');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.toString().includes('/master') && !url.toString().includes('/login'), { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(2000);

    await page.goto(BASE + '/master/whitelabel');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_v2.png' });

    // Click on first restaurant
    const firstRestaurant = page.locator('button:has-text("Burger")').first();
    if (await firstRestaurant.isVisible().catch(() => false)) {
      await firstRestaurant.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_whitelabel_expanded.png', fullPage: true });
      console.log('Whitelabel form expandido');
    }

    // ========== TEST 4: Tentar acessar /master como admin (deve redirecionar) ==========
    console.log('\n=== TEST 4: Segurança - /master bloqueado para admin ===');
    await page.goto(BASE + '/master/logout-end');
    await page.waitForTimeout(1000);
    // Fazer sign out via auth.signOut
    await page.evaluate(async () => {
      // @ts-ignore
      await window.indexedDB.deleteDatabase('supabase.auth.token');
    });
    await page.goto(BASE + '/painel');
    await page.waitForTimeout(1000);
    // Login as admin (not master)
    await page.fill('input[type="email"]', 'admin@burgerhouse.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => url.toString().includes('/admin'), { timeout: 10000 }).catch(() => null);
    await page.waitForTimeout(2000);
    console.log('Admin logado, URL:', page.url());

    // Tenta ir para /master
    await page.goto(BASE + '/master');
    await page.waitForTimeout(2000);
    console.log('Tentar /master como admin - URL final:', page.url());
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_master_blocked.png' });

    // ========== RESUMO ==========
    console.log('\n=== RESUMO ===');
    if (errors.length > 0) {
      console.log(`\nERROS (${errors.length}):`);
      errors.forEach((e, i) => console.log(`  ${i+1}. [${e.type}] ${e.message.substring(0, 200)}`));
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

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

async function fillByLabel(page, label, value) {
  // Find the input that follows the label with this text
  const labelEl = page.locator(`label:has-text("${label}")`).first();
  if (await labelEl.isVisible().catch(() => false)) {
    // Get the input that comes after this label (sibling or in the same div)
    const inputId = await labelEl.getAttribute('for');
    if (inputId) {
      await page.fill(`#${inputId}`, value);
      return true;
    }
    // Try by getting the parent and then input
    const parent = labelEl.locator('xpath=..');
    const input = parent.locator('input').first();
    if (await input.isVisible().catch(() => false)) {
      await input.fill(value);
      return true;
    }
  }
  return false;
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
      if (text.includes('Failed to load resource') && text.includes('400')) {
        // we'll report this
        errors.push({ type: '400error', message: text });
        return;
      }
      errors.push({ type: 'console.error', message: text });
    }
  });

  try {
    // ========== TEST 1: Login admin ==========
    console.log('\n=== TEST 1: Login admin ===');
    await login(page, 'admin@burgerhouse.com', '123456');
    console.log('URL após login:', page.url());

    // ========== TEST 2: Criar atendente corretamente ==========
    console.log('\n=== TEST 2: Criar atendente ===');
    await page.goto(BASE + '/admin/equipe');
    await page.waitForTimeout(2000);

    // Click "Novo atendente" no header
    await page.locator('button:has-text("Novo atendente")').first().click();
    await page.waitForTimeout(1000);

    // Fill by label
    await fillByLabel(page, 'Nome completo', 'Maria Teste Criar');
    await fillByLabel(page, 'Email de acesso', 'maria.teste@burgerhouse.com');
    await fillByLabel(page, 'Senha', '123456');

    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_team_filled.png' });

    // Click "Criar atendente e gerar acesso"
    await page.locator('button:has-text("Criar atendente e gerar acesso")').click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_team_created2.png' });
    console.log('Atendente criado, URL:', page.url());

    // Close sheet
    const closeBtn = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // ========== TEST 3: Salvar configurações (nome do restaurante) ==========
    console.log('\n=== TEST 3: Configurações (nome) ===');
    await page.goto(BASE + '/admin/configuracoes');
    await page.waitForTimeout(2000);

    // Click "Dados do restaurante" section
    await page.locator('button:has-text("Dados do restaurante")').first().click();
    await page.waitForTimeout(1000);

    // Update name
    const nameInput = page.locator('input[placeholder="Nome do restaurante"]').first();
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill('Burger House Teste Atualizado');
      // Click "Salvar"
      await page.locator('button:has-text("Salvar")').first().click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_settings_saved.png' });
      console.log('Nome do restaurante salvo');
    }

    // ========== TEST 4: N8n com nome preenchido ==========
    console.log('\n=== TEST 4: N8n webhook com nome ===');
    await page.goto(BASE + '/admin/n8n');
    await page.waitForTimeout(2000);

    // Click "Novo webhook"
    await page.locator('button:has-text("Novo webhook")').first().click();
    await page.waitForTimeout(1000);

    // Fill name
    await page.locator('input[placeholder*="Nome do webhook"]').first().fill('CRM Teste Webhook');
    // Fill URL
    await page.locator('input[placeholder*="URL do webhook"]').first().fill('https://n8n.exemplo.com/webhook/peddi-test');
    // Submit
    await page.locator('button:has-text("Criar webhook")').click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_n8n_created2.png' });
    console.log('N8n webhook criado, URL:', page.url());

    // ========== TEST 5: Verificar webhook criado ==========
    console.log('\n=== TEST 5: Verificar webhook ===');
    await page.reload();
    await page.waitForTimeout(2000);
    const webhookText = await page.locator('text=CRM Teste Webhook').count();
    console.log(`Webhooks "CRM Teste Webhook" encontrados: ${webhookText}`);

    // ========== TEST 6: Automation - toggle flow ==========
    console.log('\n=== TEST 6: Automation ===');
    await page.goto(BASE + '/admin/automacao');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_automation2.png', fullPage: true });

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
    await page.screenshot({ path: 'C:\\Users\\SHADOW~1\\AppData\\Local\\Temp\\opencode\\test_error.png' });
  } finally {
    await browser.close();
  }
})();

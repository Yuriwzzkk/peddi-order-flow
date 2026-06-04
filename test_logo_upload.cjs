// Test E2E: Upload de logo no WhiteLabel (v2)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  try {
    console.log('1. Login master...');
    await page.goto('http://localhost:5173/painel');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.fill('input[type="email"]', 'master@peddi.com.br');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').first().click({ force: true });
    await page.waitForTimeout(5000);
    console.log('   ✅ Login submitted');

    console.log('2. Navegar para Whitelabel...');
    await page.goto('http://localhost:5173/master/whitelabel');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'C:/Users/SHADOW~1/AppData/Local/Temp/opencode/test_logo_1_initial.png' });
    console.log('   📸 Screenshot 1 salvo');

    // Clicar no primeiro restaurante pendente (que tem "Novo")
    console.log('3. Selecionar primeiro restaurante pendente...');
    const firstRestaurant = page.locator('button:has-text("Novo")').first();
    const count = await page.locator('button:has-text("Novo")').count();
    console.log(`   Encontrados ${count} restaurantes pendentes`);

    if (count === 0) {
      console.log('   ⚠️  Nenhum restaurante pendente. Crie um via /checkout?plan=starter');
      await browser.close();
      return;
    }

    await firstRestaurant.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'C:/Users/SHADOW~1/AppData/Local/Temp/opencode/test_logo_2_form.png' });
    console.log('   📸 Screenshot 2: form aberto');

    // Verificar que o uploader está visível
    const uploaderText = await page.locator('text=Arraste ou clique para enviar').isVisible().catch(() => false);
    const uploaderText2 = await page.locator('text=PNG, JPG, WEBP ou SVG').isVisible().catch(() => false);
    console.log(`4. Uploader visível: ${uploaderText || uploaderText2 ? '✅' : '❌'}`);

    if (uploaderText || uploaderText2) {
      // Criar arquivo PNG fake (1x1 pixel vermelho)
      const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
      const tmpFile = path.join(os.tmpdir(), 'test-logo.png');
      fs.writeFileSync(tmpFile, pngBuffer);
      console.log('5. Upload de PNG de teste...');

      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(tmpFile);
      await page.waitForTimeout(4000);

      await page.screenshot({ path: 'C:/Users/SHADOW~1/AppData/Local/Temp/opencode/test_logo_3_uploaded.png' });
      console.log('   📸 Screenshot 3: após upload');

      // Verificar toast
      const successToast = await page.locator('text=Logo enviada com sucesso').isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   Toast de sucesso: ${successToast ? '✅' : '❌'}`);

      // Verificar que preview apareceu
      const previewImg = await page.locator('img[alt="Logo"]').isVisible().catch(() => false);
      console.log(`   Preview da logo visível: ${previewImg ? '✅' : '❌'}`);

      // Verificar que a URL foi setada (campo hidden ou estado)
      // O input "URL externa" deve estar readonly com a URL do storage
      const allText = await page.locator('body').innerText();
      const hasStorageUrl = allText.includes('supabase.co/storage');
      console.log(`   URL do Supabase Storage presente: ${hasStorageUrl ? '✅' : '❌'}`);

      fs.unlinkSync(tmpFile);
    }

    console.log('\n✅ Teste de upload concluído!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
    await page.screenshot({ path: 'C:/Users/SHADOW~1/AppData/Local/Temp/opencode/test_logo_error.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();

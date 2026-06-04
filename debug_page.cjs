const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('requestfailed', req => console.log('REQFAILED:', req.url(), req.failure().errorText));
  
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const html = await page.content();
  console.log('--- HTML SNIPPET ---');
  console.log(html.substring(0, 3000));
  console.log('--- URL:', page.url());
  
  await browser.close();
})();

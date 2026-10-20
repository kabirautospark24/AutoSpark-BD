import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4173';
const OUT = process.argv[3] || 'C:/Users/USER/AppData/Local/Temp/opencode/shots';

const PAGES = [
  ['home', '/'],
  ['inventory', '/inventory'],
  ['services', '/services'],
  ['accessories', '/accessories'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['404', '/this-page-does-not-exist'],
  ['checkout', '/checkout'],
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const [name, route] of PAGES) {
  const page = await context.newPage();
  await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log('shot', name);
  await page.close();
}

await browser.close();

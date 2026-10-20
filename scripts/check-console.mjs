import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:4173';

const ROUTES = [
  '/',
  '/inventory',
  '/vehicle/harrier-001',
  '/experience',
  '/services',
  '/accessories',
  '/about',
  '/testimonials',
  '/sell',
  '/contact',
  '/cart',
  '/checkout',
  '/payment-success',
  '/payment-fail',
  '/payment-cancel',
  '/thank-you',
  '/sparkpilot',
  '/privacy',
  '/terms',
  '/color-preview',
  '/inventory-management',
  '/this-page-does-not-exist',
];

const IGNORE = [
  /favicon/i,
  /UnicornStudio/i,
  /do-ai\.run/i,
  /agents\.do-ai/i,
  /ERR_NAME_NOT_RESOLVED/i,
  /Failed to load resource.*(pexels|jsdelivr)/i,
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

let totalErrors = 0;
const report = [];

for (const route of ROUTES) {
  const page = await context.newPage();
  const messages = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return;
    const text = msg.text();
    if (IGNORE.some((re) => re.test(text))) return;
    messages.push(`[${msg.type()}] ${text}`);
  });
  page.on('pageerror', (err) => {
    messages.push(`[pageerror] ${err.message}`);
  });
  page.on('response', (res) => {
    const status = res.status();
    if (status >= 400) messages.push(`[http ${status}] ${res.url()}`);
  });

  try {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 45000 });
  } catch (error) {
    messages.push(`[navigation] ${error.message}`);
  }
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => ({
    title: document.title,
    h1: Array.from(document.querySelectorAll('h1')).map((h) => h.textContent.trim()),
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || null,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') || null,
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null,
    robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || null,
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    imgsMissingAlt: Array.from(document.images).filter((i) => !i.hasAttribute('alt')).length,
    imgsTotal: document.images.length,
    lang: document.documentElement.lang,
  }));

  const errs = messages.filter((m) => !m.startsWith('[warning]'));
  const warns = messages.filter((m) => m.startsWith('[warning]'));
  totalErrors += errs.length;

  report.push({ route, info, errors: errs, warnings: warns.slice(0, 4) });

  await page.close();
}

await browser.close();

for (const r of report) {
  const flag = r.errors.length ? 'ERR' : ' ok';
  console.log(`\n${flag} ${r.route}`);
  console.log(`     title: ${r.info.title}`);
  console.log(`     h1(${r.info.h1.length}): ${r.info.h1.join(' | ').slice(0, 80)}`);
  console.log(`     canonical: ${r.info.canonical}`);
  console.log(`     robots: ${r.info.robots} | og:image: ${r.info.ogImage}`);
  console.log(`     jsonLd blocks: ${r.info.jsonLd} | imgs: ${r.info.imgsTotal} missing alt: ${r.info.imgsMissingAlt}`);
  r.errors.slice(0, 8).forEach((e) => console.log(`     ${e}`));
  if (r.warnings.length) r.warnings.forEach((w) => console.log(`     ${w}`));
}

console.log(`\nTOTAL ERRORS: ${totalErrors}`);

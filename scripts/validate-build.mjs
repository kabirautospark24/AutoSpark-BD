/**
 * Validates the built output: per-route metadata, sitemap, robots, favicons,
 * share images, source maps and the prerendered HTML.
 *
 * Run after a build: node scripts/validate-build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const problems = [];
const notes = [];

function check(condition, message) {
  if (!condition) problems.push(message);
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

const PAGES = [
  ['index.html', '/', 'Auto Spark BD | Exclusive Cars in Rajshahi'],
  ['about.html', '/about', 'About Auto Spark BD'],
  ['services.html', '/services', 'Car Servicing and Maintenance | Auto Spark BD'],
  ['accessories.html', '/accessories', 'Genuine Car Accessories | Auto Spark BD'],
  ['inventory.html', '/inventory', 'Car Inventory | Auto Spark BD'],
  ['contact.html', '/contact', 'Contact and Showroom Locations | Auto Spark BD'],
  ['about/index.html', '/about', null],
  ['services/index.html', '/services', null],
];

const seenTitles = new Map();
const seenDescriptions = new Map();

for (const [file, route, expectedTitle] of PAGES) {
  const html = read(path.join(DIST, file));
  if (html === null) {
    problems.push(`missing ${file}`);
    continue;
  }

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canonical = (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  const ogImage = (html.match(/<meta property="og:image" content="([^"]*)"/) || [])[1];
  const robots = (html.match(/<meta name="robots" content="([^"]*)"/) || [])[1];
  const h1Count = (html.match(/<h1[\s>]/g) || []).length;
  const jsonLd = (html.match(/<script type="application\/ld\+json">/g) || []).length;
  const hasRoot = html.includes('<div id="root">');
  const bodyLength = html.length;

  check(!!title, `${file}: missing title`);
  check(!!description, `${file}: missing meta description`);
  check(!!canonical, `${file}: missing canonical`);
  check(!!ogImage, `${file}: missing og:image`);
  check(h1Count === 1, `${file}: expected exactly one h1, found ${h1Count}`);
  check(jsonLd >= 1, `${file}: missing JSON-LD`);
  check(hasRoot, `${file}: missing #root container`);
  check(bodyLength > 5000, `${file}: suspiciously small (${bodyLength} bytes)`);
  check(!html.includes('undefined'), `${file}: contains the string "undefined"`);
  check(!html.includes('Lorem ipsum'), `${file}: contains Lorem ipsum`);

  if (expectedTitle) check(title === expectedTitle, `${file}: title is "${title}", expected "${expectedTitle}"`);
  if (canonical) check(canonical.endsWith(route), `${file}: canonical "${canonical}" does not end with ${route}`);

  if (title) {
    // The same route is written twice (flat .html and directory index.html),
    // so only compare across different routes.
    if (!file.includes('/') && seenTitles.has(title)) {
      problems.push(`${file}: duplicate title with ${seenTitles.get(title)}`);
    }
    seenTitles.set(title, file);
  }
  if (description) {
    if (!file.includes('/') && seenDescriptions.has(description)) {
      problems.push(`${file}: duplicate description with ${seenDescriptions.get(description)}`);
    }
    seenDescriptions.set(description, file);
  }

  notes.push(
    `${file.padEnd(22)} title="${(title || '').slice(0, 46)}" canonical=${canonical} robots=${robots} h1=${h1Count} jsonLd=${jsonLd} bytes=${bodyLength}`
  );
}

// 404 page
const notFound = read(path.join(DIST, '404.html'));
check(!!notFound, 'missing 404.html');
if (notFound) {
  check(/noindex/.test(notFound), '404.html is not marked noindex');
  check((notFound.match(/<h1[\s>]/g) || []).length === 1, '404.html must have exactly one h1');
  check(!notFound.includes('Lorem ipsum'), '404.html contains Lorem ipsum');
}

// sitemap
const sitemap = read(path.join(DIST, 'sitemap.xml'));
check(!!sitemap, 'missing sitemap.xml');
if (sitemap) {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check(urls.length >= 10, `sitemap only lists ${urls.length} urls`);
  check(urls.every((u) => u.startsWith('https://www.autosparkbd.com')), 'sitemap contains a non canonical host');
  check(!urls.some((u) => u.includes('/checkout') || u.includes('/cart') || u.includes('/inventory-management')), 'sitemap contains a noindex route');
  notes.push(`sitemap lists ${urls.length} urls`);
}

// robots
const robots = read(path.join(DIST, 'robots.txt'));
check(!!robots, 'missing robots.txt');
if (robots) {
  check(robots.includes('Sitemap: https://www.autosparkbd.com/sitemap.xml'), 'robots.txt is missing the sitemap reference');
  check(/Disallow: \/api\//.test(robots), 'robots.txt does not disallow /api/');
}

// favicons and manifest
for (const file of [
  'favicon.svg',
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'site.webmanifest',
]) {
  check(fs.existsSync(path.join(DIST, file)), `missing ${file}`);
}

// share images
const ogDir = path.join(DIST, 'og');
if (fs.existsSync(ogDir)) {
  const images = fs.readdirSync(ogDir).filter((f) => f.endsWith('.png'));
  check(images.length >= 10, `only ${images.length} share images were generated`);
  for (const image of images) {
    const size = fs.statSync(path.join(ogDir, image)).size;
    check(size > 5000, `share image ${image} is only ${size} bytes`);
  }
  notes.push(`share images: ${images.length}`);
} else {
  problems.push('no share images were generated');
}

// no source maps, no bundle report in the deployed output
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(DIST);
const maps = allFiles.filter((f) => f.endsWith('.map'));
check(maps.length === 0, `${maps.length} source map files are in dist`);

if (fs.existsSync(path.join(DIST, 'stats.html'))) {
  problems.push('dist/stats.html (bundle report) would be deployed');
}

const indexHtml = read(path.join(DIST, 'index.html')) || '';
check(!/src="\/src\/main\.tsx"/.test(indexHtml), 'dist/index.html still points at the dev entry');
check(!indexHtml.includes('ipapi.co'), 'dist/index.html still calls ipapi.co');
check(!indexHtml.includes('agents.do-ai.run'), 'dist/index.html still loads the dead chat widget');
check(!indexHtml.includes('cdn.jsdelivr.net/gh/hiunicornstudio'), 'dist/index.html still loads the unused Unicorn Studio script');

console.log(notes.join('\n'));
console.log('');
if (problems.length) {
  console.log(`FAILED with ${problems.length} problem(s):`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
console.log('All build checks passed.');

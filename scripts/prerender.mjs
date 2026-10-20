/**
 * Build-time prerenderer.
 *
 * 1. Builds a server bundle of the React app.
 * 2. Renders every static route to HTML.
 * 3. Writes one HTML file per route (its own URL) plus a 404 page.
 * 4. Writes sitemap.xml and robots.txt from the route manifest.
 *
 * The client bundle still renders the app (createRoot), so the prerendered
 * markup is what crawlers and no-JS visitors get, while the app stays
 * fully interactive for real users.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SSR_OUT = path.join(ROOT, '.prerender', 'ssr');

/* ------------------------------------------------------------------ *
 * Browser shims so React components can render in Node.
 * ------------------------------------------------------------------ */
function installBrowserShims() {
  const noop = () => {};
  const storage = () => {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
      clear: () => map.clear(),
      key: () => null,
      get length() {
        return map.size;
      },
    };
  };

  const localStorage = storage();
  const sessionStorage = storage();

  const matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: noop,
    removeListener: noop,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
  });

  const elementStub = () => ({
    style: {},
    dataset: {},
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    setAttribute: noop,
    getAttribute: () => null,
    removeAttribute: noop,
    appendChild: noop,
    removeChild: noop,
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    getContext: () => null,
    getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    focus: noop,
    blur: noop,
  });

  const documentStub = {
    documentElement: { ...elementStub(), lang: 'en' },
    body: elementStub(),
    head: elementStub(),
    createElement: () => elementStub(),
    createElementNS: () => elementStub(),
    createTextNode: (t) => ({ textContent: t }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByTagName: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
    title: '',
  };

  const windowStub = {
    document: documentStub,
    navigator: { userAgent: 'node', language: 'en-US', languages: ['en-US'], platform: 'node' },
    location: { href: 'http://localhost/', pathname: '/', search: '', hash: '', origin: 'http://localhost' },
    history: { pushState: noop, replaceState: noop, scrollRestoration: 'auto' },
    localStorage,
    sessionStorage,
    matchMedia,
    addEventListener: noop,
    removeEventListener: noop,
    dispatchEvent: () => false,
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    scrollTo: noop,
    scrollY: 0,
    scrollX: 0,
    innerWidth: 1280,
    innerHeight: 800,
    outerWidth: 1280,
    outerHeight: 800,
    devicePixelRatio: 1,
    screen: { width: 1280, height: 800 },
    performance: { now: () => Date.now(), mark: noop, measure: noop },
    IntersectionObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    MutationObserver: class {
      observe() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  };

  const define = (key, value) => {
    try {
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true });
    } catch {
      globalThis[key] = value;
    }
  };

  define('window', windowStub);
  define('document', documentStub);
  define('navigator', windowStub.navigator);
  define('localStorage', localStorage);
  define('sessionStorage', sessionStorage);
  define('matchMedia', matchMedia);
  define('requestAnimationFrame', windowStub.requestAnimationFrame);
  define('cancelAnimationFrame', windowStub.cancelAnimationFrame);
  define('getComputedStyle', windowStub.getComputedStyle);
  define('IntersectionObserver', windowStub.IntersectionObserver);
  define('ResizeObserver', windowStub.ResizeObserver);
  define('MutationObserver', windowStub.MutationObserver);
  define('HTMLElement', class HTMLElement {});
  define('Element', class Element {});
  define('Node', class Node {});
  define('self', globalThis);
}

/* ------------------------------------------------------------------ *
 * Build the server bundle
 * ------------------------------------------------------------------ */
async function buildServerBundle() {
  await fs.rm(SSR_OUT, { recursive: true, force: true });
  await build({
    configFile: false,
    root: ROOT,
    logLevel: 'warn',
    plugins: [react()],
    define: { 'process.env.NODE_ENV': '"production"' },
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: SSR_OUT,
      emptyOutDir: true,
      minify: false,
      sourcemap: false,
      target: 'node18',
      rollupOptions: {
        output: { entryFileNames: 'entry-server.mjs', format: 'esm' },
      },
    },
  });
  return pathToFileURL(path.join(SSR_OUT, 'entry-server.mjs')).href;
}

/* ------------------------------------------------------------------ *
 * HTML assembly
 * ------------------------------------------------------------------ */
function applyHead(shell, headHtml) {
  return shell.replace(/<!--seo-default-start-->[\s\S]*?<!--seo-route-->/, () => headHtml);
}

function applyBody(shell, bodyHtml) {
  // The head already carries the JSON-LD graph, so drop the copy that the
  // client side head manager renders inline in the body.
  const withoutSchema = bodyHtml.replace(
    /<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    ''
  );
  return shell.replace('<div id="root"></div>', () => `<div id="root">${withoutSchema}</div>`);
}

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSitemap(routes, siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .filter((r) => !r.noindex && !r.path.includes(':'))
    .map(
      (r) => `  <url>
    <loc>${escapeXml(siteUrl + (r.path === '/' ? '/' : r.path))}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq || 'monthly'}</changefreq>
    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

function buildRobots(siteUrl) {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /inventory-management
Disallow: /cart
Disallow: /checkout
Disallow: /payment-success
Disallow: /payment-fail
Disallow: /payment-cancel
Disallow: /thank-you
Disallow: /color-preview

Sitemap: ${siteUrl}/sitemap.xml
`;
}

/* ------------------------------------------------------------------ *
 * Share images (Open Graph / Twitter cards)
 * ------------------------------------------------------------------ */
const OG_BACKGROUND = 'public/cars/land-prado/prado01.webp';

const escapeXmlText = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Very small greedy word wrapper for the OG headline. */
function wrapText(text, maxCharsPerLine, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    const consumed = lines.join(' ').length;
    if (consumed < text.length - 1) {
      lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`;
    }
  }
  return lines;
}

function ogSvg({ eyebrow, title, description }) {
  const titleLines = wrapText(title, 16, 3);
  const titleSize = titleLines.length >= 3 ? 58 : titleLines.length === 2 ? 68 : 78;
  const titleTop = 296;

  const titleMarkup = titleLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleTop + i * (titleSize + 12)}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="900" fill="#FFFFFF">${escapeXmlText(line)}</text>`
    )
    .join('');

  const descLines = wrapText(description, 52, 3);
  const descMarkup = descLines
    .map(
      (line, i) =>
        `<text x="80" y="${titleTop + titleLines.length * (titleSize + 12) + 16 + i * 36}" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#D4D4D4">${escapeXmlText(line)}</text>`
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#050505" stop-opacity="0.94"/>
      <stop offset="52%" stop-color="#050505" stop-opacity="0.84"/>
      <stop offset="100%" stop-color="#050505" stop-opacity="0.5"/>
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DA1609"/>
      <stop offset="100%" stop-color="#FF1A1A"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#050505" opacity="0.66"/>
  <rect width="1200" height="630" fill="url(#panel)"/>
  <rect x="80" y="150" width="86" height="8" fill="url(#bar)"/>
  <text x="80" y="128" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="bold" letter-spacing="6" fill="#DA1609">${escapeXmlText(eyebrow.toUpperCase())}</text>
  ${titleMarkup}
  ${descMarkup}
  <g transform="translate(80 566)">
    <rect x="0" y="-32" width="44" height="44" rx="10" fill="#DA1609"/>
    <text x="9" y="1" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#FFFFFF">A</text>
    <text x="60" y="0" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold" fill="#FFFFFF">Auto Spark BD</text>
    <rect x="268" y="-20" width="2" height="28" fill="#6B6B6B"/>
    <text x="288" y="0" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="#B4B4B4">Exclusive Cars in Rajshahi</text>
  </g>
</svg>`;
}

async function generateShareImages(routes) {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[prerender] sharp is not installed, skipping share images');
    return 0;
  }

  const ogDir = path.join(DIST, 'og');
  await fs.mkdir(ogDir, { recursive: true });

  const background = path.join(ROOT, OG_BACKGROUND);
  let base;
  try {
    base = await sharp(background).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer();
  } catch (error) {
    console.warn(`[prerender] share image background missing (${OG_BACKGROUND}), using flat images`);
    base = null;
  }

  const wanted = new Map();
  for (const route of routes) {
    const slug = route.image ? route.image.replace(/^\/og\//, '').replace(/\.png$/, '') : null;
    if (!slug) continue;
    wanted.set(slug, route);
  }
  wanted.set('default', routes[0]);

  let count = 0;
  for (const [slug, route] of wanted) {
    const svg = ogSvg({
      eyebrow: 'Auto Spark BD',
      title: route.h1 || route.title,
      description: route.description,
    });

    const overlay = Buffer.from(svg);
    const composed = base
      ? await sharp(base)
          .composite([{ input: overlay, top: 0, left: 0 }])
          .png({ compressionLevel: 9 })
          .toBuffer()
      : await sharp(overlay).png({ compressionLevel: 9 }).toBuffer();

    await fs.writeFile(path.join(ogDir, `${slug}.png`), composed);
    count += 1;
  }

  return count;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */
async function main() {
  installBrowserShims();

  const entry = await buildServerBundle();
  const server = await import(entry);

  const { renderPage, buildHeadTags, headTagsToHtml, ROUTES, NOT_FOUND_SEO, SITE_URL } = server;

  // The shell is the plain app HTML with the SEO markers still in place.
  // A previous prerender run overwrites dist/index.html, so keep a pristine
  // copy: without it a second run would copy the home page head onto every
  // route.
  const shellPath = path.join(DIST, 'index.html');
  const pristinePath = path.join(ROOT, '.prerender', 'shell.html');
  const markers = ['<!--seo-default-start-->', '<!--seo-route-->'];

  let shell = await fs.readFile(shellPath, 'utf8');
  if (!markers.every((m) => shell.includes(m))) {
    const pristine = await fs.readFile(pristinePath, 'utf8').catch(() => null);
    if (!pristine || !markers.every((m) => pristine.includes(m))) {
      throw new Error(
        'No pristine app shell found. Run "npm run build" (vite build) before the prerender step.'
      );
    }
    shell = pristine;
    console.log('[prerender] using the saved pristine shell');
  } else {
    await fs.mkdir(path.dirname(pristinePath), { recursive: true });
    await fs.writeFile(pristinePath, shell);
  }

  const written = [];
  let failures = 0;

  for (const route of ROUTES) {
    // Dynamic routes (:id) cannot be prerendered, they are served by the SPA shell.
    if (route.path.includes(':')) continue;

    const url = route.path;
    const headHtml = headTagsToHtml(buildHeadTags(route));

    let bodyHtml = '';
    try {
      bodyHtml = await renderPage(url);
    } catch (error) {
      failures += 1;
      console.warn(`[prerender] ${url} body render failed: ${error?.message ?? error}`);
    }

    const page = applyBody(applyHead(shell, headHtml), bodyHtml);

    if (url === '/') {
      await fs.writeFile(path.join(DIST, 'index.html'), page);
    } else {
      const flat = path.join(DIST, `${url.slice(1)}.html`);
      await fs.writeFile(flat, page);
      const dir = path.join(DIST, url.slice(1), 'index.html');
      await fs.mkdir(path.dirname(dir), { recursive: true });
      await fs.writeFile(dir, page);
    }
    written.push(url);
  }

  // 404 page: rendered through the router's catch-all route.
  {
    const headHtml = headTagsToHtml(buildHeadTags(NOT_FOUND_SEO));
    let bodyHtml = '';
    try {
      bodyHtml = await renderPage('/404');
    } catch (error) {
      console.warn(`[prerender] 404 body render failed: ${error?.message ?? error}`);
    }
    await fs.writeFile(path.join(DIST, '404.html'), applyBody(applyHead(shell, headHtml), bodyHtml));
    written.push('/404');
  }

  // Neutral shell used for dynamic routes (/vehicle/:id, /product/:id).
  {
    const neutral = {
      path: '/',
      title: 'Auto Spark BD | Exclusive Cars in Rajshahi',
      description:
        'Auto Spark BD is Rajshahi premier premium car showroom. Browse quality Japanese import vehicles, certified service and genuine accessories with delivery across Bangladesh.',
      h1: 'Premium Cars in Rajshahi',
      image: '/og/og-default.png',
      noindex: false,
    };
    const headHtml = headTagsToHtml(buildHeadTags(neutral))
      // A dynamic URL must not inherit the canonical of the home page.
      .replace(/<link rel="canonical"[^>]*>/, '');
    const shellPage = applyHead(shell, headHtml);
    const dir = path.join(DIST, 'spa-shell', 'index.html');
    await fs.mkdir(path.dirname(dir), { recursive: true });
    await fs.writeFile(dir, shellPage);
    // Flat copy so the rewrite resolves with cleanUrls enabled.
    await fs.writeFile(path.join(DIST, 'spa-shell.html'), shellPage);
  }

  await fs.writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(ROUTES, SITE_URL));
  await fs.writeFile(path.join(DIST, 'robots.txt'), buildRobots(SITE_URL));

  const imageCount = await generateShareImages(ROUTES);

  // Keep .prerender/shell.html (the pristine app shell) for re-runs, drop the
  // server bundle.
  await fs.rm(path.join(ROOT, '.prerender', 'ssr'), { recursive: true, force: true });

  console.log(`[prerender] wrote ${written.length} routes, ${failures} body render failure(s)`);
  console.log(`[prerender] routes: ${written.join(', ')}`);
  console.log(`[prerender] generated ${imageCount} share images`);
}

main().catch((error) => {
  console.error('[prerender] failed:', error);
  process.exit(1);
});

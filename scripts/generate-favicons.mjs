/**
 * Generates the brand favicon set from a single SVG source.
 *
 * Outputs (into public/, which Vite copies into dist/):
 *   favicon.svg            scalable source
 *   favicon.ico            16/32/48 px, for legacy browsers
 *   favicon-16x16.png      browser tab
 *   favicon-32x32.png      browser tab (retina)
 *   favicon-48x48.png      browser tab (high dpi)
 *   apple-touch-icon.png   180x180, iOS home screen
 *   android-chrome-192x192.png / android-chrome-512x512.png
 *   mstile-150x150.png     Windows tile
 *   site.webmanifest       PWA manifest
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');

const BRAND_RED = '#DA1609';
const BRAND_DARK = '#0B0B0B';

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Auto Spark BD">
  <rect width="512" height="512" rx="96" fill="${BRAND_DARK}"/>
  <path d="M112 360 L206 152 L256 152 L350 360 L296 360 L281 324 H181 L166 360 Z M199 270 H263 L231 194 Z" fill="${BRAND_RED}"/>
  <text x="286" y="292" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="152" font-weight="900" fill="#FFFFFF">S</text>
</svg>`;

const APPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${BRAND_DARK}"/>
  <path d="M112 372 L206 152 L256 152 L350 372 L296 372 L281 336 H181 L166 372 Z M199 280 H263 L231 200 Z" fill="${BRAND_RED}"/>
  <text x="286" y="300" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="152" font-weight="900" fill="#FFFFFF">S</text>
</svg>`;

const png = (svg, size) =>
  sharp(Buffer.from(svg)).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();

/** Packs PNG buffers into a classic .ico container (Vista+ PNG entries). */
function buildIco(entries) {
  const count = entries.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;

  entries.forEach((entry, i) => {
    const base = i * 16;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, base + 1);
    dir.writeUInt8(0, base + 2);
    dir.writeUInt8(0, base + 3);
    dir.writeUInt16LE(1, base + 4);
    dir.writeUInt16LE(32, base + 6);
    dir.writeUInt32LE(entry.data.length, base + 8);
    dir.writeUInt32LE(offset, base + 12);
    offset += entry.data.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.data)]);
}

async function main() {
  await fs.mkdir(PUBLIC, { recursive: true });

  await fs.writeFile(path.join(PUBLIC, 'favicon.svg'), FAVICON_SVG);

  const sizes = [16, 32, 48, 96, 128, 256];
  for (const size of sizes) {
    await fs.writeFile(path.join(PUBLIC, `favicon-${size}x${size}.png`), await png(FAVICON_SVG, size));
  }

  const icoEntries = [];
  for (const size of [16, 32, 48]) {
    icoEntries.push({ size, data: await png(FAVICON_SVG, size) });
  }
  await fs.writeFile(path.join(PUBLIC, 'favicon.ico'), buildIco(icoEntries));

  await fs.writeFile(path.join(PUBLIC, 'apple-touch-icon.png'), await png(APPLE_SVG, 180));
  await fs.writeFile(path.join(PUBLIC, 'apple-touch-icon-precomposed.png'), await png(APPLE_SVG, 180));
  await fs.writeFile(path.join(PUBLIC, 'mstile-150x150.png'), await png(APPLE_SVG, 150));
  await fs.writeFile(path.join(PUBLIC, 'android-chrome-192x192.png'), await png(APPLE_SVG, 192));
  await fs.writeFile(path.join(PUBLIC, 'android-chrome-512x512.png'), await png(APPLE_SVG, 512));

  const manifest = {
    name: 'Auto Spark BD',
    short_name: 'Auto Spark',
    description: 'Exclusive cars in Rajshahi. Premium showroom, certified service and genuine accessories.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BRAND_DARK,
    theme_color: BRAND_DARK,
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
  await fs.writeFile(path.join(PUBLIC, 'site.webmanifest'), JSON.stringify(manifest, null, 2));

  console.log('[favicons] generated favicon set in public/');
}

main().catch((error) => {
  console.error('[favicons] failed:', error);
  process.exit(1);
});

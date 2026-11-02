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

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 309 299" width="309" height="299" role="img" aria-label="Auto Spark BD">
${`<path d="M0 0 C1.08152344 0.51820312 2.16304687 1.03640625 3.27734375 1.5703125 C13.79457973 6.96906197 22.39827451 15.00240908 31 23 C31.70898438 23.65484375 32.41796875 24.3096875 33.1484375 24.984375 C33.78007812 25.58765625 34.41171875 26.1909375 35.0625 26.8125 C35.61035156 27.33457031 36.15820312 27.85664062 36.72265625 28.39453125 C38.1865587 30.23448204 38.59659117 31.70405592 39 34 C39.66 34 40.32 34 41 34 C42.14160156 35.43017578 42.14160156 35.43017578 43.390625 37.4453125 C43.85001465 38.18507324 44.3094043 38.92483398 44.78271484 39.68701172 C61.64918903 67.71173904 69.48102631 100.48771298 61.54345703 132.93164062 C52.90753501 165.79935461 33.49873379 191.44126606 4.75 209.375 C-0.34579153 212.29524835 -5.56219544 214.78381142 -11 217 C-12.5778125 217.65162109 -12.5778125 217.65162109 -14.1875 218.31640625 C-42.69981398 228.97670221 -75.82891042 227.06796339 -103.48632812 214.90673828 C-112.04162221 210.8632176 -119.80542505 206.16868185 -127 200 C-128.35351562 198.93458984 -128.35351562 198.93458984 -129.734375 197.84765625 C-135.47265437 193.31131377 -140.50080467 188.76459401 -145 183 C-145.61875 182.22293701 -145.61875 182.22293701 -146.25 181.43017578 C-153.32526239 172.48308439 -158.715163 163.56627344 -163 153 C-163.47179687 151.84757813 -163.94359375 150.69515625 -164.4296875 149.5078125 C-167.7609683 140.81494367 -169.58101187 132.15892337 -171 123 C-171.13277344 122.19175781 -171.26554687 121.38351563 -171.40234375 120.55078125 C-173.94737722 102.24745835 -171.18095725 83.29778684 -165 66 C-164.64164063 64.93523437 -164.28328125 63.87046875 -163.9140625 62.7734375 C-157.93200062 45.95139772 -147.07809947 32.77140428 -135 20 C-134.27039063 19.22140625 -133.54078125 18.4428125 -132.7890625 17.640625 C-131 16 -131 16 -129 16 C-129 15.34 -129 14.68 -129 14 C-125.17511272 11.08204476 -121.05832768 8.57993688 -117 6 C-116.1646875 5.45601562 -115.329375 4.91203125 -114.46875 4.3515625 C-107.66638473 0.06607238 -100.44833104 -3.02566646 -93 -6 C-92.36787598 -6.25837646 -91.73575195 -6.51675293 -91.08447266 -6.78295898 C-62.17406047 -18.21735674 -27.25416313 -13.19199804 0 0 Z M-12 1 C-12 70.3 -12 139.6 -12 211 C7.84793157 203.06082737 26.03072821 190.04014163 38 172 C38.56074219 171.17113281 39.12148437 170.34226563 39.69921875 169.48828125 C56.9140893 143.31122213 63.42479756 113.13542509 57.48828125 82.14111328 C54.33760197 68.32538464 48.37829228 55.99665944 41 44 C40.21882813 42.68322266 40.21882813 42.68322266 39.421875 41.33984375 C37.52650635 38.19421687 35.60738001 35.56070058 33 33 C32.13560856 31.94580154 31.28104203 30.88345462 30.4375 29.8125 C29.633125 28.884375 28.82875 27.95625 28 27 C27.34 27 26.68 27 26 27 C25.70029297 26.17242187 25.70029297 26.17242187 25.39453125 25.328125 C23.43762397 22.06113133 20.66772425 20.03146546 17.6875 17.75 C17.06593018 17.26982422 16.44436035 16.78964844 15.80395508 16.29492188 C6.97209272 9.57908476 -1.35800368 4.54733211 -12 1 Z M-96 0 C-96.33 0.99 -96.66 1.98 -97 3 C-97.99 2.505 -97.99 2.505 -99 2 C-119.90454964 9.40369466 -137.32492783 26.7090536 -149 45 C-149.55429688 45.85464844 -150.10859375 46.70929688 -150.6796875 47.58984375 C-152.20152143 50.02241249 -153.61902444 52.4849272 -155 55 C-155.50273437 55.90234375 -156.00546875 56.8046875 -156.5234375 57.734375 C-168.61879877 81.43391535 -170.08396942 113.08830635 -162.54296875 138.44140625 C-157.65770035 153.32939505 -150.58130948 167.29376726 -140 179 C-139.34 179 -138.68 179 -138 179 C-137.505 179.99 -137.505 179.99 -137 181 C-137 180.01 -137 179.02 -137 178 C-137.66 178 -138.32 178 -139 178 C-138.84402344 177.11957031 -138.68804687 176.23914063 -138.52734375 175.33203125 C-138.33269531 174.17058594 -138.13804687 173.00914062 -137.9375 171.8125 C-137.74027344 170.66394531 -137.54304688 169.51539063 -137.33984375 168.33203125 C-136.69765347 162.03561389 -138.46900507 159.14352511 -142 154 C-143.30768403 151.56539607 -144.47071069 149.07282388 -145.625 146.5625 C-146.07359375 145.61793945 -146.07359375 145.61793945 -146.53125 144.65429688 C-149.50183302 138.25965688 -151.04122811 131.98533808 -152 125 C-152.33 124.34 -152.66 123.68 -153 123 C-153.31648391 119.6593365 -153.51128525 116.31782389 -153.71875 112.96875 C-153.81288062 110.0735199 -153.81288062 110.0735199 -155 108 C-155.17666445 104.02504988 -154.79304368 100.96521841 -154 97 C-138.82 97.33 -123.64 97.66 -108 98 C-107.67 133.64 -107.34 169.28 -107 206 C-99.83156675 209.94576739 -99.83156675 209.94576739 -95 211 C-95 141.37 -95 71.74 -95 0 C-95.33 0 -95.66 0 -96 0 Z " fill="#000000" transform="translate(210,48)"/>`}

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

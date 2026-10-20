/**
 * Measures the initial JS payload: the entry chunk plus every chunk it
 * imports statically (that is what a first-time visitor downloads before the
 * page module arrives).
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dir = 'dist/assets/js';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));

const entry = files.find((f) => /^index-.*\.js$/.test(f));
if (!entry) {
  console.error('entry chunk not found');
  process.exit(1);
}

const staticImports = new Map();
for (const f of files) {
  const text = fs.readFileSync(path.join(dir, f), 'utf8');
  const found = new Set();
  const re = /import\s*\{[^}]*\}\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(text))) found.add(m[1]);
  const re2 = /import\s*["']([^"']+)["']/g;
  while ((m = re2.exec(text))) found.add(m[1]);
  staticImports.set(f, found);
}

const initial = new Set();
const queue = [entry];
while (queue.length) {
  const current = queue.pop();
  if (initial.has(current)) continue;
  initial.add(current);
  for (const dep of staticImports.get(current) || []) {
    const name = path.basename(dep);
    if (files.includes(name)) queue.push(name);
  }
}

let raw = 0;
let gzip = 0;
let brotli = 0;
const list = [];
for (const f of initial) {
  const buf = fs.readFileSync(path.join(dir, f));
  raw += buf.length;
  gzip += zlib.gzipSync(buf, { level: 9 }).length;
  brotli += zlib.brotliCompressSync(buf).length;
  list.push([f, buf.length]);
}

console.log('INITIAL JS PAYLOAD');
for (const [f, size] of list.sort((a, b) => b[1] - a[1])) {
  console.log(`  ${(size / 1024).toFixed(1).padStart(8)}k  ${f}`);
}
console.log(`  chunks: ${initial.size}`);
console.log(`  raw:    ${(raw / 1024).toFixed(1)}k`);
console.log(`  gzip:   ${(gzip / 1024).toFixed(1)}k`);
console.log(`  brotli: ${(brotli / 1024).toFixed(1)}k`);

let all = 0;
let allBrotli = 0;
for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  all += buf.length;
  allBrotli += zlib.brotliCompressSync(buf).length;
}
console.log(`\nALL JS: ${(all / 1024).toFixed(1)}k raw, ${(allBrotli / 1024).toFixed(1)}k brotli across ${files.length} files`);

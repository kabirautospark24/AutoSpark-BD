/**
 * Local static server that mirrors the Vercel deployment rules.
 *
 * - serves the prerendered route files (dist/<route>.html and dist/<route>/index.html)
 * - serves dist/spa-shell.html for dynamic routes (/vehicle/:id, /product/:id)
 * - serves dist/404.html with a 404 status for unknown paths
 *
 * Usage: node scripts/serve-dist.mjs [port]
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const PORT = Number(process.argv[2] || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.gz': 'application/gzip',
  '.br': 'application/brotli',
};

async function sendFile(res, filePath, status = 200) {
  const body = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);

    // Stub for the Vercel function api/geo.ts so local previews behave the
    // same as production (no failed request in the console).
    if (pathname === '/api/geo') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ country: 'BD' }));
    }

    // Dynamic routes fall back to the neutral SPA shell.
    if (/^\/(vehicle|product)\/[^/]+\/?$/.test(pathname)) {
      const shell = path.join(DIST, 'spa-shell.html');
      if (await exists(shell)) return sendFile(res, shell);
    }

    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);

    const candidates = [
      path.join(DIST, pathname),
      path.join(DIST, `${pathname}.html`),
      path.join(DIST, pathname, 'index.html'),
    ];

    for (const candidate of candidates) {
      if (await exists(candidate)) {
        const stat = await fs.stat(candidate);
        if (stat.isFile()) return sendFile(res, candidate);
      }
    }

    // Unknown path: real 404 with the prerendered not-found page.
    const notFound = path.join(DIST, '404.html');
    if (await exists(notFound)) return sendFile(res, notFound, 404);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Server error: ${error.message}`);
  }
});

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

server.listen(PORT, () => {
  console.log(`[serve-dist] http://localhost:${PORT}`);
});

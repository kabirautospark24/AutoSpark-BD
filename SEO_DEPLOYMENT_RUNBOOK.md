# SEO and deployment runbook

Auto Spark BD, `www.autosparkbd.com`. This file records what is automated in
the repository and what still needs one click in the Vercel dashboard.

## 1. Custom domain

### Current state

| Host | DNS | Response |
| --- | --- | --- |
| `www.autosparkbd.com` | CNAME to `vercel-dns-017.com` | 200, serves the site |
| `autosparkbd.com` | A record to `216.198.79.1` (Vercel) | 308 redirect to `www` |

Both hosts are attached to the Vercel project `autospark-bd`
(`prj_4z16vBfwG38EmuISBPrgRASQx13H`). DNS is managed at Hostinger
(`tipuitbd.earth.orderbox-dns.com`), the hosting is Vercel.

Vercel currently treats `www` as the primary domain and redirects the apex to
it. The site therefore uses `https://www.autosparkbd.com` as the canonical
origin (`src/lib/seo.ts`, `SITE_URL`), and every canonical tag, sitemap entry,
Open Graph URL and JSON-LD identifier uses that host. Nothing points at a host
that redirects.

### Optional: make the apex the primary host

The apex is the nicer canonical. To switch:

1. Vercel dashboard, project `autospark-bd`, Settings, Domains.
2. Set `autosparkbd.com` as the primary domain (this makes Vercel redirect
   `www` to the apex instead).
3. In `src/lib/seo.ts` change `SITE_URL` back to `https://autosparkbd.com`.
4. Rebuild and redeploy (`npm run build`).

Do not add a `www` to apex redirect in `vercel.json` while the apex still
redirects to `www`, that combination is a redirect loop.

DNS records that must stay in place at Hostinger:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `cname.vercel-dns.com` |

## 2. What the build produces

`npm run build` runs three steps:

1. `tsc --noEmit` type check.
2. `vite build` (client bundle, no source maps, bundle report to `stats/`).
3. `node scripts/prerender.mjs`, which renders every route to static HTML.

The prerenderer writes, for each route:

- `dist/<route>.html` and `dist/<route>/index.html` (same content, so the
  route resolves with or without `cleanUrls`).
- `dist/<route>` with its own title, meta description, robots tag, canonical,
  Open Graph and Twitter card tags, one `h1`, the JSON-LD graph (business +
  website + breadcrumbs) and the full page markup.

Also written:

- `dist/404.html` for unknown URLs (real 404 status, `noindex`).
- `dist/spa-shell.html` and `dist/spa-shell/index.html`, the neutral shell for
  the dynamic routes `/vehicle/:id` and `/product/:id`.
- `dist/sitemap.xml` and `dist/robots.txt`, generated from the route manifest.
- `dist/og/*.png`, one 1200x630 share image per route.

`src/lib/seo.ts` is the single source of truth for the route manifest. Change a
title there and the client head, the prerendered HTML and the sitemap all
follow.

## 3. Host and routing rules (`vercel.json`)

- `cleanUrls: true`, `trailingSlash: false`.
- Rewrites only for the two dynamic routes, both to `/spa-shell`.
- Redirects for the old aliases (`/shop`, `/sparkai`, `/payment/*`).
- Cache headers: hashed assets immutable for a year, `/og` for a week, `/api`
  never cached, plus HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy` and `Permissions-Policy`.

## 4. Checks

```bash
npm run typecheck      # tsc, app and api
npm run lint           # eslint (the repo has pre-existing warnings, no new ones)
npm run build          # typecheck + bundle + prerender
node scripts/validate-build.mjs   # metadata, sitemap, robots, favicons, share images, no source maps
npm run serve:dist     # local static server that mirrors the Vercel rules
npm run check:console -- http://localhost:4173   # console errors per route
npm run check:bundle   # initial JS payload
```

`scripts/validate-build.mjs` is the release gate: it fails the build if a page
loses its title, description, canonical, `h1` or JSON-LD, if two pages share a
title, if the sitemap lists a `noindex` route, if a source map or the bundle
report ends up in `dist`, or if the shell still references the removed third
party scripts.

## 5. Favicons and share images

- `npm run build:assets` regenerates `public/favicon*`, `public/apple-touch-icon.png`,
  `public/mstile-150x150.png`, `public/android-chrome-*.png` and
  `public/site.webmanifest` from one SVG source.
- The share images are generated during the prerender step with sharp. If sharp
  is not installed the step is skipped with a warning and the build still
  succeeds.

## 6. Environment

The client bundle needs no secrets. `src/lib/env.ts` validates the optional
`VITE_*` variables without pulling a schema library into the entry chunk, and
the app falls back to same origin endpoints when they are missing.

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` for the catalogue and reviews.
- `VITE_APPWRITE_*` for the inventory and payments.
- `VITE_PAYMENT_API_URL` for payment initiation, defaults to
  `https://www.autosparkbd.com/api/payment/init`.

Server secrets (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SSLCOMMERZ_*`) stay in the Vercel server functions and never reach the
browser.

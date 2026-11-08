# 01 — Project Discovery

**Project:** Auto Spark BD (`autospark`)
**Domain:** Premium car dealership + service centre, Rajshahi, Bangladesh
**Audit date:** 2026-11-08
**Method:** Full source inspection of `src/`, build artifacts in `dist/`, Tailwind output, `index.html`, configs, and existing design-system docs.

## Stack

| Layer | Technology |
|---|---|
| UI | React 18.3 + TypeScript 5.5 (strict) |
| Build | Vite 5.4, esbuild minify, gzip + brotli precompression |
| Styling | Tailwind CSS 3.4 + PostCSS + hand-written CSS (`src/index.css`, `src/styles/tokens.css`) |
| Routing | React Router 7 (client SPA + prerendered routes) |
| Motion | Framer Motion 12 + GSAP 3 |
| 3D | three.js 0.163 + @react-three/fiber/drei |
| Data | Supabase, Neon, Appwrite, local fallbacks |
| Payments | SSLCommerz (serverless `api/`) |
| Icons | lucide-react |
| UI primitives | `@base-ui/react` + shadcn-style generated components |
| Tests | Vitest, Playwright, pa11y/Lighthouse scripts |
| Hosting | Vercel (`vercel.json`), prerender via `scripts/prerender.mjs` |

## Surface area

- **24 page modules** in `src/pages/` (Home, Inventory, Vehicle details, Experience, Services, Accessories, Product, Cart, Checkout, Payment result pages, About, Testimonials, Sell, Contact, SparkPilot, Legal, 404, preview/management).
- **~70 components** in `src/components/` plus `about/`, `home/`, `motion/`, `3d/`, `ui/`.
- **24 routes** registered in `src/App.tsx` (incl. redirects).
- Global chrome: `Layout` → `GeoBanner` + `GlassmorphismNavbar` + `Footer` + `CompositeFAB` + `SparkPilotWidget`.
- SEO: `PageHead` + `react-helmet-async`; default meta/JSON-LD in `index.html`; per-route prerender.

## Design-system artefacts found

- `tailwind.config.js` — extensive tokens (brand red, surface, type scale, spacing, shadows, motion, z-index).
- `src/index.css` (970 lines) — primitive/semantic/component tokens + utilities (glass, glow, gradients, noise, `.fv-*` showcase).
- `src/styles/tokens.css` (98 lines) — a **second, conflicting token layer** generated from `design-system/autospark/MASTER.md` (gold + Cormorant/Montserrat + Liquid Glass). Imported **after** `index.css` in `main.tsx`, so it overrides the real brand.
- `design-system/autospark/MASTER.md` — describes a *light cream + gold + Cormorant* luxury system that the shipped UI does not use.
- `docs/archive/` — ~200 AI-generated completion reports; not a source of truth.
- `motion-audits/autospark-2026-09-17.html` — prior motion audit.

## Verification that matters

- `dist/assets/index-3JxbBhnN.css` contains **no** `.bg-primary`, `.border-border`, `.text-muted-foreground`, `.ring-ring`, `.ring-3`, `.rounded-4xl`, `.in-data-*`, `.not-aria-*` utilities. The shadcn v4 component set was copied into a Tailwind v3 project without porting tokens.
- The compiled CSS contains both `--brand-red:#C00000` and later `--brand-red:var(--color-accent)` where `--color-accent:#A16207` (gold). Gold wins.

## Key architectural observations

1. Two design-token systems fight for control; the losing one is the actual brand.
2. A Tailwind v4/shadcn component library ships in a v3 project, so primary buttons have no fill on five high-intent pages.
3. Brand colour is expressed four ways (`#B80000`, `#C00000`, `#FF1A1A`, `#A16207`) plus Tailwind default `red-*`, `blue-*`, `sky-*`, `slate-*`.
4. Page composition repeats one template: centered heading → 3/4-column card grid → gradient section. This is the dominant AI-template signature.
5. Numerous mock/demo data paths silently replace failed live data, and some business copy contradicts itself (sales counts, founder name, years in business).
6. Global `index.css` comments are mojibake-corrupted from prior edits (visible as `â”€â”€â”€`).

# 10 — Quality Assurance Report

Date: 2026-11-08
Scope: foundation + shared chrome + critical defects (roadmap Phases 1–3). Phases 4–6 are documented but not fully executed.

## Verification run

| Check | Command | Result |
|---|---|---|
| TypeScript | `npm run typecheck` | PASS (0 errors) |
| Lint | `npm run lint` | PASS (0 errors, 33 pre-existing warnings) |
| Unit tests | `npm run test:run` | PASS (68/68) |
| Production build | `npm run build` | PASS (2315 modules, 22 chunks, 21 routes prerendered) |
| CSS assertion | compiled `dist/assets/index-*.css` | `--primary: 192 0 0`, `--background: 5 5 5`, `.bg-primary`, `.bg-card`, `.border-border`, `.text-muted-foreground`, `.ring-ring`, `shadow-glow-red` all present; `A16207`, `B80000`, `FF1A1A` absent |

Not run: browser screenshots, Lighthouse, pa11y (dev server not started in this session). All visual claims are source- and build-based.

## Vibe-code inventory status

| ID | Status | Evidence / remaining work |
|---|---|---|
| VC-01 | RESOLVED | `src/styles/tokens.css` rewritten: gold/Cormorant import removed, `--brand-red:#C00000`, semantic vars authoritative |
| VC-02 | RESOLVED | `tailwind.config.js` maps background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring to `rgb(var(--x)/<alpha-value>)` |
| VC-03 | RESOLVED | `ui/Button.tsx` ported to v3-safe utilities; visible fill + focus ring restored |
| VC-04 | RESOLVED | `ui/Card.tsx` rewritten on semantic tokens |
| VC-05 | PARTIAL | Gold/old reds removed from all dealership pages; 3D viewer paint swatches and SparkAI retain distinct colours by design; checkout palette untouched |
| VC-06 | RESOLVED | Contact header now `pt-28`; About header `pt-28`; Contact no longer renders duplicate showroom cards above the hero |
| VC-07 | RESOLVED | Five literal `{theme === …}` class strings replaced with tokens |
| VC-08 | RESOLVED | `glow-red` + `lift` + `hairline` shadows added to Tailwind config |
| VC-09 | RESOLVED | Footer rebuilt: no emoji, no stock gallery, no fake a11y widget |
| VC-10 | RESOLVED | Footer on tokens; single red; structured 5/2/2/3 grid |
| VC-11 | RESOLVED | Fake search button removed |
| VC-12 | RESOLVED | Navbar CTAs (desktop + mobile) are single `<Link>` elements |
| VC-13 | RESOLVED | Bengali label restored to `অভিজ্ঞতা`; mojibake removed |
| VC-14 | RESOLVED | Single logo across all routes |
| VC-15 | PARTIAL | Logo spin/rotate/glow and hover-scale removed; glass kept intentionally for the fixed header |
| VC-16 | RESOLVED | Home sections re-themed on tokens; rainbow metrics unified to primary; glass/glow removed from feature cards |
| VC-17 | RESOLVED | All four metric gauges now use `text-primary` |
| VC-18 | RESOLVED | Full-bleed red CTA replaced with calm `bg-primary` section; noise/diagonal lines removed |
| VC-19 | RESOLVED | `setInterval` rotation removed; colours picked once per visit |
| VC-20 | RESOLVED | Services hero copy simplified; 'cutting-edge' removed |
| VC-21 | RESOLVED | 'Instant Payment' replaced with 'Fair Valuation' |
| VC-22 | PARTIAL | Spanish word fixed; contradictory stats/founders pending |
| VC-23 | RESOLVED | `poderosa` removed |
| VC-24 | PARTIAL | Fake inventory sync not investigated |
| VC-25 | PARTIAL | Silent mock fallbacks remain |
| VC-26 | PARTIAL | Duplicate demo products remain |
| VC-27 | RESOLVED | Accessory quantity sync fixed; global cart now updates |
| VC-28 | RESOLVED | Separate `couponInput` state; input bound correctly; re-apply guard fixed |
| VC-29 | RESOLVED | `updateCartQuantity` now calls global `updateQuantity` / `removeFromCart` |
| VC-30 | RESOLVED | `alert()` replaced with persisted booking + `role="status"` banner; step 2 requires name and phone |
| VC-31 | PARTIAL | Contact labels associated; other forms pending |
| VC-32 | PARTIAL | Shared dialog primitive migration pending |
| VC-33 | PARTIAL | Product image alt audit pending |
| VC-34 | PARTIAL | Navbar nesting fixed; other pages pending |
| VC-35 | RESOLVED | Extra Google Fonts import removed |
| VC-36 | PARTIAL | Blur/glow cleanup pending |
| VC-37 | RESOLVED | All mojibake stripped from `src/index.css` and TSX comments |
| VC-38 | PARTIAL | Modal consolidation pending |
| VC-39 | PARTIAL | Button/Card ported; 22 unused `ui/*` files remain |
| VC-40 | RESOLVED | `AggregateRating` removed from ProductDetail JSON-LD |
| VC-41 | PENDING | Error-state language unification pending |
| VC-42 | PARTIAL | About page still has emoji/duplicate names |

## Regression risk

- `Card` no longer applies a hardcoded background; pages that passed their own `bg-*` still win by CSS order. No build/test regressions observed.
- Token aliases (`--bg-primary`, `--text-primary`, `--color-accent`, etc.) retained so untouched pages keep rendering.
- No routes, data contracts, payment callbacks, or env vars changed.

## Recommended next actions

1. Run `npm run dev` and capture screenshots of Home, Contact, About, Cart at 375/768/1440; compare against the "Night Showroom" direction.
2. Execute roadmap Phase 4 (content integrity) and Phase 5 (composition).
3. Consolidate the four page-local modals onto the shared dialog with focus trap.
4. Add CI for typecheck/lint/test/build.

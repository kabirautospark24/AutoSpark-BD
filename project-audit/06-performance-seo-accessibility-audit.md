# 06 — Performance, SEO & Accessibility Audit

## Performance

Observed from source and build config (no fabricated Lighthouse scores; scripts exist but were not run against a live server in this session).

**Good**
- Route-level code splitting + `lazyWithRetry`.
- Manual chunks for react/router/motion/gsap/three/icons/supabase.
- Gzip + brotli pre-compression; esbuild minify; modern target.
- `content-visibility` and `LazySection` for below-fold content.
- Fonts loaded with `display=swap`; critical CSS inline; FOUC theme script.
- LCP-critical logo preloaded.

**Problems**
- Extra unused Google Fonts request from `tokens.css` (Cormorant + Montserrat + Geist) on top of the preloaded Geist/Outfit/Hind.
- Heavy decorative effects: 20–60px backdrop blurs, multiple large blurred orbs, glows, animated gradients, noise SVG overlays.
- Large page modules and unused UI primitives increase parse/eval cost when a route is opened.
- Several hotlinked Pexels images of unknown dimensions.
- `setInterval` colour rotation on Home keeps the page re-rendering.
- Service worker + reload heuristics add complexity; acceptable but should be audited separately.

**Targets to verify after transformation:** LCP < 2.5s, INP < 200ms, CLS < 0.1 on mid-tier mobile; no more than one font family request per script.

## SEO

**Good**
- Per-route title/description/canonical/OG/Twitter via `PageHead` + prerender.
- `AutoDealer` JSON-LD, sensible meta, manifest, sitemap/robots scripts.
- Semantic `main`, `nav`, `footer` exist.
- `lang` switching exists for EN/BN.

**Problems**
- `AggregateRating` in Product JSON-LD without review content.
- Some headings skip levels inside cards and sections.
- Image alt text missing on meaningful product images (`alt="" aria-hidden`).
- Internal linking is thin (footer link farm, no related content).
- Contradictory business facts could confuse entity extraction.

## Accessibility (WCAG 2.2 AA)

**Strong**
- Skip link, focus-visible global outline, reduced-motion support, `aria-current`, `aria-expanded`, mobile focus trap, touch-target utilities, 44px minimums in many places.

**Failures / risks**
- Primary `Button` sets `outline-none` and its replacement focus ring utilities do not exist → invisible focus.
- Emoji used as icons (footer/About).
- Icon-only buttons without accessible names.
- Labels not programmatically associated in several forms.
- Modals without dialog semantics or focus trapping (4 implementations).
- Nested interactive elements.
- Colour contrast: `text-gray-400`/`text-gray-500` on `#0a0a0a` and `text-red-400` on dark can fall below 4.5:1 for body text; `text-white/40` scroll hint is decorative but borderline.
- Checkout colour palette reduces contrast consistency and light-mode support.

## Prioritised remediation

1. Restore semantic colour/focus tokens so `Button` is visible and focus returns.
2. Remove unused font import.
3. Fix fixed-header offsets.
4. Remove fake/partial controls and emoji.
5. Give modals dialog semantics.
6. Associate form labels.
7. Remove decorative stock galleries; keep real vehicle imagery.

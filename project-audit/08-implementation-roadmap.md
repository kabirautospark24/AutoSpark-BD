# 08 — Implementation Roadmap

## Phase 1 — Foundation (this pass)

1. Replace `src/styles/tokens.css` with the single authoritative token layer:
   - remove gold/Cormorant/Montserrat,
   - define semantic RGB tokens + brand primitives,
   - keep legacy aliases pointing at the real red.
2. Extend `tailwind.config.js`:
   - map `primary/background/foreground/card/muted/accent/destructive/border/input/ring/popover` to CSS variables with `<alpha-value>`,
   - unify brand red to `#C00000`,
   - add missing `shadow-glow-red` and tinted elevation.
3. Clean mojibake and duplicate font loading in `src/index.css`.
4. Port `src/components/ui/Button.tsx` to Tailwind v3 + brand tokens (visible fill, real focus ring, consistent sizes).
5. Rebuild `src/components/ui/Card.tsx` on semantic tokens.

## Phase 2 — Chrome (this pass)

6. Redesign `Footer`: editorial brand block, two link groups, contact/hours, real social links, legal row; remove emoji badges, stock gallery, and the fake a11y widget.
7. Navbar targeted fixes: single logo, solid red CTA, valid interactive markup, fixed Bengali label, remove fake search, calmer motion, token colours.

## Phase 3 — Critical page defects (this pass)

8. `ContactPage` / `AboutPage`: clear the fixed header, adopt editorial page header.
9. `TestimonialsPage`: fix literal `{theme === ...}` class strings; remove `poderosa`.
10. `HomePage`: fix `shadow-glow-red`; align hero/secondary CTAs to tokens.
11. `CartPage` coupon binding fix; `AccessoriesPage` quantity pass-through; global cart quantity sync.
12. `ServicesPage` booking: replace `alert()` with inline status and validate step 2.

## Phase 4 — Content & commerce integrity

13. Reconcile stats, founder names, years in business, sales counts.
14. Label demo/fallback data; remove fake `AggregateRating` unless reviews exist.
15. Remove unbacked "Instant Payment" claim or link it to the real flow.
16. Associate form labels; add `aria-label` to icon-only controls.

## Phase 5 — Composition (next pass)

17. Introduce `Section` + `SectionHeader` (left-aligned eyebrow/title/action) and apply across Home, Inventory, Services, About, Testimonials.
18. Replace repeated 3-card grids with editorial/asymmetric compositions where content allows.
19. Unify the two EMI calculators into one component.
20. Replace decorative glass/glow on content cards with hairline surfaces.
21. Move page-local modals to the shared dialog primitive with focus trap.
22. Checkout palette migration to tokens.

## Phase 6 — Verification

23. `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`.
24. Lighthouse/pa11y scripts against a local preview (requires dev server).
25. Update this roadmap with status and re-run the vibe-code inventory.

## Risk controls

- No changes to routes, data contracts, payment callbacks, or env handling.
- Each phase independently buildable and reversible.
- Prefer additive tokens over deleting utilities, so untouched pages keep rendering.

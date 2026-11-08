# 04 — Architecture Audit

## Strengths

- Clear route map in `src/App.tsx` with `lazyWithRetry` and Suspense.
- `Layout` cleanly separates chrome from routes and hides chrome on `/sparkpilot`.
- Sensible provider stack: Helmet → Tooltip → Theme → Language → Cart.
- `PageHead` + prerender give real per-route SEO.
- Strict TypeScript, ESLint, Vitest, Playwright, bundle visualizer, compression.
- `cn` (shadcn's class-merge package) and `class-variance-authority` are appropriate.

## Structural problems

1. **Two competing token systems.** `src/index.css` (automotive dark/red) and `src/styles/tokens.css` (cream/gold/Cormorant) both define `:root` and `.dark`. `tokens.css` is imported last, so it silently wins where variables overlap. `design-system/autospark/MASTER.md` documents the losing system.
2. **Framework-version mismatch.** `components.json` and `src/components/ui/*` assume Tailwind v4 + shadcn base-nova. The project runs Tailwind 3.4. Utilities such as `bg-primary`, `ring-3`, `rounded-4xl`, `in-data-*`, `not-aria-*`, `--spacing()` compile to nothing. Only `Button` and `Card` are actually consumed, but those two are consumed on the highest-intent pages.
3. **Component boundaries are inverted.** Page files are enormous (Inventory ~1,800 lines, Accessories ~3,200, Services ~2,150, Testimonials ~1,500) and contain modals, filters, forms, calculators, and data fetching. Reusable `Modal`, `Skeleton`, `EmptyState`, `OptimizedImage` exist but are unused. The same EMI calculator is implemented twice with different styling.
4. **Data layer is inconsistent.** Some pages query Supabase, others use demo arrays synchronously (`InventoryPage`), others silently fall back to mocks. No shared repository/hook layer, no typed error surface, no distinction between "live" and "demo" data in the UI.
5. **Theme strategy is mixed.** `ThemeContext` (`dark`/`light` class) coexists with `useTheme().theme` conditionals inside nearly every component, producing hundreds of duplicated `theme === 'dark' ? ... : ...` branches instead of token-driven CSS.
6. **Dead primitives.** 22 of 24 files in `src/components/ui/` are unreferenced; `TooltipProvider` is mounted but no tooltip is used.
7. **Encoding corruption.** `src/index.css` and `GlassmorphismNavbar.tsx` contain mojibake in comments/strings from prior edits.
8. **Scripts/artefacts sprawl.** ~200 completion reports in `docs/archive`, root-level `dist/`, `test-results/`, `motion-audits/`. Not harmful at runtime but erodes trust in documentation.

## Recommended target architecture

- Single source of truth for tokens (`src/styles/tokens.css`) consumed by Tailwind via CSS variables. `index.css` keeps base/utilities only.
- `@/lib/utils` `cn` export instead of importing the `cn` package directly (matches `components.json`).
- One `Button`/`Card`/`Input` primitive set, ported to Tailwind v3 and brand tokens.
- `useData`/repository hooks returning `{data, loading, error, source}` so pages can render real loading/empty/error states and label demo data.
- Shared `SectionHeader`, `Section`, `Dialog`, `FormField` components to eliminate the centred-template repetition and modal duplication.
- Replace `theme === 'dark' ?` branches with CSS variables wherever no JS behaviour is required.

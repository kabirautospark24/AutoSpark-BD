# 09 — Dependency & Tooling Audit

## Runtime dependencies (reviewed)

| Package | Use | Verdict |
|---|---|---|
| react / react-dom 18 | UI | Keep |
| react-router-dom 7 | Routing | Keep |
| framer-motion 12 | Motion | Keep; prune decorative usage |
| gsap 3 | Motion | Keep only if referenced; verify usage |
| three / @react-three/* | 3D showcase | Keep; already lazy |
| @base-ui/react | Primitives | Keep; only used by `ui/*` |
| class-variance-authority | Variant API | Keep |
| cn | class merging (shadcn) | Keep; consider re-exporting from `@/lib/utils` to match `components.json` |
| tailwind-merge | Installed but `cn` already merges | Candidate for removal if unused |
| lucide-react | Icons | Keep |
| sonner | Toasts | Keep |
| react-hook-form / @hookform / zod | Forms | Keep (verify actual usage before pruning) |
| @supabase/supabase-js, @neondatabase, appwrite | Data | Keep |
| sslcommerz-lts | Payments | Keep |
| react-helmet-async | Head | Keep |
| react-day-picker / cmdk | Unused UI primitives | Candidate for removal with the unused `ui/*` set |
| @radix? none | — | — |

## Dev dependencies

- `@playwright/test`, `vitest`, `@testing-library/react` — testing exists.
- `eslint`, `prettier`, `typescript` — configured.
- `sharp` — image tooling.
- `rollup-plugin-visualizer`, `vite-plugin-compression` — build observability.
- `gh-pages` — legacy deploy target alongside Vercel; verify before removing.
- `express`, `cors`, `body-parser`, `@vercel/node` — local/serverless API.

## Tooling gaps

- `components.json` targets `@/lib/utils` but components import `cn` directly; no `src/lib/utils.ts`.
- 22/24 `src/components/ui/*` files are unused and written for Tailwind v4.
- `docs/archive/` contains ~200 generated reports; no single source of truth.
- No visual-regression baseline committed.
- No CI workflow observed for typecheck/lint/test/build.
- No local screenshot/lighthouse run performed in this session (server not started).

## Actions taken / recommended

Taken in this pass: no new dependencies installed. The transformation is achievable with existing React, Tailwind, lucide, framer-motion, and CSS. This avoids dependency risk and lockfile churn.

Recommended later:
1. Add `src/lib/utils.ts` exporting `cn` and update `components.json` consumers or keep `cn` package as-is.
2. Delete or port the unused `ui/*` primitives in one dedicated change (high churn, low runtime value).
3. Add a `ci.yml` that runs `typecheck`, `lint`, `test:run`, `build`.
4. Add Playwright visual snapshots for Home, Inventory, Vehicle, Checkout at 375/768/1440.
5. Remove `docs/archive/` or move to a wiki.

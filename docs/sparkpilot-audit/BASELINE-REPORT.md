# Baseline Report

## Commands run
- `npm run typecheck` (tsc app) — PASS
- `npm run typecheck:api` (tsc api) — PASS
- `npx vitest run src/sparkai` — 41/41 PASS
- `npm run lint` (eslint .) — 198 problems (151 errors, 47 warnings); only 3 warnings in src/sparkai
- `npm run build` — PASS (21 prerendered routes)
- `npm audit --omit=dev` — 2 high (form-data via sslcommerz-lts, no fix available)
- Playwright specs under vitest — 3 files "fail" (pre-existing; confirmed via git stash)

## Pre-existing failures (not caused by audit work)
- Repo-wide lint 151 errors (legacy). Deploy keeps `continue-on-error: true` on lint to avoid blocking prod deploys; documented as accepted debt.
- 3 Playwright spec files mis-collected by vitest (pre-existing).
- 2 high npm vulns in form-data (transitive via sslcommerz-lts; no upstream fix).

## Environment
- Node v24.16.0, npm 11.13.0, Windows (win32)
- Vite+React+TS on Vercel; tests via vitest
- Branch main tracking origin/main (github.com/kabirautospark24/AutoSpark-BD)
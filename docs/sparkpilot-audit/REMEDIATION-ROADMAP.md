# Remediation Roadmap

## Wave 1 — API hardening (commit d126a0e, pushed)
CORS allowlist, maxDuration, server-side KB, abort propagation, error hygiene, payment binding + amount truth + terminal paid, lead caps, geo edge header, deploy.yml permissions/concurrency, client kbTopic + Retry-After + estimateFinance 0% + clamps, dead code removal, dev-server KB import. +17 tests.

## Wave 2 — data + UI correctness (commit 30c1d39, pushed)
Unique catalog IDs, KB price/fuel fidelity, double-make render, Logo, contrast, IME guard, LeadForm key+guard, Live badge from aiLive, abortRef race, sessionStorage validation, discovered dedupe. +2 tests.

## Wave 3 — Wave 3 (this commit)
Aria typing dedup, audit docs. Finance 0% already supported via estimateFinance.

## Verification gates (all green)
typecheck:all ✅ · vitest 60/60 ✅ · eslint src/sparkai 0 errors ✅ · build 21 routes ✅

## Out of scope (future)
Wave 4+: focus traps for overlays, timer cleanup on unmount, full a11y audit (needs browser), Lighthouse, real payment E2E.
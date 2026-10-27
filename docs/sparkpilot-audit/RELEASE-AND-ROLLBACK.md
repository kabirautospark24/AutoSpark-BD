# Release and Rollback

## Releases
- Wave 1: commit d126a0e (pushed to main)
- Wave 2: commit 30c1d39 (pushed to main)
- Wave 3: this commit (audit docs + aria dedup)

Vercel auto-deploys on push to main. deploy.yml runs typecheck:all + lint (continue-on-error) + build before deploy.

## Rollback
- Revert the offending commit: `git revert <sha> && git push`
- Per-change rollbacks noted in Wave 1 plan: remove `maxDuration` line if plan rejects; re-optionalize cart in payment if a legacy checkout breaks.
- Payment paid-state guard and tran_id bind are additive safety — reverting only restores the old (less safe) behavior, no data migration needed.
- Catalog/KB data fixes are data-only; no schema migration.

## Risks remaining
- Repo lint 151 errors (accepted debt; deploy does not block on lint).
- 2 high npm vulns (form-data via sslcommerz-lts, no fix).
- Live a11y/perf unverified (no browser tool).
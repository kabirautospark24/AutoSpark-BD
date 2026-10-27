# Findings Register (evidence-based)

## Critical (fixed Wave 1)
- F1 Unauthenticated Groq proxy → denial-of-wallet. `api/sparkai/chat.ts`. Fixed: CORS allowlist, server-side KB, abort on disconnect, maxDuration.
- F2 Client-trusted KB/prefs → prompt injection. Fixed: server rebuilds KB from validated `kbTopic` enum; prefs slimmed.
- F3 Payment IPN trusts client amount when cart omitted; tran_id not bound. Fixed: bind check.tranId, amount vs stored order, paid terminal.
- F4 Lead endpoint no length caps + silent 200 on DB failure. Fixed.

## High (fixed Wave 1–2)
- F5 12 duplicate catalog IDs (Noah/Esquire hybrid vs non-hybrid slug). Fixed.
- F6 Axio/Fielder ready-hybrid price order flipped (26.5/26 vs CSV 26.00–26.50) → wrong minPrice. Fixed.
- F7 Prado/Axela fuel contradictions. Fixed.
- F8 AbortRef clobber race on Stop. Fixed.
- F9 IME Enter prematurely sends. Fixed.

## Medium (fixed Wave 2–3)
- F10 "SparkAI" logo text on live nav → "SparkPilot".
- F11 Contrast (cyan-600/emerald-600 on light). Fixed.
- F12 Live badge static → reflects aiLive.
- F13 sessionStorage no shape validation. Fixed.
- F14 Discovered list not deduped. Fixed.
- F15 LeadForm resubmit possible. Fixed.
- F16 Double-make render ("Toyota Toyota Axio"). Fixed.
- F17 Geo banner third-party fetch → prefer Vercel edge header. Fixed.

## Low / accepted
- F18 Unused `SPARKPILOT_SYSTEM_PROMPT` (deleted). F19 Dead `checkLiveStatus` (deleted).
- F20 2 high npm vulns (form-data via sslcommerz-lts, no fix) — accepted risk.
- F21 Repo lint 151 errors — accepted debt (continue-on-error in CI).
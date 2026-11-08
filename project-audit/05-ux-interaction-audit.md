# 05 — UX & Interaction Audit

## Navigation

- 8 primary links + 4 utility controls + CTA in one bar. At 1280px the desktop nav appears; below that everything collapses into a drawer.
- Active state is exact-match only, so `/vehicle/:id` shows no active "Inventory".
- The search button is decorative (only plays a click sound). Users will try it.
- Two logos are swapped by route (`/services`, `/accessories` use `logoassc.svg`).
- The Bengali "Experience" label is mojibake.
- Mobile drawer has Escape, scroll lock, focus management, and `aria-expanded` — this is genuinely well done; keep it.
- Nested `<Link><button>` in desktop CTA and mobile CTA is invalid interactive nesting.

## Feedback & states

- `InventoryPage` renders data synchronously; its skeleton is unreachable.
- Supabase failures on Testimonials/Accessories silently show mock data with no indication.
- `ServicesPage` booking uses `window.alert()` and validates only step 1.
- No shared empty/error state language; three different spinner implementations.
- Several icon-only controls lack `aria-label` (wishlist, quick view, compare, cart trash, modal close).
- Four modal implementations lack `role="dialog"`, `aria-modal`, Escape, and focus trap.

## Commerce flows

- Accessories quantity selector is ignored (always 1).
- Coupon field can never successfully apply a code.
- Accessories cart quantity updates only local state, desyncing the global cart badge and `/cart`.
- Product detail related items always come from `DEMO_PRODUCTS`, even for live products.
- `ProductDetailPage` emits `AggregateRating` JSON-LD without any reviews UI.
- Checkout abandons the brand palette (navy/sky) and hardcodes copy in English.

## Forms

- Contact form validates presence only; no email/phone format checks; no inline field-level errors.
- Sell form promises "Instant Payment" and shows an upload icon with no upload field.
- Booking/EMI forms have labels not associated with inputs.
- Success/error messages exist but are inconsistent in tone and placement.

## Motion

- The video hero and `fv-*` showcase use restrained, purposeful motion.
- Elsewhere: logo rotates -180° on load, logo wiggles on hover, nav links scale on hover, cards scale on hover, scroll indicator bounces, multiple parallax/glow effects. This is decorative motion, not hierarchy motion.
- `prefers-reduced-motion` is respected globally (good).

## Responsive

- Container and `h-dvh` handling is solid.
- Fixed header collides with `Contact` and `About` first content.
- Homepage hero uses `h-dvh` for the section but the nav overlays the video content.
- Several pages have 3-column desktop grids that become long single columns with no intermediate composition.

## UX verdict

Core journeys exist but the "finish" is missing: fake/soft states, dead controls, invalid nesting, and one high-intent page (checkout) looks unrelated to the brand. The nav's mobile accessibility is the strongest interaction work in the codebase.

# 03 — Visual Design Audit

## Current visual signature (what a visitor actually sees)

A dark automotive site with a **red accent that is inconsistently either red or gold**, a glassmorphism navbar, large centred section titles, repeated 1/2/3/4-column card grids, and red-gradient CTA bands. Individual components (the video hero, the `FeaturedVehicles` showcase) are strong; the pages between them are not art-directed.

## Typography

- Display: Geist; body: Outfit; Bengali: Hind Siliguri. The pairing is reasonable and already loaded.
- Hierarchy is **not** consistent: headings use `text-2xl sm:text-3xl`, `heading-responsive`, arbitrary `clamp(...)`, and `text-4xl … text-6xl` in different pages.
- Every section heading is centred. No eyebrow/kicker system, no editorial left-aligned headers, no action slot beside headings.
- Body measure is uncontrolled in several pages; `max-w-prose` is rarely used.
- `text-wrap: balance/pretty` is correctly applied globally.

**Verdict:** keep the typefaces, replace the ad-hoc scale with the existing `display-*`/`heading-*`/`body-*` tokens, introduce one consistent section-header pattern.

## Colour

- Brand primitives disagree: `tailwind.config.js` `#B80000`; `index.css` `#C00000`; `tokens.css` gold `#A16207` (wins); pages use `#FF1A1A`, `#8B0000`, `#DA1609`.
- Dark surfaces are near-black (`#050505`/`#0A0A0A`) — good, not pure black.
- Rainbow accents leak in: performance gauges (orange/green/blue/amber), footer trust badges (yellow/blue/green/red), checkout (navy `#030b1e`, sky, `#0061EB`), payment pages `sky`, team social avatars blue.
- Glass + glow + gradient text are used as decoration rather than hierarchy.

**Verdict:** one accent (signal red), one neutral ramp, no second hue except semantic success/warning/error.

## Layout

- Container is 1440px with fluid padding — good.
- Section rhythm uses `section-padding` but page headers use arbitrary `py-8`/`py-10`, causing fixed-header collisions (Contact, About).
- Repeated template: centred title → card grid. The homepage has **six** such sections in a row.
- Cards are almost always `rounded-2xl` + border + shadow, regardless of content.
- Negative space is inconsistent; some sections are dense, others sparse.

**Verdict:** introduce editorial section headers (left title + right action), asymmetric grids for narrative content, and one section-surface rhythm.

## Surfaces / effects

- `.glass`, `.glass-lg`, `.glow-red`, `.gradient-border`, `.text-gradient-brand-animated`, `.noise-overlay`, `.vignette`, `.diagonal-lines` are all defined and several are used.
- Glassmorphism on the navbar + cards + footer is the single strongest "AI template" tell.
- Shadows are mostly generic black; the config defines red-tinted shadows that are under-used.

**Verdict:** keep subtle translucency only for the fixed header; remove decorative glass from content cards; use tinted elevation and hairline borders.

## Imagery

- Real vehicle imagery exists in `public/` and is used in the showcase.
- Pexels stock is hotlinked for hero fallback, morphing showcase, footer gallery, testimonials, cart fallback.
- Team/testimonial avatars use generated `ui-avatars` with a blue background.

**Verdict:** remove decorative stock galleries from the footer, replace blue avatars with brand-initial monograms, keep hero fallback.

## Iconography

- lucide-react only, consistent stroke.
- Emojis used as icons in footer trust badges and About section titles. This directly violates the existing design-system anti-pattern list.

**Verdict:** remove emoji icons; use lucide with a controlled size/stroke.

## Distinctiveness score (evidence-based)

| Dimension | Before |
|---|---|
| Brand recall (colour/type) | Low — accent changes by page |
| Hierarchy | Medium — headings exist but every section is centred |
| Component originality | Medium — showcase is bespoke, cards are generic |
| Surface discipline | Low — glass/glow everywhere |
| Copy authenticity | Low — clichés + contradictions |
| Overall | **3/10 bespoke, 7/10 template** |

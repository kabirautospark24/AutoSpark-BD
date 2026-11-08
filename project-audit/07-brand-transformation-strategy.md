# 07 — Brand Transformation Strategy

## Verified brand facts (from code/content — no invention)

- Name: **Auto Spark BD** (also "Auto Spark").
- Location: Station Road (showroom) and Meherchandi (service centre), Rajshahi, Bangladesh.
- Since 2014 (per site copy), "North Bengal's leading premium car showroom".
- Offers: imported/premium vehicles, service centre, genuine accessories, sell-your-car, EMI/booking, payments.
- Contact: +880 1760-401605, autosparkbd@gmail.com; Sat–Thu 09:00–18:00.
- Existing assets: `logoAS3.svg`, `logoassc.svg`, real vehicle photography in `public/`, hero video.

## Brand problem

The site presents two identities: an **automotive night-showroom (dark + signal red)** and a **luxury-goods boutique (cream + gold + serif)**. The second identity is more recent, only lives in a secondary CSS file and a generated master doc, and is not used by any component. Meanwhile stock glassmorphism, emoji badges, and rainbow accents make the visible identity generic.

## Direction: “Night Showroom” — precision, not pomp

**Positioning:** the trusted place to buy and maintain a serious car in North Bengal. Confident and mechanical, not flashy or aristocratic.

**Personality:** precise, honest, understated, locally rooted.

**Audience:** professionals and business owners in Rajshahi/North Bengal buying premium imported cars; existing owners using the service centre.

**Design principles**
1. **One accent.** Signal red is the only brand hue in UI. Semantic green/amber/red are allowed only for status.
2. **Dark, not black.** Charcoal surfaces (`#050505`–`#1A1A1A`) with hairline borders; no pure `#000` large fields.
3. **Editorial hierarchy.** Section headers are left-aligned: eyebrow (uppercase, tracked) + display title + optional action. Not every section is centred.
4. **Photography over decoration.** Real vehicles lead; no stock galleries, no emoji, no glow orbs.
5. **Quiet motion.** 150–300ms, opacity/transform only, no spinning logos or hover wiggles.
6. **Honest data.** Demo/fallback data must be labelled; no fake ratings or unbacked promises.

## Design tokens

### Colour (RGB channels for Tailwind alpha support)

| Token | Light | Dark |
|---|---|---|
| background | 250 250 249 | 5 5 5 |
| foreground | 12 10 9 | 245 245 245 |
| card | 255 255 255 | 18 18 18 |
| card-foreground | 12 10 9 | 245 245 245 |
| popover | 255 255 255 | 18 18 18 |
| primary | 192 0 0 | 192 0 0 |
| primary-foreground | 255 255 255 | 255 255 255 |
| secondary | 245 245 245 | 38 38 38 |
| secondary-foreground | 12 10 9 | 245 245 245 |
| muted | 245 245 245 | 38 38 38 |
| muted-foreground | 82 82 82 | 163 163 163 |
| accent | 245 245 245 | 38 38 38 |
| accent-foreground | 12 10 9 | 245 245 245 |
| destructive | 220 38 38 | 239 68 68 |
| border | 229 229 229 | 30 30 30 |
| input | 229 229 229 | 30 30 30 |
| ring | 192 0 0 | 226 58 58 |

Brand primitives: `--brand-red:#C00000`, hover `#A00000`, light `#E23A3A`, dark `#8A0000`, glow `rgba(192,0,0,.22)`.

### Typography

- Display: **Geist** (600/700), tracking `-0.03em` at display sizes.
- Body: **Outfit** (400/500/600), max 65ch.
- Bengali: **Hind Siliguri**.
- Scale: existing `display-2xl … display-sm`, `heading-xl … heading-sm`, `body-xl … body-xs`, `label-*`. No new fonts.

### Spacing / layout

- 1440px container, fluid padding.
- Section rhythm: `section-padding` (already defined).
- Grid: 12-col desktop, asymmetric splits for narrative sections (7/5, 8/4).
- Radius: cards 16–20px, controls 10–12px, pills only for status/filter chips.

### Surfaces / elevation

- Hairline `border-border`.
- Shadows tinted toward the warm-black surface, not generic grey.
- Subtle noise only on the hero/footer, never on cards.
- Glass reserved for the fixed header only.

### Motion

- `--ease-premium: cubic-bezier(.32,.72,0,1)`, 180–300ms.
- Opacity/transform only.
- Reduced motion respected.

## Voice

Short, specific, local. Say what is true: vehicles available, service booking, location, hours, financing. Remove "cutting-edge", "premium care for your car", "instant payment" unless the flow exists.

## What will NOT change

- Framework, routing, data providers, payment flow, URLs, SEO structure, hero video, showcase concept.
- Verified business information and contact details.

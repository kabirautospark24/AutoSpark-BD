# 02 — Vibe-Code Inventory

Classification: **P0** production/brand-critical, **P1** high, **P2** medium, **P3** polish.
Status is filled in `10-quality-assurance-report.md`.

| ID | Area | Location | Problem | Impact | Priority | Status |
|---|---|---|---|---|---|---|
| VC-01 | Tokens | `src/styles/tokens.css:10,23` | Gold `--color-accent:#A16207` overrides real brand, aliased into `--brand-red` | Entire accent system becomes gold in CSS-var consumers; brand incoherent | P0 | |
| VC-02 | Tokens | `tailwind.config.js` colors vs `src/components/ui/*` | shadcn v4 semantic tokens (`bg-primary`, `border-border`, `ring-ring`, …) undefined under Tailwind 3.4 | Primary `Button` renders unfilled; focus rings vanish on 5 pages | P0 | |
| VC-03 | Components | `src/components/ui/Button.tsx:6-19` | Tailwind v4 syntax (`ring-3`, `size-3!`, `not-aria-*`) in v3 project; `outline-none` kills global focus | CTAs look like text, keyboard focus invisible | P0 | |
| VC-04 | Components | `src/components/ui/Card.tsx:14` | Hardcodes `bg-gray-800 border-gray-700` / `bg-white`, `rounded-lg`; pages fight it | Inconsistent surfaces/radius across 5 pages | P1 | |
| VC-05 | Brand | repo-wide | Four reds + `red-*`, `blue-*`, `sky-*`, `slate-*`, `#030b1e`, `#0061EB` | Checkout/Cart look like a different product | P1 | |
| VC-06 | Layout | `src/pages/ContactPage.tsx:55-57`, `AboutPage.tsx:156` | No/insufficient top padding under fixed navbar | Content hidden behind nav | P1 | |
| VC-07 | Bug | `TestimonialsPage.tsx:1023,1027,1036,1043,1050` | JSX expression inside plain string className | Literal `{theme === ...}` class names; card unstyled | P1 | |
| VC-08 | Hero | `HomePage.tsx:382` | `shadow-glow-red` does not exist in Tailwind config | No CTA shadow | P2 | |
| VC-09 | Footer | `Footer.tsx:139-155` | Emoji trust badges (🏆✔️🛡️📄), stock Pexels gallery, fake partial a11y controls (High Contrast/A+/A- only affect footer) | Reads generic/unfinished; promises controls that do not work | P1 | |
| VC-10 | Footer | `Footer.tsx:49,56` | Gold in gradient (`#A16207`), hardcoded reds, 4-col link farm | Brand drift | P1 | |
| VC-11 | Navbar | `GlassmorphismNavbar.tsx:332-344` | Search button only plays a sound; no search exists | Fake interaction | P1 | |
| VC-12 | Navbar | `GlassmorphismNavbar.tsx:396-409,517-534` | `<Link>` wrapping `<button>` (nested interactive, invalid HTML) | A11y / event bugs | P1 | |
| VC-13 | Navbar | `GlassmorphismNavbar.tsx:120` | Mojibake Bengali label (`à¦…à¦­à¦¿...`) | Broken localized nav | P1 | |
| VC-14 | Navbar | `GlassmorphismNavbar.tsx:104-107` | Two different logos depending on route | Brand inconsistency | P2 | |
| VC-15 | Navbar | `GlassmorphismNavbar.tsx` | Glass + logo spin/rotate + hover scale everywhere | Generic AI glassmorphism signature | P2 | |
| VC-16 | Home | `HomePage.tsx:443-637,715-803` | Six consecutive centered-heading sections + gradient surfaces | Template feel, weak hierarchy | P2 | |
| VC-17 | Home | `HomePage.tsx:620-623` | Rainbow metrics (`orange/green/blue/amber`) | Palette noise | P2 | |
| VC-18 | Home | `HomePage.tsx:806-828` | Full-bleed red gradient CTA with noise + glow | Generic AI CTA | P2 | |
| VC-19 | Home | `HomePage.tsx:337-362` | `setInterval` rotates colour picks every 12s | UI churn / distraction | P3 | |
| VC-20 | Copy | `ServicesPage.tsx:1209-1221` | "Premium Auto Services", "cutting-edge technology" | AI copy cliché | P1 | |
| VC-21 | Copy | `SellCarPage.tsx:117-125` | "Instant Payment / Get paid immediately" with no such flow; Upload icon, no upload | Misleading promise | P1 | |
| VC-22 | Copy | `TestimonialsPage.tsx:1061,1075,1478`, `AboutPage.tsx:499-518` | Contradictory stats, founder names, years | Trust damage | P1 | |
| VC-23 | Copy | `TestimonialsPage.tsx:995` | Spanish "poderosa" inside Bengali sentence | Broken copy | P2 | |
| VC-24 | Data | `InventoryPage.tsx:847-851` | Fake sync "fetch"; skeleton never shows, no error state | Loading states are theatre | P2 | |
| VC-25 | Data | `TestimonialsPage.tsx:811-823`, `AccessoriesPage.tsx:2076-2082` | Silent mock fallback on fetch failure | Users see fake data | P2 | |
| VC-26 | Data | `AccessoriesPage.tsx:89-91` | Duplicate demo products (`Globoil 5W-30` ×3) | Looks like placeholder catalogue | P2 | |
| VC-27 | Commerce | `AccessoriesPage.tsx:926,1145,3100` | Quantity selector ignored, always adds 1 | Broken feature | P1 | |
| VC-28 | Commerce | `CartPage.tsx:368-379,110` | Coupon input bound to already-applied value; can never apply | Broken feature | P1 | |
| VC-29 | Commerce | `AccessoriesPage.tsx:2105-2115` | Local cart quantity never syncs global cart | Stale header/`/cart` | P2 | |
| VC-30 | A11y | `ServicesPage.tsx:2147` | `alert()` confirmation, validation skips step 2 | Unprofessional + inaccessible | P1 | |
| VC-31 | A11y | Multiple forms (Services, Inventory, VehicleDetails, Accessories search) | Labels not associated (`htmlFor`/`id` missing) | WCAG failure | P1 | |
| VC-32 | A11y | Modals (Inventory, Services, Accessories, FeaturedVehicles) | No `role="dialog"`, Escape, or focus trap; shared `Modal` unused | WCAG failure | P1 | |
| VC-33 | A11y | `ProductDetailPage.tsx:560,821` | `alt="" aria-hidden` on meaningful product images | WCAG failure | P2 | |
| VC-34 | A11y | Nested links/buttons (`InventoryPage.tsx:1713-1717`, `VehicleDetailsPage.tsx:321`, `ServicesPage.tsx:1565`) | Invalid nesting | Keyboard/AT bugs | P1 | |
| VC-35 | Perf | `main.tsx:2` + `tokens.css:2` | Extra Google Fonts import (Cormorant/Montserrat/Geist) not used by UI | Wasted network + render delay | P2 | |
| VC-36 | Perf | `index.html:98` + global | `content-visibility:auto` on lazy images; heavy blur/glow layers | Paint cost | P3 | |
| VC-37 | Quality | `src/index.css` comments | Mojibake (`â”€â”€â”€`, `â€”`) throughout | Unmaintainable source | P2 | |
| VC-38 | Quality | Page-local modal implementations ×4 vs shared `Modal` | Duplication | Maintenance | P2 | |
| VC-39 | Quality | `src/components/ui/*` (24 files) | Unused v4 primitives shipped in v3 project; only `Button` + `Card` used | Dead weight / future traps | P3 | |
| VC-40 | SEO | `index.html` vs route heads | Strong base SEO, but fake `AggregateRating` in `ProductDetailPage.tsx:330` | Rich-result risk | P2 | |
| VC-41 | UX | `NotFoundPage`, `Payment*` | Mostly solid; no shared `ErrorState` language | Minor inconsistency | P3 | |
| VC-42 | Content | `AboutPage.tsx:919-1167` | Emoji in section titles; duplicate English/Bengali names | Generic feel | P2 | |

# Made With GSAP Reference Audit

## Scope

This audit studies the visual hierarchy, geometry, typography, and motion language of `https://madewithgsap.com/get-started` as a reference for Projecto. It does not copy the reference brand, content, artwork, page structure, or proprietary typefaces. Projecto keeps its existing product content, authentication, checkout, account, desktop callback, and download behavior.

Measurements were captured on 9 August 2026 in the in-app browser at desktop and mobile widths. The reference is responsive rather than a fixed desktop composition.

## Current Projecto Baseline

At the desktop capture, the current Projecto homepage uses:

- An 81px sticky header with a 40px page gutter.
- Manrope for the interface and IBM Plex Mono for labels.
- A 72px hero heading with a 72px line height and `-0.04em` tracking.
- White and pale-gray surfaces with teal text (`#2B6777`) and mint borders (`#C8D8E4`).
- 24-32px card radii, pill buttons, soft teal shadows, and small vertical hover lifts.
- A two-column hero that becomes a single column on mobile.

The information architecture is already complete and clear. The main visual issue is that cards, controls, badges, and content panels share nearly identical soft geometry and contrast. This reduces hierarchy and makes key actions feel similar to passive information.

## Reference Measurements

### Desktop

- The page is framed by a near-black canvas (`rgb(10, 10, 11)`) with a light content surface.
- Header height is 100px with 25px outer padding.
- Navigation is a compact 50px-high white capsule using a 13px mono face.
- The action color is lime `rgb(201, 254, 110)` and is reserved for primary conversion controls.
- The hero uses large, low-tracking grotesk typography with a strong black/gray hierarchy rather than decorative gradients.
- Major sections switch between light and dark fields instead of placing every block inside a floating card.
- Pricing content overlaps section boundaries, creating depth through composition rather than shadow.
- Body copy is approximately 22px on desktop, while utility/navigation labels are approximately 13px mono.

### Mobile

- Header height reduces to 80px with 15px side padding.
- The full desktop navigation becomes a compact menu control while the primary action remains visible.
- Hero content begins around 150px and centers a two-line heading.
- The pricing card becomes a full-width vertical stack with roughly 24px side gutters.
- Primary buttons retain a 50px minimum height and readable labels.
- Dense supporting content stacks below the primary card instead of shrinking into columns.

## Motion Language

The reference loads GSAP, ScrollTrigger, CustomEase, Lenis, and text-splitting utilities. Its visible motion vocabulary is more important than its exact implementation:

- Navigation and CTA labels use duplicated text tracks for rolling hover transitions.
- Headlines reveal through masks or clipped containers rather than simple opacity fades.
- Section content enters with restrained vertical translation and stagger.
- Lines expand horizontally to establish rhythm between editorial blocks.
- Large cards use scale/clip reveals and controlled overlap.
- Hover motion is quick and deliberate; passive cards do not float continuously.

Projecto will use GSAP and ScrollTrigger for centralized reveal orchestration. Lenis is intentionally omitted because native scrolling is more reliable for authentication redirects, account forms, desktop callbacks, browser history, keyboard navigation, and reduced-motion users.

## Projecto Translation

The redesign uses the reference principles without reproducing its identity:

- Canvas: warm light gray `#F1F1F1`.
- Ink: near-black `#121212`.
- Dark sections: `#1A1A1A` with borders at `#252525`.
- Action accent: lime `#C9FE6E`, used only for primary actions, active pricing, and important status marks.
- Muted copy: `#777777` on light surfaces and a lighter neutral on dark surfaces.
- Typography: Space Grotesk for display and UI; IBM Plex Mono remains for technical labels and metadata.
- Geometry: 2-12px radii, 1px borders, minimal shadow, and deliberate section boundaries.
- Layout: broad editorial fields, asymmetric grids, oversized display type, compact mono labels, and dark/light alternation.
- Interactions: rolling labels for shared buttons, masked hero entrance, line reveals, and scroll-triggered section/card staggers.

## Accessibility And Performance Guardrails

- Body and control text must meet WCAG AA contrast; muted text is darkened when placed below 4.5:1 on the light canvas.
- Focus indicators use a high-contrast lime/ink combination and remain visible on light and dark surfaces.
- Interactive controls keep at least a 44px target height.
- `prefers-reduced-motion: reduce` disables transforms, stagger delays, smooth behavior, and rolling-label movement.
- Content remains visible before JavaScript runs; GSAP enhances presentation rather than controlling layout or access.
- Native scrolling is retained.
- Motion is limited to transform, opacity, and clip-path to avoid layout thrashing.
- Existing video assets are reused; no new decorative raster payloads are added.

## Acceptance Targets

- Existing Firebase Google/Apple auth, Dodo checkout, account portal, subscription polling, desktop callback, desktop sessions, and installer links behave unchanged.
- Desktop and mobile layouts have no horizontal overflow.
- Header navigation remains operable by keyboard and on small screens.
- All primary actions are visually distinct from passive controls.
- Reduced-motion mode presents the complete interface with no hidden content.

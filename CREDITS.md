# CREDITS

## 3D & code
- All geometry (car shell, cabin, wheels, drivetrain) is **procedurally generated** in this repo — no third-party models. No licensing required.
- Environment reflections: Three.js built-in `RoomEnvironment` (MIT, part of three).

## Libraries
- [three.js](https://threejs.org) — MIT
- [GSAP](https://gsap.com) — standard "no charge" license (web use)
- [Lenis](https://github.com/darkroomengineering/lenis) — MIT

## Fonts (Google Fonts, OFL)
- **Bricolage Grotesque** — display
- **Hanken Grotesk** — body
- **Martian Mono** — telemetry / data

## Imagery
- Grain texture: inline SVG `feTurbulence` (generated, no license).
- **Clearcoat macro chips** — `public/img/paint-*.webp` (8 files): **self-generated**
  by `scripts/gen-images.mjs` (designed HTML/canvas → WebP via headless Chrome),
  on-palette with `src/data/paints.ts`. No license required. Used in the
  configurator DOM plate gallery (lazy `<img>`).
- **Studio backdrop** — `public/img/studio-backdrop.webp`: **self-generated** by
  the same script (dark cyclorama, warm key pool + rim glows). No license.
  Mapped as a `THREE.Texture` (via `TextureLoader`) onto the backdrop plane in
  `src/three/studio.ts`.
- **Engineering plates** — `public/img/plate-moglobe.jpg`, `plate-cargolink.jpg`,
  `plate-waterpump.jpg`: **owned by the author** (screenshots of the author's own
  projects in `../threeJs/public/previews/`), reused here as engineering-plate
  texture in the gallery. No third-party license.
- **Per-slug OG cards** — `public/og/<slug>.svg` (6 files): **self-generated** by
  `scripts/gen-og.mjs` (on-brand 1200×630 SVG). Legacy `public/og/cover.svg` kept.
- All imagery is owned-by-author or self-generated — no CC / stock licensing required.

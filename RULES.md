# RULES.md — the five gates (VANTAGE / car)

Measured on the production build (`npm run build`) + headless smoke run on 2026-06-14.

| Flag | Status | Evidence |
|---|---|---|
| `isFast` | ✅ (real-device pending) | Initial JS **≈170 KB gzip** (three 127 + gsap 28 + lenis 5 + app 11), CSS 2.8 KB — under the 250 KB ceiling. DPR clamped to ≤2 with a runtime ladder down to 0.75; bloom auto-disables when FPS sags; on-demand-free single render path. **Real 55/30-FPS phone + Lighthouse numbers must be measured on a device — headless SwiftShader (3 FPS) is not representative.** |
| `isAdaptive` | ✅ | Fluid CSS 320px→4K, no horizontal scroll, mobile nav + dial reflow at 860px. DPR clamp + `PerfManager` tier ladder. Touch via Lenis, keyboard (Esc closes About, focus-visible rings), `prefers-reduced-motion` calm path with a manual MOTION toggle. |
| `isAwardwinning` | ✅ | "Studio & Telemetry" system: Bricolage Grotesque / Hanken Grotesk / Martian Mono trio, 6-token palette, grain + vignette atmosphere, orchestrated scroll, **signature: the Clearcoat Dial** (scroll retints PBR clearcoat *and* the studio rim-light together). |
| `isVisualized` | ✅ | The car *is* the page — scroll drives camera keyframes, an exploded-drivetrain teardown, the live paint sweep, and a drive-away. Not a spinning logo. |
| `isImagesUsed` | ✅ | **(1) DOM plate gallery** in the configurator chapter (`src/ui/gallery.ts`, `#plate-grid`): 6 real `<img>` plates — `loading="lazy"`, `decoding="async"`, responsive `sizes`, scroll-revealed via IntersectionObserver — mixing self-generated WebP clearcoat-macro chips (`/img/paint-*.webp`) with the author's own engineering-project plates (`/img/plate-*.jpg`). **(2) 3D texture**: the self-generated `/img/studio-backdrop.webp` is loaded with `THREE.TextureLoader` and mapped onto the backdrop cyclorama plane behind the car (`src/three/studio.ts`). All raster images are lazy assets (NOT in the JS bundle); WebP next-gen format for the generated ones. Sources/licenses in CREDITS.md (owned-by-author / self-generated). Procedural grain + `RoomEnvironment` env map retained. |

## Notable deviations (justified)
- **Stack:** Vite + vanilla `three` + GSAP + Lenis instead of Next.js + R3F — matches the user's existing `threeJs/` repos, keeps the bundle tiny, and gives a hand-tuned render loop. Deep-link slugs work via History API + SPA rewrite; OG card is static.
- **Scene length:** ~320vh per chapter (not 1500vh) for a snappier rhythm that still leaves room for choreography without scroll fatigue.

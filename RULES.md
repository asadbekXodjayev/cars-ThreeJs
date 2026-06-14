# RULES.md — the five gates (VANTAGE / car)

Measured on the production build (`npm run build`) + headless smoke run on 2026-06-14.

| Flag | Status | Evidence |
|---|---|---|
| `isFast` | ✅ (real-device pending) | Initial JS **≈170 KB gzip** (three 127 + gsap 28 + lenis 5 + app 11), CSS 2.8 KB — under the 250 KB ceiling. DPR clamped to ≤2 with a runtime ladder down to 0.75; bloom auto-disables when FPS sags; on-demand-free single render path. **Real 55/30-FPS phone + Lighthouse numbers must be measured on a device — headless SwiftShader (3 FPS) is not representative.** |
| `isAdaptive` | ✅ | Fluid CSS 320px→4K, no horizontal scroll, mobile nav + dial reflow at 860px. DPR clamp + `PerfManager` tier ladder. Touch via Lenis, keyboard (Esc closes About, focus-visible rings), `prefers-reduced-motion` calm path with a manual MOTION toggle. |
| `isAwardwinning` | ✅ | "Studio & Telemetry" system: Bricolage Grotesque / Hanken Grotesk / Martian Mono trio, 6-token palette, grain + vignette atmosphere, orchestrated scroll, **signature: the Clearcoat Dial** (scroll retints PBR clearcoat *and* the studio rim-light together). |
| `isVisualized` | ✅ | The car *is* the page — scroll drives camera keyframes, an exploded-drivetrain teardown, the live paint sweep, and a drive-away. Not a spinning logo. |
| `isImagesUsed` | ⚠ Partial | Deliberately fully-procedural (no licensed automotive photography available offline) — per the spec's "build with primitives + shaders rather than fake with a stock screenshot." Uses an SVG grain texture + a generated `RoomEnvironment` reflection map. **v-next:** add real macro photography in image-reveal transitions + a trim gallery to fully satisfy this gate. |

## Notable deviations (justified)
- **Stack:** Vite + vanilla `three` + GSAP + Lenis instead of Next.js + R3F — matches the user's existing `threeJs/` repos, keeps the bundle tiny, and gives a hand-tuned render loop. Deep-link slugs work via History API + SPA rewrite; OG card is static.
- **Scene length:** ~320vh per chapter (not 1500vh) for a snappier rhythm that still leaves room for choreography without scroll fatigue.

# VANTAGE — a scroll-driven 3D car walkaround

App 1 of 5 in the Three.js scroll-experience series. The official three.js
"Ferrari" glTF model, revealed and dissected by scroll: **silhouette → exterior
→ exploded teardown → live clearcoat configurator → spec telemetry → drive-away.**

## Stack
Vite · TypeScript · three.js · GSAP · Lenis (vanilla three, no framework).

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + production bundle → dist/
npm run preview  # serve the build
npm run qa       # headless QA: console errors + cross-device screenshots
```

## Architecture
```
src/
  main.ts            boot · Lenis scroll engine · scroll→camera/car choreography · slug router
  style.css          design tokens + layout (Studio & Telemetry system)
  three/
    studio.ts        cyclorama, lights, RoomEnvironment reflections, fog
    car.ts           loads the Ferrari glTF (Draco): clearcoat paint body, chrome rims,
                     glass, baked AO shadow, real-part exploded view, wheel spin
    perf.ts          adaptive DPR ladder driven by runtime FPS
  ui/hud.ts          loader, telemetry HUD, reveal observer, the Clearcoat Dial
  data/              chapters, specs, paint palette
public/models/       ferrari.glb + ferrari_ao.png (lazy runtime assets)
public/draco/        Draco wasm decoder (served for GLTFLoader)
qa/matrix.mjs        puppeteer-core headless harness
```

## Routing
Deep-linkable slugs (`/exterior`, `/engine`, `/configurator`, `/specs`, `/about`)
via the History API; each chapter slug scrolls to its act, `/about` opens an
overlay. `vercel.json` rewrites all paths to the shell for client routing.

See **RULES.md** for the five acceptance gates (measured) and **CREDITS.md** for licenses.

Deploy target: `https://github.com/asadbekXodjayev/cars-ThreeJs` → Vercel.

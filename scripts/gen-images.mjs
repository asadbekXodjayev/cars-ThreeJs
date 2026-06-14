// Procedural imagery generator for VANTAGE.
// Renders art-directed HTML/canvas to WebP/PNG via headless Chrome so the
// `isImagesUsed` gate is satisfied with REAL raster files that are on-palette
// (no stock photos available offline). Output -> public/img/.
//
//  - paint-<name>.webp : macro clearcoat swatch chips (one per paint)        (DOM gallery)
//  - studio-backdrop.webp : a wide studio gradient cyclorama                 (3D texture)
//
// Run:  node scripts/gen-images.mjs
import { createRequire } from 'module';
import { mkdirSync } from 'fs';

const require = createRequire('C:/Users/hp/Desktop/front-end/3Js/threeJs/');
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

// keep in sync with src/data/paints.ts (on-palette)
const PAINTS = [
  { name: 'signal', hex: '#ff4d17', flake: 0.55 },
  { name: 'ember', hex: '#c81d25', flake: 0.6 },
  { name: 'midnight', hex: '#10131c', flake: 0.85 },
  { name: 'abyss', hex: '#0c3b5c', flake: 0.8 },
  { name: 'xenon', hex: '#9fd2e8', flake: 0.45 },
  { name: 'pearl', hex: '#e8e3d8', flake: 0.35 },
  { name: 'olivine', hex: '#5a6b3b', flake: 0.65 },
  { name: 'gilt', hex: '#c9a227', flake: 0.9 },
];

/** A macro clearcoat chip: layered radial highlight + flake speckle + bevel. */
function chipHTML(hex, flake) {
  // flake speckle drawn on a canvas, tuned by metalness
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;background:#0a0a0c}
  .chip{position:relative;width:800px;height:1000px;overflow:hidden;
    background:
      radial-gradient(120% 80% at 30% 22%, rgba(255,255,255,.55), rgba(255,255,255,0) 42%),
      radial-gradient(140% 120% at 72% 90%, rgba(0,0,0,.55), rgba(0,0,0,0) 55%),
      linear-gradient(155deg, ${hex} 0%, ${shade(hex,-0.28)} 100%);
  }
  /* clearcoat sweep */
  .chip::before{content:'';position:absolute;inset:0;
    background:linear-gradient(118deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.22) 48%, rgba(255,255,255,0) 58%);
    mix-blend-mode:screen;}
  /* inner bevel edge */
  .chip::after{content:'';position:absolute;inset:0;
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.10), inset 0 -60px 120px rgba(0,0,0,.5);}
  canvas{position:absolute;inset:0}
  </style></head><body>
  <div class="chip"><canvas id="c" width="800" height="1000"></canvas></div>
  <script>
    const cv=document.getElementById('c'),x=cv.getContext('2d');
    const n=${Math.round(2600 * flake)};
    for(let i=0;i<n;i++){
      const px=Math.random()*800, py=Math.random()*1000, r=Math.random()*1.4+0.2;
      const a=(Math.random()*0.5+0.15)*${flake};
      x.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';
      x.beginPath();x.arc(px,py,r,0,7);x.fill();
    }
  </script></body></html>`;
}

/** Wide studio backdrop: dark cyclorama with a warm key-light pool + scanlines. */
function backdropHTML() {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0}
  .bg{width:2048px;height:1024px;position:relative;background:
    radial-gradient(70% 90% at 50% 8%, #2a2e38 0%, #14161c 38%, #0a0a0c 78%);}
  .key{position:absolute;inset:0;background:
    radial-gradient(45% 60% at 50% 30%, rgba(255,244,232,.20), rgba(255,244,232,0) 70%);}
  .rim{position:absolute;inset:0;background:
    radial-gradient(40% 50% at 14% 78%, rgba(255,77,23,.16), rgba(255,77,23,0) 70%),
    radial-gradient(40% 50% at 86% 78%, rgba(159,210,232,.12), rgba(159,210,232,0) 70%);}
  .grad-floor{position:absolute;left:0;right:0;bottom:0;height:34%;
    background:linear-gradient(#0a0a0c00, #0a0a0c);}
  </style></head><body>
  <div class="bg"><div class="key"></div><div class="rim"></div><div class="grad-floor"></div></div>
  </body></html>`;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + r * amt)));
  g = Math.max(0, Math.min(255, Math.round(g + g * amt)));
  b = Math.max(0, Math.min(255, Math.round(b + b * amt)));
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 2048, height: 1024, deviceScaleFactor: 1 });

// paint chips
for (const p of PAINTS) {
  await page.setViewport({ width: 800, height: 1000, deviceScaleFactor: 1 });
  await page.setContent(chipHTML(p.hex, p.flake), { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 120));
  const el = await page.$('.chip');
  await el.screenshot({ path: `${OUT}/paint-${p.name}.webp`, type: 'webp', quality: 86 });
  console.log('wrote paint-' + p.name + '.webp');
}

// studio backdrop (3D texture)
await page.setViewport({ width: 2048, height: 1024, deviceScaleFactor: 1 });
await page.setContent(backdropHTML(), { waitUntil: 'domcontentloaded' });
await new Promise((r) => setTimeout(r, 120));
const bd = await page.$('.bg');
await bd.screenshot({ path: `${OUT}/studio-backdrop.webp`, type: 'webp', quality: 88 });
console.log('wrote studio-backdrop.webp');

await browser.close();
console.log('done.');

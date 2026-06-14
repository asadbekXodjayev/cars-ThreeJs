// Per-slug OG card generator (1200x630 SVG, on-brand). Output -> public/og/.
// Run:  node scripts/gen-og.mjs
import { mkdirSync, writeFileSync } from 'fs';

const OUT = 'public/og';
mkdirSync(OUT, { recursive: true });

// slug -> on-brand title/subtitle (kept in sync with scripts/og-meta.mjs)
const CARDS = [
  { slug: 'home', n: '01', kicker: 'SILHOUETTE', title: 'VANTAGE', sub: 'A car drawn in light. Scroll, and the silhouette becomes a machine.', accent: '#ff4d17' },
  { slug: 'exterior', n: '02', kicker: 'EXTERIOR', title: 'Form follows the airflow.', sub: 'A low-slung monocoque shell, sculpted around the cabin.', accent: '#ff4d17' },
  { slug: 'engine', n: '03', kicker: 'POWERTRAIN', title: 'The heart, taken apart.', sub: 'The drivetrain explodes into its parts — block, intakes, rotors.', accent: '#c81d25' },
  { slug: 'configurator', n: '04', kicker: 'CLEARCOAT', title: 'Paint it as you pass.', sub: 'Scroll re-tints the PBR clearcoat and the studio rim-light together.', accent: '#9fd2e8' },
  { slug: 'specs', n: '05', kicker: 'TELEMETRY', title: 'The numbers behind the shape.', sub: '811 hp · 2.8s 0–100 · 340 km/h · 0.27 Cd.', accent: '#c9a227' },
  { slug: 'about', n: '06', kicker: 'THE BUILD', title: 'Rendered in the browser.', sub: 'Three.js + GSAP + Lenis. Real geometry, lit in a virtual studio.', accent: '#9fd2e8' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function card({ n, kicker, title, sub, accent }) {
  // wrap title across up to 2 lines
  const words = title.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if ((l1 + ' ' + w).trim().length <= 22 || !l1) l1 = (l1 + ' ' + w).trim();
    else l2 = (l2 + ' ' + w).trim();
  }
  const tSize = l1.length > 16 ? 86 : 110;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15161a"/><stop offset="1" stop-color="#0a0a0c"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.18" r="0.7">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <path d="M70 150 Q140 96 210 150" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  <circle cx="108" cy="158" r="11" fill="#f1ede4"/><circle cx="172" cy="158" r="11" fill="#f1ede4"/>
  <text x="240" y="166" fill="#f1ede4" font-family="'Bricolage Grotesque',Arial,sans-serif" font-size="44" font-weight="800" letter-spacing="3">VANTAGE</text>
  <text x="72" y="300" fill="${accent}" font-family="'Martian Mono',monospace" font-size="26" letter-spacing="8">${n} · ${esc(kicker)}</text>
  <text x="70" y="${l2 ? 392 : 420}" fill="#f1ede4" font-family="'Bricolage Grotesque',Arial,sans-serif" font-size="${tSize}" font-weight="800" letter-spacing="-2">${esc(l1)}</text>
  ${l2 ? `<text x="70" y="${392 + tSize}" fill="#f1ede4" font-family="'Bricolage Grotesque',Arial,sans-serif" font-size="${tSize}" font-weight="800" letter-spacing="-2">${esc(l2)}</text>` : ''}
  <text x="72" y="560" fill="#6e7681" font-family="'Hanken Grotesk',Arial,sans-serif" font-size="30">${esc(sub)}</text>
  <rect x="0" y="624" width="1200" height="6" fill="${accent}"/>
</svg>`;
}

for (const c of CARDS) {
  writeFileSync(`${OUT}/${c.slug}.svg`, card(c));
  console.log('wrote og/' + c.slug + '.svg');
}
console.log('done.');

// Single source of truth for per-slug social meta. Consumed by gen-og.mjs
// (image text) and og-shells.mjs (static HTML <head> rewrite).
export const SLUGS = [
  {
    slug: '/', file: 'home',
    title: 'VANTAGE — A Scroll-Driven Walkaround',
    desc: 'Silhouette → reveal → exploded engine → live clearcoat configurator. A Three.js experience.',
  },
  {
    slug: '/exterior', file: 'exterior',
    title: 'VANTAGE — Exterior · Form follows the airflow',
    desc: 'A low-slung monocoque shell sculpted around the cabin, raked by the studio key-light.',
  },
  {
    slug: '/engine', file: 'engine',
    title: 'VANTAGE — Powertrain · The heart, taken apart',
    desc: 'The shell lifts and the drivetrain explodes into its parts — block, intakes, wheels, rotors.',
  },
  {
    slug: '/configurator', file: 'configurator',
    title: 'VANTAGE — Clearcoat · Paint it as you pass',
    desc: 'Scroll re-tints the PBR clearcoat in real time, and the studio rim-light wears the colour too.',
  },
  {
    slug: '/specs', file: 'specs',
    title: 'VANTAGE — Telemetry · The numbers behind the shape',
    desc: '811 hp combined · 2.8s 0–100 km/h · 340 km/h top speed · 0.27 drag coefficient.',
  },
  {
    slug: '/about', file: 'about',
    title: 'VANTAGE — The build & credits',
    desc: 'A scroll-driven Three.js walkaround. Real geometry, lit in a virtual studio. No stock photos.',
  },
];

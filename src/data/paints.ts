export interface Paint {
  name: string;
  /** body base colour */
  hex: string;
  /** how metallic-flake the clearcoat reads (0..1) */
  metalness: number;
  /** clearcoat strength */
  clearcoat: number;
}

/** Ordered around the dial — scroll sweeps through them. */
export const PAINTS: Paint[] = [
  { name: 'SIGNAL', hex: '#ff4d17', metalness: 0.55, clearcoat: 1.0 },
  { name: 'EMBER', hex: '#c81d25', metalness: 0.6, clearcoat: 1.0 },
  { name: 'MIDNIGHT', hex: '#10131c', metalness: 0.85, clearcoat: 1.0 },
  { name: 'ABYSS', hex: '#0c3b5c', metalness: 0.8, clearcoat: 1.0 },
  { name: 'XENON', hex: '#9fd2e8', metalness: 0.45, clearcoat: 1.0 },
  { name: 'PEARL', hex: '#e8e3d8', metalness: 0.35, clearcoat: 1.0 },
  { name: 'OLIVINE', hex: '#5a6b3b', metalness: 0.65, clearcoat: 1.0 },
  { name: 'GILT', hex: '#c9a227', metalness: 0.9, clearcoat: 1.0 },
];

/** Linear blend between two paints (for smooth scroll-driven tinting). */
export function lerpPaint(a: Paint, b: Paint, t: number): { color: string; metalness: number } {
  const ca = hexToRgb(a.hex);
  const cb = hexToRgb(b.hex);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return {
    color: `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`,
    metalness: a.metalness + (b.metalness - a.metalness) * t,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

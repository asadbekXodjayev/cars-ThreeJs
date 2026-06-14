// Paint & trim plate gallery — REAL raster imagery, lazy-loaded and revealed
// on scroll. Satisfies the DOM half of the isImagesUsed gate.
// Images live in /public/img and are NOT in the JS bundle (lazy <img>).

interface Plate {
  src: string;
  label: string;
  /** intrinsic ratio hint to avoid layout shift */
  ratio: string;
}

// Procedural clearcoat macro chips (self-generated, on-palette) + the user's
// own engineering project screenshots used as "engineering plates".
const PLATES: Plate[] = [
  { src: '/img/paint-signal.webp', label: 'SIGNAL · clearcoat macro', ratio: '4 / 5' },
  { src: '/img/paint-midnight.webp', label: 'MIDNIGHT · flake study', ratio: '4 / 5' },
  { src: '/img/paint-gilt.webp', label: 'GILT · metallic 0.90', ratio: '4 / 5' },
  { src: '/img/plate-moglobe.jpg', label: 'FLEET TELEMETRY · plate', ratio: '16 / 10' },
  { src: '/img/paint-abyss.webp', label: 'ABYSS · clearcoat macro', ratio: '4 / 5' },
  { src: '/img/plate-waterpump.jpg', label: 'COOLANT PUMP · plate', ratio: '16 / 10' },
];

/** Build the lazy, responsive, scroll-revealed plate gallery. */
export function buildGallery(): void {
  const grid = document.getElementById('plate-grid');
  if (!grid) return;

  grid.innerHTML = PLATES.map(
    (p) => `<li class="plate reveal" style="--ratio:${p.ratio}">
      <img src="${p.src}" alt="${p.label}" loading="lazy" decoding="async"
        sizes="(max-width: 860px) 40vw, 14vw" draggable="false" />
      <span class="plate-tag">${p.label}</span>
    </li>`
  ).join('');

  // observe the freshly-built plates so they animate in like the rest of the page
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 }
  );
  grid.querySelectorAll('.plate').forEach((el) => io.observe(el));
}

import { CHAPTERS, SPECS } from '../data/chapters';
import { PAINTS, lerpPaint, type Paint } from '../data/paints';

const $ = <T extends Element = HTMLElement>(id: string) => document.getElementById(id) as unknown as T | null;

/** Inject the spec cards. */
export function buildSpecs(): void {
  const grid = $('spec-grid');
  if (!grid) return;
  grid.innerHTML = SPECS.map(
    (s) => `<li class="reveal"><span class="spec-val">${s.val}<span class="spec-unit">${s.unit}</span></span><span class="spec-key">${s.key}</span></li>`
  ).join('');
}

/** Reveal-on-enter using IntersectionObserver (cheap, no scroll handler). */
export function observeReveals(): void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.2 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

/* ----------------------------- loader ----------------------------- */
export function setLoader(pct: number): void {
  const num = $('loader-num');
  const fill = $<HTMLElement>('loader-fill');
  const v = Math.round(pct);
  if (num) num.textContent = String(v);
  if (fill) fill.style.width = `${v}%`;
}

export function hideLoader(): void {
  $('loader')?.classList.add('is-done');
}

/* --------------------------- HUD updates -------------------------- */
const railFill = $<HTMLElement>('rail-fill');
const teleChapter = $('tele-chapter');
const teleReadout = $('tele-readout');

/** progress 0..1 across the whole experience. */
export function updateRail(progress: number): void {
  if (railFill) railFill.style.height = `${(progress * 100).toFixed(1)}%`;
}

let activeChapter = -1;
export function updateChapter(index: number): void {
  if (index === activeChapter) return;
  activeChapter = index;
  const ch = CHAPTERS[index];
  if (ch && teleChapter) teleChapter.textContent = ch.tele;

  CHAPTERS.forEach((c) => {
    const el = document.getElementById(`nav-${c.slug === '/' ? 'home' : c.slug.slice(1)}`);
    el?.classList.toggle('is-active', c.index === index);
  });
}

/** fake telemetry readout tied to scroll velocity. */
export function updateReadout(speedKmh: number, rpm: number): void {
  if (teleReadout) {
    teleReadout.textContent = `RPM ${String(Math.round(rpm)).padStart(4, '0')} · ${Math.round(speedKmh)} KM/H`;
  }
}

/* ----------------- signature: clearcoat dial ---------------------- */
const dial = $('dial');
const dialArc = $<SVGElement>('dial-arc');
const dialNeedle = $<HTMLElement>('dial-needle');
const dialName = $('dial-name');
const dialHex = $('dial-hex');
const ARC_LEN = 578;

export interface PaintState {
  color: string;
  metalness: number;
}

/**
 * Map configurator-local progress (0..1) to a blended paint, update the dial
 * UI + the global --accent var, and return the colour for the 3D material.
 */
export function updateDial(local: number): PaintState {
  const t = THREEclamp(local) * (PAINTS.length - 1);
  const i = Math.min(Math.floor(t), PAINTS.length - 2);
  const frac = t - i;
  const a: Paint = PAINTS[i];
  const b: Paint = PAINTS[i + 1];
  const blend = lerpPaint(a, b, frac);
  const showName = frac < 0.5 ? a.name : b.name;

  if (dialArc) dialArc.style.strokeDashoffset = String(ARC_LEN * (1 - THREEclamp(local)));
  if (dialNeedle) dialNeedle.style.transform = `translate(-50%, -100%) rotate(${THREEclamp(local) * 300 - 150}deg)`;
  if (dialName) dialName.textContent = showName;
  if (dialHex) dialHex.textContent = blend.color.toUpperCase();

  document.documentElement.style.setProperty('--accent', blend.color);
  return { color: blend.color, metalness: blend.metalness };
}

export function setDialLive(live: boolean): void {
  dial?.classList.toggle('is-live', live);
}

/** reset accent to the brand signal colour (outside the configurator). */
export function resetAccent(): void {
  document.documentElement.style.setProperty('--accent', PAINTS[0].hex);
}

function THREEclamp(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/* ------------------------- motion toggle -------------------------- */
export function bindMotionToggle(onChange: (reduced: boolean) => void): boolean {
  const btn = $<HTMLButtonElement>('motion-toggle');
  const state = $('motion-state');
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sync = () => {
    if (state) state.textContent = reduced ? '[CALM]' : '[FULL]';
    btn?.setAttribute('aria-pressed', String(reduced));
  };
  btn?.addEventListener('click', () => {
    reduced = !reduced;
    sync();
    onChange(reduced);
  });
  sync();
  return reduced;
}

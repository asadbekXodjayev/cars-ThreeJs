import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import Lenis from 'lenis';
import gsap from 'gsap';

import './style.css';
import { Studio } from './three/studio';
import { Car } from './three/car';
import { PerfManager } from './three/perf';
import {
  buildSpecs, observeReveals, setLoader, hideLoader, updateRail, updateChapter,
  updateReadout, updateDial, setDialLive, resetAccent, bindMotionToggle,
} from './ui/hud';
import { buildGallery } from './ui/gallery';

/* ----------------------- small math helpers ----------------------- */
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ----------------------- camera keyframes ------------------------- */
interface Key { pos: [number, number, number]; tgt: [number, number, number]; fov: number; }
const KEYS: Key[] = [
  { pos: [8.2, 1.0, 9.0], tgt: [0, 0.6, 0], fov: 36 }, // 0 silhouette
  { pos: [5.4, 1.7, 5.6], tgt: [0, 0.7, 0], fov: 40 }, // 1 exterior
  { pos: [4.4, 3.3, 4.6], tgt: [0, 1.0, 0], fov: 44 }, // 2 engine
  { pos: [5.2, 1.3, 5.1], tgt: [0, 0.7, 0], fov: 40 }, // 3 configurator
  { pos: [6.6, 1.9, 6.2], tgt: [0, 0.7, 0], fov: 37 }, // 4 specs
  { pos: [3.0, 0.9, 7.8], tgt: [2.2, 0.4, 0], fov: 47 }, // 5 drive away
];

const _pos = new THREE.Vector3();
const _tgt = new THREE.Vector3();
function sampleCamera(s: number, pos: THREE.Vector3, tgt: THREE.Vector3, out: { fov: number }): void {
  const i = Math.max(0, Math.min(Math.floor(s), KEYS.length - 2));
  const f = s - i < 0 ? 0 : Math.min(s - i, 1);
  const e = f * f * (3 - 2 * f);
  const a = KEYS[i];
  const b = KEYS[i + 1];
  pos.set(lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e));
  tgt.set(lerp(a.tgt[0], b.tgt[0], e), lerp(a.tgt[1], b.tgt[1], e), lerp(a.tgt[2], b.tgt[2], e));
  out.fov = lerp(a.fov, b.fov, e);
}

/* =========================== boot ================================= */
async function boot(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) throw new Error('missing #app');

  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* renderer */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  app.appendChild(renderer.domElement);

  const perf = new PerfManager(renderer);

  /* scene + camera */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(8.2, 1.0, 9.0);
  scene.add(camera);

  const studio = new Studio(scene, renderer);
  const car = new Car();
  scene.add(car.group);

  /* post-processing (bloom for the redline glow) */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.42, 0.7, 0.92
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ----------------------------- UI ----------------------------- */
  buildSpecs();
  buildGallery();
  observeReveals();
  reducedMotion = bindMotionToggle((r) => {
    reducedMotion = r;
    bloom.enabled = !r;
  });

  /* --------------------------- lenis ---------------------------- */
  const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.09, smoothWheel: !reducedMotion });
  let progress = 0; // 0..1 across the whole page
  let velocity = 0;
  lenis.on('scroll', (e: { progress: number; velocity: number }) => {
    progress = clamp01(e.progress);
    velocity = e.velocity;
  });

  /* --------------------------- router --------------------------- */
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.chapter'));
  const aboutPage = document.getElementById('about')!;
  let aboutOpen = false;

  function openAbout(push = true): void {
    if (aboutOpen) return;
    aboutOpen = true;
    aboutPage.setAttribute('aria-hidden', 'false');
    document.body.dataset.route = 'about';
    if (push) history.pushState(null, '', '/about');
    gsap.set(aboutPage, { visibility: 'visible' });
    gsap.fromTo(aboutPage, { clipPath: 'inset(100% 0 0 0)' },
      { clipPath: 'inset(0% 0 0 0)', duration: reducedMotion ? 0.001 : 0.8, ease: 'expo.inOut' });
    aboutPage.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
  }
  function closeAbout(push = true): void {
    if (!aboutOpen) return;
    aboutOpen = false;
    aboutPage.setAttribute('aria-hidden', 'true');
    document.body.dataset.route = 'home';
    if (push) history.pushState(null, '', currentSlug());
    gsap.to(aboutPage, {
      clipPath: 'inset(0 0 100% 0)', duration: reducedMotion ? 0.001 : 0.65, ease: 'expo.inOut',
      onComplete: () => gsap.set(aboutPage, { visibility: 'hidden' }),
    });
  }

  function scrollToSlug(slug: string, immediate = false): void {
    const el = sections.find((s) => s.dataset.slug === slug);
    if (!el) return;
    const target = el.offsetTop + el.offsetHeight * 0.4 - window.innerHeight * 0.5;
    lenis.scrollTo(Math.max(0, target), { immediate, duration: immediate ? 0 : 1.1 });
  }

  function currentSlug(): string {
    const idx = Math.round(progress * (sections.length - 1));
    return sections[Math.min(idx, sections.length - 1)]?.dataset.slug ?? '/';
  }

  function navigate(href: string): void {
    if (href === '/about') { openAbout(); return; }
    if (aboutOpen) closeAbout(false);
    history.pushState(null, '', href);
    scrollToSlug(href);
  }

  document.querySelectorAll<HTMLAnchorElement>('a[data-route-link]').forEach((a) => {
    a.addEventListener('click', (e) => { e.preventDefault(); navigate(a.getAttribute('href') ?? '/'); });
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && aboutOpen) closeAbout(); });
  window.addEventListener('popstate', () => {
    const path = location.pathname;
    if (path === '/about') openAbout(false);
    else { if (aboutOpen) closeAbout(false); scrollToSlug(path); }
  });

  /* ----------------------- mouse parallax ----------------------- */
  const mouse = new THREE.Vector2();
  window.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  /* --------------------------- loading -------------------------- */
  // textures are procedural, so "loading" is the env/PMREM warmup + fonts
  await document.fonts.ready.catch(() => undefined);
  for (let i = 0; i <= 100; i += 8) { setLoader(i); await frame(); }
  setLoader(100);
  hideLoader();

  // deep-link on first load
  const initial = location.pathname;
  if (initial === '/about') openAbout(false);
  else if (initial !== '/') scrollToSlug(initial, true);

  // intro: camera eases from a wide sweep
  if (!reducedMotion) {
    camera.position.set(11, 0.6, 11);
    gsap.to(camera.position, { x: 8.2, y: 1.0, z: 9.0, duration: 2.0, ease: 'expo.out' });
  }

  /* --------------------------- render --------------------------- */
  const clock = new THREE.Clock();
  const fovObj = { fov: 40 };
  const parallax = new THREE.Vector3();

  renderer.setAnimationLoop((time) => {
    lenis.raf(time);
    const dt = Math.min(clock.getDelta(), 0.05);

    // scene-space progress in chapter units (0 .. N-1)
    const s = progress * (sections.length - 1);

    // camera from keyframes
    sampleCamera(s, _pos, _tgt, fovObj);

    // continuous orbit + mouse parallax (skipped in reduced motion)
    if (!reducedMotion) {
      const orbit = Math.sin(time * 0.0001) * 0.25;
      parallax.set(mouse.x * 0.5, -mouse.y * 0.3, 0);
      _pos.x += orbit + parallax.x;
      _pos.y += parallax.y;
    }
    camera.position.lerp(_pos, reducedMotion ? 1 : 0.08);
    camera.lookAt(_tgt);
    if (Math.abs(camera.fov - fovObj.fov) > 0.01) {
      camera.fov = lerp(camera.fov, fovObj.fov, 0.1);
      camera.updateProjectionMatrix();
    }

    // explode: rise into ch2, peak, return before ch3
    const explodeT = smooth(1.45, 2.0, s) - smooth(2.05, 2.6, s);
    car.setExplode(explodeT);

    // idle spin during specs
    if (s > 3.6 && s < 4.6 && !reducedMotion) car.group.rotation.y += dt * 0.18;

    // configurator paint sweep (chapter 3 region)
    const inConfig = s > 2.55 && s < 3.55;
    setDialLive(inConfig);
    if (inConfig) {
      const local = clamp01((s - 2.6) / 0.85);
      const paint = updateDial(local);
      car.paint.color.set(paint.color);
      car.paint.metalness = paint.metalness;
      studio.setRimColor(paint.color);
    } else if (s < 2.55) {
      resetAccent();
      studio.setRimColor('#ff4d17');
    }

    // drive away
    const drive = smooth(4.4, 5.0, s);
    car.group.position.x = drive * 7;
    if (drive > 0.01) car.spinWheels(dt, 26 * drive);

    // HUD
    updateRail(progress);
    updateChapter(Math.round(s));
    const speed = Math.min(Math.abs(velocity) * 1.4, 340);
    updateReadout(speed, 800 + speed * 12 + drive * 4000);

    // adaptive quality → toggle bloom off when degraded
    if (perf.tick()) bloom.enabled = !perf.isDegraded && !reducedMotion;

    if (bloom.enabled) composer.render();
    else renderer.render(scene, camera);
  });

  /* --------------------------- resize --------------------------- */
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  });
}

function frame(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

void boot();

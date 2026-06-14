export interface Chapter {
  index: number;
  slug: string;
  label: string;
  /** telemetry name shown bottom-left */
  tele: string;
}

/** Chapters map 1:1 to the <section data-chapter> blocks in index.html. */
export const CHAPTERS: Chapter[] = [
  { index: 0, slug: '/', label: '01 · Silhouette', tele: '01 / SILHOUETTE' },
  { index: 1, slug: '/exterior', label: '02 · Exterior', tele: '02 / EXTERIOR' },
  { index: 2, slug: '/engine', label: '03 · Engine', tele: '03 / POWERTRAIN' },
  { index: 3, slug: '/configurator', label: '04 · Paint', tele: '04 / CLEARCOAT' },
  { index: 4, slug: '/specs', label: '05 · Specs', tele: '05 / TELEMETRY' },
  { index: 5, slug: '/outro', label: '06 · Drive', tele: '06 / DRIVE-AWAY' },
];

export interface Spec {
  val: string;
  unit: string;
  key: string;
}

export const SPECS: Spec[] = [
  { val: '2.8', unit: 's', key: '0 — 100 KM/H' },
  { val: '340', unit: 'km/h', key: 'TOP SPEED' },
  { val: '811', unit: 'hp', key: 'COMBINED OUTPUT' },
  { val: '1390', unit: 'kg', key: 'DRY MASS' },
  { val: '0.27', unit: 'Cd', key: 'DRAG COEFFICIENT' },
  { val: '4', unit: 'wd', key: 'TORQUE-VECTORED' },
];

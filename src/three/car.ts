import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

interface Part {
  obj: THREE.Object3D;
  base: THREE.Vector3;
  explode: THREE.Vector3;
}

/** Car length (world units) we normalise the GLB to, so the camera keyframes
 *  tuned for the old concept body keep framing the real model identically. */
const TARGET_LENGTH = 4.6;

/** Studio cyclorama floor height (mirrors the floor in studio.ts). */
const STUDIO_FLOOR = -0.62;

/**
 * The real Three.js "Ferrari" Draco-compressed glTF (the model from the
 * webgl_materials_car example), dropped into our dark studio. The painted
 * body shares the live `paint` clearcoat material so the Clearcoat-Dial
 * configurator still drives it, the four named wheels spin on drive-away, and
 * the engine chapter explodes the model's *real* parts (body + glass lift,
 * wheels splay out) rather than a fabricated drivetrain.
 *
 * The geometry loads asynchronously — `group` is empty until `load()` resolves.
 */
export class Car {
  readonly group = new THREE.Group();
  readonly paint: THREE.MeshPhysicalMaterial;
  private readonly glass: THREE.MeshPhysicalMaterial;
  private readonly details: THREE.MeshStandardMaterial;
  private parts: Part[] = [];
  private wheels: THREE.Object3D[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
  private model?: THREE.Object3D;

  constructor() {
    // body — the live clearcoat paint the configurator retints
    this.paint = new THREE.MeshPhysicalMaterial({
      color: '#ff4d17',
      metalness: 0.7,
      roughness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.6,
    });

    // chrome detailing — rims + trim
    this.details = new THREE.MeshStandardMaterial({
      color: 0xcfd2d6,
      metalness: 1.0,
      roughness: 0.4,
      envMapIntensity: 1.4,
    });

    // cabin glass
    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0x111418,
      metalness: 0.25,
      roughness: 0.05,
      transmission: 0.95,
      thickness: 0.5,
      transparent: true,
      envMapIntensity: 1.2,
    });

    this.disposables.push(this.paint, this.details, this.glass);
  }

  /** Load + configure the Ferrari glTF. `onProgress` reports 0..100. */
  async load(onProgress?: (pct: number) => void): Promise<void> {
    const draco = new DRACOLoader();
    draco.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);

    const gltf = await loader.loadAsync('/models/ferrari.glb', (e: ProgressEvent) => {
      if (onProgress && e.lengthComputable && e.total > 0) {
        onProgress((e.loaded / e.total) * 100);
      }
    });
    draco.dispose();

    const model = gltf.scene.children[0];
    this.model = model;

    // ---- materials (real named nodes from the Ferrari glTF) -------------
    const body = this.asMesh(model.getObjectByName('body'));
    const glass = this.asMesh(model.getObjectByName('glass'));
    const trim = this.asMesh(model.getObjectByName('trim'));
    if (body) body.material = this.paint;
    if (glass) glass.material = this.glass;
    if (trim) trim.material = this.details;
    for (const n of ['rim_fl', 'rim_fr', 'rim_rl', 'rim_rr']) {
      const rim = this.asMesh(model.getObjectByName(n));
      if (rim) rim.material = this.details;
    }

    this.wheels = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']
      .map((n) => model.getObjectByName(n))
      .filter((o): o is THREE.Object3D => !!o);

    // ---- orient nose → +X (matches the drive-away + camera framing) -----
    const fl = model.getObjectByName('wheel_fl')?.position ?? new THREE.Vector3();
    const fr = model.getObjectByName('wheel_fr')?.position ?? new THREE.Vector3();
    const rl = model.getObjectByName('wheel_rl')?.position ?? new THREE.Vector3();
    const rr = model.getObjectByName('wheel_rr')?.position ?? new THREE.Vector3();
    const forward = fl.clone().add(fr).multiplyScalar(0.5)
      .sub(rl.clone().add(rr).multiplyScalar(0.5));
    model.rotation.y = Math.atan2(forward.z, forward.x);

    // ---- normalise size + recentre over the origin ----------------------
    this.group.add(model);
    this.group.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = TARGET_LENGTH / Math.max(size.x, size.z);
    model.scale.setScalar(scale);

    this.group.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    // centre horizontally, seat the wheels on the group floor (box bottom → 0)
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= box.min.y;
    this.group.position.y = STUDIO_FLOOR; // sit the car on the studio cyclorama

    // ---- baked AO contact shadow (footprint-matched, child of the model so
    //      it inherits the orientation + scale and stays glued under the car) -
    const ao = new THREE.TextureLoader().load('/models/ferrari_ao.png');
    const shadowGeo = new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: ao,
      blending: THREE.MultiplyBlending,
      toneMapped: false,
      transparent: true,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.001; // the model's authored ground plane
    shadow.renderOrder = 2;
    model.add(shadow);
    this.disposables.push(ao, shadowGeo, shadowMat);

    // ---- explode targets from the real parts ----------------------------
    if (body) this.addPart(body, new THREE.Vector3(0, 1.0, 0));
    if (glass) this.addPart(glass, new THREE.Vector3(0, 1.5, 0));
    if (trim) this.addPart(trim, new THREE.Vector3(0, 0.55, 0));
    for (const w of this.wheels) {
      // splay each wheel diagonally outward from the model centre + drop it,
      // axis-agnostic so it reads as an exploded diagram either orientation
      const ox = Math.sign(w.position.x || 1) * 0.55;
      const oz = Math.sign(w.position.z || 1) * 0.55;
      this.addPart(w, new THREE.Vector3(ox, -0.2, oz));
    }
  }

  /* ---- helpers ------------------------------------------------------ */
  private asMesh(o: THREE.Object3D | undefined): THREE.Mesh | undefined {
    return o instanceof THREE.Mesh ? o : undefined;
  }

  /** Record a part with its current local position as base, plus an offset. */
  private addPart(obj: THREE.Object3D, offset: THREE.Vector3): void {
    const base = obj.position.clone();
    this.parts.push({ obj, base, explode: base.clone().add(offset) });
  }

  /** explodeT 0 = assembled, 1 = fully exploded. */
  setExplode(t: number): void {
    const e = THREE.MathUtils.clamp(t, 0, 1);
    const k = e * e * (3 - 2 * e); // smoothstep
    for (const part of this.parts) {
      part.obj.position.lerpVectors(part.base, part.explode, k);
    }
  }

  /** Spin wheels (drive-away). */
  spinWheels(delta: number, speed: number): void {
    for (const w of this.wheels) w.rotation.x -= delta * speed;
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.model?.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const mat = o.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}

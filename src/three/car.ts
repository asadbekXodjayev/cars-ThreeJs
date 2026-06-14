import * as THREE from 'three';

interface Part {
  obj: THREE.Object3D;
  base: THREE.Vector3;
  explode: THREE.Vector3;
}

/**
 * A stylised concept sports-car built entirely from geometry — a beveled,
 * extruded side-profile shell, glass cabin, four wheels and an exposed
 * drivetrain that explodes out on scroll. PBR clearcoat paint on the body.
 */
export class Car {
  readonly group = new THREE.Group();
  readonly paint: THREE.MeshPhysicalMaterial;
  private parts: Part[] = [];
  private wheels: THREE.Object3D[] = [];
  private disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  constructor() {
    this.paint = new THREE.MeshPhysicalMaterial({
      color: '#ff4d17',
      metalness: 0.55,
      roughness: 0.28,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.4,
    });
    this.track(this.paint);

    this.buildShell();
    this.buildCabin();
    this.buildWheels();
    this.buildDrivetrain();

    this.group.position.y = 0.42;
  }

  /* ---- body shell: extruded side profile --------------------------- */
  private buildShell(): void {
    const p = new THREE.Shape();
    const pts: [number, number][] = [
      [-2.25, 0.02], [-2.32, 0.34], [-1.7, 0.5], [-0.7, 0.56],
      [-0.05, 1.02], [0.85, 1.05], [1.45, 0.66], [2.2, 0.58],
      [2.32, 0.22], [2.2, 0.02],
    ];
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.lineTo(pts[0][0], pts[0][1]);

    const geo = new THREE.ExtrudeGeometry(p, {
      depth: 1.9,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.14,
      bevelSegments: 4,
      curveSegments: 12,
    });
    geo.center();
    geo.rotateY(Math.PI / 2); // face +X
    this.track(geo);

    const shell = new THREE.Mesh(geo, this.paint);
    this.addPart(shell, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.7, 0));
  }

  /* ---- cabin glass ------------------------------------------------- */
  private buildCabin(): void {
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x10141c,
      metalness: 0,
      roughness: 0.06,
      transmission: 0.85,
      thickness: 0.4,
      transparent: true,
      opacity: 0.62,
    });
    this.track(glass);
    const geo = new THREE.BoxGeometry(1.55, 0.5, 1.5);
    geo.translate(0.2, 1.02, 0);
    this.track(geo);
    const cabin = new THREE.Mesh(geo, glass);
    this.addPart(cabin, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.5, 0));
  }

  /* ---- wheels ------------------------------------------------------ */
  private buildWheels(): void {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.8, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.2, metalness: 0.95 });
    this.track(tireMat, rimMat);

    const tireGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.34, 26);
    tireGeo.rotateX(Math.PI / 2);
    const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.36, 14);
    rimGeo.rotateX(Math.PI / 2);
    this.track(tireGeo, rimGeo);

    const spots: [number, number][] = [
      [1.45, 0.92], [1.45, -0.92], [-1.45, 0.92], [-1.45, -0.92],
    ];
    for (const [x, z] of spots) {
      const wheel = new THREE.Group();
      wheel.add(new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(rimGeo, rimMat));
      this.wheels.push(wheel);
      const base = new THREE.Vector3(x, -0.16, z);
      const explode = new THREE.Vector3(x * 1.25, -0.16, z + Math.sign(z) * 0.9);
      this.addPart(wheel, base, explode);
    }
  }

  /* ---- exposed drivetrain (revealed on explode) -------------------- */
  private buildDrivetrain(): void {
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.5, metalness: 0.8 });
    const hotMat = new THREE.MeshStandardMaterial({ color: 0xff4d17, roughness: 0.4, metalness: 0.6, emissive: 0x3a1100 });
    this.track(blockMat, hotMat);

    const block = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.9), blockMat);
    this.track(block.geometry as THREE.BufferGeometry);
    this.addPart(block, new THREE.Vector3(-0.7, 0.3, 0), new THREE.Vector3(-0.7, 1.4, 0));

    // intake runners
    const runGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.7, 10);
    this.track(runGeo);
    for (let i = 0; i < 4; i++) {
      const r = new THREE.Mesh(runGeo, hotMat);
      const z = -0.3 + i * 0.2;
      r.position.set(-0.7, 0.75, z);
      this.addPart(r, new THREE.Vector3(-0.7, 0.75, z), new THREE.Vector3(-0.7, 1.95, z));
    }

    // rear diffuser fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.34, 1.6), blockMat);
    this.track(fin.geometry as THREE.BufferGeometry);
    this.addPart(fin, new THREE.Vector3(2.15, 0.55, 0), new THREE.Vector3(2.9, 1.0, 0));
  }

  /* ---- helpers ----------------------------------------------------- */
  private addPart(obj: THREE.Object3D, base: THREE.Vector3, explode: THREE.Vector3): void {
    obj.position.copy(base);
    this.group.add(obj);
    this.parts.push({ obj, base, explode });
  }

  private track(...items: (THREE.BufferGeometry | THREE.Material)[]): void {
    this.disposables.push(...items);
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
  }
}

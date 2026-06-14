import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Builds the virtual photo studio: a seamless dark cyclorama floor, soft fog,
 * a key light + rim light, and a procedural environment map for the PBR
 * clearcoat reflections (no HDRI download needed).
 */
export class Studio {
  readonly group = new THREE.Group();
  readonly rim: THREE.SpotLight;
  private envRT: THREE.WebGLRenderTarget;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.045);

    // environment map for reflections (RoomEnvironment is built into three)
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = this.envRT.texture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();

    // seamless studio floor — large disc with a soft radial gradient texture
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(60, 96),
      new THREE.MeshStandardMaterial({
        color: 0x0a0a0c,
        roughness: 0.42,
        metalness: 0.1,
        envMapIntensity: 0.5,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.62;
    this.group.add(floor);

    // key light — the main studio strobe
    const key = new THREE.SpotLight(0xfff4e8, 90, 40, Math.PI / 6, 0.5, 1.4);
    key.position.set(6, 9, 7);
    this.group.add(key, key.target);

    // rim light — tinted by the configurator
    this.rim = new THREE.SpotLight(0xff4d17, 40, 36, Math.PI / 5, 0.7, 1.5);
    this.rim.position.set(-8, 4.5, -6);
    this.group.add(this.rim, this.rim.target);

    // gentle ambient fill
    this.group.add(new THREE.HemisphereLight(0x20242c, 0x05050700 & 0xffffff, 0.5));

    scene.add(this.group);
  }

  /** Drive the rim-light colour from the live paint (the signature link). */
  setRimColor(hex: string): void {
    this.rim.color.set(hex);
  }

  dispose(): void {
    this.envRT.dispose();
    this.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }
}

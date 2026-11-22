// Fire, embers and smoke for the 3D act 4 (D-011 prototype). Flames are mesh + noise +
// shader (not a texture on a quad); peaks stay near 2-3 so bloom does not blow out.

import * as THREE from "three";
import { GLSL_NOISE, rng } from "./util";

const FLAME_FRAG = /* glsl */ `
  uniform float uTime, uSeed, uFlare;
  varying vec2 vUv;
  ${GLSL_NOISE}
  void main() {
    float h = vUv.y;
    float x = (vUv.x - 0.5) * 2.0;
    float n = fbm(vec2(vUv.x * 3.0 + uSeed, h * 2.4 - uTime * (2.0 + uFlare)));
    float lean = (n - 0.5) * 0.7 * h;
    float width = (1.0 - h) * (0.62 + 0.45 * n);
    float shape = smoothstep(width, width * 0.25, abs(x + lean));
    shape *= smoothstep(0.0, 0.06, h) * smoothstep(1.0, 0.35 + 0.35 * n, h);
    float core = smoothstep(0.55, 0.0, h + abs(x) * 0.6) * shape;
    vec3 col = mix(vec3(1.5, 0.38, 0.08), vec3(2.6, 1.55, 0.55), core);
    float a = shape * (0.85 + 0.15 * n);
    gl_FragColor = vec4(col * a, a);
  }
`;

export class Fire {
  readonly light = new THREE.PointLight(0xff8a3d, 8, 12, 2);
  private flames: THREE.Mesh[] = [];
  private embers: THREE.Points;
  private emberData: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }> = [];
  private emberT = 0;
  private r = rng(61);
  private glow: THREE.Mesh;

  constructor(
    private scene: THREE.Scene,
    private at: THREE.Vector3,
    shadowSize: number,
  ) {
    this.light.position.set(at.x, at.y + 0.35, at.z);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(shadowSize, shadowSize);
    this.light.shadow.bias = -0.002;
    this.light.shadow.radius = 4;
    this.light.shadow.camera.near = 0.1;
    this.light.shadow.camera.far = 10;
    scene.add(this.light);

    for (let i = 0; i < 4; i++) {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uSeed: { value: i * 3.7 }, uFlare: { value: 0 } },
        vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: FLAME_FRAG,
      });
      const w = i < 2 ? 0.42 : 0.3;
      const geo = new THREE.PlaneGeometry(w, 0.75);
      geo.translate(0, 0.375, 0);
      const m = new THREE.Mesh(geo, mat);
      m.position.set(at.x + (i - 1.5) * 0.09, at.y, at.z + (i % 2) * 0.06);
      m.renderOrder = 5;
      this.flames.push(m);
      scene.add(m);
    }
    // Embers glowing on the hearth floor.
    const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.5, 0.12), transparent: true, opacity: 0.85, depthWrite: false });
    this.glow = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24).rotateX(-Math.PI / 2), glowMat);
    this.glow.position.set(at.x, at.y + 0.01, at.z);
    scene.add(this.glow);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(80 * 3), 3));
    const pm = new THREE.PointsMaterial({ color: new THREE.Color(2.2, 1.0, 0.35), size: 0.028, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.embers = new THREE.Points(geo, pm);
    this.embers.frustumCulled = false;
    scene.add(this.embers);
  }

  update(dt: number, time: number, camera: THREE.Camera, flare: number, motion: number) {
    const f = 0.86 + (0.08 * Math.sin(time * 7.3) + 0.05 * Math.sin(time * 17.1 + 1) + 0.03 * Math.sin(time * 31)) * motion;
    this.light.intensity = (7.5 * f + 9 * flare);
    this.light.position.x = this.at.x + 0.03 * Math.sin(time * 5.3) * motion;
    for (const [i, m] of this.flames.entries()) {
      const u = (m.material as THREE.ShaderMaterial).uniforms;
      u.uTime!.value = time;
      u.uFlare!.value = flare;
      // Face the camera, turning only about the vertical axis.
      m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
      const s = (1 + 0.9 * flare) * (0.9 + 0.12 * Math.sin(time * (6 + i) + i * 2) * motion);
      m.scale.set(1 + 0.3 * flare, s, 1);
    }
    (this.glow.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.25 * f;

    this.emberT += dt * (2 + 26 * flare);
    while (this.emberT > 1 && this.emberData.length < 80) {
      this.emberT -= 1;
      const r = this.r;
      this.emberData.push({ x: this.at.x + (r() - 0.5) * 0.3, y: this.at.y + 0.1, z: this.at.z + (r() - 0.5) * 0.3, vx: (r() - 0.5) * 0.3, vy: 0.5 + r() * 0.9, vz: (r() - 0.5) * 0.2, life: 0.8 + r() * 1.6 });
    }
    if (this.emberT > 1) this.emberT = 1;
    const pos = this.embers.geometry.attributes.position as THREE.BufferAttribute;
    let k = 0;
    this.emberData = this.emberData.filter((e) => (e.life -= dt) > 0);
    for (const e of this.emberData) {
      e.x += (e.vx + Math.sin(time * 5 + e.y * 7) * 0.08) * dt;
      e.y += e.vy * dt;
      e.z += e.vz * dt;
      e.vy *= 1 - dt * 0.4;
      pos.setXYZ(k++, e.x, e.y, e.z);
    }
    for (let i = k; i < pos.count; i++) pos.setXYZ(i, 0, -999, 0);
    pos.needsUpdate = true;
    void this.scene;
  }
}

/** A soft puff for smoke, drawn once. */
function puffTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = rng(71);
  for (let i = 0; i < 14; i++) {
    const x = 40 + r() * 48;
    const y = 40 + r() * 48;
    const rad = 18 + r() * 34;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Smoke {
  private tex = puffTexture();
  private puffs: Array<{ s: THREE.Sprite; life: number; big: number; vx: number }> = [];
  private t = 0;
  private r = rng(83);

  constructor(
    private scene: THREE.Scene,
    private from: THREE.Vector3,
  ) {
    // Start with smoke already in the air.
    for (let i = 0; i < 16; i++) {
      this.spawn(1);
      this.advance(0.75, 0, 1, 1);
    }
  }

  private spawn(big: number) {
    const mat = new THREE.SpriteMaterial({ map: this.tex, color: 0xd6cdc4, transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    s.position.copy(this.from).add(new THREE.Vector3((this.r() - 0.5) * 0.15, 0, (this.r() - 0.5) * 0.15));
    s.material.rotation = this.r() * 6.28;
    this.scene.add(s);
    this.puffs.push({ s, life: 1, big, vx: 0.3 + this.r() * 0.12 });
  }

  private advance(dt: number, time: number, day: number, motion: number) {
    for (const p of this.puffs) {
      p.life -= dt / 13;
      const age = 1 - p.life;
      p.s.position.y += dt * 0.27;
      p.s.position.x += dt * (p.vx + 0.1 * Math.sin(time * 0.7 + age * 9)) * motion + dt * 0.03;
      const size = (0.45 + age * 3.2) * (0.8 + 0.4 * p.big);
      p.s.scale.set(size, size, 1);
      p.s.material.rotation += dt * 0.05;
      p.s.material.opacity = 0.32 * Math.sin(Math.PI * Math.min(1, age * 1.15)) * (0.4 + 0.6 * day) * p.big;
    }
    for (const p of this.puffs.filter((q) => q.life <= 0)) {
      this.scene.remove(p.s);
      p.s.material.dispose();
    }
    this.puffs = this.puffs.filter((q) => q.life > 0);
  }

  update(dt: number, time: number, day: number, flare: number, motion: number) {
    this.t += dt;
    const every = flare > 0.05 ? 0.3 : 0.75;
    if (this.t > every) {
      this.t = 0;
      this.spawn(1 + flare * 0.7);
    }
    this.advance(dt, time, day, motion);
    // Warmer on the side that faces the low sun.
    for (const p of this.puffs) p.s.material.color.setRGB(0.78 + 0.12 * day, 0.74 + 0.06 * day, 0.72);
  }
}

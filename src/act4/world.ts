// The world of act 4 in 3D (D-011 prototype). World units are metres; y is up, the
// ground is y = 0, and the archaeological section is the plane z = 0: everything in
// front of it (z > 0) is cut away, so the camera at +z sees the earth, the jar and the
// house in section, and the village beyond (z < 0). Layout follows the 2D version.

import * as THREE from "three";
import { GLSL_NOISE, rng } from "./util";

export const LAYOUT = {
  house: { cx: -3.1, r: 2.5, floor: -0.9, roofH: 3.4, eave: 0.35, thatch: 0.36 },
  doorTop: 1.3,
  ramp: { x0: -1.55, x1: -0.35, z0: -0.8 },
  hearth: { x: -3.1, z: -1.25 },
  jar: { x: 0.9 },
  ditch: { x0: 7, x1: 9.6, depth: 1.5 },
  cemetery: { x0: 10.2, x1: 13.6 },
};
const H = LAYOUT.house;

/** The cut: keep z <= 0. */
export const CUT = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

export function groundY(x: number) {
  const d = LAYOUT.ditch;
  if (x <= d.x0 || x >= d.x1) return 0;
  return -d.depth * Math.sin((Math.PI * (x - d.x0)) / (d.x1 - d.x0)) ** 0.8;
}

type Uniforms = Record<string, THREE.IUniform>;

/** Add world position, noise and custom colour / emissive code to a standard material. */
function patch(
  mat: THREE.MeshStandardMaterial,
  opts: { uniforms?: Uniforms; head?: string; color?: string; emissive?: string; vertex?: string },
) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, opts.uniforms ?? {});
    const uniformDecl = Object.entries(opts.uniforms ?? {})
      .map(([k, u]) => `uniform ${glslType(u.value)} ${k};`)
      .join("\n");
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWorldP;\n${uniformDecl}\n${opts.vertex ? GLSL_NOISE : ""}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n${opts.vertex ?? ""}`,
      )
      .replace(
        "#include <fog_vertex>",
        `#include <fog_vertex>
#ifdef USE_INSTANCING
  vWorldP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
#else
  vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec3 vWorldP;\n${uniformDecl}\n${GLSL_NOISE}\n${opts.head ?? ""}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${opts.color ?? ""}`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${opts.emissive ?? ""}`);
  };
  // three.js caches programs by onBeforeCompile.toString(), which is the same closure for
  // every patched material; without a key of its own, one patch's GLSL is reused for another.
  const key = [Object.keys(opts.uniforms ?? {}).join(","), opts.head, opts.color, opts.emissive, opts.vertex].join("\u0000");
  mat.customProgramCacheKey = () => key;
}

function glslType(v: unknown) {
  if (typeof v === "number") return "float";
  if (v instanceof THREE.Vector2) return "vec2";
  if (v instanceof THREE.Vector3 || v instanceof THREE.Color) return "vec3";
  if (v instanceof THREE.Vector4) return "vec4";
  return "float";
}

/** Straw texture for the thatch: fine strands along the slope, in layered courses. */
function strawTexture(ends = false) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  const r = rng(ends ? 11 : 7);
  g.fillStyle = ends ? "#5e4626" : "#8a6a3c";
  g.fillRect(0, 0, 512, 512);
  if (ends) {
    // Cut straw seen end-on: dense small dots.
    for (let i = 0; i < 9000; i++) {
      const l = 40 + r() * 60;
      g.fillStyle = `hsl(${32 + r() * 10}, ${30 + r() * 25}%, ${l * 0.6}%)`;
      g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
    }
  } else {
    for (let course = 0; course < 6; course++) {
      const y0 = course * 86;
      for (let i = 0; i < 700; i++) {
        const x = r() * 512;
        const len = 40 + r() * 60;
        const l = 26 + r() * 34;
        g.strokeStyle = `hsla(${30 + r() * 12}, ${35 + r() * 25}%, ${l}%, ${0.5 + r() * 0.5})`;
        g.lineWidth = 0.6 + r() * 1.4;
        g.beginPath();
        g.moveTo(x, y0 + r() * 30);
        g.lineTo(x + (r() - 0.5) * 6, y0 + 30 + len);
        g.stroke();
      }
      // The shadowed lower edge of each course.
      const grad = g.createLinearGradient(0, y0 + 70, 0, y0 + 90);
      grad.addColorStop(0, "rgba(20,12,6,0)");
      grad.addColorStop(1, "rgba(20,12,6,0.45)");
      g.fillStyle = grad;
      g.fillRect(0, y0 + 70, 512, 20);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Cubic Bézier sampled into (r, y) points. */
function bez(p0: number[], p1: number[], p2: number[], p3: number[], n: number) {
  const out: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const r = u * u * u * p0[0]! + 3 * u * u * t * p1[0]! + 3 * u * t * t * p2[0]! + t * t * t * p3[0]!;
    const y = u * u * u * p0[1]! + 3 * u * u * t * p1[1]! + 3 * u * t * t * p2[1]! + t * t * t * p3[1]!;
    out.push(new THREE.Vector2(r, y));
  }
  return out;
}

/** The burial jar's wall profile, outer and inner, from the 2D drawing (y up, metres). */
function jarProfile(k: number, base: number) {
  const a = bez([0.15 * k, -0.47], [0.16 * k, -0.53], [0.285 * k, -0.56], [0.275 * k, -0.68], 10);
  const b = bez([0.275 * k, -0.68], [0.27 * k, -0.84], [0.18 * k, -0.97], [0.13 * k, -base], 12);
  return [...a, ...b.slice(1)]; // mouth → base
}
function basinProfile(k: number, top: number) {
  // From the top centre outward and down to the rim.
  const pts = [new THREE.Vector2(0, -top), new THREE.Vector2(0.09 * k, -top)];
  pts.push(...bez([0.09 * k, -top], [0.15 * k, -top - 0.006], [0.2 * k, -0.38], [0.205 * k, -0.476], 12).slice(1));
  return pts;
}

/** A flat cap where the cut passes through a wall: the region between two profiles, mirrored. */
function capShape(outer: THREE.Vector2[], inner: THREE.Vector2[]) {
  const s = new THREE.Shape();
  // Right half: outer down, across the bottom, inner up; then the mirror image.
  const pts: THREE.Vector2[] = [];
  for (const p of outer) pts.push(new THREE.Vector2(p.x, p.y));
  for (let i = outer.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(-outer[i]!.x, outer[i]!.y));
  for (const p of inner) pts.push(new THREE.Vector2(-p.x, p.y));
  for (let i = inner.length - 1; i >= 0; i--) pts.push(new THREE.Vector2(inner[i]!.x, inner[i]!.y));
  s.moveTo(pts[0]!.x, pts[0]!.y);
  for (const p of pts.slice(1)) s.lineTo(p.x, p.y);
  s.closePath();
  return s;
}

export interface WorldState {
  day: number;
  sunrise: number;
  jarGlow: number;
  graveGlow: number;
  doorGlow: number;
  fire: number;
  time: number;
}

export class World {
  readonly group = new THREE.Group();
  readonly sun = new THREE.DirectionalLight(0xffd2a0, 0);
  readonly hemi = new THREE.HemisphereLight(0x8fa3cc, 0x4a3524, 0.1);
  readonly fill = new THREE.DirectionalLight(0xb8c2ff, 0.2);
  readonly jarLight = new THREE.PointLight(0xffb070, 0, 1.2, 2);
  readonly graveLight = new THREE.PointLight(0xffe2c0, 0, 9, 1.5);
  private sky: THREE.Mesh;
  private stars: THREE.Points;
  private skyU = {
    uDay: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.45, 0.02, -0.89).normalize() },
    uTop: { value: new THREE.Color("#2b3a5c") },
    uMid: { value: new THREE.Color("#9e8592") },
    uHor: { value: new THREE.Color("#f2b282") },
    uNight: { value: new THREE.Color("#05070e") },
    uNightHor: { value: new THREE.Color("#141824") },
  };
  readonly sectionU: Uniforms = {
    uJarGlow: { value: 0 },
    uGraveGlow: { value: 0 },
    uFire: { value: 1 },
    uDay: { value: 0 },
  };
  private grassU: Uniforms = { uTime: { value: 0 }, uGust: { value: 0.5 } };
  private mistU: Uniforms = { uTime: { value: 0 }, uDay: { value: 0 } };
  private fogDay = new THREE.Color("#c9a48e");
  private fogNight = new THREE.Color("#0b0d14");
  private grassMat!: THREE.MeshStandardMaterial;

  constructor(
    private scene: THREE.Scene,
    private quality: { sunShadow: number; grass: number },
  ) {
    scene.add(this.group);
    scene.fog = new THREE.FogExp2(this.fogNight.clone(), 0.016);
    this.sky = this.makeSky();
    this.stars = this.makeStars();
    this.makeLights();
    this.makeHills();
    this.makeGround();
    this.makeSection();
    this.makeHouse();
    this.makeJar();
    this.makeCemetery();
    this.makeVillage();
    this.makeTrees();
    this.makeGrass();
    this.makeMist();
  }

  private makeSky() {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: this.skyU,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uDay;
        uniform vec3 uSunDir, uTop, uMid, uHor, uNight, uNightHor;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 hor = mix(uNightHor, uHor, uDay);
          vec3 mid = mix(uNightHor, uMid, uDay);
          vec3 top = mix(uNight, uTop, uDay);
          vec3 col = mix(hor, mid, smoothstep(0.0, 0.14, h));
          col = mix(col, top, smoothstep(0.12, 0.65, h));
          float s = max(dot(d, normalize(uSunDir)), 0.0);
          col += vec3(1.0, 0.62, 0.36) * pow(s, 6.0) * 0.55 * uDay;
          col += vec3(1.0, 0.8, 0.6) * pow(s, 90.0) * 1.2 * uDay;
          col += vec3(2.6, 2.2, 1.8) * smoothstep(0.99955, 0.9998, s) * uDay;
          col = mix(col, hor * 0.85, smoothstep(0.0, -0.06, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), mat);
    sky.renderOrder = -10;
    this.scene.add(sky);
    return sky;
  }

  private makeStars() {
    const r = rng(3);
    const pos: number[] = [];
    for (let i = 0; i < 900; i++) {
      const th = r() * Math.PI * 2;
      const y = 0.08 + r() * 0.92;
      const rad = Math.sqrt(1 - y * y);
      pos.push(Math.cos(th) * rad * 560, y * 560, Math.sin(th) * rad * 560);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xf4ecdc, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 1, fog: false, depthWrite: false });
    const stars = new THREE.Points(geo, mat);
    this.scene.add(stars);
    return stars;
  }

  private makeLights() {
    const s = this.sun;
    s.castShadow = true;
    s.shadow.mapSize.set(this.quality.sunShadow, this.quality.sunShadow);
    const cam = s.shadow.camera;
    cam.left = -16;
    cam.right = 20;
    cam.top = 10;
    cam.bottom = -8;
    cam.near = 1;
    cam.far = 160;
    s.shadow.bias = -0.0004;
    s.shadow.normalBias = 0.03;
    s.target.position.set(1, 0, -3);
    this.scene.add(s, s.target, this.hemi, this.fill);
    this.fill.position.set(0, 4, 30);
    this.fill.target.position.set(0, -1, 0);
    this.scene.add(this.fill.target);
    // A faint warmth inside the hollow jar, and a soft light over the far cemetery.
    this.jarLight.position.set(LAYOUT.jar.x, -0.72, -0.1);
    this.scene.add(this.jarLight);
    this.graveLight.position.set((LAYOUT.cemetery.x0 + LAYOUT.cemetery.x1) / 2, 2.2, -2.5);
    this.scene.add(this.graveLight);
  }

  private makeHills() {
    const r = rng(19);
    const layers = [
      { z: -110, h: 9, col: "#5d5560", seed: 1.3 },
      { z: -190, h: 16, col: "#6e6470", seed: 4.1 },
      { z: -300, h: 26, col: "#81727c", seed: 7.7 },
    ];
    for (const L of layers) {
      const n = 180;
      const geo = new THREE.BufferGeometry();
      const pos: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= n; i++) {
        const x = -500 + (1000 * i) / n;
        const u = x / 120 + L.seed;
        const y = L.h * (0.55 + 0.3 * Math.sin(u * 1.7) + 0.15 * Math.sin(u * 4.3 + 1) + 0.06 * (r() - 0.5));
        pos.push(x, -2, L.z, x, Math.max(0.5, y), L.z);
        if (i < n) {
          const a = i * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      }
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setIndex(idx);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: L.col }));
      this.group.add(mesh);
    }
  }

  private makeGround() {
    const geo = new THREE.PlaneGeometry(240, 260, 960, 26);
    geo.rotateX(-Math.PI / 2);
    geo.translate(10, 0, -130);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, groundY(p.getX(i)));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    patch(mat, {
      uniforms: { uHx: { value: H.cx }, uHr: { value: H.r }, uJx: { value: LAYOUT.jar.x } },
      color: /* glsl */ `
        vec2 q = vWorldP.xz;
        if (length(q - vec2(uHx, 0.0)) < uHr) discard;
        float n = fbm(q * 0.7);
        float m = fbm(q * 3.1 + 7.0);
        vec3 earth = vec3(0.30, 0.21, 0.13);
        vec3 grass = vec3(0.33, 0.33, 0.16);
        vec3 dry = vec3(0.46, 0.40, 0.24);
        vec3 c = mix(earth, mix(grass, dry, m), smoothstep(0.35, 0.6, n));
        // Trodden earth around the door and the jar.
        float path = smoothstep(1.6, 0.2, length(q - vec2(-0.1, -0.7)));
        c = mix(c, earth * 1.1, path * 0.8);
        // The ditch slopes are bare.
        c = mix(c, earth * 0.85, smoothstep(-0.05, -0.4, vWorldP.y));
        diffuseColor.rgb = pow(c * (0.8 + 0.4 * m), vec3(2.2));
      `,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  /** The cut face of the earth at z = 0, with strata, pebbles, and the pits left open. */
  private makeSection() {
    const geo = new THREE.PlaneGeometry(240, 14, 1, 1);
    geo.translate(10, -7, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
    const d = LAYOUT.ditch;
    patch(mat, {
      uniforms: {
        ...this.sectionU,
        uHx: { value: H.cx },
        uHr: { value: H.r },
        uFloor: { value: H.floor },
        uJx: { value: LAYOUT.jar.x },
        uD: { value: new THREE.Vector3(d.x0, d.x1, d.depth) },
        uC: { value: new THREE.Vector2(LAYOUT.cemetery.x0, LAYOUT.cemetery.x1) },
      },
      head: /* glsl */ `
        float groundAt(float x) {
          if (x <= uD.x || x >= uD.y) return 0.0;
          return -uD.z * pow(sin(3.14159265 * (x - uD.x) / (uD.y - uD.x)), 0.8);
        }
      `,
      color: /* glsl */ `
        float x = vWorldP.x;
        float y = vWorldP.y;
        if (y > groundAt(x) - 0.002) discard;
        if (abs(x - uHx) < uHr && y > uFloor) discard;
        // The jar and its lid, seen in section: open the face where they are.
        float ax = abs(x - uJx);
        float tj = clamp((y + 0.47) / -0.55, 0.0, 1.0);
        float rj = mix(0.15, 0.13, tj) + 0.15 * sin(3.14159265 * pow(tj, 0.7));
        if (y < -0.468 && y > -1.018 && ax < rj - 0.003) discard;
        float sb = clamp((y + 0.476) / 0.174, 0.0, 1.0);
        float rb = 0.205 - 0.115 * pow(sb, 1.5);
        if (y >= -0.478 && y < -0.304 && ax < rb - 0.003) discard;
        // The pit it was buried in, backfilled with looser, darker earth.
        float jr = mix(0.44, 0.6, clamp((y + 1.1) / 1.1, 0.0, 1.0));
        float fill = (ax < jr && y > -1.1) ? 1.0 : 0.0;
        float depth = -y;
        vec3 top = vec3(0.40, 0.29, 0.18);
        vec3 mid = vec3(0.26, 0.18, 0.11);
        vec3 deep = vec3(0.11, 0.075, 0.05);
        vec3 c = mix(top, mid, smoothstep(0.0, 1.6, depth));
        c = mix(c, deep, smoothstep(1.6, 7.0, depth));
        float b = depth + 0.05 * sin(x * 1.1) + 0.02 * sin(x * 3.3);
        float band = mod(floor(b / 0.62), 2.0);
        c *= 0.94 + 0.08 * band;
        float lines = 0.0;
        lines += exp(-pow((b - 0.32) / 0.015, 2.0));
        lines += exp(-pow((b - 0.78) / 0.018, 2.0));
        lines += exp(-pow((b - 1.32) / 0.02, 2.0));
        lines += exp(-pow((b - 2.05) / 0.025, 2.0));
        lines += exp(-pow((b - 2.9) / 0.03, 2.0));
        lines += exp(-pow((b - 3.9) / 0.035, 2.0));
        c *= 1.0 - 0.35 * clamp(lines, 0.0, 1.0);
        vec2 q = vec2(x, y);
        c *= 0.82 + 0.36 * fbm(q * vec2(2.2, 4.0));
        // Pebbles.
        vec2 cell = floor(q * 9.0);
        vec2 f = fract(q * 9.0) - 0.5;
        float hsh = hash12(cell);
        if (hsh > 0.93) {
          vec2 o = vec2(hash12(cell + 3.1), hash12(cell + 7.7)) - 0.5;
          float r = 0.12 + 0.2 * hash12(cell + 1.7);
          float pe = smoothstep(r, r * 0.6, length(f - o * 0.4));
          c = mix(c, vec3(0.42, 0.36, 0.28) * (0.7 + 0.5 * hash12(cell + 5.0)), pe * 0.9);
        }
        // Roots under the grass.
        float root = smoothstep(0.75, 0.0, depth) * smoothstep(0.55, 0.62, vnoise(vec2(x * 14.0, depth * 3.0)));
        c *= 1.0 - 0.25 * root * (1.0 - fill);
        c = mix(c, c * vec3(0.78, 0.74, 0.72) * (0.85 + 0.3 * fbm(q * 7.0)), fill);
        // Graves beyond the ditch: long pits with darker fill.
        if (x > uC.x && x < uC.y) {
          float gx = fract((x - uC.x) / ((uC.y - uC.x) / 4.0)) - 0.5;
          float g = smoothstep(0.32, 0.22, abs(gx)) * smoothstep(1.9, 1.6, depth);
          c *= 1.0 - 0.28 * g;
        }
        diffuseColor.rgb = pow(c, vec3(2.2));
      `,
      emissive: /* glsl */ `
        // Light bounced off the open trench, so the strata read even before the sun is up.
        totalEmissiveRadiance += diffuseColor.rgb * (0.12 + 0.22 * uDay);
        float dj = length((vWorldP.xy - vec2(uJx, -0.6)) * vec2(1.0, 1.15));
        totalEmissiveRadiance += vec3(1.0, 0.62, 0.34) * 0.16 * uJarGlow * exp(-dj * 2.2);
        float dh = length(vWorldP.xy - vec2(uHx, uFloor));
        totalEmissiveRadiance += vec3(1.0, 0.5, 0.22) * 0.05 * uFire * exp(-dh * 1.2);
      `,
    });
    const section = new THREE.Mesh(geo, mat);
    section.receiveShadow = true;
    this.group.add(section);
  }

  private makeHouse() {
    const { cx, r, floor, roofH, eave, thatch } = H;
    const plaster = new THREE.MeshStandardMaterial({ color: 0x8a7154, roughness: 0.95, side: THREE.DoubleSide, clippingPlanes: [CUT] });
    patch(plaster, {
      color: /* glsl */ `diffuseColor.rgb *= 0.78 + 0.35 * fbm(vWorldP.xy * vec2(3.0, 5.0) + vWorldP.z * 2.0);`,
    });
    // Pit wall and floor.
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r, -floor, 96, 1, true), plaster);
    wall.position.set(cx, floor / 2, 0);
    wall.receiveShadow = true;
    const floorMesh = new THREE.Mesh(new THREE.CircleGeometry(r, 96).rotateX(-Math.PI / 2), plaster);
    floorMesh.position.set(cx, floor + 0.002, 0);
    floorMesh.receiveShadow = true;
    this.group.add(wall, floorMesh);

    // The ramp up to the door: a solid wedge.
    const rp = LAYOUT.ramp;
    const wedge = new THREE.Shape();
    wedge.moveTo(rp.x0, floor);
    wedge.lineTo(rp.x1, 0);
    wedge.lineTo(rp.x1 + 0.25, 0);
    wedge.lineTo(rp.x1 + 0.25, floor);
    wedge.closePath();
    const wgeo = new THREE.ExtrudeGeometry(wedge, { depth: -rp.z0, bevelEnabled: false });
    wgeo.translate(0, 0, rp.z0);
    const ramp = new THREE.Mesh(wgeo, plaster);
    ramp.receiveShadow = true;
    ramp.castShadow = true;
    this.group.add(ramp);

    // Thatched cone roof with real thickness; the doorway is cut on the jar's side.
    const straw = strawTexture();
    const strawEnds = strawTexture(true);
    const roofMat = (inner: boolean) => {
      const tex = straw.clone();
      tex.repeat.set(inner ? 7 : 9, 3);
      tex.needsUpdate = true;
      const m = new THREE.MeshStandardMaterial({
        map: tex,
        bumpMap: tex,
        bumpScale: 2.5,
        roughness: 1,
        color: inner ? 0x9a8a78 : 0xffffff,
        side: inner ? THREE.BackSide : THREE.FrontSide,
        clippingPlanes: [CUT],
        shadowSide: THREE.DoubleSide,
      });
      patch(m, {
        uniforms: { uDoorX: { value: cx + 1.55 }, uDoorTop: { value: LAYOUT.doorTop } },
        color: /* glsl */ `
          if (vWorldP.x > uDoorX && vWorldP.y < uDoorTop && vWorldP.z > -0.85) discard;
          diffuseColor.rgb *= 0.85 + 0.3 * fbm(vWorldP.xz * 1.3 + vWorldP.y);
        `,
      });
      return m;
    };
    const Ro = r + eave;
    const outer = new THREE.Mesh(new THREE.ConeGeometry(Ro, roofH, 128, 16, true), roofMat(false));
    outer.position.set(cx, roofH / 2, 0);
    outer.castShadow = true;
    outer.receiveShadow = true;
    const Ri = Ro - thatch;
    const innerH = roofH - thatch * 1.16;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(Ri, innerH, 128, 16, true), roofMat(true));
    inner.position.set(cx, innerH / 2, 0);
    inner.receiveShadow = true;
    inner.castShadow = true;
    this.group.add(outer, inner);
    // The thatch is tied off at the peak in a knot (not clipped: it sits on the cut).
    const knotPts = [[0.16, -0.2], [0.11, 0], [0.12, 0.18], [0.05, 0.27], [0, 0.29]].map(([x, y]) => new THREE.Vector2(x, y));
    const knotTex = straw.clone();
    knotTex.repeat.set(2, 1);
    knotTex.needsUpdate = true;
    const knot = new THREE.Mesh(new THREE.LatheGeometry(knotPts, 16), new THREE.MeshStandardMaterial({ map: knotTex, roughness: 1, side: THREE.DoubleSide }));
    knot.position.set(cx, roofH - 0.08, 0);
    knot.castShadow = true;
    this.group.add(knot);

    // Where the cut passes through the thatch: two solid bands (the right one stops at the door).
    const yAt = (rad: number, h: number, y: number) => rad * (1 - y / h);
    const left = new THREE.Shape();
    left.moveTo(cx - Ro, 0);
    left.lineTo(cx, roofH);
    left.lineTo(cx, innerH);
    left.lineTo(cx - Ri, 0);
    left.closePath();
    const right = new THREE.Shape();
    right.moveTo(cx, roofH);
    right.lineTo(cx + yAt(Ro, roofH, LAYOUT.doorTop), LAYOUT.doorTop);
    right.lineTo(cx + yAt(Ri, innerH, LAYOUT.doorTop), LAYOUT.doorTop);
    right.lineTo(cx, innerH);
    right.closePath();
    const endsTex = strawEnds;
    endsTex.repeat.set(1.2, 1.2);
    const capMat = new THREE.MeshStandardMaterial({ map: endsTex, bumpMap: endsTex, bumpScale: 3, roughness: 1 });
    for (const sh of [left, right]) {
      const geo = new THREE.ShapeGeometry(sh);
      // UVs in metres so the straw ends keep their size.
      const uv = geo.attributes.uv as THREE.BufferAttribute;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) * 0.9, pos.getY(i) * 0.9);
      const cap = new THREE.Mesh(geo, capMat);
      cap.position.z = -0.002;
      this.group.add(cap);
    }
    // Lintel over the doorway.
    const wood = new THREE.MeshStandardMaterial({ color: 0x3e2b1a, roughness: 0.9 });
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.9), wood);
    lintel.position.set(cx + yAt(Ro, roofH, LAYOUT.doorTop) - 0.2, LAYOUT.doorTop + 0.02, -0.45);
    lintel.castShadow = true;
    this.group.add(lintel);
    // Posts around the hearth, and a few rafters under the thatch.
    const postGeo = new THREE.CylinderGeometry(0.07, 0.08, 1, 10);
    for (const [px, pz] of [
      [cx - 1.05, -0.35],
      [cx + 1.05, -0.35],
      [cx - 1.05, -2.0],
      [cx + 1.05, -2.0],
    ] as const) {
      const rho = Math.hypot(px - cx, pz);
      const top = innerH * (1 - rho / Ri) + 0.05;
      const post = new THREE.Mesh(postGeo, wood);
      post.scale.y = top - floor;
      post.position.set(px, (top + floor) / 2, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      this.group.add(post);
    }
    // Hearth: a ring of stones in a shallow hollow.
    const hz = LAYOUT.hearth;
    const stone = new THREE.MeshStandardMaterial({ color: 0x5c5248, roughness: 0.9 });
    const r2 = rng(23);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2;
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.075 + r2() * 0.03, 0), stone);
      s.position.set(hz.x + Math.cos(a) * 0.34, floor + 0.04, hz.z + Math.sin(a) * 0.34);
      s.rotation.set(r2() * 3, r2() * 3, r2() * 3);
      s.scale.y = 0.7;
      s.castShadow = true;
      this.group.add(s);
    }
    // Pots along the back wall, and a reed mat.
    const pot = new THREE.MeshStandardMaterial({ color: 0x7a4a2c, roughness: 0.85 });
    const potProfile = [0, 0.12, 0.19, 0.2, 0.17, 0.11, 0.12].map((rad, i, a) => new THREE.Vector2(rad, (i / (a.length - 1)) * 0.42));
    for (const [px, pz, s] of [
      [cx - 1.7, -1.5, 1],
      [cx - 1.25, -1.95, 0.8],
      [cx + 0.6, -2.1, 1.1],
    ] as const) {
      const m = new THREE.Mesh(new THREE.LatheGeometry(potProfile, 24), pot);
      m.position.set(px, floor, pz);
      m.scale.setScalar(s);
      m.castShadow = true;
      this.group.add(m);
    }
    const mat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.7), new THREE.MeshStandardMaterial({ color: 0x8c7a52, roughness: 1 }));
    mat.position.set(cx + 0.85, floor + 0.012, -0.85);
    mat.rotation.y = 0.25;
    mat.receiveShadow = true;
    this.group.add(mat);
  }

  private makeJar() {
    const X = LAYOUT.jar.x;
    const outer = jarProfile(1, 1.02);
    const inner = jarProfile(0.9, 0.995);
    const lathePts = [new THREE.Vector2(0, -1.02), ...[...outer].reverse(), new THREE.Vector2(0.143, -0.462), ...inner, new THREE.Vector2(0, -0.995)];
    const clay = new THREE.MeshStandardMaterial({ color: 0x6e5844, roughness: 0.92, side: THREE.DoubleSide, clippingPlanes: [CUT] });
    patch(clay, { color: /* glsl */ `diffuseColor.rgb *= 0.8 + 0.35 * fbm(vWorldP.xy * 18.0);` });
    const jar = new THREE.Mesh(new THREE.LatheGeometry(lathePts, 64), clay);
    jar.position.x = X;
    jar.castShadow = true;
    jar.receiveShadow = true;
    const cutMat = new THREE.MeshStandardMaterial({ color: 0x5a4532, roughness: 1 });
    const jarCap = new THREE.Mesh(new THREE.ShapeGeometry(capShape(outer, inner)), cutMat);
    jarCap.position.set(X, 0, -0.001);
    this.group.add(jar, jarCap);

    // The painted basin, upturned over the mouth.
    const bOut = basinProfile(1, 0.302);
    const bIn = basinProfile(0.93, 0.318);
    const basinPts = [...bOut, new THREE.Vector2(0.199, -0.479), ...[...bIn].reverse()];
    const red = new THREE.MeshStandardMaterial({ color: 0xa24f2c, roughness: 0.75, side: THREE.DoubleSide, clippingPlanes: [CUT] });
    patch(red, {
      color: /* glsl */ `
        diffuseColor.rgb *= 0.85 + 0.25 * fbm(vWorldP.xz * 30.0);
        if (vWorldP.y < -0.455) diffuseColor.rgb = vec3(0.05, 0.035, 0.03);
      `,
    });
    const basin = new THREE.Mesh(new THREE.LatheGeometry(basinPts, 64), red);
    basin.position.x = X;
    basin.castShadow = true;
    const bCapOuter = bOut.map((p) => new THREE.Vector2(p.x, p.y)).reverse();
    const bCapInner = bIn.map((p) => new THREE.Vector2(p.x, p.y)).reverse();
    const basinCap = new THREE.Mesh(new THREE.ShapeGeometry(capShape(bCapOuter, bCapInner)), new THREE.MeshStandardMaterial({ color: 0x7e3c22, roughness: 0.9 }));
    basinCap.position.set(X, 0, -0.001);
    this.group.add(basin, basinCap);
  }

  private makeCemetery() {
    const r = rng(31);
    const mound = new THREE.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x5c4a30, roughness: 1 });
    patch(mat, { color: /* glsl */ `diffuseColor.rgb *= 0.75 + 0.4 * fbm(vWorldP.xz * 2.0);` });
    const { x0, x1 } = LAYOUT.cemetery;
    for (let row = 0; row < 7; row++) {
      for (let i = 0; i < 4; i++) {
        const x = x0 + (i + 0.5) * ((x1 - x0) / 4) + (r() - 0.5) * 0.25;
        const z = -0.55 - row * 1.7 - r() * 0.4;
        const m = new THREE.Mesh(mound, mat);
        m.position.set(x, 0, z);
        m.scale.set(0.34 + r() * 0.06, 0.15 + r() * 0.04, 0.85 + r() * 0.2);
        m.receiveShadow = true;
        m.castShadow = true;
        this.group.add(m);
      }
    }
  }

  /**
   * Other houses of the village, further back, for scale and depth. Banpo round houses as
   * reconstructed: a low daub wall under a steep thatch that bells out over the eave, a
   * tied top-knot and a gabled doorway. (Plain cones read as pyramids in the haze.)
   */
  private makeVillage() {
    const r = rng(41);
    const straw = strawTexture();
    straw.repeat.set(8, 2);
    const thatch = new THREE.MeshStandardMaterial({ map: straw, bumpMap: straw, bumpScale: 2, roughness: 1, side: THREE.DoubleSide });
    const daub = new THREE.MeshStandardMaterial({ color: 0x6a5642, roughness: 1 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0d0906, roughness: 1 });
    // Profile in units of the wall radius: wall top, under the eave, eave lip, bell, tie, knot.
    const prof = [
      [1.0, 0.5], [1.17, 0.34], [1.21, 0.42], [1.1, 0.66], [0.88, 1.0], [0.6, 1.36],
      [0.3, 1.66], [0.11, 1.84], [0.07, 1.88], [0.13, 1.99], [0.06, 2.07], [0, 2.09],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const roofGeo = new THREE.LatheGeometry(prof, 40);
    // Uneven thatch: a few lumps around, ragged at the eave. Integer harmonics keep the seam closed.
    const rp = roofGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < rp.count; i++) {
      const x = rp.getX(i);
      const y = rp.getY(i);
      const z = rp.getZ(i);
      const a = Math.atan2(z, x);
      const eaveK = 1 - Math.min(1, Math.abs(y - 0.4) / 0.35);
      const k = 1 + 0.03 * Math.sin(a * 5 + 1.3) + 0.02 * Math.sin(a * 11 + y * 4) + eaveK * 0.035 * Math.sin(a * 23);
      rp.setX(i, x * k);
      rp.setZ(i, z * k);
      if (eaveK > 0) rp.setY(i, y - eaveK * 0.03 * (0.5 + 0.5 * Math.sin(a * 17 + 2)));
    }
    roofGeo.computeVertexNormals();
    const wallGeo = new THREE.CylinderGeometry(1.0, 1.04, 0.5, 32, 1, true).translate(0, 0.25, 0);
    // The doorway porch faces +z, toward the cut and the plaza.
    const gable = new THREE.Shape();
    gable.moveTo(-0.46, 0.38);
    gable.lineTo(0.46, 0.38);
    gable.lineTo(0, 0.86);
    gable.closePath();
    const porchRoofGeo = new THREE.ExtrudeGeometry(gable, { depth: 0.8, bevelEnabled: false }).translate(0, 0, 0.78);
    const porchWallGeo = new THREE.BoxGeometry(0.62, 0.4, 0.62).translate(0, 0.2, 1.22);
    const doorGeo = new THREE.PlaneGeometry(0.3, 0.36).translate(0, 0.18, 1.535);

    const spots = [
      [-11.5, -9],
      [-6.5, -15],
      [-15, -22],
      [3.5, -19],
      [-2, -30],
      [-20, -12],
      [6, -34],
    ];
    for (const [x, z] of spots) {
      const s = 1.7 + r() * 0.5;
      const house = new THREE.Group();
      for (const [geo, mat] of [
        [roofGeo, thatch],
        [wallGeo, daub],
        [porchRoofGeo, thatch],
        [porchWallGeo, daub],
        [doorGeo, dark],
      ] as const) {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true;
        m.receiveShadow = true;
        house.add(m);
      }
      house.scale.set(s, s * (0.85 + r() * 0.15), s);
      house.position.set(x!, 0, z!);
      // Doors turn toward the plaza, roughly the camera side.
      house.rotation.y = Math.atan2(-x! * 0.5, -z!) * 0.6 + (r() - 0.5) * 0.5;
      this.group.add(house);
    }
  }

  /** Trees in the haze beyond the village: elms and a few dead ones, as silhouettes. */
  private makeTrees() {
    const r = rng(67);
    const branchGeo = new THREE.CylinderGeometry(0.62, 1, 1, 6, 1, true).translate(0, 0.5, 0);
    const blobGeo = new THREE.IcosahedronGeometry(1, 2);
    const bp = blobGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bp.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(bp, i);
      const k = 1 + 0.22 * Math.sin(v.x * 5.1 + v.y * 3.3) * Math.sin(v.z * 4.7 - v.y * 2.1) + 0.1 * Math.sin(v.x * 13 + v.z * 11);
      bp.setXYZ(i, v.x * k, v.y * k * 0.78, v.z * k);
    }
    blobGeo.computeVertexNormals();
    const bark = new THREE.MeshStandardMaterial({ color: 0x2c241c, roughness: 1 });
    const leaves = new THREE.MeshStandardMaterial({ color: 0x3a4030, roughness: 1 });

    const segs: THREE.Matrix4[] = [];
    const blobs: THREE.Matrix4[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion();
    const seg = (a: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number) => {
      q.setFromUnitVectors(up, dir);
      segs.push(new THREE.Matrix4().compose(a, q, new THREE.Vector3(rad, len, rad)));
      return a.clone().addScaledVector(dir, len);
    };
    // leaf: clump size for this tree, 0 for a dead one. Clumps sit along the outer twigs,
    // so the crown is a broad, broken dome rather than one ball on a stick.
    const grow = (a: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number, leaf: number) => {
      const b = seg(a, dir, len, rad);
      if (leaf > 0 && depth <= 1) {
        const s = leaf * (0.45 + r() * 0.35);
        blobs.push(new THREE.Matrix4().compose(b, new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), new THREE.Vector3(s, s * (0.75 + r() * 0.3), s)));
      }
      if (depth === 0) return;
      const n = depth === 3 ? 3 + Math.round(r()) : 2 + Math.round(r());
      for (let i = 0; i < n; i++) {
        const d = dir.clone();
        const spread = depth === 3 ? 1.1 : 1.4;
        d.x += (r() - 0.5) * spread;
        d.z += (r() - 0.5) * spread;
        d.y += 0.45 + r() * 0.3;
        d.normalize();
        grow(b, d, len * (0.62 + r() * 0.2), rad * 0.6, depth - 1, leaf);
      }
    };
    const spots = [
      [-24, -18, 1, true],
      [-9, -24, 0.85, true],
      [-3.5, -10.5, 0.7, false],
      [1, -27, 0.9, true],
      [10, -26, 1.05, true],
      [15.5, -7, 0.8, false],
      [21, -17, 0.9, true],
      [-17, -32, 1.1, true],
      [13, -37, 1, true],
    ] as const;
    for (const [x, z, s, leafy] of spots) {
      const lean = new THREE.Vector3((r() - 0.5) * 0.25, 1, (r() - 0.5) * 0.2).normalize();
      grow(new THREE.Vector3(x, -0.1, z), lean, 1.7 * s, 0.2 * s, 3, leafy ? 1.5 * s : 0);
    }
    for (const [geo, mat, list] of [
      [branchGeo, bark, segs],
      [blobGeo, leaves, blobs],
    ] as const) {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  private makeGrass() {
    const blade = new THREE.PlaneGeometry(0.035, 1, 1, 4);
    blade.translate(0, 0.5, 0);
    const bp = blade.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bp.count; i++) bp.setX(i, bp.getX(i) * (1 - bp.getY(i) * 0.85));
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a8448, roughness: 0.9, side: THREE.DoubleSide });
    patch(mat, {
      uniforms: this.grassU,
      vertex: /* glsl */ `
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(0.0);
        #endif
        float hgt = position.y;
        float w = sin(uTime * 1.7 + ip.x * 0.9 + ip.z * 0.6) * (0.25 + 0.35 * uGust) + 0.3 * uGust;
        w += 0.15 * sin(uTime * 4.1 + ip.x * 3.0);
        transformed.x += w * hgt * hgt * 0.35;
        transformed.z += w * hgt * hgt * 0.1;
      `,
      color: /* glsl */ `diffuseColor.rgb *= 0.55 + 0.6 * smoothstep(0.0, 0.3, vWorldP.y) * (0.7 + 0.5 * hash12(floor(vWorldP.xz * 6.0)));`,
    });
    this.grassMat = mat;
    const n = this.quality.grass;
    const mesh = new THREE.InstancedMesh(blade, mat, n);
    const r = rng(53);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    let k = 0;
    let guard = 0;
    while (k < n && guard++ < n * 8) {
      // Denser near the cut, so the section has a grassy top edge.
      const z = -Math.pow(r(), 1.8) * 34 - 0.01;
      const x = -26 + r() * 52;
      if (Math.hypot(x - H.cx, z) < H.r + 0.45) continue;
      if (Math.hypot(x - LAYOUT.jar.x, z) < 0.7) continue;
      if (x > LAYOUT.ditch.x0 + 0.3 && x < LAYOUT.ditch.x1 - 0.3) continue;
      if (Math.hypot(x + 0.1, z + 0.7) < 0.9) continue;
      p.set(x, groundY(x), z);
      e.set((r() - 0.5) * 0.3, r() * Math.PI, (r() - 0.5) * 0.3);
      q.setFromEuler(e);
      const hgt = 0.12 + r() * 0.3;
      s.set(0.7 + r() * 0.8, hgt, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(k++, m);
    }
    mesh.count = k;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    this.group.add(mesh);
  }

  /** Layers of low morning mist drifting across the field. */
  private makeMist() {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: true,
      uniforms: { ...THREE.UniformsLib.fog, ...this.mistU },
      vertexShader: /* glsl */ `
        #include <fog_pars_vertex>
        varying vec2 vUv;
        varying vec3 vW;
        void main() {
          vUv = uv;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }
      `,
      fragmentShader: /* glsl */ `
        #include <fog_pars_fragment>
        uniform float uTime, uDay;
        varying vec2 vUv;
        varying vec3 vW;
        ${GLSL_NOISE}
        void main() {
          float n = fbm(vec2(vW.x * 0.12 + uTime * 0.05, vW.z * 0.2 + vUv.y * 1.5));
          float a = smoothstep(0.35, 0.8, n) * smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.15, vUv.y);
          a *= smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          gl_FragColor = vec4(mix(vec3(0.5, 0.5, 0.58), vec3(1.0, 0.86, 0.76), uDay), a * 0.35 * (0.3 + 0.7 * uDay));
          #include <fog_fragment>
        }
      `,
    });
    for (const [z, w, h] of [
      [-2.5, 70, 1.4],
      [-9, 110, 2.2],
      [-22, 160, 3.5],
      [-45, 260, 6],
    ] as const) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      plane.position.set(4, h / 2 - 0.15, z);
      this.group.add(plane);
    }
  }

  update(s: WorldState) {
    const day = s.day;
    this.skyU.uDay.value = day;
    const elev = 0.01 + 0.1 * s.sunrise;
    this.skyU.uSunDir.value.set(0.45, elev, -0.89).normalize();
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - day * 1.3);
    this.stars.visible = day < 0.8;
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.copy(this.fogNight).lerp(this.fogDay, day);
    fog.density = 0.022 - 0.008 * day;
    // Sun behind the village: the scene is backlit, as at dawn.
    const sd = this.skyU.uSunDir.value;
    this.sun.position.copy(this.sun.target.position).addScaledVector(sd, 80);
    this.sun.intensity = (1.4 + 1.6 * s.sunrise) * day;
    this.sun.color.setHSL(0.07, 0.8, 0.62 + 0.12 * s.sunrise);
    this.hemi.intensity = 0.08 + 0.75 * day;
    this.fill.intensity = 0.12 + 0.28 * day;
    this.jarLight.intensity = 0.35 * s.jarGlow;
    this.graveLight.intensity = 6 * s.graveGlow;
    this.sectionU.uJarGlow!.value = s.jarGlow;
    this.sectionU.uGraveGlow!.value = s.graveGlow;
    this.sectionU.uFire!.value = s.fire;
    this.sectionU.uDay!.value = day;
    this.grassU.uTime!.value = s.time;
    this.grassU.uGust!.value = 0.5 + 0.5 * Math.sin(s.time * 0.35);
    this.mistU.uTime!.value = s.time;
    this.mistU.uDay!.value = day;
    void this.sky;
    void this.grassMat;
  }
}

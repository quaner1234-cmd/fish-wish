// Procedural surfaces: the basin interior (hero image), the jar wall around it,
// and the top-down view of the buried jar used while digging. All seeded.

import { makeFbm, mulberry32 } from "../core/rng";
import { drawFace, drawFish, motifLayout } from "./face";

export const PIGMENT = "#1a100a";

export function canvas(w: number, h = w): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  return c.getContext("2d", { willReadFrequently: false })!;
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Geometry of the inside view, in a size×size square. */
export function urnGeometry(size: number) {
  return { cx: size / 2, cy: size / 2, R: size * 0.4, hole: { angle: -Math.PI / 3, dist: 0.74 } };
}

/** Hole position relative to disk centre, in units of R. */
export function holeOffset(): { x: number; y: number } {
  const { hole } = urnGeometry(1);
  return { x: Math.cos(hole.angle) * hole.dist, y: Math.sin(hole.angle) * hole.dist };
}

/**
 * The view from inside the jar, looking up: the basin's painted interior as a disk,
 * framed by the jar's dark inner wall. Rendered once; reused by scenes 2, 3 and 5.
 */
export function renderUrnView(size = 1024): HTMLCanvasElement {
  const c = canvas(size);
  const g = ctx2d(c);
  const { cx, cy, R } = urnGeometry(size);
  const img = g.createImageData(size, size);
  const d = img.data;
  const clayN = makeFbm(11, 5);
  const grainN = makeFbm(29, 2);
  const wallN = makeFbm(47, 4);
  const rand = mulberry32(5);
  const clayLight: RGB = [196, 112, 68];
  const clayDeep: RGB = [134, 64, 36];
  const wallNear: RGB = [58, 44, 34];
  const wallFar: RGB = [6, 5, 4];
  const smooth = (a: number, b: number, v: number) => {
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy) / R;
      let col: RGB;
      if (dist <= 1) {
        const n = clayN((x / size) * 6, (y / size) * 6);
        col = mix(clayDeep, clayLight, 0.3 + 0.55 * n);
        // Concave: the bottom of the basin is farthest away and darkest.
        let shade = 0.7 + 0.32 * smooth(0, 1, dist);
        shade *= 1 - 0.45 * smooth(0.965, 1, dist);
        const grit = (grainN(x * 0.8, y * 0.8) - 0.5) * 22 + (rand() < 0.003 ? 30 : 0);
        col = [col[0] * shade + grit, col[1] * shade + grit * 0.7, col[2] * shade + grit * 0.5];
      } else {
        const t = Math.pow(Math.min(1, (dist - 1) / 0.27), 0.75);
        const tex = 0.72 + 0.56 * wallN((x / size) * 11, (y / size) * 11);
        col = mix(wallNear, wallFar, t).map((v) => v * tex) as RGB;
        if (dist < 1.035) col = col.map((v) => v * 1.45 + 8) as RGB; // the jar's lip
      }
      const i = (y * size + x) * 4;
      d[i] = col[0];
      d[i + 1] = col[1];
      d[i + 2] = col[2];
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.drawImage(paintLayer(size), 0, 0);
  // A few faint scratches catch the light.
  g.save();
  g.beginPath();
  g.arc(cx, cy, R, 0, Math.PI * 2);
  g.clip();
  g.strokeStyle = "rgba(255, 214, 170, 0.07)";
  g.lineWidth = 1.2;
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const rr = R * (0.2 + rand() * 0.75);
    g.beginPath();
    g.arc(cx, cy, rr, a, a + 0.05 + rand() * 0.25);
    g.stroke();
  }
  g.restore();
  return c;
}

/** Black pigment: interrupted rim band, two faces, two big fish; then wear. */
function paintLayer(size: number): HTMLCanvasElement {
  const c = canvas(size);
  const g = ctx2d(c);
  const { cx, cy, R } = urnGeometry(size);
  g.fillStyle = PIGMENT;
  g.strokeStyle = PIGMENT;
  g.translate(cx, cy);
  // Rim: a black band broken at intervals.
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI * 2 + 0.12;
    const a1 = a0 + (Math.PI * 2) / segs - 0.24;
    g.beginPath();
    g.arc(0, 0, R * 0.993, a0, a1);
    g.arc(0, 0, R * 0.955, a1, a0, true);
    g.closePath();
    g.fill();
  }
  const layout = motifLayout(R);
  for (const f of layout.faces) {
    g.save();
    g.translate(f.x, f.y);
    g.rotate(f.rot);
    drawFace(g, f.r);
    g.restore();
  }
  for (const f of layout.fish) {
    g.save();
    g.translate(f.x, f.y);
    g.rotate(f.rot);
    drawFish(g, f.len, f.len * 0.16, f.len * 0.32);
    g.restore();
  }
  // Wear: pigment thins and flakes unevenly, as on six-thousand-year-old clay.
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  const wearN = makeFbm(83, 4);
  const rand = mulberry32(19);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4 + 3;
      if (d[i] === 0) continue;
      let a = 0.62 + 0.55 * wearN(x * 0.035, y * 0.035);
      if (rand() < 0.05) a *= 0.35;
      d[i] = Math.max(0, Math.min(255, d[i]! * Math.min(1, a)));
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Radii (fractions of the dig stage) of the buried jar seen from above. */
export const DIG = { jar: 0.2, pit: 0.255, rim: 0.152, base: 0.066, target: 0.205 };

/**
 * Top-down view of the excavated jar: the upturned basin (red, fine ware) sits on
 * the jar's mouth (coarse sandy ware), inside a darker pit fill (F4).
 */
export function renderDigObjects(size = 1024): HTMLCanvasElement {
  const c = canvas(size);
  const g = ctx2d(c);
  const img = g.createImageData(size, size);
  const d = img.data;
  const n1 = makeFbm(101, 5);
  const n2 = makeFbm(131, 3);
  const rand = mulberry32(3);
  const light = [-0.55, -0.62, 0.56]; // from the upper left
  const red: RGB = [168, 84, 48];
  const sand: RGB = [104, 88, 72];
  const pit: RGB = [52, 39, 28];
  const soil: RGB = [38, 29, 21];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const ux = x / size - 0.5;
      const uy = y / size - 0.5;
      const r = Math.hypot(ux, uy);
      const nx = r > 0 ? ux / r : 0;
      const ny = r > 0 ? uy / r : 0;
      const tex = n1(x * 0.012, y * 0.012);
      let col: RGB;
      let slope = 0; // 0 = flat; 1 = steep outward slope
      if (r <= DIG.base) col = red;
      else if (r <= DIG.rim) {
        col = red;
        slope = 0.55;
      } else if (r <= DIG.jar) {
        col = sand;
        slope = 0.8 * ((r - DIG.rim) / (DIG.jar - DIG.rim));
      } else if (r <= DIG.pit) col = pit;
      else col = soil;
      // Lambert shading from a surface normal tilted outward by the slope.
      const nz = Math.sqrt(Math.max(0, 1 - slope * slope));
      const lit = Math.max(0.15, nx * slope * light[0]! + ny * slope * light[1]! + nz * light[2]! + 0.38);
      const isPot = r <= DIG.jar;
      const grain = (n2(x * 0.6, y * 0.6) - 0.5) * (isPot && r > DIG.rim ? 46 : 18);
      const mottle = isPot ? 0.8 + 0.4 * tex : 0.7 + 0.6 * tex;
      let v: RGB = [col[0] * lit * mottle + grain, col[1] * lit * mottle + grain * 0.8, col[2] * lit * mottle + grain * 0.6];
      // Rim: the broken black band at the basin's lip, now touching the jar.
      if (r > DIG.rim - 0.006 && r <= DIG.rim) {
        const a = (Math.atan2(uy, ux) + Math.PI) / (Math.PI * 2);
        if ((a * 8) % 1 > 0.12) v = [26, 17, 11];
      }
      if (r > DIG.base - 0.002 && r < DIG.base + 0.002) v = v.map((q) => q * 0.82) as RGB;
      // Clinging dirt on the pottery.
      if (isPot && n2(x * 0.09 + 40, y * 0.09) > 0.74) v = mix(v, [112, 84, 56], 0.45);
      if (rand() < 0.0015) v = v.map((q) => q + 35) as RGB;
      const i = (y * size + x) * 4;
      d[i] = v[0];
      d[i + 1] = v[1];
      d[i + 2] = v[2];
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Loess earth covering everything at the start of the dig. Fully opaque. */
export function renderSoil(size = 768, seed = 7): HTMLCanvasElement {
  // Built before the first paint, so it is kept small: 768 px, four octaves.
  const c = canvas(size);
  const g = ctx2d(c);
  const img = g.createImageData(size, size);
  const d = img.data;
  const k = 1024 / size; // keep the same feature size as a 1024 px texture
  const n1raw = makeFbm(seed, 4);
  const n1 = (x: number, y: number) => n1raw(x * k, y * k);
  const n2 = makeFbm(seed + 50, 2);
  const lo: RGB = [84, 61, 38];
  const hi: RGB = [146, 112, 74];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = n1(x * 0.006, y * 0.006);
      const grain = (n2(x * 0.9, y * 0.9) - 0.5) * 34;
      const v = mix(lo, hi, Math.min(1, Math.max(0, (t - 0.25) * 1.6)));
      const i = (y * size + x) * 4;
      d[i] = v[0] + grain;
      d[i + 1] = v[1] + grain * 0.85;
      d[i + 2] = v[2] + grain * 0.6;
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const rand = mulberry32(seed + 9);
  // Pebbles (sizes in 1024-px units, scaled to this texture).
  for (let i = 0; i < 160; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = (1.5 + rand() * 5) / k;
    const grad = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, "rgba(196, 180, 156, 0.9)");
    grad.addColorStop(1, "rgba(70, 56, 42, 0.9)");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.6 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  // Fine roots.
  g.strokeStyle = "rgba(40, 26, 14, 0.5)";
  for (let i = 0; i < 26; i++) {
    let x = rand() * size;
    let y = rand() * size;
    g.lineWidth = 0.6 + rand() * 1.2;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += ((rand() - 0.5) * 60) / k;
      y += ((rand() - 0.5) * 60) / k;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return c;
}

// Shared by scenes 2, 3 and 5: the view from inside the jar, looking up at the basin.
// Also remembers where the lamp has been, so the face assembles from what the
// user has actually seen (R3.2).

import { canvas, holeOffset, urnGeometry } from "../art/pottery";
import { motifLayout } from "../art/face";
import { circleMask } from "../core/coverage";
import type { Env } from "./types";

const SIZE = 1024;
const MEM = 128;

export class UrnView {
  readonly memory = canvas(MEM);
  private mg = this.memory.getContext("2d", { willReadFrequently: true })!;
  private residue = canvas(512);
  private rg = this.residue.getContext("2d")!;
  /** Memory cells that belong to the upright face (the one the story is about). */
  readonly faceMask: Uint8Array;
  readonly faceCenter: { x: number; y: number };
  zoom = 1;
  /** 0 = disk centred; 1 = the hole centred on screen. */
  focus = 0;
  private t = 0;

  constructor() {
    const { cx, cy, R } = urnGeometry(SIZE);
    const f = motifLayout(R).faces[0]!;
    const s = MEM / SIZE;
    this.faceCenter = { x: cx + f.x, y: cy + f.y };
    this.faceMask = circleMask(MEM, (cx + f.x) * s, (cy + f.y - f.r * 0.25) * s, f.r * 1.45 * s);
  }

  resetMemory() {
    this.mg.clearRect(0, 0, MEM, MEM);
    this.rg.clearRect(0, 0, 512, 512);
  }

  /** Screen scale and origin. Zoom pulls toward the hole. */
  layout(env: Env) {
    const breathe = 1 + 0.006 * Math.sin(this.t * 0.45) * env.motion;
    const k = ((Math.min(env.w, env.h) * 0.46) / (SIZE * 0.4)) * breathe * this.zoom;
    const hole = this.holeView();
    // Point in view space that sits at the screen centre: blend from centre to hole.
    const fx = SIZE / 2 + (hole.x - SIZE / 2) * this.focus;
    const fy = SIZE / 2 + (hole.y - SIZE / 2) * this.focus;
    return { k, ox: env.w / 2 - fx * k, oy: env.h / 2 - fy * k };
  }

  holeView() {
    const { cx, cy, R } = urnGeometry(SIZE);
    const o = holeOffset();
    return { x: cx + o.x * R, y: cy + o.y * R };
  }
  toScreen(env: Env, x: number, y: number) {
    const { k, ox, oy } = this.layout(env);
    return { x: ox + x * k, y: oy + y * k };
  }

  update(dt: number, env: Env, remember: boolean) {
    this.t += dt;
    if (!remember) return;
    const { k, ox, oy } = this.layout(env);
    const s = MEM / SIZE;
    const x = ((env.lamp.x - ox) / k) * s;
    const y = ((env.lamp.y - oy) / k) * s;
    const r = ((env.lamp.r * 0.85) / k) * s;
    const g = this.mg;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const a = Math.min(0.5, 0.09 * dt * 60);
    grad.addColorStop(0, `rgba(255,255,255,${a})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  /** Memory alpha per cell (0..255). */
  memoryAlpha(): Uint8Array {
    const d = this.mg.getImageData(0, 0, MEM, MEM).data;
    const out = new Uint8Array(MEM * MEM);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3]!;
    return out;
  }

  /** Refresh the faint after-image of everything seen so far. */
  refreshResidue(art: HTMLCanvasElement) {
    const g = this.rg;
    g.globalCompositeOperation = "source-over";
    g.clearRect(0, 0, 512, 512);
    g.drawImage(art, 0, 0, 512, 512);
    g.globalCompositeOperation = "destination-in";
    g.imageSmoothingEnabled = true;
    g.drawImage(this.memory, 0, 0, 512, 512);
    g.globalCompositeOperation = "source-over";
  }

  drawResidue(g: CanvasRenderingContext2D, env: Env, alpha: number) {
    const { k, ox, oy } = this.layout(env);
    g.globalAlpha = alpha;
    g.drawImage(this.residue, ox, oy, SIZE * k, SIZE * k);
    g.globalAlpha = 1;
  }

  render(g: CanvasRenderingContext2D, env: Env) {
    const { k, ox, oy } = this.layout(env);
    g.drawImage(env.art.urnView, ox, oy, SIZE * k, SIZE * k);
  }

  /** A memory cell of the face not yet seen, nearest the face centre, in screen px. */
  unseenFacePoint(env: Env, alpha: Uint8Array): { x: number; y: number } | null {
    const s = SIZE / MEM;
    let best = -1;
    let bestD = Infinity;
    const fx = this.faceCenter.x / s;
    const fy = this.faceCenter.y / s;
    for (let i = 0; i < alpha.length; i++) {
      if (!this.faceMask[i] || alpha[i]! > 60) continue;
      const x = (i % MEM) + 0.5;
      const y = Math.floor(i / MEM) + 0.5;
      const d = (x - fx) ** 2 + (y - fy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return null;
    return this.toScreen(env, ((best % MEM) + 0.5) * s, (Math.floor(best / MEM) + 0.5) * s);
  }
}

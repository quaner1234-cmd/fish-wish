// Scene 1: brush the earth away in the dark until the jar and its basin lid appear (R2).

import { alphaChannel, circleMask, coverageRatio } from "../core/coverage";
import { DIG, canvas } from "../art/pottery";
import { Cues, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";

const STAGE = 1024;
const SAMPLE = 64;
const DONE_AT = 0.7;
const AUTO_AFTER = 90;

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  r: number;
}

export class DigScene implements Scene {
  readonly exitFade = "black";
  private soil = canvas(STAGE);
  private sg = this.soil.getContext("2d")!;
  private sampler = canvas(SAMPLE);
  private sampG = this.sampler.getContext("2d", { willReadFrequently: true })!;
  private mask = circleMask(SAMPLE, SAMPLE / 2, SAMPLE / 2, DIG.target * SAMPLE);
  private cues = new Cues();
  private coverage = 0;
  private sinceSample = 0;
  private found = false;
  private finish = false;
  private clearing = 0;
  private prev: { x: number; y: number } | null = null;
  private motes: Mote[] = [];
  private brushSpeed = 0;
  private hintPos: { x: number; y: number } | null = null;
  private seed = 1;
  private said = 0;
  private lastQueued = false;

  enter(env: Env) {
    this.sg.globalCompositeOperation = "source-over";
    this.sg.clearRect(0, 0, STAGE, STAGE);
    this.sg.drawImage(env.art.soil, 0, 0, STAGE, STAGE);
    this.cues.reset();
    this.coverage = 0;
    this.found = false;
    this.finish = false;
    this.clearing = 0;
    this.prev = null;
    this.motes = [];
    this.said = 0;
    this.lastQueued = false;
    env.lamp.radius = Math.min(env.w, env.h) * 0.17;
    env.audio.set({ drone: 0.55, earth: 0.9, tension: 0, shimmer: 0, warm: 0, brush: 0 }, 2);
    this.cues.add(1.2, () => env.text.hint.show(env.s.ui.digHint));
  }
  /** Screen → stage mapping. The square stage covers the whole screen. */
  private stage(env: Env) {
    const S = Math.max(env.w, env.h);
    return { S, ox: (env.w - S) / 2, oy: (env.h - S) / 2, k: S / STAGE };
  }

  private stamp(x: number, y: number, r: number, strength = 0.55) {
    const g = this.sg;
    g.globalCompositeOperation = "destination-out";
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(0,0,0,${strength})`);
    grad.addColorStop(0.6, `rgba(0,0,0,${strength * 0.6})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  private rand() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    const { ox, oy, k } = this.stage(env);
    const lx = (env.lamp.x - ox) / k;
    const ly = (env.lamp.y - oy) / k;
    const brushR = (env.lamp.r * 0.55) / k;

    // Brushing (R2.1): only while pressed, only before the jar is found.
    let moved = 0;
    if (!this.found && env.input.pressed) {
      const from = this.prev ?? { x: lx, y: ly };
      const dist = Math.hypot(lx - from.x, ly - from.y);
      const steps = Math.max(1, Math.ceil(dist / (brushR * 0.3)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        this.stamp(from.x + (lx - from.x) * t, from.y + (ly - from.y) * t, brushR, 0.16);
      }
      moved = dist * k;
      this.prev = { x: lx, y: ly };
      if (moved > 0.5) this.spawnMotes(env.lamp.x, env.lamp.y, Math.min(6, 1 + moved / 6));
    } else {
      this.prev = null;
    }
    const speed = dt > 0 ? moved / dt / Math.min(env.w, env.h) : 0;
    this.brushSpeed += (Math.min(1, speed * 0.9) - this.brushSpeed) * Math.min(1, dt * 10);
    env.audio.set({ brush: this.brushSpeed }, 0.08);

    // Fallback after 90 s (R2.5): the earth clears itself over a few seconds.
    if (!this.found && this.cues.t > AUTO_AFTER) {
      for (let i = 0; i < 8; i++) {
        const a = this.rand() * Math.PI * 2;
        const rr = Math.sqrt(this.rand()) * DIG.target * STAGE;
        this.stamp(STAGE / 2 + Math.cos(a) * rr, STAGE / 2 + Math.sin(a) * rr, 46, 0.5);
      }
    }
    // Coverage (R2.3), sampled at low resolution five times a second.
    this.sinceSample += dt;
    if (!this.found && this.sinceSample > 0.2) {
      this.sinceSample = 0;
      this.sampG.clearRect(0, 0, SAMPLE, SAMPLE);
      this.sampG.drawImage(this.soil, 0, 0, SAMPLE, SAMPLE);
      const alpha = alphaChannel(this.sampG.getImageData(0, 0, SAMPLE, SAMPLE).data);
      this.coverage = coverageRatio(alpha, this.mask);
      this.hintPos = this.pickHint(alpha);
      if (this.coverage > 0.12) env.text.hint.hide();
      // Something under the earth notices you (story, not history).
      // If you dig fast, the next line waits for the one still being spoken.
      if (this.said === 0 && this.coverage > 0.15) {
        this.said = 1;
        env.voice.say("digSomeone");
      } else if (this.said === 1 && this.coverage > 0.42) {
        this.said = 2;
        env.voice.say("digLong");
      }
      if (this.coverage >= DONE_AT) this.onFound(env);
    }

    // After discovery, the last earth falls away from the pottery (R2.3).
    if (this.found && this.clearing < 1) {
      this.clearing = Math.min(1, this.clearing + dt / 2.2);
      const g = this.sg;
      g.globalCompositeOperation = "destination-out";
      g.globalAlpha = Math.min(1, dt * 1.6);
      g.fillStyle = "#000";
      g.beginPath();
      g.arc(STAGE / 2, STAGE / 2, DIG.target * STAGE * 1.04, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
    }

    for (const m of this.motes) {
      m.life -= dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.vy += 30 * dt;
      m.vx *= 1 - dt * 1.5;
    }
    this.motes = this.motes.filter((m) => m.life > 0);
    if (this.lastQueued && !this.finish && env.voice.idleFor > 1.6) {
      env.text.narration.hide();
      this.finish = true;
    }
    return this.finish ? "next" : "stay";
  }

  private onFound(env: Env) {
    this.found = true;
    env.text.hint.hide();
    env.audio.set({ brush: 0, earth: 0.5, drone: 0.75 }, 2);
    env.audio.bell(0, 0.05);
    this.cues.after(1.4, () => {
      env.voice.say("digCareful", { gap: 1.5 });
      this.lastQueued = true;
    });
  }

  private pickHint(alpha: Uint8Array): { x: number; y: number } | null {
    // The covered target cell closest to the centre, so the glimmer leads inward.
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < alpha.length; i++) {
      if (!this.mask[i] || alpha[i]! < 200) continue;
      const x = (i % SAMPLE) + 0.5 - SAMPLE / 2;
      const y = Math.floor(i / SAMPLE) + 0.5 - SAMPLE / 2;
      const d = x * x + y * y;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best < 0) return null;
    return { x: ((best % SAMPLE) + 0.5) / SAMPLE, y: (Math.floor(best / SAMPLE) + 0.5) / SAMPLE };
  }

  private spawnMotes(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2;
      const v = 20 + this.rand() * 70;
      this.motes.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 25, life: 0.5 + this.rand() * 0.9, r: 0.6 + this.rand() * 1.8 });
    }
    if (this.motes.length > 260) this.motes.splice(0, this.motes.length - 260);
  }

  render(g: CanvasRenderingContext2D, env: Env) {
    const { S, ox, oy } = this.stage(env);
    g.drawImage(env.art.digObjects, ox, oy, S, S);
    g.drawImage(this.soil, ox, oy, S, S);
    g.fillStyle = "rgba(150, 118, 80, 0.85)";
    for (const m of this.motes) {
      g.globalAlpha = Math.min(1, m.life * 1.4);
      g.beginPath();
      g.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  lighting(): Lighting {
    // Once found, a little more of the jar becomes visible around the lamp.
    return { ambient: 0.035 + 0.14 * this.clearing, lamp: 1, warm: 0.85 };
  }

  fx(): Fx {
    return { dust: 0.55, glow: 0.55 };
  }

  hint(env: Env) {
    if (this.found || !this.hintPos) return null;
    const { S, ox, oy } = this.stage(env);
    return { x: ox + this.hintPos.x * S, y: oy + this.hintPos.y * S };
  }

  exit(env: Env) {
    env.audio.set({ brush: 0 }, 0.2);
    env.text.clear();
  }
}

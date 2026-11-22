// Scene 5: the same face, in warm light. Nothing about the picture changes (R6.1).
// Only the light moves: when the face speaks of its closed eyes, the light rests on them.
// At the last line (D-014) the fish the face holds fill with light, and a fish of light
// leaves each one and swims slowly round the basin. The painted fish stay where they are.

import { swimmerPath } from "../art/swim";
import { Cues, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";
import type { UrnView } from "./urnview";

const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
/** Seconds the light stays inside the painted fish before it swims off. */
const DETACH = 1.4;

interface Swimmer {
  x: number;
  y: number;
  heading: number;
  len: number;
  girth: number;
  speed: number;
  phase: number;
}

export class AgainScene implements Scene {
  readonly exitFade = "none";
  private cues = new Cues();
  private warmth = 0;
  private eyes = 0;
  private eyesTarget = 0;
  private queued = false;
  private finish = false;
  /** Seconds since the fish woke; −1 before that. */
  private swim = -1;
  private fish: Swimmer[] = [];

  constructor(private view: UrnView) {}

  enter(env: Env) {
    this.cues.reset();
    this.warmth = 0;
    this.eyes = 0;
    this.eyesTarget = 0;
    this.queued = false;
    this.finish = false;
    this.swim = -1;
    this.fish = [];
    this.view.zoom = 1;
    this.view.focus = 0;
    env.lamp.radius = Math.min(env.w, env.h) * 0.2;
    env.audio.set({ warm: 0.85, drone: 0.12, earth: 0.08, tension: 0, shimmer: 0.25, brush: 0 }, 4);
    this.cues.add(1.5, () => {
      env.voice.say("lookAgain", { gap: 0 });
      env.voice.say("eyesClosed", { gap: 2.2, onStart: () => (this.eyesTarget = 1) });
      env.voice.say("promise", { gap: 2, onStart: () => (this.eyesTarget = 0) });
      env.voice.say("stillDoes", {
        gap: 2.2,
        onStart: () => {
          env.audio.bell(2, 0.04);
          this.cues.after(0.8, () => this.wake(env));
        },
      });
      this.queued = true;
    });
  }

  private wake(env: Env) {
    this.swim = 0;
    this.fish = this.view.heldFish().map((f, i) => ({ ...f, speed: 0, phase: i * 1.9 }));
    env.audio.bell(4, 0.025);
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    // A little longer than the other scenes, so the fish can be seen swimming before the card.
    if (this.queued && env.voice.idleFor > 5) this.finish = true;
    this.view.update(dt, env, false);
    this.warmth = Math.min(1, this.warmth + dt / 10);
    this.eyes += (this.eyesTarget - this.eyes) * Math.min(1, dt * 0.8);
    if (this.swim >= 0) this.swimOn(dt, env);
    return this.finish ? "next" : "stay";
  }

  /**
   * Each fish turns away from the mouth and follows a slow circle round the basin,
   * the way the big painted fish already point (clockwise on screen).
   */
  private swimOn(dt: number, env: Env) {
    this.swim += dt;
    const t = this.swim - DETACH;
    if (t <= 0) return;
    const { cx, cy, R } = this.view.disk();
    const vmax = R * 0.13 * (env.reduced ? 0.5 : 1);
    this.fish.forEach((f, i) => {
      f.speed = vmax * smooth(t / 2.5);
      const a = Math.atan2(f.y - cy, f.x - cx);
      const orbit = R * (0.74 + 0.03 * Math.sin(this.swim * 0.5 + i * 1.7));
      const want = Math.atan2(cy + Math.sin(a + 0.55) * orbit - f.y, cx + Math.cos(a + 0.55) * orbit - f.x);
      let d = want - f.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const turn = 1.1 * dt * (0.3 + 0.7 * smooth(t / 1.5));
      f.heading += Math.max(-turn, Math.min(turn, d));
      f.x += Math.cos(f.heading) * f.speed * dt;
      f.y += Math.sin(f.heading) * f.speed * dt;
      f.phase += dt * (2 + 6 * (f.speed / vmax));
    });
  }

  /** The fish of light, drawn over the lit scene. */
  private drawFish(g: CanvasRenderingContext2D, env: Env) {
    const { k } = this.view.layout(env);
    const alpha = 0.36 * smooth(this.swim / 1.2);
    const amp = 0.09 * smooth((this.swim - DETACH) / 2) * (env.reduced ? 0.3 : 1);
    // Soft and see-through, so they read as light rather than as more paint.
    g.shadowColor = `rgba(255, 176, 96, ${Math.min(1, alpha * 2)})`;
    g.shadowBlur = 24 * k;
    g.fillStyle = `rgba(255, 212, 150, ${alpha})`;
    for (const f of this.fish) {
      const p = this.view.toScreen(env, f.x, f.y);
      g.save();
      g.translate(p.x, p.y);
      g.rotate(f.heading);
      g.scale(k, k);
      g.fill(swimmerPath(f.len, f.girth, f.phase, amp));
      g.restore();
    }
    g.shadowBlur = 0;
    g.shadowColor = "rgba(0, 0, 0, 0)";
  }

  render(g: CanvasRenderingContext2D, env: Env) {
    this.view.render(g, env);
  }
  lighting(env: Env): Lighting {
    const w = this.warmth;
    return {
      ambient: 0.1 + 0.48 * w,
      lamp: 0.8,
      warm: 1,
      over: (g) => {
        const { k } = this.view.layout(env);
        const glow = (x: number, y: number, r: number, stops: Array<[number, string]>) => {
          const grad = g.createRadialGradient(x, y, 0, x, y, r);
          for (const [o, c] of stops) grad.addColorStop(o, c);
          g.fillStyle = grad;
          g.fillRect(x - r, y - r, r * 2, r * 2);
        };
        g.globalCompositeOperation = "lighter";
        // Daylight through the hole, now warm gold.
        const h = this.view.holeView();
        const p = this.view.toScreen(env, h.x, h.y);
        glow(p.x, p.y, Math.min(env.w, env.h) * 0.08, [[0, "rgba(255, 236, 196, 0.95)"], [0.08, "rgba(255, 214, 150, 0.6)"], [1, "rgba(255, 200, 130, 0)"]]);
        // The closed eyes, softly lit while the face speaks of them.
        if (this.eyes > 0.01) {
          const e = this.view.toScreen(env, this.view.faceCenter.x, this.view.faceCenter.y + 6);
          glow(e.x, e.y, 95 * k, [[0, `rgba(255, 220, 170, ${0.32 * this.eyes})`], [1, "rgba(255, 220, 170, 0)"]]);
        }
        if (this.swim >= 0) this.drawFish(g, env);
        g.globalCompositeOperation = "source-over";
      },
    };
  }

  fx(env: Env): Fx {
    const h = this.view.holeView();
    const p = this.view.toScreen(env, h.x, h.y);
    return { dust: 0.6, glow: 0.35, beam: { x: p.x, y: p.y, r: Math.min(env.w, env.h) * 0.22, i: 0.8 } };
  }

  hint() {
    return null;
  }

  exit() {}
}

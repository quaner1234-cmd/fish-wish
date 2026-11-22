// Scene 5: the same face, in warm light. Nothing about the picture changes (R6.1).
// Only the light moves: when the face speaks of its closed eyes, the light rests on them.

import { Cues, speak, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";
import type { UrnView } from "./urnview";

export class AgainScene implements Scene {
  readonly exitFade = "none";
  private cues = new Cues();
  private warmth = 0;
  private eyes = 0;
  private eyesTarget = 0;
  private finish = false;

  constructor(private view: UrnView) {}

  enter(env: Env) {
    this.cues.reset();
    this.warmth = 0;
    this.eyes = 0;
    this.eyesTarget = 0;
    this.finish = false;
    this.view.zoom = 1;
    this.view.focus = 0;
    env.lamp.radius = Math.min(env.w, env.h) * 0.2;
    env.audio.set({ warm: 0.85, drone: 0.12, earth: 0.08, tension: 0, shimmer: 0.25, brush: 0 }, 4);
    const st = env.s.story;
    this.cues.add(1.5, () => speak(env, st.lookAgain));
    this.cues.add(6.5, () => {
      this.eyesTarget = 1;
      speak(env, st.eyesClosed);
    });
    this.cues.add(13, () => {
      this.eyesTarget = 0;
      speak(env, st.promise);
    });
    this.cues.add(20, () => {
      speak(env, st.stillDoes);
      env.audio.bell(2, 0.04);
    });
    this.cues.add(26.5, () => (this.finish = true));
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    this.view.update(dt, env, false);
    this.warmth = Math.min(1, this.warmth + dt / 10);
    this.eyes += (this.eyesTarget - this.eyes) * Math.min(1, dt * 0.8);
    return this.finish ? "next" : "stay";
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

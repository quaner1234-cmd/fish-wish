// Scene 3: a small hole in the basin lets in light. Two readings of why (R4).

import { Cues, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";
import type { UrnView } from "./urnview";

export class HoleScene implements Scene {
  readonly exitFade = "pale";
  private cues = new Cues();
  private light = 0;
  private dwell = 0;
  private told = false;
  private ready = false;
  private zooming = 0;
  private finish = false;
  private sinceResidue = 0;

  constructor(private view: UrnView) {}

  enter(env: Env) {
    this.cues.reset();
    this.light = 0;
    this.dwell = 0;
    this.told = false;
    this.ready = false;
    this.zooming = 0;
    this.finish = false;
    this.view.zoom = 1;
    this.view.focus = 0;
    env.lamp.radius = Math.min(env.w, env.h) * 0.12;
    env.audio.set({ tension: 0.25, drone: 0.7, shimmer: 0 }, 3);
    this.cues.add(2.2, () => env.text.hint.show(env.s.ui.holeHint));
  }

  private holeScreen(env: Env) {
    const h = this.view.holeView();
    return this.view.toScreen(env, h.x, h.y);
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    this.view.update(dt, env, this.zooming === 0);
    this.sinceResidue += dt;
    if (this.sinceResidue > 0.3) {
      this.sinceResidue = 0;
      this.view.refreshResidue(env.art.urnView);
    }
    this.light = Math.min(1, this.light + dt / 2.5);
    const hs = this.holeScreen(env);
    const over = Math.hypot(env.lamp.x - hs.x, env.lamp.y - hs.y) < Math.max(22, env.lamp.r * 0.4);
    this.dwell = over ? this.dwell + dt : Math.max(0, this.dwell - dt * 0.5);
    env.audio.set({ shimmer: this.light * (0.55 + Math.min(1, this.dwell) * 0.45) }, 0.4);

    // R4.2: the light found, the hole explained, both readings labelled (R4.3).
    if (!this.told && this.dwell >= 1) {
      this.told = true;
      env.text.hint.hide();
      env.audio.bell(3, 0.045);
      env.audio.set({ tension: 0, drone: 0.5 }, 4);
      this.cues.after(0.3, () => {
        env.voice.say("fatherHole", { gap: 0 });
        env.voice.say("motherSoul", { gap: 1.3 });
        env.voice.say("fatherBreathe", { gap: 1.5 });
        env.voice.say("followLight", {
          gap: 1.6,
          onStart: () => {
            env.text.hint.show(env.s.ui.continue);
            this.ready = true;
          },
        });
      });
    }
    // R4.4: continue on click / Enter, or by itself a few seconds after the last line.
    if (this.ready && this.zooming === 0 && (env.input.confirmed || env.voice.idleFor > 4)) {
      this.zooming = 0.0001;
      env.text.clear();
      env.audio.set({ shimmer: 1, warm: 0.4, drone: 0.2 }, 2.5);
    }
    if (this.zooming > 0) {
      this.zooming = Math.min(1, this.zooming + dt / (env.reduced ? 1.2 : 3));
      const e = this.zooming * this.zooming * (3 - 2 * this.zooming);
      this.view.zoom = 1 + (env.reduced ? 1.5 : 9) * e;
      this.view.focus = Math.min(1, e * 1.6);
      if (this.zooming >= 1) this.finish = true;
    }
    return this.finish ? "next" : "stay";
  }
  render(g: CanvasRenderingContext2D, env: Env) {
    this.view.render(g, env);
  }

  lighting(env: Env): Lighting {
    const z = this.zooming;
    return {
      ambient: 0.012 + z * z * 0.6,
      lamp: 1 - z,
      warm: 0.75,
      under: (g) => this.view.drawResidue(g, env, 0.12 * (1 - z)),
      over: (g) => this.drawLight(g, env),
    };
  }

  /** The hole: a pale point of daylight with a soft halo, growing as we rise into it. */
  private drawLight(g: CanvasRenderingContext2D, env: Env) {
    const hs = this.holeScreen(env);
    const { k } = this.view.layout(env);
    const pulse = 1 + 0.08 * Math.sin(this.cues.t * 1.3) * env.motion;
    const core = Math.max(2, 4.5 * k * 2) * pulse;
    const halo = core * (9 + this.zooming * 30);
    const a = this.light;
    const grad = g.createRadialGradient(hs.x, hs.y, 0, hs.x, hs.y, halo);
    grad.addColorStop(0, `rgba(255, 250, 236, ${a})`);
    grad.addColorStop(core / halo, `rgba(255, 240, 210, ${0.85 * a})`);
    grad.addColorStop(Math.min(0.99, (core * 2.5) / halo), `rgba(240, 214, 170, ${0.25 * a})`);
    grad.addColorStop(1, "rgba(240, 214, 170, 0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = grad;
    g.fillRect(hs.x - halo, hs.y - halo, halo * 2, halo * 2);
    g.globalCompositeOperation = "source-over";
    if (this.zooming > 0.55) {
      const w = (this.zooming - 0.55) / 0.45;
      g.fillStyle = `rgba(246, 238, 222, ${w * w})`;
      g.fillRect(0, 0, env.w, env.h);
    }
  }

  fx(env: Env): Fx {
    const hs = this.holeScreen(env);
    return { dust: 0.45, glow: 0.4 * (1 - this.zooming), beam: { x: hs.x, y: hs.y, r: Math.min(env.w, env.h) * (0.12 + this.zooming), i: this.light } };
  }

  hint(env: Env) {
    return this.told ? null : this.holeScreen(env);
  }

  exit(env: Env) {
    env.text.clear();
  }
}

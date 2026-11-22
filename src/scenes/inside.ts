// Scene 2: inside the jar, looking up. A face, painted on the inside of the basin,
// comes together only where the lamp has been (R3). No jump scares (R3.3).
// It begins at the hole the light went in by (D-013), then pulls back to show the
// whole basin from below. The light inside is not the digger's lamp any more: it is
// the small, steady light of "you" (see SOUL in urnview.ts).

import { follow } from "../core/lamp";
import { Cues, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";
import { SOUL, type UrnView } from "./urnview";

const smooth = (t: number) => t * t * (3 - 2 * t);

export class InsideScene implements Scene {
  readonly exitFade = "none";
  private cues = new Cues();
  private sinceSample = 0;
  private reveal = 0;
  private told = false;
  private queued = false;
  private flinched = false;
  private finish = false;
  private hintPos: { x: number; y: number } | null = null;
  private dread = 0;
  /** 0..1: from close on the hole back to the whole basin. */
  private pull = 0;
  /** While true the scene moves the light itself: out of the hole, then over to the pointer. */
  private guiding = true;
  /** Where the pointer was when the scene began; the light waits until it moves. */
  private inputAt = { x: 0, y: 0 };
  private moved = false;
  private freeT = 0;
  private lampPos = { x: 0, y: 0 };

  constructor(private view: UrnView) {}

  private pullSeconds(env: Env) {
    return env.reduced ? 1.2 : 3.6;
  }

  private applyPull(env: Env) {
    const u = 1 - smooth(this.pull);
    this.view.zoom = Math.pow(env.reduced ? 2.5 : 10, u);
    this.view.focus = Math.min(1, u * 1.6);
  }

  private holeScreen(env: Env) {
    const h = this.view.holeView();
    return this.view.toScreen(env, h.x, h.y);
  }

  enter(env: Env) {
    this.cues.reset();
    this.view.resetMemory();
    this.reveal = 0;
    this.told = false;
    this.queued = false;
    this.flinched = false;
    this.finish = false;
    this.dread = 0;
    this.pull = 0;
    this.guiding = true;
    this.inputAt = { x: env.input.x, y: env.input.y };
    this.moved = false;
    this.freeT = 0;
    this.applyPull(env);
    this.lampPos = this.holeScreen(env);
    env.lamp.place(this.lampPos.x, this.lampPos.y);
    env.lamp.radius = Math.min(env.w, env.h) * SOUL.radius;
    env.audio.set({ drone: 0.85, earth: 0.25, tension: 0, brush: 0, shimmer: 0, warm: 0 }, 2.5);
    const t = this.pullSeconds(env);
    this.cues.add(t + 0.4, () => env.text.hint.show(env.s.ui.lookUp));
    this.cues.add(t + 4.6, () => env.text.hint.hide());
  }

  /**
   * The light comes out of the hole with the view and waits there. Once the user
   * moves, it drifts over to where they point, then follows as usual.
   */
  private guide(dt: number, env: Env) {
    if (!this.moved && Math.hypot(env.input.x - this.inputAt.x, env.input.y - this.inputAt.y) > 6) this.moved = true;
    if (this.pull < 1) {
      this.pull = Math.min(1, this.pull + dt / this.pullSeconds(env));
      this.applyPull(env);
      this.lampPos = this.holeScreen(env);
    } else if (!this.moved) {
      this.lampPos = this.holeScreen(env);
    } else {
      this.freeT += dt;
      this.lampPos.x = follow(this.lampPos.x, env.input.x, dt, 2.4);
      this.lampPos.y = follow(this.lampPos.y, env.input.y, dt, 2.4);
      const close = Math.hypot(this.lampPos.x - env.input.x, this.lampPos.y - env.input.y) < 4;
      if (close || this.freeT > 3) this.guiding = false;
    }
    env.lamp.place(this.lampPos.x, this.lampPos.y);
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    if (this.guiding) this.guide(dt, env);
    this.view.update(dt, env, true);
    this.sinceSample += dt;
    if (this.sinceSample > 0.25) {
      this.sinceSample = 0;
      const alpha = this.view.memoryAlpha();
      let total = 0;
      let seen = 0;
      for (let i = 0; i < alpha.length; i++) {
        if (!this.view.faceMask[i]) continue;
        total++;
        if (alpha[i]! > 60) seen++;
      }
      this.reveal = total ? seen / total : 0;
      this.hintPos = this.view.unseenFacePoint(env, alpha);
      this.view.refreshResidue(env.art.urnView);
    }

    // The first time the light falls on the face, the flame shivers (R3.3: no jump scare).
    const fc = this.view.toScreen(env, this.view.faceCenter.x, this.view.faceCenter.y);
    const near = Math.hypot(env.lamp.x - fc.x, env.lamp.y - fc.y) < env.lamp.r * 0.7;
    if (near && !this.flinched) {
      this.flinched = true;
      env.lamp.shiver = 0.78;
      env.text.hint.hide();
      env.voice.say("thereYouAre", { gap: 0 });
    }
    const target = Math.min(1, this.reveal * 1.2) * (near ? 1 : 0.6);
    this.dread += (target - this.dread) * Math.min(1, dt * 1.5);
    env.audio.set({ tension: this.dread, drone: 0.85 - this.dread * 0.25 }, 0.6);

    if (!this.told && this.reveal >= 0.6) {
      this.told = true;
      env.text.hint.hide();
      // "There you are." comes the first time the light finds the face; then the rest.
      if (!this.flinched) {
        this.flinched = true;
        env.voice.say("thereYouAre", { gap: 0 });
      }
      this.cues.after(1.2, () => {
        env.voice.say("dontBeAfraid", { gap: 1.8 });
        env.voice.say("motherMade", { gap: 1.4 });
        env.voice.say("fishToHold", { gap: 1.2 });
        this.queued = true;
      });
    }
    if (this.queued && !this.finish && env.voice.idleFor > 2) {
      env.text.narration.hide();
      this.finish = true;
    }
    return this.finish ? "next" : "stay";
  }
  render(g: CanvasRenderingContext2D, env: Env) {
    this.view.render(g, env);
  }

  lighting(env: Env): Lighting {
    return {
      ambient: 0.012,
      lamp: 1,
      warm: SOUL.warm,
      flicker: SOUL.flicker,
      under: (g) => this.view.drawResidue(g, env, 0.12),
    };
  }

  fx(): Fx {
    return { dust: 0.3, glow: SOUL.glow };
  }

  hint() {
    return this.told || this.pull < 1 ? null : this.hintPos;
  }

  exit(env: Env) {
    env.text.hint.hide();
  }
}

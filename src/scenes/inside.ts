// Scene 2: inside the jar, looking up. A face, painted on the inside of the basin,
// comes together only where the lamp has been (R3). No jump scares (R3.3).

import { Cues, speak, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";
import type { UrnView } from "./urnview";

export class InsideScene implements Scene {
  readonly exitFade = "none";
  private cues = new Cues();
  private sinceSample = 0;
  private reveal = 0;
  private told = false;
  private flinched = false;
  private finish = false;
  private hintPos: { x: number; y: number } | null = null;
  private dread = 0;

  constructor(private view: UrnView) {}

  enter(env: Env) {
    this.cues.reset();
    this.view.zoom = 1;
    this.view.focus = 0;
    this.view.resetMemory();
    this.reveal = 0;
    this.told = false;
    this.flinched = false;
    this.finish = false;
    this.dread = 0;
    env.lamp.radius = Math.min(env.w, env.h) * 0.12;
    env.audio.set({ drone: 0.85, earth: 0.25, tension: 0, brush: 0, shimmer: 0, warm: 0 }, 2.5);
    this.cues.add(1.2, () => env.text.hint.show(env.s.ui.lookUp));
    this.cues.add(5.5, () => env.text.hint.hide());
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
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
      speak(env, env.s.story.thereYouAre);
    }
    const target = Math.min(1, this.reveal * 1.2) * (near ? 1 : 0.6);
    this.dread += (target - this.dread) * Math.min(1, dt * 1.5);
    env.audio.set({ tension: this.dread, drone: 0.85 - this.dread * 0.25 }, 0.6);

    if (!this.told && this.reveal >= 0.6) {
      this.told = true;
      env.text.hint.hide();
      const st = env.s.story;
      // "There you are." comes the first time the light finds the face; then the rest.
      let d = 1.2;
      if (!this.flinched) {
        this.flinched = true;
        speak(env, st.thereYouAre);
        d = 4.5;
      }
      this.cues.after(d, () => speak(env, st.dontBeAfraid));
      this.cues.after(d + 6, () => speak(env, st.motherMade));
      this.cues.after(d + 12, () => speak(env, st.fishToHold));
      this.cues.after(d + 18.5, () => {
        env.text.narration.hide();
        this.finish = true;
      });
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
      warm: 0.8,
      under: (g) => this.view.drawResidue(g, env, 0.12),
    };
  }

  fx(): Fx {
    return { dust: 0.3, glow: 0.45 };
  }

  hint() {
    return this.told ? null : this.hintPos;
  }

  exit(env: Env) {
    env.text.hint.hide();
  }
}

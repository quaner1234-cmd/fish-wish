// Before the story: darkness, a dim lamp that already follows the user, and the start screen (R1.1).

import type { Env, Fx, Lighting, Scene, Signal } from "./types";

export class StartScene implements Scene {
  readonly exitFade = "black";

  enter(env: Env) {
    env.lamp.radius = Math.min(env.w, env.h) * 0.22;
  }

  update(): Signal {
    return "stay";
  }

  render(g: CanvasRenderingContext2D, env: Env) {
    // Earth, barely visible where the lamp falls.
    const S = Math.max(env.w, env.h);
    g.drawImage(env.art.soil, (env.w - S) / 2, (env.h - S) / 2, S, S);
  }

  lighting(): Lighting {
    return { ambient: 0, lamp: 0.35, warm: 0.9 };
  }

  fx(): Fx {
    return { dust: 0.35, glow: 0.3 };
  }

  hint() {
    return null;
  }

  exit() {}
}

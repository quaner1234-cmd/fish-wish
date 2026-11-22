import type { Input } from "../core/input";
import type { Lamp } from "../core/lamp";
import type { TextLayer } from "../core/text";
import type { AudioEngine } from "../core/audio";
import type strings from "../content/strings.json";

export type Strings = typeof strings;

export interface Art {
  urnView: HTMLCanvasElement;
  digObjects: HTMLCanvasElement;
  soil: HTMLCanvasElement;
}

export interface Env {
  w: number;
  h: number;
  input: Input;
  lamp: Lamp;
  text: TextLayer;
  audio: AudioEngine;
  s: Strings;
  art: Art;
  motion: number;
  reduced: boolean;
}

export interface Lighting {
  /** Brightness outside the lamp, 0..1. */
  ambient: number;
  /** Lamp strength, 0..1. */
  lamp: number;
  /** Warmth of the light, 0..1. */
  warm: number;
  /** Drawn under the lit scene (e.g. what the eye remembers). */
  under?: (g: CanvasRenderingContext2D) => void;
  /** Drawn over it (light sources that are not the lamp). */
  over?: (g: CanvasRenderingContext2D) => void;
}

export interface Fx {
  dust: number;
  glow: number;
  beam?: { x: number; y: number; r: number; i: number };
}

export type Signal = "stay" | "next";

export interface Scene {
  /** Colour to fade through when this scene ends. */
  readonly exitFade: "black" | "pale" | "none";
  enter(env: Env): void;
  update(dt: number, env: Env): Signal;
  render(g: CanvasRenderingContext2D, env: Env): void;
  lighting(env: Env): Lighting;
  fx(env: Env): Fx;
  /** Where to place a quiet glimmer if the user has been idle (R1.5). */
  hint(env: Env): { x: number; y: number } | null;
  exit(env: Env): void;
}

/** The face speaks: its line arrives letter by letter, over a faint breath. */
export function speak(env: Env, text: string) {
  env.text.narration.show(text, true);
  env.audio.breath();
}

/** Timed cues on scene time, so pausing the story pauses them too. */
export class Cues {
  t = 0;
  private list: Array<{ at: number; fn: () => void; done: boolean }> = [];
  add(at: number, fn: () => void) {
    this.list.push({ at, fn, done: false });
  }
  /** Add relative to now. */
  after(delay: number, fn: () => void) {
    this.add(this.t + delay, fn);
  }
  update(dt: number) {
    this.t += dt;
    for (const c of this.list) {
      if (!c.done && this.t >= c.at) {
        c.done = true;
        c.fn();
      }
    }
  }
  reset() {
    this.t = 0;
    this.list = [];
  }
}

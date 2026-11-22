// The lamp: the user's only light (R1). Smoothly follows its target.

export function follow(current: number, target: number, dt: number, rate: number): number {
  const k = 1 - Math.exp(-Math.max(0, dt) * rate);
  return current + (target - current) * k;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export class Lamp {
  x = 0;
  y = 0;
  /** Base radius in CSS px, set by the scene. */
  radius = 120;
  /** Momentary scale (a flame shiver). Eases back to 1. */
  shiver = 1;
  /** 0..1, how strongly the lamp lights the scene. */
  strength = 1;
  /** 0..1, how much of the flame flicker shows. Set each frame from the scene's lighting. */
  flicker = 1;
  private t = 0;

  place(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update(dt: number, tx: number, ty: number, w: number, h: number, motion: number) {
    this.t += dt;
    this.x = clamp(follow(this.x, tx, dt, 11), 0, w);
    this.y = clamp(follow(this.y, ty, dt, 11), 0, h);
    this.shiver = follow(this.shiver, 1, dt, 2.2);
    // Flame flicker: two slow sines and a faster one. Off with reduced motion.
    this.flick = motion * (0.022 * Math.sin(this.t * 7.3) + 0.014 * Math.sin(this.t * 13.1 + 1.7) + 0.01 * Math.sin(this.t * 2.1));
  }

  private flick = 0;

  /** Current light radius including flicker and shiver. */
  get r(): number {
    return this.radius * this.shiver * (1 + this.flick * this.flicker);
  }
}

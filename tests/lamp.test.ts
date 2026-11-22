import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { Lamp, clamp, follow } from "../src/core/lamp";

describe("lamp", () => {
  it("follows its target smoothly and converges", () => {
    let x = 0;
    for (let i = 0; i < 120; i++) x = follow(x, 100, 1 / 60, 11);
    expect(x).toBeGreaterThan(99.9);
    expect(follow(0, 100, 0, 11)).toBe(0);
  });

  it("never overshoots", () => {
    fc.assert(
      fc.property(fc.double({ min: -1e4, max: 1e4, noNaN: true }), fc.double({ min: -1e4, max: 1e4, noNaN: true }), fc.double({ min: 0, max: 1, noNaN: true }), (cur, tgt, dt) => {
        const n = follow(cur, tgt, dt, 11);
        expect(n).toBeGreaterThanOrEqual(Math.min(cur, tgt) - 1e-9);
        expect(n).toBeLessThanOrEqual(Math.max(cur, tgt) + 1e-9);
      }),
    );
  });

  it("stays on screen and has no flicker with reduced motion", () => {
    const lamp = new Lamp();
    lamp.radius = 100;
    for (let i = 0; i < 300; i++) lamp.update(1 / 60, 5000, -5000, 800, 600, 0);
    expect(lamp.x).toBeLessThanOrEqual(800);
    expect(lamp.y).toBeGreaterThanOrEqual(0);
    expect(lamp.r).toBeCloseTo(100, 5);
    expect(clamp(5, 0, 1)).toBe(1);
  });
});

import { describe, expect, it } from "vitest";
import { DIG, digHole, holeOffset } from "../src/art/pottery";

// D-013: the hole seen from above (act 1) is the same hole seen from below (acts 2-3).
describe("the hole in the lid", () => {
  it("is mirrored left-right between the view from above and the view from inside", () => {
    const o = holeOffset();
    const h = digHole();
    expect(Math.sign(h.x)).toBe(-Math.sign(o.x));
    expect(h.x / DIG.rim).toBeCloseTo(-o.x, 10);
    expect(h.y / DIG.rim).toBeCloseTo(o.y, 10);
  });

  it("sits on the basin, inside the area the dig clears", () => {
    const h = digHole();
    const d = Math.hypot(h.x, h.y);
    expect(d).toBeGreaterThan(DIG.base);
    expect(d + h.r).toBeLessThan(DIG.rim);
    expect(d + h.r).toBeLessThan(DIG.target);
  });
});

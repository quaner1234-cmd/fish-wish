import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { alphaChannel, circleMask, coverageRatio } from "../src/core/coverage";

describe("dig coverage (R2.3)", () => {
  it("is 0 when covered, 1 when cleared, 0 for an empty mask", () => {
    const mask = circleMask(16, 8, 8, 5);
    expect(coverageRatio(new Uint8Array(256).fill(255), mask)).toBe(0);
    expect(coverageRatio(new Uint8Array(256).fill(0), mask)).toBe(1);
    expect(coverageRatio(new Uint8Array(256), new Uint8Array(256))).toBe(0);
  });

  it("ignores cells outside the mask", () => {
    const mask = new Uint8Array([1, 1, 0, 0]);
    expect(coverageRatio(new Uint8Array([0, 255, 0, 0]), mask)).toBe(0.5);
  });

  it("reads the alpha channel from RGBA", () => {
    expect([...alphaChannel(new Uint8ClampedArray([1, 2, 3, 40, 5, 6, 7, 80]))]).toEqual([40, 80]);
  });

  // Property: brushing only ever removes earth, so coverage never goes down.
  it("never decreases as earth is removed", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 64, maxLength: 64 }),
        fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 64, maxLength: 64 }),
        fc.array(fc.boolean(), { minLength: 64, maxLength: 64 }),
        (before, brush, m) => {
          const mask = Uint8Array.from(m, (b) => (b ? 1 : 0));
          const after = before.map((a, i) => Math.max(0, a - brush[i]!));
          expect(coverageRatio(after, mask)).toBeGreaterThanOrEqual(coverageRatio(before, mask));
        },
      ),
    );
  });
});

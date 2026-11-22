import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { LAST, RESTART_INDEX, SCENE_ORDER, initialState, reduce, type Command } from "../src/core/machine";

const command = fc.constantFrom<Command>("next", "skip", "pause", "resume", "restart");

describe("scene machine", () => {
  it("walks the scenes in order", () => {
    let s = initialState();
    const seen = [SCENE_ORDER[s.index]];
    while (!s.finished) {
      s = reduce(s, "next");
      if (!s.finished) seen.push(SCENE_ORDER[s.index]);
    }
    expect(seen).toEqual([...SCENE_ORDER]);
  });

  it("does not move while paused", () => {
    let s = reduce(reduce(initialState(), "next"), "pause");
    expect(s.paused).toBe(true);
    s = reduce(reduce(s, "next"), "skip");
    expect(s.index).toBe(1);
  });

  it("only restarts once finished, and restarts at dig", () => {
    const mid = reduce(reduce(initialState(), "next"), "next");
    expect(reduce(mid, "restart")).toEqual(mid);
    let s = initialState();
    for (let i = 0; i <= LAST; i++) s = reduce(s, "next");
    expect(s.finished).toBe(true);
    const r = reduce(s, "restart");
    expect(r.index).toBe(RESTART_INDEX);
    expect(r.plays).toBe(2);
  });

  // Property (design §9): under any command sequence the story never skips a scene,
  // never goes backward except by restart, and stays within bounds.
  it("never skips or goes backward", () => {
    fc.assert(
      fc.property(fc.array(command, { maxLength: 200 }), (cmds) => {
        let s = initialState();
        for (const c of cmds) {
          const n = reduce(s, c);
          expect(n.index).toBeGreaterThanOrEqual(0);
          expect(n.index).toBeLessThanOrEqual(LAST);
          if (n.plays === s.plays) {
            expect(n.index - s.index === 0 || n.index - s.index === 1).toBe(true);
          } else {
            expect(c).toBe("restart");
            expect(s.finished).toBe(true);
            expect(n.index).toBe(RESTART_INDEX);
          }
          if (s.paused && (c === "next" || c === "skip")) expect(n.index).toBe(s.index);
          s = n;
        }
      }),
    );
  });
});

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import strings from "../src/content/strings.json";
import { GAP, Narrator, lineSeconds, type LineId, type VoiceOut } from "../src/core/narrator";

function rig() {
  const log: string[] = [];
  const out: VoiceOut = {
    show: (text) => log.push(`show:${text}`),
    breath: () => log.push("breath"),
  };
  const n = new Narrator(out, (id) => strings.story[id]);
  const run = (seconds: number, step = 0.05) => {
    for (let t = 0; t < seconds - 1e-9; t += step) n.update(step);
  };
  return { n, log, run };
}

const ids = Object.keys(strings.story) as LineId[];
const len = (id: LineId) => lineSeconds(strings.story[id]);

describe("line timing", () => {
  it("every story line gets a readable, bounded length", () => {
    for (const id of ids) {
      expect(len(id), id).toBeGreaterThan(1.5);
      expect(len(id), id).toBeLessThan(10);
    }
  });

  it("longer lines last longer", () => {
    expect(len("digLong")).toBeGreaterThan(len("lookAgain"));
  });
});

describe("narrator", () => {
  it("says queued lines in order, each after the previous one ends", () => {
    const { n, log, run } = rig();
    n.say("lookAgain");
    n.say("eyesClosed");
    run(0.1);
    expect(log).toEqual([`show:${strings.story.lookAgain}`, "breath"]);
    expect(n.current).toBe("lookAgain");
    // Not yet: the second line waits for the first one plus the gap.
    run(len("lookAgain") + GAP - 0.2);
    expect(log).toHaveLength(2);
    run(0.3);
    expect(log.slice(2)).toEqual([`show:${strings.story.eyesClosed}`, "breath"]);
  });

  it("holds while time does not move (pause)", () => {
    const { n, log } = rig();
    n.say("promise");
    expect(log).toHaveLength(0);
    expect(n.busy).toBe(true);
    n.update(0.01);
    expect(log).toHaveLength(2);
  });

  it("reports idle time only after the last line ends", () => {
    const { n, run } = rig();
    n.say("thereYouAre");
    run(0.1);
    expect(n.idleFor).toBe(0);
    run(len("thereYouAre") + 1);
    expect(n.busy).toBe(false);
    expect(n.idleFor).toBeGreaterThan(0.8);
  });

  it("clear drops the queue", () => {
    const { n, log, run } = rig();
    n.say("digLong");
    n.say("digCareful");
    run(0.1);
    n.clear();
    expect(n.busy).toBe(false);
    run(30);
    expect(log.filter((l) => l.startsWith("show:"))).toEqual([`show:${strings.story.digLong}`]);
  });

  it("runs onStart when its line begins", () => {
    const { n, run } = rig();
    let started = 0;
    n.say("fatherHole");
    n.say("motherSoul", { onStart: () => started++ });
    run(1);
    expect(started).toBe(0);
    run(len("fatherHole") + GAP);
    expect(started).toBe(1);
  });

  // Property: whatever is queued, lines never overlap and keep their order.
  it("never overlaps lines and never reorders them", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...ids), { minLength: 1, maxLength: 8 }), fc.array(fc.double({ min: 0.001, max: 0.4, noNaN: true }), { minLength: 50, maxLength: 400 }), (queue, steps) => {
        const starts: Array<{ text: string; t: number }> = [];
        let t = 0;
        const n = new Narrator({ show: (text) => starts.push({ text, t }), breath: () => {} }, (id) => strings.story[id]);
        for (const id of queue) n.say(id);
        for (const dt of steps) {
          t += dt;
          n.update(dt);
        }
        expect(starts.map((s) => s.text)).toEqual(queue.slice(0, starts.length).map((id) => strings.story[id]));
        for (let i = 1; i < starts.length; i++) {
          const prev = starts[i - 1]!;
          expect(starts[i]!.t - prev.t).toBeGreaterThanOrEqual(lineSeconds(prev.text) + GAP - 1e-6);
        }
      }),
    );
  });
});

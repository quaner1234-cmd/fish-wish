import { describe, expect, it } from "vitest";
import fc from "fast-check";
import strings from "../src/content/strings.json";
import voice from "../src/content/voice.json";
import { GAP, Narrator, lineSeconds, type LineId, type VoiceOut } from "../src/core/narrator";

function rig(playable = true) {
  const log: string[] = [];
  const out: VoiceOut = {
    show: (text) => log.push(`show:${text}`),
    play: (id) => {
      log.push(`play:${id}`);
      return playable;
    },
    fallback: () => log.push("fallback"),
    stop: () => log.push("stop"),
  };
  const n = new Narrator(out, (id) => strings.story[id]);
  const run = (seconds: number, step = 0.05) => {
    for (let t = 0; t < seconds - 1e-9; t += step) n.update(step);
  };
  return { n, log, run };
}

const ids = Object.keys(strings.story) as LineId[];

describe("voice files", () => {
  it("every story line has a recording with a sane length", () => {
    for (const id of ids) {
      const s = (voice.seconds as Record<string, number>)[id];
      expect(s, id).toBeGreaterThan(0.8);
      expect(s, id).toBeLessThan(15);
    }
  });

  it("falls back to a reading-time estimate when a line has no recording", () => {
    expect(lineSeconds("noSuchLine", "Five words in this line.")).toBeGreaterThan(2);
  });
});

describe("narrator", () => {
  it("speaks queued lines in order, each after the previous one ends", () => {
    const { n, log, run } = rig();
    n.say("lookAgain");
    n.say("eyesClosed");
    run(0.1);
    expect(log).toEqual([`show:${strings.story.lookAgain}`, "play:lookAgain"]);
    expect(n.current).toBe("lookAgain");
    // Not yet: the second line waits for the first recording plus the gap.
    run(lineSeconds("lookAgain", "") + GAP - 0.2);
    expect(log).toHaveLength(2);
    run(0.3);
    expect(log.slice(2)).toEqual([`show:${strings.story.eyesClosed}`, "play:eyesClosed"]);
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
    run(lineSeconds("thereYouAre", "") + 1);
    expect(n.busy).toBe(false);
    expect(n.idleFor).toBeGreaterThan(0.8);
  });

  it("clear drops the queue and stops the voice", () => {
    const { n, log, run } = rig();
    n.say("digLong");
    n.say("digCareful");
    run(0.1);
    n.clear();
    expect(n.busy).toBe(false);
    run(30);
    expect(log.filter((l) => l.startsWith("play:"))).toEqual(["play:digLong"]);
    expect(log).toContain("stop");
  });

  it("marks a line some other way when its recording cannot play", () => {
    const { n, log, run } = rig(false);
    n.say("byTheDoor");
    run(0.1);
    expect(log).toContain("fallback");
  });

  it("runs onStart when its line begins", () => {
    const { n, run } = rig();
    let started = 0;
    n.say("fatherHole");
    n.say("motherSoul", { onStart: () => started++ });
    run(1);
    expect(started).toBe(0);
    run(lineSeconds("fatherHole", "") + GAP);
    expect(started).toBe(1);
  });

  // Property: whatever is queued, lines never overlap and keep their order.
  it("never overlaps lines and never reorders them", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...ids), { minLength: 1, maxLength: 8 }), fc.array(fc.double({ min: 0.001, max: 0.4, noNaN: true }), { minLength: 50, maxLength: 400 }), (queue, steps) => {
        const starts: Array<{ id: string; t: number }> = [];
        let t = 0;
        const n = new Narrator(
          { show: () => {}, play: (id) => (starts.push({ id, t }), true), fallback: () => {}, stop: () => {} },
          (id) => strings.story[id],
        );
        for (const id of queue) n.say(id);
        for (const dt of steps) {
          t += dt;
          n.update(dt);
        }
        expect(starts.map((s) => s.id)).toEqual(queue.slice(0, starts.length));
        for (let i = 1; i < starts.length; i++) {
          const prev = starts[i - 1]!;
          expect(starts[i]!.t - prev.t).toBeGreaterThanOrEqual(lineSeconds(prev.id, "") + GAP - 1e-6);
        }
      }),
    );
  });
});

// The face's lines: one at a time, in order. Each line shows its subtitle over a
// faint breath; the next line waits for the previous one to end. The pace comes from
// the length of the text, so it is the same with the sound on or off (R8.4). Time
// only moves while the story runs, so pausing holds the queue too.
// There are no recordings (D-012): the face speaks in text.

import strings from "../content/strings.json";

export type LineId = keyof typeof strings.story;

/** Pause between two lines of the queue, in seconds. */
export const GAP = 1.1;

/** How long a line stays "being said": a reading-time estimate from its length. */
export function lineSeconds(text: string): number {
  return 1.2 + [...text].length * 0.075;
}

export interface VoiceOut {
  /** Show the subtitle; it should take about `seconds` to arrive. */
  show(text: string, seconds: number): void;
  /** Something quiet to mark that the face is speaking. */
  breath(): void;
}

interface Queued {
  id: LineId;
  gap: number;
  onStart?: () => void;
}

export class Narrator {
  private t = 0;
  private endAt = -1e9;
  private queue: Queued[] = [];
  /** The line being said, or null. */
  current: LineId | null = null;

  constructor(
    private out: VoiceOut,
    private text: (id: LineId) => string,
  ) {}

  /** Queue a line. `gap` is the silence before it, after the previous line ends. */
  say(id: LineId, opts: { gap?: number; onStart?: () => void } = {}) {
    this.queue.push({ id, gap: opts.gap ?? GAP, onStart: opts.onStart });
  }

  /** True while a line is being said or waiting. */
  get busy() {
    return this.queue.length > 0 || this.t < this.endAt;
  }

  /** Seconds since the last line ended with nothing left to say; 0 while busy. */
  get idleFor() {
    return this.busy ? 0 : this.t - this.endAt;
  }

  update(dt: number) {
    this.t += dt;
    if (this.current && this.t >= this.endAt) this.current = null;
    const next = this.queue[0];
    if (!next || this.t < this.endAt + next.gap) return;
    this.queue.shift();
    const text = this.text(next.id);
    const seconds = lineSeconds(text);
    this.current = next.id;
    this.endAt = this.t + seconds;
    this.out.show(text, seconds);
    this.out.breath();
    next.onStart?.();
  }

  /** Drop everything queued (skip, restart). */
  clear() {
    this.queue = [];
    if (this.t < this.endAt) this.endAt = this.t;
    this.current = null;
  }
}

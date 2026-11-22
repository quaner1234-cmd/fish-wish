// The face's voice (D-009): one line at a time, in order. Each line shows its
// subtitle and plays its recording; the next line waits for the previous one to end.
// The pace follows the recordings' lengths even with the sound off, so the story
// reads the same with subtitles only (R8.4). Time only moves while the story runs,
// so pausing holds the queue too.

import voiceData from "../content/voice.json";
import strings from "../content/strings.json";

export type LineId = keyof typeof strings.story;

/** Pause between two lines of the queue, in seconds. */
export const GAP = 1.1;

const SECONDS = voiceData.seconds as Partial<Record<string, number>>;

/** How long a line lasts: its recording, or a reading-time estimate if there is none. */
export function lineSeconds(id: string, text: string): number {
  const s = SECONDS[id];
  return typeof s === "number" && s > 0 ? s : 1.2 + [...text].length * 0.075;
}

export interface VoiceOut {
  /** Show the subtitle; it should take about `seconds` to arrive. */
  show(text: string, seconds: number): void;
  /** Play the recording. Returns false if it cannot be played (not loaded, no audio). */
  play(id: LineId): boolean;
  /** Something quiet to mark a line when there is no recording. */
  fallback(): void;
  stop(): void;
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
  /** The line being spoken, or null. */
  current: LineId | null = null;

  constructor(
    private out: VoiceOut,
    private text: (id: LineId) => string,
  ) {}

  /** Queue a line. `gap` is the silence before it, after the previous line ends. */
  say(id: LineId, opts: { gap?: number; onStart?: () => void } = {}) {
    this.queue.push({ id, gap: opts.gap ?? GAP, onStart: opts.onStart });
  }

  /** True while a line is playing or waiting. */
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
    const seconds = lineSeconds(next.id, text);
    this.current = next.id;
    this.endAt = this.t + seconds;
    this.out.show(text, seconds);
    if (!this.out.play(next.id)) this.out.fallback();
    next.onStart?.();
  }

  /** Drop everything queued and stop the voice (skip, restart). */
  clear() {
    this.queue = [];
    if (this.t < this.endAt) this.endAt = this.t;
    this.current = null;
    this.out.stop();
  }
}

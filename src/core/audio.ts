// All sound is synthesized here with Web Audio (R8.3): the ambient layers, bells and
// the faint breath under the face's lines. There are no recordings (D-012).
// Nothing plays before the user presses Begin (R8.1).
// Mute state persists in localStorage (R8.2).

export type Layer = "drone" | "earth" | "brush" | "tension" | "shimmer" | "warm";

const MUTE_KEY = "urn-experience.muted";
const PENTATONIC = [220, 246.94, 277.18, 329.63, 369.99, 440];
const SCALE: Record<Layer, number> = { drone: 0.22, earth: 0.12, brush: 0.16, tension: 0.12, shimmer: 0.035, warm: 0.11 };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers = new Map<Layer, GainNode>();
  private paused = false;
  muted: boolean;

  constructor() {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(MUTE_KEY);
    } catch {
      stored = null;
    }
    this.muted = stored === "1";
  }

  /** Must be called from a user gesture. Safe to call more than once. */
  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;
    this.build(ctx, master);
    this.applyMaster();
  }

  /** A faint breath under the face's lines. */
  breath(gain = 0.05) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.linearRampToValueAtTime(1600, now + 1.4);
    bp.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2);
    src.connect(bp).connect(g).connect(this.master);
    src.start(now, Math.random() * 1.5);
    src.stop(now + 2.1);
  }

  private noise: AudioBuffer | null = null;

  private build(ctx: AudioContext, master: GainNode) {
    const noise = this.noiseBuffer(ctx);
    this.noise = noise;
    const layer = (name: Layer) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(master);
      this.layers.set(name, g);
      return g;
    };
    const tones = (out: AudioNode, list: ReadonlyArray<readonly [number, OscillatorType, number]>) => {
      for (const [f, type, gain] of list) {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = gain;
        o.connect(g).connect(out);
        o.start();
      }
    };
    const filtered = (out: AudioNode, type: BiquadFilterType, freq: number, q = 1, gain = 1) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(f).connect(g).connect(out);
      src.start();
    };

    // Drone: two low sines beating slowly, plus a soft fifth.
    const droneLp = ctx.createBiquadFilter();
    droneLp.type = "lowpass";
    droneLp.frequency.value = 320;
    droneLp.connect(layer("drone"));
    tones(droneLp, [[55, "sine", 0.5], [55.7, "sine", 0.45], [82.4, "triangle", 0.12]]);
    // Earth: low rumble. Brush: bright noise driven by brushing speed.
    filtered(layer("earth"), "lowpass", 420);
    filtered(layer("brush"), "bandpass", 2300, 0.7);
    // Tension: a close, uneasy cluster and a thin ceramic whisper.
    const tension = layer("tension");
    tones(tension, [[110, "sine", 0.35], [116.5, "sine", 0.3], [174.6, "sine", 0.12]]);
    filtered(tension, "bandpass", 3400, 14, 0.25);
    // Shimmer: the light through the hole, with a slow tremolo.
    const trem = ctx.createGain();
    trem.gain.value = 0.5;
    trem.connect(layer("shimmer"));
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.35;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.45;
    lfo.connect(lfoGain).connect(trem.gain);
    lfo.start();
    tones(trem, [[1318.5, "sine", 1]]);
    // Warm: an open, gentle chord for the surface and the ending.
    const warmLp = ctx.createBiquadFilter();
    warmLp.type = "lowpass";
    warmLp.frequency.value = 1100;
    warmLp.connect(layer("warm"));
    tones(warmLp, [[110, "triangle", 0.35], [164.81, "triangle", 0.25], [220.6, "triangle", 0.2], [277.18, "triangle", 0.12], [329.2, "triangle", 0.08]]);
  }

  /** Move layers toward new levels (0..1). */
  set(levels: Partial<Record<Layer, number>>, seconds = 1.5) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const [name, level] of Object.entries(levels) as Array<[Layer, number]>) {
      const g = this.layers.get(name);
      if (!g) continue;
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(Math.max(0, level) * SCALE[name], now, Math.max(0.02, seconds / 3));
    }
  }

  /** A soft bell, for small moments of arrival. */
  bell(step = 0, gain = 0.06) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const f = PENTATONIC[((step % PENTATONIC.length) + PENTATONIC.length) % PENTATONIC.length]!;
    const now = ctx.currentTime;
    for (const [mult, amp, decay] of [[1, 1, 3.2], [2.76, 0.35, 1.6], [5.4, 0.12, 0.8]] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain * amp, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      o.connect(g).connect(this.master);
      o.start(now);
      o.stop(now + decay + 0.1);
    }
  }
  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch {
      /* storage may be unavailable; the toggle still works for this visit */
    }
    this.applyMaster();
  }

  setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    this.applyMaster();
  }

  private applyMaster() {
    if (!this.ctx || !this.master) return;
    const target = this.muted ? 0 : this.paused ? 0.25 : 1;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(target, now, 0.15);
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let brown = 0;
    let seed = 1234567;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const white = (seed / 4294967296) * 2 - 1;
      // Mostly white with a little brown, so low filters still have body.
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = white * 0.6 + brown * 3;
    }
    return buf;
  }
}

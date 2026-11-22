// The ambient sound is synthesized here with Web Audio (R8.3); the face's voice is
// a set of short recordings (D-009) played through the same master, so mute and
// pause cover both. Nothing plays before the user presses Begin (R8.1).
// Mute state persists in localStorage (R8.2).

export type Layer = "drone" | "earth" | "brush" | "tension" | "shimmer" | "warm";

/** How far the ambient bed dips while the face is speaking. */
const DUCK = 0.62;

const MUTE_KEY = "urn-experience.muted";
const PENTATONIC = [220, 246.94, 277.18, 329.63, 369.99, 440];
const SCALE: Record<Layer, number> = { drone: 0.22, earth: 0.12, brush: 0.16, tension: 0.12, shimmer: 0.035, warm: 0.11 };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bed: GainNode | null = null;
  private layers = new Map<Layer, GainNode>();
  private paused = false;
  private voiceFiles = new Map<string, Promise<ArrayBuffer | null>>();
  private voices = new Map<string, AudioBuffer>();
  private playing: { id: string; src: AudioBufferSourceNode; gain: GainNode; startedAt: number; offset: number } | null = null;
  private held: { id: string; offset: number } | null = null;
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
    const bed = ctx.createGain();
    bed.connect(master);
    this.bed = bed;
    this.build(ctx, bed);
    this.applyMaster();
    this.decodeVoices(ctx);
  }

  /** Start downloading the voice recordings. Safe before init; decoding waits for it. */
  preloadVoices(urls: Record<string, string>) {
    for (const [id, url] of Object.entries(urls)) {
      if (this.voiceFiles.has(id)) continue;
      this.voiceFiles.set(
        id,
        fetch(url)
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .catch(() => null),
      );
    }
    if (this.ctx) this.decodeVoices(this.ctx);
  }

  private decodeVoices(ctx: AudioContext) {
    for (const [id, file] of this.voiceFiles) {
      if (this.voices.has(id)) continue;
      void file
        .then((buf) => (buf ? ctx.decodeAudioData(buf.slice(0)) : null))
        .then((audio) => {
          if (audio) this.voices.set(id, audio);
        })
        .catch(() => {
          /* a line that fails to decode is shown as text only */
        });
    }
  }

  /** For profiling and QA only: how many lines are decoded, which one is playing. */
  voiceState() {
    return { decoded: this.voices.size, playing: this.playing?.id ?? null, held: this.held?.id ?? null, ctx: this.ctx?.state ?? "none" };
  }

  /** Play one voice line from its start. Returns false if it is not ready. */
  voice(id: string): boolean {
    if (!this.ctx || !this.voices.has(id)) return false;
    this.stopVoice(0.12);
    if (this.paused) {
      this.held = { id, offset: 0 };
      return true;
    }
    this.startVoice(id, 0);
    return true;
  }

  private startVoice(id: string, offset: number) {
    const ctx = this.ctx;
    const buffer = this.voices.get(id);
    if (!ctx || !this.master || !buffer) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    src.connect(gain).connect(this.master);
    const entry = { id, src, gain, startedAt: ctx.currentTime, offset };
    src.onended = () => {
      if (this.playing === entry) {
        this.playing = null;
        this.duck(false);
      }
    };
    src.start(ctx.currentTime, Math.min(offset, Math.max(0, buffer.duration - 0.01)));
    this.playing = entry;
    this.duck(true);
  }

  /** Fade the current line out (skip, restart, a new line). */
  stopVoice(fade = 0.25) {
    this.held = null;
    const p = this.playing;
    if (!p || !this.ctx) return;
    this.playing = null;
    const now = this.ctx.currentTime;
    p.gain.gain.setTargetAtTime(0, now, fade / 4);
    try {
      p.src.stop(now + fade);
    } catch {
      /* already stopped */
    }
    this.duck(false);
  }

  private duck(on: boolean) {
    if (!this.ctx || !this.bed) return;
    this.bed.gain.setTargetAtTime(on ? DUCK : 1, this.ctx.currentTime, on ? 0.12 : 0.6);
  }

  /** A faint breath under the face's voice. */
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
    // The voice holds its place while paused and picks up where it stopped.
    if (p && this.playing && this.ctx) {
      const { id, startedAt, offset } = this.playing;
      const at = offset + (this.ctx.currentTime - startedAt);
      this.stopVoice(0.08);
      this.held = { id, offset: at };
    } else if (!p && this.held) {
      const { id, offset } = this.held;
      this.held = null;
      this.startVoice(id, offset);
    }
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

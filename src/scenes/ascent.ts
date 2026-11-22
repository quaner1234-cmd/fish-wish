// Scene 4: rise out of the jar through the earth, as an archaeological section,
// to the ground at dawn: a round half-sunken house right beside the jar, and the
// village cemetery away beyond the ditch (R5, F5, F14). World units are metres.
// The scene is alive (D-010): the hearth flickers, smoke drifts over the jar, grass
// moves, the sun comes up, and the mother lights the fire, then goes out to kneel
// by the jar. She is imagined, like everyone in the story (R7).

import { drawFigure, type Pose } from "../art/figure";
import { mulberry32 } from "../core/rng";
import { Cues, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";

const RISE = 15;
const URN_X = 0.9;
const HOUSE = { x0: -5.6, x1: -0.6, floor: 0.9, apex: -3.4 };
const HEARTH = (HOUSE.x0 + HOUSE.x1) / 2;
const DITCH = { x0: 7, x1: 9.6, depth: 1.5 };
const CEMETERY = { x0: 10.2, x1: 13.6 };
/** Height of the doorway's top, where the roof is cut open on the jar's side. */
const DOOR_TOP = -1.3;
/** The sloping way out of the pit, from the floor to the ground at the door. */
const RAMP = { x0: -1.55, x1: -0.35 };
/** Her way out: from the hearth, along the floor, up the ramp, to the jar. */
const PATH: ReadonlyArray<readonly [number, number]> = [
  [HEARTH + 0.7, HOUSE.floor],
  [RAMP.x0, HOUSE.floor],
  [RAMP.x1, 0],
  [URN_X - 0.48, 0],
];
const WALK_SPEED = 0.7;
const STEP = 0.55;
/** Her timeline, in seconds after "Every morning…" begins. */
const MOM = { leanIn: 1.4, flare: 1, leanOut: 2.4, standUp: 3.6, pause: 0.6, kneel: 1.6 };

interface Pebble {
  x: number;
  y: number;
  r: number;
  a: number;
  c: string;
}
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
const mixHex = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(lerp(a[0]!, b[0]!, t))},${Math.round(lerp(a[1]!, b[1]!, t))},${Math.round(lerp(a[2]!, b[2]!, t))})`;

const PATH_LEN = PATH.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - PATH[i]![0], p[1] - PATH[i]![1]), 0);
const WALK_TIME = PATH_LEN / WALK_SPEED;
const MOM_DONE = MOM.standUp + WALK_TIME + MOM.pause + MOM.kneel;

/** A point at distance d along her path. */
function along(d: number): { x: number; y: number } {
  let left = Math.max(0, d);
  for (let i = 1; i < PATH.length; i++) {
    const [ax, ay] = PATH[i - 1]!;
    const [bx, by] = PATH[i]!;
    const len = Math.hypot(bx - ax, by - ay);
    if (left <= len) return { x: ax + ((bx - ax) * left) / len, y: ay + ((by - ay) * left) / len };
    left -= len;
  }
  const [x, y] = PATH[PATH.length - 1]!;
  return { x, y };
}

export class AscentScene implements Scene {
  readonly exitFade = "black";
  private cues = new Cues();
  private clock = 0;
  private p = 0;
  private arrived = false;
  private arrivedAt = 0;
  private queued = false;
  private ready = false;
  private readyAt = 0;
  private finish = false;
  private graveGlow = 0;
  private graveTarget = 0;
  private pan = 0;
  private door = 0;
  private doorTarget = 0;
  private panTarget = 0;
  private momGo = false;
  private momT = 0;
  private flare = 0;
  private flared = false;
  private pebbles: Pebble[] = [];
  private grass: Array<{ x: number; h: number; lean: number; ph: number }> = [];
  private roots: Array<Array<[number, number]>> = [];
  private stars: Array<{ u: number; v: number; r: number; tw: number }> = [];
  private birds: Array<{ u: number; v: number; speed: number; ph: number; size: number }> = [];
  private smoke: Array<{ x: number; y: number; r: number; life: number; big: number }> = [];
  private sparks: Spark[] = [];
  private smokeT = 0;
  private sparkT = 0;
  private rand = mulberry32(5);

  constructor() {
    const rand = mulberry32(77);
    const cols = ["#9c8a72", "#7d6a55", "#b3a189", "#6a5744"];
    for (let i = 0; i < 520; i++) {
      this.pebbles.push({ x: -16 + rand() * 38, y: 0.08 + rand() * 4.5, r: 0.008 + rand() * 0.04, a: rand() * Math.PI, c: cols[i % cols.length]! });
    }
    for (let i = 0; i < 460; i++) this.grass.push({ x: -16 + rand() * 38, h: 0.05 + rand() * 0.17, lean: (rand() - 0.5) * 0.08, ph: rand() * 6.3 });
    // Fine roots under the grass, kept out of the house pit, the ditch and the jar's pit.
    for (let i = 0; i < 90; i++) {
      const x = -16 + rand() * 38;
      if ((x > HOUSE.x0 - 0.3 && x < HOUSE.x1 + 0.3) || (x > DITCH.x0 - 0.2 && x < DITCH.x1 + 0.2) || Math.abs(x - URN_X) < 0.75) continue;
      const pts: Array<[number, number]> = [[x, 0.01]];
      let px = x;
      let py = 0.01;
      const n = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < n; k++) {
        px += (rand() - 0.5) * 0.12;
        py += 0.05 + rand() * 0.09;
        pts.push([px, py]);
      }
      this.roots.push(pts);
    }
    for (let i = 0; i < 110; i++) this.stars.push({ u: rand(), v: rand() ** 1.4 * 0.8, r: 0.5 + rand() * 1.1, tw: 0.6 + rand() * 2.2 });
    for (let i = 0; i < 4; i++) this.birds.push({ u: rand() * 1.3, v: 0.18 + rand() * 0.3, speed: 0.012 + rand() * 0.01, ph: rand() * 6.3, size: 4 + rand() * 3 });
  }

  enter(env: Env) {
    this.cues.reset();
    this.clock = 0;
    this.p = 0;
    this.arrived = false;
    this.arrivedAt = 0;
    this.queued = false;
    this.ready = false;
    this.finish = false;
    this.graveGlow = 0;
    this.graveTarget = 0;
    this.pan = 0;
    this.door = 0;
    this.doorTarget = 0;
    this.panTarget = 0;
    this.momGo = false;
    this.momT = 0;
    this.flare = 0;
    this.flared = false;
    this.smoke = [];
    this.sparks = [];
    env.lamp.radius = Math.min(env.w, env.h) * 0.14;
    env.audio.set({ shimmer: 0.2, tension: 0, drone: 0.35, earth: 0.3, warm: 0.35 }, 3);
  }

  /** Camera: from tight on the jar to a wide view of house, ground and sky. */
  private camera(env: Env) {
    const shown = env.reduced ? (this.p < 0.34 ? 0 : this.p < 0.67 ? 0.5 : 1) : ease(this.p);
    const portrait = env.h > env.w;
    const ppm0 = (env.h * 0.6) / 0.75;
    const ppm1 = portrait ? Math.max(env.w / 8, env.h / 18) : Math.min(env.w / 23, env.h / 10.5);
    // Once arrived, a slow push in toward the house and the jar.
    const settle = this.arrived && !env.reduced ? ease(clamp01((this.cues.t - this.arrivedAt) / 40)) : 0;
    return {
      // A narrow screen leans toward the jar so it and the mother stay in frame.
      x: lerp(URN_X, portrait ? -1.6 : 2.8, shown) + this.pan + (portrait ? 0.4 : -0.9) * settle,
      y: lerp(0.66, -1.7, shown),
      ppm: Math.exp(lerp(Math.log(ppm0), Math.log(ppm1), shown)) * (1 + 0.07 * settle),
      t: shown,
    };
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    this.clock += dt;
    if (!this.arrived) {
      this.p = Math.min(1, this.p + dt / RISE);
      const t = this.camera(env).t;
      env.audio.set({ warm: 0.35 + 0.6 * t, drone: 0.35 * (1 - t), earth: 0.3 * (1 - t), shimmer: 0.2 * (1 - t) }, 0.5);
      if (this.p >= 1) {
        this.arrived = true;
        this.arrivedAt = this.cues.t;
        env.audio.bell(1, 0.05);
        this.cues.after(1.5, () => {
          env.voice.say("notTheField", {
            gap: 0,
            onStart: () => {
              this.graveTarget = 1;
              // On a tall, narrow screen the cemetery is out of frame: look over to it.
              if (env.h > env.w) this.panTarget = (CEMETERY.x0 + CEMETERY.x1) / 2 + 1.6 - 1.2;
            },
          });
          env.voice.say("byTheDoor", {
            gap: 1.4,
            onStart: () => {
              this.graveTarget = 0;
              this.panTarget = 0;
              this.doorTarget = 1;
            },
          });
          env.voice.say("everyMorning", { gap: 1.2, onStart: () => (this.momGo = true) });
          this.queued = true;
        });
      }
    }
    // Go on once the last line has been said and she has knelt by the jar.
    if (this.queued && !this.ready && env.voice.idleFor > 1 && this.momT >= MOM_DONE) {
      env.text.hint.show(env.s.ui.continue);
      this.ready = true;
      this.readyAt = this.cues.t;
    }
    this.graveGlow += (this.graveTarget - this.graveGlow) * Math.min(1, dt * 1.2);
    this.door += (this.doorTarget - this.door) * Math.min(1, dt * 1.2);
    this.pan += (this.panTarget - this.pan) * Math.min(1, dt * (env.reduced ? 6 : 0.9));
    if (this.ready && (env.input.confirmed || this.cues.t - this.readyAt > 8)) this.finish = true;

    if (this.momGo) this.momT += dt;
    if (this.momGo && !this.flared && this.momT >= MOM.flare) {
      this.flared = true;
      this.flare = 1;
      env.audio.bell(4, 0.025);
    }
    this.flare = Math.max(0, this.flare - dt / 5);
    this.updateSmoke(dt, env);
    this.updateSparks(dt);
    return this.finish ? "next" : "stay";
  }

  private updateSmoke(dt: number, env: Env) {
    this.smokeT += dt;
    const every = this.flare > 0.05 ? 0.32 : 0.75;
    if (this.smokeT > every) {
      this.smokeT = 0;
      this.smoke.push({ x: HEARTH + (this.rand() - 0.5) * 0.1, y: HOUSE.apex - 0.1, r: 0.12, life: 1, big: 1 + this.flare * 0.8 });
    }
    // The wind carries it toward the jar: "the smoke went up over you".
    for (const s of this.smoke) {
      s.life -= dt / 12;
      s.y -= dt * 0.26;
      s.x += dt * (0.34 + 0.12 * Math.sin(s.life * 9 + s.r * 3)) * env.motion + dt * 0.04;
      s.r += dt * 0.17 * s.big;
    }
    this.smoke = this.smoke.filter((s) => s.life > 0);
  }

  private updateSparks(dt: number) {
    this.sparkT += dt * (1.6 + 22 * this.flare);
    while (this.sparkT > 1) {
      this.sparkT -= 1;
      this.sparks.push({ x: HEARTH + (this.rand() - 0.5) * 0.3, y: HOUSE.floor - 0.1, vx: (this.rand() - 0.5) * 0.35, vy: -(0.5 + this.rand() * 0.8), life: 0.8 + this.rand() * 1.4 });
    }
    for (const s of this.sparks) {
      s.life -= dt;
      s.x += s.vx * dt + Math.sin(this.clock * 5 + s.y * 7) * 0.08 * dt;
      s.y += s.vy * dt;
      s.vy *= 1 - dt * 0.4;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0 && s.y > HOUSE.apex + 0.6);
  }

  /** Where she is and how she stands, from her timeline. */
  private mom(motion: number): { x: number; y: number; pose: Pose } {
    const t = this.momT;
    const breathe = 0.025 * Math.sin(this.clock * 1.4) * motion;
    if (!this.momGo || t < MOM.standUp) {
      const leanIn = smooth(t / MOM.leanIn) * (1 - smooth((t - MOM.leanIn) / (MOM.leanOut - MOM.leanIn)));
      const up = smooth((t - MOM.leanOut) / (MOM.standUp - MOM.leanOut));
      const turn = smooth((t - (MOM.leanOut + 0.5)) / (MOM.standUp - MOM.leanOut - 0.3));
      const [x, y] = PATH[0]!;
      return {
        x,
        y,
        pose: { kneel: 1 - up, lean: 0.18 + 0.42 * leanIn + breathe, walk: 0, stride: 0, bow: 0.4 * (1 - up), reach: 0.3 + 0.7 * leanIn - 0.3 * up, dir: lerp(-1, 1, turn) },
      };
    }
    const w = t - MOM.standUp;
    const d = Math.min(PATH_LEN, w * WALK_SPEED);
    const pos = along(d);
    const walking = w < WALK_TIME;
    const stride = walking ? Math.min(1, w * 2, (WALK_TIME - w) * 2 + 0.25) : 0;
    const k = smooth((w - WALK_TIME - MOM.pause) / MOM.kneel);
    // A slight forward lean on the ramp.
    const onRamp = pos.x > RAMP.x0 && pos.x < RAMP.x1 ? 0.12 : 0;
    return {
      x: pos.x,
      y: pos.y,
      pose: { kneel: k, lean: 0.05 + onRamp + 0.22 * k + breathe * k, walk: (d / STEP) * Math.PI, stride, bow: k, reach: 0.45 * k, dir: 1 },
    };
  }

  render(g: CanvasRenderingContext2D, env: Env) {
    const cam = this.camera(env);
    const { w, h } = env;
    const groundY = h / 2 - cam.y * cam.ppm;
    const day = Math.min(1, Math.max(0, (cam.t - 0.25) / 0.75));
    const sunrise = this.arrived ? smooth((this.cues.t - this.arrivedAt) / 45) : 0;

    // Sky: night blue warming to dawn at the horizon.
    const sky = g.createLinearGradient(0, 0, 0, Math.max(1, groundY));
    sky.addColorStop(0, mixHex([5, 7, 14], [44 + 14 * sunrise, 58 + 16 * sunrise, 92 + 10 * sunrise], day));
    sky.addColorStop(0.65, mixHex([12, 15, 26], [150, 128 + 10 * sunrise, 132], day));
    sky.addColorStop(1, mixHex([20, 20, 28], [240, 176 + 18 * sunrise, 124 + 12 * sunrise], day));
    g.fillStyle = sky;
    g.fillRect(0, 0, w, Math.max(0, groundY + DITCH.depth * cam.ppm) + 2);
    if (groundY > 0) {
      this.drawStars(g, w, groundY, day, env.motion);
      const sunX = w * 0.82 - cam.x * cam.ppm * 0.05;
      const sun = g.createRadialGradient(sunX, groundY, 0, sunX, groundY, w * 0.6);
      sun.addColorStop(0, `rgba(255, 214, 160, ${(0.75 + 0.15 * sunrise) * day})`);
      sun.addColorStop(0.25, `rgba(255, 180, 120, ${(0.3 + 0.1 * sunrise) * day})`);
      sun.addColorStop(1, "rgba(255, 180, 120, 0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, w, groundY);
      // The sun itself, coming up behind the far hills.
      const sr = Math.max(6, h * 0.028);
      const sy = groundY - h * (0.005 + 0.07 * sunrise);
      const disc = g.createRadialGradient(sunX, sy, 0, sunX, sy, sr * 3);
      disc.addColorStop(0, `rgba(255, 244, 222, ${0.95 * day})`);
      disc.addColorStop(0.32, `rgba(255, 226, 180, ${0.8 * day})`);
      disc.addColorStop(1, "rgba(255, 210, 160, 0)");
      g.fillStyle = disc;
      g.fillRect(sunX - sr * 3, sy - sr * 3, sr * 6, sr * 6);
      // Far hills, with gentle parallax.
      g.fillStyle = mixHex([10, 11, 16], [92, 84, 96], day);
      g.beginPath();
      g.moveTo(0, groundY);
      const shift = cam.x * cam.ppm * 0.12;
      for (let x = 0; x <= w + 40; x += 40) {
        const u = (x + shift) / w;
        g.lineTo(x, groundY - h * (0.035 + 0.025 * Math.sin(u * 5.1) + 0.015 * Math.sin(u * 13.7)));
      }
      g.lineTo(w, groundY);
      g.closePath();
      g.fill();
      // Nearer hills, a little more parallax.
      g.fillStyle = mixHex([8, 8, 11], [74, 62, 66], day);
      g.beginPath();
      g.moveTo(0, groundY);
      const shift2 = cam.x * cam.ppm * 0.3;
      for (let x = 0; x <= w + 40; x += 40) {
        const u = (x + shift2) / w;
        g.lineTo(x, groundY - h * (0.012 + 0.012 * Math.sin(u * 3.3 + 1) + 0.006 * Math.sin(u * 11.1)));
      }
      g.lineTo(w, groundY);
      g.closePath();
      g.fill();
      this.drawBirds(g, w, groundY, day, env.motion);
    }

    g.save();
    g.translate(w / 2 - cam.x * cam.ppm, h / 2 - cam.y * cam.ppm);
    g.scale(cam.ppm, cam.ppm);
    const px = 1 / cam.ppm;
    this.drawEarth(g, px, day);
    this.drawHouseInside(g, px, day, env.motion);
    this.drawRoof(g, px, day);
    this.drawJar(g, px);
    this.drawSurface(g, px, day, env.motion);
    if (this.arrived || this.p > 0.6) this.drawMother(g, day, env.motion);
    this.drawMist(g, day, env.motion);
    g.restore();
  }

  private drawStars(g: CanvasRenderingContext2D, w: number, groundY: number, day: number, motion: number) {
    const a = 1 - day * 1.25;
    if (a <= 0) return;
    g.fillStyle = "#f4ecdc";
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(this.clock * s.tw * motion + s.u * 40);
      g.globalAlpha = a * tw * 0.8;
      g.fillRect(s.u * w, s.v * groundY, s.r, s.r);
    }
    g.globalAlpha = 1;
  }

  private drawBirds(g: CanvasRenderingContext2D, w: number, groundY: number, day: number, motion: number) {
    const a = smooth((day - 0.75) / 0.25);
    if (a <= 0) return;
    g.strokeStyle = `rgba(40, 32, 40, ${0.6 * a})`;
    g.lineWidth = 1.3;
    g.lineCap = "round";
    g.beginPath();
    for (const b of this.birds) {
      const u = ((b.u + this.clock * b.speed * motion) % 1.3) - 0.15;
      const x = u * w;
      const y = b.v * groundY + Math.sin(this.clock * 0.7 + b.ph) * 4;
      const flap = Math.sin(this.clock * 7 * motion + b.ph);
      const s = b.size;
      g.moveTo(x - s, y - flap * s * 0.6);
      g.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y);
      g.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - flap * s * 0.6);
    }
    g.stroke();
  }

  private surfaceY(x: number) {
    if (x <= DITCH.x0 || x >= DITCH.x1) return 0;
    return DITCH.depth * Math.sin((Math.PI * (x - DITCH.x0)) / (DITCH.x1 - DITCH.x0)) ** 0.8;
  }

  private drawEarth(g: CanvasRenderingContext2D, px: number, day: number) {
    const earth = g.createLinearGradient(0, 0, 0, 7);
    earth.addColorStop(0, mixHex([70, 52, 34], [140, 104, 66], day * 0.7 + 0.3));
    earth.addColorStop(0.4, "#4f3a26");
    earth.addColorStop(1, "#1f160e");
    g.fillStyle = earth;
    g.beginPath();
    g.moveTo(-30, 0);
    for (let x = DITCH.x0; x <= DITCH.x1 + 0.001; x += 0.2) g.lineTo(x, this.surfaceY(x));
    g.lineTo(40, 0);
    g.lineTo(40, 8);
    g.lineTo(-30, 8);
    g.closePath();
    g.fill();
    // The open ditch: its far wall in shadow, its floor a little lighter.
    const ditch = g.createLinearGradient(0, 0, 0, DITCH.depth);
    ditch.addColorStop(0, `rgba(34, 24, 16, ${0.7 - 0.2 * day})`);
    ditch.addColorStop(1, `rgba(18, 12, 8, ${0.78 - 0.18 * day})`);
    g.fillStyle = ditch;
    g.beginPath();
    g.moveTo(DITCH.x0, 0);
    for (let x = DITCH.x0; x <= DITCH.x1 + 0.001; x += 0.2) g.lineTo(x, this.surfaceY(x));
    g.closePath();
    g.fill();

    // Strata: wavy bands of slightly different earth.
    const depths = [0.32, 0.78, 1.32, 2.05, 2.9, 3.9];
    depths.forEach((d, i) => {
      g.strokeStyle = "rgba(34, 22, 12, 0.32)";
      g.lineWidth = Math.max(px, 0.018);
      g.beginPath();
      for (let x = -30; x <= 40; x += 0.25) {
        const y = d + 0.05 * Math.sin(x * 1.1 + i * 2) + 0.02 * Math.sin(x * 3.3 + i);
        if (x === -30) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      if (i % 2 === 0) {
        g.fillStyle = "rgba(255, 230, 190, 0.035)";
        g.fillRect(-30, d, 70, (depths[i + 1] ?? d + 1) - d);
      }
    });
    // Roots.
    g.strokeStyle = "rgba(56, 38, 22, 0.5)";
    g.lineWidth = Math.max(px * 0.8, 0.009);
    g.beginPath();
    for (const r of this.roots) {
      g.moveTo(r[0]![0], r[0]![1]);
      for (let i = 1; i < r.length; i++) g.lineTo(r[i]![0], r[i]![1]);
    }
    g.stroke();
    for (const p of this.pebbles) {
      if (p.y < this.surfaceY(p.x) + 0.03) continue;
      if (p.x > HOUSE.x0 && p.x < HOUSE.x1 && p.y < HOUSE.floor + 0.05) continue;
      g.fillStyle = p.c;
      g.beginPath();
      g.ellipse(p.x, p.y, p.r, p.r * 0.65, p.a, 0, Math.PI * 2);
      g.fill();
    }
  }

  /** Firelight: steady by default, flaring when she feeds the fire. */
  private fire(motion: number) {
    const c = this.clock;
    return 0.86 + (0.08 * Math.sin(c * 7.3) + 0.05 * Math.sin(c * 17.1 + 1) + 0.03 * Math.sin(c * 31)) * motion + 0.55 * this.flare;
  }

  /** The pit of a round, half-sunken house, cut away to show the hearth (F14). */
  private drawHouseInside(g: CanvasRenderingContext2D, px: number, day: number, motion: number) {
    const { x0, x1, floor, apex } = HOUSE;
    const cx = HEARTH;
    const roofAt = (x: number) => apex + (Math.abs(x - cx) / ((x1 - x0) / 2 + 0.35)) * -apex;
    const fl = this.fire(motion);
    // Interior air: the pit below ground and the space under the roof.
    const inside = g.createLinearGradient(0, apex, 0, floor);
    inside.addColorStop(0, "#120c08");
    inside.addColorStop(1, "#2a1a0f");
    g.fillStyle = inside;
    g.beginPath();
    g.moveTo(x0 - 0.1, 0);
    g.lineTo(cx, apex + 0.3);
    g.lineTo(x1 + 0.1, 0);
    g.lineTo(x1 - 0.12, floor);
    g.lineTo(x0 + 0.12, floor);
    g.closePath();
    g.fill();

    g.globalCompositeOperation = "lighter";
    // Firelight on the walls and the underside of the roof.
    const room = g.createRadialGradient(cx, floor - 0.3, 0, cx, floor - 0.3, 3.4 * (0.9 + 0.1 * fl));
    room.addColorStop(0, `rgba(200, 96, 40, ${0.2 * fl})`);
    room.addColorStop(1, "rgba(200, 96, 40, 0)");
    g.fillStyle = room;
    g.fillRect(cx - 3.6, apex, 7.2, floor - apex + 0.1);
    // Hearth glow on the floor.
    const glow = g.createRadialGradient(cx, floor - 0.05, 0, cx, floor - 0.05, 2.2);
    glow.addColorStop(0, `rgba(255, 150, 70, ${0.5 * fl})`);
    glow.addColorStop(0.3, `rgba(220, 110, 50, ${0.17 * fl})`);
    glow.addColorStop(1, "rgba(220, 110, 50, 0)");
    g.fillStyle = glow;
    g.fillRect(cx - 2.2, floor - 2.3, 4.4, 2.4);
    // Dawn through the doorway, falling on the ramp.
    const dawn = g.createRadialGradient(RAMP.x1, -0.2, 0, RAMP.x1, -0.2, 1.8);
    dawn.addColorStop(0, `rgba(255, 196, 140, ${(0.16 + 0.14 * this.door) * day})`);
    dawn.addColorStop(1, "rgba(255, 196, 140, 0)");
    g.fillStyle = dawn;
    g.fillRect(RAMP.x1 - 1.8, -2, 3.6, 3);
    g.globalCompositeOperation = "source-over";

    // The ramp up to the door.
    g.fillStyle = "#4a3523";
    g.beginPath();
    g.moveTo(RAMP.x0 - 0.05, floor + 0.05);
    g.lineTo(RAMP.x1 + 0.05, 0);
    g.lineTo(RAMP.x1 + 0.05, floor + 0.05);
    g.closePath();
    g.fill();
    g.strokeStyle = "#8f7656";
    g.lineWidth = Math.max(px, 0.03);
    g.beginPath();
    g.moveTo(RAMP.x0 - 0.05, floor);
    g.lineTo(RAMP.x1 + 0.05, 0);
    g.stroke();
    // Plastered floor and posts.
    g.fillStyle = "#8f7656";
    g.fillRect(x0 + 0.12, floor, RAMP.x0 - x0 - 0.1, 0.05);
    g.fillStyle = "#3a2918";
    for (const x of [x0 + 0.7, cx - 0.85, cx + 0.85, RAMP.x0 + 0.2]) {
      const top = roofAt(x) + 0.2;
      g.fillRect(x - 0.06, top, 0.12, floor - top);
    }

    // The fire: a few flickering tongues over the embers.
    g.fillStyle = "#4a1c0c";
    g.beginPath();
    g.ellipse(cx, floor - 0.02, 0.3, 0.055, 0, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 4; i++) {
      const fx = cx + (i - 1.5) * 0.11;
      const hgt = (0.22 + (0.08 * Math.sin(this.clock * 9 + i * 1.7) + 0.05 * Math.sin(this.clock * 23 + i * 2.3)) * motion) * (1 + 0.9 * this.flare) * (i === 1 || i === 2 ? 1.25 : 0.85);
      const sway = 0.03 * Math.sin(this.clock * 5 + i) * motion;
      const base = floor - 0.03;
      const flame = g.createLinearGradient(0, base, 0, base - hgt);
      flame.addColorStop(0, "rgba(255, 210, 120, 0.95)");
      flame.addColorStop(0.45, "rgba(255, 130, 50, 0.7)");
      flame.addColorStop(1, "rgba(200, 60, 20, 0)");
      g.fillStyle = flame;
      g.beginPath();
      g.moveTo(fx - 0.075, base);
      g.quadraticCurveTo(fx - 0.07, base - hgt * 0.55, fx + sway, base - hgt);
      g.quadraticCurveTo(fx + 0.07, base - hgt * 0.55, fx + 0.075, base);
      g.closePath();
      g.fill();
    }
    // Sparks.
    for (const s of this.sparks) {
      const a = Math.min(1, s.life) * 0.9;
      g.fillStyle = `rgba(255, 190, 110, ${a})`;
      const r = Math.max(px * 1.4, 0.012);
      g.fillRect(s.x - r / 2, s.y - r / 2, r, r);
    }
    g.globalCompositeOperation = "source-over";
  }

  /** The thatched cone roof in section, cut open on the jar's side for the doorway. */
  private drawRoof(g: CanvasRenderingContext2D, px: number, day: number) {
    const { x0, x1, apex } = HOUSE;
    const cx = HEARTH;
    const t = 0.26;
    const half = (x1 - x0) / 2 + 0.35;
    const doorF = (DOOR_TOP - apex) / -apex;
    const band = (s: number, f1: number) => {
      const ox = (f: number) => cx + s * f * half;
      const oy = (f: number) => apex + f * -apex;
      const ix = (f: number) => cx + s * (f * (half - t * 1.4));
      const iy = (f: number) => apex + t * 1.6 + f * (-apex - t * 1.6 + 0.02);
      g.beginPath();
      g.moveTo(ox(0), oy(0));
      g.lineTo(ox(f1), oy(f1) + (f1 >= 1 ? 0.02 : 0));
      g.lineTo(ix(f1), iy(f1));
      g.lineTo(ix(0), iy(0));
      g.closePath();
      g.fill();
    };
    g.fillStyle = mixHex([44, 33, 20], [150, 116, 64], day);
    band(-1, 1);
    band(1, doorF);
    // Straw.
    g.strokeStyle = mixHex([24, 18, 10], [96, 72, 38], day);
    g.lineWidth = Math.max(px, 0.012);
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      for (const s of [-1, 1]) {
        if (s > 0 && f > doorF - 0.03) continue;
        const bx = cx + s * f * half;
        const by = apex + f * -apex;
        g.moveTo(bx, by);
        g.lineTo(bx - s * 0.18, by - 0.3);
      }
    }
    g.stroke();
    // The lintel over the doorway.
    const lx = cx + doorF * half;
    g.fillStyle = mixHex([30, 22, 14], [92, 66, 36], day);
    g.fillRect(lx - 0.45, DOOR_TOP - 0.04, 0.5, 0.09);
    // Smoke from the roof, lit warmer on the sun's side as it rises.
    for (const s of this.smoke) {
      const a = 0.11 * s.life * (1 - s.life * 0.5) * (0.45 + day) * s.big;
      const puff = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      puff.addColorStop(0, `rgba(214, 204, 196, ${Math.min(0.3, a)})`);
      puff.addColorStop(1, "rgba(214, 204, 196, 0)");
      g.fillStyle = puff;
      g.fillRect(s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
    }
    // A neighbour's roof farther off, for a sense of the village.
    g.fillStyle = mixHex([20, 16, 12], [110, 88, 56], day);
    g.beginPath();
    g.moveTo(-14.6, 0.02);
    g.lineTo(-11.8, -3);
    g.lineTo(-9, 0.02);
    g.closePath();
    g.fill();
  }

  /** The jar in section: hollow, no remains shown (R12.1); the basin upturned on its mouth. */
  private drawJar(g: CanvasRenderingContext2D, px: number) {
    const X = URN_X;
    g.fillStyle = "rgba(48, 33, 21, 0.55)";
    g.beginPath();
    g.moveTo(X - 0.6, 0);
    g.lineTo(X + 0.6, 0);
    g.lineTo(X + 0.44, 1.1);
    g.lineTo(X - 0.44, 1.1);
    g.closePath();
    g.fill();
    // Jar profile: a sandy-ware jar with a wide shoulder, drawn with smooth curves.
    const jar = (k: number, base: number) => {
      const p = new Path2D();
      p.moveTo(X + 0.15 * k, 0.47);
      p.bezierCurveTo(X + 0.16 * k, 0.53, X + 0.285 * k, 0.56, X + 0.275 * k, 0.68);
      p.bezierCurveTo(X + 0.27 * k, 0.84, X + 0.18 * k, 0.97, X + 0.13 * k, base);
      p.lineTo(X - 0.13 * k, base);
      p.bezierCurveTo(X - 0.18 * k, 0.97, X - 0.27 * k, 0.84, X - 0.275 * k, 0.68);
      p.bezierCurveTo(X - 0.285 * k, 0.56, X - 0.16 * k, 0.53, X - 0.15 * k, 0.47);
      p.closePath();
      return p;
    };
    g.fillStyle = "#6a5644";
    g.fill(jar(1, 1.02));
    g.fillStyle = "#0c0806";
    g.fill(jar(0.9, 0.995));
    // The basin, upturned over the mouth like a cap: thin red wall, black lip, a small hole.
    const dome = (k: number, top: number) => {
      const p = new Path2D();
      p.moveTo(X - 0.205 * k, 0.476);
      p.bezierCurveTo(X - 0.2 * k, 0.38, X - 0.15 * k, top + 0.006, X - 0.09 * k, top);
      p.lineTo(X + 0.09 * k, top);
      p.bezierCurveTo(X + 0.15 * k, top + 0.006, X + 0.2 * k, 0.38, X + 0.205 * k, 0.476);
      p.closePath();
      return p;
    };
    g.fillStyle = "#b05a33";
    g.fill(dome(1, 0.302));
    g.fillStyle = "#0c0806";
    g.fill(dome(0.93, 0.318));
    g.fillStyle = "#1a100a";
    g.fillRect(X - 0.212, 0.458, 0.03, 0.02);
    g.fillRect(X + 0.182, 0.458, 0.03, 0.02);
    g.fillStyle = "rgba(255, 240, 210, 0.95)";
    g.beginPath();
    g.arc(X + 0.168, 0.385, Math.max(px * 1.5, 0.008), 0, Math.PI * 2);
    g.fill();
    // A warm mark on the jar's place, breathing slowly; warmer when she kneels there.
    const kneel = this.momGo ? smooth((this.momT - (MOM_DONE - MOM.kneel)) / MOM.kneel) : 0;
    const a = (0.12 + 0.3 * this.p + 0.3 * this.door + 0.25 * kneel) * (0.9 + 0.1 * Math.sin(this.clock * 1.3));
    const glow = g.createRadialGradient(X, 0.6, 0, X, 0.6, 1.1);
    glow.addColorStop(0, `rgba(255, 200, 140, ${a})`);
    glow.addColorStop(1, "rgba(255, 200, 140, 0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = glow;
    g.fillRect(X - 1.1, -0.5, 2.2, 2.2);
    g.globalCompositeOperation = "source-over";
  }

  private drawSurface(g: CanvasRenderingContext2D, px: number, day: number, motion: number) {
    // Cemetery beyond the ditch: low earth over the graves (F5, F14).
    for (let i = 0; i < 4; i++) {
      const x = CEMETERY.x0 + (i + 0.5) * ((CEMETERY.x1 - CEMETERY.x0) / 4);
      // Each grave, a long pit in section below its mound, its fill a little darker.
      g.save();
      g.translate(x, 0.95);
      g.scale(0.22, 0.95);
      const pit = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      pit.addColorStop(0, "rgba(36, 24, 14, 0.32)");
      pit.addColorStop(0.75, "rgba(36, 24, 14, 0.2)");
      pit.addColorStop(1, "rgba(36, 24, 14, 0)");
      g.fillStyle = pit;
      g.fillRect(-1, -1, 2, 2);
      g.restore();
      g.fillStyle = mixHex([30, 22, 15], [104, 78, 50], day);
      g.beginPath();
      g.ellipse(x, 0.01, 0.34, 0.15, 0, Math.PI, Math.PI * 2);
      g.fill();
    }
    if (this.graveGlow > 0.01) {
      const cx = (CEMETERY.x0 + CEMETERY.x1) / 2;
      const glow = g.createRadialGradient(cx, -0.2, 0, cx, -0.2, 4.2);
      glow.addColorStop(0, `rgba(255, 236, 210, ${0.32 * this.graveGlow})`);
      glow.addColorStop(1, "rgba(255, 236, 210, 0)");
      g.globalCompositeOperation = "lighter";
      g.fillStyle = glow;
      g.fillRect(cx - 4.2, -4.4, 8.4, 8.4);
      g.globalCompositeOperation = "source-over";
    }
    // Ground line and grass, moving in the morning wind.
    g.strokeStyle = mixHex([30, 22, 14], [88, 70, 44], day);
    g.lineWidth = Math.max(px, 0.02);
    g.beginPath();
    g.moveTo(-30, 0);
    g.lineTo(40, 0);
    g.stroke();
    g.strokeStyle = mixHex([26, 30, 18], [112, 120, 64], day);
    g.lineWidth = Math.max(px, 0.01);
    g.beginPath();
    const gust = 0.5 + 0.5 * Math.sin(this.clock * 0.35);
    for (const b of this.grass) {
      if (b.x > HOUSE.x0 - 0.4 && b.x < HOUSE.x1 + 0.4) continue;
      if (b.x > DITCH.x0 && b.x < DITCH.x1) continue;
      if (Math.abs(b.x - URN_X) < 0.5) continue;
      const sway = (0.025 + 0.03 * gust) * Math.sin(this.clock * 1.7 + b.x * 0.9 + b.ph * 0.3) * motion;
      const tip = b.x + b.lean + sway + 0.02 * gust * motion;
      g.moveTo(b.x, 0);
      g.quadraticCurveTo(b.x + b.lean * 0.3, -b.h * 0.55, tip, -b.h);
    }
    g.stroke();
  }

  private drawMother(g: CanvasRenderingContext2D, day: number, motion: number) {
    const m = this.mom(motion);
    const outside = m.x > RAMP.x1 - 0.2;
    // A rim of light from whatever is behind her: the fire inside, the sun outside.
    const rimDx = outside ? 0.016 : -0.016 * Math.sign(m.pose.dir || 1);
    const rim = outside ? `rgba(255, 196, 150, ${0.45 * day})` : `rgba(255, 140, 70, ${0.32 * this.fire(motion)})`;
    drawFigure(g, m.x + rimDx, m.y - 0.008, m.pose, rim);
    drawFigure(g, m.x, m.y, m.pose, outside ? "#1d1410" : "#0f0906");
  }

  /** Low morning mist drifting over the ground. */
  private drawMist(g: CanvasRenderingContext2D, day: number, motion: number) {
    if (day < 0.3) return;
    const a = 0.09 * smooth((day - 0.3) / 0.7);
    for (let i = 0; i < 4; i++) {
      const span = 34;
      const x = ((this.clock * (0.06 + 0.03 * i) * motion + i * 9.3) % span) - 14;
      g.save();
      g.translate(x, -0.12 - 0.05 * i);
      g.scale(5 + i, 0.45);
      const mist = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      mist.addColorStop(0, `rgba(236, 222, 214, ${a})`);
      mist.addColorStop(1, "rgba(236, 222, 214, 0)");
      g.fillStyle = mist;
      g.fillRect(-1, -1, 2, 2);
      g.restore();
    }
  }

  lighting(env: Env): Lighting {
    const t = this.camera(env).t;
    return { ambient: 0.3 + 0.7 * Math.min(1, t * 1.4), lamp: Math.max(0, 1 - t * 2.5), warm: 0.6 };
  }

  fx(): Fx {
    return { dust: 0.2, glow: 0.2 };
  }

  hint() {
    return null;
  }

  exit(env: Env) {
    env.text.clear();
  }
}

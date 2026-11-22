// Scene 4: rise out of the jar through the earth, as an archaeological section,
// to the ground at dawn: a round half-sunken house right beside the jar, and the
// village cemetery away beyond the ditch (R5, F5, F14). World units are metres.

import { mulberry32 } from "../core/rng";
import { Cues, speak, type Env, type Fx, type Lighting, type Scene, type Signal } from "./types";

const RISE = 15;
const URN_X = 0.9;
const HOUSE = { x0: -5.6, x1: -0.6, floor: 0.9, apex: -3.4 };
const DITCH = { x0: 7, x1: 9.6, depth: 1.5 };
const CEMETERY = { x0: 10.2, x1: 13.6 };

interface Pebble {
  x: number;
  y: number;
  r: number;
  a: number;
  c: string;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mixHex = (a: number[], b: number[], t: number) =>
  `rgb(${Math.round(lerp(a[0]!, b[0]!, t))},${Math.round(lerp(a[1]!, b[1]!, t))},${Math.round(lerp(a[2]!, b[2]!, t))})`;

export class AscentScene implements Scene {
  readonly exitFade = "black";
  private cues = new Cues();
  private p = 0;
  private arrived = false;
  private ready = false;
  private readyAt = 0;
  private finish = false;
  private graveGlow = 0;
  private graveTarget = 0;
  private pan = 0;
  private door = 0;
  private doorTarget = 0;
  private panTarget = 0;
  private pebbles: Pebble[] = [];
  private grass: Array<{ x: number; h: number; lean: number }> = [];
  private smoke: Array<{ x: number; y: number; r: number; life: number }> = [];
  private smokeT = 0;

  constructor() {
    const rand = mulberry32(77);
    const cols = ["#9c8a72", "#7d6a55", "#b3a189", "#6a5744"];
    for (let i = 0; i < 520; i++) {
      this.pebbles.push({ x: -16 + rand() * 38, y: 0.08 + rand() * 4.5, r: 0.008 + rand() * 0.04, a: rand() * Math.PI, c: cols[i % cols.length]! });
    }
    for (let i = 0; i < 420; i++) this.grass.push({ x: -16 + rand() * 38, h: 0.05 + rand() * 0.16, lean: (rand() - 0.5) * 0.08 });
  }
  enter(env: Env) {
    this.cues.reset();
    this.p = 0;
    this.arrived = false;
    this.ready = false;
    this.finish = false;
    this.graveGlow = 0;
    this.graveTarget = 0;
    this.pan = 0;
    this.door = 0;
    this.doorTarget = 0;
    this.panTarget = 0;
    this.smoke = [];
    env.lamp.radius = Math.min(env.w, env.h) * 0.14;
    env.audio.set({ shimmer: 0.2, tension: 0, drone: 0.35, earth: 0.3, warm: 0.35 }, 3);
  }

  /** Camera: from tight on the jar to a wide view of house, ground and sky. */
  private camera(env: Env) {
    const shown = env.reduced ? (this.p < 0.34 ? 0 : this.p < 0.67 ? 0.5 : 1) : ease(this.p);
    const portrait = env.h > env.w;
    const ppm0 = (env.h * 0.6) / 0.75;
    const ppm1 = portrait ? Math.max(env.w / 8, env.h / 18) : Math.min(env.w / 23, env.h / 10.5);
    return {
      x: lerp(URN_X, portrait ? -1.6 : 2.8, shown) + this.pan,
      y: lerp(0.66, -1.7, shown),
      ppm: Math.exp(lerp(Math.log(ppm0), Math.log(ppm1), shown)),
      t: shown,
    };
  }

  update(dt: number, env: Env): Signal {
    this.cues.update(dt);
    if (!this.arrived) {
      this.p = Math.min(1, this.p + dt / RISE);
      const t = this.camera(env).t;
      env.audio.set({ warm: 0.35 + 0.6 * t, drone: 0.35 * (1 - t), earth: 0.3 * (1 - t), shimmer: 0.2 * (1 - t) }, 0.5);
      if (this.p >= 1) {
        this.arrived = true;
        env.audio.bell(1, 0.05);
        const st = env.s.story;
        this.cues.after(1.5, () => {
          speak(env, st.notTheField);
          this.graveTarget = 1;
          // On a tall, narrow screen the cemetery is out of frame: look over to it.
          if (env.h > env.w) this.panTarget = (CEMETERY.x0 + CEMETERY.x1) / 2 + 1.6 - 1.2;
        });
        this.cues.after(8.5, () => {
          this.graveTarget = 0;
          this.panTarget = 0;
          this.doorTarget = 1;
          speak(env, st.byTheDoor);
        });
        this.cues.after(14.5, () => speak(env, st.everyMorning));
        this.cues.after(21, () => {
          env.text.hint.show(env.s.ui.continue);
          this.ready = true;
          this.readyAt = this.cues.t;
        });
      }
    }
    this.graveGlow += (this.graveTarget - this.graveGlow) * Math.min(1, dt * 1.2);
    this.door += (this.doorTarget - this.door) * Math.min(1, dt * 1.2);
    this.pan += (this.panTarget - this.pan) * Math.min(1, dt * (env.reduced ? 6 : 0.9));
    if (this.ready && (env.input.confirmed || this.cues.t - this.readyAt > 8)) this.finish = true;

    this.smokeT += dt;
    if (this.smokeT > 0.8) {
      this.smokeT = 0;
      this.smoke.push({ x: (HOUSE.x0 + HOUSE.x1) / 2, y: HOUSE.apex - 0.1, r: 0.12, life: 1 });
    }
    for (const s of this.smoke) {
      s.life -= dt / 7;
      s.y -= dt * 0.28;
      s.x += dt * (0.22 + 0.12 * Math.sin(s.life * 9)) * env.motion;
      s.r += dt * 0.2;
    }
    this.smoke = this.smoke.filter((s) => s.life > 0);
    return this.finish ? "next" : "stay";
  }
  render(g: CanvasRenderingContext2D, env: Env) {
    const cam = this.camera(env);
    const { w, h } = env;
    const groundY = h / 2 - cam.y * cam.ppm;
    const day = Math.min(1, Math.max(0, (cam.t - 0.25) / 0.75));

    // Sky: night blue warming to dawn at the horizon.
    const sky = g.createLinearGradient(0, 0, 0, Math.max(1, groundY));
    sky.addColorStop(0, mixHex([5, 7, 14], [44, 58, 92], day));
    sky.addColorStop(0.65, mixHex([12, 15, 26], [150, 128, 132], day));
    sky.addColorStop(1, mixHex([20, 20, 28], [240, 176, 124], day));
    g.fillStyle = sky;
    g.fillRect(0, 0, w, Math.max(0, groundY + DITCH.depth * cam.ppm) + 2);
    if (groundY > 0) {
      const sunX = w * 0.82 - cam.x * cam.ppm * 0.05;
      const sun = g.createRadialGradient(sunX, groundY, 0, sunX, groundY, w * 0.6);
      sun.addColorStop(0, `rgba(255, 214, 160, ${0.75 * day})`);
      sun.addColorStop(0.25, `rgba(255, 180, 120, ${0.3 * day})`);
      sun.addColorStop(1, "rgba(255, 180, 120, 0)");
      g.fillStyle = sun;
      g.fillRect(0, 0, w, groundY);
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
    }

    g.save();
    g.translate(w / 2 - cam.x * cam.ppm, h / 2 - cam.y * cam.ppm);
    g.scale(cam.ppm, cam.ppm);
    const px = 1 / cam.ppm;
    this.drawEarth(g, px, day);
    this.drawHouse(g, px, day);
    this.drawJar(g, px);
    this.drawSurface(g, px, day);
    g.restore();
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
    // The open ditch lies in shadow.
    g.fillStyle = `rgba(24, 20, 22, ${0.82 - 0.22 * day})`;
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
    for (const p of this.pebbles) {
      if (p.y < this.surfaceY(p.x) + 0.03) continue;
      if (p.x > HOUSE.x0 && p.x < HOUSE.x1 && p.y < HOUSE.floor + 0.05) continue;
      g.fillStyle = p.c;
      g.beginPath();
      g.ellipse(p.x, p.y, p.r, p.r * 0.65, p.a, 0, Math.PI * 2);
      g.fill();
    }
  }
  /** A round, half-sunken house with a thatched cone roof, cut away to show the hearth (F14). */
  private drawHouse(g: CanvasRenderingContext2D, px: number, day: number) {
    const { x0, x1, floor, apex } = HOUSE;
    const cx = (x0 + x1) / 2;
    const roofAt = (x: number) => apex + (Math.abs(x - cx) / ((x1 - x0) / 2 + 0.35)) * -apex;
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
    // Hearth glow on the floor.
    const glow = g.createRadialGradient(cx, floor - 0.05, 0, cx, floor - 0.05, 2.2);
    glow.addColorStop(0, "rgba(255, 150, 70, 0.55)");
    glow.addColorStop(0.3, "rgba(220, 110, 50, 0.18)");
    glow.addColorStop(1, "rgba(220, 110, 50, 0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = glow;
    g.fillRect(cx - 2.2, floor - 2.3, 4.4, 2.4);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#e08a45";
    g.beginPath();
    g.ellipse(cx, floor - 0.02, 0.28, 0.05, 0, 0, Math.PI * 2);
    g.fill();
    // Plastered floor and posts.
    g.fillStyle = "#8f7656";
    g.fillRect(x0 + 0.12, floor, x1 - x0 - 0.24, 0.05);
    g.fillStyle = "#3a2918";
    for (const x of [x0 + 0.7, cx - 0.85, cx + 0.85, x1 - 0.7]) {
      const top = roofAt(x) + 0.2;
      g.fillRect(x - 0.06, top, 0.12, floor - top);
    }
    // Thatch: a thick cone band with straw lines.
    const t = 0.26;
    g.fillStyle = mixHex([44, 33, 20], [150, 116, 64], day);
    g.beginPath();
    g.moveTo(x0 - 0.35, 0.02);
    g.lineTo(cx, apex);
    g.lineTo(x1 + 0.35, 0.02);
    g.lineTo(x1 + 0.35 - t * 1.4, 0.02);
    g.lineTo(cx, apex + t * 1.6);
    g.lineTo(x0 - 0.35 + t * 1.4, 0.02);
    g.closePath();
    g.fill();
    g.strokeStyle = mixHex([24, 18, 10], [96, 72, 38], day);
    g.lineWidth = Math.max(px, 0.012);
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const f = i / 40;
      for (const s of [-1, 1]) {
        const bx = cx + s * f * ((x1 - x0) / 2 + 0.35);
        const by = apex + f * -apex;
        g.moveTo(bx, by);
        g.lineTo(bx - s * 0.18, by - 0.3);
      }
    }
    g.stroke();
    // Smoke from the roof.
    for (const s of this.smoke) {
      const a = 0.1 * s.life * (1 - s.life * 0.55) * (0.4 + day);
      const puff = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      puff.addColorStop(0, `rgba(205, 200, 192, ${a})`);
      puff.addColorStop(1, "rgba(205, 200, 192, 0)");
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
    // A warm mark on the jar's place, so it can still be found from far away.
    const a = 0.12 + 0.3 * this.p + 0.3 * this.door;
    const glow = g.createRadialGradient(X, 0.6, 0, X, 0.6, 1.1);
    glow.addColorStop(0, `rgba(255, 200, 140, ${a})`);
    glow.addColorStop(1, "rgba(255, 200, 140, 0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = glow;
    g.fillRect(X - 1.1, -0.5, 2.2, 2.2);
    g.globalCompositeOperation = "source-over";
  }
  private drawSurface(g: CanvasRenderingContext2D, px: number, day: number) {
    // Cemetery beyond the ditch: low earth over the graves (F5, F14).
    for (let i = 0; i < 4; i++) {
      const x = CEMETERY.x0 + (i + 0.5) * ((CEMETERY.x1 - CEMETERY.x0) / 4);
      g.fillStyle = mixHex([30, 22, 15], [104, 78, 50], day);
      g.beginPath();
      g.ellipse(x, 0.01, 0.34, 0.15, 0, Math.PI, Math.PI * 2);
      g.fill();
      // Each grave, a long pit in section below its mound.
      g.fillStyle = "rgba(40, 28, 18, 0.18)";
      g.fillRect(x - 0.2, 0.02, 0.4, 1.9);
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
    // Ground line and grass.
    g.strokeStyle = mixHex([30, 22, 14], [88, 70, 44], day);
    g.lineWidth = Math.max(px, 0.02);
    g.beginPath();
    g.moveTo(-30, 0);
    g.lineTo(40, 0);
    g.stroke();
    g.strokeStyle = mixHex([26, 30, 18], [112, 120, 64], day);
    g.lineWidth = Math.max(px, 0.01);
    g.beginPath();
    for (const b of this.grass) {
      if (b.x > HOUSE.x0 - 0.4 && b.x < HOUSE.x1 + 0.4) continue;
      if (b.x > DITCH.x0 && b.x < DITCH.x1) continue;
      if (Math.abs(b.x - URN_X) < 0.5) continue;
      g.moveTo(b.x, 0);
      g.lineTo(b.x + b.lean, -b.h);
    }
    g.stroke();
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

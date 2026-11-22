// A woman in a long robe, drawn as a silhouette (story, not history: R7, D-010).
// World units are metres. Feet at the origin; she faces +x when `dir` is 1.

export interface Pose {
  /** 0 standing, 1 kneeling (sitting back on her heels). */
  kneel: number;
  /** Forward tilt of the upper body, radians. */
  lean: number;
  /** Walk cycle phase, radians. */
  walk: number;
  /** How far the legs and arms swing, 0..1. */
  stride: number;
  /** Head bowed, 0..1. */
  bow: number;
  /** Front arm reaching forward and down, 0..1. */
  reach: number;
  /** -1..1: which way she faces; values between squeeze her, as in a turn. */
  dir: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function drawFigure(g: CanvasRenderingContext2D, x: number, y: number, p: Pose, fill: string) {
  const k = Math.min(1, Math.max(0, p.kneel));
  const swing = Math.sin(p.walk) * p.stride;
  g.save();
  g.translate(x, y);
  g.scale(Math.abs(p.dir) < 0.08 ? 0.08 * Math.sign(p.dir || 1) : p.dir, 1);
  g.fillStyle = fill;
  g.strokeStyle = fill;
  g.lineCap = "round";
  g.lineJoin = "round";

  // A slight rise and fall as she walks.
  const hipY = -lerp(0.86, 0.4, k) - 0.018 * Math.abs(Math.cos(p.walk)) * p.stride;

  // Lower legs, under the hem, only while standing or walking.
  if (k < 0.6) {
    g.globalAlpha = 1 - k / 0.6;
    g.lineWidth = 0.07;
    for (const s of [1, -1]) {
      const fx = 0.2 * swing * s;
      const lift = 0.05 * Math.max(0, Math.sin(p.walk + (s > 0 ? 0 : Math.PI))) * p.stride;
      g.beginPath();
      g.moveTo(0.02 * s, -0.36);
      g.lineTo(fx, -0.03 - lift);
      g.lineTo(fx + 0.07, -0.02 - lift);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  // The robe: from the waist to the hem; when kneeling it pools on the ground.
  const wb = { x: -0.12, y: hipY };
  const wf = { x: 0.12, y: hipY };
  const hf = { x: lerp(0.19 + 0.06 * Math.max(0, swing), 0.38, k), y: lerp(-0.18, -0.01, k) };
  const hb = { x: lerp(-0.18 - 0.05 * Math.max(0, -swing), -0.25, k), y: lerp(-0.18, -0.01, k) };
  g.beginPath();
  g.moveTo(wb.x, wb.y);
  g.quadraticCurveTo(lerp(-0.2, -0.3, k), lerp(hipY * 0.45, -0.18, k), hb.x, hb.y);
  g.lineTo(hf.x, hf.y);
  g.quadraticCurveTo(lerp(0.2, 0.36, k), lerp(hipY * 0.45, -0.3, k), wf.x, wf.y);
  g.closePath();
  g.fill();

  // Upper body, tilted about the hips.
  const ux = Math.sin(p.lean);
  const uy = -Math.cos(p.lean);
  const nx = -uy;
  const ny = ux;
  const sh = { x: ux * 0.5, y: hipY + uy * 0.5 };
  g.beginPath();
  g.moveTo(-0.12, hipY);
  g.lineTo(0.12, hipY);
  g.quadraticCurveTo(sh.x + nx * 0.17, sh.y + ny * 0.17 + 0.1, sh.x + nx * 0.13, sh.y + ny * 0.13);
  g.quadraticCurveTo(sh.x, sh.y - 0.04, sh.x - nx * 0.13, sh.y - ny * 0.13);
  g.quadraticCurveTo(sh.x - nx * 0.17, sh.y - ny * 0.17 + 0.1, -0.12, hipY);
  g.closePath();
  g.fill();

  // Arms: the back one swings opposite to the front one.
  const arm = (side: number, angle: number, bend: number) => {
    const ax = sh.x + nx * 0.1 * side;
    const ay = sh.y + ny * 0.1 * side + 0.03;
    const a = p.lean + angle;
    const ex = ax + Math.sin(a) * 0.27;
    const ey = ay + Math.cos(a) * 0.27;
    const b = a + bend;
    g.lineWidth = 0.062;
    g.beginPath();
    g.moveTo(ax, ay);
    g.lineTo(ex, ey);
    g.lineTo(ex + Math.sin(b) * 0.25, ey + Math.cos(b) * 0.25);
    g.stroke();
  };
  arm(-1, 0.1 - 0.35 * swing, 0.15);
  arm(1, lerp(0.12 + 0.35 * swing, 1.05, p.reach), lerp(0.2, 0.55, p.reach));

  // Neck, head and a knot of hair.
  const bx = ux * 0.06 * p.bow;
  const head = { x: sh.x + ux * 0.16 + 0.045 * p.bow + bx, y: sh.y + uy * 0.16 + 0.035 * p.bow };
  g.lineWidth = 0.07;
  g.beginPath();
  g.moveTo(sh.x, sh.y);
  g.lineTo(head.x - 0.01, head.y + 0.06);
  g.stroke();
  g.beginPath();
  g.ellipse(head.x, head.y, 0.088, 0.1, p.lean * 0.6 + p.bow * 0.35, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.arc(head.x - 0.085, head.y - 0.035, 0.052, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

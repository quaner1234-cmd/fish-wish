// The little one in the jar (act 4, D-015): a small child curled up as in the womb,
// drawn only as a shape of soft light. No face, no body detail, nothing of remains
// (R12.1): it reads as sleeping, the way the face said ("The little one is sleeping").
// Local units: about 1.1 wide and 1.5 tall, centred near the origin; the child faces
// +x (knees and hands toward +x), head up, back rounded toward −x.

type Oval = readonly [cx: number, cy: number, rx: number, ry: number, rot: number];

const PARTS: readonly Oval[] = [
  [0.13, -0.45, 0.3, 0.28, 0.4], // head, bowed forward, chin to the chest
  [-0.1, 0, 0.3, 0.42, 0.3], // back, rounded
  [-0.08, 0.36, 0.24, 0.18, 0], // seat
  [0.2, 0.2, 0.27, 0.13, -0.55], // thigh, knee drawn up toward the chin
  [0.33, 0.26, 0.22, 0.09, 1.99], // shin, folded back down
  [0.33, 0.48, 0.11, 0.055, 0.15], // foot
  [0.33, -0.12, 0.15, 0.06, -1.36], // forearm, folded up
  [0.36, -0.28, 0.07, 0.065, 0], // hand by the face
];

/** One path whose sub-shapes all wind the same way, so a single fill paints their union. */
export function infantPath(): Path2D {
  const p = new Path2D();
  for (const [cx, cy, rx, ry, rot] of PARTS) {
    p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot));
    p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  }
  return p;
}

/**
 * Draw the child as light at (x, y), `size` world units per local unit, facing
 * left when `dir` is −1. `glow` (0..1) sets how bright it is.
 */
export function drawInfant(g: CanvasRenderingContext2D, x: number, y: number, size: number, dir: number, tilt: number, glow: number, blurPx: number) {
  if (glow <= 0) return;
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  g.scale(size * dir, size);
  // Warmest at the chest, softer toward the edges, so it has a little roundness.
  const body = g.createRadialGradient(0.02, -0.05, 0, 0.02, -0.05, 0.9);
  body.addColorStop(0, `rgba(255, 228, 182, ${0.74 * glow})`);
  body.addColorStop(0.45, `rgba(255, 206, 140, ${0.52 * glow})`);
  body.addColorStop(1, `rgba(255, 182, 110, ${0.32 * glow})`);
  g.globalCompositeOperation = "lighter";
  g.shadowColor = `rgba(255, 176, 96, ${0.8 * glow})`;
  g.shadowBlur = blurPx;
  g.fillStyle = body;
  g.fill(infantPath());
  g.restore();
}

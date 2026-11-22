// The human-face-and-fish motif, drawn in code from written descriptions (F2, R3.4):
// round face, pointed topknot with fin-shaped ornaments, forehead half black and
// half a black arc, narrow flat eyes, an inverted-T nose, a small fish at each ear,
// and two large fish whose heads meet at the mouth. No photograph was traced.
// One function draws it, so scene 2 and scene 5 show identical pixels (R6.1).

type G = CanvasRenderingContext2D;

/** Fill a closed shape with a net of crossing lines, clipped to the shape. */
function hatch(g: G, shape: Path2D, spacing: number, width: number, angle = Math.PI / 4) {
  g.save();
  g.clip(shape);
  g.lineWidth = width;
  g.beginPath();
  for (const a of [angle, -angle]) {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    for (let s = -40; s <= 40; s++) {
      const ox = -dy * s * spacing;
      const oy = dx * s * spacing;
      g.moveTo(ox - dx * 40 * spacing, oy - dy * 40 * spacing);
      g.lineTo(ox + dx * 40 * spacing, oy + dy * 40 * spacing);
    }
  }
  g.stroke();
  g.restore();
}

/** A stylized fish pointing along +x, head at x = len/2. Local units. */
export function fishPath(len: number, girth: number): Path2D {
  const p = new Path2D();
  const h = len / 2;
  p.moveTo(h, 0);
  p.quadraticCurveTo(h * 0.35, -girth, -h * 0.62, -girth * 0.18);
  p.lineTo(-h, -girth * 0.62);
  p.lineTo(-h * 0.84, 0);
  p.lineTo(-h, girth * 0.62);
  p.lineTo(-h * 0.62, girth * 0.18);
  p.quadraticCurveTo(h * 0.35, girth, h, 0);
  p.closePath();
  return p;
}

/** Draw a fish with a solid head, netted body and forked tail. */
export function drawFish(g: G, len: number, girth: number, unit: number, solidHead = true) {
  const body = fishPath(len, girth);
  const h = len / 2;
  hatch(g, body, unit * 0.11, unit * 0.028);
  g.lineWidth = unit * 0.05;
  g.stroke(body);
  if (solidHead) {
    // The head follows the body outline, so it never bulges past it.
    const head = new Path2D();
    head.moveTo(h, 0);
    head.quadraticCurveTo(h * 0.78, -girth * 0.42, h * 0.38, -girth * 0.6);
    head.lineTo(h * 0.38, girth * 0.6);
    head.quadraticCurveTo(h * 0.78, girth * 0.42, h, 0);
    g.fill(head);
  }
  // Fins, attached to the body.
  g.beginPath();
  for (const s of [-1, 1]) {
    g.moveTo(h * 0.02, s * girth * 0.5);
    g.lineTo(-h * 0.3, s * girth * 1.12);
    g.lineTo(-h * 0.3, s * girth * 0.34);
    g.closePath();
  }
  g.fill();
}
/**
 * Draw one face group centred at the origin, head toward −y, face radius r.
 * Uses the current fillStyle / strokeStyle (pigment colour).
 */
export function drawFace(g: G, r: number) {
  g.lineCap = "round";
  g.lineJoin = "round";

  // Topknot: a tall netted triangle, and fin-shaped ornaments either side.
  const knot = new Path2D();
  knot.moveTo(-r * 0.3, -r * 0.9);
  knot.lineTo(0, -r * 1.72);
  knot.lineTo(r * 0.3, -r * 0.9);
  knot.closePath();
  hatch(g, knot, r * 0.1, r * 0.026, Math.PI / 3);
  g.lineWidth = r * 0.06;
  g.stroke(knot);
  for (const s of [-1, 1]) {
    const fin = new Path2D();
    fin.moveTo(s * r * 0.33, -r * 0.93);
    fin.quadraticCurveTo(s * r * 0.62, -r * 1.05, s * r * 0.86, -r * 1.42);
    fin.quadraticCurveTo(s * r * 0.58, -r * 1.2, s * r * 0.24, -r * 1.12);
    fin.closePath();
    g.fill(fin);
    g.lineWidth = r * 0.035;
    g.beginPath();
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const x = s * r * (0.36 + 0.46 * t);
      const y = -r * (0.97 + 0.4 * t);
      g.moveTo(x, y);
      g.lineTo(x + s * r * 0.12, y - r * 0.02);
    }
    g.stroke();
  }

  // Face outline.
  g.lineWidth = r * 0.07;
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.stroke();

  // Forehead: one half solid black, the other a black arc band.
  g.save();
  g.beginPath();
  g.arc(0, 0, r, 0, Math.PI * 2);
  g.clip();
  g.fillRect(0, -r * 1.05, r * 1.05, r * 0.92);
  g.beginPath();
  g.arc(0, 0, r, Math.PI, Math.PI * 1.5);
  g.arc(0, 0, r * 0.74, Math.PI * 1.5, Math.PI, true);
  g.closePath();
  g.fill();
  g.restore();

  // Eyes: narrow, flat, closed.
  g.lineWidth = r * 0.075;
  g.beginPath();
  for (const s of [-1, 1]) {
    g.moveTo(s * r * 0.17, r * 0.04);
    g.quadraticCurveTo(s * r * 0.36, r * 0.1, s * r * 0.56, r * 0.03);
  }
  g.stroke();

  // Nose: an inverted T.
  g.lineWidth = r * 0.07;
  g.beginPath();
  g.moveTo(0, -r * 0.06);
  g.lineTo(0, r * 0.34);
  g.moveTo(-r * 0.15, r * 0.34);
  g.lineTo(r * 0.15, r * 0.34);
  g.stroke();

  // Mouth: two large fish whose heads meet at the lips, bodies reaching out past the face.
  for (const m of mouthFish(r)) {
    g.save();
    g.translate(m.x, m.y);
    g.rotate(m.rot);
    drawFish(g, m.len, m.girth, r);
    g.restore();
  }
  const lips = new Path2D();
  lips.moveTo(-r * 0.3, r * 0.56);
  lips.quadraticCurveTo(0, r * 0.5, r * 0.3, r * 0.56);
  lips.quadraticCurveTo(0, r * 0.74, -r * 0.3, r * 0.56);
  g.fill(lips);

  // Ears: a small fish at each side, head inward.
  for (const s of [-1, 1]) {
    g.save();
    g.translate(s * r * 1.26, -r * 0.2);
    g.rotate(s > 0 ? Math.PI - 0.55 : 0.55);
    drawFish(g, r * 0.55, r * 0.1, r * 0.55);
    g.restore();
  }
}

/**
 * The fish the face holds at its mouth, in the face's own frame (radius r, head
 * toward −y). Shared by drawFace and by scene 5, where a fish of light leaves each one.
 */
export function mouthFish(r: number): Array<{ x: number; y: number; rot: number; len: number; girth: number }> {
  return [-1, 1].map((s) => ({ x: s * r * 0.62, y: r * 0.83, rot: s > 0 ? Math.PI + 0.62 : -0.62, len: r * 1.15, girth: r * 0.2 }));
}

/** Centres used by scenes: where face groups and big fish sit on a disk of radius R. */
export interface MotifLayout {
  faces: Array<{ x: number; y: number; r: number; rot: number }>;
  fish: Array<{ x: number; y: number; len: number; rot: number }>;
}

/** Two faces opposite each other, two big fish between them facing opposite ways (F2). */
export function motifLayout(R: number): MotifLayout {
  const fr = R * 0.2;
  const d = R * 0.47;
  return {
    faces: [
      { x: 0, y: -d, r: fr, rot: 0 },
      { x: 0, y: d, r: fr, rot: Math.PI },
    ],
    fish: [
      { x: R * 0.56, y: 0, len: R * 0.62, rot: Math.PI / 2 },
      { x: -R * 0.56, y: 0, len: R * 0.62, rot: -Math.PI / 2 },
    ],
  };
}

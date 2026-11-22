// A fish of light (scene 5, D-014): the outline of the painted fish (face.ts fishPath),
// bent along a travelling wave so it swims. Head at +x, centred at the origin.

type Pt = [number, number];

function quad(p0: Pt, c: Pt, p1: Pt, n: number, out: Pt[]) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const d = t * t;
    out.push([a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1]]);
  }
}

/**
 * `phase` moves the wave from head to tail; `amp` is the tail's sideways swing as a
 * fraction of the length (0 = the straight painted shape).
 */
export function swimmerPath(len: number, girth: number, phase: number, amp: number): Path2D {
  const h = len / 2;
  const pts: Pt[] = [];
  quad([h, 0], [h * 0.35, -girth], [-h * 0.62, -girth * 0.18], 14, pts);
  pts.push([-h, -girth * 0.62], [-h * 0.84, 0], [-h, girth * 0.62]);
  quad([-h * 0.62, girth * 0.18], [h * 0.35, girth], [h, 0], 14, pts);
  const p = new Path2D();
  pts.forEach(([x, y], i) => {
    // 0 at the head, 1 at the tail: the head stays steady, the tail swings.
    const u = (h - x) / len;
    const by = y + amp * len * u * u * Math.sin(phase - u * 4.2);
    if (i === 0) p.moveTo(x, by);
    else p.lineTo(x, by);
  });
  p.closePath();
  return p;
}

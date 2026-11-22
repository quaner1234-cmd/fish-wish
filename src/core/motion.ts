// prefers-reduced-motion support (R9.1).

const query = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

let reduced = query?.matches ?? false;
query?.addEventListener("change", (e) => {
  reduced = e.matches;
});

export function reducedMotion(): boolean {
  return reduced;
}

/** Multiplier for camera movement, flicker and drift: 1 normally, 0.2 when reduced. */
export function motionFactor(): number {
  return reduced ? 0.2 : 1;
}

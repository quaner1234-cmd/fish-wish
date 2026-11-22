// How much of the target area has been brushed clear (R2.3).
// Pure function so it can be unit- and property-tested.

/**
 * @param alpha soil-layer alpha per sample (0..255); low alpha = earth removed
 * @param mask  1 where the sample belongs to the target (jar + basin), else 0
 * @param cut   alpha below this counts as revealed
 * @returns fraction of target samples revealed, 0..1 (0 if the mask is empty)
 */
export function coverageRatio(alpha: ArrayLike<number>, mask: ArrayLike<number>, cut = 128): number {
  let total = 0;
  let open = 0;
  const n = Math.min(alpha.length, mask.length);
  for (let i = 0; i < n; i++) {
    if (!mask[i]) continue;
    total++;
    if (alpha[i]! < cut) open++;
  }
  return total === 0 ? 0 : open / total;
}

/** Circle mask on a size×size grid; cx, cy, r in grid units. */
export function circleMask(size: number, cx: number, cy: number, r: number): Uint8Array {
  const m = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) m[y * size + x] = 1;
    }
  }
  return m;
}

/** Pull the alpha channel out of RGBA image data. */
export function alphaChannel(rgba: Uint8ClampedArray): Uint8Array {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = rgba[i * 4 + 3]!;
  return out;
}

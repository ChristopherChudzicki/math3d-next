/** Per-axis sample cap for implicit surfaces: memory and CPU normals grow as samples³. */
export const MAX_IMPLICIT_SAMPLES = 128;

/**
 * The normalized gradient of a sampled scalar field, one `vec4` per cell, in
 * the x-fastest layout `Sampler` writes. `size` is the full grid, padding
 * included; `values` may be over-allocated, and only its first nx·ny·nz
 * entries are read. Central differences inside, one-sided at the faces; a
 * non-finite or zero gradient gets `[0, 0, 1, 0]`.
 */
export const gradientFromGrid = (
  values: Float32Array,
  size: [number, number, number],
  spacing: [number, number, number],
): Float32Array => {
  const [nx, ny, nz] = size;
  const [hx, hy, hz] = spacing;
  const sy = nx;
  const sz = nx * ny;
  const out = new Float32Array(nx * ny * nz * 4);
  for (let k = 0; k < nz; k += 1) {
    const kLo = k > 0 ? sz : 0;
    const kHi = k < nz - 1 ? sz : 0;
    const dz = ((kLo + kHi) / sz) * hz;
    for (let j = 0; j < ny; j += 1) {
      const jLo = j > 0 ? sy : 0;
      const jHi = j < ny - 1 ? sy : 0;
      const dy = ((jLo + jHi) / sy) * hy;
      for (let i = 0; i < nx; i += 1) {
        const iLo = i > 0 ? 1 : 0;
        const iHi = i < nx - 1 ? 1 : 0;
        const dx = (iLo + iHi) * hx;
        const c = i + sy * j + sz * k;
        const gx = dx ? (values[c + iHi] - values[c - iLo]) / dx : 0;
        const gy = dy ? (values[c + jHi] - values[c - jLo]) / dy : 0;
        const gz = dz ? (values[c + kHi] - values[c - kLo]) / dz : 0;
        const len = Math.sqrt(gx * gx + gy * gy + gz * gz);
        const o = 4 * c;
        if (len > 0 && Number.isFinite(len)) {
          out[o] = gx / len;
          out[o + 1] = gy / len;
          out[o + 2] = gz / len;
        } else {
          out[o + 2] = 1;
        }
      }
    }
  }
  return out;
};

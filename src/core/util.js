export const $ = (id) => document.getElementById(id);

/* ============================================================
   CONSTANTS · coordinates in meters. x = east, z = south, y = up.
   Origin = centre of Cloud Gate. 1 map px of the reference = 0.65 m.
   ============================================================ */
export const D = 3.6; // Millennium Park deck height above Michigan Ave
export const STEP = 0.55,
  PH = 1.75,
  PR = 0.3;
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp = (a, b, t) => a + (b - a) * t;
export function mulberry(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry(20261025);
export const pick = (arr, r = rnd) => arr[Math.floor(r() * arr.length)];

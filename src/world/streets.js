import * as T from 'three';
import { scene } from '../core/renderer.js';
import { stdMat } from '../core/materials.js';
import { acc } from '../core/geometry.js';
import { ROADS, onRoad, road } from '../core/collision.js';

/* ============================================================ STREET GRID */
// N–S streets (curb to curb)
road(-98, -72, -2000, 2000, 'Michigan Ave');
road(-210, -194, -2000, 2000, 'Wabash Ave');
road(-335, -317, -2000, 2000, 'State St');
road(-455, -439, -2000, 2000, 'Dearborn St');
road(-575, -559, -2000, 2000, 'Clark St');
road(-695, -679, -2000, 2000, 'LaSalle St');
road(-815, -799, -2000, 2000, 'Wells St');
road(177, 213, -2000, 2000, 'Columbus Dr');
road(432, 470, -2000, 2000, 'DuSable Lake Shore Dr');
road(68, 82, -2000, -172, 'Stetson Ave');
// E–W streets
road(-1200, 470, -172, -152, 'Randolph St');
road(-1200, 470, 173, 195, 'Monroe');
road(-1200, -98, -65, -49, 'Washington St');
road(-1200, -98, 54, 72, 'Madison St');
road(-1200, -98, -290, -274, 'Lake St');
road(-1200, -98, 300, 316, 'Adams St');
road(-1200, -98, 420, 436, 'Jackson Blvd');
road(-1200, -98, 540, 556, 'Van Buren St');
road(-1200, 82, -410, -394, 'South Water St');

/* intersections & signals */
export const INTERS = [];
function inter(nsName, ewName, x0, x1, z0, z1, off) {
  INTERS.push({
    ns: nsName,
    ew: ewName,
    x0,
    x1,
    z0,
    z1,
    cx: (x0 + x1) / 2,
    cz: (z0 + z1) / 2,
    off,
    cycle: 52,
    nsG: 22,
  });
}
const NSX = { Michigan: [-98, -72], Wabash: [-210, -194], Columbus: [177, 213], LSD: [432, 470] };
const EWZ = {
  Randolph: [-172, -152],
  Washington: [-65, -49],
  Madison: [54, 72],
  Monroe: [173, 195],
  Lake: [-290, -274],
  Adams: [300, 316],
};
[
  ['Michigan', 'Randolph', 0],
  ['Michigan', 'Washington', 9],
  ['Michigan', 'Madison', 18],
  ['Michigan', 'Monroe', 27],
  ['Michigan', 'Lake', 36],
  ['Michigan', 'Adams', 45],
  ['Wabash', 'Randolph', 5],
  ['Wabash', 'Washington', 14],
  ['Wabash', 'Madison', 23],
  ['Wabash', 'Monroe', 32],
  ['Wabash', 'Lake', 41],
  ['Wabash', 'Adams', 50],
  ['Columbus', 'Randolph', 12],
  ['Columbus', 'Monroe', 30],
  ['LSD', 'Randolph', 20],
  ['LSD', 'Monroe', 40],
].forEach(([a, b, o]) => inter(a, b, NSX[a][0], NSX[a][1], EWZ[b][0], EWZ[b][1], o));
export function inInter(x, z, m = 0) {
  for (const I of INTERS) if (x > I.x0 - m && x < I.x1 + m && z > I.z0 - m && z < I.z1 + m) return I;
  return null;
}
export function sig(I, axis, t) {
  const l = (t + I.off) % I.cycle;
  if (axis === 'NS') return l < I.nsG ? 'G' : l < I.nsG + 3 ? 'Y' : 'R';
  const e0 = I.nsG + 5,
    eg = I.cycle - I.nsG - 10;
  return l >= e0 && l < e0 + eg ? 'G' : l >= e0 + eg && l < e0 + eg + 3 ? 'Y' : 'R';
}

/* city blocks (raised sidewalks) — the complement of the road grid */
const EXT = { x0: -1000, x1: 518, z0: -760, z1: 760 };
(function blocks() {
  const xs = new Set([EXT.x0, EXT.x1]),
    zs = new Set([EXT.z0, EXT.z1]);
  for (const r of ROADS) {
    if (r.x0 > EXT.x0 && r.x0 < EXT.x1) xs.add(r.x0);
    if (r.x1 > EXT.x0 && r.x1 < EXT.x1) xs.add(r.x1);
    if (r.z0 > EXT.z0 && r.z0 < EXT.z1) zs.add(r.z0);
    if (r.z1 > EXT.z0 && r.z1 < EXT.z1) zs.add(r.z1);
  }
  const X = [...xs].sort((a, b) => a - b),
    Z = [...zs].sort((a, b) => a - b);
  const a = acc('sidewalk');
  for (let j = 0; j < Z.length - 1; j++) {
    let run = null;
    for (let i = 0; i < X.length - 1; i++) {
      const cx = (X[i] + X[i + 1]) / 2,
        cz = (Z[j] + Z[j + 1]) / 2,
        isB = !onRoad(cx, cz);
      if (isB) {
        if (!run) run = [X[i], X[i + 1]];
        else run[1] = X[i + 1];
      }
      if ((!isB || i === X.length - 2) && run) {
        const [x0, x1] = run,
          z0 = Z[j],
          z1 = Z[j + 1];
        a.top(x0, x1, z0, z1, 0, 6);
        a.wall(x0, z1, x1, z1, -0.16, 0, 6, 6);
        a.wall(x1, z1, x1, z0, -0.16, 0, 6, 6);
        a.wall(x1, z0, x0, z0, -0.16, 0, 6, 6);
        a.wall(x0, z0, x0, z1, -0.16, 0, 6, 6);
        run = null;
      }
    }
  }
  // asphalt base
  const r = acc('asphalt');
  r.top(EXT.x0, EXT.x1, EXT.z0, EXT.z1, -0.15, 8);
})();

// distant ground beyond the modelled grid
{
  const g = new T.Mesh(new T.PlaneGeometry(6000, 6000, 80, 80), stdMat({ color: 0x7f7c76 }));
  g.rotation.x = -Math.PI / 2;
  g.position.set(518 - 3000, -0.2, 0);
  scene.add(g);
}

/* ---- lane paint ---- */
(function paint() {
  const P = acc('paint'),
    Y = [0.86, 0.66, 0.12],
    W = [0.88, 0.88, 0.86],
    y = -0.135;
  const strip = (x0, z0, x1, z1, w, col) => {
    const dx = x1 - x0,
      dz = z1 - z0,
      l = Math.hypot(dx, dz),
      nx = ((-dz / l) * w) / 2,
      nz = ((dx / l) * w) / 2;
    P.quad(
      [x0 - nx, y, z0 - nz],
      [x0 + nx, y, z0 + nz],
      [x1 + nx, y, z1 + nz],
      [x1 - nx, y, z1 - nz],
      [0, 0, 0, 0, 0, 0, 0, 0],
      col,
    );
  };
  const NS = (x, z0, z1, col, dash, w = 0.12) => {
    for (let z = z0; z < z1; z += dash ? 9 : 3) {
      const ze = Math.min(z1, z + (dash ? 3 : 3));
      if (inInter(x, (z + ze) / 2, 1.5)) continue;
      strip(x, z, x, ze, w, col);
    }
  };
  const EW = (z, x0, x1, col, dash, w = 0.12) => {
    for (let x = x0; x < x1; x += dash ? 9 : 3) {
      const xe = Math.min(x1, x + 3);
      if (inInter((x + xe) / 2, z, 1.5)) continue;
      strip(x, z, xe, z, w, col);
    }
  };
  // Michigan: 3 + 3 lanes, double yellow
  NS(-85.15, -760, 760, Y);
  NS(-84.85, -760, 760, Y);
  [-81.75, -78.45, -88.25, -91.55].forEach((x) => NS(x, -760, 760, W, 1));
  NS(-195.5, -760, 760, W);
  NS(-202, -760, 760, W, 1); // Wabash one-way
  NS(193.5, -760, 760, Y, 0, 0.15);
  NS(196.5, -760, 760, Y, 0, 0.15);
  [190.2, 186.9, 199.8, 203.1].forEach((x) => NS(x, -760, 760, W, 1));
  NS(450.85, -760, 760, Y);
  NS(451.15, -760, 760, Y);
  [445.5, 442.1, 456.0, 459.4].forEach((x) => NS(x, -760, 760, W, 1));
  EW(-162.15, -1000, 470, Y);
  EW(-161.85, -1000, 470, Y);
  EW(-157.2, -1000, 470, W, 1);
  EW(-166.8, -1000, 470, W, 1);
  EW(183.85, -1000, 470, Y);
  EW(184.15, -1000, 470, Y);
  EW(188.8, -1000, 470, W, 1);
  EW(179.2, -1000, 470, W, 1);
  EW(-57, -1000, -98, W, 1);
  EW(63, -1000, -98, W, 1);
  EW(-282, -1000, -98, Y);
  EW(308, -1000, -98, Y);
  // crosswalks + stop bars
  for (const I of INTERS) {
    const wx = I.x1 - I.x0,
      wz = I.z1 - I.z0;
    for (const s of [-1, 1]) {
      const zc = s < 0 ? I.z0 - 2.2 : I.z1 + 2.2;
      if (onRoad(I.cx, zc + s * 3)) {
        for (let x = I.x0 + 0.6; x < I.x1 - 0.6; x += 1.2) strip(x, zc - 1.6, x, zc + 1.6, 0.55, W);
        strip(I.x0 + 0.3, zc + s * 2.1, I.x1 - 0.3, zc + s * 2.1, 0.4, W);
      }
      const xc = s < 0 ? I.x0 - 2.2 : I.x1 + 2.2;
      if (onRoad(xc + s * 3, I.cz)) {
        for (let z = I.z0 + 0.6; z < I.z1 - 0.6; z += 1.2) strip(xc - 1.6, z, xc + 1.6, z, 0.55, W);
        strip(xc + s * 2.1, I.z0 + 0.3, xc + s * 2.1, I.z1 - 0.3, 0.4, W);
      }
    }
  }
})();

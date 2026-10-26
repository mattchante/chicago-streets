import * as T from 'three';
import { mulberry } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { ENV, stdMat } from '../core/materials.js';
import { Acc, acc } from '../core/geometry.js';
import { colCirc } from '../core/collision.js';
import { overlay } from './park.js';
import { building } from './buildings.js';

/* ============================================================ MAGGIE DALEY PARK + GRANT PARK */
(function maggie() {
  overlay('grass', 219, 426, -146, 167, 0.01, 6);
  overlay('grass', 219, 426, 201, 750, 0.01, 6);
  overlay('grass', -66, 40, 201, 262, 0.01, 6);
  // ice skating ribbon (a looping path) around the climbing wall
  const loop = [
    [240, -110],
    [262, -136],
    [300, -130],
    [332, -140],
    [348, -110],
    [332, -86],
    [342, -60],
    [300, -50],
    [268, -66],
    [244, -58],
    [230, -84],
  ];
  const curve = new T.CatmullRomCurve3(
    loop.map((p) => new T.Vector3(p[0], 0, p[1])),
    true,
    'catmullrom',
    0.5,
  );
  const N = 160,
    rb = new Acc();
  const P = curve.getSpacedPoints(N);
  for (let i = 0; i < N; i++) {
    const a = P[i],
      b = P[i + 1],
      c = P[(i + 2) % N];
    const dx = b.x - a.x,
      dz = b.z - a.z,
      l = Math.hypot(dx, dz),
      nx = (-dz / l) * 3,
      nz = (dx / l) * 3;
    const dx2 = c.x - b.x,
      dz2 = c.z - b.z,
      l2 = Math.hypot(dx2, dz2),
      mx = (-dz2 / l2) * 3,
      mz = (dx2 / l2) * 3;
    rb.quad(
      [a.x - nx, 0.06, a.z - nz],
      [a.x + nx, 0.06, a.z + nz],
      [b.x + mx, 0.06, b.z + mz],
      [b.x - mx, 0.06, b.z - mz],
      [0, 0, 1, 0, 1, 1, 0, 1],
    );
  }
  rb.mesh(
    stdMat({
      color: 0xa9b2b6,
      roughness: 0.35,
      envMap: ENV,
      envMapIntensity: 0.3,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      polygonOffsetUnits: -5,
    }),
    false,
    true,
  );
  // climbing wall: sculpted grey towers
  const r = mulberry(66);
  for (let i = 0; i < 5; i++) {
    const x = 296 + r() * 14,
      z = -98 + r() * 16,
      h = 8 + r() * 6,
      rad = 2 + r() * 1.8;
    const g = new T.CylinderGeometry(rad * 0.6, rad, h, 7, 3);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++)
      p.setXYZ(k, p.getX(k) * (1 + (r() - 0.5) * 0.25), p.getY(k), p.getZ(k) * (1 + (r() - 0.5) * 0.25));
    g.computeVertexNormals();
    const m = new T.Mesh(g, stdMat({ color: 0x8d8b86, roughness: 0.95, flatShading: true }));
    m.position.set(x, h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    colCirc(x, z, rad, h);
  }
  // fieldhouse
  building({ x0: 326, x1: 348, z0: -32, z1: -12, h: 6, style: 'glassDark', sf: null });
  // play garden towers
  for (let i = 0; i < 4; i++) {
    const x = 345 + i * 9,
      z = 70 + (i % 2) * 10;
    const m = new T.Mesh(
      new T.CylinderGeometry(1.4, 1.8, 7 + i, 8),
      stdMat({ color: [0x4f8fb8, 0x6aa5c9, 0x3a7ba3, 0x84b7d4][i], roughness: 0.6 }),
    );
    m.position.set(x, (7 + i) / 2, z);
    m.castShadow = true;
    scene.add(m);
    colCirc(x, z, 1.8, 9);
  }
  // tennis courts
  for (let i = 0; i < 3; i++) overlay('court', 356 + i * 21, 374 + i * 21, -142, -106, 0.04, 36);
  // winding paths
  const paths = [
    [
      [220, -10],
      [240, 0],
      [262, 6],
      [284, 17],
      [300, 30],
      [320, 40],
      [350, 30],
      [380, 10],
      [420, 0],
    ],
    [
      [300, 30],
      [296, 60],
      [300, 100],
      [290, 140],
      [280, 168],
    ],
    [
      [220, 120],
      [250, 110],
      [280, 100],
      [300, 100],
    ],
    [
      [350, 30],
      [370, -10],
      [365, -60],
      [380, -100],
      [420, -120],
    ],
  ];
  for (const pl of paths) {
    const c = new T.CatmullRomCurve3(pl.map((p) => new T.Vector3(p[0], 0, p[1])));
    const Q = c.getSpacedPoints(80),
      a = acc('ov_path');
    for (let i = 0; i < Q.length - 1; i++) {
      const p = Q[i],
        q = Q[i + 1];
      const dx = q.x - p.x,
        dz = q.z - p.z,
        l = Math.hypot(dx, dz),
        nx = (-dz / l) * 1.8,
        nz = (dx / l) * 1.8;
      a.quad(
        [p.x - nx, 0.04, p.z - nz],
        [p.x + nx, 0.04, p.z + nz],
        [q.x + nx, 0.04, q.z + nz],
        [q.x - nx, 0.04, q.z - nz],
        [0, 0, 0.6, 0, 0.6, l / 6, 0, l / 6],
      );
    }
  }
})();

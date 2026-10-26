import * as T from 'three';
import { D, lerp, mulberry } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { MAT } from '../core/materials.js';
import { Acc, acc } from '../core/geometry.js';
import { colRect } from '../core/collision.js';
import { overlay } from './park.js';

/* ============================================================ LURIE GARDEN */
(function lurie() {
  const x0 = 72,
    x1 = 156,
    z0 = 99,
    z1 = 165;
  overlay('garden', x0, x1, z0, z1, D + 0.02, 6);
  // the "seam": boardwalk + water channel running through the garden
  const bw = acc('ov_wood'),
    sx0 = 106,
    sz0 = 99,
    sx1 = 120,
    sz1 = 165;
  const strip = (a0, b0, a1, b1, w, ac, y) => {
    const dx = a1 - a0,
      dz = b1 - b0,
      l = Math.hypot(dx, dz),
      nx = ((-dz / l) * w) / 2,
      nz = ((dx / l) * w) / 2;
    ac.quad(
      [a0 - nx, y, b0 - nz],
      [a0 + nx, y, b0 + nz],
      [a1 + nx, y, b1 + nz],
      [a1 - nx, y, b1 - nz],
      [0, 0, w / 2, 0, w / 2, l / 2, 0, l / 2],
    );
  };
  strip(sx0, sz0, sx1, sz1, 3.6, bw, D + 0.06);
  const wc = new Acc();
  strip(sx0 + 3, sz0, sx1 + 3, sz1, 1.6, wc, D + 0.05);
  const wm = wc.mesh(MAT.water, false, true);
  // paths
  const pa = acc('ov_path');
  pa.top(x0, x1, z0, z0 + 3, D + 0.05, 6);
  pa.top(x0, x0 + 3, z0, z1, D + 0.05, 6);
  // shoulder hedge on the north and west sides
  const hedge = (a0, a1, b0, b1) => {
    const m = new T.Mesh(new T.BoxGeometry(a1 - a0, 4.5, b1 - b0), MAT.hedge);
    m.position.set((a0 + a1) / 2, D + 2.25, (b0 + b1) / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    colRect(a0, a1, b0, b1, D + 4.5);
  };
  hedge(72, 90, 95.5, 98.5);
  hedge(96, 130, 95.5, 98.5);
  hedge(136, 156, 95.5, 98.5);
  hedge(68.5, 71.5, 95.5, 125);
  hedge(68.5, 71.5, 131, 165);
  // plantings: late-October perennials and grasses
  const r = mulberry(55),
    pts = [];
  for (let i = 0; i < 3200; i++) {
    const x = lerp(x0 + 3.5, x1 - 0.5, r()),
      z = lerp(z0 + 3.5, z1 - 0.5, r());
    const t = (z - sz0) / (sz1 - sz0),
      sxx = lerp(sx0, sx1, t);
    if (Math.abs(x - sxx - 1.5) < 3.2) continue;
    pts.push([x, z, r()]);
  }
  const cone = new T.ConeGeometry(0.38, 1, 5);
  cone.translate(0, 0.5, 0);
  const im = new T.InstancedMesh(cone, new T.MeshStandardMaterial({ roughness: 1 }), pts.length);
  const M = new T.Matrix4(),
    C = new T.Color();
  const pal = ['#b59a62', '#8d5a33', '#6f5873', '#6b7440', '#c9a03f', '#9a8a6a', '#7a3e2c'];
  pts.forEach(([x, z, v], k) => {
    const s = 0.6 + v * 0.9;
    M.makeScale(s * (0.8 + r() * 0.6), s * (0.6 + r() * 0.9), s * (0.8 + r() * 0.6));
    M.setPosition(x, D, z);
    im.setMatrixAt(k, M);
    const dark = x < lerp(sx0, sx1, (z - sz0) / (sz1 - sz0));
    C.set(pal[Math.floor(r() * pal.length)]);
    if (dark) C.multiplyScalar(0.8);
    im.setColorAt(k, C);
  });
  im.receiveShadow = true;
  scene.add(im);
})();

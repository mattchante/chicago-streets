import * as T from 'three';
import { D, mulberry } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { stdMat } from '../core/materials.js';
import { colCirc } from '../core/collision.js';
import { inInter } from './streets.js';
import { STAIRS } from './park.js';

/* ============================================================ TREES · late-October colour */
const TREES = [];
function tree(x, z, y = 0, s = 1) {
  if (STAIRS.some((q) => x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2)) return;
  if (x > -46 && x < -27 && z > 80 && z < 160) return;
  if (Math.abs(x) < 14 && Math.abs(z) < 10 && y > 1) return;
  TREES.push([x, z, y, s]);
}
(function plant() {
  const r = mulberry(88);
  // Michigan Ave park frontage + west side
  for (let z = -140; z < 165; z += 11) if (!inInter(-69, z, 4) && (z < -60 || z > 60)) tree(-69.4, z, 0, 0.9);
  for (const z of [-24, -12, 0, 12, 24]) tree(-63, z, 0, 0.78);
  for (let z = -140; z < 165; z += 13) if (!inInter(-101, z, 4) && r() < 0.7) tree(-101, z, 0, 0.8);
  // Randolph & Monroe frontage
  for (let x = -60; x < 170; x += 12) if (!(x > 28 && x < 46)) tree(x, -149.5, 0, 0.85);
  for (let x = -60; x < 170; x += 12) if (!(x > -12 && x < 6)) tree(x, 170.2, 0, 0.85);
  for (let z = -140; z < 165; z += 12) tree(174.3, z, 0, 0.85);
  // Chase Promenade: three rows
  for (const x of [36, 46, 56])
    for (let z = -124; z < 150; z += 9) {
      if (Math.abs(z) < 52 && x === 36) continue;
      tree(x + (r() - 0.5), z + (r() - 0.5) * 2, D, 1.0);
    }
  // Wrigley Square & Crown Fountain groves
  for (let i = 0; i < 14; i++) tree(-62 + r() * 44, -80 + r() * -12 - (i % 2) * 4, 0, 0.9);
  for (const x of [-60, -55, -20]) for (let z = 70; z < 160; z += 10) tree(x + (r() - 0.5), z, 0, 0.95);
  // Boeing galleries
  for (let z = -130; z < -56; z += 12) tree(-6, z, D, 0.9);
  for (let z = 56; z < 146; z += 12) tree(-6, z, D, 0.9);
  // edges of the Great Lawn
  for (let z = -20; z < 90; z += 10) {
    tree(68, z, D, 1);
    tree(167, z, D, 0.9);
  }
  // Maggie Daley & Grant Park
  for (let i = 0; i < 220; i++) {
    const x = 222 + r() * 200,
      z = -140 + r() * 305;
    if (x > 226 && x < 352 && z > -146 && z < -40) continue;
    if (x > 320 && x < 352 && z > -40 && z < -6) continue;
    if (x > 350 && x < 420 && z > -146 && z < -100) continue;
    tree(x, z, 0, 0.8 + r() * 0.5);
  }
  for (let i = 0; i < 240; i++) {
    const x = 222 + r() * 200,
      z = 205 + r() * 500;
    tree(x, z, 0, 0.8 + r() * 0.5);
  }
  for (let i = 0; i < 30; i++) {
    tree(-60 + r() * 96, 206 + r() * 52, 0, 0.8 + r() * 0.4);
  }
  for (let z = -740; z < 740; z += 18) {
    tree(481 + (r() - 0.5) * 2, z, 0, 0.9 + r() * 0.3);
    if (Math.abs(z - 184) > 14 && Math.abs(z + 162) > 14)
      tree(493 + (r() - 0.5) * 2, z + 9, 0, 0.85 + r() * 0.3);
  }
  // Columbus Dr median
  for (let z = -140; z < 165; z += 14) if (!inInter(195, z, 6)) tree(195, z, 0, 0.7);
})();
(function buildTrees() {
  const r = mulberry(99),
    n = TREES.length;
  const trunkG = new T.CylinderGeometry(0.16, 0.26, 1, 7);
  trunkG.translate(0, 0.5, 0);
  const leafG = new T.IcosahedronGeometry(1, 1);
  {
    const p = leafG.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + (Math.sin(p.getX(i) * 7.1 + p.getY(i) * 3.3) * 0.12 + Math.cos(p.getZ(i) * 5.3) * 0.1);
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    leafG.computeVertexNormals();
  }
  const tm = new T.InstancedMesh(trunkG, stdMat({ color: 0x4a3b30, roughness: 1 }), n);
  const lm = new T.InstancedMesh(
    leafG,
    new T.MeshStandardMaterial({ roughness: 0.95, flatShading: false }),
    n * 3,
  );
  const M = new T.Matrix4(),
    C = new T.Color();
  const pal = [
    ['#c9a43a', 0.32],
    ['#d8b54a', 0.12],
    ['#6f8a3a', 0.22],
    ['#556d2e', 0.1],
    ['#c26a2b', 0.12],
    ['#9e3b23', 0.07],
    ['#8a7a38', 0.05],
  ];
  const pc = () => {
    let v = r(),
      a = 0;
    for (const [c, w] of pal) {
      a += w;
      if (v < a) return c;
    }
    return pal[0][0];
  };
  TREES.forEach(([x, z, y, s], i) => {
    const h = (4.2 + r() * 1.6) * s;
    M.makeScale(s * 1.1, h, s * 1.1);
    M.setPosition(x, y, z);
    tm.setMatrixAt(i, M);
    const base = pc();
    for (let k = 0; k < 3; k++) {
      const rad = (2.3 + r() * 1.0) * s;
      const ox = (r() - 0.5) * 2.4 * s,
        oz = (r() - 0.5) * 2.4 * s,
        oy = h + rad * 0.55 + (k === 0 ? 1.2 * s : 0) + (r() - 0.5);
      M.makeScale(rad * (1 + r() * 0.2), rad * (0.85 + r() * 0.2), rad * (1 + r() * 0.2));
      M.setPosition(x + ox, y + oy, z + oz);
      lm.setMatrixAt(i * 3 + k, M);
      C.set(base);
      C.offsetHSL((r() - 0.5) * 0.03, (r() - 0.5) * 0.1, (r() - 0.5) * 0.08);
      lm.setColorAt(i * 3 + k, C);
    }
    colCirc(x, z, 0.32 * s + 0.05, y + h);
  });
  tm.castShadow = true;
  lm.castShadow = true;
  lm.receiveShadow = true;
  scene.add(tm);
  scene.add(lm);
})();

import * as T from 'three';
import { D, lerp, mulberry } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { STY } from '../core/textures.js';
import { MAT, stdMat } from '../core/materials.js';
import { acc } from '../core/geometry.js';
import { colCirc, colRect } from '../core/collision.js';

/* ============================================================ JAY PRITZKER PAVILION + TRELLIS + SEATING */
(function pritzker() {
  const sx = 118,
    sz = -60; // proscenium centre, stage faces south over the Great Lawn
  // stage shell
  const shell = acc('f_backstage');
  const s = acc('stair');
  s.box(sx - 19, sx + 19, sz - 36, sz, D, D + 1.25, 2, 2, 2);
  colRect(sx - 19, sx + 19, sz - 36, sz, D + 1.25);
  const wood = new T.Mesh(new T.BoxGeometry(34, 15, 1), stdMat({ color: 0x6e5238, roughness: 0.65 }));
  wood.position.set(sx, D + 8, sz - 35);
  scene.add(wood);
  for (const dx of [-19.5, 19.5]) {
    shell.box(sx + dx - 1, sx + dx + 1, sz - 37, sz, D, D + 17, STY.backstage.tw, STY.backstage.th, 4);
    colRect(sx + dx - 1, sx + dx + 1, sz - 37, sz, D + 17);
  }
  shell.box(sx - 20.5, sx + 20.5, sz - 37, sz, D + 16, D + 18, STY.backstage.tw, STY.backstage.th, 4);
  // headdress ribbons
  const ribbon = (f, nt, ns) => {
    const p = [],
      idx = [];
    for (let i = 0; i <= nt; i++)
      for (let j = 0; j <= ns; j++) {
        const q = f(i / nt, (j / ns) * 2 - 1);
        p.push(q[0], q[1], q[2]);
      }
    for (let i = 0; i < nt; i++)
      for (let j = 0; j < ns; j++) {
        const a = i * (ns + 1) + j,
          b = a + ns + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const rib = [];
  const rr = mulberry(2004);
  for (let k = 0; k < 17; k++) {
    const side = k % 2 ? -1 : 1,
      r1 = rr(),
      r2 = rr(),
      r3 = rr(),
      r4 = rr(),
      r5 = rr(),
      r6 = rr(),
      r7 = rr(),
      r8 = rr();
    const a0 = ((side > 0 ? lerp(-12, 82, r1) : lerp(98, 192, r1)) * Math.PI) / 180;
    const curl = (side * (20 + 45 * r2) * (r3 < 0.6 ? 1 : -0.7) * Math.PI) / 180,
      len = 12 + 20 * r4,
      r0 = 12.5 + 5 * r5,
      zEnd = (r6 - 0.3) * 16,
      w0 = 3.6 + 3.6 * r7,
      tw0 = 1.0 + 1.6 * r8;
    rib.push(
      ribbon(
        (t, s2) => {
          const a = a0 + curl * Math.pow(t, 1.4),
            r = r0 + len * t;
          const cx = Math.cos(a) * r,
            cy = Math.max(1.5, 7 + Math.sin(a) * r * 0.95),
            cz = -5 + zEnd * t * t;
          const tau = t * tw0,
            radx = Math.cos(a),
            rady = Math.sin(a) * 0.95;
          const wx = Math.sin(tau) * radx,
            wy = Math.sin(tau) * rady,
            wz = Math.cos(tau);
          const w = w0 * (1 - 0.55 * t) * (t < 0.08 ? (t / 0.08) * 0.7 + 0.3 : 1);
          return [cx + wx * w * s2, cy + wy * w * s2, cz + wz * w * s2];
        },
        30,
        5,
      ),
    );
  }
  const grp = new T.Group();
  for (const g of rib) {
    const m = new T.Mesh(g, MAT.steel);
    m.castShadow = true;
    grp.add(m);
  }
  // proscenium frame
  const fr = new T.Mesh(new T.TorusGeometry(17, 1.0, 8, 40, Math.PI), MAT.steel);
  fr.position.set(0, 1, -4);
  grp.add(fr);
  grp.position.set(sx, D, sz);
  scene.add(grp);
  // fixed seating (≈4,000 seats) fanned toward the stage
  const seatG = new T.BoxGeometry(1, 0.55, 0.55);
  const rows = [];
  for (let r = 9; r <= 33; r += 0.95) {
    const n = Math.floor((r * 2.1 * 1.08) / 1.15);
    for (let i = 0; i < n; i++) {
      const a = -1.08 + (2.16 * (i + 0.5)) / n;
      if (Math.abs(a) < 0.06 || Math.abs(Math.abs(a) - 0.6) < 0.04) continue;
      rows.push([r, a]);
    }
  }
  const im = new T.InstancedMesh(seatG, MAT.seat, rows.length);
  const M = new T.Matrix4(),
    Q = new T.Quaternion(),
    S = new T.Vector3(1, 1, 1),
    P = new T.Vector3(),
    Y = new T.Vector3(0, 1, 0);
  rows.forEach(([r, a], k) => {
    const x = sx + Math.sin(a) * r,
      z = sz + 2 + Math.cos(a) * r,
      h = D + 0.28;
    Q.setFromAxisAngle(Y, a);
    S.set((0.62 * r * 2.16) / Math.floor((r * 2.1 * 1.08) / 1.15), 1, 1);
    P.set(x, h, z);
    M.compose(P, Q, S);
    im.setMatrixAt(k, M);
  });
  im.castShadow = true;
  im.receiveShadow = true;
  scene.add(im);
  // trellis: vaulted crisscross of steel pipes, 183 × 91 m, on concrete pylons
  const tx0 = 72,
    tx1 = 164,
    tz0 = -56,
    tz1 = 96,
    tcx = 118,
    vault = (x) => D + 14 + 7 * (1 - ((x - tcx) / 46) ** 2);
  const segs = [];
  const sp = 9.5;
  const clip = (x, z) => x >= tx0 && x <= tx1 && z >= tz0 && z <= tz1;
  for (const dirz of [1, -1])
    for (let c = -300; c <= 300; c += sp) {
      let prev = null;
      for (let x = tx0 - 1; x <= tx1 + 1; x += 2.5) {
        const z = dirz * x + c;
        const p = clip(x, z) ? [x, vault(x), z] : null;
        if (p && prev) segs.push([prev, p]);
        prev = p;
      }
    }
  for (const x of [tx0, tx1])
    for (let z = tz0; z < tz1; z += 4)
      segs.push([
        [x, vault(x), z],
        [x, vault(x), Math.min(tz1, z + 4)],
      ]);
  for (const z of [tz0, tz1])
    for (let x = tx0; x < tx1; x += 2.5)
      segs.push([
        [x, vault(x), z],
        [x + 2.5, vault(x + 2.5), z],
      ]);
  const cyl = new T.CylinderGeometry(0.3, 0.3, 1, 6);
  const tm = new T.InstancedMesh(cyl, MAT.steelSoft, segs.length);
  const A = new T.Vector3(),
    B = new T.Vector3(),
    Dv = new T.Vector3();
  segs.forEach(([a, b], k) => {
    A.set(...a);
    B.set(...b);
    Dv.subVectors(B, A);
    const L = Dv.length();
    Q.setFromUnitVectors(Y, Dv.normalize());
    P.addVectors(A, B).multiplyScalar(0.5);
    S.set(1, L, 1);
    M.compose(P, Q, S);
    tm.setMatrixAt(k, M);
  });
  tm.castShadow = true;
  scene.add(tm);
  const pyl = new T.CylinderGeometry(0.75, 0.9, 1, 10);
  const pylons = [];
  for (const x of [tx0, tx1]) for (let z = -40; z <= 90; z += 26) pylons.push([x, z]);
  const pm = new T.InstancedMesh(pyl, MAT.concrete, pylons.length);
  pylons.forEach(([x, z], k) => {
    const h = vault(x) - D;
    P.set(x, D + h / 2, z);
    Q.identity();
    S.set(1, h, 1);
    M.compose(P, Q, S);
    pm.setMatrixAt(k, M);
    colCirc(x, z, 0.9, 40);
  });
  pm.castShadow = true;
  scene.add(pm);
  // speaker clusters hanging from the trellis
  const spk = new T.InstancedMesh(new T.BoxGeometry(1.2, 2.2, 1.2), MAT.black, 8);
  let q = 0;
  for (const z of [-10, 30, 70])
    for (const x of [96, 140]) {
      if (q >= 8) break;
      P.set(x, vault(x) - 2, z);
      Q.identity();
      S.set(1, 1, 1);
      M.compose(P, Q, S);
      spk.setMatrixAt(q++, M);
    }
  spk.count = q;
  scene.add(spk);
})();

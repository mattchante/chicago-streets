import * as T from 'three';
import { late } from '../core/state.js';
import { D, TAU, clamp, lerp, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { makeTex, speckle } from '../core/textures.js';
import { stdMat } from '../core/materials.js';
import { mergeColored, mx, vcMat } from '../core/geometry.js';
import { colCirc } from '../core/collision.js';
import { LAWN } from './people.js';

/* ============================================================ GREAT LAWN: PICNICS + DOGS */
const LCX = 118,
  LCZ = 32,
  LRX = 46,
  LRZ = 58,
  LY = D + 0.02;
const inLawn = (x, z, k = 1) => ((x - LCX) / LRX) ** 2 + ((z - LCZ) / LRZ) ** 2 < k * k;

export const BLANKETS = [];
(function picnics() {
  const r = mulberry(4242);
  const plaid = (a, b, c, kind) =>
    makeTex(256, 256, (g, w, h) => {
      g.fillStyle = a;
      g.fillRect(0, 0, w, h);
      if (kind === 'ging') {
        g.fillStyle = b;
        for (let i = 0; i < 8; i++) {
          g.globalAlpha = 0.55;
          g.fillRect(i * 32, 0, 16, h);
          g.fillRect(0, i * 32, w, 16);
        }
        g.globalAlpha = 1;
      } else if (kind === 'stripe') {
        for (let i = 0; i < 10; i++) {
          g.fillStyle = i % 2 ? b : c;
          g.fillRect(0, i * 26, w, 13);
        }
      } else {
        g.globalAlpha = 0.6;
        g.fillStyle = b;
        for (let i = 0; i < 4; i++) {
          g.fillRect(i * 64 + 8, 0, 22, h);
          g.fillRect(0, i * 64 + 8, w, 22);
        }
        g.fillStyle = c;
        for (let i = 0; i < 4; i++) {
          g.fillRect(i * 64 + 40, 0, 5, h);
          g.fillRect(0, i * 64 + 40, w, 5);
        }
        g.globalAlpha = 1;
      }
      speckle(g, w, h, r, 0.08, 3000);
      g.strokeStyle = 'rgba(0,0,0,.25)';
      g.lineWidth = 6;
      g.strokeRect(0, 0, w, h);
    });
  const texs = [
    plaid('#f2efe8', '#b3262a', '', 'ging'),
    plaid('#2c4a7a', '#d9c27a', '#8a1f1f', 'tartan'),
    plaid('#e9dcc0', '#2f6b4f', '#c9a24a', 'stripe'),
    plaid('#7a2424', '#1e2a44', '#e8e2d4', 'tartan'),
    plaid('#f4f1e9', '#2d5ea8', '', 'ging'),
    plaid('#3f5f3a', '#e0c35a', '#1a1a1a', 'tartan'),
  ];
  const bmats = texs.map(
    (t) =>
      new T.MeshStandardMaterial({
        map: t,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6,
      }),
  );
  const spots = [];
  for (let tries = 0; spots.length < 13 && tries < 800; tries++) {
    const a = r() * TAU,
      d = Math.sqrt(r()) * 0.74,
      x = LCX + Math.cos(a) * d * LRX,
      z = LCZ + Math.sin(a) * d * LRZ;
    if (z < -14) continue; // keep clear of the seating bowl
    if (Math.hypot(x - 95, z - 60) < 16 || Math.hypot(x - 142, z - 6) < 16) continue; // fetch lanes
    if (spots.some((s) => Math.hypot(s[0] - x, s[1] - z) < 8)) continue;
    spots.push([x, z, r() * Math.PI]);
  }
  // seated / reclining people (instanced, posed once)
  const skins = ['#f1c8a8', '#e0b090', '#c68b62', '#a86f48', '#7c4e33', '#5a3826', '#f5d5bd', '#d9a37d'];
  const tops = [
    '#f2efe8',
    '#2c3a52',
    '#4b4f2c',
    '#b07c4b',
    '#7a2b2b',
    '#5a6e7f',
    '#d8b25a',
    '#a33b2b',
    '#3d3d3d',
    '#8fa9c2',
    '#6e4d6e',
    '#c47a3c',
  ];
  const bots = ['#2d3c55', '#1e1f22', '#3a4a63', '#7d6a4c', '#c9b99a', '#4a4a4a'];
  const hairs = ['#1b1410', '#3b2618', '#5a3b22', '#141414', '#8a6a45', '#c9a46a', '#6b2e1c'];
  const people = [];
  for (const [x, z, rot] of spots) {
    const tex = Math.floor(r() * bmats.length),
      bw = 2.0 + r() * 0.5,
      bd = 1.6 + r() * 0.3;
    const bl = new T.Mesh(new T.PlaneGeometry(bw, bd), bmats[tex]);
    bl.rotation.set(-Math.PI / 2, 0, rot);
    bl.position.set(x, LY + 0.02, z);
    bl.receiveShadow = true;
    scene.add(bl);
    BLANKETS.push({ x, z, rot, bw, bd });
    const cs = Math.cos(rot),
      sn = Math.sin(rot);
    const L2W = (lx, lz) => [x + lx * cs + lz * sn, z - lx * sn + lz * cs];
    const k = 2 + Math.floor(r() * 3);
    const seats = [
      [-0.55, 0.45],
      [0.55, 0.45],
      [-0.5, -0.5],
      [0.6, -0.45],
    ].slice(0, k);
    seats.forEach(([lx, lz], i) => {
      const [px, pz] = L2W((lx * bw) / 2.2, (lz * bd) / 1.8);
      const toC = Math.atan2(x - px, z - pz) + (r() - 0.5) * 0.8;
      const pose = r() < 0.18 ? 'lie' : r() < 0.55 ? 'knees' : r() < 0.8 ? 'lean' : 'cross';
      people.push({
        x: px,
        z: pz,
        face: pose === 'lie' ? r() * TAU : toC,
        pose,
        skin: pick(skins, r),
        top: pick(tops, r),
        bot: pick(bots, r),
        hair: pick(hairs, r),
        s: 0.9 + r() * 0.15,
        ph: r() * TAU,
      });
      colCirc(px, pz, 0.35, LY + 1, LY - 1, { ns: true, cam: false });
    });
    // props: basket, bottles, plates, maybe a cooler or speaker
    const parts = [];
    const P = (g, c, lx, ly, lz, ry = 0, rxx = 0) => {
      const [wx, wz] = L2W(lx, lz);
      parts.push([g, c, mx(wx, LY + ly, wz, rxx, rot + ry, 0)]);
    };
    P(new T.BoxGeometry(0.42, 0.24, 0.3), '#9a6a3a', 0, 0.12, 0);
    P(new T.TorusGeometry(0.16, 0.015, 6, 16, Math.PI), '#6e4a28', 0, 0.24, 0, Math.PI / 2);
    P(new T.BoxGeometry(0.43, 0.03, 0.31), '#c8a46a', 0, 0.25, 0);
    for (let b = 0; b < 1 + Math.floor(r() * 3); b++)
      P(
        new T.CylinderGeometry(0.035, 0.04, 0.28, 10),
        pick(['#2f5a2f', '#5a2a2a', '#d9d4c8', '#2a3a5a'], r),
        0.3 + r() * 0.3,
        0.14,
        (r() - 0.5) * 0.6,
      );
    for (let b = 0; b < 2; b++)
      P(new T.CylinderGeometry(0.11, 0.09, 0.015, 16), '#f4f2ec', -0.35 + r() * 0.2, 0.01, (r() - 0.5) * 0.5);
    if (r() < 0.4)
      P(
        new T.BoxGeometry(0.5, 0.32, 0.32),
        pick(['#2f6fb0', '#b03a2e', '#e8e6e0'], r),
        (-0.75 * bw) / 2,
        0.16,
        0.2,
      );
    if (r() < 0.5)
      P(
        new T.CylinderGeometry(0.13, 0.13, 0.02, 18),
        pick(['#e8572a', '#ffd23f', '#3aa0d8'], r),
        (0.8 * bw) / 2,
        0.01,
        -0.5,
      );
    const m = new T.Mesh(mergeColored(parts), vcMat);
    m.castShadow = true;
    scene.add(m);
  }
  // instanced seated bodies
  const n = people.length;
  const mk = (g) => {
    const m = new T.InstancedMesh(g, new T.MeshStandardMaterial({ roughness: 0.85 }), n);
    m.castShadow = true;
    scene.add(m);
    return m;
  };
  const torso = new T.CylinderGeometry(0.2, 0.17, 0.6, 10),
    head = new T.SphereGeometry(0.115, 12, 10),
    hair = new T.SphereGeometry(0.122, 12, 8, 0, TAU, 0, Math.PI * 0.55);
  const thigh = new T.CylinderGeometry(0.08, 0.068, 0.45, 8);
  thigh.translate(0, -0.225, 0);
  const shin = new T.CylinderGeometry(0.064, 0.052, 0.45, 8);
  shin.translate(0, -0.225, 0);
  const arm = new T.CylinderGeometry(0.05, 0.045, 0.6, 8);
  arm.translate(0, -0.3, 0);
  const foot = new T.BoxGeometry(0.1, 0.08, 0.25);
  const I = { torso: mk(torso), head: mk(head), hair: mk(hair) };
  I.thigh = new T.InstancedMesh(thigh, new T.MeshStandardMaterial({ roughness: 0.85 }), n * 2);
  I.shin = new T.InstancedMesh(shin, I.thigh.material, n * 2);
  I.arm = new T.InstancedMesh(arm, new T.MeshStandardMaterial({ roughness: 0.85 }), n * 2);
  I.foot = new T.InstancedMesh(foot, new T.MeshStandardMaterial({ roughness: 0.6 }), n * 2);
  for (const k of ['thigh', 'shin', 'arm', 'foot']) {
    I[k].castShadow = true;
    scene.add(I[k]);
  }
  const C = new T.Color(),
    B = new T.Matrix4(),
    M = new T.Matrix4(),
    A = new T.Matrix4(),
    R1 = new T.Matrix4(),
    R2 = new T.Matrix4();
  const set = (mesh, i, ...ms) => {
    A.copy(B);
    for (const m of ms) A.multiply(m);
    mesh.setMatrixAt(i, A);
  };
  const tr = (x, y, z) => new T.Matrix4().makeTranslation(x, y, z),
    rX = (a) => new T.Matrix4().makeRotationX(a),
    rY = (a) => new T.Matrix4().makeRotationY(a),
    rZ = (a) => new T.Matrix4().makeRotationZ(a);
  people.forEach((p, i) => {
    B.makeRotationY(p.face);
    B.setPosition(p.x, LY + 0.03, p.z);
    B.multiply(new T.Matrix4().makeScale(p.s, p.s, p.s));
    if (p.pose === 'lie') B.multiply(rX(-Math.PI / 2)).multiply(tr(0, -0.9, 0.13)); // on their back; local +y = toward the head
    const hipY = p.pose === 'lie' ? 0.9 : 0.12,
      lean = p.pose === 'lean' ? -0.35 : p.pose === 'knees' ? 0.12 : 0;
    const body = new T.Matrix4().multiplyMatrices(tr(0, hipY, 0), rX(lean));
    set(I.torso, i, body, tr(0, 0.32, 0));
    set(I.head, i, body, tr(0, 0.76, 0), rX(p.pose === 'lie' ? -0.2 : 0.05));
    set(I.hair, i, body, tr(0, 0.785, -0.01));
    for (const sd of [-1, 1]) {
      const j = i * 2 + (sd > 0 ? 1 : 0);
      let a1,
        a2,
        az = 0;
      if (p.pose === 'lie') {
        a1 = sd > 0 ? 0 : -0.25;
        a2 = sd > 0 ? 0 : 0.5;
      } else if (p.pose === 'knees') {
        a1 = -2.05;
        a2 = 1.75;
      } else if (p.pose === 'lean') {
        a1 = -1.5;
        a2 = sd > 0 ? 0 : 0.4;
      } else {
        a1 = -1.45;
        a2 = 2.4;
        az = sd * 0.75;
      }
      const hip = new T.Matrix4().multiplyMatrices(tr(0.1 * sd, hipY, 0.02), rZ(az)).multiply(rX(a1));
      set(I.thigh, j, hip);
      const knee = hip
        .clone()
        .multiply(tr(0, -0.45, 0))
        .multiply(rX(a2));
      set(I.shin, j, knee);
      set(I.foot, j, knee, tr(0, -0.47, 0.06));
      let sh;
      if (p.pose === 'lean')
        sh = body
          .clone()
          .multiply(tr(0.24 * sd, 0.58, 0))
          .multiply(rX(0.75))
          .multiply(rZ(0.15 * sd));
      else if (p.pose === 'knees')
        sh = body
          .clone()
          .multiply(tr(0.24 * sd, 0.58, 0))
          .multiply(rX(-0.9))
          .multiply(rZ(-0.12 * sd));
      else if (p.pose === 'lie')
        sh = body
          .clone()
          .multiply(tr(0.24 * sd, 0.58, 0))
          .multiply(rZ(sd > 0 ? 2.6 : 0.25 * sd));
      else
        sh = body
          .clone()
          .multiply(tr(0.24 * sd, 0.58, 0))
          .multiply(rX(-0.5))
          .multiply(rZ(-0.25 * sd));
      set(I.arm, j, sh);
      I.thigh.setColorAt(j, C.set(p.bot));
      I.shin.setColorAt(j, C.set(p.bot));
      I.arm.setColorAt(j, C.set(p.top));
      I.foot.setColorAt(j, C.set(pick(['#f2f2ee', '#1c1c1c', '#7a5232', '#3a5a8a'], mulberry(i * 7 + j))));
    }
    I.torso.setColorAt(i, C.set(p.top));
    I.head.setColorAt(i, C.set(p.skin));
    I.hair.setColorAt(i, C.set(p.hair));
  });
  for (const k in I) {
    I[k].instanceMatrix.needsUpdate = true;
    if (I[k].instanceColor) I[k].instanceColor.needsUpdate = true;
  }
})();

/* ---- dogs ---- */
const BREEDS = {
  // H = belly height, R = chest half-depth, L = torso length (m)
  golden: {
    L: 0.78,
    H: 0.3,
    R: 0.16,
    hs: 1.0,
    sn: 0.15,
    ear: 'flop',
    tail: 'plume',
    c: '#c58b3c',
    c2: '#ddb26a',
    bi: false,
  },
  blackLab: {
    L: 0.76,
    H: 0.3,
    R: 0.165,
    hs: 1.0,
    sn: 0.15,
    ear: 'flop',
    tail: 'otter',
    c: '#1d1b19',
    c2: '#262320',
    bi: false,
  },
  yellowLab: {
    L: 0.76,
    H: 0.3,
    R: 0.165,
    hs: 1.0,
    sn: 0.15,
    ear: 'flop',
    tail: 'otter',
    c: '#dcbd85',
    c2: '#e8d2a6',
    bi: false,
  },
  shepherd: {
    L: 0.84,
    H: 0.33,
    R: 0.16,
    hs: 1.05,
    sn: 0.18,
    ear: 'up',
    tail: 'plume',
    c: '#a96d34',
    c2: '#231d18',
    saddle: true,
  },
  husky: {
    L: 0.74,
    H: 0.3,
    R: 0.15,
    hs: 0.98,
    sn: 0.15,
    ear: 'up',
    tail: 'curl',
    c: '#6f7378',
    c2: '#efeeea',
    bi: true,
    mask: true,
  },
  corgi: {
    L: 0.62,
    H: 0.1,
    R: 0.13,
    hs: 0.92,
    sn: 0.12,
    ear: 'big',
    tail: 'stub',
    c: '#c7743a',
    c2: '#f2ede4',
    bi: true,
    mask: true,
  },
  dachshund: {
    L: 0.6,
    H: 0.08,
    R: 0.1,
    hs: 0.8,
    sn: 0.15,
    ear: 'flop',
    tail: 'thin',
    c: '#7b3f1f',
    c2: '#8d4a25',
    bi: false,
  },
  beagle: {
    L: 0.55,
    H: 0.2,
    R: 0.12,
    hs: 0.86,
    sn: 0.12,
    ear: 'flop',
    tail: 'thin',
    c: '#f0ebe2',
    c2: '#a8672f',
    saddle: true,
    tri: true,
  },
  pit: {
    L: 0.66,
    H: 0.25,
    R: 0.16,
    hs: 1.1,
    sn: 0.11,
    ear: 'rose',
    tail: 'thin',
    c: '#8a8580',
    c2: '#f0ece6',
    bi: true,
  },
  doodle: {
    L: 0.74,
    H: 0.32,
    R: 0.17,
    hs: 1.1,
    sn: 0.12,
    ear: 'flop',
    tail: 'plume',
    c: '#e2cba2',
    c2: '#ead8b8',
    bi: false,
    fluffy: true,
  },
};
export const DOGS = [];
function makeDog(br, seed) {
  const B = BREEDS[br],
    r = mulberry(seed),
    s = B.R / 0.16,
    W = B.R * 0.8;
  const g = new T.Group();
  const body = new T.Group();
  g.add(body);
  const sp = (rad, w = 12, h = 10) => new T.SphereGeometry(rad, w, h);
  const cy = (r0, r1, l, seg = 10) => new T.CylinderGeometry(r0, r1, l, seg);
  const y0 = B.H + B.R,
    fl = B.fluffy ? 1.12 : 1;
  const parts = [
    [sp(1, 16, 12), B.c, mx(0, y0, 0, 0, 0, 0, W * fl, B.R * fl, B.L * 0.5)],
    [sp(1, 14, 10), B.c, mx(0, y0 + 0.015, B.L * 0.28, 0, 0, 0, W * 1.08 * fl, B.R * 1.1 * fl, B.R * 1.15)],
    [sp(1, 14, 10), B.c, mx(0, y0 + 0.01, -B.L * 0.3, 0, 0, 0, W * 1.02 * fl, B.R * 0.95 * fl, B.R * 1.1)],
  ];
  if (B.bi)
    parts.push(
      [sp(1, 14, 10), B.c2, mx(0, y0 - B.R * 0.42, B.L * 0.08, 0, 0, 0, W * 0.85, B.R * 0.62, B.L * 0.42)],
      [sp(1, 12, 10), B.c2, mx(0, y0 - 0.01 * s, B.L * 0.36, 0, 0, 0, W * 0.9, B.R * 0.95, B.R * 0.9)],
    );
  if (B.saddle)
    parts.push([
      sp(1, 14, 10),
      B.c2,
      mx(0, y0 + B.R * 0.35, -B.L * 0.06, 0, 0, 0, W * 1.04, B.R * 0.72, B.L * 0.4),
    ]);
  const nk = cy(W * 0.55 * fl, W * 0.72 * fl, 0.2 * s);
  parts.push([nk, B.c, mx(0, y0 + B.R * 0.7, B.L * 0.44, -0.8)]);
  const collarC = pick(['#b3262a', '#2d5ea8', '#e8752a', '#2f7d4a', '#7a3fa0'], r);
  parts.push([
    new T.TorusGeometry(W * 0.62 * fl, 0.016, 6, 18),
    collarC,
    mx(0, y0 + B.R * 0.72, B.L * 0.45, Math.PI / 2 - 0.8),
  ]);
  const bm = new T.Mesh(mergeColored(parts, 0.12, seed), vcMat);
  bm.castShadow = true;
  body.add(bm);
  // head
  const head = new T.Group();
  head.position.set(0, y0 + B.R * 1.35, B.L * 0.5 + 0.07 * s);
  body.add(head);
  const hs = B.hs * (0.75 + s * 0.25) * 0.92,
    muz = B.mask ? B.c2 : B.c;
  const hp = [
    [sp(0.11 * hs), B.c, mx(0, 0, 0, 0, 0, 0, 1, 0.95, 1.08)],
    [
      cy(0.045 * hs, 0.062 * hs, B.sn * s + 0.02),
      muz,
      mx(0, -0.035 * hs, 0.09 * hs + B.sn * s * 0.5, Math.PI / 2),
    ],
    [sp(0.026 * hs, 8, 6), '#141210', mx(0, -0.02 * hs, 0.1 * hs + B.sn * s + 0.01)],
    [sp(0.017 * hs, 8, 6), '#0e0c0b', mx(-0.048 * hs, 0.03 * hs, 0.085 * hs)],
    [sp(0.017 * hs, 8, 6), '#0e0c0b', mx(0.048 * hs, 0.03 * hs, 0.085 * hs)],
  ];
  if (B.mask) hp.push([sp(0.07 * hs), B.c2, mx(0, 0.0, 0.06 * hs, 0, 0, 0, 1.1, 0.7, 0.8)]);
  if (B.tri) hp.push([sp(0.105 * hs), '#3a2a1c', mx(0, 0.03 * hs, -0.02 * hs, 0, 0, 0, 1, 0.8, 1)]);
  for (const sd of [-1, 1]) {
    if (B.ear === 'flop')
      hp.push([
        sp(1, 10, 8),
        B.tri ? '#a8672f' : B.c,
        mx(sd * 0.1 * hs, -0.03 * hs, -0.01, 0, 0, sd * 0.25, 0.03 * hs, 0.1 * hs, 0.065 * hs),
      ]);
    else if (B.ear === 'up')
      hp.push([
        new T.ConeGeometry(0.04 * hs, 0.11 * hs, 4),
        B.c,
        mx(sd * 0.06 * hs, 0.12 * hs, -0.02 * hs, -0.15, 0, -sd * 0.25),
      ]);
    else if (B.ear === 'big')
      hp.push([
        new T.ConeGeometry(0.055 * hs, 0.15 * hs, 4),
        B.c,
        mx(sd * 0.07 * hs, 0.13 * hs, -0.01, -0.1, 0, -sd * 0.3),
      ]);
    else
      hp.push([
        sp(1, 8, 6),
        B.c,
        mx(sd * 0.085 * hs, 0.07 * hs, -0.03, 0, 0, sd * 0.6, 0.025 * hs, 0.05 * hs, 0.04 * hs),
      ]);
  }
  const hm = new T.Mesh(mergeColored(hp, 0.1, seed + 1), vcMat);
  hm.castShadow = true;
  head.add(hm);
  // legs (pivot at shoulder / hip)
  const legs = [];
  const lh = B.H + B.R * 0.45;
  const lt = Math.max(0.045, 0.055 * s);
  for (const [lx, lz] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ]) {
    const piv = new T.Group();
    piv.position.set(lx * W * 0.62, B.H + B.R * 0.45, lz * B.L * 0.36);
    body.add(piv);
    const lc = (B.bi && lz > 0) || B.tri ? B.c2 : B.c;
    const mus =
      lz < 0
        ? [sp(1, 10, 8), B.c, mx(0, -B.R * 0.25, -0.01, 0, 0, 0, lt * 1.25 * fl, B.R * 0.85, lt * 1.9 * fl)]
        : [sp(1, 10, 8), B.c, mx(0, -B.R * 0.2, 0.01, 0, 0, 0, lt * 1.1 * fl, B.R * 0.7, lt * 1.5 * fl)];
    const lg = mergeColored(
      [
        mus,
        [cy(lt * 0.95 * fl, lt * 0.7, lh, 8), B.c, mx(0, -lh / 2, 0)],
        [cy(lt * 0.75, lt * 0.68, lh * 0.4, 8), lc, mx(0, -lh * 0.8, 0)],
        [sp(lt * 0.95, 8, 6), lc, mx(0, -lh + 0.02, lt * 0.5, 0, 0, 0, 1, 0.6, 1.4)],
      ],
      0.1,
      seed + 2,
    );
    const lm = new T.Mesh(lg, vcMat);
    lm.castShadow = true;
    piv.add(lm);
    legs.push(piv);
  }
  // tail
  const tail = new T.Group();
  tail.position.set(0, y0 + B.R * 0.45, -B.L * 0.5);
  body.add(tail);
  let tg;
  if (B.tail === 'plume')
    tg = mergeColored(
      [[new T.ConeGeometry(0.065 * s * fl, 0.42 * s, 8), B.c2 && !B.saddle ? B.c2 : B.c, mx(0, 0.21 * s, 0)]],
      0.12,
      seed + 3,
    );
  else if (B.tail === 'otter')
    tg = mergeColored([[new T.ConeGeometry(0.05 * s, 0.4 * s, 8), B.c, mx(0, 0.2 * s, 0)]], 0.1, seed + 3);
  else if (B.tail === 'curl')
    tg = mergeColored(
      [
        [
          new T.TorusGeometry(0.1 * s, 0.045 * s, 6, 12, Math.PI * 1.4),
          B.c,
          mx(0, 0.1 * s, -0.05, 0, Math.PI / 2, -0.5),
        ],
        [sp(0.045 * s), B.c2, mx(0, 0.2 * s, 0.02)],
      ],
      0.12,
      seed + 3,
    );
  else if (B.tail === 'stub') tg = mergeColored([[sp(0.05 * s), B.c, mx(0, 0.02, 0)]], 0.1, seed + 3);
  else
    tg = mergeColored(
      [[new T.ConeGeometry(0.025 * s, 0.32 * s, 6), B.tri ? '#f0ebe2' : B.c, mx(0, 0.16 * s, 0)]],
      0.1,
      seed + 3,
    );
  const tm = new T.Mesh(tg, vcMat);
  tm.castShadow = true;
  tail.add(tm);
  scene.add(g);
  return {
    g,
    body,
    head,
    legs,
    tail,
    B,
    br,
    x: 0,
    z: 0,
    h: 0,
    v: 0,
    ph: r() * TAU,
    lie: 0,
    sit: 0,
    sniff: 0,
    wag: 1,
    t: r() * 10,
    r,
  };
}
(function placeDogs() {
  const r = mulberry(909);
  const add = (br, o) => {
    const d = makeDog(br, DOGS.length * 31 + 7);
    Object.assign(d, o);
    d.g.position.set(d.x, LY, d.z);
    DOGS.push(d);
    return d;
  };
  // on leashes with the lawn walkers
  const wb = ['golden', 'shepherd', 'corgi', 'husky', 'dachshund'];
  LAWN.walkers.forEach((w, i) => {
    add(wb[i % wb.length], { mode: 'leash', owner: w, x: LCX + 40, z: LCZ });
  });
  // fetch
  const fb = ['blackLab', 'yellowLab'];
  LAWN.throwers.forEach((o, i) => {
    const ball = new T.Mesh(new T.SphereGeometry(0.035, 12, 8), stdMat({ color: 0xc8e23a, roughness: 0.7 }));
    ball.castShadow = true;
    scene.add(ball);
    add(fb[i], {
      mode: 'fetch',
      owner: o,
      x: o.x + 1,
      z: o.z + 1,
      phase: 'wait',
      timer: 1 + i * 2,
      ball,
      bx: o.x,
      bz: o.z,
      by: LY,
    });
  });
  // lounging next to blankets, and wandering sniffers
  const lb = ['beagle', 'pit', 'doodle', 'golden'];
  BLANKETS.slice(0, 4).forEach((b, i) => {
    const a = b.rot + (i % 2 ? Math.PI / 2 : -Math.PI / 2);
    add(lb[i], {
      mode: 'lounge',
      x: b.x + Math.cos(a) * (b.bw / 2 + 0.6),
      z: b.z - Math.sin(a) * (b.bw / 2 + 0.6),
      h: r() * TAU,
      lie: 1,
    });
  });
  BLANKETS.slice(4, 6).forEach((b, i) => {
    add(['husky', 'corgi'][i], {
      mode: 'roam',
      hx: b.x,
      hz: b.z,
      x: b.x + 2,
      z: b.z + 1,
      tx: b.x + 2,
      tz: b.z + 1,
      timer: 0,
    });
  });
  // leash lines
  const lg = new T.BufferGeometry();
  lg.setAttribute('position', new T.BufferAttribute(new Float32Array(LAWN.walkers.length * 6), 3));
  DOGS.leash = new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x2a2420 }));
  DOGS.leash.frustumCulled = false;
  scene.add(DOGS.leash);
})();
const _v = new T.Vector3();
function steerDog(d, tx, tz, vmax, dt, stopR = 0.25) {
  const dx = tx - d.x,
    dz = tz - d.z,
    dist = Math.hypot(dx, dz);
  let want = dist < stopR ? 0 : Math.min(vmax, dist * 1.6 + 0.2);
  if (dist > 0.05) {
    const wh = Math.atan2(dx, dz);
    let dh = wh - d.h;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    d.h += clamp(dh, -dt * (4 + d.v), dt * (4 + d.v));
    if (Math.abs(dh) > 1.2) want *= 0.4;
  }
  d.v += (want - d.v) * Math.min(1, dt * (want > d.v ? 3 : 6));
  d.x += Math.sin(d.h) * d.v * dt;
  d.z += Math.cos(d.h) * d.v * dt;
  if (!inLawn(d.x, d.z, 0.98)) {
    const a = Math.atan2((d.z - LCZ) / LRZ, (d.x - LCX) / LRX);
    d.x = LCX + Math.cos(a) * LRX * 0.98;
    d.z = LCZ + Math.sin(a) * LRZ * 0.98;
  }
  return dist;
}
function lawnPoint(r, k = 0.85) {
  const a = r() * TAU,
    d = Math.sqrt(r()) * k;
  return [LCX + Math.cos(a) * d * LRX, LCZ + Math.sin(a) * d * LRZ];
}
export function updateDogs(dt, t) {
  const near = Math.hypot(late.player.x - LCX, late.player.z - LCZ) < 160;
  if (!near) return;
  const lp = DOGS.leash.geometry.attributes.position.array;
  let li = 0;
  for (const d of DOGS) {
    d.t += dt;
    let sitT = 0,
      lieT = 0,
      sniffT = 0;
    if (d.mode === 'leash') {
      const o = d.owner;
      if (o.fc === undefined) {
        continue;
      }
      const fx = Math.sin(o.fc),
        fz = Math.cos(o.fc),
        rx = Math.cos(o.fc),
        rz = -Math.sin(o.fc);
      const dist = steerDog(d, o.x + fx * 0.9 + rx * 1.0, o.z + fz * 0.9 + rz * 1.0, 2.6, dt, 0.3);
      sniffT = dist < 0.6 && Math.sin(d.t * 0.7) > 0.6 ? 1 : 0;
      // leash: hand → collar
      const hx = o.x + Math.cos(o.fc) * 0.3 + Math.sin(o.fc) * 0.35,
        hz = o.z - Math.sin(o.fc) * 0.3 + Math.cos(o.fc) * 0.35;
      d.head.getWorldPosition(_v);
      lp[li++] = hx;
      lp[li++] = (o.y || LY) + 1.0 * o.h;
      lp[li++] = hz;
      lp[li++] = _v.x;
      lp[li++] = _v.y - 0.12;
      lp[li++] = _v.z;
    } else if (d.mode === 'fetch') {
      const o = d.owner,
        fx = Math.sin(o.face),
        fz = Math.cos(o.face);
      const hx = o.x + fx * 1.1,
        hz = o.z + fz * 1.1;
      if (d.phase === 'wait') {
        const dist = steerDog(d, hx, hz, 2, dt, 0.3);
        if (dist < 0.5) {
          d.h +=
            Math.atan2(Math.sin(o.face + Math.PI - d.h), Math.cos(o.face + Math.PI - d.h)) *
            Math.min(1, dt * 3);
          sitT = 1;
        }
        d.bx = hx;
        d.bz = hz;
        d.by = LY + 0.04;
        d.timer -= dt;
        if (d.timer < 0.5) o.armR = lerp(o.armR, -2.7, Math.min(1, dt * 8));
        if (d.timer <= 0 && dist < 0.8) {
          const a = o.face + (d.r() - 0.5) * 0.9,
            dd = 12 + d.r() * 12;
          let tx = o.x + Math.sin(a) * dd,
            tz = o.z + Math.cos(a) * dd;
          if (!inLawn(tx, tz, 0.9)) {
            const k = 0.9 / Math.sqrt(((tx - LCX) / LRX) ** 2 + ((tz - LCZ) / LRZ) ** 2);
            tx = LCX + (tx - LCX) * k;
            tz = LCZ + (tz - LCZ) * k;
          }
          d.fly = {
            sx: o.x + fx * 0.3,
            sz: o.z + fz * 0.3,
            sy: LY + 1.9 * o.h,
            tx,
            tz,
            u: 0,
            T: 0.9 + dd * 0.03,
          };
          d.phase = 'chase';
        }
      } else if (d.phase === 'chase') {
        const f = d.fly;
        if (f.u < 1) {
          f.u = Math.min(1, f.u + dt / f.T);
          d.bx = lerp(f.sx, f.tx, f.u);
          d.bz = lerp(f.sz, f.tz, f.u);
          d.by = lerp(f.sy, LY + 0.04, f.u) + 4.2 * f.u * (1 - f.u) * (f.T / 1.2);
        }
        const dist = steerDog(d, f.tx, f.tz, 6.8, dt, 0.15);
        if (f.u >= 1 && dist < 0.45) {
          d.phase = 'return';
        }
      } else if (d.phase === 'return') {
        const dist = steerDog(d, hx, hz, 4.6, dt, 0.35);
        d.head.getWorldPosition(_v);
        d.bx = _v.x + Math.sin(d.h) * 0.18 * d.B.hs;
        d.bz = _v.z + Math.cos(d.h) * 0.18 * d.B.hs;
        d.by = _v.y - 0.05;
        if (dist < 0.55) {
          d.phase = 'wait';
          d.timer = 1.8 + d.r() * 2.5;
        }
      }
      o.armR = d.phase === 'wait' && d.timer < 0.5 ? o.armR : lerp(o.armR || 0, 0, Math.min(1, dt * 3));
      d.ball.position.set(d.bx, d.by, d.bz);
    } else if (d.mode === 'lounge') {
      d.v = 0;
      lieT = 1;
      d.head.rotation.y = Math.sin(d.t * 0.35) * 0.6;
      const pd = Math.hypot(late.player.x - d.x, late.player.z - d.z);
      if (pd < 4) {
        const a = Math.atan2(late.player.x - d.x, late.player.z - d.z) - d.h;
        d.head.rotation.y = clamp(Math.atan2(Math.sin(a), Math.cos(a)), -1, 1);
      }
    } else if (d.mode === 'roam') {
      const pd = Math.hypot(late.player.x - d.x, late.player.z - d.z);
      if (pd < 7 && inLawn(late.player.x, late.player.z)) {
        const dist = steerDog(
          d,
          late.player.x - Math.sin(late.player.face) * 0.2 + 0.6,
          late.player.z + 0.6,
          2.8,
          dt,
          0.9,
        );
        if (dist < 1.2) sniffT = 0.6;
      } else {
        d.timer -= dt;
        if (d.timer <= 0 && Math.hypot(d.tx - d.x, d.tz - d.z) < 0.5) {
          if (d.r() < 0.45) {
            d.timer = 2 + d.r() * 3;
            d.sniffing = true;
          } else {
            d.sniffing = false;
            const a = d.r() * TAU,
              dd = 1 + d.r() * 6;
            d.tx = clamp(d.hx + Math.cos(a) * dd, LCX - LRX, LCX + LRX);
            d.tz = d.hz + Math.sin(a) * dd;
            d.timer = 0;
          }
        }
        steerDog(d, d.tx, d.tz, d.r() < 0.02 ? 3.5 : 1.3, dt, 0.3);
        if (d.sniffing && d.timer > 0) sniffT = 1;
      }
    }
    // pose blending
    d.sit = lerp(d.sit, sitT, Math.min(1, dt * 4));
    d.lie = lerp(d.lie, d.mode === 'lounge' ? 1 : lieT, Math.min(1, dt * 3));
    d.sniff = lerp(d.sniff, sniffT, Math.min(1, dt * 3));
    // gait
    const B = d.B,
      v = d.v,
      gal = clamp((v - 3.4) / 2, 0, 1);
    d.ph += ((dt * v) / (B.H * 2.2 + 0.25)) * Math.PI;
    const amp = clamp(v / 1.2, 0, 1) * (0.5 + 0.25 * gal) * (1 - d.lie);
    d.legs.forEach((L, i) => {
      const front = i < 2,
        left = i % 2 === 0;
      let p =
        d.ph + (gal > 0.5 ? (front ? 0 : Math.PI * 0.6) + (left ? 0 : 0.25) : front === left ? 0 : Math.PI);
      let a = Math.sin(p) * amp;
      a -= d.lie * (front ? 1.45 : 1.5);
      if (!front) a -= d.sit * 1.25;
      L.rotation.x = a;
    });
    const bob = Math.abs(Math.sin(d.ph)) * 0.025 * clamp(v, 0, 1);
    d.body.position.y = -d.lie * (B.H * 0.92) - d.sit * B.H * 0.25 + bob;
    d.body.rotation.x = -d.sit * 0.42 + gal * Math.sin(d.ph * 2) * 0.06;
    if (d.mode !== 'lounge' || Math.hypot(late.player.x - d.x, late.player.z - d.z) >= 4)
      d.head.rotation.y =
        d.mode === 'lounge' ? d.head.rotation.y : Math.sin(d.t * 0.9) * 0.15 * (1 - d.sniff);
    d.head.rotation.x = d.sniff * 0.95 - d.sit * 0.35 + d.lie * -0.15 + Math.sin(d.t * 2) * 0.03;
    const wagSp = d.mode === 'fetch' && d.phase !== 'chase' ? 18 : 11;
    d.tail.rotation.z = Math.sin(d.t * wagSp) * (0.35 + 0.2 * d.sit) * (d.lie > 0.5 ? 0.5 : 1);
    const happy = d.mode === 'fetch' || d.mode === 'roam' || d.mode === 'leash' ? 1 : 0;
    d.tail.rotation.x =
      B.tail === 'curl'
        ? -0.25
        : B.tail === 'plume' || B.tail === 'otter'
          ? -2.15 + 0.5 * happy + 0.3 * gal - d.lie * 0.6
          : B.tail === 'stub'
            ? -0.5
            : -1.0 + 0.35 * happy;
    d.g.position.set(d.x, LY, d.z);
    d.g.rotation.y = d.h;
  }
  DOGS.leash.geometry.attributes.position.needsUpdate = true;
}

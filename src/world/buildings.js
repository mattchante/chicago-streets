import * as T from 'three';
import { D, clamp, lerp, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { GENERIC, STY, TX } from '../core/textures.js';
import { ENV, MAT, stdMat } from '../core/materials.js';
import { acc } from '../core/geometry.js';
import { colRect } from '../core/collision.js';

/* ============================================================ BUILDINGS */
const SIGNS = [];
function signTex(text, opt = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const fs = 64;
  g.font = `${opt.weight || 600} ${fs}px ${opt.font || '"Archivo Narrow","Arial Narrow",Arial,sans-serif'}`;
  const w = Math.ceil(g.measureText(text).width) + fs;
  c.width = w;
  c.height = fs * 1.5;
  g.fillStyle = opt.bg || '#1c1a17';
  g.fillRect(0, 0, w, c.height);
  if (opt.border) {
    g.strokeStyle = opt.border;
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, c.height - 12);
  }
  g.font = `${opt.weight || 600} ${fs}px ${opt.font || '"Archivo Narrow","Arial Narrow",Arial,sans-serif'}`;
  g.fillStyle = opt.fg || '#d8b765';
  g.textBaseline = 'middle';
  g.fillText(text, fs / 2, c.height / 2 + 3);
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding;
  t.anisotropy = 4;
  return { t, aspect: w / c.height };
}
export function addSign(text, x, y, z, face, h = 0.7, opt) {
  const { t, aspect } = signTex(text, opt);
  const w = h * aspect;
  const m = new T.Mesh(
    new T.PlaneGeometry(w, h),
    new T.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.2 }),
  );
  const rot = { S: 0, E: Math.PI / 2, N: Math.PI, W: -Math.PI / 2 }[face];
  m.rotation.y = rot;
  m.position.set(x, y, z);
  scene.add(m);
  return m;
}
export const BUILD = [];
export function building(o) {
  // o: x0,x1,z0,z1,h, style, sf (storefront style or null), base(y), sign:{text,face}
  const y0 = o.base || 0,
    sty = STY[o.style],
    sfH = o.sf === null ? 0 : 5.0;
  const a = acc('f_' + o.style);
  const top = y0 + o.h;
  if (sfH) {
    const s = acc('sf_' + (o.sf || 'stone'));
    let u = 0;
    const x0 = o.x0,
      x1 = o.x1,
      z0 = o.z0,
      z1 = o.z1;
    u += s.wall(x0, z1, x1, z1, y0, y0 + sfH, 9, 5, u, y0);
    u += s.wall(x1, z1, x1, z0, y0, y0 + sfH, 9, 5, u, y0);
    u += s.wall(x1, z0, x0, z0, y0, y0 + sfH, 9, 5, u, y0);
    s.wall(x0, z0, x0, z1, y0, y0 + sfH, 9, 5, u, y0);
  }
  {
    let u = 0;
    const x0 = o.x0,
      x1 = o.x1,
      z0 = o.z0,
      z1 = o.z1,
      yb = y0 + sfH;
    u += a.wall(x0, z1, x1, z1, yb, top, sty.tw, sty.th, u, yb);
    u += a.wall(x1, z1, x1, z0, yb, top, sty.tw, sty.th, u, yb);
    u += a.wall(x1, z0, x0, z0, yb, top, sty.tw, sty.th, u, yb);
    a.wall(x0, z0, x0, z1, yb, top, sty.tw, sty.th, u, yb);
  }
  if (!o.noRoof) {
    acc('roof').top(o.x0, o.x1, o.z0, o.z1, top, 8);
    // parapet / cornice
    const c = acc('cornice'),
      e = o.cornice || 0.35;
    c.box(o.x0 - e, o.x1 + e, o.z0 - e, o.z1 + e, top - 0.6, top + 0.15, 4, 4, false);
    c.top(o.x0 - e, o.x1 + e, o.z0 - e, o.z0, top + 0.15, 4);
    c.top(o.x0 - e, o.x1 + e, o.z1, o.z1 + e, top + 0.15, 4);
    c.top(o.x0 - e, o.x0, o.z0, o.z1, top + 0.15, 4);
    c.top(o.x1, o.x1 + e, o.z0, o.z1, top + 0.15, 4);
    if (sfH) {
      c.box(o.x0 - 0.25, o.x1 + 0.25, o.z0 - 0.25, o.z1 + 0.25, y0 + sfH - 0.25, y0 + sfH + 0.1, 4, 4, false);
    }
  }
  if (!o.noCol) colRect(o.x0, o.x1, o.z0, o.z1, top, -1e9);
  if (o.sign) {
    const s = o.sign,
      cx = (o.x0 + o.x1) / 2,
      cz = (o.z0 + o.z1) / 2;
    const p = { W: [o.x0 - 0.06, cz], E: [o.x1 + 0.06, cz], N: [cx, o.z0 - 0.06], S: [cx, o.z1 + 0.06] }[
      s.face
    ];
    addSign(s.text, p[0], y0 + (s.y || 4.45), p[1], s.face, s.h || 0.62, s.opt);
  }
  BUILD.push(o);
  return o;
}
MAT.cornice = stdMat({ map: TX.stone, roughness: 0.8 });
MAT.stair = stdMat({ map: TX.stone, roughness: 0.85 });

/* --- Historic Michigan Boulevard streetwall: west side, building line x = -104 --- */
// Randolph → Washington
building({
  x0: -152,
  x1: -104,
  z0: -147,
  z1: -70,
  h: 32,
  style: 'culture',
  sf: null,
  sign: { text: 'CHICAGO CULTURAL CENTER', face: 'E', y: 4.2, h: 0.8, opt: { bg: '#c9bc9f', fg: '#2e2a22' } },
});
building({ x0: -189, x1: -158, z0: -147, z1: -70, h: 26, style: 'concrete', sf: 'modern' });
building({
  x0: -186,
  x1: -160,
  z0: -142,
  z1: -110,
  h: 160,
  style: 'glassBlue',
  sf: null,
  base: 26,
  noRoof: false,
}); // Heritage at Millennium Park tower
// Washington → Madison
building({
  x0: -150,
  x1: -104,
  z0: -44,
  z1: -12,
  h: 59,
  base: 5,
  style: 'terracotta',
  sf: null,
  noCol: true,
});
building({
  x0: -150,
  x1: -128,
  z0: -44,
  z1: -12,
  h: 5,
  style: 'terracotta',
  sf: 'cream',
  noCol: true,
  noRoof: true,
});
building({
  x0: -128,
  x1: -104,
  z0: -24,
  z1: -12,
  h: 5,
  style: 'terracotta',
  sf: 'cream',
  noCol: true,
  noRoof: true,
  sign: { text: '30 N MICHIGAN', face: 'E' },
});
colRect(-150, -128, -44, -12, 64);
colRect(-128, -104, -24, -12, 64);
colRect(-128, -104, -44, -24, 64, 4.6);
building({ x0: -150, x1: -104, z0: -12, z1: 16, h: 50, style: 'brickTan', sf: 'stone' });
building({
  x0: -150,
  x1: -104,
  z0: 16,
  z1: 49,
  h: 68,
  style: 'terracotta',
  sf: 'stone',
  sign: { text: '6 N MICHIGAN', face: 'E' },
});
building({ x0: -139, x1: -115, z0: 22, z1: 43, h: 14, base: 68, style: 'terracotta', sf: null }); // Montgomery Ward tower stub
building({ x0: -189, x1: -150, z0: -44, z1: 0, h: 78, style: 'brick', sf: 'brick' });
building({ x0: -189, x1: -150, z0: 0, z1: 49, h: 44, style: 'limestone', sf: 'glass' });
// Madison → Monroe
building({
  x0: -136,
  x1: -104,
  z0: 77,
  z1: 99,
  h: 118,
  style: 'limestone',
  sf: 'stone',
  sign: { text: '8 S MICHIGAN', face: 'E' },
}); // Willoughby Tower
building({ x0: -130, x1: -110, z0: 81, z1: 95, h: 18, base: 118, style: 'limestone', sf: null });
building({ x0: -150, x1: -136, z0: 77, z1: 99, h: 40, style: 'brick', sf: null });
building({
  x0: -150,
  x1: -104,
  z0: 99,
  z1: 121,
  h: 52,
  style: 'gothicDark',
  sf: 'brick',
  sign: { text: '12 S MICHIGAN', face: 'E' },
}); // Chicago Athletic Association
building({
  x0: -150,
  x1: -104,
  z0: 121,
  z1: 146,
  h: 46,
  style: 'terracotta',
  sf: 'cream',
  sign: { text: '18 S MICHIGAN', face: 'E' },
}); // Gage Building
building({
  x0: -150,
  x1: -104,
  z0: 146,
  z1: 168,
  h: 56,
  style: 'gothic',
  sf: 'stone',
  sign: { text: 'UNIVERSITY CLUB', face: 'E' },
});
building({ x0: -189, x1: -150, z0: 77, z1: 120, h: 96, style: 'concrete', sf: 'modern' });
building({ x0: -189, x1: -150, z0: 120, z1: 168, h: 62, style: 'brick', sf: 'brick' });
// north of Randolph
(function m150() {
  // 150 N Michigan — the sloped diamond top facing the park
  const x0 = -144,
    x1 = -104,
    z0 = -217,
    z1 = -177,
    hb = 145;
  building({
    x0,
    x1,
    z0,
    z1,
    h: hb,
    style: 'glassBlue',
    sf: 'glass',
    noRoof: true,
    sign: { text: '150 N MICHIGAN', face: 'E' },
  });
  const H = (x, z) => 161 - 0.4 * (x - (x0 + x1) / 2) - 0.4 * (z - (z0 + z1) / 2) * 1 + 0;
  const h = (x, z) => 177 - 16 * ((x - x0) / (x1 - x0)) - 16 * ((z - z0) / (z1 - z0));
  const a = acc('f_glassBlue'),
    tw = STY.glassBlue.tw,
    th = STY.glassBlue.th;
  const W = (ax, az, bx, bz) => {
    a.quad(
      [ax, hb, az],
      [bx, hb, bz],
      [bx, h(bx, bz), bz],
      [ax, h(ax, az), az],
      [
        0,
        0,
        Math.hypot(bx - ax, bz - az) / tw,
        0,
        Math.hypot(bx - ax, bz - az) / tw,
        (h(bx, bz) - hb) / th,
        0,
        (h(ax, az) - hb) / th,
      ],
    );
  };
  W(x0, z1, x1, z1);
  W(x1, z1, x1, z0);
  W(x1, z0, x0, z0);
  W(x0, z0, x0, z1);
  acc('diamond').quad(
    [x0, h(x0, z0), z0],
    [x0, h(x0, z1), z1],
    [x1, h(x1, z1), z1],
    [x1, h(x1, z0), z0],
    [0, 0, 0, 1, 1, 1, 1, 0],
  );
  colRect(x0, x1, z0, z1, 177);
})();
MAT.diamond = stdMat({ color: 0x9fb6c6, metalness: 0.6, roughness: 0.15, envMap: ENV, side: T.DoubleSide });
building({ x0: -189, x1: -144, z0: -269, z1: -177, h: 92, style: 'glassDark', sf: 'glass' });
building({ x0: -144, x1: -104, z0: -269, z1: -217, h: 58, style: 'limestone', sf: 'stone' });
// south of Monroe
building({
  x0: -150,
  x1: -104,
  z0: 200,
  z1: 228,
  h: 64,
  style: 'gothic',
  sf: 'stone',
  sign: { text: '104 S MICHIGAN', face: 'E' },
}); // Monroe Building
building({ x0: -150, x1: -104, z0: 228, z1: 262, h: 52, style: 'terracotta', sf: 'cream' });
building({ x0: -150, x1: -104, z0: 262, z1: 295, h: 74, style: 'limestone', sf: 'stone' });
building({ x0: -189, x1: -150, z0: 200, z1: 295, h: 88, style: 'brickTan', sf: 'brick' });

/* --- north of Randolph, east of Michigan: Prudential Plaza, Aon Center --- */
building({
  x0: -48,
  x1: 2,
  z0: -252,
  z1: -202,
  h: 183,
  style: 'pru1',
  sf: 'modern',
  sign: { text: '130 E RANDOLPH', face: 'S' },
}); // One Prudential Plaza
{
  const m = new T.Mesh(new T.CylinderGeometry(0.6, 0.9, 40, 8), MAT.steelSoft);
  m.position.set(-23, 183 + 20, -227);
  scene.add(m);
}
building({ x0: 10, x1: 56, z0: -262, z1: -216, h: 233, style: 'pru2', sf: 'glass' }); // Two Prudential Plaza
(function pruCrown() {
  const cx = 33,
    cz = -239;
  let w = 46,
    y = 233;
  for (let k = 0; k < 5; k++) {
    w -= 6;
    const hh = 6;
    acc('f_pru2').box(cx - w / 2, cx + w / 2, cz - w / 2, cz + w / 2, y, y + hh, STY.pru2.tw, STY.pru2.th, 4);
    y += hh;
  }
  const pyr = new T.Mesh(
    new T.ConeGeometry(w * 0.72, 26, 4, 1),
    stdMat({ color: 0x9e9890, metalness: 0.5, roughness: 0.35, envMap: ENV }),
  );
  pyr.rotation.y = Math.PI / 4;
  pyr.position.set(cx, y + 13, cz);
  scene.add(pyr);
  const sp = new T.Mesh(new T.CylinderGeometry(0.25, 0.7, 20, 8), MAT.steelSoft);
  sp.position.set(cx, y + 36, cz);
  scene.add(sp);
})();
building({
  x0: 100,
  x1: 159,
  z0: -266,
  z1: -207,
  h: 346,
  style: 'aon',
  sf: 'stone',
  sign: { text: '200 E RANDOLPH', face: 'S' },
}); // Aon Center
building({ x0: -66, x1: -48, z0: -216, z1: -178, h: 9, style: 'concrete', sf: 'glass' });
building({
  x0: 225,
  x1: 275,
  z0: -236,
  z1: -186,
  h: 240,
  style: 'glassDark',
  sf: 'glass',
  sign: { text: '300 E RANDOLPH', face: 'S' },
}); // Blue Cross Blue Shield
building({ x0: 345, x1: 392, z0: -232, z1: -190, h: 122, style: 'concrete', sf: 'modern' }); // 400 E Randolph
building({ x0: 404, x1: 428, z0: -262, z1: -226, h: 165, style: 'glassBlue', sf: 'glass' }); // Harbor Point
// Aqua — wavy balconies
(function aqua() {
  const cx = 243,
    cz = -312,
    w = 34,
    d = 22,
    n = 82,
    fh = 3.18;
  building({
    x0: cx - w / 2 + 2,
    x1: cx + w / 2 - 2,
    z0: cz - d / 2 + 2,
    z1: cz + d / 2 - 2,
    h: n * fh,
    style: 'glassGreen',
    sf: 'glass',
  });
  const g = new T.BoxGeometry(1, 0.3, 1);
  const im = new T.InstancedMesh(g, MAT.white, n);
  const M = new T.Matrix4();
  for (let i = 0; i < n; i++) {
    const y = 5 + i * fh,
      a = Math.sin(i * 0.21) * 2.4 + Math.sin(i * 0.07 + 1) * 2,
      b = Math.cos(i * 0.17) * 2 + Math.sin(i * 0.05) * 1.5;
    M.makeScale(w + a, 1, d + b);
    M.setPosition(cx + Math.sin(i * 0.13) * 1.5, y, cz + Math.cos(i * 0.11) * 1.2);
    im.setMatrixAt(i, M);
  }
  im.castShadow = true;
  scene.add(im);
})();

/* --- Art Institute of Chicago (south of Monroe) --- */
building({
  x0: -62,
  x1: 12,
  z0: 262,
  z1: 400,
  h: 21,
  style: 'beaux',
  sf: null,
  sign: {
    text: 'THE ART INSTITUTE OF CHICAGO',
    face: 'W',
    y: 16,
    h: 1.2,
    opt: { bg: '#c9bea6', fg: '#3b3226' },
  },
});
// Modern Wing with the Bluhm terrace reached by the Nichols Bridgeway
building({ x0: 40, x1: 110, z0: 200, z1: 300, h: 18, style: 'white', sf: null });
building({ x0: 150, x1: 170, z0: 200, z1: 300, h: 18, style: 'white', sf: null });
building({ x0: 110, x1: 150, z0: 250, z1: 300, h: 18, style: 'white', sf: null });
building({
  x0: 110,
  x1: 150,
  z0: 204,
  z1: 250,
  h: 12,
  style: 'white',
  sf: null,
  sign: { text: 'MODERN WING', face: 'N', y: 6, h: 1, opt: { bg: '#ecebe6', fg: '#333' } },
});
(function terraceRail() {
  const c = BUILD[BUILD.length - 1]; /* terrace: rail guard */
  const r = acc('rail');
  for (const [x0, z0, x1, z1] of [
    [110, 204.3, 125, 204.3],
    [137, 204.3, 150, 204.3],
    [110.3, 204, 110.3, 250],
    [149.7, 204, 149.7, 250],
  ]) {
    const len = Math.hypot(x1 - x0, z1 - z0),
      n = Math.round(len / 2);
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n),
        z = lerp(z0, z1, k / n);
      r.box(x - 0.04, x + 0.04, z - 0.04, z + 0.04, 12, 13.05, 1, 1);
    }
    r.box(
      Math.min(x0, x1) - 0.05,
      Math.max(x0, x1) + 0.05,
      Math.min(z0, z1) - 0.05,
      Math.max(z0, z1) + 0.05,
      13,
      13.08,
      1,
      1,
    );
    colRect(
      Math.min(x0, x1) - 0.15,
      Math.max(x0, x1) + 0.15,
      Math.min(z0, z1) - 0.15,
      Math.max(z0, z1) + 0.15,
      13.1,
      11.7,
      { cam: false, ns: true },
    );
  }
  // "flying carpet" sunshade
  const fc = new T.Mesh(new T.BoxGeometry(128, 0.4, 96), stdMat({ color: 0xe9e8e3, roughness: 0.5 }));
  fc.position.set(105, 24, 250);
  fc.castShadow = true;
  scene.add(fc);
  for (const [x, z] of [
    [45, 206],
    [165, 206],
    [45, 296],
    [165, 296],
  ]) {
    const p = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 6, 8), MAT.white);
    p.position.set(x, 21, z);
    scene.add(p);
  }
})();
// Art Institute lions on the Michigan Ave steps
(function lions() {
  const mat = MAT.bronze;
  for (const z of [296, 320]) {
    const g = new T.Group();
    const ped = new T.Mesh(new T.BoxGeometry(2.6, 1.6, 1.4), MAT.stone);
    ped.position.y = 0.8;
    g.add(ped);
    const body = new T.Mesh(new T.SphereGeometry(1, 16, 10), mat);
    body.scale.set(1.25, 0.55, 0.5);
    body.position.set(0.1, 2.15, 0);
    g.add(body);
    const chest = new T.Mesh(new T.SphereGeometry(0.62, 14, 10), mat);
    chest.position.set(-0.85, 2.45, 0);
    g.add(chest);
    const head = new T.Mesh(new T.SphereGeometry(0.42, 14, 10), mat);
    head.scale.set(1, 1, 0.9);
    head.position.set(-1.2, 2.9, 0);
    g.add(head);
    const mane = new T.Mesh(new T.SphereGeometry(0.58, 14, 10), mat);
    mane.scale.set(0.7, 1, 1);
    mane.position.set(-1.0, 2.85, 0);
    g.add(mane);
    g.position.set(-66.5, 0, z);
    g.traverse((o) => {
      o.castShadow = true;
    });
    scene.add(g);
    colRect(-67.8, -65.2, z - 0.7, z + 0.7, 4, -1e9);
  }
  acc('stair').box(-66, -62, 300, 316, 0, 0.5, 2, 2, 2);
  acc('stair').box(-64, -62, 300, 316, 0.5, 1.0, 2, 2, 2);
})();

/* --- Harris Theater, Pritzker back-of-house, Exelon pavilions (on the deck) --- */
building({
  x0: 150,
  x1: 171,
  z0: -146,
  z1: -104,
  h: 9,
  base: D,
  style: 'harris',
  sf: null,
  sign: { text: 'HARRIS THEATER', face: 'S', y: 7.6, h: 0.8, opt: { bg: '#111', fg: '#eee' } },
});
building({ x0: 85, x1: 150, z0: -146, z1: -97, h: 14, base: D, style: 'backstage', sf: null });
building({ x0: 6, x1: 14, z0: 144, z1: 152, h: 6, base: D, style: 'glassDark', sf: null });
building({ x0: 150, x1: 158, z0: 140, z1: 148, h: 6, base: D, style: 'glassDark', sf: null });

/* --- Loop backdrop: generic blocks west of Wabash and beyond the play area --- */
(function backdrop() {
  const r = mulberry(77);
  const colsX = [
    [-312, -215],
    [-434, -340],
    [-554, -460],
    [-674, -580],
    [-794, -700],
    [-990, -820],
  ];
  const rowsZ = [
    [-750, -415],
    [-389, -295],
    [-269, -177],
    [-147, -70],
    [-44, 49],
    [77, 168],
    [200, 295],
    [321, 415],
    [441, 535],
    [561, 750],
  ];
  const col189 = [-189, -104];
  const add = (x0, x1, z0, z1, core) => {
    const nx = x1 - x0 > 70 ? 2 : 1,
      nz = z1 - z0 > 60 ? (z1 - z0 > 200 ? 4 : 2) : 1;
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const a0 = lerp(x0, x1, i / nx),
          a1 = lerp(x0, x1, (i + 1) / nx),
          b0 = lerp(z0, z1, j / nz),
          b1 = lerp(z0, z1, (j + 1) / nz);
        const tall = r() < core;
        const h = tall ? 90 + r() * 170 : 28 + r() * 70;
        const ins = r() < 0.4 ? 2 + r() * 4 : 0;
        building({
          x0: a0 + ins * (i > 0 ? 1 : 0),
          x1: a1 - ins * (i < nx - 1 ? 1 : 0),
          z0: b0,
          z1: b1,
          h,
          style: pick(GENERIC, r),
          sf: pick(['stone', 'glass', 'brick', 'cream', 'modern'], r),
        });
      }
  };
  for (const [x0, x1] of colsX)
    for (const [z0, z1] of rowsZ) {
      const d = Math.abs((x0 + x1) / 2 + 300) / 700;
      add(x0, x1, z0, z1, clamp(0.65 - d * 0.4, 0.15, 0.7));
    }
  for (const [z0, z1] of [
    [-750, -415],
    [-389, -295],
    [321, 415],
    [441, 535],
    [561, 750],
  ])
    add(col189[0], col189[1], z0, z1, 0.5);
  // east of Michigan, north of South Water St (Illinois Center) and Lakeshore East
  add(-66, 62, -750, -416, 0.6);
  add(88, 170, -750, -416, 0.6);
  add(-66, 62, -389, -270, 0.4);
  add(88, 170, -389, -275, 0.5);
  add(220, 330, -700, -420, 0.7);
  add(340, 428, -700, -420, 0.6);
  add(300, 428, -400, -280, 0.5);
  // south along Michigan beyond the Art Institute
  add(-189, -104, 321, 750, 0.3);
})();
// Distant skyline anchors
(function skyline() {
  const tube = (x, z, w, h, st) =>
    building({ x0: x, x1: x + w, z0: z, z1: z + w, h, style: st, sf: null, noCol: true });
  // Willis Tower (≈1.1 km WSW): bundled tubes 22.9 m
  const wx = -1180,
    wz = 360,
    s = 22.9,
    H = [
      [200, 442, 264],
      [360, 442, 200],
      [264, 360, 200],
    ];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) tube(wx + i * s, wz + j * s, s, H[j][i], 'glassDark');
  for (const dx of [-8, 8]) {
    const m = new T.Mesh(new T.CylinderGeometry(0.8, 1.4, 85, 8), MAT.white);
    m.position.set(wx + 1.5 * s + dx, 442 + 42, wz + 0.5 * s);
    scene.add(m);
  }
  // Trump Tower (north across the river)
  building({ x0: -265, x1: -215, z0: -640, z1: -600, h: 120, style: 'glassBlue', sf: null, noCol: true });
  building({
    x0: -258,
    x1: -222,
    z0: -636,
    z1: -604,
    h: 110,
    base: 120,
    style: 'glassBlue',
    sf: null,
    noCol: true,
  });
  building({
    x0: -252,
    x1: -228,
    z0: -632,
    z1: -608,
    h: 130,
    base: 230,
    style: 'glassBlue',
    sf: null,
    noCol: true,
  });
  {
    const m = new T.Mesh(new T.CylinderGeometry(0.6, 1.6, 62, 8), MAT.steelSoft);
    m.position.set(-240, 391, -620);
    scene.add(m);
  }
  // St. Regis (Lakeshore East)
  building({ x0: 300, x1: 345, z0: -760, z1: -725, h: 130, style: 'glassGreen', sf: null, noCol: true });
  building({
    x0: 303,
    x1: 342,
    z0: -757,
    z1: -728,
    h: 120,
    base: 130,
    style: 'glassGreen',
    sf: null,
    noCol: true,
  });
  building({
    x0: 306,
    x1: 339,
    z0: -754,
    z1: -731,
    h: 113,
    base: 250,
    style: 'glassGreen',
    sf: null,
    noCol: true,
  });
})();

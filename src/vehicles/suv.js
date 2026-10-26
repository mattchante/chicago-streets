import * as T from 'three';
import { state, late } from '../core/state.js';
import { $, clamp, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { makeTex } from '../core/textures.js';
import { ENV } from '../core/materials.js';
import { blocked, outOfBounds, query, supRes, support } from '../core/collision.js';
import { CARS } from '../life/traffic.js';
import { P3, player } from '../player/avatar.js';
import { keys, stick, tRun } from '../player/input.js';

/* ============================================================ BLACK SUV · press TAB
   Full-size SUV, 5.3 × 2.04 m, 3.24 m wheelbase. Arcade handling: about 40 mph after 3 s,
   69 mph top speed, 98 mph with boost. Collides with buildings, trees, poles, rails and traffic. */
const SUVL = 5.3,
  SUVW = 2.04,
  WB = 3.24;
export const suv = {
  x: -61,
  z: -38,
  y: 0,
  h: Math.PI,
  v: 0,
  steer: 0,
  vy: 0,
  sup: null,
  on: false,
  acc: 0,
  shake: 0,
  ground: true,
  brake: false,
  pt: 0,
  rl: 0,
};
const SUVOBS = { x: 0, z: 0, dx: 0, dz: -1, len: SUVL, wid: SUVW, v: 0 };
const CARS_PLUS_SUV = CARS.concat([SUVOBS]);
state.footCam = 5.6;
state.lastLook = -1e9;
state.toastT = 0;
export const SUVG = (function buildSUV() {
  const root = new T.Group(),
    tilt = new T.Group(),
    body = new T.Group();
  root.add(tilt);
  tilt.add(body);
  scene.add(root);
  const paint = new T.MeshPhysicalMaterial({
    color: 0x030304,
    metalness: 0.25,
    roughness: 0.32,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    envMap: ENV,
    envMapIntensity: 0.42,
  });
  const glass = new T.MeshStandardMaterial({
    color: 0x0b0e11,
    metalness: 0.9,
    roughness: 0.05,
    envMap: ENV,
    envMapIntensity: 1.5,
    side: T.DoubleSide,
  });
  const trim = new T.MeshStandardMaterial({ color: 0x141516, roughness: 0.8 });
  const chrome = new T.MeshStandardMaterial({ color: 0xd5d9dd, metalness: 1, roughness: 0.16, envMap: ENV });
  const tail = new T.MeshStandardMaterial({
    color: 0x5a0a08,
    emissive: 0xff1a10,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const head = new T.MeshStandardMaterial({
    color: 0xe6edf5,
    emissive: 0xdfe9ff,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const add = (g, m, x, y, z, par = body) => {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    par.add(o);
    return o;
  };
  const box = (w, h, d, m, x, y, z, par) => add(new T.BoxGeometry(w, h, d), m, x, y, z, par);
  // body: side profile extruded across the width; X = forward
  const sh = new T.Shape();
  sh.moveTo(-2.6, 0.44);
  sh.lineTo(-2.12, 0.44);
  sh.absarc(-1.62, 0.44, 0.5, Math.PI, 0, true);
  sh.lineTo(1.12, 0.44);
  sh.absarc(1.62, 0.44, 0.5, Math.PI, 0, true);
  sh.lineTo(2.56, 0.44);
  sh.lineTo(2.64, 0.56);
  sh.lineTo(2.64, 0.94);
  sh.quadraticCurveTo(2.62, 1.1, 2.45, 1.13);
  sh.lineTo(1.12, 1.22);
  sh.lineTo(0.36, 1.82);
  sh.quadraticCurveTo(0.25, 1.9, 0.05, 1.9);
  sh.lineTo(-2.2, 1.92);
  sh.quadraticCurveTo(-2.5, 1.92, -2.57, 1.76);
  sh.lineTo(-2.63, 1.06);
  sh.lineTo(-2.63, 0.58);
  sh.lineTo(-2.6, 0.44);
  const eg = new T.ExtrudeGeometry(sh, {
    depth: 1.92,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.03,
    bevelSegments: 3,
    curveSegments: 14,
  });
  eg.rotateY(-Math.PI / 2);
  eg.translate(0.96, 0, 0);
  add(eg, paint, 0, 0, 0);
  for (const z of [1.62, -1.62]) box(1.7, 0.5, 1.02, trim, 0, 0.72, z);
  // glass
  const ws = new T.Shape();
  ws.moveTo(1.08, 1.27);
  ws.lineTo(0.37, 1.79);
  ws.lineTo(-2.18, 1.83);
  ws.quadraticCurveTo(-2.42, 1.82, -2.48, 1.68);
  ws.lineTo(-2.52, 1.27);
  ws.lineTo(1.08, 1.27);
  const wg = new T.ShapeGeometry(ws);
  wg.rotateY(-Math.PI / 2);
  add(wg, glass, 1.034, 0, 0);
  add(wg, glass, -1.034, 0, 0);
  for (const sx of [-1.04, 1.04]) {
    box(0.02, 0.56, 0.12, paint, sx, 1.55, -0.25);
    box(0.02, 0.56, 0.16, paint, sx, 1.55, -1.42);
  }
  const quad = (a, b, c, d) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
    g.computeVertexNormals();
    return g;
  };
  add(quad([-0.9, 1.26, 1.13], [0.9, 1.26, 1.13], [0.84, 1.83, 0.39], [-0.84, 1.83, 0.39]), glass, 0, 0, 0);
  add(
    quad([0.9, 1.22, -2.665], [-0.9, 1.22, -2.665], [-0.86, 1.72, -2.625], [0.86, 1.72, -2.625]),
    glass,
    0,
    0,
    0,
  );
  // front: grille, headlights, bumper
  box(1.12, 0.34, 0.04, chrome, 0, 0.76, 2.685);
  box(1.0, 0.26, 0.05, trim, 0, 0.76, 2.69);
  for (const y of [0.68, 0.76, 0.84]) box(1.0, 0.025, 0.06, chrome, 0, y, 2.7);
  for (const sx of [-0.67, 0.67]) {
    box(0.4, 0.11, 0.05, head, sx, 0.92, 2.665);
    box(0.42, 0.025, 0.05, head, sx, 0.85, 2.668);
  }
  box(2.0, 0.2, 0.22, trim, 0, 0.5, 2.6);
  box(2.0, 0.22, 0.22, trim, 0, 0.55, -2.6);
  for (const sx of [-0.92, 0.92]) box(0.1, 0.52, 0.05, tail, sx, 1.22, -2.66);
  box(1.4, 0.05, 0.04, tail, 0, 1.5, -2.645);
  // plates
  const plate = makeTex(256, 64, (g, w, h) => {
    g.fillStyle = '#f4f2ec';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#33302a';
    g.lineWidth = 4;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = '#1d2b4f';
    g.font = '700 40px "Archivo Narrow",Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('BEAN 01', w / 2, h / 2 + 2);
  });
  const pm = new T.MeshStandardMaterial({ map: plate, roughness: 0.5 });
  {
    const f = new T.Mesh(new T.PlaneGeometry(0.52, 0.13), pm);
    f.position.set(0, 0.5, 2.715);
    body.add(f);
    const rr = new T.Mesh(new T.PlaneGeometry(0.52, 0.13), pm);
    rr.rotation.y = Math.PI;
    rr.position.set(0, 0.86, -2.675);
    body.add(rr);
  }
  // mirrors, rails, handles, running boards
  for (const sx of [-1, 1]) {
    box(0.1, 0.15, 0.24, paint, sx * 1.14, 1.32, 0.98);
    box(0.12, 0.04, 0.08, trim, sx * 1.07, 1.3, 1.0);
    box(0.05, 0.05, 2.3, trim, sx * 0.72, 1.99, -1.0);
    for (const z of [0.05, -2.05]) box(0.06, 0.08, 0.08, trim, sx * 0.72, 1.95, z);
    for (const z of [0.1, -1.15]) box(0.02, 0.035, 0.18, chrome, sx * 1.035, 1.12, z);
    box(0.16, 0.05, 2.1, trim, sx * 1.0, 0.47, 0);
  }
  // wheels
  const tireG = new T.CylinderGeometry(0.42, 0.42, 0.3, 26);
  tireG.rotateZ(Math.PI / 2);
  const rimG = new T.CylinderGeometry(0.29, 0.29, 0.31, 22);
  rimG.rotateZ(Math.PI / 2);
  const tireM = new T.MeshStandardMaterial({ color: 0x101010, roughness: 0.92 }),
    rimM = new T.MeshStandardMaterial({ color: 0x34373c, metalness: 0.9, roughness: 0.28, envMap: ENV });
  const wheels = [];
  for (const [sx, sz] of [
    [1, 1.62],
    [-1, 1.62],
    [1, -1.62],
    [-1, -1.62],
  ]) {
    const st = new T.Group();
    st.position.set(sx * 0.9, 0.42, sz);
    tilt.add(st);
    const sp = new T.Group();
    st.add(sp);
    add(tireG, tireM, 0, 0, 0, sp);
    add(rimG, rimM, 0, 0, 0, sp);
    for (let k = 0; k < 3; k++) {
      const s2 = add(new T.BoxGeometry(0.04, 0.5, 0.07), chrome, sx * 0.155, 0, 0, sp);
      s2.rotation.x = (k * Math.PI) / 3;
    }
    add(new T.CylinderGeometry(0.07, 0.07, 0.33, 10).rotateZ(Math.PI / 2), chrome, 0, 0, 0, sp);
    wheels.push({ st, sp, front: sz > 0 });
  }
  return { root, tilt, body, wheels, tail };
})();
function carHit(px, pz, y, sup) {
  if (outOfBounds(px, pz)) return true;
  const L = query(px, pz);
  for (let i = 0; i < L.length; i++) {
    const r = L[i].test(px, pz, 0.05);
    if (r && r.top > y + 0.6 && r.bot < y + 1.8) return true;
  }
  if (sup && sup.rail && !sup.test(px, pz, 0)) {
    const g = support(px, pz, y);
    if (y - g > 0.8) return true;
  }
  return false;
}
const SAMP = [];
for (const lx of [-0.98, 0, 0.98])
  for (const lz of [-2.62, -1.3, 0, 1.3, 2.62]) if (!(lx === 0 && Math.abs(lz) < 2)) SAMP.push([lx, lz]);
function carFree(x, z, h, y, sup) {
  const fx = Math.sin(h),
    fz = Math.cos(h),
    lx = Math.cos(h),
    lz = -Math.sin(h);
  for (const [a, b] of SAMP) if (carHit(x + lx * a + fx * b, z + lz * a + fz * b, y, sup)) return false;
  return true;
}
const WG = [0, 0, 0, 0];
function wheelGround(x, z, h, y) {
  const fx = Math.sin(h),
    fz = Math.cos(h),
    lx = Math.cos(h),
    lz = -Math.sin(h);
  let i = 0;
  for (const [a, b] of [
    [0.9, 1.62],
    [-0.9, 1.62],
    [0.9, -1.62],
    [-0.9, -1.62],
  ])
    WG[i++] = support(x + lx * a + fx * b, z + lz * a + fz * b, y);
  return WG;
}
function sat(ax, az, afx, afz, al, aw, bx, bz, bfx, bfz, bl, bw) {
  const dx = bx - ax,
    dz = bz - az;
  let best = 1e9,
    bn = null;
  for (const [nx, nz] of [
    [afx, afz],
    [afz, -afx],
    [bfx, bfz],
    [bfz, -bfx],
  ]) {
    const ra = (al / 2) * Math.abs(afx * nx + afz * nz) + (aw / 2) * Math.abs(afz * nx - afx * nz),
      rb = (bl / 2) * Math.abs(bfx * nx + bfz * nz) + (bw / 2) * Math.abs(bfz * nx - bfx * nz);
    const d = dx * nx + dz * nz,
      o = ra + rb - Math.abs(d);
    if (o <= 0) return null;
    if (o < best) {
      best = o;
      bn = [nx, nz, d];
    }
  }
  const sg = bn[2] > 0 ? -1 : 1;
  return [bn[0] * best * sg, bn[1] * best * sg];
}
export function syncSUV(dt) {
  const c = suv,
    G = SUVG;
  G.root.position.set(c.x, c.y, c.z);
  G.root.rotation.y = c.h;
  const g = wheelGround(c.x, c.z, c.h, c.y + 0.3);
  const gF = (g[0] + g[1]) / 2,
    gR = (g[2] + g[3]) / 2,
    gL = (g[0] + g[2]) / 2,
    gRt = (g[1] + g[3]) / 2;
  const k = dt ? Math.min(1, dt * 10) : 1;
  if (c.ground) {
    c.pt = lerp(c.pt, Math.atan2(gF - gR, WB), k);
    c.rl = lerp(c.rl, Math.atan2(gL - gRt, 1.8), k);
  }
  G.tilt.rotation.x = -c.pt;
  G.tilt.rotation.z = c.rl;
  const kb = dt ? Math.min(1, dt * 6) : 1;
  G.body.rotation.x = lerp(G.body.rotation.x, clamp(-c.acc * 0.0045, -0.05, 0.06), kb);
  G.body.rotation.z = lerp(G.body.rotation.z, clamp((c.yr || 0) * Math.abs(c.v) * 0.006, -0.07, 0.07), kb);
  for (const w of G.wheels) {
    w.sp.rotation.x += (c.v * (dt || 0)) / 0.42;
    if (w.front) w.st.rotation.y = c.steer;
  }
  G.tail.emissiveIntensity = c.brake ? 2.8 : 0.7;
  const fx = Math.sin(c.h),
    fz = Math.cos(c.h);
  Object.assign(SUVOBS, { x: c.x, z: c.z, dx: fx, dz: fz, v: Math.abs(c.v) });
}
function settleSUV() {
  const g = wheelGround(suv.x, suv.z, suv.h, suv.y + 0.6);
  suv.y = (g[0] + g[1] + g[2] + g[3]) / 4;
  support(suv.x, suv.z, suv.y + 0.05);
  suv.sup = supRes.c;
  syncSUV(0);
}
settleSUV();
export function updateSUV(dt) {
  const c = suv;
  let thr = 0,
    st = 0;
  if (keys.KeyW || keys.ArrowUp) thr += 1;
  if (keys.KeyS || keys.ArrowDown) thr -= 1;
  if (keys.KeyA || keys.ArrowLeft) st += 1;
  if (keys.KeyD || keys.ArrowRight) st -= 1;
  if (stick.id !== null) {
    thr += -stick.y;
    st += -stick.x;
  }
  thr = clamp(thr, -1, 1);
  st = clamp(st, -1, 1);
  const boost = keys.ShiftLeft || keys.ShiftRight || tRun,
    hb = !!keys.Space,
    vmax = boost ? 44 : 31;
  let a;
  if (thr > 0) a = c.v < -0.5 ? 20 : thr * (boost ? 12 : 8.5) * Math.max(0, 1 - c.v / vmax);
  else if (thr < 0) a = c.v > 0.5 ? -20 : c.v > -11 ? thr * 6 : 0;
  else a = -Math.sign(c.v) * Math.min(Math.abs(c.v) / dt, 2.2 + Math.abs(c.v) * 0.04);
  if (hb) a += -Math.sign(c.v) * Math.min(Math.abs(c.v) / dt, 12);
  if (c.v > vmax && thr >= 0) a = Math.min(a, -5);
  if (!c.ground) a *= 0.05;
  c.acc = a;
  c.v += a * dt;
  if (Math.abs(c.v) < 0.02 && thr === 0) c.v = 0;
  c.brake = (thr < 0 && c.v > 0.5) || (thr > 0 && c.v < -0.5) || hb;
  const maxS = lerp(0.6, 0.1, clamp(Math.abs(c.v) / 40, 0, 1));
  c.steer += (st * maxS - c.steer) * Math.min(1, dt * 7);
  let yr = c.ground ? (c.v / WB) * Math.tan(c.steer) : 0;
  if (hb && Math.abs(c.v) > 6) yr *= 1.65;
  c.yr = yr;
  const n = Math.max(1, Math.ceil(Math.abs(c.v * dt) / 0.3));
  for (let i = 0; i < n; i++) {
    const nh = c.h + (yr * dt) / n;
    if (carFree(c.x, c.z, nh, c.y, c.sup)) c.h = nh;
    const dx = (Math.sin(c.h) * c.v * dt) / n,
      dz = (Math.cos(c.h) * c.v * dt) / n;
    if (carFree(c.x + dx, c.z + dz, c.h, c.y, c.sup)) {
      c.x += dx;
      c.z += dz;
    } else {
      const imp = Math.abs(c.v);
      if (Math.abs(dx) > 0.02 && carFree(c.x + dx, c.z, c.h, c.y, c.sup)) {
        c.x += dx;
        c.v *= 0.985;
      } else if (Math.abs(dz) > 0.02 && carFree(c.x, c.z + dz, c.h, c.y, c.sup)) {
        c.z += dz;
        c.v *= 0.985;
      } else {
        c.v = imp > 7 ? -c.v * 0.2 : 0;
        c.shake = Math.max(c.shake, Math.min(1, imp / 24));
        break;
      }
    }
  }
  // traffic
  const fx = Math.sin(c.h),
    fz = Math.cos(c.h);
  for (const o of CARS) {
    const ddx = o.x - c.x,
      ddz = o.z - c.z;
    if (ddx * ddx + ddz * ddz > 110) continue;
    const m = sat(c.x, c.z, fx, fz, SUVL, SUVW, o.x, o.z, o.dx, o.dz, o.len, o.wid);
    if (m) {
      if (carFree(c.x + m[0], c.z + m[1], c.h, c.y, c.sup)) {
        c.x += m[0];
        c.z += m[1];
      }
      const imp = Math.abs(c.v);
      c.v *= 0.4;
      o.v = 0;
      if (imp > 5) c.shake = Math.max(c.shake, Math.min(1, imp / 28));
    }
  }
  // ground following
  const g = wheelGround(c.x, c.z, c.h, c.y);
  const gt = (g[0] + g[1] + g[2] + g[3]) / 4;
  if (gt < c.y - 0.25 && c.ground && Math.abs(c.v) < 4) {
    c.y = gt;
  }
  if (gt < c.y - 0.25) {
    c.ground = false;
    c.vy -= 22 * dt;
    c.y += c.vy * dt;
    if (c.y <= gt) {
      c.y = gt;
      if (c.vy < -6) c.shake = Math.max(c.shake, 0.35);
      c.vy = 0;
      c.ground = true;
    }
  } else {
    c.y = gt > c.y ? lerp(c.y, gt, Math.min(1, dt * 20)) : gt;
    c.vy = 0;
    c.ground = true;
  }
  support(c.x, c.z, c.y + 0.05);
  c.sup = supRes.c;
  c.shake = Math.max(0, c.shake - dt * 2.2);
  syncSUV(dt);
  player.x = c.x;
  player.z = c.z;
  player.y = c.y;
  player.face = c.h;
  player.sup = c.sup;
  player.speed = 0;
  player.vy = 0;
  player.ground = true;
  if (c.y < -10) {
    exitSUV(true);
    late.teleport(late.LANDMARKS[1]);
  }
}
export function toast(html, sec = 3.5) {
  const t = $('toast');
  t.innerHTML = html;
  t.hidden = false;
  t.style.opacity = 1;
  state.toastT = sec;
}
function enterSUV() {
  suv.on = true;
  P3.visible = false;
  state.footCam = state.camDist;
  state.camDist = 8.5;
  state.camPitch = 0.2;
  suv.v = 0;
  $('speedo').hidden = false;
}
function exitSUV(force) {
  const lx = Math.cos(suv.h),
    lz = -Math.sin(suv.h),
    fx = Math.sin(suv.h),
    fz = Math.cos(suv.h);
  const tries = [
    [lx * 1.75, lz * 1.75],
    [-lx * 1.75, -lz * 1.75],
    [fx * 3.5, fz * 3.5],
    [-fx * 3.5, -fz * 3.5],
    [lx * 2.8, lz * 2.8],
    [-lx * 2.8, -lz * 2.8],
  ];
  let ok = null;
  for (const [ox, oz] of tries) {
    const x = suv.x + ox,
      z = suv.z + oz;
    const y = support(x, z, suv.y + 0.5);
    const sp = supRes.c;
    if (!blocked(x, z, y, null) && Math.abs(y - suv.y) < 1.3) {
      ok = { x, z, y, sp };
      break;
    }
  }
  if (!ok && !force) {
    toast('No room to open the door here. Move the SUV a little.');
    return false;
  }
  suv.on = false;
  suv.v = 0;
  suv.brake = false;
  suv.acc = 0;
  syncSUV(0);
  P3.visible = true;
  state.camDist = state.footCam;
  $('speedo').hidden = true;
  if (ok) {
    player.x = ok.x;
    player.z = ok.z;
    player.y = ok.y;
    player.sup = ok.sp;
  }
  player.vy = 0;
  player.ground = true;
  player.speed = 0;
  player.face = suv.h;
  return true;
}
function summonSUV() {
  const fx = -Math.sin(state.camYaw),
    fz = -Math.cos(state.camYaw),
    rx = Math.cos(state.camYaw),
    rz = -Math.sin(state.camYaw);
  const hs = [Math.atan2(fx, fz), Math.atan2(rx, rz), Math.atan2(-rx, -rz)];
  for (const d of [5, 7, 4, 9, 12])
    for (const sd of [0, 2.6, -2.6, 5, -5])
      for (const h of hs) {
        const x = player.x + fx * d + rx * sd,
          z = player.z + fz * d + rz * sd;
        const y = support(x, z, player.y + 0.4);
        const sp = supRes.c;
        if (Math.abs(y - player.y) > 1.2 || !carFree(x, z, h, y, sp)) continue;
        const g = wheelGround(x, z, h, y + 0.3);
        if (Math.max(g[0], g[1], g[2], g[3]) - Math.min(g[0], g[1], g[2], g[3]) > 0.6) continue;
        Object.assign(suv, { x, z, y, h, v: 0, vy: 0, sup: sp, steer: 0, ground: true, pt: 0, rl: 0 });
        syncSUV(0);
        return true;
      }
  return false;
}
export function toggleDrive() {
  if (!state.running || !$('map').hidden) return;
  if (suv.on) {
    exitSUV(false);
    return;
  }
  const d = Math.hypot(player.x - suv.x, player.z - suv.z);
  if (d > 9 || Math.abs(player.y - suv.y) > 2) {
    if (!summonSUV()) {
      toast('No room for the SUV here. Try a street or an open plaza.');
      return;
    }
    toast('Your SUV pulled up. <b>TAB</b> to get out.', 2.5);
  }
  enterSUV();
}

Object.assign(late, { CARS_PLUS_SUV, SUVL, suv, toggleDrive });

import * as T from 'three';
import { late } from '../core/state.js';
import { TAU, clamp, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';

/* ============================================================ PLAYER */
export const player = {
  x: -62,
  y: 0,
  z: -52,
  vy: 0,
  face: Math.PI / 2,
  ground: true,
  sup: null,
  speed: 0,
  ph: 0,
  air: 0,
};
export const P3 = new T.Group();
scene.add(P3);
const pj = {};
(function buildPlayer() {
  const m = (c) => new T.MeshStandardMaterial({ color: c, roughness: 0.8 });
  const skin = m(0xc8946c),
    jacket = m(0x27364c),
    jeans = m(0x34465f),
    shoe = m(0xeeeeea),
    hairM = m(0x2a1c14),
    pack = m(0x7a2f22);
  const add = (par, g, mat, x, y, z) => {
    const o = new T.Mesh(g, mat);
    o.position.set(x, y, z);
    o.castShadow = true;
    par.add(o);
    return o;
  };
  pj.hips = new T.Group();
  pj.hips.position.y = 0.95;
  P3.add(pj.hips);
  pj.spine = new T.Group();
  pj.hips.add(pj.spine);
  add(pj.spine, new T.CylinderGeometry(0.2, 0.17, 0.58, 12), jacket, 0, 0.31, 0).scale.set(1.08, 1, 0.72);
  add(pj.spine, new T.BoxGeometry(0.3, 0.38, 0.14), pack, 0, 0.36, -0.18);
  add(pj.spine, new T.CylinderGeometry(0.05, 0.06, 0.1, 8), skin, 0, 0.64, 0);
  pj.head = new T.Group();
  pj.head.position.y = 0.7;
  pj.spine.add(pj.head);
  add(pj.head, new T.SphereGeometry(0.115, 16, 12), skin, 0, 0.03, 0).scale.set(0.92, 1.08, 1);
  add(pj.head, new T.SphereGeometry(0.123, 16, 10, 0, TAU, 0, Math.PI * 0.55), hairM, 0, 0.05, -0.012);
  add(pj.hips, new T.CylinderGeometry(0.18, 0.17, 0.16, 12), jeans, 0, 0, 0).scale.set(1.05, 1, 0.75);
  pj.legs = [];
  pj.arms = [];
  for (const s of [-1, 1]) {
    const hip = new T.Group();
    hip.position.set(0.095 * s, 0, 0);
    pj.hips.add(hip);
    add(hip, new T.CylinderGeometry(0.082, 0.068, 0.46, 10), jeans, 0, -0.23, 0);
    const knee = new T.Group();
    knee.position.y = -0.46;
    hip.add(knee);
    add(knee, new T.CylinderGeometry(0.064, 0.052, 0.44, 10), jeans, 0, -0.22, 0);
    add(knee, new T.BoxGeometry(0.11, 0.08, 0.27), shoe, 0, -0.46, 0.05);
    pj.legs.push({ hip, knee });
    const sh = new T.Group();
    sh.position.set(0.25 * s, 0.56, 0);
    pj.spine.add(sh);
    add(sh, new T.CylinderGeometry(0.058, 0.05, 0.32, 10), jacket, 0, -0.16, 0);
    const el = new T.Group();
    el.position.y = -0.32;
    sh.add(el);
    add(el, new T.CylinderGeometry(0.048, 0.04, 0.28, 10), jacket, 0, -0.14, 0);
    add(el, new T.SphereGeometry(0.045, 10, 8), skin, 0, -0.31, 0);
    pj.arms.push({ sh, el });
  }
})();
export function animatePlayer(dt) {
  const sp = player.speed,
    run = clamp((sp - 2.4) / 3.5, 0, 1),
    walk = clamp(sp / 1.2, 0, 1);
  const stride = lerp(1.35, 2.4, run);
  if (player.ground) player.ph += ((dt * sp) / stride) * Math.PI;
  const ph = player.ph,
    amp = lerp(0.45, 0.85, run) * walk;
  pj.legs.forEach((L, i) => {
    const p = ph + (i ? Math.PI : 0);
    if (!player.ground) {
      L.hip.rotation.x = -0.6 + (i ? 0.3 : 0);
      L.knee.rotation.x = 1.0;
      return;
    }
    L.hip.rotation.x = -Math.sin(p) * amp;
    L.knee.rotation.x = Math.max(0, Math.sin(p - 1.3)) * lerp(0.6, 1.4, run) * walk + 0.05;
  });
  pj.arms.forEach((A, i) => {
    const p = ph + (i ? 0 : Math.PI);
    A.sh.rotation.x = -Math.sin(p) * amp * 0.8;
    A.sh.rotation.z = (i ? -1 : 1) * 0.06;
    A.el.rotation.x = -(0.15 + run * 1.1) * walk - 0.1;
    if (!player.ground) {
      A.sh.rotation.x = -0.4;
      A.sh.rotation.z = (i ? -1 : 1) * 0.5;
    }
  });
  pj.hips.position.y = 0.95 + (player.ground ? Math.abs(Math.sin(ph)) * 0.035 * walk - run * 0.04 : 0);
  pj.spine.rotation.x = lerp(0.02, 0.2, run) * walk;
}

Object.assign(late, { player });

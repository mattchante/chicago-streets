import * as T from 'three';
import { D, clamp, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { SCR, addCol } from '../core/collision.js';

/* ============================================================ CLOUD GATE
   Signed-distance model meshed with surface nets. 20 m long (E–W), 13 m deep, 10 m tall,
   3.7 m walk-under arch, omphalos apex 8.2 m. */
function ellSD(px, py, pz, rx, ry, rz) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz),
    k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return (k0 * (k0 - 1)) / (k1 || 1e-6);
}
function smoothSub(d1, d2, k) {
  const h = clamp(0.5 - (0.5 * (d2 + d1)) / k, 0, 1);
  return lerp(d2, -d1, h) + k * h * (1 - h);
}
function beanSDF(x, y, z) {
  let d = ellSD(x, y - 4.0, z, 10, 6, 6.5);
  d = smoothSub(ellSD(x, y, z, 5.0, 4.0, 14), d, 1.4);
  d = smoothSub(ellSD(x, y - 3.6, z, 3.0, 4.6, 3.0), d, 1.0);
  return Math.max(d, -y);
}
function surfaceNets(f, mn, mx, h) {
  const nx = Math.ceil((mx[0] - mn[0]) / h),
    ny = Math.ceil((mx[1] - mn[1]) / h),
    nz = Math.ceil((mx[2] - mn[2]) / h);
  const sx = nx + 1,
    sy = ny + 1,
    V = new Float32Array(sx * sy * (nz + 1));
  for (let k = 0; k <= nz; k++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) V[i + sx * (j + sy * k)] = f(mn[0] + i * h, mn[1] + j * h, mn[2] + k * h);
  const vid = new Int32Array(nx * ny * nz).fill(-1),
    pos = [];
  const E = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const cv = new Float32Array(8);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        let m = 0;
        for (let c = 0; c < 8; c++) {
          const v = V[i + (c & 1) + sx * (j + ((c >> 1) & 1) + sy * (k + ((c >> 2) & 1)))];
          cv[c] = v;
          if (v < 0) m |= 1 << c;
        }
        if (m === 0 || m === 255) continue;
        let ax = 0,
          ay = 0,
          az = 0,
          n = 0;
        for (const [a, b] of E) {
          const va = cv[a],
            vb = cv[b];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          ax += (a & 1) + ((b & 1) - (a & 1)) * t;
          ay += ((a >> 1) & 1) + (((b >> 1) & 1) - ((a >> 1) & 1)) * t;
          az += ((a >> 2) & 1) + (((b >> 2) & 1) - ((a >> 2) & 1)) * t;
          n++;
        }
        vid[i + nx * (j + ny * k)] = pos.length / 3;
        pos.push(mn[0] + (i + ax / n) * h, mn[1] + (j + ay / n) * h, mn[2] + (k + az / n) * h);
      }
  const idx = [],
    C = (i, j, k) => vid[i + nx * (j + ny * k)];
  for (let k = 1; k < nz; k++)
    for (let j = 1; j < ny; j++)
      for (let i = 1; i < nx; i++) {
        const v0 = V[i + sx * (j + sy * k)] < 0;
        if (v0 !== V[i + 1 + sx * (j + sy * k)] < 0) {
          const a = C(i, j - 1, k - 1),
            b = C(i, j, k - 1),
            c = C(i, j, k),
            d = C(i, j - 1, k);
          if (a >= 0 && b >= 0 && c >= 0 && d >= 0) idx.push(a, b, c, a, c, d);
        }
        if (v0 !== V[i + sx * (j + 1 + sy * k)] < 0) {
          const a = C(i - 1, j, k - 1),
            b = C(i, j, k - 1),
            c = C(i, j, k),
            d = C(i - 1, j, k);
          if (a >= 0 && b >= 0 && c >= 0 && d >= 0) idx.push(a, b, c, a, c, d);
        }
        if (v0 !== V[i + sx * (j + sy * (k + 1))] < 0) {
          const a = C(i - 1, j - 1, k),
            b = C(i, j - 1, k),
            c = C(i, j, k),
            d = C(i - 1, j, k);
          if (a >= 0 && b >= 0 && c >= 0 && d >= 0) idx.push(a, b, c, a, c, d);
        }
      }
  const nrm = new Float32Array(pos.length),
    e = 0.05;
  const grad = (x, y, z, o) => {
    o[0] = f(x + e, y, z) - f(x - e, y, z);
    o[1] = f(x, y + e, z) - f(x, y - e, z);
    o[2] = f(x, y, z + e) - f(x, y, z - e);
    const l = Math.hypot(o[0], o[1], o[2]) || 1;
    o[0] /= l;
    o[1] /= l;
    o[2] /= l;
    return o;
  };
  const tmp = [0, 0, 0];
  for (let v = 0; v < pos.length / 3; v++) {
    grad(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2], tmp);
    if (pos[v * 3 + 1] < h * 0.6 && tmp[1] < -0.5) {
      tmp[0] = 0;
      tmp[1] = -1;
      tmp[2] = 0;
    }
    nrm[v * 3] = tmp[0];
    nrm[v * 3 + 1] = tmp[1];
    nrm[v * 3 + 2] = tmp[2];
  }
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3,
      b = idx[t + 1] * 3,
      c = idx[t + 2] * 3;
    const ux = pos[b] - pos[a],
      uy = pos[b + 1] - pos[a + 1],
      uz = pos[b + 2] - pos[a + 2],
      vx = pos[c] - pos[a],
      vy = pos[c + 1] - pos[a + 1],
      vz = pos[c + 2] - pos[a + 2];
    const gx = uy * vz - uz * vy,
      gy = uz * vx - ux * vz,
      gz = ux * vy - uy * vx;
    if (
      gx * (nrm[a] + nrm[b] + nrm[c]) +
        gy * (nrm[a + 1] + nrm[b + 1] + nrm[c + 1]) +
        gz * (nrm[a + 2] + nrm[b + 2] + nrm[c + 2]) <
      0
    ) {
      const s = idx[t + 1];
      idx[t + 1] = idx[t + 2];
      idx[t + 2] = s;
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.BufferAttribute(nrm, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}
const beanRT = new T.WebGLCubeRenderTarget(256, {
  format: T.RGBFormat,
  generateMipmaps: true,
  minFilter: T.LinearMipmapLinearFilter,
});
beanRT.texture.encoding = T.sRGBEncoding;
export const beanCam = new T.CubeCamera(1, 4000, beanRT);
beanCam.position.set(0, D + 5, 0);
scene.add(beanCam);
export const BEAN = new T.Mesh(
  surfaceNets(beanSDF, [-10.8, -0.2, -7.3], [10.8, 10.3, 7.3], 0.2),
  new T.MeshStandardMaterial({
    color: 0xf2f4f7,
    metalness: 1,
    roughness: 0.04,
    envMap: beanRT.texture,
    envMapIntensity: 1,
  }),
);
BEAN.position.set(0, D, 0);
BEAN.castShadow = true;
BEAN.receiveShadow = false;
scene.add(BEAN);
addCol({
  ns: true,
  bx0: -11,
  bx1: 11,
  bz0: -7,
  bz1: 7,
  test(x, z, pad) {
    const e = (x / (10 + pad)) ** 2 + (z / (6.5 + pad)) ** 2;
    if (e >= 1 || Math.abs(x) < 4.6 - pad) return null;
    SCR.top = D + 10;
    SCR.bot = D - 1;
    return SCR;
  },
});

import * as T from 'three';
import { lerp, mulberry } from './util.js';
import { scene } from './renderer.js';

/* ============================================================ GEOMETRY ACCUMULATOR */
export class Acc {
  constructor() {
    this.p = [];
    this.n = [];
    this.u = [];
    this.c = [];
    this.i = [];
  }
  quad(a, b, c, d, uv, col) {
    // CCW from outside
    const base = this.p.length / 3;
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2],
      vx = d[0] - a[0],
      vy = d[1] - a[1],
      vz = d[2] - a[2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l;
    ny /= l;
    nz /= l;
    for (const q of [a, b, c, d]) {
      this.p.push(q[0], q[1], q[2]);
      this.n.push(nx, ny, nz);
    }
    this.u.push(...uv);
    if (col) for (let k = 0; k < 4; k++) this.c.push(col[0], col[1], col[2]);
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  wall(x0, z0, x1, z1, y0, y1, tw, th, u0 = 0, v0 = 0) {
    // left-bottom (x0,z0) → right-bottom (x1,z1) seen from outside
    const len = Math.hypot(x1 - x0, z1 - z0);
    this.quad(
      [x0, y0, z0],
      [x1, y0, z1],
      [x1, y1, z1],
      [x0, y1, z0],
      [
        u0 / tw,
        (y0 - v0) / th,
        (u0 + len) / tw,
        (y0 - v0) / th,
        (u0 + len) / tw,
        (y1 - v0) / th,
        u0 / tw,
        (y1 - v0) / th,
      ],
    );
    return len;
  }
  top(x0, x1, z0, z1, y, s = 6, ox = 0, oz = 0) {
    const T_ = 48;
    if (x1 - x0 > T_ * 1.5 || z1 - z0 > T_ * 1.5) {
      const nx = Math.ceil((x1 - x0) / T_),
        nz = Math.ceil((z1 - z0) / T_);
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++)
          this.top1(
            lerp(x0, x1, i / nx),
            lerp(x0, x1, (i + 1) / nx),
            lerp(z0, z1, j / nz),
            lerp(z0, z1, (j + 1) / nz),
            y,
            s,
            ox,
            oz,
          );
      return;
    }
    this.top1(x0, x1, z0, z1, y, s, ox, oz);
  }
  top1(x0, x1, z0, z1, y, s = 6, ox = 0, oz = 0) {
    this.quad(
      [x0, y, z0],
      [x0, y, z1],
      [x1, y, z1],
      [x1, y, z0],
      [
        (x0 + ox) / s,
        -(z0 + oz) / s,
        (x0 + ox) / s,
        -(z1 + oz) / s,
        (x1 + ox) / s,
        -(z1 + oz) / s,
        (x1 + ox) / s,
        -(z0 + oz) / s,
      ],
    );
  }
  bottom(x0, x1, z0, z1, y, s = 6) {
    this.quad(
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1],
      [x0 / s, z0 / s, x1 / s, z0 / s, x1 / s, z1 / s, x0 / s, z1 / s],
    );
  }
  box(x0, x1, z0, z1, y0, y1, tw = 4, th = 4, topS) {
    // walls + top
    let u = 0;
    u += this.wall(x0, z1, x1, z1, y0, y1, tw, th, u, y0);
    u += this.wall(x1, z1, x1, z0, y0, y1, tw, th, u, y0);
    u += this.wall(x1, z0, x0, z0, y0, y1, tw, th, u, y0);
    this.wall(x0, z0, x0, z1, y0, y1, tw, th, u, y0);
    if (topS !== false) this.top(x0, x1, z0, z1, y1, topS || tw);
  }
  geo() {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.n, 3));
    if (this.u.length) g.setAttribute('uv', new T.Float32BufferAttribute(this.u, 2));
    if (this.c.length) g.setAttribute('color', new T.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    g.computeBoundingSphere();
    return g;
  }
  mesh(mat, cast = true, recv = true) {
    if (!this.i.length) return null;
    const m = new T.Mesh(this.geo(), mat);
    m.castShadow = cast;
    m.receiveShadow = recv;
    scene.add(m);
    return m;
  }
}
export const ACC = {};
export const acc = (k) => ACC[k] || (ACC[k] = new Acc());

export function mergeColored(parts, jitter = 0, seed = 1) {
  // parts: [geometry, colour, matrix]
  const r = mulberry(seed);
  const geos = [];
  for (const [g0, c, m] of parts) {
    const g = g0.index ? g0.toNonIndexed() : g0.clone();
    if (m) g.applyMatrix4(m);
    const n = g.attributes.position.count,
      col = new Float32Array(n * 3),
      C = new T.Color(c);
    for (let i = 0; i < n; i++) {
      const k = 1 + (r() - 0.5) * jitter;
      col[i * 3] = C.r * k;
      col[i * 3 + 1] = C.g * k;
      col[i * 3 + 2] = C.b * k;
    }
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    geos.push(g);
  }
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const P = new Float32Array(n * 3),
    N = new Float32Array(n * 3),
    Cc = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos) {
    P.set(g.attributes.position.array, o * 3);
    N.set(g.attributes.normal.array, o * 3);
    Cc.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
  }
  const G = new T.BufferGeometry();
  G.setAttribute('position', new T.BufferAttribute(P, 3));
  G.setAttribute('normal', new T.BufferAttribute(N, 3));
  G.setAttribute('color', new T.BufferAttribute(Cc, 3));
  G.computeBoundingSphere();
  return G;
}
export const mx = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new T.Matrix4().compose(
    new T.Vector3(x, y, z),
    new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)),
    new T.Vector3(sx, sy, sz),
  );
export const vcMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });

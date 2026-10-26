import { MAT } from '../core/materials.js';
import { ACC } from '../core/geometry.js';

/* ============================================================ MERGE ACCUMULATED GEOMETRY */
const CAMBLOCK = [];
for (const k in ACC) {
  let mat = MAT[k] || MAT[k.replace('ov_', '')];
  if (!mat) {
    console.warn('no material', k);
    mat = MAT.concrete;
  }
  const isOv = k.startsWith('ov_') || k === 'paint';
  const m = ACC[k].mesh(mat, !isOv && k !== 'sidewalk' && k !== 'asphalt', true);
}

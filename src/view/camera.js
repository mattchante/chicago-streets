import * as T from 'three';
import { state } from '../core/state.js';
import { clamp, lerp } from '../core/util.js';
import { camera, scene, sunDir } from '../core/renderer.js';
import { solidAt } from '../core/collision.js';
import { player } from '../player/avatar.js';
import { suv } from '../vehicles/suv.js';

/* ============================================================ CAMERA */
const camPos = new T.Vector3(),
  camTgt = new T.Vector3(),
  tmpV = new T.Vector3();
state.camInit = false;
state.camD = state.camDist;
export function updateCamera(dt) {
  const drv = suv.on,
    tx = player.x,
    ty = player.y + (drv ? 1.7 : 1.55),
    tz = player.z;
  if (drv) {
    const since = (performance.now() - state.lastLook) / 1000;
    if (since > 1.1 && Math.abs(suv.v) > 1.5) {
      let d = suv.h + Math.PI - state.camYaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      state.camYaw += d * Math.min(1, dt * 2.4);
      state.camPitch += (0.2 - state.camPitch) * Math.min(1, dt * 1.5);
    }
  }
  const fov = drv ? 60 + clamp(Math.abs(suv.v) / 44, 0, 1) * 14 : 60;
  if (Math.abs(camera.fov - fov) > 0.05) {
    camera.fov = lerp(camera.fov, fov, Math.min(1, dt * 3));
    camera.updateProjectionMatrix();
  }
  if (!state.camInit) {
    camTgt.set(tx, ty, tz);
    state.camInit = true;
  }
  camTgt.x = lerp(camTgt.x, tx, 1 - Math.exp(-dt * 18));
  camTgt.z = lerp(camTgt.z, tz, 1 - Math.exp(-dt * 18));
  camTgt.y = lerp(camTgt.y, ty, 1 - Math.exp(-dt * 9));
  const cp = Math.cos(state.camPitch),
    dir = tmpV.set(Math.sin(state.camYaw) * cp, Math.sin(state.camPitch), Math.cos(state.camYaw) * cp);
  let want = state.camDist;
  for (let t = 0.4; t <= state.camDist; t += 0.25) {
    const x = camTgt.x + dir.x * t,
      y = camTgt.y + dir.y * t,
      z = camTgt.z + dir.z * t;
    if (solidAt(x, y, z)) {
      want = Math.max(0.6, t - 0.35);
      break;
    }
  }
  state.camD = want < state.camD ? want : lerp(state.camD, want, 1 - Math.exp(-dt * 4));
  camPos.set(camTgt.x + dir.x * state.camD, camTgt.y + dir.y * state.camD, camTgt.z + dir.z * state.camD);
  camera.position.copy(camPos);
  if (suv.on && suv.shake > 0) {
    const k = suv.shake * 0.25;
    camera.position.x += (Math.random() - 0.5) * k;
    camera.position.y += (Math.random() - 0.5) * k;
    camera.position.z += (Math.random() - 0.5) * k;
  }
  camera.lookAt(camTgt.x, camTgt.y + 0.1, camTgt.z);
}

/* ============================================================ LIGHTS */
const hemi = new T.HemisphereLight(0xcfe0f4, 0x5f5a50, 0.62);
scene.add(hemi);
const sun = new T.DirectionalLight(0xffefd6, 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const SC = sun.shadow.camera;
SC.left = -95;
SC.right = 95;
SC.top = 95;
SC.bottom = -95;
SC.near = 10;
SC.far = 1400;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.5;
scene.add(sun);
scene.add(sun.target);
export function updateSun() {
  const px = Math.round(player.x / 4) * 4,
    pz = Math.round(player.z / 4) * 4;
  sun.target.position.set(px, 0, pz);
  sun.position.set(px + sunDir.x * 600, sunDir.y * 600, pz + sunDir.z * 600);
}

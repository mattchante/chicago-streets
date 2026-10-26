import './styles.css';
// Load order matters: each module builds part of the world when it loads, and later modules
// build on earlier ones. world/finalize.js merges all accumulated geometry, so it must come
// after every world module. Add new modules here in the right place.
import './core/util.js';
import './core/renderer.js';
import './core/textures.js';
import './core/materials.js';
import './core/geometry.js';
import './core/collision.js';
import './world/streets.js';
import './world/park.js';
import './world/buildings.js';
import './world/cloud-gate.js';
import './world/crown-fountain.js';
import './world/wrigley-square.js';
import './world/ice-rink.js';
import './world/walgreens.js';
import './world/pritzker-pavilion.js';
import './world/lurie-garden.js';
import './world/bridges.js';
import './world/grant-park.js';
import './world/lakefront.js';
import './world/trees.js';
import './world/street-furniture.js';
import './world/finalize.js';
import './life/traffic.js';
import './life/people.js';
import './life/great-lawn.js';
import './player/avatar.js';
import './player/input.js';
import './player/physics.js';
import './vehicles/suv.js';
import './view/camera.js';
import './ui/hud.js';
import './ui/maps.js';
import * as T from 'three';
import { state } from './core/state.js';
import { $ } from './core/util.js';
import { LITE, camera, renderer, scene } from './core/renderer.js';
import { TX } from './core/textures.js';
import { ENV, MAT, sky } from './core/materials.js';
import { support } from './core/collision.js';
import { BEAN, beanCam } from './world/cloud-gate.js';
import { updateCrown } from './world/crown-fountain.js';
import { updateStore } from './world/walgreens.js';
import { updateLake } from './world/lakefront.js';
import { updateSignals } from './world/street-furniture.js';
import { CARS, updateCars } from './life/traffic.js';
import { updateCrowd } from './life/people.js';
import { BLANKETS, DOGS, updateDogs } from './life/great-lawn.js';
import { P3, animatePlayer, player } from './player/avatar.js';
import { cv, keys } from './player/input.js';
import { stepPlayer } from './player/physics.js';
import { SUVG, suv, toast, toggleDrive, updateSUV } from './vehicles/suv.js';
import { updateCamera, updateSun } from './view/camera.js';
import { updateHUD } from './ui/hud.js';
import { LANDMARKS, drawMini, teleport } from './ui/maps.js';

/* ============================================================ LOOP */
const clock = new T.Clock();
state.lastMph = -1;
state.frame = 0;
state.fpsT = 0;
state.fpsN = 0;
state.simT = 0;
state.running = false;
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  state.simT += dt;
  state.frame++;
  if (state.running && $('map').hidden) {
    if (suv.on) updateSUV(dt);
    else stepPlayer(dt);
  }
  if (suv.on) {
    const m = Math.round(Math.abs(suv.v) * 2.237);
    if (m !== state.lastMph) {
      state.lastMph = m;
      $('mph').textContent = m;
    }
  }
  if (state.toastT > 0) {
    state.toastT -= dt;
    if (state.toastT <= 0.4) $('toast').style.opacity = Math.max(0, state.toastT / 0.4);
    if (state.toastT <= 0) $('toast').hidden = true;
  }
  P3.position.set(player.x, player.y, player.z);
  P3.rotation.y = player.face;
  animatePlayer(dt);
  updateCars(dt, state.simT);
  updateCrowd(dt, state.simT);
  updateDogs(dt, state.simT);
  updateLake(dt, state.simT);
  updateStore(dt);
  updateCrown(dt, state.simT);
  updateSignals(state.simT);
  if (!window.__fc) updateCamera(dt);
  else {
    camera.position.set(...window.__fc[0]);
    camera.lookAt(...window.__fc[1]);
  }
  updateSun();
  sky.position.copy(camera.position);
  renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  // live reflections on Cloud Gate when nearby
  const dB = Math.hypot(player.x, player.z);
  if (dB < 160 && state.frame % (LITE ? 40 : 4) === 0) {
    BEAN.visible = false;
    beanCam.update(renderer, scene);
    BEAN.visible = true;
  }
  if (state.frame % 2 === 0) drawMini();
  updateHUD(dt);
  state.fpsN++;
  state.fpsT += dt;
  if (state.fpsT > 1) {
    $('fps').textContent = Math.round(state.fpsN / state.fpsT) + ' fps';
    state.fpsN = 0;
    state.fpsT = 0;
  }
  requestAnimationFrame(tick);
}
teleport(LANDMARKS[1]);
// first reflection capture + start
renderer.shadowMap.needsUpdate = true;
beanCam.update(renderer, scene);
requestAnimationFrame(tick);
$('play').disabled = false;
$('play').textContent = 'Start walking';
$('play').addEventListener('click', () => {
  $('intro').hidden = true;
  state.running = true;
  toast('Your black SUV is parked on the plaza. Press <b>TAB</b> to drive.', 7);
  if (!state.touchMode && cv.requestPointerLock) {
    try {
      const p = cv.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }
});
// Debug/test hook: available in `npm run dev`, or on any build with ?debug in the URL.
if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug'))
  window.__g = {
    SUVG,
    camera,
    suv,
    toggleDrive,
    simDrive: (sec) => {
      for (let t = 0; t < sec; t += 1 / 60) updateSUV(1 / 60);
    },
    P3,
    DOGS,
    BLANKETS,
    sim: (sec) => {
      for (let t = 0; t < sec; t += 1 / 60) stepPlayer(1 / 60);
    },
    MAT,
    TX,
    ENV,
    player,
    teleport,
    LANDMARKS,
    setCam: (y, p, d) => {
      state.camYaw = y;
      state.camPitch = p;
      state.camDist = d;
    },
    start: () => {
      $('intro').hidden = true;
      state.running = true;
    },
    keys,
    CARS,
    support,
    renderer,
    scene,
  };

import * as T from 'three';
import { TAU, mulberry } from './util.js';
import { renderer, scene, sunDir } from './renderer.js';
import { SF, STY, TX } from './textures.js';

/* ============================================================ MATERIALS */
const envScene = new T.Scene();
const skyMat = new T.ShaderMaterial({
  uniforms: { sunDir: { value: sunDir } },
  side: T.BackSide,
  depthWrite: false,
  fog: false,
  toneMapped: false,
  vertexShader:
    'varying vec3 vW;void main(){vW=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `varying vec3 vW;uniform vec3 sunDir;
  void main(){vec3 d=normalize(vW);float h=clamp(d.y,-.2,1.);
   vec3 zen=vec3(.30,.50,.80),hor=vec3(.78,.85,.91),gnd=vec3(.55,.57,.58);
   vec3 c=mix(hor,zen,pow(max(h,0.),.55));if(h<0.)c=mix(hor,gnd,clamp(-h*6.,0.,1.));
   float s=max(dot(d,sunDir),0.);c+=vec3(1.,.86,.62)*(pow(s,600.)*4.+pow(s,10.)*.22);
   gl_FragColor=vec4(c,1.);}`,
});
export const sky = new T.Mesh(new T.SphereGeometry(2200, 32, 16), skyMat);
scene.add(sky);
envScene.add(new T.Mesh(new T.SphereGeometry(100, 32, 16), skyMat));
{
  const gnd = new T.Mesh(new T.CircleGeometry(90, 24), new T.MeshBasicMaterial({ color: 0x7d7a74 }));
  gnd.rotation.x = -Math.PI / 2;
  gnd.position.y = -2;
  envScene.add(gnd);
  const bm = new T.MeshBasicMaterial({ color: 0x8a8f96 });
  const r = mulberry(9);
  for (let i = 0; i < 40; i++) {
    const a = r() * TAU,
      d = 60 + r() * 20,
      h = 8 + r() * 40;
    const b = new T.Mesh(new T.BoxGeometry(8 + r() * 10, h, 8), bm);
    b.position.set(Math.cos(a) * d, h / 2 - 2, Math.sin(a) * d);
    b.lookAt(0, h / 2 - 2, 0);
    envScene.add(b);
  }
}
const envRT = new T.WebGLCubeRenderTarget(128, {
  format: T.RGBFormat,
  generateMipmaps: true,
  minFilter: T.LinearMipmapLinearFilter,
});
envRT.texture.encoding = T.sRGBEncoding;
{
  const cc = new T.CubeCamera(0.1, 500, envRT);
  envScene.add(cc);
  cc.update(renderer, envScene);
}
export const ENV = envRT.texture;

export const MAT = {};
export function stdMat(o) {
  return new T.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o));
}
for (const k in STY) {
  const s = STY[k];
  MAT['f_' + k] = stdMat({
    map: s.map,
    roughness: s.rough ?? 0.85,
    metalness: s.metal ?? 0,
    envMap: s.metal ? ENV : null,
    envMapIntensity: 0.9,
  });
}
for (const k in SF)
  MAT['sf_' + k] = stdMat({ map: SF[k], roughness: 0.55, envMap: ENV, envMapIntensity: 0.35 });
MAT.roof = stdMat({ map: TX.roof });
MAT.asphalt = stdMat({ map: TX.asphalt, roughness: 0.95 });
MAT.sidewalk = stdMat({ map: TX.sidewalk });
MAT.granite = stdMat({
  map: TX.granite,
  roughness: 0.6,
  envMap: ENV,
  envMapIntensity: 0.25,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
MAT.deck = stdMat({ map: TX.deck });
MAT.promenade = stdMat({
  map: TX.promenade,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});
MAT.grass = stdMat({
  map: TX.grass,
  roughness: 1,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});
MAT.lawn = stdMat({
  map: TX.lawn,
  roughness: 1,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});
MAT.garden = stdMat({
  map: TX.garden,
  roughness: 1,
  polygonOffset: true,
  polygonOffsetFactor: -3,
  polygonOffsetUnits: -3,
});
MAT.wood = stdMat({
  map: TX.wood,
  roughness: 0.8,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  polygonOffsetUnits: -4,
});
MAT.stone = stdMat({ map: TX.stone });
MAT.path = stdMat({ map: TX.path, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
MAT.court = stdMat({ map: TX.court, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
MAT.paint = new T.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.8,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  polygonOffsetUnits: -4,
});
MAT.steel = stdMat({ color: 0xd9dde1, metalness: 1, roughness: 0.28, envMap: ENV, side: T.DoubleSide });
MAT.steelSoft = stdMat({ color: 0xc8ccd0, metalness: 0.9, roughness: 0.35, envMap: ENV });
MAT.darkMetal = stdMat({ color: 0x2a2d30, metalness: 0.6, roughness: 0.5, envMap: ENV });
MAT.white = stdMat({ color: 0xf0efea, roughness: 0.6 });
MAT.concrete = stdMat({ color: 0xb5b1a8, roughness: 0.9 });
MAT.water = stdMat({
  color: 0x1c2024,
  roughness: 0.06,
  metalness: 0.3,
  envMap: ENV,
  envMapIntensity: 1.2,
  polygonOffset: true,
  polygonOffsetFactor: -4,
  polygonOffsetUnits: -4,
});
MAT.lake = stdMat({ color: 0x2e5a73, roughness: 0.12, metalness: 0.2, envMap: ENV, envMapIntensity: 1 });
MAT.seat = stdMat({ color: 0x7a1a16, roughness: 0.6 });
MAT.hedge = stdMat({ color: 0x3d5428, roughness: 1 });
MAT.glassClear = stdMat({
  color: 0x9eb6c4,
  metalness: 0.2,
  roughness: 0.08,
  envMap: ENV,
  transparent: true,
  opacity: 0.45,
});
MAT.bronze = stdMat({ color: 0x3d4a3c, metalness: 0.7, roughness: 0.45, envMap: ENV });
MAT.black = stdMat({ color: 0x1b1c1e, roughness: 0.5, metalness: 0.3, envMap: ENV });

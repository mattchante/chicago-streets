import * as T from 'three';
import { $ } from './util.js';

/* ============================================================ RENDERER */
export const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
export const LITE=!!window.__lite;
renderer.setPixelRatio(LITE?.5:Math.min(window.devicePixelRatio||1,1.6));
renderer.setSize(innerWidth,innerHeight);
renderer.outputEncoding=T.sRGBEncoding;
renderer.toneMapping=T.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate=false;
$('app').appendChild(renderer.domElement);
export const scene=new T.Scene();
export const camera=new T.PerspectiveCamera(60,innerWidth/innerHeight,0.25,6000);
export const MAXANI=renderer.capabilities.getMaxAnisotropy();

/* sun: late-October afternoon over Chicago, sun in the south-west */
export const sunDir=new T.Vector3(-0.56,0.50,0.66).normalize();
const FOGC=new T.Color(0xb9c8d6);
scene.fog=new T.Fog(FOGC,260,2600);

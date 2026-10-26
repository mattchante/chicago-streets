import { state, late } from '../core/state.js';
import { $, clamp } from '../core/util.js';
import { renderer } from '../core/renderer.js';

/* ============================================================ INPUT */
export const keys={};state.camYaw=-Math.PI/2;state.camPitch=.16;state.camDist=5.6;state.locked=false;state.touchMode=false;
addEventListener('keydown',e=>{if(e.target.tagName==='BUTTON'&&(e.code==='Space'||e.code==='Enter'))return;keys[e.code]=true;
  if(e.code==='Tab'){e.preventDefault();if(!e.repeat)late.toggleDrive();return;}
  if(e.code==='KeyM')late.toggleMap();if(e.code==='KeyH'){$('keys').hidden=!$('keys').hidden;}if(e.code==='Escape'&&!$('map').hidden)late.toggleMap(false);
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
export const cv=renderer.domElement;
cv.addEventListener('click',()=>{if(!state.touchMode&&$('intro').hidden&&$('map').hidden&&cv.requestPointerLock){try{const p=cv.requestPointerLock();if(p&&p.catch)p.catch(()=>{});}catch(e){}}});
document.addEventListener('pointerlockchange',()=>{state.locked=document.pointerLockElement===cv;});
let drag=null;
cv.addEventListener('mousedown',e=>{if(!state.locked)drag={x:e.clientX,y:e.clientY};});
addEventListener('mouseup',()=>drag=null);
addEventListener('mousemove',e=>{if(state.locked||drag)state.lastLook=performance.now();if(state.locked){state.camYaw-=e.movementX*.0024;state.camPitch=clamp(state.camPitch+e.movementY*.002,-.35,1.25);}
  else if(drag){state.camYaw-=(e.clientX-drag.x)*.005;state.camPitch=clamp(state.camPitch+(e.clientY-drag.y)*.004,-.35,1.25);drag.x=e.clientX;drag.y=e.clientY;}});
cv.addEventListener('wheel',e=>{state.camDist=clamp(state.camDist*(1+Math.sign(e.deltaY)*.1),2.2,26);e.preventDefault();},{passive:false});
// touch
export const stick={id:null,x:0,y:0,ox:0,oy:0},look={id:null,x:0,y:0};export let tRun=false;
addEventListener('touchstart',()=>{if(!state.touchMode){state.touchMode=true;$('touch').hidden=false;$('keys').hidden=true;}},{passive:true});
$('stick').addEventListener('touchstart',e=>{const t=e.changedTouches[0];stick.id=t.identifier;const r=$('stick').getBoundingClientRect();stick.ox=r.left+r.width/2;stick.oy=r.top+r.height/2;stick.x=0;stick.y=0;e.preventDefault();},{passive:false});
cv.addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(look.id===null){look.id=t.identifier;look.x=t.clientX;look.y=t.clientY;}}e.preventDefault();},{passive:false});
addEventListener('touchmove',e=>{for(const t of e.changedTouches){
  if(t.identifier===stick.id){let dx=t.clientX-stick.ox,dy=t.clientY-stick.oy;const l=Math.hypot(dx,dy),m=50;if(l>m){dx*=m/l;dy*=m/l;}stick.x=dx/m;stick.y=dy/m;$('nub').style.transform=`translate(${dx}px,${dy}px)`;}
  if(t.identifier===look.id){state.lastLook=performance.now();state.camYaw-=(t.clientX-look.x)*.006;state.camPitch=clamp(state.camPitch+(t.clientY-look.y)*.005,-.35,1.25);look.x=t.clientX;look.y=t.clientY;}}},{passive:true});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===stick.id){stick.id=null;stick.x=stick.y=0;$('nub').style.transform='';}if(t.identifier===look.id)look.id=null;}});
$('tjump').addEventListener('touchstart',e=>{keys.Space=true;setTimeout(()=>keys.Space=false,120);e.preventDefault();},{passive:false});
$('trun').addEventListener('touchstart',e=>{tRun=!tRun;$('trun').style.background=tRun?'rgba(232,178,58,.7)':'';e.preventDefault();},{passive:false});
$('tmap').addEventListener('touchstart',e=>{late.toggleMap();e.preventDefault();},{passive:false});
$('tcar').addEventListener('touchstart',e=>{late.toggleDrive();e.preventDefault();},{passive:false});

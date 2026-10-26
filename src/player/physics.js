import { state, late } from '../core/state.js';
import { PH, PR, STEP, lerp } from '../core/util.js';
import { blocked, query, supRes, support } from '../core/collision.js';
import { onIce } from '../world/ice-rink.js';
import { CARS } from '../life/traffic.js';
import { player } from './avatar.js';
import { keys, stick, tRun } from './input.js';

/* ============================================================ PLAYER PHYSICS */
const GRAV=22,JUMP=5.4;
export function stepPlayer(dt){
  let ix=0,iz=0;
  if(keys.KeyW||keys.ArrowUp)iz+=1;if(keys.KeyS||keys.ArrowDown)iz-=1;if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;
  if(stick.id!==null){ix+=stick.x;iz-=stick.y;}
  let mag=Math.min(1,Math.hypot(ix,iz));
  const fx=-Math.sin(state.camYaw),fz=-Math.cos(state.camYaw),rx=Math.cos(state.camYaw),rz=-Math.sin(state.camYaw);
  let mx=fx*iz+rx*ix,mz=fz*iz+rz*ix;const ml=Math.hypot(mx,mz);if(ml>0){mx/=ml;mz/=ml;}
  const running=keys.ShiftLeft||keys.ShiftRight||tRun||(stick.id!==null&&mag>.92);
  const target=mag*(running?6.4:2.3);
  if(player.ground)player.speed=lerp(player.speed,target,1-Math.exp(-dt*(target>player.speed?7:10)));
  if(mag>0.05){const want=Math.atan2(mx,mz);let d=want-player.face;d=Math.atan2(Math.sin(d),Math.cos(d));player.face+=d*(1-Math.exp(-dt*12));player.mx=mx;player.mz=mz;}
  const dirx=player.mx||0,dirz=player.mz||0;
  let dx=dirx*player.speed*dt,dz=dirz*player.speed*dt;
  if(mag<=0.05&&player.ground){dx*=player.speed>.3?1:0;dz*=player.speed>.3?1:0;}
  if(onIce(player.x,player.z)&&player.y<.6){const k=1-Math.exp(-dt*1.2),tv=mag>.05?target:0;player.gx=lerp(player.gx||0,(player.mx||0)*tv,k);player.gz=lerp(player.gz||0,(player.mz||0)*tv,k);
    dx=player.gx*dt;dz=player.gz*dt;player.speed=Math.min(Math.hypot(player.gx,player.gz),target||9);}
  else{player.gx=dx/Math.max(dt,1e-4);player.gz=dz/Math.max(dt,1e-4);}
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));
  for(let i=0;i<n;i++){
    const sx=dx/n,sz=dz/n;
    if(!blocked(player.x+sx,player.z,player.y,player.sup))player.x+=sx;
    if(!blocked(player.x,player.z+sz,player.y,player.sup))player.z+=sz;
  }
  // cars push the player
  for(const c of (late.suv.on?CARS:late.CARS_PLUS_SUV)){const rx_=player.x-c.x,rz_=player.z-c.z;const f=rx_*c.dx+rz_*c.dz,lat=rx_*c.dz-rz_*c.dx;
    const hl=c.len/2+PR,hw=c.wid/2+PR;if(Math.abs(f)<hl&&Math.abs(lat)<hw&&player.y<2){
      const pf=hl-Math.abs(f),pl=hw-Math.abs(lat);
      if(pl<pf){const s=Math.sign(lat)||1;player.x+=c.dz*s*pl;player.z+=-c.dx*s*pl;}else{const s=Math.sign(f)||1;player.x+=c.dx*s*pf;player.z+=c.dz*s*pf;}}}
  const g=support(player.x,player.z,player.y);const sup=supRes.c;
  if((keys.Space)&&player.ground){player.vy=JUMP;player.ground=false;player.air=0;}
  if(player.ground){
    if(player.y-g<STEP+.15&&player.y>=g-.01){player.y=g;player.vy=0;player.sup=sup;}else{player.ground=false;}
  }
  if(!player.ground){player.vy-=GRAV*dt;player.y+=player.vy*dt;player.air+=dt;
    // head bump under bridges
    const L=query(player.x,player.z);for(const c of L){const r=c.test(player.x,player.z,0);if(r&&player.vy>0&&r.bot>player.y&&r.bot<player.y+PH+.05){player.vy=0;}}
    const g2=support(player.x,player.z,player.y);if(player.y<=g2){player.y=g2;player.vy=0;player.ground=true;player.sup=supRes.c;}}
  if(player.y<-10){late.teleport(late.LANDMARKS[0]);}
}

import * as T from 'three';
import { late } from '../core/state.js';
import { TAU, clamp, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';

/* ============================================================ PLAYER */
export const player={x:-62,y:0,z:-52,vy:0,face:Math.PI/2,ground:true,sup:null,speed:0,ph:0,air:0};
export const P3=new T.Group();scene.add(P3);
const pj={};
(function buildPlayer(){
  const m=c=>new T.MeshStandardMaterial({color:c,roughness:.8});
  const skin=m(0xc8946c),jacket=m(0x27364c),jeans=m(0x34465f),shoe=m(0xeeeeea),hairM=m(0x2a1c14),pack=m(0x7a2f22);
  const add=(par,g,mat,x,y,z)=>{const o=new T.Mesh(g,mat);o.position.set(x,y,z);o.castShadow=true;par.add(o);return o;};
  pj.hips=new T.Group();pj.hips.position.y=.95;P3.add(pj.hips);
  pj.spine=new T.Group();pj.hips.add(pj.spine);
  add(pj.spine,new T.CylinderGeometry(.2,.17,.58,12),jacket,0,.31,0).scale.set(1.08,1,.72);
  add(pj.spine,new T.BoxGeometry(.3,.38,.14),pack,0,.36,-.18);
  add(pj.spine,new T.CylinderGeometry(.05,.06,.1,8),skin,0,.64,0);
  pj.head=new T.Group();pj.head.position.y=.7;pj.spine.add(pj.head);
  add(pj.head,new T.SphereGeometry(.115,16,12),skin,0,.03,0).scale.set(.92,1.08,1);
  add(pj.head,new T.SphereGeometry(.123,16,10,0,TAU,0,Math.PI*.55),hairM,0,.05,-.012);
  add(pj.hips,new T.CylinderGeometry(.18,.17,.16,12),jeans,0,0,0).scale.set(1.05,1,.75);
  pj.legs=[];pj.arms=[];
  for(const s of [-1,1]){
    const hip=new T.Group();hip.position.set(.095*s,0,0);pj.hips.add(hip);
    add(hip,new T.CylinderGeometry(.082,.068,.46,10),jeans,0,-.23,0);
    const knee=new T.Group();knee.position.y=-.46;hip.add(knee);
    add(knee,new T.CylinderGeometry(.064,.052,.44,10),jeans,0,-.22,0);
    add(knee,new T.BoxGeometry(.11,.08,.27),shoe,0,-.46,.05);
    pj.legs.push({hip,knee});
    const sh=new T.Group();sh.position.set(.25*s,.56,0);pj.spine.add(sh);
    add(sh,new T.CylinderGeometry(.058,.05,.32,10),jacket,0,-.16,0);
    const el=new T.Group();el.position.y=-.32;sh.add(el);
    add(el,new T.CylinderGeometry(.048,.04,.28,10),jacket,0,-.14,0);
    add(el,new T.SphereGeometry(.045,10,8),skin,0,-.31,0);
    pj.arms.push({sh,el});
  }
})();
export function animatePlayer(dt){
  const sp=player.speed,run=clamp((sp-2.4)/3.5,0,1),walk=clamp(sp/1.2,0,1);
  const stride=lerp(1.35,2.4,run);if(player.ground)player.ph+=dt*sp/stride*Math.PI;
  const ph=player.ph,amp=lerp(.45,.85,run)*walk;
  pj.legs.forEach((L,i)=>{const p=ph+(i?Math.PI:0);
    if(!player.ground){L.hip.rotation.x=-.6+(i?.3:0);L.knee.rotation.x=1.0;return;}
    L.hip.rotation.x=-Math.sin(p)*amp;L.knee.rotation.x=Math.max(0,Math.sin(p-1.3))*lerp(.6,1.4,run)*walk+.05;});
  pj.arms.forEach((A,i)=>{const p=ph+(i?0:Math.PI);A.sh.rotation.x=-Math.sin(p)*amp*.8;A.sh.rotation.z=(i?-1:1)*.06;A.el.rotation.x=-(.15+run*1.1)*walk-.1;
    if(!player.ground){A.sh.rotation.x=-.4;A.sh.rotation.z=(i?-1:1)*.5;}});
  pj.hips.position.y=.95+(player.ground?Math.abs(Math.sin(ph))*.035*walk-run*.04:0);
  pj.spine.rotation.x=lerp(.02,.2,run)*walk;
}

Object.assign(late, { player });

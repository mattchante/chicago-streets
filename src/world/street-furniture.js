import * as T from 'three';
import { scene } from '../core/renderer.js';
import { MAT, stdMat } from '../core/materials.js';
import { Acc, acc } from '../core/geometry.js';
import { colCirc, onRoad, support } from '../core/collision.js';
import { INTERS, inInter, sig } from './streets.js';
import { addSign } from './buildings.js';

/* ============================================================ STREET FURNITURE: lamps, signals, street signs */
(function furniture(){
  const lamps=[];
  for(let z=-290;z<320;z+=27){if(inInter(-70,z,3))continue;lamps.push([-71.2,z]);lamps.push([-99.2,z]);}
  for(let x=-60;x<170;x+=30){lamps.push([x,-151]);lamps.push([x,172]);}
  for(let z=-140;z<170;z+=30)lamps.push([175.6,z]);
  for(let z=-120;z<150;z+=24)lamps.push([62,z]);
  const pole=new T.CylinderGeometry(.08,.12,1,8);pole.translate(0,.5,0);
  const pm=new T.InstancedMesh(pole,MAT.darkMetal,lamps.length),hm=new T.InstancedMesh(new T.SphereGeometry(.32,10,8),stdMat({color:0xf3eedf,emissive:0x2a2416,roughness:.3}),lamps.length*2);
  const M=new T.Matrix4();
  lamps.forEach(([x,z],i)=>{const y=support(x,z,10);M.makeScale(1,6.2,1);M.setPosition(x,y,z);pm.setMatrixAt(i,M);
    M.makeScale(1,1.25,1);M.setPosition(x-.5,y+6.3,z);hm.setMatrixAt(i*2,M);M.setPosition(x+.5,y+6.3,z);hm.setMatrixAt(i*2+1,M);
    acc('darkmetal').box(x-.65,x+.65,z-.04,z+.04,y+6.01,y+6.09,1,1);colCirc(x,z,.14,y+6);});
  pm.castShadow=true;scene.add(pm);scene.add(hm);
  // traffic signals with live lamps (merged per intersection/axis/colour)
  const spole=acc('darkmetal'),box=acc('blackbox');
  const SIGN_I=new Set(['Michigan','Columbus']);
  for(const I of INTERS){
    I.mats={NS:{},EW:{}};const L={};
    for(const ax of ['NS','EW'])for(const c of ['R','Y','G']){const col={R:0xff2a1a,Y:0xffb21a,G:0x29ff8a}[c];
      I.mats[ax][c]=new T.MeshStandardMaterial({color:0x202020,emissive:col,emissiveIntensity:0,roughness:.4});L[ax+c]=new Acc();}
    const corners=[[I.x0-1.2,I.z0-1.2],[I.x1+1.2,I.z1+1.2],[I.x1+1.2,I.z0-1.2],[I.x0-1.2,I.z1+1.2]];
    let placed=0;
    corners.forEach(([x,z])=>{if(onRoad(x,z)||placed>=2)return;placed++;
      spole.box(x-.1,x+.1,z-.1,z+.1,0,4.6,1,1);colCirc(x,z,.16,4.6);
      for(const ax of ['NS','EW']){const hy=ax==='NS'?3.6:2.4;box.box(x-.19,x+.19,z-.19,z+.19,hy-.52,hy+.52,1,1);
        ['R','Y','G'].forEach((c,k)=>{const y=hy+.33-k*.33;const A=L[ax+c];
          if(ax==='NS'){A.box(x-.1,x+.1,z+.19,z+.24,y-.1,y+.1,1,1,false);A.box(x-.1,x+.1,z-.24,z-.19,y-.1,y+.1,1,1,false);}
          else{A.box(x+.19,x+.24,z-.1,z+.1,y-.1,y+.1,1,1,false);A.box(x-.24,x-.19,z-.1,z+.1,y-.1,y+.1,1,1,false);}});}
      if(SIGN_I.has(I.ns)&&placed<=1){
        const nsN={Michigan:(I.cz<63?'N':'S')+' Michigan Av',Columbus:(I.cz<63?'N':'S')+' Columbus Dr'}[I.ns];
        const ewN={Randolph:'E Randolph St',Washington:'E Washington St',Madison:'E Madison St',Monroe:'E Monroe St',Lake:'E Lake St',Adams:'E Adams St'}[I.ew];
        const o={bg:'#1f6b3a',fg:'#f4f4f0',border:'#f4f4f0',weight:700};
        addSign(ewN,x,4.8,z+.03,'S',.36,o);addSign(ewN,x,4.8,z-.03,'N',.36,o);
        addSign(nsN,x+.03,4.4,z,'E',.36,o);addSign(nsN,x-.03,4.4,z,'W',.36,o);}
    });
    for(const ax of ['NS','EW'])for(const c of ['R','Y','G'])L[ax+c].mesh(I.mats[ax][c],false,false);
  }
})();
MAT.darkmetal=MAT.darkMetal;MAT.blackbox=MAT.black;

/* ============================================================ SIGNAL LAMPS */
export function updateSignals(t){for(const I of INTERS)for(const ax of ['NS','EW']){const s=sig(I,ax,t);for(const c of ['R','Y','G'])I.mats[ax][c].emissiveIntensity=s===c?2.4:0;}}

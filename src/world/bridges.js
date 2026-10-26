import * as T from 'three';
import { D, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { TX } from '../core/textures.js';
import { MAT, stdMat } from '../core/materials.js';
import { Acc } from '../core/geometry.js';
import { colCirc, colPath } from '../core/collision.js';

/* ============================================================ BRIDGES (BP Pedestrian Bridge, Nichols Bridgeway) */
function bridge(ctrl,w,opt){
  const curve=new T.CatmullRomCurve3(ctrl.map(p=>new T.Vector3(p[0],0,p[1])),false,'catmullrom',.5);
  const L=curve.getLength(),n=Math.ceil(L/2.5),pts=[];
  // height by arclength from control heights
  const cl=[0];for(let i=1;i<ctrl.length;i++)cl.push(cl[i-1]+Math.hypot(ctrl[i][0]-ctrl[i-1][0],ctrl[i][1]-ctrl[i-1][1]));
  const hAt=u=>{const s=u*cl[cl.length-1];for(let i=1;i<cl.length;i++)if(s<=cl[i]){const t=(s-cl[i-1])/(cl[i]-cl[i-1]);const k=t*t*(3-2*t);return lerp(ctrl[i-1][2],ctrl[i][2],lerp(t,k,.5));}return ctrl[ctrl.length-1][2];};
  for(let i=0;i<=n;i++){const u=i/n,p=curve.getPointAt(u);pts.push({x:p.x,z:p.z,h:hAt(u)});}
  const deck=new Acc(),side=new Acc(),under=new Acc();const hw=w/2,pH=opt.parapet||1.1,th=opt.thick||.8;
  let acl=0;
  for(let i=0;i<n;i++){const a=pts[i],b=pts[i+1];const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
    const ta=i>0?[pts[i+1].x-pts[i-1].x,pts[i+1].z-pts[i-1].z]:[dx,dz],tb=i<n-1?[pts[i+2].x-a.x,pts[i+2].z-a.z]:[dx,dz];
    const na=[-ta[1]/Math.hypot(...ta),ta[0]/Math.hypot(...ta)],nb=[-tb[1]/Math.hypot(...tb),tb[0]/Math.hypot(...tb)];
    const aL=[a.x-na[0]*hw,a.z-na[1]*hw],aR=[a.x+na[0]*hw,a.z+na[1]*hw],bL=[b.x-nb[0]*hw,b.z-nb[1]*hw],bR=[b.x+nb[0]*hw,b.z+nb[1]*hw];
    const uv=[0,acl/3,w/3,acl/3,w/3,(acl+l)/3,0,(acl+l)/3];
    deck.quad([aL[0],a.h+.02,aL[1]],[aR[0],a.h+.02,aR[1]],[bR[0],b.h+.02,bR[1]],[bL[0],b.h+.02,bL[1]],uv);
    under.quad([aR[0],a.h-th,aR[1]],[aL[0],a.h-th,aL[1]],[bL[0],b.h-th,bL[1]],[bR[0],b.h-th,bR[1]],uv);
    // parapets: flared outward, both faces
    const fl=opt.flare||.35;
    for(const [P0,P1,nn,sg] of [[aL,bL,[na,nb],-1],[aR,bR,[na,nb],1]]){
      const o0=[P0[0]+sg*nn[0][0]*fl,P0[1]+sg*nn[0][1]*fl],o1=[P1[0]+sg*nn[1][0]*fl,P1[1]+sg*nn[1][1]*fl];
      const q=[[P0[0],a.h-th,P0[1]],[P1[0],b.h-th,P1[1]],[o1[0],b.h+pH,o1[1]],[o0[0],a.h+pH,o0[1]]];
      if(sg>0)side.quad(q[0],q[1],q[2],q[3],[0,0,1,0,1,1,0,1]);else side.quad(q[1],q[0],q[3],q[2],[0,0,1,0,1,1,0,1]);
      if(sg>0)side.quad(q[1],q[0],q[3],q[2],[0,0,1,0,1,1,0,1]);else side.quad(q[0],q[1],q[2],q[3],[0,0,1,0,1,1,0,1]);
    }
    acl+=l;
  }
  const dm=deck.mesh(MAT.wood_bridge||MAT.wood,false,true),sm=side.mesh(opt.sideMat,true,true),um=under.mesh(opt.sideMat,true,false);
  colPath(pts,w-.3,th+.2,{});
  return pts;
}
MAT.wood_bridge=stdMat({map:TX.wood,roughness:.75});
export const BP=bridge([[154,-82,D],[163,-64,D+.8],[170,-48,D+2],[176,-36,D+3.3],[190,-28,7.6],[205,-23,7.6],[218,-12,7.0],[231,-3,5.8],[245,-11,4.4],[259,-3,3.0],[271,10,1.6],[284,17,.3],[292,19,0]],4.4,{sideMat:MAT.steelSoft,parapet:1.15,flare:.45});
export const NB=bridge([[150,112,D],[149,132,D+.7],[146,152,D+2.2],[141,172,D+4.3],[135,190,10.6],[131,204,12],[129,222,12]],4.0,{sideMat:MAT.white,parapet:1.05,flare:.1,thick:.6});
// bridge support piers
(function piers(){for(const [x,z,h] of [[180,-34,7],[210,-20,7.4],[240,-6,5]]){const m=new T.Mesh(new T.CylinderGeometry(.7,.9,h,10),MAT.concrete);m.position.set(x,h/2-.15,z);m.castShadow=true;scene.add(m);colCirc(x,z,.9,h-.8);}
  for(const [x,z,h] of [[140,184,9.5],[137,194,10.5]]){}})();

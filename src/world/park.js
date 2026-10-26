import * as T from 'three';
import { D, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { ENV, MAT, stdMat } from '../core/materials.js';
import { acc } from '../core/geometry.js';
import { colRect } from '../core/collision.js';

/* ============================================================ MILLENNIUM PARK DECK
   The park sits one storey above Michigan Ave on top of the garage and Metra tracks.
   Ground level: Wrigley Square, McCormick Tribune Plaza (rink), Crown Fountain. */
const DECK={x0:-15,x1:171,z0:-146,z1:167};
export const STAIRS=[
  {x0:-48,x1:-15,z0:-58,z1:-46,ax:'x',h0:0,h1:D,name:'n-rink'},
  {x0:-48,x1:-15,z0:46,z1:58,ax:'x',h0:0,h1:D,name:'s-rink'},
  {x0:-27,x1:-15,z0:-104,z1:-92,ax:'x',h0:0,h1:D},
  {x0:-27,x1:-15,z0:100,z1:112,ax:'x',h0:0,h1:D},
  {x0:30,x1:44,z0:-146,z1:-132,ax:'z',h0:0,h1:D},
  {x0:-10,x1:4,z0:153,z1:167,ax:'z',h0:D,h1:0},
  {x0:159,x1:171,z0:110,z1:122,ax:'x',h0:D,h1:0},
];
const stairAt=(x,z)=>STAIRS.find(s=>x>s.x0&&x<s.x1&&z>s.z0&&z<s.z1);
(function deck(){
  const xs=new Set([DECK.x0,DECK.x1]),zs=new Set([DECK.z0,DECK.z1]);
  for(const s of STAIRS){for(const v of [s.x0,s.x1])if(v>=DECK.x0&&v<=DECK.x1)xs.add(v);for(const v of [s.z0,s.z1])if(v>=DECK.z0&&v<=DECK.z1)zs.add(v);}
  const X=[...xs].sort((a,b)=>a-b),Z=[...zs].sort((a,b)=>a-b);
  const isDeck=(x,z)=>x>DECK.x0&&x<DECK.x1&&z>DECK.z0&&z<DECK.z1&&!stairAt(x,z);
  const top=acc('deck'),wall=acc('stone'),rail=acc('rail');
  const addRail=(x0,z0,x1,z1)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(len/2));
    for(let k=0;k<=n;k++){const x=lerp(x0,x1,k/n),z=lerp(z0,z1,k/n);rail.box(x-.04,x+.04,z-.04,z+.04,D,D+1.05,1,1);}
    const nx=(z1-z0)/len*.04,nz=-(x1-x0)/len*.04;
    rail.box(Math.min(x0,x1)-Math.abs(nx)-.02,Math.max(x0,x1)+Math.abs(nx)+.02,Math.min(z0,z1)-Math.abs(nz)-.02,Math.max(z0,z1)+Math.abs(nz)+.02,D+1.0,D+1.08,1,1);
    colRect(Math.min(x0,x1)-.12,Math.max(x0,x1)+.12,Math.min(z0,z1)-.12,Math.max(z0,z1)+.12,D+1.08,D-.3,{cam:false,ns:true});
  };
  const side=(x0,z0,x1,z1,ox,oz)=>{ // wall segment of a deck cell; ox,oz = outward normal
    const mx=(x0+x1)/2+ox*.5,mz=(z0+z1)/2+oz*.5;
    if(isDeck(mx,mz))return;
    const s=stairAt(mx,mz);
    if(s){const hiX=s.ax==='x'?(s.h1>s.h0?s.x1:s.x0):null,hiZ=s.ax==='z'?(s.h1>s.h0?s.z1:s.z0):null;
      if((hiX!==null&&Math.abs(hiX-(x0+x1)/2)<.01&&ox!==0)||(hiZ!==null&&Math.abs(hiZ-(z0+z1)/2)<.01&&oz!==0))return;}
    wall.wall(x0,z0,x1,z1,0,D,4,4);
    // coping
    wall.quad([x0,D+.02,z0],[x1,D+.02,z1],[x1+(oz?0:0)-ox*.35,D+.02,z1-oz*.35],[x0-ox*.35,D+.02,z0-oz*.35],[0,0,1,0,1,.1,0,.1]);
    addRail(x0-ox*.15,z0-oz*.15,x1-ox*.15,z1-oz*.15);
  };
  for(let i=0;i<X.length-1;i++)for(let j=0;j<Z.length-1;j++){
    const x0=X[i],x1=X[i+1],z0=Z[j],z1=Z[j+1];
    if(!isDeck((x0+x1)/2,(z0+z1)/2))continue;
    top.top(x0,x1,z0,z1,D,6);colRect(x0,x1,z0,z1,D);
    side(x0,z1,x1,z1,0,1);side(x1,z1,x1,z0,1,0);side(x1,z0,x0,z0,0,-1);side(x0,z0,x0,z1,-1,0);
  }
  // stairs: visual steps + ramp collision
  for(const s of STAIRS){
    const rise=Math.abs(s.h1-s.h0),n=Math.max(2,Math.round(rise/.16));
    for(let k=0;k<n;k++){
      const t0=k/n,t1=(k+1)/n,h=Math.min(s.h0,s.h1)+rise*(k+1)/n;
      let x0=s.x0,x1=s.x1,z0=s.z0,z1=s.z1;
      const up=s.h1>s.h0;
      if(s.ax==='x'){const a=up?lerp(s.x0,s.x1,t0):lerp(s.x1,s.x0,t1),b=up?s.x1:lerp(s.x1,s.x0,t0);x0=up?a:s.x0;x1=up?s.x1:b;if(!up){x0=s.x0;x1=lerp(s.x1,s.x0,t0);x0=s.x0;}
        if(up){x0=lerp(s.x0,s.x1,t0);x1=s.x1;}else{x0=s.x0;x1=lerp(s.x1,s.x0,t0);} }
      else{if(up){z0=lerp(s.z0,s.z1,t0);z1=s.z1;}else{z0=s.z0;z1=lerp(s.z1,s.z0,t0);}}
      const yb=h-rise/n;
      acc('stair').box(x0,x1,z0,z1,yb,h,2,2,2);
    }
    const hf=s.ax==='x'?(x,z)=>lerp(s.h0,s.h1,(x-s.x0)/(s.x1-s.x0)):(x,z)=>lerp(s.h0,s.h1,(z-s.z0)/(s.z1-s.z0));
    colRect(s.x0,s.x1,s.z0,s.z1,0,-1e9,{hf});
    // handrails along the two long sides
    const r=acc('rail');
    if(s.ax==='x'){for(const zz of [s.z0+.3,s.z1-.3]){r.quad([s.x0,s.h0+.9,zz-.03],[s.x1,s.h1+.9,zz-.03],[s.x1,s.h1+1.0,zz-.03],[s.x0,s.h0+1.0,zz-.03],[0,0,1,0,1,1,0,1]);r.quad([s.x1,s.h1+.9,zz+.03],[s.x0,s.h0+.9,zz+.03],[s.x0,s.h0+1.0,zz+.03],[s.x1,s.h1+1.0,zz+.03],[0,0,1,0,1,1,0,1]);}}
    else{for(const xx of [s.x0+.3,s.x1-.3]){r.quad([xx+.03,s.h0+.9,s.z0],[xx+.03,s.h1+.9,s.z1],[xx+.03,s.h1+1.0,s.z1],[xx+.03,s.h0+1.0,s.z0],[0,0,1,0,1,1,0,1]);r.quad([xx-.03,s.h1+.9,s.z1],[xx-.03,s.h0+.9,s.z0],[xx-.03,s.h0+1.0,s.z0],[xx-.03,s.h1+1.0,s.z1],[0,0,1,0,1,1,0,1]);}}
  }
})();
MAT.rail=stdMat({color:0x3b3f43,metalness:.7,roughness:.4,envMap:ENV,side:T.DoubleSide});

/* ---- surface overlays ---- */
export function overlay(mat,x0,x1,z0,z1,y,s=6){const a=acc('ov_'+mat);a.top(x0,x1,z0,z1,y,s);}
function ellipseMesh(mat,cx,cz,rx,rz,y,s=6){
  const g=new T.CircleGeometry(1,72);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++){const x=cx+p.getX(i)*rx,z=cz+p.getZ(i)*rz;p.setXYZ(i,x,y,z);uv.setXY(i,x/s,-z/s);}
  const m=new T.Mesh(g,MAT[mat]);m.receiveShadow=true;scene.add(m);return m;
}
// Grainger Plaza (Cloud Gate) granite, Chase Promenade, Boeing galleries
overlay('granite',-15,30,-46,46,D+.01,6);
overlay('promenade',30,62,-132,153,D+.01,6);
overlay('path',-12,28,-140,-50,D+.01,6);overlay('path',-12,28,50,150,D+.01,6);
// Great Lawn
ellipseMesh('lawn',118,32,46,58,D+.02,6);
// ground-level: McCormick Tribune Plaza, Wrigley Square, Crown Fountain plaza
overlay('granite',-66,-15,-62,62,.01,6);
overlay('granite',-66,-15,62,167,.01,6);
overlay('granite',-66,-15,-146,-62,.01,6);
ellipseMesh('grass',-44,-92,20,22,.03,6);

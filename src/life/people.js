import * as T from 'three';
import { late } from '../core/state.js';
import { D, TAU, clamp, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { MAT } from '../core/materials.js';
import { PIER, support } from '../core/collision.js';
import { RINK, rinkGate, rinkPts } from '../world/ice-rink.js';
import { BP, NB } from '../world/bridges.js';
import { LAKE } from '../world/lakefront.js';

/* ============================================================ PEOPLE (instanced crowd) */
const NPCS=[];const crowd={};export const LAWN={walkers:[],throwers:[]};
(function people(){
  const r=mulberry(321);
  const routes=[];
  const line=(pts,n,ping=true,vm=1,opt={})=>routes.push(Object.assign({pts,n,ping,vm},opt));
  line([[-69,-146],[-69,166]],14);line([[-101,-146],[-101,-72]],5);line([[-101,-42],[-101,47]],6);line([[-101,79],[-101,166]],6);
  line([[-64,-149],[170,-149]],8);line([[-64,170],[170,170]],8);line([[174,-145],[174,166]],5);
  line([[-60,-56],[-30,-56],[-14,-52],[10,-40]],4);line([[-60,52],[-30,52],[-14,52],[10,40]],4);
  {const p=[];for(let i=0;i<=32;i++){const a=i/32*TAU;p.push([Math.cos(a)*15,Math.sin(a)*11]);}routes.push({pts:p,n:16,ping:false});}
  {const p=[];for(let i=0;i<=32;i++){const a=i/32*TAU;p.push([Math.cos(a)*22,Math.sin(a)*17]);}routes.push({pts:p,n:10,ping:false});}
  line([[46,-128],[46,150]],12);line([[40,-120],[40,140]],6);line([[8,-130],[8,-50]],4);line([[8,52],[8,146]],4);
  {const p=[];for(let i=0;i<=40;i++){const a=i/40*TAU;p.push([118+Math.cos(a)*49,32+Math.sin(a)*61]);}routes.push({pts:p,n:10,ping:false});}
  line([[106,101],[120,164]],5);line([[74,101],[74,164]],3);
  line(BP.map(p=>[p.x,p.z]),8);line(NB.map(p=>[p.x,p.z]),4);
  line(rinkPts(4,90),12,false,2.3,{skate:true,dir:1,spread:5});line(rinkPts(8.5,60),4,false,1.7,{skate:true,dir:1,spread:2});
  line([[-120.9,-41.8],[-120.9,-27.6]],1,true,.65,{spread:.8});line([[-117.9,-41.8],[-117.9,-27.6]],2,true,.65,{spread:.8});line([[-114.9,-41.8],[-114.9,-27.6]],1,true,.65,{spread:.8});
  line([[-124.6,-42.4],[-109.6,-42.4]],2,true,.7,{spread:.8});line([[-124.6,-27.2],[-110,-27.2]],1,true,.7,{spread:.6});
  line([[-46,82],[-27,82],[-27,157],[-46,157],[-46,82]],8);line([[-38,96],[-35,142]],5);
  line([[-62,-100],[-30,-96],[-25,-80],[-55,-75],[-62,-100]],6);
  line([[230,-84],[244,-58],[268,-66],[300,-50],[342,-60],[332,-86],[348,-110],[332,-140],[300,-130],[262,-136],[240,-110],[230,-84]],10,false);
  line([[499.8,-440],[499.8,440]],12);line([[501.6,-440],[501.6,440]],7,true,2.7);line([[513.6,-440],[513.6,440]],10);line([[515.2,-300],[515.2,300]],5);
  const skins=['#f1c8a8','#e0b090','#c68b62','#a86f48','#7c4e33','#5a3826','#f5d5bd','#d9a37d'];
  const tops=['#1f2833','#2c3a52','#4b4f2c','#6d5843','#7a2b2b','#3d3d3d','#b07c4b','#5a6e7f','#2e4a3a','#8c8577','#a33b2b','#d2c6ad'];
  const bots=['#2d3c55','#1e1f22','#3a4a63','#7d6a4c','#4a4a4a','#2f2a26'];
  const hairs=['#1b1410','#3b2618','#5a3b22','#141414','#8a6a45','#b8b0a5'];
  for(const R of routes){
    const segs=[];let tot=0;for(let i=0;i<R.pts.length-1;i++){const a=R.pts[i],b=R.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push({a,b,l,s:tot});tot+=l;}
    R.segs=segs;R.len=tot;
    for(let i=0;i<R.n;i++)NPCS.push({R,s:r()*tot,dir:R.dir||(r()<.5?1:-1),skate:!!R.skate,v:(1.05+r()*.5)*(R.vm||1),off:(r()-.5)*(R.spread||2.2),ph:r()*TAU,y:null,
      skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.92+r()*.14,idle:false});
  }
  // anglers on the bottom step of the revetment
  for(const z of [-118,36,96,262]){const q={R:null,x:521.1,z,face:Math.PI/2+(r()-.5)*.3,ph:r()*TAU,y:-1.35,skin:pick(skins,r),top:pick(['#3d4b3d','#6d5843','#1f2833','#7a2b2b'],r),bot:pick(bots,r),hair:pick(hairs,r),h:.95+r()*.1,idle:true};NPCS.push(q);
    const rod=new T.Mesh(new T.CylinderGeometry(.012,.025,3.4,6),MAT.black);rod.position.set(522.6,.65,z+.25);rod.rotation.z=-1.05;scene.add(rod);
    const ln=new T.Mesh(new T.CylinderGeometry(.004,.004,2.9,3),new T.MeshBasicMaterial({color:0xdddddd}));ln.position.set(524.05,-.05,z+.25);scene.add(ln);}
  // spectators leaning on the rink rail, store staff
  {const P=rinkPts(-.55,120);for(let i=0;i<120;i+=6){if(r()<.25)continue;const [x,z]=P[i];if(rinkGate(x,z))continue;NPCS.push({R:null,x,z,face:Math.atan2(RINK.cx-x,RINK.cz-z)+(r()-.5)*.6,ph:r()*TAU,y:0,skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.85+r()*.2,idle:true,kid:r()<.3});}}
  for(const [x,z,f,c] of [[-106.6,-32,-Math.PI/2,'#c81d36'],[-126.6,-31,Math.PI/2,'#f2f2f0'],[-126.6,-35.5,Math.PI/2,'#f2f2f0']])NPCS.push({R:null,x,z,face:f,ph:r()*TAU,y:0,skin:pick(skins,r),top:c,bot:'#1e1f22',hair:pick(hairs,r),h:.95+r()*.08,idle:true,kid:true});
  // visitors standing around Cloud Gate taking photos
  for(let i=0;i<14;i++){const a=r()*TAU,d=13+r()*7;NPCS.push({R:null,x:Math.cos(a)*d,z:Math.sin(a)*d*.8,face:Math.atan2(-Math.cos(a),-Math.sin(a)*.8),ph:r()*TAU,y:D,
    skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.92+r()*.14,idle:true});}
  for(let i=0;i<8;i++){const x=-44+r()*14,z=95+r()*55;NPCS.push({R:null,x,z,face:r()*TAU,ph:r()*TAU,y:0,skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.6+r()*.15,idle:true,kid:true});}
  // dog walkers looping the Great Lawn, and two owners playing fetch
  const lawnLoop=(rx,rz)=>{const p=[];for(let i=0;i<=48;i++){const a=i/48*TAU;p.push([118+Math.cos(a)*rx,32+Math.sin(a)*rz]);}return p;};
  for(const [rx,rz,k] of [[41.5,53,3],[31,41,2]]){
    const R={pts:lawnLoop(rx,rz),ping:false};const segs=[];let tot=0;
    for(let i=0;i<R.pts.length-1;i++){const a=R.pts[i],b=R.pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);segs.push({a,b,l,s:tot});tot+=l;}R.segs=segs;R.len=tot;
    for(let i=0;i<k;i++){const q={R,s:tot*(i+r()*.3)/k,dir:i%2?-1:1,v:1.0+r()*.25,off:0,ph:r()*TAU,y:null,skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.92+r()*.14,idle:false,armR:-.45};
      NPCS.push(q);LAWN.walkers.push(q);}}
  for(const [x,z] of [[95,60],[142,6]]){const q={R:null,x,z,face:Math.atan2(118-x,32-z),ph:r()*TAU,y:D,skin:pick(skins,r),top:pick(tops,r),bot:pick(bots,r),hair:pick(hairs,r),h:.92+r()*.14,idle:true,armR:0};
    NPCS.push(q);LAWN.throwers.push(q);}
  const n=NPCS.length;
  const mk=(g,cnt)=>{const m=new T.InstancedMesh(g,new T.MeshStandardMaterial({roughness:.85}),cnt);m.castShadow=true;m.frustumCulled=false;scene.add(m);return m;};
  const torso=new T.CylinderGeometry(.2,.17,.6,10);const head=new T.SphereGeometry(.115,12,10);const hair=new T.SphereGeometry(.122,12,8,0,TAU,0,Math.PI*.55);
  const leg=new T.CylinderGeometry(.075,.06,.86,8);leg.translate(0,-.43,0);const arm=new T.CylinderGeometry(.05,.045,.62,8);arm.translate(0,-.31,0);
  crowd.torso=mk(torso,n);crowd.head=mk(head,n);crowd.hair=mk(hair,n);crowd.leg=mk(leg,n*2);crowd.arm=mk(arm,n*2);
  const C=new T.Color();
  NPCS.forEach((p,i)=>{crowd.torso.setColorAt(i,C.set(p.top));crowd.head.setColorAt(i,C.set(p.skin));crowd.hair.setColorAt(i,C.set(p.hair));
    crowd.leg.setColorAt(i*2,C.set(p.bot));crowd.leg.setColorAt(i*2+1,C.set(p.bot));crowd.arm.setColorAt(i*2,C.set(p.top));crowd.arm.setColorAt(i*2+1,C.set(p.top));});
})();
const _M=new T.Matrix4(),_B=new T.Matrix4(),_L=new T.Matrix4(),_R=new T.Matrix4(),_S=new T.Matrix4();
export function updateCrowd(dt,t){
  NPCS.forEach((p,i)=>{
    let x,z,face,moving=false;
    if(p.R){const R=p.R;p.s+=p.v*dt*p.dir;
      if(R.ping){if(p.s>R.len){p.s=R.len;p.dir=-1;}if(p.s<0){p.s=0;p.dir=1;}}else{p.s=(p.s+R.len)%R.len;}
      let g=R.segs[R.segs.length-1];for(const q of R.segs)if(p.s<=q.s+q.l){g=q;break;}
      const tt=clamp((p.s-g.s)/g.l,0,1),dx=(g.b[0]-g.a[0])/g.l*p.dir,dz=(g.b[1]-g.a[1])/g.l*p.dir;
      x=g.a[0]+(g.b[0]-g.a[0])*tt+(-dz)*p.off*.5;z=g.a[1]+(g.b[1]-g.a[1])*tt+dx*p.off*.5;face=Math.atan2(dx,dz);moving=true;p.fc=face;
      // pause for player in the way
      const ddx=late.player.x-x,ddz=late.player.z-z;if(ddx*ddx+ddz*ddz<1.1&&Math.abs(late.player.y-p.y)<1){p.s-=p.v*dt*p.dir;}
    }else{x=p.x;z=p.z;face=p.face+Math.sin(t*.4+p.ph)*.25;}
    if(late.suv.on&&Math.abs(late.suv.v)>.4){const ddx=x-late.suv.x,ddz=z-late.suv.z;if(ddx*ddx+ddz*ddz<20){const fx=Math.sin(late.suv.h),fz=Math.cos(late.suv.h);const lf=ddx*fx+ddz*fz,ll=ddx*fz-ddz*fx;
      if(Math.abs(lf)<3.3&&Math.abs(ll)<1.75){const push=(1.75-Math.abs(ll))*(ll>=0?1:-1);x+=fz*push;z+=-fx*push;if(!p.R){p.x=x;p.z=z;}}}}
    p.y=p.y===null?support(x,z,1000):support(x,z,p.y+.3);p.x=x;p.z=z;
    const sk=p.skate&&moving,sc=p.h,ph=p.ph+(moving?p.s*p.dir*(sk?1.15:3.4):0),sw=moving?Math.sin(ph)*(sk?.3:.5):Math.sin(t*1.3+p.ph)*.02,bob=moving&&!sk?Math.abs(Math.cos(ph))*.03:0;
    _B.makeRotationY(face);_B.setPosition(x,p.y+bob+(p.skate?.06:0),z);_S.makeScale(sc,sc,sc);_B.multiply(_S);if(sk){_R.makeRotationZ(Math.sin(ph)*.1);_B.multiply(_R);_R.makeRotationX(.18);_B.multiply(_R);}
    _M.makeTranslation(0,1.2,0);_L.multiplyMatrices(_B,_M);crowd.torso.setMatrixAt(i,_L);
    _M.makeTranslation(0,1.62,0);_L.multiplyMatrices(_B,_M);crowd.head.setMatrixAt(i,_L);
    _M.makeTranslation(0,1.645,-.01);_L.multiplyMatrices(_B,_M);crowd.hair.setMatrixAt(i,_L);
    for(const s of [-1,1]){_M.makeTranslation(.095*s,.9,0);if(sk)_R.makeRotationZ(s*Math.max(0,Math.sin(ph)*s)*.55);else _R.makeRotationX(sw*s);_M.multiply(_R);_L.multiplyMatrices(_B,_M);crowd.leg.setMatrixAt(i*2+(s>0?1:0),_L);
      _M.makeTranslation(.25*s,1.46,0);_R.makeRotationX(s>0&&p.armR!==undefined?p.armR:(-sw*s*.8+(p.idle&&!p.kid&&s>0?-1.2:0)));_M.multiply(_R);_L.multiplyMatrices(_B,_M);crowd.arm.setMatrixAt(i*2+(s>0?1:0),_L);}
  });
  for(const k of ['torso','head','hair','leg','arm'])crowd[k].instanceMatrix.needsUpdate=true;
}

(function lakeSitters(){
  const r=mulberry(616),list=[];
  const skins=['#f1c8a8','#e0b090','#c68b62','#a86f48','#7c4e33','#5a3826','#f5d5bd','#d9a37d'];
  const tops=['#2c3a52','#4b4f2c','#b07c4b','#7a2b2b','#5a6e7f','#d8b25a','#a33b2b','#3d3d3d','#8fa9c2','#6e4d6e','#c47a3c','#efe9dc'];
  const bots=['#2d3c55','#1e1f22','#3a4a63','#7d6a4c','#c9b99a','#4a4a4a'],hairs=['#1b1410','#3b2618','#5a3b22','#141414','#8a6a45','#c9a46a','#b8b0a5'];
  for(const z of LAKE.benches){if(r()<.45)continue;const k=r()<.4?2:1;for(let j=0;j<k;j++)list.push({x:516.45,y:.45,z:z+(k===2?(j?.45:-.45):(r()-.5)*.8),face:Math.PI/2});}
  for(let i=0;i<9;i++){const z=-420+r()*840;if(z>PIER.z0-4&&z<PIER.z1+4)continue;list.push({x:518.3,y:.02,z,face:Math.PI/2+(r()-.5)*.3});}
  const n=list.length;if(!n)return;
  const mat=()=>new T.MeshStandardMaterial({roughness:.85});
  const mk=(g,c)=>{const m=new T.InstancedMesh(g,mat(),c);m.castShadow=true;scene.add(m);return m;};
  const thigh=new T.CylinderGeometry(.08,.068,.45,8);thigh.translate(0,-.225,0);const shin=new T.CylinderGeometry(.064,.052,.45,8);shin.translate(0,-.225,0);
  const arm=new T.CylinderGeometry(.05,.045,.6,8);arm.translate(0,-.3,0);
  const I={torso:mk(new T.CylinderGeometry(.2,.17,.6,10),n),head:mk(new T.SphereGeometry(.115,12,10),n),hair:mk(new T.SphereGeometry(.122,12,8,0,TAU,0,Math.PI*.55),n),
    thigh:mk(thigh,n*2),shin:mk(shin,n*2),arm:mk(arm,n*2),foot:mk(new T.BoxGeometry(.1,.08,.25),n*2)};
  const C=new T.Color(),B=new T.Matrix4(),A=new T.Matrix4(),tr=(x,y,z)=>new T.Matrix4().makeTranslation(x,y,z),rX=a=>new T.Matrix4().makeRotationX(a),rZ=a=>new T.Matrix4().makeRotationZ(a);
  const set=(m,i,...ms)=>{A.copy(B);for(const q of ms)A.multiply(q);m.setMatrixAt(i,A);};
  list.forEach((p,i)=>{const sc=.92+r()*.14;B.makeRotationY(p.face);B.setPosition(p.x,p.y,p.z);B.multiply(new T.Matrix4().makeScale(sc,sc,sc));
    const lean=-.12+r()*.1,body=new T.Matrix4().multiplyMatrices(tr(0,.02,-.05),rX(lean));
    set(I.torso,i,body,tr(0,.32,0));set(I.head,i,body,tr(0,.76,0),rX(r()*.25-.05));set(I.hair,i,body,tr(0,.785,-.01));
    const top=pick(tops,r),bot=pick(bots,r);
    for(const sd of [-1,1]){const j=i*2+(sd>0?1:0);const hip=new T.Matrix4().multiplyMatrices(tr(.1*sd,.02,0),rX(-1.5+r()*.1));set(I.thigh,j,hip);
      const knee=hip.clone().multiply(tr(0,-.45,0)).multiply(rX(1.45+r()*.15));set(I.shin,j,knee);set(I.foot,j,knee,tr(0,-.47,.06));
      set(I.arm,j,body,tr(.24*sd,.58,0),rX(-.55),rZ(-.08*sd));
      I.thigh.setColorAt(j,C.set(bot));I.shin.setColorAt(j,C.set(bot));I.arm.setColorAt(j,C.set(top));I.foot.setColorAt(j,C.set(pick(['#f2f2ee','#1c1c1c','#7a5232'],r)));}
    I.torso.setColorAt(i,C.set(top));I.head.setColorAt(i,C.set(pick(skins,r)));I.hair.setColorAt(i,C.set(pick(hairs,r)));});
  for(const k in I){I[k].instanceMatrix.needsUpdate=true;if(I[k].instanceColor)I[k].instanceColor.needsUpdate=true;}
})();

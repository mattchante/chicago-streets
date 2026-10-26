import * as T from 'three';
import { TAU, mulberry } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { blotch, makeTex } from '../core/textures.js';
import { ENV, stdMat } from '../core/materials.js';
import { Acc, acc, mergeColored, mx, vcMat } from '../core/geometry.js';
import { colCirc, colRect } from '../core/collision.js';

/* ============================================================ McCORMICK TRIBUNE PLAZA (rink, set up as a patio in October) */

export const RINK={cx:-42,cz:0,w:24,l:50,r:8.5};
function rinkShape(inset=0){const w=RINK.w/2-inset,l=RINK.l/2-inset,r=RINK.r-inset,sh=new T.Shape();
  sh.moveTo(-w+r,-l);sh.lineTo(w-r,-l);sh.absarc(w-r,-l+r,r,-Math.PI/2,0,false);sh.lineTo(w,l-r);sh.absarc(w-r,l-r,r,0,Math.PI/2,false);
  sh.lineTo(-w+r,l);sh.absarc(-w+r,l-r,r,Math.PI/2,Math.PI,false);sh.lineTo(-w,-l+r);sh.absarc(-w+r,-l+r,r,Math.PI,Math.PI*1.5,false);return sh;}
export function rinkPts(inset,n){return rinkShape(inset).getSpacedPoints(n).map(v=>[RINK.cx+v.x,RINK.cz-v.y]);}
export function onIce(x,z){const dx=Math.max(0,Math.abs(x-RINK.cx)-(RINK.w/2-RINK.r)),dz=Math.max(0,Math.abs(z-RINK.cz)-(RINK.l/2-RINK.r));return dx*dx+dz*dz<(RINK.r-.25)**2;}
export const rinkGate=(x,z)=>(Math.abs(x-(RINK.cx+RINK.w/2))<.6&&z>2.5&&z<6)||(Math.abs(x-(RINK.cx-RINK.w/2))<.6&&z>-6&&z<-2.5);
(function rink(){
  // ice
  const iceTex=makeTex(512,512,(g,w,h)=>{const r=mulberry(404);g.fillStyle='#eef4f7';g.fillRect(0,0,w,h);blotch(g,w,h,r,40,'rgba(170,195,210,A)',.25,20,90);
    g.lineWidth=1;for(let i=0;i<520;i++){g.strokeStyle=`rgba(${r()<.5?150:255},${r()<.5?175:255},${r()<.5?190:255},${.15+r()*.3})`;g.beginPath();const x=r()*w,y=r()*h,a=r()*TAU,l=10+r()*70;g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+.4)*l*.5,y+Math.sin(a+.4)*l*.5,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}});
  const ig=new T.ShapeGeometry(rinkShape(0),24);ig.rotateX(-Math.PI/2);ig.translate(RINK.cx,.06,RINK.cz);
  {const p=ig.attributes.position,uv=ig.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/10,p.getZ(i)/10);}
  const ice=new T.Mesh(ig,new T.MeshStandardMaterial({map:iceTex,roughness:.08,metalness:.05,envMap:ENV,envMapIntensity:.75,polygonOffset:true,polygonOffsetFactor:-10,polygonOffsetUnits:-10}));ice.receiveShadow=true;scene.add(ice);
  // dasher boards: white boards, clear glass, dark top rail, posts; gates on the east and west sides
  const P=rinkPts(0,300),bd=new Acc(),gl=new Acc(),rl=new Acc(),posts=[];
  const both=(A,a,b,c,d)=>{A.quad(a,b,c,d,[0,0,1,0,1,1,0,1]);A.quad(b,a,d,c,[0,0,1,0,1,1,0,1]);};
  for(let i=0;i<P.length-1;i++){const [ax,az]=P[i],[bx,bz]=P[i+1];const mx_=(ax+bx)/2,mz_=(az+bz)/2;if(rinkGate(mx_,mz_))continue;
    both(bd,[ax,0,az],[bx,0,bz],[bx,.55,bz],[ax,.55,az]);both(gl,[ax,.55,az],[bx,.55,bz],[bx,1.15,bz],[ax,1.15,az]);
    const dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),nx=-dz/l*.05,nz=dx/l*.05;
    rl.quad([ax-nx,1.19,az-nz],[ax+nx,1.19,az+nz],[bx+nx,1.19,bz+nz],[bx-nx,1.19,bz-nz],[0,0,1,0,1,1,0,1]);
    both(rl,[ax+nx,1.13,az+nz],[bx+nx,1.13,bz+nz],[bx+nx,1.19,bz+nz],[ax+nx,1.19,az+nz]);both(rl,[ax-nx,1.13,az-nz],[bx-nx,1.13,bz-nz],[bx-nx,1.19,bz-nz],[ax-nx,1.19,az-nz]);
    if(i%5===0)posts.push([ax,az]);colCirc(mx_,mz_,.18,1.2,-1e9,{cam:false});}
  bd.mesh(stdMat({color:0xf3f3ef,roughness:.45,envMap:ENV,envMapIntensity:.3}),true,true);
  gl.mesh(new T.MeshStandardMaterial({color:0xd8ecf2,transparent:true,opacity:.22,roughness:.05,metalness:.1,envMap:ENV,depthWrite:false}),false,false);
  rl.mesh(stdMat({color:0x23272b,metalness:.6,roughness:.4,envMap:ENV}),true,false);
  {const im=new T.InstancedMesh(new T.BoxGeometry(.07,1.2,.07),stdMat({color:0x23272b,metalness:.6,roughness:.4}),posts.length);const M=new T.Matrix4();posts.forEach(([x,z],i)=>{M.makeTranslation(x,.6,z);im.setMatrixAt(i,M);});im.castShadow=true;scene.add(im);}
  // lamp posts with Millennium Park art banners
  const banTex=[0,1,2].map(k=>makeTex(128,256,(g,w,h)=>{const r=mulberry(70+k);const pal=[['#e36a3a','#2f7d6b','#f2c14e','#3a5ba8'],['#d94f70','#f2a541','#2a9d8f','#264653'],['#7fb069','#e6aa68','#ca3c25','#1d1a05']][k];
    g.fillStyle='#f4efe4';g.fillRect(0,0,w,h);for(let i=0;i<9;i++){g.fillStyle=pal[i%4];g.globalAlpha=.85;g.beginPath();g.ellipse(r()*w,r()*h,20+r()*50,14+r()*40,r()*3,0,TAU);g.fill();}
    g.globalAlpha=1;g.fillStyle=pal[3];g.fillRect(0,h-34,w,34);g.fillStyle='#f4efe4';for(let i=0;i<4;i++)g.fillRect(14+i*26,h-22,16,8);}));
  const banMats=banTex.map(t=>new T.MeshStandardMaterial({map:t,roughness:.8,side:T.DoubleSide}));
  const lampPos=rinkPts(-4.2,10).slice(0,10);
  lampPos.forEach(([x,z],i)=>{if(x<-60)return;const pole=new T.Mesh(new T.CylinderGeometry(.09,.14,6.2,10),stdMat({color:0x2e3b33,metalness:.5,roughness:.5}));pole.position.set(x,3.1,z);pole.castShadow=true;scene.add(pole);
    const globe=new T.Mesh(new T.SphereGeometry(.3,14,10),stdMat({color:0xf2eedf,emissive:0x2a2416,roughness:.3}));globe.position.set(x,6.45,z);scene.add(globe);colCirc(x,z,.18,6.2);
    const a=Math.atan2(RINK.cx-x,RINK.cz-z);for(const sd of [-1,1]){const b=new T.Mesh(new T.PlaneGeometry(.75,1.8),banMats[(i+(sd>0?1:0))%3]);b.position.set(x+Math.cos(a)*.48*sd,4.5,z-Math.sin(a)*.48*sd);b.rotation.y=a;scene.add(b);}});
  // benches on the Michigan Ave side, facing the ice
  const wood='#6e5136',iron='#23272b',bp=[];
  for(let k=0;k<4;k++)bp.push([new T.BoxGeometry(1.8,.04,.1),wood,mx(0,.45,-.18+k*.12)]);for(let k=0;k<3;k++)bp.push([new T.BoxGeometry(1.8,.09,.035),wood,mx(0,.62+k*.12,-.27,-.18)]);
  for(const sx of [-.78,.78]){bp.push([new T.BoxGeometry(.06,.45,.06),iron,mx(sx,.225,.18)]);bp.push([new T.BoxGeometry(.06,.9,.06),iron,mx(sx,.45,-.27,-.18)]);}
  const bz=[-19,-7,7,19],bi=new T.InstancedMesh(mergeColored(bp,.08,9),vcMat,bz.length),M=new T.Matrix4();
  bz.forEach((z,i)=>{M.compose(new T.Vector3(-59.5,0,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),new T.Vector3(1,1,1));bi.setMatrixAt(i,M);colRect(-59.9,-59.1,z-.95,z+.95,.9);});
  bi.castShadow=true;scene.add(bi);
  // warm string lights wrapped through the rink-side trees
  const lp=[],rr=mulberry(12);for(const z of [-24,-12,0,12,24]){const x=-63;for(let k=0;k<70;k++){const t=k/70,a=t*TAU*7;lp.push(x+Math.cos(a)*.24,.6+t*3.6,z+Math.sin(a)*.24);}
    for(let k=0;k<160;k++){const a=rr()*TAU,rad=.6+rr()*1.9,y=4.4+rr()*2.4;lp.push(x+Math.cos(a)*rad,y,z+Math.sin(a)*rad);}}
  const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lp,3));
  scene.add(new T.Points(lg,new T.PointsMaterial({color:0xffd27a,size:.11,transparent:true,opacity:.95})));
  // Millennium Hall glass under the Bean plaza
  const gw=acc('sf_glass');gw.wall(-15.05,-40,-15.05,40,0,3.4,9,5);
})();

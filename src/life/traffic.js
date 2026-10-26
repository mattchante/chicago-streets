import * as T from 'three';
import { late } from '../core/state.js';
import { clamp, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { ENV } from '../core/materials.js';
import { inInter, sig } from '../world/streets.js';

/* ============================================================ TRAFFIC */
const PATHS=[];
function bez(a,c,b,n=10){const o=[];for(let i=1;i<n;i++){const t=i/n,u=1-t;o.push([u*u*a[0]+2*u*t*c[0]+t*t*b[0],u*u*a[1]+2*u*t*c[1]+t*t*b[1]]);}return o;}
function mkPath(pts,n,kind){
  const P={pts,seg:[],len:0,stops:[],kind};
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);P.seg.push({a,b,l,s:P.len,dx:(b[0]-a[0])/l,dz:(b[1]-a[1])/l});P.len+=l;}
  // stop lines where the path enters a signalised intersection
  let prev=null;
  for(let s=0;s<P.len;s+=.5){const q=at(P,s);const I=inInter(q.x,q.z);if(I&&I!==prev){P.stops.push({s:s-1.0,I,axis:Math.abs(q.dx)>Math.abs(q.dz)?'EW':'NS'});}prev=I;}
  P.n=n;PATHS.push(P);return P;
}
function at(P,s,o={}){let g=P.seg[P.seg.length-1];for(const q of P.seg)if(s<=q.s+q.l){g=q;break;}const t=clamp((s-g.s)/g.l,0,1);
  o.x=g.a[0]+(g.b[0]-g.a[0])*t;o.z=g.a[1]+(g.b[1]-g.a[1])*t;o.dx=g.dx;o.dz=g.dz;return o;}
const L=760;
[-83.4,-80.1].forEach(x=>mkPath([[x,L],[x,-L]],5));mkPath([[-76.8,L],[-76.8,-L]],3,'curb');
[-86.6,-89.9].forEach(x=>mkPath([[x,-L],[x,L]],5));mkPath([[-93.2,-L],[-93.2,L]],2,'curb');
mkPath([[-93.2,-L],[-93.2,-72],...bez([-93.2,-72],[-93.2,-59],[-106,-59]),[-106,-59],[-1000,-59]],2);
mkPath([[-1000,63],[-106,63],...bez([-106,63],[-93.2,63],[-93.2,76]),[-93.2,76],[-93.2,L]],2);
mkPath([[-1000,-158.8],[440,-158.8],...bez([440,-158.8],[454.3,-158.8],[454.3,-174]),[454.3,-174],[454.3,-L]],3);mkPath([[-1000,-155.6],[430,-155.6],...bez([430,-155.6],[441.1,-155.6],[441.1,-144]),[441.1,-144],[441.1,L]],3);
mkPath([[457.6,L],[457.6,-145],...bez([457.6,-145],[457.6,-165.2],[443,-165.2]),[443,-165.2],[-1000,-165.2]],3);mkPath([[444.4,-L],[444.4,-182],...bez([444.4,-182],[444.4,-168.4],[432,-168.4]),[432,-168.4],[-1000,-168.4]],3);
mkPath([[-1000,187.2],[440,187.2],...bez([440,187.2],[454.3,187.2],[454.3,172]),[454.3,172],[454.3,-L]],3);mkPath([[-1000,190.4],[430,190.4],...bez([430,190.4],[441.1,190.4],[441.1,202]),[441.1,202],[441.1,L]],3);
mkPath([[457.6,L],[457.6,198],...bez([457.6,198],[457.6,180.8],[443,180.8]),[443,180.8],[-1000,180.8]],3);mkPath([[444.4,-L],[444.4,166],...bez([444.4,166],[444.4,177.6],[432,177.6]),[432,177.6],[-1000,177.6]],3);
[191.9,188.6].forEach(x=>mkPath([[x,-L],[x,L]],4));[198.1,201.4].forEach(x=>mkPath([[x,L],[x,-L]],4));
[444.4,447.7].forEach(x=>mkPath([[x,-L],[x,L]],5));[454.3,457.6].forEach(x=>mkPath([[x,L],[x,-L]],5));
[-205,-199].forEach(x=>mkPath([[x,L],[x,-L]],4));

function carGeo(kind,color){
  const parts=[];const box=(w,h,d,x,y,z,c)=>{const g=new T.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,z);const n=g.attributes.position.count,col=new Float32Array(n*3);const C=new T.Color(c);for(let i=0;i<n;i++){col[i*3]=C.r;col[i*3+1]=C.g;col[i*3+2]=C.b;}g.setAttribute('color',new T.BufferAttribute(col,3));g.deleteAttribute('uv');parts.push(g);};
  const wheel=(x,z,r)=>{const g=new T.CylinderGeometry(r,r,.26,12).toNonIndexed();g.rotateZ(Math.PI/2);g.translate(x,r,z);const n=g.attributes.position.count,col=new Float32Array(n*3).fill(.06);g.setAttribute('color',new T.BufferAttribute(col,3));g.deleteAttribute('uv');parts.push(g);};
  let len,wid;
  if(kind==='bus'){len=12.2;wid=2.55;box(2.55,2.5,12.2,0,1.85,0,color);box(2.57,1.0,11.4,0,2.35,.2,'#1d2328');box(2.58,.32,12.2,0,1.25,0,'#2a5aa8');box(2.3,.2,2.5,0,3.2,-2,'#d9d9d9');
    box(2.3,.22,.05,0,2.9,6.11,'#111');box(2.0,1.3,.05,0,2.1,6.11,'#25303a');[[-4.4],[3.6]].forEach(([z])=>{wheel(-1.15,z,.5);wheel(1.15,z,.5);});}
  else if(kind==='suv'){len=4.9;wid=1.95;box(1.95,.95,4.9,0,.85,0,color);box(1.82,.72,3.0,0,1.68,-.25,'#1c2229');box(1.84,.08,3.0,0,2.06,-.25,color);
    box(.3,.14,.05,-.7,.95,2.46,'#f6f2e2');box(.3,.14,.05,.7,.95,2.46,'#f6f2e2');box(.34,.14,.05,-.75,1.0,-2.46,'#b5121b');box(.34,.14,.05,.75,1.0,-2.46,'#b5121b');
    [-1.55,1.55].forEach(z=>{wheel(-.9,z,.38);wheel(.9,z,.38);});}
  else{len=4.6;wid=1.82;box(1.82,.72,4.6,0,.7,0,color);box(1.66,.58,2.5,0,1.33,-.2,'#1c2229');box(1.68,.07,2.4,0,1.64,-.25,color);
    box(.3,.12,.05,-.65,.78,2.31,'#f6f2e2');box(.3,.12,.05,.65,.78,2.31,'#f6f2e2');box(.34,.12,.05,-.7,.82,-2.31,'#b5121b');box(.34,.12,.05,.7,.82,-2.31,'#b5121b');
    if(kind==='taxi')box(.9,.28,.35,0,1.82,-.1,'#f4f2e6');
    [-1.45,1.45].forEach(z=>{wheel(-.85,z,.34);wheel(.85,z,.34);});}
  // merge
  let n=0;for(const g of parts)n+=g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3);let o=0;
  for(const g of parts){pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);col.set(g.attributes.color.array,o*3);o+=g.attributes.position.count;}
  const G=new T.BufferGeometry();G.setAttribute('position',new T.BufferAttribute(pos,3));G.setAttribute('normal',new T.BufferAttribute(nor,3));G.setAttribute('color',new T.BufferAttribute(col,3));G.computeBoundingSphere();
  return {g:G,len,wid};
}
const carMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.45,envMap:ENV,envMapIntensity:.8});
export const CARS=[];
(function spawnCars(){
  const r=mulberry(123);const cols=['#f2f2f0','#f2f2f0','#1a1b1d','#1a1b1d','#9ea3a8','#6b7076','#2b3a55','#7a1f22','#c4b49a','#3d4b3d','#b8bcc0'];
  for(const P of PATHS){
    const used=[];
    for(let i=0;i<P.n;i++){
      let kind=r()<.2?'suv':r()<.12?'taxi':'car';if(P.kind==='curb'&&r()<.45)kind='bus';
      const color=kind==='bus'?'#f2f2f2':kind==='taxi'?pick(['#f2c230','#f2c230','#2f7d3e','#e9e7e2'],r):pick(cols,r);
      const {g,len,wid}=carGeo(kind,color);
      let s=0,tries=0;do{s=r()*P.len;tries++;}while(tries<40&&used.some(u=>Math.abs(u-s)<len+10));
      if(inInter(at(P,s).x,at(P,s).z,4))s+=12;
      used.push(s);
      const m=new T.Mesh(g,carMat);m.castShadow=true;scene.add(m);
      CARS.push({P,s,v:8+r()*4,vmax:(kind==='bus'?10:12.5)+r()*2,len,wid,m,x:0,z:0,dx:0,dz:1});
    }
  }
})();
const _q={};
export function updateCars(dt,t){
  for(const c of CARS){at(c.P,c.s,_q);c.x=_q.x;c.z=_q.z;c.dx=_q.dx;c.dz=_q.dz;}
  for(const c of CARS){
    let want=c.vmax;
    for(const st of c.P.stops){const ds=st.s-c.s-c.len/2;if(ds<-2||ds>60)continue;
      const L=sig(st.I,st.axis,t);if(L==='G')continue;
      if(L==='Y'&&ds<c.v*c.v/(2*6)-1)continue; // too close to stop, proceed
      if(ds<-.5)continue;want=Math.min(want,Math.sqrt(Math.max(0,2*5.5*(ds-.3))));}
    for(const o of CARS){if(o===c)continue;const rx=o.x-c.x,rz=o.z-c.z;const f=rx*c.dx+rz*c.dz;if(f<=0||f>45)continue;const lat=Math.abs(rx*c.dz-rz*c.dx);if(lat>1.9)continue;
      const gap=f-(c.len+o.len)/2-2.2;want=Math.min(want,Math.max(0,Math.sqrt(Math.max(0,2*5*gap))+Math.min(o.v,c.vmax)*.3));}
    {const rx=late.player.x-c.x,rz=late.player.z-c.z;const f=rx*c.dx+rz*c.dz;const lat=Math.abs(rx*c.dz-rz*c.dx);
      if(f>0&&f<30&&lat<2.2&&late.player.y<1.5){const gap=f-c.len/2-(late.suv.on?late.SUVL/2+1.4:2.4);want=Math.min(want,Math.sqrt(Math.max(0,2*6*gap)));}}
    if(!late.suv.on){const rx=late.suv.x-c.x,rz=late.suv.z-c.z;const f=rx*c.dx+rz*c.dz;const lat=Math.abs(rx*c.dz-rz*c.dx);
      if(f>0&&f<30&&lat<2.4&&late.suv.y<1.5){const gap=f-c.len/2-late.SUVL/2-1.5;want=Math.min(want,Math.sqrt(Math.max(0,2*6*gap)));}}
    if(want<c.v)c.v=Math.max(want,c.v-8*dt);else c.v=Math.min(want,c.v+2.6*dt);
    c.s+=c.v*dt;
    if(c.s>c.P.len-1){c.s=0;}
    at(c.P,c.s,_q);c.m.position.set(_q.x,-0.15,_q.z);c.m.rotation.y=Math.atan2(_q.dx,_q.dz);
  }
}

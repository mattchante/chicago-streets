import * as T from 'three';
import { late } from '../core/state.js';
import { clamp, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { makeTex, speckle } from '../core/textures.js';
import { ENV, MAT, stdMat } from '../core/materials.js';
import { Acc, acc } from '../core/geometry.js';
import { colRect } from '../core/collision.js';
import { addSign } from './buildings.js';

/* ============================================================ WALGREENS · ground floor of 30 N Michigan at Washington */
export const STORE={x0:-128,x1:-104,z0:-44,z1:-24,ch:4.6,doors:null};
(function walgreens(){
  const {x0,x1,z0,z1,ch}=STORE,cx=(x0+x1)/2,cz=(z0+z1)/2;
  const red='#d6203b';
  // floor, ceiling, walls
  MAT.storefloor=stdMat({map:makeTex(256,256,(g,w,h)=>{const r=mulberry(88);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const t=r()*.05;g.fillStyle=`rgb(${226-t*200|0},${224-t*200|0},${218-t*200|0})`;g.fillRect(x*64,y*64,64,64);}speckle(g,w,h,r,.06,6000);g.fillStyle='rgba(120,115,105,.35)';for(let i=0;i<=4;i++){g.fillRect(i*64,0,1.5,h);g.fillRect(0,i*64,w,1.5);}}),roughness:.3,envMap:ENV,envMapIntensity:.25,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
  acc('ov_storefloor').top(x0,x1,z0,z1,.02,2.4);
  const ceilTex=makeTex(256,256,(g,w,h)=>{g.fillStyle='#e7e6e1';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<=4;i++){g.fillRect(i*64,0,1,h);g.fillRect(0,i*64,w,1);}g.fillStyle='#fffdf4';g.fillRect(66,130,124,60);});
  ceilTex.repeat.set(5,4);
  const ceil=new T.Mesh(new T.PlaneGeometry(x1-x0,z1-z0),new T.MeshStandardMaterial({map:ceilTex,emissive:0xffffff,emissiveMap:ceilTex,emissiveIntensity:.45,roughness:.9}));
  ceil.rotation.x=Math.PI/2;ceil.position.set(cx,ch,cz);ceil.castShadow=true;scene.add(ceil);
  const wall=new Acc(),band=new Acc();
  wall.wall(x0+.05,z1,x0+.05,z0,0,ch,4,4);wall.wall(x1,z1-.05,x0,z1-.05,0,ch,4,4);
  band.wall(x0+.07,z1,x0+.07,z0,3.55,3.95,4,4);band.wall(x1,z1-.07,x0,z1-.07,3.55,3.95,4,4);
  wall.mesh(stdMat({color:0xf1efea,roughness:.85}),false,true);band.mesh(stdMat({color:0x9e1027,roughness:.6}),false,false);
  // storefront: glass, mullions, kick plate, red sign band
  const glassM=new T.MeshStandardMaterial({color:0xc5d6de,transparent:true,opacity:.2,roughness:.04,metalness:.15,envMap:ENV,envMapIntensity:1.1,depthWrite:false,side:T.DoubleSide});
  const gq=new Acc(),mu=new Acc(),kick=new Acc();
  gq.quad([x0,.35,z0],[x1,.35,z0],[x1,4,z0],[x0,4,z0],[0,0,1,0,1,1,0,1]);
  const D0=-40.5,D1=-37.5;
  gq.quad([x1,.35,z1],[x1,.35,D1],[x1,4,D1],[x1,4,z1],[0,0,1,0,1,1,0,1]);gq.quad([x1,.35,D0],[x1,.35,z0],[x1,4,z0],[x1,4,D0],[0,0,1,0,1,1,0,1]);
  gq.quad([x1,2.75,D1],[x1,2.75,D0],[x1,4,D0],[x1,4,D1],[0,0,1,0,1,1,0,1]);
  for(let x=x0;x<=x1+.01;x+=2.4)mu.box(x-.05,x+.05,z0-.08,z0+.04,0,4,1,1);
  for(const z of [z0,-41.9,D0,D1,-34,-29,z1])mu.box(x1-.04,x1+.08,z-.05,z+.05,0,4,1,1);
  mu.box(x0,x1,z0-.08,z0+.04,3.95,4.05,1,1);mu.box(x1-.04,x1+.08,z0,z1,3.95,4.05,1,1);mu.box(x1-.04,x1+.08,D0,D1,2.7,2.8,1,1);
  kick.box(x0,x1,z0-.1,z0+.04,0,.35,2,2);kick.box(x1-.04,x1+.1,z0,D0,0,.35,2,2);kick.box(x1-.04,x1+.1,D1,z1,0,.35,2,2);
  gq.mesh(glassM,false,false);mu.mesh(stdMat({color:0x2a2d31,metalness:.7,roughness:.35,envMap:ENV}),true,false);kick.mesh(stdMat({color:0x1d1e20,roughness:.4,envMap:ENV,envMapIntensity:.4}),false,true);
  const sb=new Acc();sb.box(x0-.2,x1+.25,z0-.36,z0-.06,4.05,5.15,2,2,false);sb.box(x1+.06,x1+.36,z0-.36,z1+.2,4.05,5.15,2,2,false);sb.mesh(stdMat({color:0xd6203b,roughness:.55}),true,false);
  {const sf=new Acc();sf.wall(x0,z0+.12,x1,z0+.12,3.98,ch,4,4);sf.wall(x1-.12,z0,x1-.12,z1,3.98,ch,4,4);sf.mesh(stdMat({color:0xf1efea,roughness:.85}),false,false);}
  const so={bg:red,fg:'#ffffff',weight:700};
  addSign('Walgreens',cx+2,4.6,z0-.37,'N',.78,so);addSign('PHARMACY',x0+3.2,4.6,z0-.37,'N',.4,so);
  addSign('Walgreens',x1+.37,4.6,-32,'E',.78,so);addSign('OPEN 24 HOURS',x1+.37,4.6,-26.6,'E',.36,so);
  // sliding entrance doors on Michigan Ave
  const doorG=()=>{const g=new T.Group();const pane=new T.Mesh(new T.PlaneGeometry(1.5,2.7),glassM);pane.rotation.y=Math.PI/2;pane.position.y=1.35;g.add(pane);
    const fm=stdMat({color:0x2a2d31,metalness:.7,roughness:.35});for(const [h,y] of [[.08,.04],[.08,2.66]]){const b=new T.Mesh(new T.BoxGeometry(.06,h,1.5),fm);b.position.y=y;g.add(b);}
    for(const z of [-.72,.72]){const b=new T.Mesh(new T.BoxGeometry(.06,2.7,.06),fm);b.position.set(0,1.35,z);g.add(b);}scene.add(g);return g;};
  STORE.doors=[doorG(),doorG()];STORE.doors[0].position.set(x1-.02,0,-39.75);STORE.doors[1].position.set(x1-.02,0,-38.25);STORE.open=0;
  {const mat=new T.Mesh(new T.PlaneGeometry(2.2,3.2),stdMat({color:0x2b2e33,roughness:.95,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6}));mat.rotation.x=-Math.PI/2;mat.position.set(x1-1.3,.03,-39);scene.add(mat);}
  colRect(x0-.05,x1,z0-.12,z0+.08,ch);colRect(x1-.08,x1+.12,z0,D0,ch);colRect(x1-.08,x1+.12,D1,z1,ch);
  // merchandise textures
  const prodTex=(seed,halloween)=>makeTex(512,256,(g,w,h)=>{const r=mulberry(seed);g.fillStyle='#e4e7ea';g.fillRect(0,0,w,h);g.fillStyle='#4a4f56';g.fillRect(0,h-18,w,18);
    const pal=halloween?['#f07f1a','#1b1b1b','#f5a623','#6b2fa0','#2a2a2a','#e65100','#8bc34a']:['#d6203b','#1f4e8c','#f2f2ee','#2e7d4f','#f4b400','#6a1b9a','#00838f','#ef6c00','#c2185b','#455a64','#8d6e63','#fdd835','#0277bd','#e8eaf0'];
    const rows=5,rh=(h-18)/rows;
    for(let k=0;k<rows;k++){const y0=k*rh,base=y0+rh-6;g.fillStyle='#b8bec5';g.fillRect(0,base,w,6);g.fillStyle='#fdfdfb';for(let x=6;x<w;x+=34+r()*30)g.fillRect(x,base+1,10,4);
      let x=2;while(x<w-4){const iw=8+r()*20,ih=rh*(.45+r()*.42),c=pick(pal,r),n=1+Math.floor(r()*4);
        for(let j=0;j<n&&x<w-4;j++){g.fillStyle=c;if(r()<.35){g.beginPath();g.moveTo(x,base);g.lineTo(x,base-ih+5);g.quadraticCurveTo(x+iw/2,base-ih-4,x+iw,base-ih+5);g.lineTo(x+iw,base);g.fill();}else g.fillRect(x,base-ih,iw,ih);
          g.fillStyle='rgba(255,255,255,.75)';g.fillRect(x+1,base-ih*.6,iw-2,ih*.22);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x+iw-2,base-ih,2,ih);x+=iw+1;}x+=2+r()*3;}}});
  const pt=[prodTex(11),prodTex(12),prodTex(13)];pt.forEach(t=>t.repeat.set(3,1));
  const hall=prodTex(14,true),endT=prodTex(15);
  const topM=stdMat({color:0xd9dde1,roughness:.6}),shelfM=pt.map(t=>new T.MeshStandardMaterial({map:t,roughness:.6}));
  const hallM=new T.MeshStandardMaterial({map:hall,roughness:.6}),endM=new T.MeshStandardMaterial({map:endT,roughness:.6});
  const AISLES=[['Vitamins','Cold & Flu'],['Beauty','Personal Care'],['Snacks','Household']];
  [-122.4,-119.4,-116.4,-113.4].forEach((gx,i)=>{const m=new T.Mesh(new T.BoxGeometry(.9,1.75,11.5),[shelfM[i%3],shelfM[(i+1)%3],topM,topM,endM,hallM]);m.position.set(gx,.875,-34.75);m.castShadow=true;m.receiveShadow=true;scene.add(m);colRect(gx-.45,gx+.45,-40.5,-29,1.75);});
  [-120.9,-117.9,-114.9].forEach((ax,i)=>{const o={bg:'#1f4e8c',fg:'#ffffff',weight:700};addSign(AISLES[i][0]+' · '+AISLES[i][1],ax,3.45,-41,'N',.34,o);addSign(AISLES[i][0]+' · '+AISLES[i][1],ax,3.45,-41,'S',.34,o);
    const hang=new T.Mesh(new T.CylinderGeometry(.01,.01,1.1,4),MAT.black);hang.position.set(ax,4.05,-41);scene.add(hang);});
  // coolers on the back wall
  const coolT=makeTex(512,256,(g,w,h)=>{const r=mulberry(21);g.fillStyle='#1b1d20';g.fillRect(0,0,w,h);
    for(let d=0;d<4;d++){const x=d*128+6,dw=116;g.fillStyle='#f6f8fa';g.fillRect(x,8,dw,h-16);
      for(let k=0;k<5;k++){const y=14+k*(h-28)/5,rh=(h-28)/5;g.fillStyle='#c9ced3';g.fillRect(x,y+rh-4,dw,4);
        let xx=x+3;while(xx<x+dw-8){const bw=7+r()*7,bh=rh*(.6+r()*.3);g.fillStyle=pick(['#d6203b','#1565c0','#2e7d32','#f9a825','#ef6c00','#6a1b9a','#00acc1','#424242'],r);g.fillRect(xx,y+rh-4-bh,bw,bh);g.fillStyle='rgba(255,255,255,.6)';g.fillRect(xx+1,y+rh-4-bh*.6,bw-2,bh*.25);xx+=bw+1.5;}}
      g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+dw*.15,8,dw*.12,h-16);g.fillStyle='#8a9097';g.fillRect(x+dw-10,h*.45,4,40);}});
  coolT.repeat.set(4,1);
  const cool=new T.Mesh(new T.BoxGeometry(15,2.3,.8),[topM,topM,topM,topM,topM,new T.MeshStandardMaterial({map:coolT,emissive:0xffffff,emissiveMap:coolT,emissiveIntensity:.5,roughness:.15,envMap:ENV,envMapIntensity:.4})]);
  cool.position.set(-116,1.15,z1-.5);scene.add(cool);colRect(-123.5,-108.5,z1-.95,z1,2.3);
  {const hdr=new T.Mesh(new T.BoxGeometry(15,.35,.1),stdMat({color:0x9e1027,roughness:.6}));hdr.position.set(-116,2.5,z1-.92);scene.add(hdr);}
  addSign('Cold Drinks',-116,2.5,z1-.98,'N',.26,{bg:'#c81d36',fg:'#ffffff',weight:700});
  // pharmacy counter along the west wall
  const binT=makeTex(256,128,(g,w,h)=>{const r=mulberry(31);g.fillStyle='#eceff1';g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<8;x++){g.fillStyle=pick(['#ffffff','#e3f2fd','#fff8e1','#f1f8e9'],r);g.fillRect(x*32+2,y*32+3,28,26);g.fillStyle='#90a4ae';g.fillRect(x*32+8,y*32+20,16,4);}});
  binT.repeat.set(3,1);
  const shelfBack=new T.Mesh(new T.PlaneGeometry(11,2.2),new T.MeshStandardMaterial({map:binT,roughness:.7}));shelfBack.rotation.y=Math.PI/2;shelfBack.position.set(x0+.1,1.6,-33);scene.add(shelfBack);
  {const c=new T.Mesh(new T.BoxGeometry(.8,1.05,11),stdMat({color:0xf3f1ec,roughness:.6}));c.position.set(-125.6,.525,-33);c.castShadow=true;scene.add(c);
   const t=new T.Mesh(new T.BoxGeometry(.95,.05,11.2),stdMat({color:0x6d6f72,roughness:.35,envMap:ENV,envMapIntensity:.3}));t.position.set(-125.6,1.07,-33);scene.add(t);
   const k=new T.Mesh(new T.BoxGeometry(.04,.35,11),stdMat({color:0x9e1027,roughness:.6}));k.position.set(-125.18,.85,-33);scene.add(k);}
  colRect(-126.05,-125.15,-38.5,-27.5,1.1);colRect(x0,-125.15,-38.6,-38.4,1.1);
  addSign('Pharmacy',x0+.08,3.15,-33,'E',.5,{bg:'#ffffff',fg:'#c81d36',weight:700});
  addSign('Drop Off',-125.15,1.6,-36.5,'E',.22,{bg:'#1f4e8c',fg:'#ffffff',weight:700});addSign('Pick Up',-125.15,1.6,-29.5,'E',.22,{bg:'#1f4e8c',fg:'#ffffff',weight:700});
  // checkout by the entrance
  {const c=new T.Mesh(new T.BoxGeometry(.9,1.0,5.5),stdMat({color:0xf3f1ec,roughness:.6}));c.position.set(-107.7,.5,-32.25);c.castShadow=true;scene.add(c);
   const t=new T.Mesh(new T.BoxGeometry(1.0,.05,5.6),stdMat({color:0x4b4e52,roughness:.35}));t.position.set(-107.7,1.02,-32.25);scene.add(t);
   const k=new T.Mesh(new T.BoxGeometry(.04,.3,5.5),stdMat({color:0x9e1027,roughness:.6}));k.position.set(-108.17,.8,-32.25);scene.add(k);
   for(const z of [-34,-30.5]){const s2=new T.Mesh(new T.BoxGeometry(.06,.3,.42),MAT.black);s2.position.set(-107.85,1.3,z);s2.rotation.z=-.25;scene.add(s2);const st=new T.Mesh(new T.BoxGeometry(.04,.25,.04),MAT.black);st.position.set(-107.7,1.15,z);scene.add(st);}
   const rack=new T.Mesh(new T.BoxGeometry(.4,1.3,1.6),[topM,topM,topM,topM,hallM,hallM]);rack.position.set(-108.5,.65,-36.2);rack.rotation.y=Math.PI/2;scene.add(rack);}
  colRect(-108.2,-107.2,-35,-29.5,1.1);colRect(-108.75,-108.25,-37,-35.4,1.3);
  addSign('Checkout',-107.7,3.3,-32.25,'W',.3,{bg:'#c81d36',fg:'#ffffff',weight:700});
  // interior light
  const L=new T.PointLight(0xfff3e2,1.25,30,1.2);L.position.set(cx,4.1,cz);scene.add(L);STORE.light=L;
})();
export function updateStore(dt){
  if(!STORE.doors)return;const near=Math.abs(late.player.x-(STORE.x1))<4&&Math.abs(late.player.z+39)<3.5&&late.player.y<2&&!late.suv.on;
  STORE.open=clamp(STORE.open+(near?dt*2.2:-dt*1.4),0,1);const o=STORE.open*1.42;
  STORE.doors[0].position.z=-39.75-o;STORE.doors[1].position.z=-38.25+o;
  STORE.light.intensity=Math.hypot(late.player.x+116,late.player.z+34)<90?1.25:0;
}

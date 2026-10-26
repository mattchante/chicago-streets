import * as T from 'three';
import CROWN_PHOTO from '../assets/crown-face.jpg';
import { TAU, mulberry, pick } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { makeTex } from '../core/textures.js';
import { ENV, MAT } from '../core/materials.js';
import { acc } from '../core/geometry.js';
import { colRect } from '../core/collision.js';

/* ============================================================ CROWN FOUNTAIN
   Two 15.2 m glass-block towers facing each other across a 15 × 71 m black granite pool */
const crown={faces:[]};

function faceTex(seed){
  const c=document.createElement('canvas');c.width=256;c.height=560;const g=c.getContext('2d');const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;
  const r=mulberry(seed);const tones=[['#c99f83','#8c624a'],['#e0bba0','#a37a60'],['#8a5d43','#4f3324'],['#b88768','#6e4a35'],['#efcdb4','#b89078']];
  const st={tone:pick(tones,r),blink:0,mouth:0,hair:pick(['#2a1d16','#5a3b22','#141414','#7d6a55','#a19a91'],r),seed};
  st.photo=null;
  {const im=new Image();im.onload=()=>{const o=document.createElement('canvas');o.width=256;o.height=560;const q=o.getContext('2d');
    const w=340,h=im.height*340/im.width,y=280-h/2;q.drawImage(im,128-w/2,y,w,h);
    q.globalCompositeOperation='destination-in';const m=q.createRadialGradient(128,y+h*.48,h*.36,128,y+h*.48,h*.72);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=m;q.fillRect(0,0,256,560);
    st.photo=o;st.draw();};im.src=CROWN_PHOTO;}
  st.draw=()=>{const [sk,sh]=st.tone;
    if(st.photo){g.fillStyle='#e6edf2';g.fillRect(0,0,256,560);const bg=g.createRadialGradient(128,250,30,128,250,260);bg.addColorStop(0,'#f4f7f9');bg.addColorStop(1,'#bdcad4');g.fillStyle=bg;g.fillRect(0,0,256,560);
      g.drawImage(st.photo,0,0);g.fillStyle='rgba(255,255,255,.16)';for(let y=0;y<560;y+=14)g.fillRect(0,y,256,2);for(let x=0;x<256;x+=14)g.fillRect(x,0,2,560);t.needsUpdate=true;return;}
    g.fillStyle='#e6edf2';g.fillRect(0,0,256,560);
    const bg=g.createRadialGradient(128,250,30,128,250,260);bg.addColorStop(0,'#f4f7f9');bg.addColorStop(1,'#bdcad4');g.fillStyle=bg;g.fillRect(0,0,256,560);
    g.save();g.filter='blur(3px)';
    g.fillStyle=st.hair;g.beginPath();g.ellipse(128,170,102,118,0,0,TAU);g.fill();
    const fg=g.createRadialGradient(110,230,20,128,260,140);fg.addColorStop(0,sk);fg.addColorStop(1,sh);g.fillStyle=fg;g.beginPath();g.ellipse(128,262,92,128,0,0,TAU);g.fill();
    g.fillStyle=sh;g.beginPath();g.ellipse(128,420,60,60,0,0,TAU);g.fill();
    g.fillStyle='rgba(60,35,25,.85)';
    if(st.blink>0){g.fillRect(70,232,44,5);g.fillRect(142,232,44,5);}else{g.beginPath();g.ellipse(92,234,20,11,0,0,TAU);g.ellipse(164,234,20,11,0,0,TAU);g.fill();
      g.fillStyle='#241612';g.beginPath();g.ellipse(92,234,8,8,0,0,TAU);g.ellipse(164,234,8,8,0,0,TAU);g.fill();}
    g.fillStyle='rgba(70,40,30,.5)';g.fillRect(70,206,46,6);g.fillRect(140,206,46,6);
    g.fillStyle='rgba(90,55,40,.35)';g.beginPath();g.moveTo(128,240);g.lineTo(116,300);g.lineTo(140,300);g.fill();
    g.fillStyle='#6d3a33';if(st.mouth>0){g.beginPath();g.ellipse(128,338,14*st.mouth+6,16*st.mouth+4,0,0,TAU);g.fill();g.fillStyle='#2a1210';g.beginPath();g.ellipse(128,338,9*st.mouth+2,11*st.mouth+2,0,0,TAU);g.fill();}
    else{g.beginPath();g.ellipse(128,338,30,7,0,0,TAU);g.fill();}
    g.restore();
    g.fillStyle='rgba(255,255,255,.16)';for(let y=0;y<560;y+=14)g.fillRect(0,y,256,2);for(let x=0;x<256;x+=14)g.fillRect(x,0,2,560);
    t.needsUpdate=true;};
  st.draw();st.tex=t;return st;
}
(function crownFountain(){
  const cx=-36.5,z0=84,z1=155;
  const pool=new T.Mesh(new T.PlaneGeometry(15,71),MAT.water);pool.rotation.x=-Math.PI/2;pool.position.set(cx,.06,(z0+z1)/2);pool.receiveShadow=true;scene.add(pool);
  acc('stone').box(cx-7.7,cx+7.7,z0-.7,z1+.7,0,.05,4,4,4);
  const blockTex=makeTex(128,256,(g,w,h)=>{g.fillStyle='#dfe9ef';g.fillRect(0,0,w,h);const r=mulberry(3);
    for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){g.fillStyle=`rgba(${150+r()*60|0},${185+r()*50|0},${205+r()*40|0},.6)`;g.fillRect(x+1,y+1,6,6);}});
  const side=new T.MeshStandardMaterial({map:blockTex,emissive:0xbfd6e2,emissiveMap:blockTex,emissiveIntensity:.35,roughness:.15,metalness:0,envMap:ENV,envMapIntensity:.6});
  for(const [zc,facing] of [[z0+2.45+1,1],[z1-2.45-1,-1]]){
    const st=faceTex(zc>100?7:13);crown.faces.push(st);
    const fm=new T.MeshBasicMaterial({map:st.tex,toneMapped:false});
    const mats=[side,side,side,side,facing>0?fm:side,facing<0?fm:side];
    const tw=new T.Mesh(new T.BoxGeometry(7.0,15.2,4.9),mats);tw.position.set(cx,7.6,zc);tw.castShadow=true;scene.add(tw);
    colRect(cx-3.5,cx+3.5,zc-2.45,zc+2.45,15.2);
    st.mouthPos=new T.Vector3(cx,4.6,zc+facing*2.46);st.dir=facing;
  }
  // water jets
  const N=320,g=new T.BufferGeometry(),p=new Float32Array(N*3);g.setAttribute('position',new T.BufferAttribute(p,3));
  crown.jet=new T.Points(g,new T.PointsMaterial({color:0xe8f3fa,size:.22,transparent:true,opacity:.85,depthWrite:false}));crown.jet.frustumCulled=false;scene.add(crown.jet);crown.jet.visible=false;
  crown.N=N;crown.t=0;crown.active=-1;
})();

/* ============================================================ CROWN FOUNTAIN ANIMATION */
export function updateCrown(dt,t){
  for(const f of crown.faces){if(f.photo)continue;if(f.blink>0){f.blink-=dt;if(f.blink<=0)f.draw();}
    else if(Math.random()<dt*.25){f.blink=.14;f.draw();}}
  // every ~40 s one face purses its lips and a jet arcs into the pool
  const cyc=t%40;const which=Math.floor(t/40)%2;const F=crown.faces[which];
  if(cyc>28&&cyc<31){const m=(cyc-28)/3;if(!F.photo&&Math.abs(F.mouth-m)>.08){F.mouth=m;F.draw();}crown.jet.visible=false;}
  else if(cyc>=31&&cyc<37){if(!F.photo&&F.mouth!==1){F.mouth=1;F.draw();}crown.jet.visible=true;
    const p=crown.jet.geometry.attributes.position.array;const o=F.mouthPos;
    for(let i=0;i<crown.N;i++){const u=((i/crown.N)+t*.9)%1;const s=u*1.25;const vx=0,vz=F.dir*7.5,vy=1.8;
      p[i*3]=o.x+(Math.sin(i*12.9)*.08)+vx*s;p[i*3+1]=Math.max(.08,o.y+vy*s-4.9*s*s);p[i*3+2]=o.z+vz*s+Math.cos(i*7.3)*.08;}
    crown.jet.geometry.attributes.position.needsUpdate=true;}
  else{crown.jet.visible=false;if(!F.photo&&F.mouth!==0){F.mouth=0;F.draw();}}
}

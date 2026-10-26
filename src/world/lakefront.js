import * as T from 'three';
import { late } from '../core/state.js';
import { TAU, lerp, mulberry, pick } from '../core/util.js';
import { camera, scene, sunDir } from '../core/renderer.js';
import { STY, TX } from '../core/textures.js';
import { ENV, MAT, stdMat } from '../core/materials.js';
import { acc, mergeColored, mx, vcMat } from '../core/geometry.js';
import { PIER, colCirc, colRect } from '../core/collision.js';
import { overlay } from './park.js';
import { building } from './buildings.js';

/* ============================================================ LAKEFRONT
   Layout east of DuSable Lake Shore Dr (x): 470 sidewalk · 476–498 lawn · 498–503 walking path ·
   503–511 Lakefront Trail (bikes) · 511–518 promenade · 518–522 limestone step revetment · lake.
   Monroe Harbor mooring field and breakwater to the east, DuSable Harbor docks north of Randolph,
   Streeterville, Lake Point Tower and Navy Pier on the northern skyline. */
const WATER_Y=-1.4;
const waterMat=new T.ShaderMaterial({fog:true,
  uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{uTime:{value:0},uSun:{value:sunDir.clone()},uCam:{value:new T.Vector3()}}]),
  vertexShader:`#include <fog_pars_vertex>
varying vec3 vWP;
void main(){vec4 wp=modelMatrix*vec4(position,1.);vWP=wp.xyz;vec4 mvPosition=viewMatrix*wp;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
  fragmentShader:`uniform float uTime;uniform vec3 uSun;uniform vec3 uCam;
varying vec3 vWP;
#include <fog_pars_fragment>
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
vec2 wv(vec2 p,vec2 d,float k,float a,float s){return d*cos(dot(p,d)*k+uTime*s)*a*k;}
vec3 skyc(vec3 d){float h=clamp(d.y,0.,1.);vec3 c=mix(vec3(.78,.85,.91),vec3(.30,.50,.80),pow(h,.55));return pow(c,vec3(2.2));}
void main(){
  vec2 p=vWP.xz;vec3 toC=uCam-vWP;float dist=length(toC);vec3 V=toC/dist;
  float open=smoothstep(1170.,1260.,p.x);
  vec2 g=wv(p,vec2(.8,.6),.05,.6,1.1)+wv(p,vec2(-.287,.958),.09,.35,1.5)+wv(p,vec2(.981,-.196),.21,.14,2.3)+wv(p,vec2(.406,-.914),.43,.06,3.2)+wv(p,vec2(-.814,-.581),.9,.025,4.5);
  g*=(.8+open*1.4);
  vec2 q=p*.6+vec2(uTime*.32,uTime*.18);float n0=vnoise(q),nx=vnoise(q+vec2(.5,0.)),nz=vnoise(q+vec2(0.,.5));
  vec2 q2=p*1.7-vec2(uTime*.5,uTime*.3);float m0=vnoise(q2),mx=vnoise(q2+vec2(.5,0.)),mz=vnoise(q2+vec2(0.,.5));
  g+=vec2(nx-n0,nz-n0)*.2+vec2(mx-m0,mz-m0)*.1;
  float fade=clamp(1.-dist/1500.,.07,1.);
  vec3 N=normalize(vec3(-g.x*fade,1.,-g.y*fade));
  vec3 R=reflect(-V,N);R.y=abs(R.y);
  float fres=.02+.98*pow(1.-max(dot(N,V),0.),5.);
  float sh=clamp((p.x-522.)/90.,0.,1.);
  vec3 body=mix(vec3(.028,.13,.15),vec3(.008,.05,.09),sh);
  body+=vec3(.012,.04,.035)*clamp(dot(N,uSun),0.,1.);
  vec3 col=mix(body,skyc(R)*.92,fres);
  float sd=max(dot(R,uSun),0.);col+=vec3(1.,.88,.68)*(pow(sd,400.)*8.+pow(sd,30.)*.12);
  float edge=min(abs(p.x-522.),9999.);
  float foam=smoothstep(2.2,0.,edge)*smoothstep(.35,.8,vnoise(p*1.3+vec2(0.,uTime*.7)));
  col=mix(col,vec3(.72,.77,.79),foam*.65);
  gl_FragColor=vec4(col,1.);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
  #include <fog_fragment>
}`});
{const w=new T.Mesh(new T.PlaneGeometry(7000,7000,70,70),waterMat);w.rotation.x=-Math.PI/2;w.position.set(518+3500,WATER_Y,0);scene.add(w);}
MAT.lakewalk=stdMat({map:TX.sidewalk,color:0xe2ded6,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
MAT.trail=stdMat({map:TX.asphalt,color:0x8a8a88,roughness:.95,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
MAT.revet=stdMat({map:TX.stone,color:0xa9a190,roughness:.95});
MAT.dock=stdMat({map:TX.wood,color:0xcfc4b4,roughness:.85});
export const LAKE={boats:null,boatsP:[],gulls:[]};
(function lakefront(){
  const r=mulberry(5151),Z0=-760,Z1=760;
  overlay('grass',476,498,Z0,Z1,.01,6);
  overlay('lakewalk',498,503,Z0,Z1,.03,4);
  overlay('trail',503,511,Z0,Z1,.03,8);
  overlay('lakewalk',511,518,Z0,Z1,.03,4);
  // trail markings
  const P=acc('paint'),Y=[.92,.74,.18],W=[.92,.92,.9],py=.05;
  const strip=(x0,z0,x1,z1,w,col)=>{const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz),nx=-dz/l*w/2,nz=dx/l*w/2;P.quad([x0-nx,py,z0-nz],[x0+nx,py,z0+nz],[x1+nx,py,z1+nz],[x1-nx,py,z1-nz],[0,0,0,0,0,0,0,0],col);};
  for(let z=Z0;z<Z1;z+=7)strip(507,z,507,z+3.5,.12,Y);
  for(let z=Z0;z<Z1;z+=40){strip(503.3,z,503.3,z+40,.1,W);strip(510.7,z,510.7,z+40,.1,W);}
  // pedestrian / bike symbols every 120 m
  for(let z=Z0+60;z<Z1;z+=120){for(const x of [505,509]){strip(x-.35,z,x+.35,z,.08,W);strip(x,z-.5,x,z+.5,.08,W);}}
  // limestone step revetment, in 80 m runs
  const rv=acc('revet');
  for(let z=Z0;z<Z1;z+=80){const ze=Math.min(Z1,z+80);
    for(let k=0;k<3;k++){const x0=518+k*4/3,x1=x0+4/3,top=-.45*(k+1);rv.box(x0,x1,z,ze,-2.2,top,2.6,2.6,2.6);colRect(x0,x1,z,ze,top);}}
  // seawalls for the Yacht Club pier and the Streeterville shore
  const seaWall=(x0,z0,x1,z1)=>{const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/60);for(let i=0;i<n;i++){const a=i/n,b=(i+1)/n;rv.wall(lerp(x0,x1,a),lerp(z0,z1,a),lerp(x0,x1,b),lerp(z0,z1,b),-2.2,0,2.6,2.6);}};
  // Chicago Yacht Club pier at the foot of Monroe
  acc('stone').top(PIER.x0,PIER.x1,PIER.z0,PIER.z1,0,6);colRect(PIER.x0,PIER.x1,PIER.z0,PIER.z1,0);
  seaWall(PIER.x1,PIER.z1,PIER.x1,PIER.z0);seaWall(PIER.x0+4,PIER.z1,PIER.x1,PIER.z1);seaWall(PIER.x1,PIER.z0,PIER.x0+4,PIER.z0);
  building({x0:526,x1:547,z0:181,z1:205,h:7.5,style:'white',sf:null});
  building({x0:529,x1:535,z0:184,z1:190,h:7,base:7.5,style:'white',sf:null});
  {const fp=new T.Mesh(new T.CylinderGeometry(.08,.1,14,8),MAT.white);fp.position.set(549,7,209);scene.add(fp);colCirc(549,209,.15,14);}
  // promenade lamps, benches, life rings
  const lampG=new T.SphereGeometry(.34,14,10),lamps=[];
  for(let z=Z0+10;z<Z1;z+=36){if(z>PIER.z0-4&&z<PIER.z1+4)continue;lamps.push(z);acc('darkmetal').box(512.1,512.3,z-.1,z+.1,0,5.6,1,1);acc('darkmetal').box(511.95,512.45,z-.25,z+.25,0,.5,1,1);colCirc(512.2,z,.25,5.6);}
  {const im=new T.InstancedMesh(lampG,stdMat({color:0xf4f0e2,emissive:0x2a2416,roughness:.3}),lamps.length);const M=new T.Matrix4();lamps.forEach((z,i)=>{M.makeScale(1,1.2,1);M.setPosition(512.2,5.95,z);im.setMatrixAt(i,M);});scene.add(im);}
  const benchParts=[];{const wood='#7a5a3c',iron='#25282b';
    for(let k=0;k<4;k++)benchParts.push([new T.BoxGeometry(1.8,.04,.1),wood,mx(0,.45,-.18+k*.12)]);
    for(let k=0;k<3;k++)benchParts.push([new T.BoxGeometry(1.8,.09,.035),wood,mx(0,.62+k*.12,-.27,-.18)]);
    for(const sx of [-.78,.78]){benchParts.push([new T.BoxGeometry(.06,.45,.06),iron,mx(sx,.225,.18)]);benchParts.push([new T.BoxGeometry(.06,.9,.06),iron,mx(sx,.45,-.27,-.18)]);benchParts.push([new T.BoxGeometry(.06,.04,.5),iron,mx(sx,.43,-.04)]);}}
  const benchG=mergeColored(benchParts,.08,77),benches=[];
  for(let z=Z0+28;z<Z1;z+=36){if(z>PIER.z0-4&&z<PIER.z1+4)continue;benches.push(z);}
  {const im=new T.InstancedMesh(benchG,vcMat,benches.length);const M=new T.Matrix4();
    benches.forEach((z,i)=>{M.compose(new T.Vector3(516.4,0,z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),new T.Vector3(1,1,1));im.setMatrixAt(i,M);colRect(516.05,516.85,z-.95,z+.95,.9);});
    im.castShadow=true;im.receiveShadow=true;scene.add(im);}
  LAKE.benches=benches;
  for(let z=Z0+70;z<Z1;z+=144){if(z>PIER.z0-6&&z<PIER.z1+6)continue;acc('darkmetal').box(517.45,517.6,z-.06,z+.06,0,1.6,1,1);
    const ring=new T.Mesh(new T.TorusGeometry(.33,.07,8,20),stdMat({color:0xe8661c,roughness:.6}));ring.rotation.y=Math.PI/2;ring.position.set(517.7,1.15,z);ring.castShadow=true;scene.add(ring);colCirc(517.5,z,.2,1.6);}
  // ---------- Monroe Harbor: mooring field + outer breakwater ----------
  const BW=acc('revet');
  for(let z=-260;z<1500;z+=60)BW.box(1176,1186,z,Math.min(1500,z+60),-2.4,.5,2.6,2.6,2.6);
  {const t=new T.Mesh(new T.CylinderGeometry(1.4,1.8,9,12),MAT.white);t.position.set(1181,5,-266);t.castShadow=true;scene.add(t);
   const lt=new T.Mesh(new T.CylinderGeometry(1.0,1.0,1.4,10),stdMat({color:0x1f7a3c,emissive:0x0b3d1c,roughness:.4}));lt.position.set(1181,10.2,-266);scene.add(lt);}
  const buoys=[];for(let x=600;x<1140;x+=24)for(let z=-90;z<720;z+=27){if(r()<.18)continue;buoys.push([x+(r()-.5)*5,z+(r()-.5)*5]);}
  {const im=new T.InstancedMesh(new T.SphereGeometry(.28,8,6),stdMat({color:0xf2f2ee,roughness:.5}),buoys.length);const M=new T.Matrix4();buoys.forEach(([x,z],i)=>{M.makeTranslation(x,WATER_Y+.1,z);im.setMatrixAt(i,M);});scene.add(im);}
  // ---------- boats ----------
  const hullShape=(L,B)=>{const sh=new T.Shape();sh.moveTo(-L/2,-B*.4);sh.lineTo(L*.08,-B/2);sh.quadraticCurveTo(L*.4,-B*.45,L/2,0);sh.quadraticCurveTo(L*.4,B*.45,L*.08,B/2);sh.lineTo(-L/2,B*.4);sh.lineTo(-L/2,-B*.4);return sh;};
  const hullG=(L,B,D,top)=>{const g=new T.ExtrudeGeometry(hullShape(L,B),{depth:D,bevelEnabled:false,curveSegments:8});g.rotateX(Math.PI/2);g.rotateY(-Math.PI/2);g.translate(0,top,0);return g;};
  const sail=(L,cover)=>{const B=L*.33;return mergeColored([
    [hullG(L,B,1.5,.85),'#f4f4f0'],[hullG(L*1.004,B*1.01,.16,.12),'#1d2f52'],[hullG(L*.97,B*.94,.06,.9),'#d8cdb4'],
    [new T.BoxGeometry(B*.55,.5,L*.34),'#f4f4f0',mx(0,1.15,-L*.06)],[new T.BoxGeometry(B*.56,.14,L*.24),'#1a1e22',mx(0,1.2,-L*.06)],
    [new T.CylinderGeometry(.07,.09,L*1.35,8),'#cfd3d6',mx(0,.9+L*.675,L*.1)],
    [new T.CylinderGeometry(.06,.06,L*.42,6),'#cfd3d6',mx(0,2.05,L*.1-L*.21,Math.PI/2)],
    [new T.CylinderGeometry(.2,.17,L*.4,8),cover,mx(0,2.25,L*.1-L*.2,Math.PI/2)]],.03,L*10|0);};
  const power=L=>{const B=L*.34;return mergeColored([
    [hullG(L,B,1.6,1.05),'#f6f6f3'],[hullG(L*1.004,B*1.01,.18,.15),'#24384f'],[hullG(L*.97,B*.94,.06,1.1),'#e2dccd'],
    [new T.BoxGeometry(B*.78,1.0,L*.42),'#f6f6f3',mx(0,1.6,-L*.06)],[new T.BoxGeometry(B*.8,.42,L*.36),'#15191d',mx(0,1.75,-L*.03)],
    [new T.BoxGeometry(B*.6,.5,L*.2),'#f6f6f3',mx(0,2.35,-L*.1)],[new T.BoxGeometry(B*.62,.2,L*.12),'#15191d',mx(0,2.45,-L*.02)]],.03,L*13|0);};
  const boatMat=new T.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.05,envMap:ENV,envMapIntensity:.7});
  const types=[sail(9,'#1d3b6a'),sail(11,'#0f4c5c'),sail(8,'#5a2a2a'),power(10),power(13)];
  const spots=[[],[],[],[],[]];
  // late October: most of the fleet has been hauled out; a few dozen remain on moorings
  const pickB=buoys.slice().sort(()=>r()-.5).slice(0,38);
  for(const [x,z] of pickB){const t=Math.floor(r()*types.length);spots[t].push({x,z,h:2.36+(r()-.5)*.25,ph:r()*TAU});}
  // DuSable Harbor docks north of Randolph
  const dk=acc('dock'),piles=[];
  for(const zc of [-660,-560,-460,-360]){dk.box(524,700,zc-1.2,zc+1.2,-1.05,-.85,3,3,3);
    for(let x=530;x<696;x+=9){for(const sg of [-1,1]){dk.box(x-.6,x+.6,sg>0?zc+1.2:zc-12.2,sg>0?zc+12.2:zc-1.2,-1.05,-.88,3,3,3);piles.push([x,zc+sg*12.2]);
      if(r()<.42){const t=Math.floor(r()*types.length);spots[t].push({x:x+4.5,z:zc+sg*6.8,h:sg>0?0:Math.PI,ph:r()*TAU});}}}}
  {const im=new T.InstancedMesh(new T.CylinderGeometry(.16,.16,2.6,8),stdMat({color:0x5a4a3a,roughness:.9}),piles.length);const M=new T.Matrix4();piles.forEach(([x,z],i)=>{M.makeTranslation(x,-.6,z);im.setMatrixAt(i,M);});scene.add(im);}
  for(let z=-720;z<-250;z+=60)BW.box(760,768,z,Math.min(-250,z+60),-2.4,.5,2.6,2.6,2.6);
  for(let x=700;x<768;x+=34)BW.box(x,x+34,-728,-720,-2.4,.5,2.6,2.6,2.6);
  LAKE.boats=types.map((g,i)=>{const im=new T.InstancedMesh(g,boatMat,Math.max(1,spots[i].length));im.count=spots[i].length;im.castShadow=true;im.frustumCulled=false;scene.add(im);return {im,list:spots[i]};});
  // ---------- Columbia Yacht Club: the old ferry moored off the seawall near Washington St ----------
  {const L=112,B=19;const g=new T.Group();
    g.add(new T.Mesh(hullG(L,B,8.5,5),stdMat({color:0x141618,roughness:.5,metalness:.2,envMap:ENV})));
    g.add(new T.Mesh(hullG(L*1.004,B*1.01,1.1,.3),stdMat({color:0x8c1f1a,roughness:.6})));
    const sup=stdMat({map:STY.white.map,roughness:.6});
    const blk=(w,h,d,x,y,z,m)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m||sup);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};
    blk(15,4.2,66,0,7.1,-6);blk(13,3.4,44,0,10.9,-4);blk(13.5,3.2,10,0,14.2,14,stdMat({color:0xf2f1ec,roughness:.5}));blk(14,.9,10.5,0,15.3,14,stdMat({color:0x1b1d20,roughness:.4}));
    for(const z of [-6,-18]){const f=new T.Mesh(new T.CylinderGeometry(2.2,2.4,8,16),stdMat({color:0xd9c9a3,roughness:.6}));f.position.set(0,16.5,z);f.castShadow=true;g.add(f);
      const t=new T.Mesh(new T.CylinderGeometry(2.25,2.25,1.6,16),MAT.black);t.position.set(0,20.6,z);g.add(t);}
    const m=new T.Mesh(new T.CylinderGeometry(.25,.35,16,8),MAT.white);m.position.set(0,22,26);g.add(m);
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    g.position.set(536,WATER_Y,-80);g.rotation.y=Math.PI;scene.add(g);
    const gw=new T.Mesh(new T.BoxGeometry(9.5,.25,2.2),MAT.white);gw.position.set(522.2,1.6,-62);gw.rotation.z=.2;scene.add(gw);}
  // ---------- Streeterville shore, Lake Point Tower, Navy Pier ----------
  {const land=acc('sidewalk');land.top(518,1000,-2600,-760,0,6);seaWall(518,-760,1000,-760);seaWall(1000,-760,1000,-955);seaWall(1000,-1050,1000,-2600);
    overlay('grass',560,990,-1050,-780,.02,6);
    const lptM=new T.MeshStandardMaterial({color:0x3a3128,metalness:.65,roughness:.18,envMap:ENV,envMapIntensity:.9});
    building({x0:770,x1:840,z0:-1026,z1:-956,h:9,style:'concrete',sf:null,noCol:true});
    for(let k=0;k<3;k++){const a=Math.PI/2+k*TAU/3;const c=new T.Mesh(new T.CylinderGeometry(16,16,188,40,1,true),lptM);c.position.set(805+Math.cos(a)*12,9+94,-991+Math.sin(a)*12);c.castShadow=true;scene.add(c);
      const cap=new T.Mesh(new T.CircleGeometry(16,40),MAT.roof);cap.rotation.x=-Math.PI/2;cap.position.set(c.position.x,197,c.position.z);scene.add(cap);}
    const rr=mulberry(31);for(let i=0;i<14;i++){const x=560+rr()*400,z=-1750+rr()*640,w=24+rr()*20;if(Math.hypot(x-805,z+991)<70)continue;
      building({x0:x,x1:x+w,z0:z,z1:z+w,h:60+rr()*170,style:pick(['glassBlue','concrete','limestone','glassGreen','brickTan'],rr),sf:null,noCol:true});}
    // Navy Pier
    for(let x=1000;x<2200;x+=60)rv.box(x,Math.min(2200,x+60),-1052,-952,-2.2,1,2.6,2.6,2.6);
    building({x0:1000,x1:1080,z0:-1045,z1:-960,h:20,base:1,style:'beaux',sf:null,noCol:true});
    building({x0:1180,x1:2060,z0:-1040,z1:-964,h:11,base:1,style:'brickTan',sf:null,noCol:true});
    building({x0:2080,x1:2195,z0:-1045,z1:-960,h:14,base:1,style:'beaux',sf:null,noCol:true});
    const dome=new T.Mesh(new T.SphereGeometry(30,24,12,0,TAU,0,Math.PI/2),stdMat({color:0x6f9a87,roughness:.5,metalness:.3}));dome.position.set(2137,15,-1002);scene.add(dome);
    // Centennial Wheel, 60 m tall, wheel plane facing the city
    const wg=new T.Group();wg.position.set(1130,33,-1002);
    const ringM=stdMat({color:0xe8e8e4,metalness:.4,roughness:.4});
    wg.add(new T.Mesh(new T.TorusGeometry(28,.5,8,72),ringM));wg.add(new T.Mesh(new T.TorusGeometry(25.5,.3,6,72),ringM));
    for(let k=0;k<21;k++){const a=k/21*TAU;const sp=new T.Mesh(new T.CylinderGeometry(.12,.12,28,4),ringM);sp.rotation.z=a;sp.position.set(Math.sin(-a)*14,Math.cos(-a)*14,0);wg.add(sp);}
    const gondM=stdMat({color:0x4a7fb5,roughness:.4,metalness:.3});for(let k=0;k<42;k++){const a=k/42*TAU;const gd=new T.Mesh(new T.BoxGeometry(2,2.4,2.6),gondM);gd.position.set(Math.cos(a)*29.5,Math.sin(a)*29.5,0);wg.add(gd);}
    for(const sx of [-1,1]){const leg=new T.Mesh(new T.CylinderGeometry(.9,1.2,36,8),ringM);leg.position.set(sx*9,-15,0);leg.rotation.z=sx*.28;wg.add(leg);}
    scene.add(wg);LAKE.wheel=wg;}
  // ---------- gulls ----------
  {const n=18;const wing=new T.BufferGeometry();wing.setAttribute('position',new T.Float32BufferAttribute([0,0,.1, .55,.05,-.05, 0,0,-.12, .55,.05,-.05, .95,-.04,-.22, .3,.02,-.12],3));wing.computeVertexNormals();
    const wm=new T.MeshStandardMaterial({color:0xe9ecef,roughness:.8,side:T.DoubleSide});
    LAKE.gw=[new T.InstancedMesh(wing,wm,n),new T.InstancedMesh(wing,wm,n)];
    LAKE.gb=new T.InstancedMesh(new T.SphereGeometry(.12,8,6),stdMat({color:0xf4f4f2,roughness:.7}),n);
    for(const m of [...LAKE.gw,LAKE.gb]){m.frustumCulled=false;scene.add(m);}
    for(let i=0;i<n;i++)LAKE.gulls.push({cx:540+r()*260,cz:-280+r()*640,R:18+r()*60,h:9+r()*22,w:(.18+r()*.2)*(r()<.5?1:-1),ph:r()*TAU});}
})();
const _q4=new T.Quaternion(),_e4=new T.Euler(0,0,0,'YXZ'),_v4=new T.Vector3(),_s4=new T.Vector3(1,1,1),_m4=new T.Matrix4(),_m5=new T.Matrix4(),_m6=new T.Matrix4();
export function updateLake(dt,t){
  waterMat.uniforms.uTime.value=t;waterMat.uniforms.uCam.value.copy(camera.position);
  if(late.player.x<300)return; // boats and gulls only animate when the lakefront is in view
  for(const B of LAKE.boats){B.list.forEach((b,i)=>{_e4.set(Math.sin(t*.7+b.ph)*.025,b.h+Math.sin(t*.13+b.ph)*.04,Math.sin(t*.9+b.ph*1.3)*.045);_q4.setFromEuler(_e4);
    _v4.set(b.x,WATER_Y+Math.sin(t*1.1+b.ph)*.07,b.z);_m4.compose(_v4,_q4,_s4);B.im.setMatrixAt(i,_m4);});B.im.instanceMatrix.needsUpdate=true;}
  LAKE.gulls.forEach((g,i)=>{const a=g.ph+t*g.w,x=g.cx+Math.cos(a)*g.R,z=g.cz+Math.sin(a)*g.R,y=g.h+Math.sin(t*.4+g.ph)*2;
    const yaw=Math.atan2(-Math.sin(a)*g.w,Math.cos(a)*g.w);_e4.set(0,yaw,-Math.sign(g.w)*.35);_q4.setFromEuler(_e4);_v4.set(x,y,z);_m4.compose(_v4,_q4,_s4);
    LAKE.gb.setMatrixAt(i,_m4);const flap=Math.max(0,Math.sin(t*.7+g.ph))*Math.sin(t*9+g.ph)*.6+.12;
    _m5.makeRotationZ(flap);_m6.multiplyMatrices(_m4,_m5);LAKE.gw[0].setMatrixAt(i,_m6);
    _m5.makeRotationZ(-flap);_m5.premultiply(new T.Matrix4().makeScale(-1,1,1));_m6.multiplyMatrices(_m4,_m5);LAKE.gw[1].setMatrixAt(i,_m6);});
  LAKE.gb.instanceMatrix.needsUpdate=true;LAKE.gw[0].instanceMatrix.needsUpdate=true;LAKE.gw[1].instanceMatrix.needsUpdate=true;
}

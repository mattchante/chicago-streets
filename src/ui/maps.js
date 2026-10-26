import { state, late } from '../core/state.js';
import { $, D, TAU } from '../core/util.js';
import { PIER, ROADS, blocked, outOfBounds, supRes, support } from '../core/collision.js';
import { BUILD } from '../world/buildings.js';
import { BP, NB } from '../world/bridges.js';
import { CARS } from '../life/traffic.js';
import { P3, player } from '../player/avatar.js';
import { suv, syncSUV } from '../vehicles/suv.js';

/* ============================================================ MAPS */
const MAPB={x0:-340,x1:560,z0:-420,z1:450};
const mapCanvas=document.createElement('canvas');mapCanvas.width=900;mapCanvas.height=870;
(function drawMap(){const g=mapCanvas.getContext('2d');const X=x=>x-MAPB.x0,Z=z=>z-MAPB.z0;
  g.fillStyle='#d8d4cc';g.fillRect(0,0,900,870);
  g.fillStyle='#4f7ea3';g.fillRect(X(522),0,900,870);
  g.fillStyle='#8fb36b';g.fillRect(X(-72),Z(-152),249,325);g.fillRect(X(213),Z(-152),219,325);g.fillRect(X(213),Z(195),219,300);g.fillRect(X(-72),Z(195),110,67);g.fillRect(X(476),0,22,870);
  g.fillStyle='#e4e0d6';g.fillRect(X(498),0,5,870);g.fillRect(X(511),0,7,870);g.fillStyle='#5d6066';g.fillRect(X(503),0,8,870);g.fillStyle='#cfc6b2';g.fillRect(X(518),0,4,870);
  g.fillStyle='#bdb7aa';g.fillRect(X(PIER.x0),Z(PIER.z0),PIER.x1-PIER.x0,PIER.z1-PIER.z0);g.fillStyle='#1b1d20';g.fillRect(X(526.5),Z(-136),19,112);g.fillStyle='#b9ab92';for(const zc of [-660,-560,-460,-360])g.fillRect(X(524),Z(zc-1.2),36,2.4);
  g.fillStyle='#c7c2b6';g.fillRect(X(-15),Z(-146),186,313);
  g.fillStyle='#7ea35a';g.beginPath();g.ellipse(X(118),Z(32),46,58,0,0,TAU);g.fill();
  g.fillStyle='#a58c63';g.fillRect(X(72),Z(99),84,66);
  g.fillStyle='#bdb7aa';g.fillRect(X(-66),Z(-62),51,124);g.fillStyle='#eef4f7';g.beginPath();g.roundRect?g.roundRect(X(-54),Z(-25),24,50,8.5):g.rect(X(-54),Z(-25),24,50);g.fill();
  g.fillStyle='#2b2f34';g.fillRect(X(-44),Z(84),15,71);
  for(const r of ROADS){g.fillStyle='#6d7075';g.fillRect(X(r.x0),Z(r.z0),r.x1-r.x0,r.z1-r.z0);}
  g.fillStyle='#8c857a';for(const b of BUILD){if(b.base>=D&&b.base<20){g.fillStyle='#8c857a';}g.fillRect(X(b.x0),Z(b.z0),b.x1-b.x0,b.z1-b.z0);}
  g.strokeStyle='#e0ded8';g.lineWidth=4;for(const pts of [BP,NB]){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(X(p.x),Z(p.z)):g.moveTo(X(p.x),Z(p.z)));g.stroke();}
  g.fillStyle='#e9eef2';g.beginPath();g.ellipse(X(0),Z(0),10,6.5,0,0,TAU);g.fill();g.strokeStyle='#555';g.lineWidth=1;g.stroke();
  g.fillStyle='#1d2024';g.font='600 13px "Archivo Narrow",Arial,sans-serif';
  const lab=(t,x,z,rot=0)=>{g.save();g.translate(X(x),Z(z));g.rotate(rot);g.fillStyle='rgba(255,255,255,.85)';const w=g.measureText(t).width;g.fillRect(-w/2-3,-9,w+6,16);g.fillStyle='#1d2024';g.textAlign='center';g.fillText(t,0,4);g.restore();};
  lab('Michigan Ave',-85,320,-Math.PI/2);lab('Wabash Ave',-202,320,-Math.PI/2);lab('Columbus Dr',195,330,-Math.PI/2);lab('Lake Shore Dr',451,330,-Math.PI/2);
  lab('Randolph St',-260,-162);lab('Washington St',-260,-57);lab('Madison St',-260,63);lab('Monroe St',-260,184);lab('Lake St',-260,-282);lab('Adams St',-260,308);
  lab('Cloud Gate',0,-14);lab('Ice Rink',-42,0);lab('Walgreens',-116,-34);lab('Great Lawn',118,40);lab('Pritzker Pavilion',118,-78);lab('Lurie Garden',114,130);lab('Crown Fountain',-36,120);lab('Maggie Daley Park',320,20);lab('Art Institute',-20,330);lab('Cultural Center',-128,-108);
  lab('Lakefront Trail',507,330,-Math.PI/2);lab('Monroe Harbor',540,90,-Math.PI/2);lab('LAKE MICHIGAN',700,0);
})();
const minic=$('minic'),mctx=minic.getContext('2d');
export function drawMini(){
  const g=mctx,W=400,S=2.0;g.clearRect(0,0,W,W);g.save();g.translate(W/2,W/2);g.rotate(state.camYaw);g.scale(S,S);
  g.drawImage(mapCanvas,-(player.x-MAPB.x0),-(player.z-MAPB.z0));
  // cars
  g.fillStyle='#f5f5f5';for(const c of CARS){const dx=c.x-player.x,dz=c.z-player.z;if(Math.abs(dx)>120||Math.abs(dz)>120)continue;g.fillRect(dx-1.2,dz-1.2,2.4,2.4);}
  if(!suv.on){g.fillStyle='#0b0c0e';g.strokeStyle='#e8b23a';g.lineWidth=1;g.save();g.translate(suv.x-player.x,suv.z-player.z);g.rotate(-suv.h);g.fillRect(-1.1,-2.7,2.2,5.4);g.strokeRect(-1.1,-2.7,2.2,5.4);g.restore();}
  g.restore();
  // player arrow (relative to camera)
  g.save();g.translate(W/2,W/2);g.rotate(-(player.face-(Math.atan2(-Math.sin(state.camYaw),-Math.cos(state.camYaw)))));
  g.fillStyle='#e8b23a';g.strokeStyle='#14161a';g.lineWidth=3;g.beginPath();g.moveTo(0,-16);g.lineTo(11,12);g.lineTo(0,6);g.lineTo(-11,12);g.closePath();g.stroke();g.fill();g.restore();
  // north tick
  g.save();g.translate(W/2,W/2);g.rotate(state.camYaw);g.fillStyle='#fff';g.font='700 26px "Archivo Narrow",Arial';g.textAlign='center';g.fillText('N',0,-W/2+34);g.restore();
}
export const LANDMARKS=[
  {n:'Cloud Gate',x:0,z:20,yaw:0},
  {n:'Michigan Ave & Washington',x:-62,z:-52,yaw:-Math.PI/2},
  {n:'Ice rink',x:-58,z:-12,yaw:-Math.PI/2+.4},
  {n:'Walgreens',x:-101,z:-39,yaw:-Math.PI/2},
  {n:'Crown Fountain',x:-22,z:120,yaw:Math.PI/2},
  {n:'Wrigley Square',x:-30,z:-84,yaw:.6},
  {n:'Jay Pritzker Pavilion',x:118,z:12,yaw:0},
  {n:'Lurie Garden',x:110,z:150,yaw:0},
  {n:'BP Pedestrian Bridge',x:196,z:-27,yaw:-Math.PI/2,y:8},
  {n:'Maggie Daley Park',x:290,z:22,yaw:-Math.PI/2},
  {n:'Art Institute lions',x:-73,z:308,yaw:-Math.PI/2},
  {n:'Modern Wing terrace',x:130,z:232,yaw:Math.PI,y:12.5},
  {n:'Michigan Ave & Randolph',x:-69,z:-145,yaw:Math.PI},
  {n:'Lakefront Trail',x:514,z:40,yaw:-Math.PI/2},
  {n:'Monroe Harbor',x:516,z:150,yaw:-2.1},
];
export function teleport(L){if(suv.on){suv.on=false;P3.visible=true;state.camDist=state.footCam;$('speedo').hidden=true;syncSUV(0);}player.x=L.x;player.z=L.z;player.y=L.y||4.2;player.y=support(L.x,L.z,player.y);player.vy=0;player.ground=true;player.sup=supRes.c;player.speed=0;state.camYaw=L.yaw;state.camPitch=.16;state.camInit=false;}
(function ftList(){const box=$('ftlist');for(const L of LANDMARKS){const b=document.createElement('button');b.className='ft';b.type='button';b.textContent=L.n;b.onclick=()=>{teleport(L);toggleMap(false);};box.appendChild(b);}})();
const big=$('bigmap'),bctx=big.getContext('2d');
function drawBig(){bctx.drawImage(mapCanvas,0,0);bctx.fillStyle='#e8b23a';bctx.strokeStyle='#14161a';bctx.lineWidth=2;
  for(const L of LANDMARKS){bctx.beginPath();bctx.arc(L.x-MAPB.x0,L.z-MAPB.z0,5,0,TAU);bctx.fillStyle='#ffffff';bctx.fill();bctx.stroke();}
  if(!suv.on){bctx.fillStyle='#0b0c0e';bctx.strokeStyle='#e8b23a';bctx.fillRect(suv.x-MAPB.x0-4,suv.z-MAPB.z0-4,8,8);bctx.strokeRect(suv.x-MAPB.x0-4,suv.z-MAPB.z0-4,8,8);}
  bctx.save();bctx.translate(player.x-MAPB.x0,player.z-MAPB.z0);bctx.rotate(Math.PI-player.face);bctx.fillStyle='#e8b23a';bctx.beginPath();bctx.moveTo(0,-11);bctx.lineTo(8,8);bctx.lineTo(0,4);bctx.lineTo(-8,8);bctx.closePath();bctx.fill();bctx.stroke();bctx.restore();}
big.addEventListener('click',e=>{const r=big.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*900+MAPB.x0,z=(e.clientY-r.top)/r.height*870+MAPB.z0;
  if(outOfBounds(x,z))return;if(blocked(x,z,support(x,z,4.2),null))return;teleport({x,z,yaw:state.camYaw,y:4.2});toggleMap(false);});
function toggleMap(force){const m=$('map');const show=force===undefined?m.hidden:force;if(!$('intro').hidden&&show)return;m.hidden=!show;if(show){drawBig();if(document.exitPointerLock&&state.locked)document.exitPointerLock();}}

Object.assign(late, { LANDMARKS, teleport, toggleMap });

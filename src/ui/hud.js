import { state } from '../core/state.js';
import { $, D } from '../core/util.js';
import { PIER } from '../core/collision.js';
import { onIce } from '../world/ice-rink.js';
import { STORE } from '../world/walgreens.js';
import { BP, NB } from '../world/bridges.js';
import { player } from '../player/avatar.js';

/* ============================================================ LOCATION HUD */
const ZONES=[
  {n:'Walgreens',s:'30 N Michigan Ave at Washington',test:(x,z,y)=>y<3&&x>STORE.x0&&x<STORE.x1&&z>STORE.z0&&z<STORE.z1},
  {n:'McCormick Tribune Ice Rink',s:'Millennium Park',test:(x,z,y)=>y<1&&onIce(x,z)},
  {n:'Cloud Gate',s:'Grainger Plaza · Millennium Park',test:(x,z,y)=>y>D-1&&x>-15&&x<30&&z>-46&&z<46},
  {n:'BP Pedestrian Bridge',s:'Over Columbus Drive',test:(x,z,y)=>player.sup&&player.sup.pts&&player.sup.pts===BP_PTS},
  {n:'Nichols Bridgeway',s:'To the Art Institute Modern Wing',test:(x,z,y)=>player.sup&&player.sup.pts===NB_PTS},
  {n:'Bluhm Family Terrace',s:'Art Institute · Modern Wing',test:(x,z,y)=>y>10&&x>110&&x<150&&z>200&&z<252},
  {n:'McCormick Tribune Plaza',s:'Millennium Park',test:(x,z,y)=>y<2&&x>-66&&x<-15&&z>-62&&z<62},
  {n:'Wrigley Square',s:'Millennium Monument',test:(x,z,y)=>y<2&&x>-66&&x<-15&&z>-146&&z<=-62},
  {n:'Crown Fountain',s:'Millennium Park',test:(x,z,y)=>y<2&&x>-66&&x<-15&&z>=62&&z<167},
  {n:'Jay Pritzker Pavilion',s:'Millennium Park',test:(x,z,y)=>y>D-1&&x>80&&x<156&&z>-97&&z<-26},
  {n:'Great Lawn',s:'Under the Pritzker trellis',test:(x,z,y)=>y>D-1&&((x-118)/46)**2+((z-32)/58)**2<1},
  {n:'Lurie Garden',s:'Millennium Park',test:(x,z,y)=>y>D-1&&x>68&&x<156&&z>95&&z<167},
  {n:'Chase Promenade',s:'Millennium Park',test:(x,z,y)=>y>D-1&&x>=30&&x<64&&z>-146&&z<167},
  {n:'Boeing Gallery North',s:'Millennium Park',test:(x,z,y)=>y>D-1&&x>-15&&x<30&&z<-46},
  {n:'Boeing Gallery South',s:'Millennium Park',test:(x,z,y)=>y>D-1&&x>-15&&x<30&&z>46},
  {n:'Millennium Park',s:'Chicago Loop',test:(x,z,y)=>x>-72&&x<177&&z>-152&&z<173},
  {n:'Maggie Daley Park',s:'Grant Park',test:(x,z,y)=>x>213&&x<432&&z>-152&&z<173},
  {n:'The Art Institute of Chicago',s:'S Michigan Ave',test:(x,z,y)=>x>-72&&x<177&&z>195&&z<420},
  {n:'Grant Park',s:'Butler Field',test:(x,z,y)=>x>213&&x<432&&z>195},
  {n:'Chicago Yacht Club',s:'Monroe Harbor',test:(x,z,y)=>x>518&&z>PIER.z0&&z<PIER.z1},
  {n:'Lakefront Trail',s:'Monroe Harbor',test:(x,z,y)=>x>498&&x<511&&z>-152},
  {n:'Lakefront Trail',s:'DuSable Harbor',test:(x,z,y)=>x>498&&x<511},
  {n:'Monroe Harbor',s:'Lakefront promenade',test:(x,z,y)=>x>511&&z>-152},
  {n:'DuSable Harbor',s:'Lakefront promenade',test:(x,z,y)=>x>511},
  {n:'Lakefront',s:'DuSable Lake Shore Dr',test:(x,z,y)=>x>470},
];
const BP_PTS=BP,NB_PTS=NB;
function streetName(x,z){
  const ns=z<63?'N':'S';
  if(x>-98&&x<-72)return (z<63?'N':'S')+' Michigan Ave';
  if(x>-210&&x<-194)return ns+' Wabash Ave';
  if(x>177&&x<213)return ns+' Columbus Dr';
  if(x>432&&x<470)return 'DuSable Lake Shore Dr';
  if(z>-172&&z<-152&&x<470)return 'E Randolph St';
  if(z>173&&z<195&&x<470)return x>-72?'E Monroe Dr':'E Monroe St';
  if(z>-65&&z<-49&&x<-98)return 'E Washington St';
  if(z>54&&z<72&&x<-98)return 'E Madison St';
  if(z>-290&&z<-274&&x<-98)return 'E Lake St';
  if(z>300&&z<316&&x<-98)return 'E Adams St';
  return null;
}
function nearestStreet(x,z){const c=[[Math.abs(x+85),(z<63?'N':'S')+' Michigan Ave'],[Math.abs(z+162),'E Randolph St'],[Math.abs(z-184),'E Monroe'],[Math.abs(x-195),'Columbus Dr'],[Math.abs(x+202),'Wabash Ave']];c.sort((a,b)=>a[0]-b[0]);return c[0][1];}
let hudT=0;
export function updateHUD(dt){
  hudT-=dt;if(hudT>0)return;hudT=.25;
  const {x,z,y}=player;const st=streetName(x,z);
  let place=null,sub=null;for(const Z of ZONES)if(Z.test(x,z,y)){place=Z.n;sub=Z.s;break;}
  if(st&&!(place&&y>1.5)){$('place').textContent=st;$('street').textContent=place?'At '+place:'Chicago Loop';}
  else if(place){$('place').textContent=place;$('street').textContent=sub;}
  else{$('place').textContent=nearestStreet(x,z);$('street').textContent=x<-98?'Historic Michigan Boulevard District':'Chicago Loop';}
  const deg=((-state.camYaw*180/Math.PI)%360+360)%360;const dirs=['N','NE','E','SE','S','SW','W','NW'];$('hd').textContent=dirs[Math.round(deg/45)%8];
}

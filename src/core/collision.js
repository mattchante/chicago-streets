import { PH, PR, STEP, clamp } from './util.js';

/* ============================================================ COLLISION WORLD */
const GRID=16,cells=new Map(),EMPTY=[];
const ck=(i,j)=>(i+400)*1000+(j+400);
export function addCol(c){
  const i0=Math.floor(c.bx0/GRID),i1=Math.floor(c.bx1/GRID),j0=Math.floor(c.bz0/GRID),j1=Math.floor(c.bz1/GRID);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=ck(i,j);let a=cells.get(k);if(!a)cells.set(k,a=[]);a.push(c);}
  return c;
}
export const SCR={top:0,bot:0};
function rectTest(x,z,pad){if(x<this.x0-pad||x>this.x1+pad||z<this.z0-pad||z>this.z1+pad)return null;
  if(this.hf){SCR.top=this.hf(clamp(x,this.x0,this.x1),clamp(z,this.z0,this.z1));SCR.bot=this.bot;return SCR;}return this;}
function circTest(x,z,pad){const dx=x-this.x,dz=z-this.z,r=this.r+pad;return dx*dx+dz*dz<r*r?this:null;}
export function colRect(x0,x1,z0,z1,top,bot=-1e9,o){return addCol(Object.assign({x0,x1,z0,z1,top,bot,bx0:x0-1,bx1:x1+1,bz0:z0-1,bz1:z1+1,test:rectTest},o||{}));}
export function colCirc(x,z,r,top=40,bot=-1e9,o){return addCol(Object.assign({x,z,r,top,bot,bx0:x-r-1,bx1:x+r+1,bz0:z-r-1,bz1:z+r+1,test:circTest,ns:true,cam:r>.6},o||{}));}
export function colPath(pts,w,thick,o){ // pts: [{x,z,h}]
  let bx0=1e9,bx1=-1e9,bz0=1e9,bz1=-1e9;for(const p of pts){bx0=Math.min(bx0,p.x);bx1=Math.max(bx1,p.x);bz0=Math.min(bz0,p.z);bz1=Math.max(bz1,p.z);}
  return addCol(Object.assign({pts,w,thick,rail:true,bx0:bx0-w,bx1:bx1+w,bz0:bz0-w,bz1:bz1+w,test(x,z,pad){
    let best=1e9,bh=0;const P=this.pts;
    for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1],dx=b.x-a.x,dz=b.z-a.z,L=dx*dx+dz*dz;let t=((x-a.x)*dx+(z-a.z)*dz)/L;t=clamp(t,0,1);
      const px=a.x+dx*t,pz=a.z+dz*t,d=(x-px)*(x-px)+(z-pz)*(z-pz);if(d<best){best=d;bh=a.h+(b.h-a.h)*t;}}
    const hw=this.w/2+pad;if(best>hw*hw)return null;SCR.top=bh;SCR.bot=bh-this.thick;return SCR;}},o||{}));
}
export const ROADS=[];
export function road(x0,x1,z0,z1,name){ROADS.push({x0,x1,z0,z1,name});}
export function onRoad(x,z){for(const r of ROADS)if(x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)return true;return false;}
function baseH(x,z){if(x>518)return -1.6;return onRoad(x,z)?-0.15:0;}
const BOUNDS={x0:-436,x1:521.7,z0:-405,z1:440};
export const PIER={x0:518,x1:552,z0:172,z1:214};
export function outOfBounds(x,z){if(x<BOUNDS.x0||z<BOUNDS.z0||z>BOUNDS.z1)return true;if(x<=BOUNDS.x1)return false;return !(x<PIER.x1-.3&&z>PIER.z0+.3&&z<PIER.z1-.3);}
export function query(x,z){return cells.get(ck(Math.floor(x/GRID),Math.floor(z/GRID)))||EMPTY;}
export function support(x,z,y){let g=baseH(x,z),s=null;const L=query(x,z);
  for(let i=0;i<L.length;i++){const c=L[i];if(c.ns)continue;const r=c.test(x,z,0);if(r&&r.top<=y+STEP&&r.top>g){g=r.top;s=c;}}
  supRes.c=s;return g;}
export const supRes={c:null};
export function blocked(x,z,y,cur){
  if(outOfBounds(x,z))return true;
  const L=query(x,z);
  for(let i=0;i<L.length;i++){const c=L[i],r=c.test(x,z,PR);if(r&&r.top>y+STEP&&r.bot<y+PH-.1)return true;}
  if(cur&&cur.rail&&!cur.test(x,z,0)){const ns=support(x,z,y);if(y-ns>0.8)return true;}
  return false;
}
export function solidAt(x,y,z){const L=query(x,z);for(let i=0;i<L.length;i++){const c=L[i];if(c.cam===false)continue;const r=c.test(x,z,.15);if(r&&r.top>y&&r.bot<y)return true;}return y<baseH(x,z)+.15;}

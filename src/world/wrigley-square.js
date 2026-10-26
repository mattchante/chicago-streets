import * as T from 'three';
import { TAU, lerp } from '../core/util.js';
import { scene } from '../core/renderer.js';
import { MAT } from '../core/materials.js';
import { SCR, addCol, colCirc } from '../core/collision.js';

/* ============================================================ WRIGLEY SQUARE · Millennium Monument (peristyle) */
(function peristyle(){
  const cx=-38,cz=-128,R=13,n=12;const colG=new T.CylinderGeometry(.42,.5,11,14);
  const im=new T.InstancedMesh(colG,MAT.cornice,n*2);const M=new T.Matrix4();let k=0;
  for(let i=0;i<n;i++){const a=lerp(-Math.PI*0.78,Math.PI*0.28,i/(n-1));
    for(const dr of [-0.75,0.75]){const ang=a+dr/R;const x=cx+Math.cos(ang)*R,z=cz+Math.sin(ang)*R;
      M.makeTranslation(x,5.9,z);im.setMatrixAt(k++,M);colCirc(x,z,.5,12);}}
  im.castShadow=true;scene.add(im);
  // base and entablature
  const ring=(r0,r1,y0,y1,mat)=>{
    const sh=new T.Shape();const a0=-Math.PI*0.8,a1=a0+Math.PI*1.1;
    const pts=[];for(let i=0;i<=40;i++){const a=lerp(a0,a1,i/40);pts.push(new T.Vector2(Math.cos(a)*r1,Math.sin(a)*r1));}for(let i=40;i>=0;i--){const a=lerp(a0,a1,i/40);pts.push(new T.Vector2(Math.cos(a)*r0,Math.sin(a)*r0));}
    const s2=new T.Shape(pts);const eg=new T.ExtrudeGeometry(s2,{depth:y1-y0,bevelEnabled:false,curveSegments:24});eg.rotateX(Math.PI/2);eg.translate(cx,y1,cz);
    const m=new T.Mesh(eg,mat);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;};
  ring(R-1.3,R+1.3,0,.4,MAT.cornice);
  addCol({bx0:cx-R-2,bx1:cx+R+2,bz0:cz-R-2,bz1:cz+R+2,test(x,z,pad){const d=Math.hypot(x-cx,z-cz);if(d<R-1.3-pad||d>R+1.3+pad)return null;
    let a=Math.atan2(z-cz,x-cx);const a0=-Math.PI*0.8,a1=a0+Math.PI*1.1;if(a<a0-.05)a+=TAU;if(a<a0-.08||a>a1+.08)return null;SCR.top=.4;SCR.bot=-1e9;return SCR;}});ring(R-1.1,R+1.1,11.4,13.0,MAT.cornice);
  // fountain bowl in front
  const bowl=new T.Mesh(new T.CylinderGeometry(3.4,3.6,.6,32),MAT.cornice);bowl.position.set(-46,.3,-102);scene.add(bowl);
  const w=new T.Mesh(new T.CircleGeometry(3.1,32),MAT.water);w.rotation.x=-Math.PI/2;w.position.set(-46,.58,-102);scene.add(w);
  colCirc(-46,-102,3.6,.6,-1e9,{ns:false});
})();

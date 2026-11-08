import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// A hand-built little valley: every piece is geometry, so the adventure has no asset loading screen.
export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9b8270);
  scene.fog = new THREE.FogExp2(0x9b8270, 0.023);
  const hemi = new THREE.HemisphereLight(0xdac6a7, 0x383b32, 2.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffddb1, 2.8); sun.position.set(-18, 30, 12); scene.add(sun);
  const mat = (c, roughness=1) => new THREE.MeshStandardMaterial({color:c, roughness});
  const stone=mat(0x6a6960), stoneLight=mat(0x858074), stoneDark=mat(0x474b47), earth=mat(0x56574a), pathMat=mat(0x777368), wood=mat(0x514638), darkWood=mat(0x312f29), leaf=mat(0x414c3d), leaf2=mat(0x56604a), gold=mat(0x9d804f, .6), cloth=mat(0x5c332a), iron=mat(0x555955, .55), bone=mat(0xb7ad94);
  const boxGeo = new THREE.BoxGeometry(1,1,1);
  function box(x,y,z,w,h,d,m,rot=0,parent=scene){ const o=new THREE.Mesh(boxGeo,m); o.position.set(x,y,z); o.scale.set(w,h,d); o.rotation.y=rot; parent.add(o); return o; }
  function cyl(x,y,z,r1,r2,h,m,parent=scene,segments=8){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),m);o.position.set(x,y,z);parent.add(o);return o;}
  function cone(x,y,z,r,h,m,parent=scene,segments=7){ const o=new THREE.Mesh(new THREE.ConeGeometry(r,h,segments),m);o.position.set(x,y,z);parent.add(o);return o; }
  function sphere(x,y,z,r,m,parent=scene){let o=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),m);o.position.set(x,y,z);parent.add(o);return o;}
  let seed=1273; const rand=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};
  // Canvas texture adds grain without external assets.
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#777669';ctx.fillRect(0,0,256,256);
  for(let i=0;i<6500;i++){let v=Math.floor(rand()*45);ctx.fillStyle=`rgba(${v+60},${v+57},${v+48},${rand()*.16})`;ctx.fillRect(rand()*256,rand()*256,rand()*5+1,rand()*5+1)}
  const groundTex=new THREE.CanvasTexture(c);groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(28,28);groundTex.colorSpace=THREE.SRGBColorSpace;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({map:groundTex,color:0x858a78,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.03;scene.add(ground);
  // Stone flagstones lead the eye through the whole playable space.
  for(let z=14;z>-34;z-=2.2){for(let x=-3.4;x<=3.4;x+=2.25){let o=box(x+(rand()-.5)*.17,.025,z+(rand()-.5)*.15,2.1,.08,2.03,rand()>.5?pathMat:stone, (rand()-.5)*.04);}}
  // Mossy stepping stones and tufts.
  for(let i=0;i<200;i++){let x=(rand()-.5)*62,z=(rand()-.5)*75-5;if(Math.abs(x)<4.5&&z<16&&z>-34)continue;let r=rand();if(r<.55){let b=box(x,.08,z,.4+rand()*1.1,.15+rand()*.25,.5+rand(),rand()>.5?stoneDark:stone,(rand()-.5)*2);b.rotation.z=(rand()-.5)*.2;}else{for(let j=0;j<3;j++){let g=box(x+(rand()-.5)*.3,.14,z+(rand()-.5)*.3,.035,.25+rand()*.25,.035,leaf);g.rotation.z=(rand()-.5)*.7;}}}
  function tree(x,z,s=1){let g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);cyl(0,2,0,.26,.4,4,wood,g);for(let i=0;i<3;i++){let y=2.7+i*1.1;cone(0,y,0,2.0-i*.37,2.8,i%2?leaf2:leaf,g,7)}}
  for(let i=0;i<48;i++){let x=(rand()>.5?1:-1)*(9+rand()*26),z=18-rand()*65;tree(x,z,.65+rand()*.8)}
  // Layered distant peaks frame the ruins.
  const mountainMats=[mat(0x696d65),mat(0x777a70),mat(0x626963)];
  for(let i=0;i<13;i++){let x=-55+i*9,z=-56-rand()*18,h=14+rand()*17;let m=cone(x,h/2-1,z,10+rand()*5,h,mountainMats[i%3],scene,5);m.rotation.y=rand()*2;}
  // Broken walls along the old road.
  function wall(x,z,length,axis='z'){const n=Math.floor(length/2);for(let i=0;i<n;i++){let along=(i-n/2)*2;let xx=x+(axis==='x'?along:0),zz=z+(axis==='z'?along:0);let height=1.1+rand()*1.3;box(xx,height/2,zz,axis==='x'?1.9:.8,height,axis==='z'?1.9:.8,rand()>.5?stone:stoneDark);if(rand()>.5)box(xx,height+.18,zz,axis==='x'?1.7:.85,.35,axis==='z'?1.7:.85,stoneLight);}}
  wall(-6.9,-2,15);wall(6.9,-4,12);wall(-7,-20,10);wall(7,-20,10);
  function column(x,z,h=4){box(x,.25,z,1.3,.5,1.3,stoneDark);cyl(x,h/2+.5,z,.43,.53,h,stoneLight,scene,8);box(x,h+.5,z,1.25,.4,1.25,stone);}
  // Two monumental archways, with individually laid voussoirs.
  function arch(z,scale=1){const g=new THREE.Group();g.position.set(0,0,z);g.scale.setScalar(scale);scene.add(g);for(let side of [-1,1]){box(side*4,2.4,0,1.4,4.8,1.5,stoneDark,0,g);box(side*4,.35,0,1.75,.7,1.8,stone,0,g);box(side*4,4.7,0,1.7,.45,1.8,stoneLight,0,g);for(let y=1;y<4.4;y+=.8)box(side*4,y,.77,1.41,.035,.035,stoneLight,0,g)}
    for(let i=0;i<11;i++){let a=Math.PI*i/10;let b=box(Math.cos(a)*4,4.7+Math.sin(a)*4,0,1.25,1.55,1.5,i%2?stone:stoneLight,0,g);b.rotation.z=a-Math.PI/2;}
    box(0,8.85,0,1.3,1.1,1.8,stoneDark,0,g);
  }
  arch(-29,1); 
  // Ruined towers and battlements beyond the gate.
  for(let side of [-1,1]){let x=side*9.5;box(x,4.1,-31,4.8,8.2,5,stoneDark);box(x,8.3,-31,5.3,.5,5.4,stone);for(let j=-1;j<=1;j++){box(x+j*1.7,9,-28.3,1,.9,.6,stoneLight);box(x+j*1.7,9,-33.7,1,.9,.6,stoneLight);}for(let y=1;y<8;y+=1.3){box(x,y,-28.45,4.8,.04,.05,stone)}box(x,5.4,-28.43,.65,2,.07,darkWood);}
  // Columns, banners, braziers.
  for(let z of [3,-15])for(let s of [-1,1]){column(s*5.2,z,3.8);box(s*5.2,3,z+.68,.72,1.5,.05,cloth);box(s*5.2,3.2,z+.72,.08,.8,.03,gold);}
  const flames=[];
  function brazier(x,z){cyl(x,.55,z,.15,.22,1.1,stoneDark);cyl(x,1.15,z,.55,.3,.3,iron);let f=cone(x,1.65,z,.32,.9,new THREE.MeshBasicMaterial({color:0xff9a3e}));flames.push(f);let light=new THREE.PointLight(0xffa64c,18,8);light.position.set(x,1.7,z);scene.add(light);}
  brazier(-4.3,6);brazier(4.3,6);brazier(-4,-24);brazier(4,-24);
  // Altar and the last ember.
  box(0,.35,-25,3.1,.7,2.1,stoneDark);box(0,.78,-25,2.6,.18,1.7,stoneLight);cyl(0,1.2,-25,.32,.45,.75,gold);let crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.55),new THREE.MeshStandardMaterial({color:0xffbe61,emissive:0xc9601d,emissiveIntensity:1.6,roughness:.3}));crystal.position.set(0,1.95,-25);scene.add(crystal);let altarLight=new THREE.PointLight(0xffa33b,35,10);altarLight.position.set(0,2,-25);scene.add(altarLight);
  function enemy(x,z,index){let g=new THREE.Group();g.position.set(x,0,z);scene.add(g);let armor= index===2 ? mat(0x51443b):iron;
    // boots, legs, armored torso, skull and horned helm
    box(-.23,.25,0,.32,.5,.5,darkWood,0,g);box(.23,.25,0,.32,.5,.5,darkWood,0,g);
    box(-.23,.72,0,.3,.58,.32,armor,0,g);box(.23,.72,0,.3,.58,.32,armor,0,g);
    box(0,1.27,0,.85,.85,.48,armor,0,g);box(0,1.08,-.27,.68,.5,.05,cloth,0,g);box(0,1.48,-.27,.08,.44,.04,gold,0,g);
    sphere(0,1.99,0,.31,bone,g);box(0,2.13,0,.65,.3,.55,iron,0,g);cone(-.34,2.35,0,.12,.48,bone,g);cone(.34,2.35,0,.12,.48,bone,g);
    const eyeMat=new THREE.MeshBasicMaterial({color:0xffa54a});sphere(-.12,2,-.28,.045,eyeMat,g);sphere(.12,2,-.28,.045,eyeMat,g);
    box(-.55,1.4,0,.3,.72,.3,armor,.15,g);box(.55,1.4,0,.3,.72,.3,armor,-.15,g);
    box(-.67,.88,-.15,.12,1.05,.12,wood,0,g);box(-.67,.4,-.15,.45,.12,.35,iron,0,g);
    box(.65,1.15,-.06,.12,1.1,.12,wood,0,g);box(.65,.55,-.06,.4,.12,.12,gold,0,g);box(.65,.06,-.06,.18,1,.08,stoneLight,0,g);
    return {group:g, x,z, hp:index===2?24:18,maxHp:index===2?24:18,ac:index===2?14:12,name:index===2?'The Hollow Knight':'Ashen Sentinel',alive:true,attackTimer:1+index*.5,phase:rand()*6};
  }
  const enemies=[enemy(-1,-3,0),enemy(2,-13,1),enemy(0,-21,2)];
  // Bake static scenery into one mesh per material, keeping the moving pieces separate.
  // This dramatically reduces draw calls on integrated graphics and software renderers.
  scene.updateMatrixWorld(true);
  const batches=new Map(), remove=[];
  scene.traverse(obj=>{
    if(!obj.isMesh || obj===crystal || flames.includes(obj)) return;
    let p=obj; while(p){if(enemies.some(e=>e.group===p))return;p=p.parent;}
    if(!batches.has(obj.material)) batches.set(obj.material,[]);
    batches.get(obj.material).push(obj.geometry.clone().applyMatrix4(obj.matrixWorld));
    remove.push(obj);
  });
  remove.forEach(obj=>obj.parent.remove(obj));
  for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);if(merged)scene.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose());}
  return {scene,enemies,crystal,flames,altar:{x:0,z:-25},sun};
}

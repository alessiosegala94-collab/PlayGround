import * as THREE from 'three';
import { createWorld } from './world.js';

const $ = id => document.getElementById(id);
const world = createWorld();
const renderer = new THREE.WebGLRenderer({canvas:$('game'), antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(65,window.innerWidth/window.innerHeight,.1,180);
camera.position.set(0,1.7,12);
world.scene.add(camera);
// A sword held in the foreground makes the view unmistakably first person.
const weapon = new THREE.Group(); camera.add(weapon); weapon.position.set(.66,-.55,-1.2); weapon.rotation.set(-.12,-.2,-.12);
const metal=new THREE.MeshStandardMaterial({color:0xb8b8ac,metalness:.7,roughness:.35});
const edge=new THREE.MeshStandardMaterial({color:0xd9d8c8,metalness:.65,roughness:.3});
const brass=new THREE.MeshStandardMaterial({color:0x9b7840,metalness:.65,roughness:.4});
const leather=new THREE.MeshStandardMaterial({color:0x503b2b,roughness:1});
function piece(geo,material,x,y,z){let m=new THREE.Mesh(geo,material);m.position.set(x,y,z);weapon.add(m);return m;}
piece(new THREE.BoxGeometry(.08,.35,.08),leather,0,-.33,0);
piece(new THREE.SphereGeometry(.07,8,6),brass,0,-.52,0);
piece(new THREE.BoxGeometry(.4,.075,.09),brass,0,-.14,0);
piece(new THREE.BoxGeometry(.13,.74,.055),metal,0,.26,0);
let tip=piece(new THREE.ConeGeometry(.092,.24,4),edge,0,.75,0);tip.rotation.y=Math.PI/4;
piece(new THREE.BoxGeometry(.018,.68,.01),edge,0,.27,-.031);
const weaponLight=new THREE.PointLight(0xffe7c1,2,4);weaponLight.position.set(.5,.2,0);camera.add(weaponLight);

let state={started:false,over:false,hp:36,maxHp:36,xp:0,level:1,potions:3,spells:3,kills:0,yaw:0,pitch:0,attackCooldown:0,spellCooldown:0,swing:0,step:0};
let keys={}; let toastTimer; const clock=new THREE.Clock();
const roll = n => 1+Math.floor(Math.random()*n);
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2600)}
function log(text){const line=document.createElement('div');line.textContent=text;$('combat-log').prepend(line);while($('combat-log').children.length>4)$('combat-log').lastChild.remove();}
function updateHUD(){
 $('health-fill').style.width=`${Math.max(0,state.hp/state.maxHp*100)}%`; $('health-text').textContent=`${Math.max(0,state.hp)} / ${state.maxHp}`;
 $('xp-fill').style.width=`${state.xp%100}%`; $('level-text').textContent=state.level;
 $('potion-count').textContent=state.potions; $('spell-count').textContent=state.spells;
 $('objective').textContent=state.kills<3?'Silence the sentinels':'Rekindle the Ember';
 $('objective-detail').textContent=state.kills<3?`Defeat the guardians  ·  ${state.kills} / 3`:'Approach the altar and press E';
}
function start(){if(state.over)return; state.started=true;$('start-screen').classList.add('hidden');$('game').requestPointerLock?.();toast('The vale is yours to explore.');}
$('start-button').addEventListener('click',start);
$('restart-button').addEventListener('click',()=>location.reload());
$('game').addEventListener('click',()=>{if(!state.started||state.over)return;if(document.pointerLockElement!==$('game')){$('game').requestPointerLock?.();return} attack();});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===$('game')&&state.started&&!state.over){state.yaw-=e.movementX*.0022;state.pitch=Math.max(-1.1,Math.min(1.1,state.pitch-e.movementY*.002));}});
document.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.repeat)return;keys[e.code]=true;if(!state.started||state.over)return;if(e.code==='KeyE')interact();if(e.code==='KeyQ')potion();if(e.code==='KeyF')cast();if(e.code==='Space')attack();});
document.addEventListener('keyup',e=>keys[e.code]=false);
window.addEventListener('blur',()=>keys={});
function target(maxDist,threshold=.55){const dir=new THREE.Vector3(-Math.sin(state.yaw),0,-Math.cos(state.yaw));let best=null,bestDist=maxDist;for(const e of world.enemies){if(!e.alive)continue;const dx=e.group.position.x-camera.position.x,dz=e.group.position.z-camera.position.z,dist=Math.hypot(dx,dz);const dot=(dx*dir.x+dz*dir.z)/dist;if(dist<bestDist&&dot>threshold){best=e;bestDist=dist;}}return best;}
function hurtEnemy(e,damage){e.hp-=damage;e.group.userData.flash=.15;if(e.hp<=0){e.hp=0;e.alive=false;state.kills++;state.xp+=50;log(`${e.name} falls. +50 XP`);toast(`${e.name} defeated  ·  +50 XP`);if(state.xp>=state.level*100){state.level++;state.maxHp+=8;state.hp=Math.min(state.maxHp,state.hp+8);log('Level up! +8 maximum HP.');toast('Level up! Your strength grows.');}if(state.kills===3)toast('The way is clear. Rekindle the Ember.');}updateHUD();}
function attack(){if(state.attackCooldown>0)return;state.attackCooldown=.65;state.swing=1;let e=target(3,.45);if(!e){log('Your blade cuts through empty air.');return}const d=roll(20),total=d+5;if(d===1||(d!==20&&total<e.ac)){log(`Attack: d20 (${d}) + 5 = ${total} vs AC ${e.ac}. Miss.`);toast('Attack missed');}else{let damage=roll(8)+3;if(d===20)damage*=2;hurtEnemy(e,damage);log(`Attack: ${total} vs AC ${e.ac} · ${damage} damage${d===20?' · CRITICAL!':''}`);}}
function cast(){if(state.spellCooldown>0)return;if(state.spells<=0){toast('No spell charges remain');return}let e=target(14,.72);if(!e){toast('Aim at a guardian to cast');return}state.spells--;state.spellCooldown=1;let damage=roll(4)+roll(4)+2;hurtEnemy(e,damage);log(`Magic missile strikes for ${damage} force damage.`);toast(`Magic missile  ·  ${damage} damage`);updateHUD();}
function potion(){if(state.potions<=0){toast('No potions remain');return}if(state.hp===state.maxHp){toast('Your health is already full');return}state.potions--;let heal=roll(8)+roll(8)+2;state.hp=Math.min(state.maxHp,state.hp+heal);log(`Potion restores ${heal} HP.`);toast(`Potion used  ·  +${heal} HP`);updateHUD();}
function interact(){let dist=Math.hypot(camera.position.x-world.altar.x,camera.position.z-world.altar.z);if(dist<3.3){if(state.kills<3){toast('The guardians bind the Ember. Defeat them first.');return}end(true);}else toast('There is nothing to interact with here.');}
function end(win){state.over=true;document.exitPointerLock?.();$('game-over-title').textContent=win?'The Ember burns again':'Your journey ends';$('game-over-message').textContent=win?'The darkness recedes from Ashen Vale. Your name will be remembered.':'The vale has claimed another wanderer. Rise, and try again.';$('game-over').classList.add('visible');}
function enemyAttack(e){let d=roll(20),total=d+3;if(d===1||(d!==20&&total<15)){log(`${e.name}: ${total} vs your AC 15. Miss.`);}else{let damage=roll(6)+1;if(d===20)damage*=2;state.hp-=damage;log(`${e.name} hits you for ${damage} damage.`);toast(`−${damage} HP`);updateHUD();if(state.hp<=0)end(false);}}
function update(dt,time){
 if(state.started&&!state.over){
  if(keys.ArrowLeft)state.yaw+=dt*1.7;if(keys.ArrowRight)state.yaw-=dt*1.7;if(keys.ArrowUp)state.pitch=Math.min(1.1,state.pitch+dt);if(keys.ArrowDown)state.pitch=Math.max(-1.1,state.pitch-dt);
  let forward=(keys.KeyW?1:0)-(keys.KeyS?1:0),side=(keys.KeyD?1:0)-(keys.KeyA?1:0);let length=Math.hypot(forward,side);if(length){forward/=length;side/=length;let speed=4.2*dt;camera.position.x+=(-Math.sin(state.yaw)*forward+Math.cos(state.yaw)*side)*speed;camera.position.z+=(-Math.cos(state.yaw)*forward-Math.sin(state.yaw)*side)*speed;camera.position.x=THREE.MathUtils.clamp(camera.position.x,-32,32);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-27,20);state.step+=dt*9;camera.position.y=1.7+Math.sin(state.step)*.035;}else camera.position.y=THREE.MathUtils.lerp(camera.position.y,1.7,.1);
  state.attackCooldown=Math.max(0,state.attackCooldown-dt);state.spellCooldown=Math.max(0,state.spellCooldown-dt);state.swing=Math.max(0,state.swing-dt*3);
  for(const e of world.enemies){if(!e.alive){e.group.rotation.z=THREE.MathUtils.lerp(e.group.rotation.z,Math.PI/2,.08);e.group.position.y=THREE.MathUtils.lerp(e.group.position.y,-.8,.08);continue}let dx=camera.position.x-e.group.position.x,dz=camera.position.z-e.group.position.z,dist=Math.hypot(dx,dz);e.group.rotation.y=Math.atan2(-dx,-dz);e.group.position.y=Math.sin(time*3+e.phase)*.025;if(dist<9&&dist>1.8){e.group.position.x+=dx/dist*dt*1.1;e.group.position.z+=dz/dist*dt*1.1;}e.attackTimer-=dt;if(dist<2.1&&e.attackTimer<=0){enemyAttack(e);e.attackTimer=1.7;}}
 }
 camera.rotation.order='YXZ';camera.rotation.y=state.yaw;camera.rotation.x=state.pitch;
 weapon.rotation.z=-.12-Math.sin(state.swing*Math.PI)*1.1;weapon.rotation.x=-.12-Math.sin(state.swing*Math.PI)*.7;weapon.position.y=-.55+(state.started?Math.sin(state.step)*.015:0);
 world.crystal.rotation.y+=dt*.7;world.crystal.position.y=1.95+Math.sin(time*2)*.12;world.flames.forEach((f,i)=>{f.scale.y=.8+Math.sin(time*9+i)*.15;f.rotation.y+=dt;});
 let e=target(14,.8);$('enemy-panel').classList.toggle('visible',!!e&&state.started&&!state.over);if(e){$('enemy-name').textContent=e.name;$('enemy-health-fill').style.width=`${e.hp/e.maxHp*100}%`;$('enemy-health-text').textContent=`${e.hp} / ${e.maxHp}`;}
 const near=Math.hypot(camera.position.x-world.altar.x,camera.position.z-world.altar.z)<3.3;$('interaction').classList.toggle('visible',near&&state.started&&!state.over);if(near)$('interaction').innerHTML=state.kills===3?'<b>E</b> Rekindle the Ember':'<b>E</b> Examine the altar';
}
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05);update(dt,clock.elapsedTime);renderer.render(world.scene,camera);}updateHUD();log('Entered Ashen Vale.');animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

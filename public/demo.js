import { Engine, RENDER_MODE, Transform, Sprite, Velocity } from '../src/index.js';
import * as THREE from 'three';

const app=document.querySelector('#app');
const status=document.querySelector('#status');
const buttons={'2d':document.querySelector('#btn-2d'),'3d':document.querySelector('#btn-3d')};
let engine=null;
function boot(mode) {
  engine?.dispose();app.replaceChildren();
  engine=new Engine({mode});engine.init(app);
  if(mode===RENDER_MODE.MODE_3D) {
    for(let i=0;i<9;i++) {
      const id=engine.world.createEntity();
      engine.world.addComponent(id,new Transform((i%3-1)*2.4,Math.floor(i/3)*2.1-1.8,0));
      const material=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(0.68+i*0.035,0.72,0.58),metalness:0.25,roughness:0.38});
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);
      mesh.castShadow=true;mesh.receiveShadow=true;engine.renderer.attachObject(id,mesh);
    }
    engine.world.addSystem({priority:50,update(dt,world){
      for(const id of world.query('Transform')) {
        const transform=world.getComponent(id,'Transform');
        transform.ry+=dt*0.65;transform.rx+=dt*0.22;
      }
    }});
  } else {
    for(let i=0;i<12;i++) {
      const id=engine.world.createEntity();
      engine.world.addComponent(id,new Transform((i-6)*52,Math.sin(i)*90));
      engine.world.addComponent(id,new Velocity(18+i*3,0,0));
      const sprite=new Sprite();sprite.color=`hsl(${180+i*12} 75% 62%)`;
      sprite.width=30;sprite.height=30;engine.world.addComponent(id,sprite);
    }
    engine.world.addSystem({priority:20,update(_dt,world){
      for(const id of world.query('Transform')) {
        const transform=world.getComponent(id,'Transform');
        if(transform.x>app.clientWidth/2+40)transform.x=-app.clientWidth/2-40;
      }
    }});
  }
  engine.start();status.textContent=`RUNNING · ${mode.toUpperCase()}`;
  for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));
  window.__tcsEngine=engine;
}
buttons['2d'].addEventListener('click',()=>boot(RENDER_MODE.MODE_2D));
buttons['3d'].addEventListener('click',()=>boot(RENDER_MODE.MODE_3D));
window.addEventListener('pagehide',()=>engine?.dispose(),{once:true});
boot(RENDER_MODE.MODE_3D);

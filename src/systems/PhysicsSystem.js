import { System } from '../ecs/System.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../constants.js';
import { aabbOverlap } from '../utils/math.js';
export class PhysicsSystem extends System {
  constructor(options={}) {
    super(); this.priority=10; this.gravity=options.gravity??-9.8;
    this.useGravity=options.useGravity??false; this._collisions=new Set();
  }
  update(dt,world) {
    for(const id of world.query('Transform')) {
      const transform=world.getComponent(id,'Transform'),velocity=world.getComponent(id,'Velocity');
      if(!velocity)continue;
      if(this.useGravity)velocity.y+=this.gravity*dt;
      transform.x+=velocity.x*dt;transform.y+=velocity.y*dt;transform.z+=velocity.z*dt;
    }
    const ids=world.query('Transform','Collider'),current=new Set();
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++) {
      const aId=ids[i],bId=ids[j],aT=world.getComponent(aId,'Transform'),bT=world.getComponent(bId,'Transform');
      const aC=world.getComponent(aId,'Collider'),bC=world.getComponent(bId,'Collider');
      if(!aC.enabled||!bC.enabled)continue;
      const a={x:aT.x-aC.w/2,y:aT.y-aC.h/2,w:aC.w,h:aC.h};
      const b={x:bT.x-bC.w/2,y:bT.y-bC.h/2,w:bC.w,h:bC.h};
      if(aabbOverlap(a,b)) {
        const key=aId<bId?`${aId}:${bId}`:`${bId}:${aId}`;current.add(key);
        if(!this._collisions.has(key))eventBus.emit(EVENTS.ENTITY_COLLIDED,{a:aId,b:bId,isTrigger:aC.isTrigger||bC.isTrigger});
      }
    }
    this._collisions=current;
  }
}

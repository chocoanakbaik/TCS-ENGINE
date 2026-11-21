import { createEntityId } from './Entity.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../constants.js';
export class World {
  constructor() { this.entities=new Map(); this.components=new Map(); this.systems=[]; }
  createEntity() {
    const id=createEntityId();
    this.entities.set(id,{id,components:new Map(),alive:true});
    eventBus.emit(EVENTS.ENTITY_CREATED,{id}); return id;
  }
  destroyEntity(id) {
    const entity=this.entities.get(id); if (!entity) return false;
    entity.alive=false;
    for (const type of entity.components.keys()) this.components.get(type)?.delete(id);
    this.entities.delete(id); eventBus.emit(EVENTS.ENTITY_DESTROYED,{id}); return true;
  }
  addComponent(entityId,component) {
    const entity=this.entities.get(entityId);
    if (!entity || !component || typeof component!=='object') throw new Error('Cannot add a component to a missing entity.');
    const type=component.constructor.type?.() ?? component.constructor.name;
    entity.components.set(type,component);
    if (!this.components.has(type)) this.components.set(type,new Map());
    this.components.get(type).set(entityId,component);
    return component;
  }
  getComponent(entityId,typeOrClass) {
    const type=typeof typeOrClass==='string'?typeOrClass:(typeOrClass?.type?.()??typeOrClass?.name);
    return this.entities.get(entityId)?.components.get(type) ?? null;
  }
  removeComponent(entityId,typeOrClass) {
    const entity=this.entities.get(entityId); if (!entity) return false;
    const type=typeof typeOrClass==='string'?typeOrClass:(typeOrClass?.type?.()??typeOrClass?.name);
    const removed=entity.components.delete(type);
    this.components.get(type)?.delete(entityId);
    return removed;
  }
  hasComponent(entityId,typeOrClass) {
    const type=typeof typeOrClass==='string'?typeOrClass:(typeOrClass?.type?.()??typeOrClass?.name);
    return this.entities.get(entityId)?.components.has(type) ?? false;
  }
  query(...types) {
    if (!types.length) return [...this.entities.keys()];
    const [first,...rest]=types.map(t=>typeof t==='string'?t:(t?.type?.()??t?.name));
    const bucket=this.components.get(first); if (!bucket) return [];
    const result=[];
    for (const id of bucket.keys()) {
      const entity=this.entities.get(id);
      if (entity?.alive && rest.every(type=>entity.components.has(type))) result.push(id);
    }
    return result;
  }
  addSystem(system) {
    if (!system || typeof system.update!=='function') throw new TypeError('A system must implement update(deltaTime, world).');
    this.systems.push(system); this.systems.sort((a,b)=>(a.priority??0)-(b.priority??0)); return system;
  }
  removeSystem(system) {
    const index=this.systems.indexOf(system); if (index<0) return false;
    this.systems.splice(index,1); return true;
  }
  update(deltaTime) {
    for (const system of [...this.systems]) {
      if (system.enabled===false) continue;
      try { system.update(deltaTime,this); }
      catch (error) { console.error(`[TCS Engine] System ${system.constructor.name} failed:`,error); }
    }
  }
  clear() { this.entities.clear(); this.components.clear(); this.systems.length=0; }
}

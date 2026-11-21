import eventBus from './EventBus.js';
import { EVENTS } from '../constants.js';
export class SceneManager {
  constructor() { this.scenes=new Map(); this.currentName=null; this.current=null; }
  register(name,scene) {
    if (!name || !scene || typeof scene!=='object') throw new TypeError('register(name, scene) requires a name and scene object.');
    this.scenes.set(name,scene); return this;
  }
  unregister(name) { if (name===this.currentName) this.unload(); return this.scenes.delete(name); }
  load(name,params={}) {
    if (!this.scenes.has(name)) throw new Error(`Scene "${name}" is not registered.`);
    const next=this.scenes.get(name); if (next===this.current) return next;
    const previous=this.current; previous?.unload?.();
    this.current=next; this.currentName=name;
    try { next.load?.(params); }
    catch (error) { this.current=null; this.currentName=null; throw error; }
    eventBus.emit(EVENTS.SCENE_CHANGED,{name,params,previous:previous??null}); return next;
  }
  update(deltaTime) { this.current?.update?.(deltaTime); }
  unload() { this.current?.unload?.(); this.current=null; this.currentName=null; }
}

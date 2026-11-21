import eventBus from '../core/EventBus.js';
import { EVENTS } from '../constants.js';
export class InputSystem {
  constructor(target=globalThis.window) {
    if (!target?.addEventListener) throw new Error('InputSystem requires an EventTarget such as window.');
    this.target=target; this.keys=Object.create(null);
    this.mouse={x:0,y:0,left:false,middle:false,right:false};
    this.touches=new Map(); this._listeners=[];
    this._listen('keydown',e=>{const key=e.key.toLowerCase();this.keys[key]=true;eventBus.emit(EVENTS.INPUT_KEY_DOWN,{key,originalEvent:e});});
    this._listen('keyup',e=>{const key=e.key.toLowerCase();this.keys[key]=false;eventBus.emit(EVENTS.INPUT_KEY_UP,{key,originalEvent:e});});
    this._listen('mousedown',e=>{
      if(e.button===0)this.mouse.left=true; if(e.button===1)this.mouse.middle=true; if(e.button===2)this.mouse.right=true;
      eventBus.emit(EVENTS.INPUT_MOUSE_DOWN,{button:e.button,x:e.clientX,y:e.clientY,originalEvent:e});
    });
    this._listen('mouseup',e=>{
      if(e.button===0)this.mouse.left=false; if(e.button===1)this.mouse.middle=false; if(e.button===2)this.mouse.right=false;
      eventBus.emit(EVENTS.INPUT_MOUSE_UP,{button:e.button,x:e.clientX,y:e.clientY,originalEvent:e});
    });
    this._listen('mousemove',e=>{
      this.mouse.x=e.clientX; this.mouse.y=e.clientY;
      eventBus.emit(EVENTS.INPUT_MOUSE_MOVE,{x:e.clientX,y:e.clientY,dx:e.movementX??0,dy:e.movementY??0,originalEvent:e});
    });
    this._listen('contextmenu',e=>e.preventDefault());
    this._listen('touchstart',e=>{for(const touch of e.changedTouches){this.touches.set(touch.identifier,{x:touch.clientX,y:touch.clientY});eventBus.emit(EVENTS.INPUT_TOUCH_START,{id:touch.identifier,x:touch.clientX,y:touch.clientY,originalEvent:e});}});
    this._listen('touchmove',e=>{for(const touch of e.changedTouches){this.touches.set(touch.identifier,{x:touch.clientX,y:touch.clientY});eventBus.emit(EVENTS.INPUT_TOUCH_MOVE,{id:touch.identifier,x:touch.clientX,y:touch.clientY,originalEvent:e});}});
    this._listen('touchend',e=>{for(const touch of e.changedTouches){this.touches.delete(touch.identifier);eventBus.emit(EVENTS.INPUT_TOUCH_END,{id:touch.identifier,x:touch.clientX,y:touch.clientY,originalEvent:e});}});
    this._listen('touchcancel',e=>{for(const touch of e.changedTouches)this.touches.delete(touch.identifier);});
  }
  _listen(type,handler) { this.target.addEventListener(type,handler,{passive:type.startsWith('touch')?true:false}); this._listeners.push([type,handler]); }
  isKeyDown(key) { return !!this.keys[String(key).toLowerCase()]; }
  isMouseDown(button='left') { return !!this.mouse[button]; }
  dispose() {
    for(const [type,handler] of this._listeners)this.target.removeEventListener(type,handler);
    this._listeners.length=0; this.keys=Object.create(null); this.touches.clear();
    this.mouse.left=this.mouse.middle=this.mouse.right=false;
  }
}

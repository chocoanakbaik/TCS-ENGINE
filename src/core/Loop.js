import { MAX_DELTA, EVENTS } from '../constants.js';
import eventBus from './EventBus.js';
export class Loop {
  constructor() {
    this.running=false; this.paused=false; this.lastTime=0; this.deltaTime=0;
    this.elapsed=0; this.fps=0; this._fpsAccum=0; this._fpsFrames=0;
    this._rafId=null; this._callback=null; this._boundTick=this._tick.bind(this);
  }
  start(callback) {
    if (this.running) return;
    if (typeof callback !== 'function') throw new TypeError('Loop.start(callback) requires a function.');
    if (typeof requestAnimationFrame !== 'function') throw new Error('requestAnimationFrame is unavailable.');
    this._callback=callback; this.running=true; this.paused=false;
    this.lastTime=performance.now(); this._rafId=requestAnimationFrame(this._boundTick);
    eventBus.emit(EVENTS.ENGINE_STARTED);
  }
  stop() {
    if (!this.running) return;
    this.running=false;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId=null; eventBus.emit(EVENTS.ENGINE_STOPPED);
  }
  pause() { if (!this.running || this.paused) return; this.paused=true; eventBus.emit(EVENTS.ENGINE_PAUSED); }
  resume() { if (!this.running || !this.paused) return; this.paused=false; this.lastTime=performance.now(); eventBus.emit(EVENTS.ENGINE_RESUMED); }
  _tick(now) {
    if (!this.running) return;
    const rawDelta=Math.max(0,(now-this.lastTime)/1000);
    this.deltaTime=Math.min(rawDelta,MAX_DELTA); this.lastTime=now;
    if (!this.paused) {
      this.elapsed+=this.deltaTime; this._fpsAccum+=rawDelta; this._fpsFrames++;
      if (this._fpsAccum>=0.5) { this.fps=Math.round(this._fpsFrames/this._fpsAccum); this._fpsAccum=0; this._fpsFrames=0; }
      this._callback?.(this.deltaTime,this.elapsed);
    }
    this._rafId=requestAnimationFrame(this._boundTick);
  }
}

import eventBus from './EventBus.js';
import { Loop } from './Loop.js';
import { SceneManager } from './SceneManager.js';
import { World } from '../ecs/World.js';
import { InputSystem } from '../systems/InputSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { Renderer2D } from '../rendering/Renderer2D.js';
import { Renderer3D } from '../rendering/Renderer3D.js';
import { AssetLoader } from '../assets/AssetLoader.js';
import { UIManager } from '../ui/UIManager.js';
import { RENDER_MODE, TCS_VERSION } from '../constants.js';

export class Engine {
  constructor(config={}) {
    this.config={mode:RENDER_MODE.MODE_3D,gravity:false,autoStart:false,inputTarget:globalThis.window,rendererOptions:{},...config};
    if(!Object.values(RENDER_MODE).includes(this.config.mode))throw new Error(`Unsupported render mode: ${this.config.mode}`);
    this.loop=new Loop();this.scenes=new SceneManager();this.world=new World();
    this.input=null;this.audio=null;this.renderer=null;this.assets=new AssetLoader();this.ui=null;
    this.container=null;this.initialized=false;this._disposed=false;
  }
  init(containerElement) {
    if(this.initialized)return this;
    if(typeof document==='undefined')throw new Error('TCS Engine requires a browser DOM.');
    this.container=containerElement??document.body;
    if(!this.container?.appendChild)throw new TypeError('Engine.init(container) requires a DOM element.');
    try {
      this.audio=new AudioSystem();this.audio.init();
      this.input=new InputSystem(this.config.inputTarget??window);
      this.renderer=this.config.mode===RENDER_MODE.MODE_3D
        ?new Renderer3D(this.container,this.config.rendererOptions??{}):new Renderer2D(this.container);
      this.ui=new UIManager(this.container);
      this.physics=new PhysicsSystem({useGravity:!!this.config.gravity});
      this.world.addSystem(this.physics);
      this.world.addSystem(new RenderSystem(this.renderer));
      this.initialized=true;this._disposed=false;
      console.info(`[TCS Engine v${TCS_VERSION}] Initialized (${this.config.mode}).`);
      if(this.config.autoStart)this.start();
      return this;
    } catch(error) {
      this.input?.dispose();this.audio?.dispose();this.renderer?.dispose();this.ui?.dispose();
      this.input=this.audio=this.renderer=this.ui=null;
      throw error;
    }
  }
  start() {
    if(!this.initialized)throw new Error('Engine is not initialized. Call init() first.');
    this.loop.start((deltaTime,elapsed)=>this._tick(deltaTime,elapsed));return this;
  }
  stop() { this.loop.stop();return this; }
  pause() { this.loop.pause();return this; }
  resume() { this.loop.resume();return this; }
  _tick(deltaTime,elapsed) {
    this.scenes.update(deltaTime);
    this.world.update(deltaTime);
    eventBus.emit('engine:tick',{dt:deltaTime,elapsed,engine:this});
  }
  dispose() {
    if(this._disposed)return;
    this.loop.stop();this.scenes.unload();this.input?.dispose();this.audio?.dispose();
    this.renderer?.dispose();this.ui?.dispose();this.world.clear();this.assets.clear();
    this.input=this.audio=this.renderer=this.ui=null;
    this.initialized=false;this._disposed=true;
  }
}

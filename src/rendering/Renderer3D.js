import * as THREE from 'three';
import { Camera } from './Camera.js';
export class Renderer3D {
  constructor(container) {
    if(!container?.appendChild)throw new TypeError('Renderer3D requires a DOM container.');
    this.container=container;this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.domElement.style.display='block';this.renderer.domElement.style.width='100%';this.renderer.domElement.style.height='100%';
    container.appendChild(this.renderer.domElement);
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x0a0a0a);
    this.scene.fog=new THREE.Fog(0x0a0a0a,20,150);
    this.camera=new THREE.PerspectiveCamera(75,1,0.1,1000);
    this.camera.position.set(0,5,10);
    this.scene.add(new THREE.AmbientLight(0xffffff,0.5));
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x222222,0.6));
    const sun=new THREE.DirectionalLight(0xffffff,1.2);
    sun.position.set(20,30,15);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);this.scene.add(sun);
    this.objectMap=new Map();this._disposed=false;
    this._resize=this._resize.bind(this);window.addEventListener('resize',this._resize);
    if(typeof ResizeObserver!=='undefined') {
      this._resizeObserver=new ResizeObserver(this._resize);this._resizeObserver.observe(container);
    }
    this._resize();
  }
  _resize() {
    if(this._disposed)return;
    const width=Math.max(1,this.container.clientWidth||window.innerWidth);
    const height=Math.max(1,this.container.clientHeight||window.innerHeight);
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
    this.renderer.setSize(width,height,false);
  }
  attachObject(entityId,object3d) {
    if(!object3d?.isObject3D)throw new TypeError('attachObject expects a Three.js Object3D.');
    this.detachObject(entityId);this.scene.add(object3d);this.objectMap.set(entityId,object3d);return object3d;
  }
  detachObject(entityId) {
    const object=this.objectMap.get(entityId);if(!object)return false;
    this.scene.remove(object);this.objectMap.delete(entityId);return true;
  }
  render(world) {
    for(const [entityId,object] of this.objectMap) {
      const transform=world.getComponent(entityId,'Transform');
      if(!transform){this.detachObject(entityId);continue;}
      object.position.set(transform.x,transform.y,transform.z);
      object.rotation.set(transform.rx??0,transform.ry??0,transform.rz??0);
    }
    this.renderer.render(this.scene,this.camera);
  }
  dispose() {
    if(this._disposed)return;this._disposed=true;
    window.removeEventListener('resize',this._resize);this._resizeObserver?.disconnect();
    this.objectMap.clear();this.renderer.dispose();this.renderer.domElement.remove();
  }
}
import * as THREE from 'three';
import { Camera } from './Camera.js';

const QUALITY = {
  low: { pixelRatio: 0.85, antialias: false, shadows: false, shadowSize: 512, fogFar: 105 },
  medium: { pixelRatio: 1, antialias: false, shadows: false, shadowSize: 512, fogFar: 145 },
  high: { pixelRatio: 1.35, antialias: true, shadows: true, shadowSize: 1024, fogFar: 190 }
};

export class Renderer3D {
  constructor(container, options = {}) {
    if (!container?.appendChild) throw new TypeError('Renderer3D requires a DOM container.');
    this.container = container;
    this.options = { quality: 'low', background: 0x071014, fogColor: 0x0b171a, ...options };
    this.quality = QUALITY[this.options.quality] ? this.options.quality : 'low';
    const profile = QUALITY[this.quality];
    this.renderer = new THREE.WebGLRenderer({
      antialias: profile.antialias,
      alpha: false,
      powerPreference: 'low-power',
      stencil: false,
      depth: true
    });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, profile.pixelRatio));
    this.renderer.setSize(Math.max(1, container.clientWidth || innerWidth), Math.max(1, container.clientHeight || innerHeight), false);
    this.renderer.shadowMap.enabled = profile.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.className = 'tcs-engine-canvas';
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;';
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.background);
    this.scene.fog = new THREE.Fog(this.options.fogColor, 12, profile.fogFar);
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.08, 240);
    this.camera.position.set(0, 1.68, 0);
    this.camera.rotation.order = 'YXZ';
    this.cameraHelper = new Camera({ fov: 74, near: 0.08, far: 240 });

    this.scene.add(new THREE.HemisphereLight(0x9bb3bf, 0x17211d, 0.48));
    this.scene.add(new THREE.AmbientLight(0x34434a, 0.24));
    this.objectMap = new Map();
    this._disposed = false;
    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(this._resize);
      this._resizeObserver.observe(container);
    }
    this._resize();
  }

  setQuality(name) {
    if (!QUALITY[name] || name === this.quality) return false;
    this.quality = name;
    const profile = QUALITY[name];
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, profile.pixelRatio));
    this.renderer.shadowMap.enabled = profile.shadows;
    this.scene.fog.far = profile.fogFar;
    this._resize();
    return true;
  }

  _resize() {
    if (this._disposed) return;
    const width = Math.max(1, this.container.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  attachObject(entityId, object3d) {
    if (!object3d?.isObject3D) throw new TypeError('attachObject expects a Three.js Object3D.');
    this.detachObject(entityId);
    this.scene.add(object3d);
    this.objectMap.set(entityId, object3d);
    return object3d;
  }

  detachObject(entityId) {
    const object = this.objectMap.get(entityId);
    if (!object) return false;
    this.scene.remove(object);
    this.objectMap.delete(entityId);
    return true;
  }

  render(world) {
    for (const [entityId, object] of this.objectMap) {
      const transform = world.getComponent(entityId, 'Transform');
      if (!transform) { this.detachObject(entityId); continue; }
      object.position.set(transform.x, transform.y, transform.z);
      object.rotation.set(transform.rx ?? 0, transform.ry ?? 0, transform.rz ?? 0);
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    window.removeEventListener('resize', this._resize);
    this._resizeObserver?.disconnect();
    this.objectMap.clear();
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      for (const material of list) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

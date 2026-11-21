import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import eventBus from '../core/EventBus.js';
import { EVENTS } from '../constants.js';

export class AssetLoader {
  constructor() { this.cache = new Map(); this.pending = 0; this.loaded = 0; this.failed = 0; }
  loadImage(key, url) {
    return this._load('image', key, () => new Promise((resolve, reject) => {
      const image = new Image(); image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      image.src = url;
    }));
  }
  loadAudio(key, url) {
    return this._load('audio', key, async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Audio request failed: ${response.status} ${url}`);
      return response.arrayBuffer();
    });
  }
  loadJSON(key, url) {
    return this._load('json', key, async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`JSON request failed: ${response.status} ${url}`);
      return response.json();
    });
  }
  loadGLTF(key, url, options = {}) {
    return this._load('gltf', key, () => new Promise((resolve, reject) => {
      const loader = options.loader ?? new GLTFLoader();
      loader.load(url, resolve, progress => eventBus.emit(EVENTS.ASSET_PROGRESS, { key, type: 'gltf', loaded: progress.loaded, total: progress.total || 0 }), reject);
    }));
  }
  async _load(type, key, loader) {
    if (this.cache.has(key)) return this.cache.get(key).asset;
    this.pending++;
    eventBus.emit(EVENTS.ASSET_PROGRESS, { key, type, loaded: this.loaded, total: this.pending + this.loaded + this.failed });
    try {
      const asset = await loader(); this.cache.set(key, { type, asset }); this.loaded++;
      eventBus.emit(EVENTS.ASSET_LOADED, { key, type, asset }); return asset;
    } catch (error) {
      this.failed++; eventBus.emit(EVENTS.ASSET_ERROR, { key, type, error }); throw error;
    } finally {
      this.pending = Math.max(0, this.pending - 1);
      eventBus.emit(EVENTS.ASSET_PROGRESS, { key, type, loaded: this.loaded, total: this.loaded + this.pending + this.failed });
    }
  }
  get(key) { return this.cache.get(key)?.asset ?? null; }
  has(key) { return this.cache.has(key); }
  remove(key) { return this.cache.delete(key); }
  clear() { this.cache.clear(); this.loaded = 0; this.pending = 0; this.failed = 0; }
}

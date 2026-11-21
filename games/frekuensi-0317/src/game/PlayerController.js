import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement, colliders, settings, audio) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.settings = settings;
    this.audio = audio;
    this.position = new THREE.Vector3(0, 1.68, 10.9);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.locked = false;
    this.hidden = false;
    this.flashlightOn = true;
    this.battery = 100;
    this.noiseLevel = 0;
    this.stepTimer = 0;
    this.walkDistance = 0;
    this.radius = 0.38;
    this.speedScale = 1;
    this.camera.rotation.order = 'YXZ';
    this.#syncCamera();
    this._onLockChange = () => { this.locked = document.pointerLockElement === this.domElement; };
    this._onMouseMove = event => {
      if (!this.locked || this.hidden) return;
      const sensitivity = Number(this.settings.sensitivity) || 0.002;
      this.yaw -= (event.movementX || 0) * sensitivity;
      const invert = this.settings.invertY ? -1 : 1;
      this.pitch -= (event.movementY || 0) * sensitivity * invert;
      this.pitch = Math.max(-1.32, Math.min(1.32, this.pitch));
      this.#syncCamera();
    };
    this._onKeyDown = event => { this.keys.add(event.code); };
    this._onKeyUp = event => { this.keys.delete(event.code); };
    this._onBlur = () => this.keys.clear();
    document.addEventListener('pointerlockchange', this._onLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  #syncCamera() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.position.copy(this.position);
  }

  requestLock() {
    if (this.domElement.requestPointerLock) {
      const result = this.domElement.requestPointerLock();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  isDown(...codes) { return codes.some(code => this.keys.has(code)); }

  #collides(x, z) {
    const minX = x - this.radius, maxX = x + this.radius;
    const minZ = z - this.radius, maxZ = z + this.radius;
    for (const collider of this.colliders) {
      if (collider.maxY < 0.2 || collider.minY > 2.25) continue;
      if (maxX > collider.minX && minX < collider.maxX && maxZ > collider.minZ && minZ < collider.maxZ) return true;
    }
    return false;
  }

  move(dx, dz) {
    const distance = Math.hypot(dx, dz);
    const steps = Math.max(1, Math.ceil(distance / 0.16));
    const sx = dx / steps, sz = dz / steps;
    for (let i = 0; i < steps; i++) {
      const nextX = this.position.x + sx;
      if (!this.#collides(nextX, this.position.z)) this.position.x = nextX;
      const nextZ = this.position.z + sz;
      if (!this.#collides(this.position.x, nextZ)) this.position.z = nextZ;
    }
  }

  update(dt) {
    if (this.hidden || !this.locked) { this.noiseLevel = 0; return { moving: false, running: false, crouching: false, noise: 0 }; }
    const forwardInput = (this.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (this.isDown('KeyS', 'ArrowDown') ? 1 : 0);
    const sideInput = (this.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (this.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const moving = forwardInput !== 0 || sideInput !== 0;
    const crouching = this.isDown('ControlLeft', 'ControlRight');
    const running = this.isDown('ShiftLeft', 'ShiftRight') && !crouching && moving;
    const speed = crouching ? 1.45 : running ? 4.6 : 2.7;
    const length = Math.hypot(forwardInput, sideInput) || 1;
    const f = forwardInput / length, s = sideInput / length;
    const forwardX = -Math.sin(this.yaw), forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw), rightZ = -Math.sin(this.yaw);
    const dx = (forwardX * f + rightX * s) * speed * dt;
    const dz = (forwardZ * f + rightZ * s) * speed * dt;
    if (moving) this.move(dx, dz);
    const distance = Math.hypot(dx, dz);
    this.walkDistance += distance;
    this.noiseLevel = moving ? (crouching ? 0.12 : running ? 1 : 0.42) : 0;
    const cameraHeight = crouching ? 1.08 : 1.68;
    this.position.y += (cameraHeight - this.position.y) * Math.min(1, dt * 10);
    if (moving) {
      this.stepTimer -= dt;
      const interval = crouching ? 0.78 : running ? 0.34 : 0.55;
      if (this.stepTimer <= 0) {
        this.audio.footstep(crouching ? 'crouch' : running ? 'run' : 'walk');
        this.stepTimer = interval;
      }
    } else this.stepTimer = Math.min(this.stepTimer, 0.1);
    if (this.flashlightOn) this.battery = Math.max(0, this.battery - dt * 0.035);
    this.#syncCamera();
    return { moving, running, crouching, noise: this.noiseLevel };
  }

  toggleFlashlight() {
    if (this.battery <= 1 && !this.flashlightOn) return false;
    this.flashlightOn = !this.flashlightOn;
    return this.flashlightOn;
  }

  recharge(amount = 35) { this.battery = Math.min(100, this.battery + amount); }

  setHidden(value) {
    this.hidden = value;
    if (value) this.releaseLock();
  }

  teleport(x, y, z) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.#syncCamera();
  }

  dispose() {
    this.releaseLock();
    document.removeEventListener('pointerlockchange', this._onLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  }
}

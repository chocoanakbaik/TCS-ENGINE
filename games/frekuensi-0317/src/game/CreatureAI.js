import * as THREE from 'three';

export class CreatureAI {
  constructor(scene, colliders, audio, onCatch) {
    this.scene = scene;
    this.colliders = colliders;
    this.audio = audio;
    this.onCatch = onCatch;
    this.root = new THREE.Group();
    this.root.name = 'The Listener';
    this.bodyMaterial = new THREE.MeshStandardMaterial({ color:0x090d0f, roughness:0.92, metalness:0.02 });
    this.limbMaterial = new THREE.MeshStandardMaterial({ color:0x141a1b, roughness:1 });
    this.eyeMaterial = new THREE.MeshStandardMaterial({ color:0xc93625, emissive:0xff2b1b, emissiveIntensity:2.6, roughness:0.15 });
    this.#buildModel();
    this.root.position.set(24, 0, -38);
    this.scene.add(this.root);
    this.active = false;
    this.state = 'dormant';
    this.waypoints = [new THREE.Vector3(20,0,-56), new THREE.Vector3(-13,0,-68), new THREE.Vector3(18,0,-91), new THREE.Vector3(0,0,-62)];
    this.waypointIndex = 0;
    this.speed = 1.65;
    this.attackCooldown = 0;
    this.callTimer = 20;
    this.time = 0;
  }

  #buildModel() {
    const sphere = (name, x, y, z, sx, sy, sz, material) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 7), material);
      mesh.name = name; mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); this.root.add(mesh); return mesh;
    };
    const limb = (name, a, b, radius, material) => {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
      const direction = new THREE.Vector3().subVectors(end,start);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius, direction.length(), 7), material);
      mesh.name = name; mesh.position.copy(start).add(end).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), direction.normalize()); this.root.add(mesh); return mesh;
    };
    this.torso = sphere('torso', 0, 1.85, 0, 0.39, 0.96, 0.28, this.bodyMaterial);
    this.chest = sphere('upper-torso', 0, 2.42, -0.02, 0.48, 0.6, 0.32, this.bodyMaterial);
    this.head = sphere('head', 0.04, 3.2, -0.04, 0.31, 0.48, 0.31, this.bodyMaterial);
    this.neck = limb('neck', [0,2.65,0], [0.04,3.02,-0.02], 0.17, this.limbMaterial);
    this.leftArm = limb('left-arm',[-0.38,2.42,0],[-0.62,0.72,-0.22],0.105,this.limbMaterial);
    this.rightArm = limb('right-arm',[0.38,2.42,0],[0.66,0.62,-0.18],0.1,this.limbMaterial);
    this.leftLeg = limb('left-leg',[-0.15,1.1,0],[ -0.21,0.08,0.02],0.14,this.bodyMaterial);
    this.rightLeg = limb('right-leg',[0.15,1.1,0],[0.19,0.08,0.02],0.14,this.bodyMaterial);
    sphere('left-eye',-0.105,3.25,-0.31,0.052,0.085,0.035,this.eyeMaterial);
    sphere('right-eye',0.16,3.25,-0.31,0.052,0.085,0.035,this.eyeMaterial);
    this.root.scale.set(1,1,1);
    this.root.visible = false;
  }

  activate() { this.active = true; this.root.visible = true; this.state = 'patrol'; }
  deactivate() { this.active = false; this.root.visible = false; this.state = 'dormant'; }

  #blocked(x, z) {
    for (const c of this.colliders) {
      if (c.minY > 3.8 || c.maxY < 0.2) continue;
      if (x > c.minX - 0.42 && x < c.maxX + 0.42 && z > c.minZ - 0.42 && z < c.maxZ + 0.42) return true;
    }
    return false;
  }

  update(dt, player, chapter) {
    if (!this.active || chapter < 2 || player.hidden || !player.locked) return;
    this.time += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.callTimer -= dt;
    const target = player.position;
    const dx = target.x - this.root.position.x;
    const dz = target.z - this.root.position.z;
    const distance = Math.hypot(dx, dz);
    const detection = player.noiseLevel > 0.8 ? 37 : player.noiseLevel > 0.25 ? 23 : player.flashlightOn ? 17 : 10;
    const inForest = target.z < -23;
    if (distance < detection && (inForest || chapter >= 4)) this.state = 'hunt';
    else if (this.state === 'hunt' && distance > 43) this.state = 'search';
    else if (this.state === 'search' && distance > 38) this.state = 'patrol';

    let destination;
    if (this.state === 'hunt') destination = target;
    else {
      destination = this.waypoints[this.waypointIndex];
      if (Math.hypot(destination.x - this.root.position.x, destination.z - this.root.position.z) < 2.4) this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
    }
    const vx = destination.x - this.root.position.x;
    const vz = destination.z - this.root.position.z;
    const length = Math.hypot(vx, vz) || 1;
    const speed = this.state === 'hunt' ? 3.75 : this.state === 'search' ? 2.1 : 1.45;
    const stepX = vx / length * speed * dt;
    const stepZ = vz / length * speed * dt;
    let moved = false;
    if (!this.#blocked(this.root.position.x + stepX, this.root.position.z)) { this.root.position.x += stepX; moved = true; }
    if (!this.#blocked(this.root.position.x, this.root.position.z + stepZ)) { this.root.position.z += stepZ; moved = true; }
    if (!moved && this.state === 'hunt') this.state = 'search';
    this.root.rotation.y = Math.atan2(-vx, -vz);
    this.root.position.y = Math.sin(this.time * 6) * 0.025;
    this.leftArm.rotation.x = Math.sin(this.time * (this.state === 'hunt' ? 13 : 4)) * 0.24;
    this.rightArm.rotation.x = -Math.sin(this.time * (this.state === 'hunt' ? 13 : 4)) * 0.24;
    this.head.rotation.z = Math.sin(this.time * 2.5) * 0.045;
    if (this.callTimer <= 0 && distance < 25) { this.audio.creatureCall(); this.callTimer = 24 + Math.random() * 20; }
    if (distance < 1.35 && this.attackCooldown <= 0) {
      this.attackCooldown = 3;
      this.onCatch();
    }
  }
}

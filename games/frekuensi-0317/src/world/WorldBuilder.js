import * as THREE from 'three';
import { NOTES, SECRETS } from '../content.js';

function seeded(seed = 17) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function texture(base, accent, seed, repeatX = 2, repeatY = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const random = seeded(seed);
  for (let i = 0; i < 18000; i++) {
    const alpha = random() * 0.16;
    ctx.fillStyle = random() > 0.5 ? `rgba(220,232,222,${alpha})` : `rgba(0,0,0,${alpha})`;
    const size = 1 + random() * 3;
    ctx.fillRect(random() * 256, random() * 256, size, size);
  }
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 22; i++) {
    const x = random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, random() * 256);
    ctx.lineTo(x + (random() - 0.5) * 18, random() * 256);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 2;
  return map;
}

function buildMaterials() {
  const concrete = texture('#46504f', '#a2a9a1', 3, 3, 2);
  const plaster = texture('#666b65', '#c4bbaa', 8, 2, 2);
  const floor = texture('#272f31', '#65716e', 14, 5, 5);
  const ground = texture('#1b2722', '#53614a', 19, 26, 34);
  const rust = texture('#3c2922', '#9d5935', 24, 2, 3);
  const wood = texture('#392d25', '#876344', 28, 3, 1);
  const moss = texture('#27372d', '#71804c', 38, 18, 22);
  return {
    concrete: new THREE.MeshStandardMaterial({ map: concrete, color: 0xc4cbc6, roughness: 0.96 }),
    plaster: new THREE.MeshStandardMaterial({ map: plaster, color: 0xb9b8aa, roughness: 0.94 }),
    floor: new THREE.MeshStandardMaterial({ map: floor, color: 0x9ba7a0, roughness: 0.83 }),
    ground: new THREE.MeshStandardMaterial({ map: ground, color: 0x859180, roughness: 1 }),
    rust: new THREE.MeshStandardMaterial({ map: rust, color: 0xb0785b, metalness: 0.55, roughness: 0.72 }),
    wood: new THREE.MeshStandardMaterial({ map: wood, color: 0xc0a17a, roughness: 0.9 }),
    moss: new THREE.MeshStandardMaterial({ map: moss, color: 0x8da184, roughness: 1 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x101719, roughness: 0.86 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8bb1b8, emissive: 0x1b3b42, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.2 }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffd19a, emissive: 0xff9c4a, emissiveIntensity: 2.2 }),
    red: new THREE.MeshStandardMaterial({ color: 0xd03b32, emissive: 0x7c1510, emissiveIntensity: 1.1 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xd1c7ad, roughness: 1 }),
    eye: new THREE.MeshStandardMaterial({ color: 0xa32218, emissive: 0xef2418, emissiveIntensity: 2.8 })
  };
}

export class WorldBuilder {
  constructor(scene) {
    this.scene = scene;
    this.materials = buildMaterials();
    this.colliders = [];
    this.interactables = [];
    this.interactionById = new Map();
    this.lights = [];
    this.doors = new Map();
    this.random = seeded(31703);
  }

  build() {
    this.#buildTerrain();
    this.#buildStation();
    this.#buildForest();
    this.#buildUnderground();
    this.#buildTower();
    this.#buildInteractables();
    this.#buildStorm();
    return {
      colliders: this.colliders,
      interactables: this.interactables,
      interactionById: this.interactionById,
      doors: this.doors,
      lights: this.lights,
      beacons: ['beacon-west', 'beacon-ridge', 'beacon-river']
    };
  }

  #add(mesh, parent = this.scene) {
    parent.add(mesh);
    return mesh;
  }

  #box(name, x, y, z, w, h, d, material, { collision = false, interact = null, parent = this.scene, cast = true } = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.name = name;
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    if (interact) this.#register(interact.id, interact.label, interact.type, mesh, interact.data ?? {});
    if (collision) this.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, minY: y, maxY: y + h, name });
    return this.#add(mesh, parent);
  }

  #cylinder(name, x, y, z, rTop, rBottom, h, material, radial = 8, parent = this.scene) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, radial), material);
    mesh.name = name;
    mesh.position.set(x, y + h / 2, z);
    mesh.receiveShadow = true;
    return this.#add(mesh, parent);
  }

  #register(id, label, type, object, data = {}) {
    object.userData.interaction = { id, label, type, data };
    this.interactables.push(object);
    this.interactionById.set(id, object);
  }

  #addLight(x, y, z, color, intensity, distance, target = null) {
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(x, y, z);
    light.castShadow = false;
    this.#add(light);
    if (target) light.target.position.copy(target);
    this.lights.push(light);
    return light;
  }

  #wall(x, z, w, h, d, mat = this.materials.concrete, name = 'station-wall') {
    return this.#box(name, x, 0, z, w, h, d, mat, { collision: true });
  }

  #buildTerrain() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(280, 330, 1, 1), this.materials.ground);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.22, -42);
    ground.receiveShadow = true;
    this.#add(ground);

    const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 126), new THREE.MeshStandardMaterial({ color: 0x28302e, roughness: 1 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.15, -55);
    this.#add(road);

    for (let i = 0; i < 12; i++) {
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(13 + this.random() * 12, 35 + this.random() * 30, 5), this.materials.moss);
      mountain.position.set(-120 + i * 22, 8, -152 - this.random() * 20);
      mountain.rotation.y = this.random() * Math.PI;
      this.#add(mountain);
    }

    for (let i = 0; i < 44; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + this.random() * 1.5, 0), this.materials.dark);
      const x = (this.random() - 0.5) * 170;
      const z = -20 - this.random() * 116;
      if (Math.abs(x) < 7 && z > -100) continue;
      rock.position.set(x, -0.05, z);
      rock.rotation.set(this.random(), this.random(), this.random());
      rock.scale.y = 0.4 + this.random() * 0.6;
      this.#add(rock);
    }
  }

  #buildStation() {
    const m = this.materials;
    this.#box('station-foundation', 0, -0.25, 0, 30, 0.5, 27, m.floor, { collision: false });
    // Main envelope with a wide front entrance.
    this.#wall(-14.75, 0, 0.5, 5, 27, m.concrete, 'west-exterior-wall');
    this.#wall(14.75, 0, 0.5, 5, 27, m.concrete, 'east-exterior-wall');
    this.#wall(0, -13.25, 30, 5, 0.5, m.concrete, 'north-exterior-wall');
    this.#wall(-9.25, 13.25, 11.5, 5, 0.5, m.concrete, 'south-wall-west');
    this.#wall(9.25, 13.25, 11.5, 5, 0.5, m.concrete, 'south-wall-east');
    this.#box('front-canopy', 0, 4.7, 14.1, 13, 0.35, 3.2, m.rust);
    this.#box('station-roof', 0, 5, 0, 31, 0.65, 28, m.rust);

    // Interior partitions create readable spaces and actual navigable corridors.
    this.#wall(-3.8, -6.35, 0.35, 4.4, 9.9, m.plaster, 'west-room-partition-north');
    this.#wall(-3.8, 5.75, 0.35, 4.4, 6.8, m.plaster, 'west-room-partition-south');
    this.#wall(4.2, -6.35, 0.35, 4.4, 9.9, m.plaster, 'east-room-partition-north');
    this.#wall(4.2, 5.75, 0.35, 4.4, 6.8, m.plaster, 'east-room-partition-south');
    this.#wall(0.2, -5.8, 8, 4.2, 0.35, m.plaster, 'archive-back-partition');
    // Short cross-walls retain separate rooms but leave human-width door openings.
    this.#wall(-12, 5.2, 5.4, 4.2, 0.35, m.plaster, 'generator-partition-back-west');
    this.#wall(-5.9, 5.2, 4.2, 4.2, 0.35, m.plaster, 'generator-partition-back-east');
    this.#wall(-12, -6.3, 5.4, 4.2, 0.35, m.plaster, 'generator-partition-front-west');
    this.#wall(-5.9, -6.3, 4.2, 4.2, 0.35, m.plaster, 'generator-partition-front-east');
    this.#wall(6.5, 5.2, 3.5, 4.2, 0.35, m.plaster, 'control-partition-back-west');
    this.#wall(12.1, 5.2, 4.8, 4.2, 0.35, m.plaster, 'control-partition-back-east');
    this.#wall(6.5, -6.3, 3.5, 4.2, 0.35, m.plaster, 'control-partition-front-west');
    this.#wall(12.1, -6.3, 4.8, 4.2, 0.35, m.plaster, 'control-partition-front-east');

    // Interior details: beams, window frames, desks, filing cabinets, overhead lamps.
    for (const z of [-10, -3, 4, 11]) this.#box(`ceiling-beam-${z}`, 0, 4.3, z, 29, 0.16, 0.22, m.rust);
    for (const x of [-13.9, 13.9]) {
      for (const z of [-8, 0, 8]) {
        this.#box(`window-${x}-${z}`, x * 0.985, 2.05, z, 0.12, 1.15, 2.8, m.glass);
        this.#box(`window-sill-${x}-${z}`, x * 0.985, 1.35, z, 0.3, 0.12, 3, m.rust);
      }
    }
    this.#box('control-desk', 9.7, 0, 0.3, 6.2, 1.1, 1.8, m.wood);
    this.#box('archive-shelf-a', -8.3, 0, -9, 1, 3, 6, m.rust);
    this.#box('archive-shelf-b', -12.2, 0, -9, 1, 3, 6, m.rust);
    this.#box('generator-housing', -9.5, 0, 1, 4.8, 2.2, 3.1, m.dark, { collision: true });
    this.#cylinder('exhaust-stack', -11.3, 1.9, 2.1, 0.22, 0.32, 2.1, m.rust, 8);
    this.#box('pipe-west', -13.2, 2.8, 3.2, 0.22, 0.22, 9, m.rust);
    this.#box('pipe-east', 13.3, 2.8, 3.2, 0.22, 0.22, 9, m.rust);

    // Lamps: warm pools of light inside the cold station.
    for (const [x, z] of [[-9, 9], [0, 8], [9, 9], [-9, -9], [9, -9]]) {
      this.#cylinder(`ceiling-lamp-${x}-${z}`, x, 4.18, z, 0.16, 0.22, 0.12, m.lamp, 8);
      this.#addLight(x, 3.85, z, 0xffb66f, 1.15, 11);
    }

    this.#box('notice-board', 0.2, 1.7, -12.85, 3.6, 1.4, 0.12, m.wood);
    this.#box('board-paper', 0.2, 2, -12.76, 2.7, 0.85, 0.06, m.paper);
    this.#box('locker-one', 12.8, 0, 10.5, 1.4, 2.5, 1.1, m.rust, { collision: true, interact: { id: 'hide-locker-one', label: 'Bersembunyi di loker', type: 'hide' } });
    this.#box('locker-two', 13, 0, -8.5, 1.25, 2.5, 1, m.rust, { collision: true, interact: { id: 'hide-locker-two', label: 'Bersembunyi di loker', type: 'hide' } });
    this.#register('main-exit-door', 'Periksa pintu utama', 'door', this.#box('main-exit-door', 0, 0, 12.95, 3.7, 4, 0.25, m.wood), { locked: true });
    this.doors.set('main-exit-door', this.interactionById.get('main-exit-door'));

    // Generator and radio control panels.
    this.#box('generator-panel', -9.5, 1.2, -1, 1.5, 1.45, 0.22, m.rust, { interact: { id: 'generator-panel', label: 'Periksa panel generator', type: 'generator' } });
    this.#box('radio-console', 8.3, 0.95, 2.2, 2.8, 1.5, 1.2, m.dark, { interact: { id: 'radio-console', label: 'Gunakan radio pemancar', type: 'radio' } });
    this.#box('radio-screen', 8.3, 2.12, 1.55, 1.75, 0.62, 0.12, m.glass);
    this.#box('radio-dial', 9.35, 1.72, 1.5, 0.34, 0.32, 0.16, m.lamp);
    this.#box('antenna-control-panel', 0, 1, -110, 2.4, 1.8, 1, m.dark, { interact: { id: 'antenna-final-panel', label: 'Buka panel pemancar utama', type: 'final-panel' } });
  }

  #buildForest() {
    const m = this.materials;
    // Instanced tree trunks and tiered canopies keep the forest dense without excessive draw calls.
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.32, 5.2, 6);
    const foliageGeo = new THREE.ConeGeometry(1.55, 4.5, 6);
    const trunkMat = m.wood;
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x23372d, roughness: 1 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x314337, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, 150);
    const crownsA = new THREE.InstancedMesh(foliageGeo, foliageMat, 150);
    const crownsB = new THREE.InstancedMesh(foliageGeo, foliageMat2, 150);
    const dummy = new THREE.Object3D();
    let count = 0;
    for (let i = 0; i < 150; i++) {
      const x = (this.random() - 0.5) * 120;
      const z = -19 - this.random() * 112;
      if (Math.abs(x) < 8 && z > -96) continue;
      const scale = 0.75 + this.random() * 1.1;
      dummy.position.set(x, 2.6 * scale, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = this.random() * Math.PI * 2;
      dummy.updateMatrix();
      trunks.setMatrixAt(count, dummy.matrix);
      dummy.position.y = 5.1 * scale;
      dummy.scale.set(1.05 * scale, 1.05 * scale, 1.05 * scale);
      dummy.updateMatrix();
      crownsA.setMatrixAt(count, dummy.matrix);
      dummy.position.y = 6.6 * scale;
      dummy.scale.set(0.74 * scale, 0.82 * scale, 0.74 * scale);
      dummy.updateMatrix();
      crownsB.setMatrixAt(count, dummy.matrix);
      count++;
    }
    trunks.count = crownsA.count = crownsB.count = count;
    this.#add(trunks); this.#add(crownsA); this.#add(crownsB);

    // Trail markers, puddles, cable poles, and beacon shelters.
    for (let i = 0; i < 18; i++) {
      const z = -17 - i * 5.8;
      this.#box(`trail-marker-${i}`, (i % 2 ? -4.3 : 4.3), 0, z, 0.16, 0.85, 0.16, m.rust);
      this.#box(`marker-reflector-${i}`, (i % 2 ? -4.3 : 4.3), 0.55, z, 0.2, 0.12, 0.2, m.lamp);
    }
    for (const [x, z] of [[-12, -42], [14, -66], [-16, -88]]) {
      this.#cylinder(`beacon-post-${x}-${z}`, x, 0, z, 0.14, 0.22, 3.5, m.rust, 8);
      const beacon = this.#box(`beacon-head-${x}-${z}`, x, 3.2, z, 0.55, 0.55, 0.55, m.red);
      const beaconIndex = [[-16, -88], [14, -66], [-12, -42]].findIndex(([bx, bz]) => bx === x && bz === z);
      const beaconIds = ['beacon-river', 'beacon-ridge', 'beacon-west'];
      const beaconLabels = ['Aktifkan relai sungai', 'Aktifkan relai punggung bukit', 'Aktifkan relai barat'];
      this.#register(beaconIds[beaconIndex], beaconLabels[beaconIndex], 'beacon', beacon, { x, z });
      this.#addLight(x, 3.65, z, 0x9be0d4, 1.1, 8);
    }
    this.#box('forest-shelter', 20, 0, -57, 5.5, 3.8, 5, m.wood, { collision: true });
    this.#box('shelter-roof', 20, 3.6, -57, 6.2, 0.28, 5.6, m.rust);
    this.#box('shelter-locker', 21.7, 0, -57, 0.8, 2.2, 0.75, m.dark, { collision: true, interact: { id: 'shelter-hide', label: 'Bersembunyi di lemari pos', type: 'hide' } });
    this.#box('river-bank-a', -29, 0, -76, 0.4, 0.6, 32, m.moss, { collision: true });
    this.#box('river-bank-b', -42, 0, -76, 0.4, 0.6, 32, m.moss, { collision: true });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(13, 32), new THREE.MeshStandardMaterial({ color: 0x172e36, roughness: 0.12, metalness: 0.3, transparent: true, opacity: 0.84 }));
    water.rotation.x = -Math.PI / 2; water.position.set(-35.5, -0.05, -76); this.#add(water);
    // Cable poles recede toward the relay tower.
    for (let i = 0; i < 6; i++) {
      const z = -18 - i * 15;
      this.#cylinder(`power-pole-${i}`, -9, 0, z, 0.13, 0.18, 7.6, m.wood, 7);
      this.#box(`pole-crossbar-${i}`, -9, 7.1, z, 2.8, 0.13, 0.18, m.rust);
    }
  }

  #buildUnderground() {
    const m = this.materials;
    const x0 = 38, z0 = -38;
    this.#box('underground-floor', x0, -0.25, z0, 34, 0.5, 37, m.floor);
    this.#box('underground-ceiling', x0, 4.1, z0, 34, 0.35, 37, m.concrete);
    this.#wall(x0 - 17, z0, 0.45, 4.3, 37, m.concrete, 'underground-west-wall');
    this.#wall(x0 + 17, z0, 0.45, 4.3, 37, m.concrete, 'underground-east-wall');
    this.#wall(x0, z0 - 18.4, 34, 4.3, 0.45, m.concrete, 'underground-north-wall');
    this.#wall(28, z0 + 18.4, 14, 4.3, 0.45, m.concrete, 'underground-south-wall-west');
    this.#wall(48, z0 + 18.4, 14, 4.3, 0.45, m.concrete, 'underground-south-wall-east');
    this.#wall(38, -26.5, 0.35, 3.7, 9, m.plaster, 'underground-partition-a-north');
    this.#wall(38, -48, 0.35, 3.7, 8, m.plaster, 'underground-partition-a-south');
    this.#wall(47, -44, 14, 3.7, 0.35, m.plaster, 'underground-partition-b');
    for (const [x, z] of [[26, -28], [48, -28], [26, -49], [49, -50], [39, -40]]) {
      this.#cylinder(`underground-pipe-${x}-${z}`, x, 2.75, z, 0.18, 0.18, 7, m.rust, 10).rotation.z = Math.PI / 2;
      this.#addLight(x, 3.5, z, 0xff6a3a, 0.35, 5);
    }
    for (const [i, [x, z]] of [[0,[29,-27]],[1,[46,-47]],[2,[50,-29]]]) {
      const valveGroup = new THREE.Group();
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.09, 6, 16), m.red);
      wheel.position.y = 1.65; valveGroup.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8), m.rust);
      hub.rotation.x = Math.PI / 2; hub.position.set(0, 1.65, 0); valveGroup.add(hub);
      valveGroup.position.set(x, 0, z); this.#add(valveGroup);
      this.#register(`valve-${i+1}`, `Putar katup ${i+1}`, 'valve', wheel, { index: i });
      this.#box(`valve-label-${i}`, x, 2.4, z - 0.3, 0.55, 0.16, 0.08, m.paper);
    }
    this.#box('underground-hatch', 38, 0, -19.4, 2.8, 3.4, 0.25, m.rust, { interact: { id:'underground-exit', label:'Kembali ke stasiun', type:'exit-underground' } });
    this.#box('underground-code-panel', 53.7, 1.2, -35, 0.24, 1.55, 1.25, m.dark, { interact: { id:'underground-code', label:'Periksa panel akses', type:'code-panel', data:{ digits:4 } } });
  }

  #buildTower() {
    const m = this.materials;
    this.#box('tower-foundation', 0, -0.2, -110, 13, 0.4, 13, m.floor);
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + Math.PI / 4;
      const x = Math.cos(angle) * 4.6;
      const z = -110 + Math.sin(angle) * 4.6;
      const pylon = this.#cylinder(`tower-pylon-${i}`, x, 0, z, 0.11, 0.16, 30, m.rust, 7);
      pylon.rotation.z = Math.atan2(x, 30);
    }
    for (let y = 3; y < 30; y += 4.5) {
      this.#box(`tower-cross-member-${y}`, 0, y, -110, 8.5 - y * 0.12, 0.12, 0.12, m.rust);
      this.#box(`tower-cross-member-z-${y}`, 0, y, -110, 0.12, 0.12, 8.5 - y * 0.12, m.rust);
    }
    this.#cylinder('tower-mast', 0, 26, -110, 0.12, 0.18, 13, m.rust, 8);
    this.#cylinder('tower-lamp-ring', 0, 29, -110, 1.7, 1.7, 0.12, m.dark, 12);
    this.#addLight(0, 30, -110, 0xd34a39, 1.5, 28);
    this.#box('tower-shed-floor', 0, -0.12, -102, 8, 0.24, 6, m.floor);
    this.#wall(-3.9, -102, 0.2, 4.3, 6, m.concrete, 'tower-shed-west-wall');
    this.#wall(3.9, -102, 0.2, 4.3, 6, m.concrete, 'tower-shed-east-wall');
    this.#wall(0, -105, 8, 4.3, 0.2, m.concrete, 'tower-shed-back-wall');
    this.#wall(-2.35, -99, 3.3, 4.3, 0.2, m.concrete, 'tower-shed-front-west');
    this.#wall(2.35, -99, 3.3, 4.3, 0.2, m.concrete, 'tower-shed-front-east');
    this.#box('tower-shed-roof', 0, 4.15, -102, 8.2, 0.25, 6.2, m.rust);
    this.#box('tower-shed-door', 0, 0, -99.0, 1.7, 3.6, 0.12, m.wood, { interact: { id:'tower-door', label:'Masuk ke ruang pemancar', type:'tower-door' } });
    this.#box('tower-console', 0, 0.8, -107.3, 3.2, 1.8, 1.4, m.dark, { interact: { id:'tower-console', label:'Aktifkan konsol siaran', type:'tower-console' } });
  }

  #buildInteractables() {
    const m = this.materials;
    // Fuses, batteries, documents and secrets are deliberately placed across the campaign route.
    this.#box('fuse-ceramic-a', -12.1, 1.2, 3.7, 0.28, 0.55, 0.28, m.paper, { interact: { id:'fuse-a', label:'Ambil sekring keramik', type:'fuse', data:{ fuse:'a' } } });
    this.#box('fuse-ceramic-b', -7.2, 0.8, -9.3, 0.28, 0.55, 0.28, m.paper, { interact: { id:'fuse-b', label:'Ambil sekring cadangan', type:'fuse', data:{ fuse:'b' } } });
    this.#box('relay-terminal', 8.2, 0.9, -7.1, 1.3, 1.5, 0.6, m.dark, { interact: { id:'relay-terminal', label:'Periksa terminal relai', type:'relay-terminal' } });
    this.#box('basement-hatch', 10.8, 0.02, -9.7, 2.5, 0.18, 2.5, m.rust, { interact: { id:'basement-hatch', label:'Buka akses bawah tanah', type:'basement-hatch' } });

    for (let i = 0; i < NOTES.length; i++) {
      const note = NOTES[i];
      let x, z, y = 0.85;
      if (i < 4) { x = -11 + (i % 2) * 4.1; z = 9 - Math.floor(i / 2) * 9; }
      else if (i < 8) { x = 8 + (i % 2) * 3; z = 9 - Math.floor((i - 4) / 2) * 8; }
      else if (i < 12) { x = -12 + (i % 2) * 21; z = -33 - Math.floor((i - 8) / 2) * 16; }
      else if (i < 16) { x = 27 + (i % 2) * 20; z = -25 - Math.floor((i - 12) / 2) * 18; }
      else { x = -2 + (i % 2) * 4; z = -103 - Math.floor((i - 16) / 2) * 4; }
      const paper = this.#box(`document-${note.id}`, x, y, z, 0.7, 0.06, 0.52, m.paper);
      paper.rotation.y = this.random() * 0.16;
      this.#register(`note-${note.id}`, `Baca ${note.title}`, 'note', paper, { noteId: note.id });
    }

    const batteries = [[-12, 0.5, -2], [18, 0.5, -51], [45, 0.5, -42], [-5, 0.5, -90]];
    batteries.forEach(([x, y, z], i) => {
      const cell = this.#cylinder(`battery-${i}`, x, y, z, 0.18, 0.18, 0.58, m.lamp, 8);
      this.#register(`battery-${i}`, 'Ambil baterai senter', 'battery', cell, { batteryId: i });
    });

    const secretPositions = [[-19, -18], [13, -18], [-30, -63], [55, -48], [8, -117]];
    for (let i = 0; i < SECRETS.length; i++) {
      const [x, z] = secretPositions[i];
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), new THREE.MeshStandardMaterial({ color:0x9bbbc2, emissive:0x31545c, emissiveIntensity:1.3, metalness:0.55, roughness:0.3 }));
      shard.position.set(x, 1.2, z); shard.rotation.set(0.2, 0.2, 0.1);
      this.#add(shard);
      this.#register(`secret-${SECRETS[i].id}`, `Periksa ${SECRETS[i].label}`, 'secret', shard, { secretId: SECRETS[i].id });
    }
  }

  #buildStorm() {
    const positions = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) {
      positions[i * 3] = (this.random() - 0.5) * 90;
      positions[i * 3 + 1] = this.random() * 26;
      positions[i * 3 + 2] = (this.random() - 0.5) * 110;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color:0x9bb6bc, size:0.055, transparent:true, opacity:0.35, depthWrite:false });
    const rain = new THREE.Points(geometry, material);
    rain.name = 'storm-rain-particles';
    this.#add(rain);
    this.rain = rain;
    this.rainPositions = positions;
  }

  updateWeather(dt, elapsed) {
    if (!this.rain) return;
    const p = this.rain.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      p[i + 1] -= dt * (12 + (i % 7));
      p[i] += dt * 1.5;
      if (p[i + 1] < 0) {
        p[i + 1] = 22 + this.random() * 6;
        p[i] = (this.random() - 0.5) * 90;
        p[i + 2] = (this.random() - 0.5) * 110;
      }
    }
    this.rain.geometry.attributes.position.needsUpdate = true;
    this.rain.visible = elapsed > 3;
  }
}

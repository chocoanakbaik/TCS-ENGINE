# TCS Engine v0.1.0

A modular, event-driven 2D/3D game engine for JavaScript projects, developed by **The Choco Studios**.

TCS Engine provides a practical mid-level foundation for browser games: an entity-component-system architecture, 2D Canvas and 3D Three.js rendering, input, audio, basic AABB physics, asset loading, UI overlays, scene management, and math helpers.

> **Status:** Initial public development release. The API may evolve as it is tested in real projects.

## Requirements
- Node.js 18 or newer
- A modern browser with Canvas support
- WebGL support for 3D rendering
- Three.js 0.150.0 or newer for 3D features

## Install
```bash
npm install github:chocoanakbaik/TCS-ENGINE three
```
Three.js is a peer dependency. Install it in the consuming project when using the 3D renderer or GLTF loader.

## Quick start (2D)
```js
import { Engine, Transform, Sprite } from 'tcs-engine';
const engine = new Engine({ mode: '2d' });
engine.init(document.querySelector('#game'));
const player = engine.world.createEntity();
engine.world.addComponent(player, new Transform(0, 0));
const sprite = new Sprite();
sprite.color = '#7c5cff'; sprite.width = 48; sprite.height = 48;
engine.world.addComponent(player, sprite);
engine.start();
```

## Quick start (3D)
```js
import * as THREE from 'three';
import { Engine, Transform } from 'tcs-engine';
const engine = new Engine({ mode: '3d' });
engine.init(document.querySelector('#game'));
const entity = engine.world.createEntity();
engine.world.addComponent(entity, new Transform(0, 0, 0));
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshStandardMaterial({ color: 0x7c5cff }));
engine.renderer.attachObject(entity, mesh);
engine.start();
```

## Included systems
- ECS: entities, components, queries, ordered systems
- Canvas 2D and Three.js 3D renderers
- Keyboard, mouse, and touch input
- Web Audio API helpers
- Velocity integration, optional gravity, and basic AABB overlap events
- Image, audio, JSON, and GLTF asset loading with caching
- DOM UI overlay and HUD management
- Event bus and scene manager
- Vector, interpolation, angle, and collision math helpers

## Development
```bash
npm install
npm run dev
npm run build
npm run preview
```
The interactive example is served from `public/index.html` when running Vite.

## Scope
This is a mid-level runtime foundation, not a full game editor. It does not include a GUI editor, visual scripting, or multiplayer networking. Physics is intentionally basic and is not a replacement for a dedicated physics engine.

## License and attribution
Developed and maintained by **The Choco Studios**.

The repository's license and contribution policy will be published separately. Until then, do not assume that the code is offered under a particular open-source license.

import { System } from '../ecs/System.js';
export class RenderSystem extends System {
  constructor(renderer) { super(); this.renderer=renderer; this.priority=100; }
  update(deltaTime,world) { this.renderer?.render(world,deltaTime); }
}

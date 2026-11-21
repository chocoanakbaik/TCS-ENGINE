import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../../src/ecs/World.js';
import { Transform, Velocity, Collider } from '../../src/ecs/Component.js';
import { PhysicsSystem } from '../../src/systems/PhysicsSystem.js';

test('World creates, queries, removes and destroys entities', () => {
  const world = new World();
  const entity = world.createEntity();
  world.addComponent(entity, new Transform(1, 2, 3));
  world.addComponent(entity, new Velocity(4, 0, -2));
  assert.deepEqual(world.query('Transform', 'Velocity'), [entity]);
  assert.equal(world.getComponent(entity, 'Transform').x, 1);
  assert.equal(world.removeComponent(entity, 'Velocity'), true);
  assert.deepEqual(world.query('Transform', 'Velocity'), []);
  assert.equal(world.destroyEntity(entity), true);
  assert.equal(world.entities.size, 0);
});

test('PhysicsSystem integrates velocity deterministically', () => {
  const world = new World();
  const entity = world.createEntity();
  const transform = world.addComponent(entity, new Transform(0, 0, 0));
  world.addComponent(entity, new Velocity(2, 0, -4));
  const physics = new PhysicsSystem({ useGravity: false });
  physics.update(0.5, world);
  assert.equal(transform.x, 1);
  assert.equal(transform.z, -2);
});

test('World query ignores entities without requested components', () => {
  const world = new World();
  const a = world.createEntity();
  const b = world.createEntity();
  world.addComponent(a, new Transform());
  world.addComponent(b, new Transform());
  world.addComponent(b, new Collider());
  assert.deepEqual(world.query(Transform, Collider), [b]);
  assert.notEqual(a, b);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../../src/core/EventBus.js';

test('EventBus emits to a stable snapshot and removes listeners', () => {
  const bus = new EventBus();
  const received = [];
  const listener = value => received.push(value);
  const unsubscribe = bus.on('signal', listener);
  bus.emit('signal', 17);
  assert.deepEqual(received, [17]);
  assert.equal(unsubscribe(), true);
  bus.emit('signal', 23);
  assert.deepEqual(received, [17]);
  assert.equal(bus.listenerCount('signal'), 0);
});

test('EventBus once fires once even when emitted repeatedly', () => {
  const bus = new EventBus();
  let calls = 0;
  bus.once('only-once', () => calls++);
  bus.emit('only-once');
  bus.emit('only-once');
  assert.equal(calls, 1);
});

test('EventBus isolates subscriber errors', () => {
  const bus = new EventBus();
  const received = [];
  const original = console.error;
  console.error = () => {};
  try {
    bus.on('stable', () => { throw new Error('subscriber failure'); });
    bus.on('stable', value => received.push(value));
    bus.emit('stable', 'continues');
  } finally { console.error = original; }
  assert.deepEqual(received, ['continues']);
});

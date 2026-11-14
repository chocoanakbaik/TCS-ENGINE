export class EventBus {
  constructor() { this.events = new Map(); }
  on(event, callback) {
    if (typeof callback !== 'function') throw new TypeError('Event callback must be a function.');
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event).add(callback);
    return () => this.off(event, callback);
  }
  once(event, callback) {
    let unsubscribe;
    unsubscribe = this.on(event, data => { unsubscribe(); callback(data); });
    return unsubscribe;
  }
  off(event, callback) {
    const listeners = this.events.get(event);
    if (!listeners) return false;
    const removed = listeners.delete(callback);
    if (!listeners.size) this.events.delete(event);
    return removed;
  }
  emit(event, data) {
    const listeners = this.events.get(event);
    if (!listeners) return;
    for (const callback of [...listeners]) {
      try { callback(data); }
      catch (error) { console.error(`[TCS Engine] Event listener failed for "${event}":`, error); }
    }
  }
  listenerCount(event) { return this.events.get(event)?.size ?? 0; }
  clear(event) { if (event === undefined) this.events.clear(); else this.events.delete(event); }
}
const eventBus = new EventBus();
export { eventBus };
export default eventBus;
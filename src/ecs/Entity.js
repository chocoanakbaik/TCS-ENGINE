let nextEntityId=1;
export function createEntityId() { return nextEntityId++; }
export function resetEntityCounter() { nextEntityId=1; }
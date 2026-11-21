const SAVE_KEY = 'tcs.frekuensi0317.save.v1';
const SETTINGS_KEY = 'tcs.frekuensi0317.settings.v1';

export const DEFAULT_STATE = Object.freeze({
  chapter: 1, fuses: [], generatorOn: false, radioAligned: false,
  beacons: [], valves: [0,0,0], undergroundOpen: false,
  finalCodeSolved: false, ending: null, notes: [], secrets: [],
  checkpoint: { x: 0, y: 1.68, z: 10.9 }, elapsedSeconds: 0, batteryPickups: [],
  discoveredAreas: ['main-station'], batteries: 0, deathCount: 0
});

function safeParse(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

export class SaveManager {
  load() {
    const stored = safeParse(localStorage.getItem(SAVE_KEY), null);
    if (!stored || typeof stored !== 'object') return structuredCloneSafe(DEFAULT_STATE);
    return {
      ...structuredCloneSafe(DEFAULT_STATE), ...stored,
      fuses: Array.isArray(stored.fuses) ? stored.fuses : [],
      beacons: Array.isArray(stored.beacons) ? stored.beacons : [],
      valves: Array.isArray(stored.valves) && stored.valves.length === 3 ? stored.valves : [0,0,0],
      notes: Array.isArray(stored.notes) ? stored.notes : [],
      secrets: Array.isArray(stored.secrets) ? stored.secrets : [],
      batteryPickups: Array.isArray(stored.batteryPickups) ? stored.batteryPickups : [],
      discoveredAreas: Array.isArray(stored.discoveredAreas) ? stored.discoveredAreas : ['main-station']
    };
  }
  save(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; }
    catch (error) { console.warn('[FREKUENSI] Gagal menyimpan progres:', error); return false; }
  }
  hasSave() { return localStorage.getItem(SAVE_KEY) !== null; }
  clear() { localStorage.removeItem(SAVE_KEY); }
  loadSettings() {
    return { quality:'low', sensitivity:0.002, volume:0.8, invertY:false,
      ...safeParse(localStorage.getItem(SETTINGS_KEY), {}) };
  }
  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

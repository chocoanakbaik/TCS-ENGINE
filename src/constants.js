export const TCS_VERSION = '0.2.0';
export const DEFAULT_FPS = 60;
export const MAX_DELTA = 0.05;
export const EVENTS = Object.freeze({
  ENGINE_STARTED:'engine:started', ENGINE_STOPPED:'engine:stopped',
  ENGINE_PAUSED:'engine:paused', ENGINE_RESUMED:'engine:resumed',
  SCENE_CHANGED:'scene:changed', ENTITY_CREATED:'entity:created',
  ENTITY_DESTROYED:'entity:destroyed', ENTITY_COLLIDED:'entity:collided',
  ASSET_LOADED:'asset:loaded', ASSET_PROGRESS:'asset:progress', ASSET_ERROR:'asset:error',
  INPUT_KEY_DOWN:'input:key_down', INPUT_KEY_UP:'input:key_up',
  INPUT_MOUSE_DOWN:'input:mouse_down', INPUT_MOUSE_UP:'input:mouse_up',
  INPUT_MOUSE_MOVE:'input:mouse_move', INPUT_TOUCH_START:'input:touch_start',
  INPUT_TOUCH_END:'input:touch_end', INPUT_TOUCH_MOVE:'input:touch_move',
  GAME_OVER:'game:over', GAME_WIN:'game:win'
});
export const RENDER_MODE = Object.freeze({ MODE_2D:'2d', MODE_3D:'3d' });

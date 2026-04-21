export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const WORLD_SIZE = 3200;

export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_SPEED = 240;
export const PLAYER_IFRAME_MS = 300;

export const WAVE_DURATION_MS = 22_000;
export const GAME_DURATION_MS = 15 * 60 * 1000;

export const BASE_GEM_MAGNET_RANGE = 140;
export const BASE_PICKUP_RANGE = 22;

export const XP_PER_LEVEL = [50, 120, 220, 360, 550, 760, 1000, 1280, 1600, 1960];

const XP_POST_ARRAY_GROWTH = 1.2;

export function xpForLevel(level: number): number {
  if (level < XP_PER_LEVEL.length) return XP_PER_LEVEL[level];
  const last = XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const extra = level - (XP_PER_LEVEL.length - 1);
  return Math.round(last * Math.pow(XP_POST_ARRAY_GROWTH, extra));
}

export const SPAWN_MIN_RADIUS = 320;
export const SPAWN_MAX_RADIUS = 460;
export const ENEMY_WAVE_BASE_COUNT = 5;
export const ENEMY_WAVE_GROWTH = 3;
export const WAVE_SCALING_FACTOR = 0.1;

export const SCORE_WAVE_MULTIPLIER = 10;

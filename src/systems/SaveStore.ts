import { MAP_DEFS, MAP_ORDER, type MapId } from "../config/MapDefs";
import type { EndStats } from "../types/GameTypes";

const STORAGE_KEY = "yoinkers.save.v2";

export interface SaveData {
  runsPlayed: number;
  winCount: number;
  totalEnemiesKilled: number;
  totalDamage: number;
  totalTimeMs: number;
  bestWave: number;
  bestLevel: number;
  bestTimeMs: number;
  bestEnemies: number;
  allTimeDamage: Record<string, number>;
  lastRun: EndStats | null;
  unlockedMaps: MapId[];
  clearedMaps: MapId[];
  lastMapId: MapId;
}

const EMPTY_SAVE: SaveData = {
  runsPlayed: 0,
  winCount: 0,
  totalEnemiesKilled: 0,
  totalDamage: 0,
  totalTimeMs: 0,
  bestWave: 0,
  bestLevel: 0,
  bestTimeMs: 0,
  bestEnemies: 0,
  allTimeDamage: {},
  lastRun: null,
  unlockedMaps: ["grove"],
  clearedMaps: [],
  lastMapId: "grove",
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneEmpty();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...cloneEmpty(),
      ...parsed,
      allTimeDamage: { ...(parsed.allTimeDamage ?? {}) },
      unlockedMaps: sanitizeMaps(parsed.unlockedMaps, ["grove"]),
      clearedMaps: sanitizeMaps(parsed.clearedMaps, []),
      lastMapId: sanitizeMapId(parsed.lastMapId, "grove"),
    };
  } catch {
    return cloneEmpty();
  }
}

export function persistRun(stats: EndStats, mapId: MapId): SaveData {
  const current = loadSave();
  const clearedMaps = stats.won
    ? addUnique(current.clearedMaps, mapId)
    : current.clearedMaps;
  const unlockedMaps = stats.won ? unlockNextMaps(current.unlockedMaps, mapId) : current.unlockedMaps;

  const next: SaveData = {
    ...current,
    runsPlayed: current.runsPlayed + 1,
    winCount: current.winCount + (stats.won ? 1 : 0),
    totalEnemiesKilled: current.totalEnemiesKilled + stats.enemiesKilled,
    totalDamage: current.totalDamage + stats.totalDamage,
    totalTimeMs: current.totalTimeMs + stats.timeSurvivedMs,
    bestWave: Math.max(current.bestWave, stats.wave),
    bestLevel: Math.max(current.bestLevel, stats.level),
    bestTimeMs: Math.max(current.bestTimeMs, stats.timeSurvivedMs),
    bestEnemies: Math.max(current.bestEnemies, stats.enemiesKilled),
    allTimeDamage: mergeDamage(current.allTimeDamage, stats.damageByWeapon),
    lastRun: stats,
    unlockedMaps,
    clearedMaps,
    lastMapId: mapId,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage quota or disabled — save skipped.
  }
  return next;
}

export function setLastMap(mapId: MapId): void {
  const current = loadSave();
  current.lastMapId = mapId;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function resetSave(): SaveData {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return cloneEmpty();
}

function cloneEmpty(): SaveData {
  return {
    ...EMPTY_SAVE,
    allTimeDamage: {},
    unlockedMaps: [...EMPTY_SAVE.unlockedMaps],
    clearedMaps: [],
  };
}

function unlockNextMaps(currentUnlocked: MapId[], justClearedMapId: MapId): MapId[] {
  const result = [...currentUnlocked];
  for (const id of MAP_ORDER) {
    if (MAP_DEFS[id].prerequisite === justClearedMapId && !result.includes(id)) {
      result.push(id);
    }
  }
  return result;
}

function addUnique(list: MapId[], id: MapId): MapId[] {
  return list.includes(id) ? list : [...list, id];
}

function mergeDamage(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = { ...a };
  for (const [weapon, amount] of Object.entries(b)) {
    merged[weapon] = (merged[weapon] ?? 0) + amount;
  }
  return merged;
}

function sanitizeMaps(value: MapId[] | undefined, fallback: MapId[]): MapId[] {
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((id): id is MapId => MAP_ORDER.includes(id as MapId));
}

function sanitizeMapId(value: MapId | undefined, fallback: MapId): MapId {
  return value && MAP_ORDER.includes(value) ? value : fallback;
}

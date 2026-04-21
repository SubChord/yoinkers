import type { EndStats } from "../types/GameTypes";

const STORAGE_KEY = "yoinkers.save.v1";

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
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_SAVE, allTimeDamage: {} };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...EMPTY_SAVE,
      ...parsed,
      allTimeDamage: { ...(parsed.allTimeDamage ?? {}) },
    };
  } catch {
    return { ...EMPTY_SAVE, allTimeDamage: {} };
  }
}

export function persistRun(stats: EndStats): SaveData {
  const current = loadSave();
  const next: SaveData = {
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
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage quota or disabled — save skipped.
  }
  return next;
}

export function resetSave(): SaveData {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { ...EMPTY_SAVE, allTimeDamage: {} };
}

function mergeDamage(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const merged: Record<string, number> = { ...a };
  for (const [weapon, amount] of Object.entries(b)) {
    merged[weapon] = (merged[weapon] ?? 0) + amount;
  }
  return merged;
}

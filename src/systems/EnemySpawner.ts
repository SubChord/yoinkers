import type { KAPLAYCtx } from "kaplay";
import {
  ENEMY_WAVE_BASE_COUNT,
  ENEMY_WAVE_GROWTH,
  SPAWN_MAX_RADIUS,
  SPAWN_MIN_RADIUS,
  WAVE_SCALING_FACTOR,
} from "../config/GameConfig";
import {
  availableEnemiesForWave,
  bossForWave,
  ENEMY_DEFS,
  type EnemyId,
} from "../config/EnemyDefs";
import { spawnEnemy, type Enemy, updateEnemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";

const STREAM_INTERVAL_MS = 2200;
const STREAM_INTERVAL_FLOOR_MS = 700;

export class EnemySpawner {
  public enemies: Enemy[] = [];
  private wave = 1;
  private lastStreamMs = 0;

  constructor(private k: KAPLAYCtx, private player: Player) {}

  public spawnWave(waveIndex: number): void {
    this.wave = waveIndex;
    const count = ENEMY_WAVE_BASE_COUNT + waveIndex * ENEMY_WAVE_GROWTH;
    const pool = availableEnemiesForWave(waveIndex);
    const waveScale = 1 + waveIndex * WAVE_SCALING_FACTOR;

    for (let i = 0; i < count; i += 1) {
      const id = pool[Math.floor(this.k.rand(0, pool.length))] ?? "slime";
      const elite = waveIndex >= 7 && this.k.rand(0, 1) < Math.min(0.4, 0.05 + waveIndex * 0.02);
      this.spawnAtRing(id, { elite, waveScale });
    }

    const bossId = bossForWave(waveIndex);
    if (bossId) {
      this.spawnAtRing(bossId, { waveScale });
    }
  }

  public update(dt: number, nowMs: number): void {
    for (const enemy of this.enemies) {
      updateEnemy(enemy, this.player, dt);
    }

    const interval = Math.max(
      STREAM_INTERVAL_FLOOR_MS,
      STREAM_INTERVAL_MS - this.wave * 60,
    );
    if (nowMs - this.lastStreamMs >= interval) {
      this.lastStreamMs = nowMs;
      this.streamEnemies();
    }
  }

  private streamEnemies(): void {
    const pool = availableEnemiesForWave(this.wave);
    const count = 2 + Math.floor(this.wave / 3);
    const waveScale = 1 + this.wave * WAVE_SCALING_FACTOR;
    for (let i = 0; i < count; i += 1) {
      const id = pool[Math.floor(this.k.rand(0, pool.length))] ?? "slime";
      const elite = this.wave >= 10 && this.k.rand(0, 1) < 0.08;
      this.spawnAtRing(id, { elite, waveScale });
    }
  }

  private spawnAtRing(id: EnemyId, opts: { elite?: boolean; waveScale?: number }): void {
    const angle = this.k.rand(0, Math.PI * 2);
    const distance = this.k.rand(SPAWN_MIN_RADIUS, SPAWN_MAX_RADIUS);
    const x = this.player.obj.pos.x + Math.cos(angle) * distance;
    const y = this.player.obj.pos.y + Math.sin(angle) * distance;
    const def = ENEMY_DEFS[id];
    const effectiveOpts = def.boss ? { waveScale: opts.waveScale } : opts;
    this.enemies.push(spawnEnemy(this.k, id, x, y, effectiveOpts));
  }

  public removeAt(index: number): Enemy {
    const [removed] = this.enemies.splice(index, 1);
    return removed;
  }

  public nearest(toX: number, toY: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD2 = Number.POSITIVE_INFINITY;
    for (const e of this.enemies) {
      const dx = e.obj.pos.x - toX;
      const dy = e.obj.pos.y - toY;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = e;
      }
    }
    return best;
  }
}

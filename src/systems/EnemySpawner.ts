import type { KAPLAYCtx } from "kaplay";
import {
  ENEMY_WAVE_BASE_COUNT,
  ENEMY_WAVE_GROWTH,
  SPAWN_MAX_RADIUS,
  SPAWN_MIN_RADIUS,
  WAVE_SCALING_FACTOR,
} from "../config/GameConfig";
import { ENEMY_IDS, type EnemyId } from "../config/EnemyDefs";
import { spawnEnemy, type Enemy, updateEnemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";

export class EnemySpawner {
  public enemies: Enemy[] = [];

  constructor(private k: KAPLAYCtx, private player: Player) {}

  public spawnWave(waveIndex: number): void {
    const count = ENEMY_WAVE_BASE_COUNT + waveIndex * ENEMY_WAVE_GROWTH;
    const scale = 1 + waveIndex * WAVE_SCALING_FACTOR;

    for (let i = 0; i < count; i += 1) {
      const id: EnemyId = ENEMY_IDS[Math.floor(this.k.rand(0, ENEMY_IDS.length))];
      const angle = this.k.rand(0, Math.PI * 2);
      const distance = this.k.rand(SPAWN_MIN_RADIUS, SPAWN_MAX_RADIUS);
      const x = this.player.obj.pos.x + Math.cos(angle) * distance;
      const y = this.player.obj.pos.y + Math.sin(angle) * distance;
      this.enemies.push(spawnEnemy(this.k, id, x, y, scale));
    }
  }

  public update(dt: number): void {
    for (const enemy of this.enemies) {
      updateEnemy(enemy, this.player, dt);
    }
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

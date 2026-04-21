import type { KAPLAYCtx } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import {
  applyGearStack,
  GEAR_DEFS,
  weightedRandomGear,
  type GearId,
} from "../config/GearDefs";
import type { Enemy } from "../entities/Enemy";
import { spawnGear, updateGearDrop, type GearDrop } from "../entities/Gear";
import type { Player } from "../entities/Player";
import { burstVfx, popLabel } from "./PickupVfx";

const WORLD_SPAWN_INTERVAL_MS = 60_000;
const MAX_ACTIVE = 4;
const BOSS_DROP_CHANCE = 1.0;
const ELITE_DROP_CHANCE = 0.1;
const BASIC_DROP_CHANCE = 0.005;
const POPUP_MS = 2000;

export class GearSystem {
  private drops: GearDrop[] = [];
  private nextWorldSpawnAt = 0;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private onPlaySfx: (key: string) => void,
    private onPickup: (id: GearId) => void = () => {},
  ) {
    this.nextWorldSpawnAt = Date.now() + 25_000;
  }

  public update(nowMs: number, dt: number): void {
    if (nowMs >= this.nextWorldSpawnAt && this.drops.length < MAX_ACTIVE) {
      this.spawnWorldDrop();
      this.nextWorldSpawnAt = nowMs + WORLD_SPAWN_INTERVAL_MS;
    }

    for (let i = this.drops.length - 1; i >= 0; i -= 1) {
      const drop = this.drops[i];
      if (updateGearDrop(drop, this.player, dt) === "collected") {
        this.applyAndAnnounce(drop.def.id, drop.obj.pos.x, drop.obj.pos.y);
        this.drops.splice(i, 1);
      }
    }
  }

  public onEnemyKilled(enemy: Enemy): void {
    if (enemy.isBoss) {
      if (this.k.rand(0, 1) < BOSS_DROP_CHANCE) {
        this.dropAt(enemy.obj.pos.x, enemy.obj.pos.y);
      }
      return;
    }
    const chance = enemy.isElite ? ELITE_DROP_CHANCE : BASIC_DROP_CHANCE;
    if (this.k.rand(0, 1) < chance) {
      this.dropAt(enemy.obj.pos.x, enemy.obj.pos.y);
    }
  }

  public dropAt(x: number, y: number, id?: GearId): void {
    const chosen = id ?? weightedRandomGear(() => this.k.rand(0, 1));
    this.drops.push(spawnGear(this.k, chosen, x, y));
  }

  private spawnWorldDrop(): void {
    const half = WORLD_SIZE / 2 - 40;
    const angle = this.k.rand(0, Math.PI * 2);
    const dist = this.k.rand(220, 520);
    let x = this.player.obj.pos.x + Math.cos(angle) * dist;
    let y = this.player.obj.pos.y + Math.sin(angle) * dist;
    x = Math.max(-half, Math.min(half, x));
    y = Math.max(-half, Math.min(half, y));
    this.dropAt(x, y);
  }

  private applyAndAnnounce(id: GearId, x: number, y: number): void {
    applyGearStack(this.player, id);
    this.player.stats.gear[id] = (this.player.stats.gear[id] ?? 0) + 1;
    this.onPlaySfx("sfx-levelup");
    this.onPickup(id);

    burstVfx(this.k, {
      x, y,
      color: [255, 230, 140],
      ringEnd: 44,
      sparkles: 10,
      duration: 0.4,
      shake: 3,
    });
    popLabel(this.k, {
      x, y,
      text: GEAR_DEFS[id].label,
      color: [255, 232, 140],
      durationMs: POPUP_MS,
      popScale: 1.8,
    });
  }
}

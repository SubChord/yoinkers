import type { KAPLAYCtx } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import { ITEM_DEFS, weightedRandomItem, type ItemDef, type ItemId } from "../config/ItemDefs";
import type { Enemy } from "../entities/Enemy";
import { spawnItem, updateItem, type Item } from "../entities/Item";
import type { Player } from "../entities/Player";
import type { EnemySpawner } from "./EnemySpawner";
import { burstVfx, popLabel } from "./PickupVfx";

const WORLD_SPAWN_INTERVAL_MS = 14_000;
const MAX_ACTIVE_ITEMS = 10;
const BASIC_DROP_CHANCE = 0.03;
const ELITE_DROP_CHANCE = 0.18;
const POPUP_MS = 1500;
const WASTED_ITEM_XP = 40;

export class ItemSystem {
  public items: Item[] = [];
  private nextWorldSpawnAt = 0;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private spawner: EnemySpawner,
    private onPlaySfx: (key: string) => void,
    private onPickup: () => void = () => {},
    private onKill: (enemy: Enemy, index: number) => void = () => {},
  ) {
    this.nextWorldSpawnAt = Date.now() + 6_000;
  }

  public update(nowMs: number, dt: number): void {
    if (nowMs >= this.nextWorldSpawnAt && this.items.length < MAX_ACTIVE_ITEMS) {
      this.spawnWorldItem();
      this.nextWorldSpawnAt = nowMs + WORLD_SPAWN_INTERVAL_MS;
    }

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const item = this.items[i];
      if (updateItem(item, this.player, dt) === "collected") {
        this.applyEffect(item.def, item.obj.pos.x, item.obj.pos.y);
        this.items.splice(i, 1);
      }
    }
  }

  public onEnemyKilled(enemy: Enemy, isElite: boolean): void {
    if (enemy.isBoss) {
      const bossDrops = 2 + Math.floor(this.k.rand(0, 2));
      for (let i = 0; i < bossDrops; i += 1) {
        this.dropItem(
          enemy.obj.pos.x + this.k.rand(-20, 20),
          enemy.obj.pos.y + this.k.rand(-20, 20),
        );
      }
      return;
    }

    const chance = isElite ? ELITE_DROP_CHANCE : BASIC_DROP_CHANCE;
    if (this.k.rand(0, 1) < chance) {
      this.dropItem(enemy.obj.pos.x, enemy.obj.pos.y);
    }
  }

  private dropItem(x: number, y: number): void {
    const id = weightedRandomItem(() => this.k.rand(0, 1));
    this.items.push(spawnItem(this.k, id, x, y));
  }

  private spawnWorldItem(): void {
    const half = WORLD_SIZE / 2 - 40;
    const angle = this.k.rand(0, Math.PI * 2);
    const dist = this.k.rand(160, 420);
    let x = this.player.obj.pos.x + Math.cos(angle) * dist;
    let y = this.player.obj.pos.y + Math.sin(angle) * dist;
    x = Math.max(-half, Math.min(half, x));
    y = Math.max(-half, Math.min(half, y));
    this.dropItem(x, y);
  }

  private applyEffect(def: ItemDef, x: number, y: number): void {
    this.onPlaySfx("sfx-gem");
    this.onPickup();

    burstVfx(this.k, {
      x, y,
      color: [246, 238, 180],
      ringEnd: 32,
      sparkles: 7,
      shake: 2,
    });
    popLabel(this.k, {
      x, y, text: def.pickupText,
      color: [246, 238, 180],
      durationMs: POPUP_MS,
    });

    const now = Date.now();
    const stats = this.player.stats;

    // If the item would have no effect, convert it to XP instead
    if (this.isWasted(def)) {
      const xpGain = WASTED_ITEM_XP;
      stats.xp += xpGain;
      popLabel(this.k, {
        x, y, text: `+${xpGain} XP`,
        color: [130, 200, 255],
        durationMs: POPUP_MS,
      });
      return;
    }

    switch (def.effect.kind) {
      case "heal":
        stats.hp = Math.min(stats.maxHp, stats.hp + def.effect.amount);
        break;
      case "heal-full":
        stats.hp = stats.maxHp;
        break;
      case "maxhp":
        stats.maxHp += def.effect.amount;
        stats.hp = stats.maxHp;
        break;
      case "buff-damage":
        stats.damageBuffMult = def.effect.mult;
        stats.damageBuffExpiresMs = now + def.effect.durationMs;
        break;
      case "buff-speed":
        stats.speedBuffMult = def.effect.mult;
        stats.speedBuffExpiresMs = now + def.effect.durationMs;
        break;
      case "nuke":
        this.nukeAll(def.effect.damage);
        this.k.shake(10);
        break;
      case "slow-all":
        this.slowAll(def.effect.mult, def.effect.durationMs);
        break;
      case "xp":
        stats.xp += def.effect.amount;
        break;
      case "equip-active":
        stats.activeItem = def.effect.activeItemId;
        stats.activeItemCooldownMs = 0;
        break;
    }
  }

  private isWasted(def: ItemDef): boolean {
    const stats = this.player.stats;
    switch (def.effect.kind) {
      case "heal":
      case "heal-full":
        return stats.hp >= stats.maxHp;
      default:
        return false;
    }
  }

  private nukeAll(damage: number): void {
    for (let i = this.spawner.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.spawner.enemies[i];
      enemy.hp -= damage;
      if (enemy.hp <= 0) {
        this.onKill(enemy, i);
      }
    }
  }

  private slowAll(mult: number, durationMs: number): void {
    const expires = Date.now() + durationMs;
    for (const enemy of this.spawner.enemies) {
      enemy.slowMult = mult;
      enemy.slowExpiresMs = expires;
    }
  }

  public knownItemIds(): ItemId[] {
    return Object.keys(ITEM_DEFS) as ItemId[];
  }
}

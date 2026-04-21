import type { KAPLAYCtx } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import { spawnChest, updateChest, applyLoot, rollLoot, lootLabel, type Chest, type LootKind } from "../entities/Chest";
import type { Player } from "../entities/Player";
import { burstVfx, popLabel } from "./PickupVfx";

const CHEST_SPAWN_INTERVAL_MS = 18_000;
const CHEST_MIN_SPAWN_DISTANCE = 220;
const CHEST_MAX_SPAWN_DISTANCE = 520;
const MAX_ACTIVE_CHESTS = 6;
const LOOT_POPUP_DURATION_MS = 1800;

export class ChestSystem {
  public chests: Chest[] = [];
  private nextSpawnAt = 0;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private onPlaySfx: (key: string) => void,
    private onOpen: () => void = () => {},
  ) {
    this.nextSpawnAt = Date.now() + 4_000;
  }

  public update(nowMs: number, dt: number): void {
    if (nowMs >= this.nextSpawnAt && this.chests.length < MAX_ACTIVE_CHESTS) {
      this.spawnChestNearPlayer();
      this.nextSpawnAt = nowMs + CHEST_SPAWN_INTERVAL_MS;
    }

    for (let i = this.chests.length - 1; i >= 0; i -= 1) {
      const chest = this.chests[i];
      if (updateChest(chest, this.player, dt)) {
        const loot = rollLoot(() => this.k.rand(0, 1));
        applyLoot(this.player, loot);

        const cx = chest.obj.pos.x;
        const cy = chest.obj.pos.y;
        burstVfx(this.k, {
          x: cx, y: cy,
          color: [255, 236, 160],
          ringEnd: 48,
          sparkles: 12,
          duration: 0.45,
          shake: 4,
        });
        popLabel(this.k, {
          x: cx, y: cy,
          text: lootLabel(loot),
          color: [255, 236, 160],
          durationMs: LOOT_POPUP_DURATION_MS,
          popScale: 2.0,
        });

        this.onPlaySfx("sfx-gem");
        this.onOpen();
        this.k.wait(0.3, () => {
          chest.obj.destroy();
        });
        this.chests.splice(i, 1);
      }
    }
  }

  private spawnChestNearPlayer(): void {
    const half = WORLD_SIZE / 2 - 40;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const angle = this.k.rand(0, Math.PI * 2);
      const dist = this.k.rand(CHEST_MIN_SPAWN_DISTANCE, CHEST_MAX_SPAWN_DISTANCE);
      const x = this.player.obj.pos.x + Math.cos(angle) * dist;
      const y = this.player.obj.pos.y + Math.sin(angle) * dist;
      if (Math.abs(x) > half || Math.abs(y) > half) continue;
      this.chests.push(spawnChest(this.k, x, y));
      return;
    }
  }

}

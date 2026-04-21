import type { KAPLAYCtx, GameObj } from "kaplay";
import { BASE_GEM_MAGNET_RANGE, BASE_PICKUP_RANGE } from "../config/GameConfig";
import { ITEM_DEFS, type ItemDef, type ItemId } from "../config/ItemDefs";
import type { Player } from "./Player";

export interface Item {
  obj: GameObj;
  def: ItemDef;
  baseY: number;
  bobT: number;
}

export function spawnItem(k: KAPLAYCtx, id: ItemId, x: number, y: number): Item {
  const def = ITEM_DEFS[id];
  const obj = k.add([
    k.sprite(def.spriteKey),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(2),
    k.z(4),
  ]);
  return { obj, def, baseY: y, bobT: Math.random() * Math.PI * 2 };
}

export function updateItem(
  item: Item,
  player: Player,
  dt: number,
): "idle" | "collected" {
  item.bobT += dt * 3;
  item.obj.pos.y = item.baseY + Math.sin(item.bobT) * 3;

  const dx = player.obj.pos.x - item.obj.pos.x;
  const dy = player.obj.pos.y - item.obj.pos.y;
  const dist = Math.hypot(dx, dy);
  const magnetRange = BASE_GEM_MAGNET_RANGE * player.stats.magnetMult * 0.85;

  if (dist < magnetRange) {
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    item.obj.pos.x += nx * 220 * dt;
    item.baseY += ny * 220 * dt;
  }

  if (dist < BASE_PICKUP_RANGE + 6) {
    item.obj.destroy();
    return "collected";
  }

  return "idle";
}

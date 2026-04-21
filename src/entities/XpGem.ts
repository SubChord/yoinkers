import type { KAPLAYCtx, GameObj } from "kaplay";
import { BASE_GEM_MAGNET_RANGE, BASE_PICKUP_RANGE } from "../config/GameConfig";
import type { Player } from "./Player";

export interface XpGem {
  obj: GameObj;
  xpValue: number;
}

export function spawnXpGem(k: KAPLAYCtx, x: number, y: number, xpValue: number): XpGem {
  const obj = k.add([
    k.sprite("gem"),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(2),
    k.z(3),
  ]);
  return { obj, xpValue };
}

export function updateGem(
  gem: XpGem,
  player: Player,
  dt: number,
): "idle" | "collected" {
  const dx = player.obj.pos.x - gem.obj.pos.x;
  const dy = player.obj.pos.y - gem.obj.pos.y;
  const dist = Math.hypot(dx, dy);
  const magnetRange = BASE_GEM_MAGNET_RANGE * player.stats.magnetMult;

  if (dist < magnetRange) {
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    gem.obj.pos.x += nx * 260 * dt;
    gem.obj.pos.y += ny * 260 * dt;
  }

  if (dist < BASE_PICKUP_RANGE) {
    player.stats.xp += gem.xpValue;
    gem.obj.destroy();
    return "collected";
  }

  return "idle";
}

import type { KAPLAYCtx, GameObj } from "kaplay";
import { BASE_GEM_MAGNET_RANGE, BASE_PICKUP_RANGE } from "../config/GameConfig";
import { GEAR_DEFS, type GearDef, type GearId } from "../config/GearDefs";
import type { Player } from "./Player";

export interface GearDrop {
  obj: GameObj;
  def: GearDef;
  baseY: number;
  bobT: number;
  glow: GameObj;
}

export function spawnGear(k: KAPLAYCtx, id: GearId, x: number, y: number): GearDrop {
  const def = GEAR_DEFS[id];

  const glow = k.add([
    k.circle(18),
    k.pos(x, y),
    k.anchor("center"),
    k.color(255, 230, 140),
    k.opacity(0.35),
    k.z(3),
  ]);

  const baseScale = def.id === "patrick" ? 1.1 : 2.2;
  const obj = k.add([
    k.sprite(def.spriteKey),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(baseScale),
    k.z(4),
  ]);

  return { obj, def, baseY: y, bobT: Math.random() * Math.PI * 2, glow };
}

export function updateGearDrop(
  drop: GearDrop,
  player: Player,
  dt: number,
): "idle" | "collected" {
  drop.bobT += dt * 3;
  const bob = Math.sin(drop.bobT) * 4;
  drop.obj.pos.y = drop.baseY + bob;
  drop.glow.pos.y = drop.baseY + bob;
  drop.glow.pos.x = drop.obj.pos.x;
  (drop.glow as unknown as { opacity: number }).opacity = 0.25 + 0.2 * Math.sin(drop.bobT * 2);

  const dx = player.obj.pos.x - drop.obj.pos.x;
  const dy = player.obj.pos.y - drop.obj.pos.y;
  const dist = Math.hypot(dx, dy);
  const magnetRange = BASE_GEM_MAGNET_RANGE * player.stats.magnetMult * 0.8;

  if (dist < magnetRange) {
    const playerSpeed = player.stats.speed * (player.stats.speedBuffMult ?? 1);
    const closeness = 1 - dist / magnetRange;
    const flySpeed = Math.max(600, playerSpeed * 3) * (0.4 + 0.6 * closeness);
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    drop.obj.pos.x += nx * flySpeed * dt;
    drop.baseY += ny * flySpeed * dt;
  }

  // Recalculate distance after magnet movement for accurate pickup detection
  const dx2 = player.obj.pos.x - drop.obj.pos.x;
  const dy2 = player.obj.pos.y - drop.baseY;
  const dist2 = Math.hypot(dx2, dy2);

  if (dist2 < BASE_PICKUP_RANGE + 8) {
    drop.obj.destroy();
    drop.glow.destroy();
    return "collected";
  }
  return "idle";
}

import type { KAPLAYCtx, GameObj } from "kaplay";
import type { Player } from "./Player";

export interface Chest {
  obj: GameObj;
  opened: boolean;
  pulseT: number;
}

export function spawnChest(k: KAPLAYCtx, x: number, y: number): Chest {
  const obj = k.add([
    k.sprite("chest", { frame: 0 }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(2),
    k.z(3),
  ]);
  return { obj, opened: false, pulseT: 0 };
}

export function updateChest(chest: Chest, player: Player, dt: number): boolean {
  chest.pulseT += dt;

  const scaleObj = chest.obj as unknown as { scale: { x: number; y: number } };
  if (!chest.opened) {
    const pulse = 1 + Math.sin(chest.pulseT * 4) * 0.05;
    scaleObj.scale.x = 2 * pulse;
    scaleObj.scale.y = 2 * pulse;
  }

  if (chest.opened) return false;

  const dx = player.obj.pos.x - chest.obj.pos.x;
  const dy = player.obj.pos.y - chest.obj.pos.y;
  if (dx * dx + dy * dy < 28 * 28) {
    chest.opened = true;
    (chest.obj as unknown as { frame: number }).frame = 1;
    scaleObj.scale.x = 2;
    scaleObj.scale.y = 2;
    return true;
  }
  return false;
}

export type LootKind =
  | { kind: "heal"; amount: number }
  | { kind: "xp"; amount: number }
  | { kind: "maxHp"; amount: number }
  | { kind: "speed"; mult: number }
  | { kind: "damage"; mult: number }
  | { kind: "magnet"; mult: number }
  | { kind: "cooldown"; mult: number };

export function rollLoot(rand: () => number): LootKind {
  const r = rand();
  if (r < 0.35) return { kind: "heal", amount: 40 };
  if (r < 0.6) return { kind: "xp", amount: 60 };
  if (r < 0.72) return { kind: "maxHp", amount: 15 };
  if (r < 0.82) return { kind: "speed", mult: 1.05 };
  if (r < 0.9) return { kind: "damage", mult: 1.08 };
  if (r < 0.96) return { kind: "magnet", mult: 1.25 };
  return { kind: "cooldown", mult: 0.94 };
}

export function lootLabel(loot: LootKind): string {
  switch (loot.kind) {
    case "heal":
      return `+${loot.amount} HP`;
    case "xp":
      return `+${loot.amount} XP`;
    case "maxHp":
      return `+${loot.amount} Max HP`;
    case "speed":
      return `+${Math.round((loot.mult - 1) * 100)}% Speed`;
    case "damage":
      return `+${Math.round((loot.mult - 1) * 100)}% Damage`;
    case "magnet":
      return `+${Math.round((loot.mult - 1) * 100)}% Magnet`;
    case "cooldown":
      return `-${Math.round((1 - loot.mult) * 100)}% Cooldown`;
  }
}

export function applyLoot(player: Player, loot: LootKind): void {
  switch (loot.kind) {
    case "heal":
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + loot.amount);
      break;
    case "xp":
      player.stats.xp += loot.amount;
      break;
    case "maxHp":
      player.stats.maxHp += loot.amount;
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + loot.amount);
      break;
    case "speed":
      player.stats.speed *= loot.mult;
      break;
    case "damage":
      player.stats.damageMult *= loot.mult;
      break;
    case "magnet":
      player.stats.magnetMult *= loot.mult;
      break;
    case "cooldown":
      player.stats.cooldownMult *= loot.mult;
      break;
  }
}

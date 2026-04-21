import type { KAPLAYCtx, GameObj } from "kaplay";
import { ENEMY_DEFS, type EnemyDef, type EnemyId } from "../config/EnemyDefs";
import type { Player } from "./Player";

export interface Enemy {
  obj: GameObj;
  hp: number;
  speed: number;
  damage: number;
  xpValue: number;
  area: number;
  typeId: EnemyId;
  facing: "left" | "right";
}

export function spawnEnemy(
  k: KAPLAYCtx,
  defId: EnemyId,
  x: number,
  y: number,
  scale: number,
): Enemy {
  const def: EnemyDef = ENEMY_DEFS[defId];

  const obj = k.add([
    k.sprite(def.spriteKey, { frame: 0, anim: "walk-down" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(2),
    k.z(5),
  ]);

  return {
    obj,
    hp: Math.floor(def.hp * scale),
    speed: def.speed * scale,
    damage: def.damage,
    xpValue: def.xpValue,
    area: def.area,
    typeId: def.id,
    facing: "right",
  };
}

export function updateEnemy(enemy: Enemy, player: Player, dt: number): void {
  const dx = player.obj.pos.x - enemy.obj.pos.x;
  const dy = player.obj.pos.y - enemy.obj.pos.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;

  enemy.obj.pos.x += nx * enemy.speed * dt;
  enemy.obj.pos.y += ny * enemy.speed * dt;

  const nextFacing: "left" | "right" = nx < 0 ? "left" : "right";
  if (nextFacing !== enemy.facing) {
    enemy.facing = nextFacing;
    const go = enemy.obj as GameObj & { flipX?: boolean };
    go.flipX = nextFacing === "left";
  }

  const desired = Math.abs(ny) > Math.abs(nx)
    ? (ny < 0 ? "walk-up" : "walk-down")
    : "walk-down";
  const current = (enemy.obj as GameObj & { curAnim?: () => string | null }).curAnim?.();
  if (current !== desired) {
    (enemy.obj as GameObj & { play: (key: string) => void }).play(desired);
  }
}

export function destroyEnemy(enemy: Enemy): void {
  enemy.obj.destroy();
}

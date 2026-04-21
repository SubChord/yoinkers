import type { KAPLAYCtx, GameObj } from "kaplay";
import { ENEMY_DEFS, type EnemyDef, type EnemyId } from "../config/EnemyDefs";
import type { Player } from "./Player";

export interface Enemy {
  obj: GameObj;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  area: number;
  typeId: EnemyId;
  isBoss: boolean;
  isElite: boolean;
  facing: "left" | "right";
  slowMult: number;
  slowExpiresMs: number;
}

export interface SpawnOpts {
  elite?: boolean;
  waveScale?: number;
}

export function spawnEnemy(
  k: KAPLAYCtx,
  defId: EnemyId,
  x: number,
  y: number,
  opts: SpawnOpts = {},
): Enemy {
  const def: EnemyDef = ENEMY_DEFS[defId];
  const waveScale = opts.waveScale ?? 1;
  const eliteHp = opts.elite ? 2.2 : 1;
  const eliteDmg = opts.elite ? 1.4 : 1;
  const eliteSpeed = opts.elite ? 1.1 : 1;
  const visualScale = 2 * def.scale * (opts.elite ? 1.15 : 1);

  const comps: Parameters<typeof k.add>[0] = [
    k.sprite(def.spriteKey, { frame: 0, anim: "walk-down" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(visualScale),
    k.z(def.boss ? 6 : 5),
  ];

  if (def.tint) {
    comps.push(k.color(def.tint[0], def.tint[1], def.tint[2]));
  } else if (opts.elite) {
    comps.push(k.color(255, 150, 150));
  }

  const obj = k.add(comps);

  const hp = Math.floor(def.hp * waveScale * eliteHp);
  return {
    obj,
    hp,
    maxHp: hp,
    speed: def.speed * waveScale * eliteSpeed,
    damage: Math.floor(def.damage * eliteDmg),
    xpValue: Math.floor(def.xpValue * (opts.elite ? 1.8 : 1)),
    area: def.area,
    typeId: def.id,
    isBoss: def.boss,
    isElite: !!opts.elite,
    facing: "right",
    slowMult: 1,
    slowExpiresMs: 0,
  };
}

export function updateEnemy(enemy: Enemy, player: Player, dt: number): void {
  if (enemy.slowExpiresMs && Date.now() >= enemy.slowExpiresMs) {
    enemy.slowMult = 1;
    enemy.slowExpiresMs = 0;
  }

  const dx = player.obj.pos.x - enemy.obj.pos.x;
  const dy = player.obj.pos.y - enemy.obj.pos.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;

  const effectiveSpeed = enemy.speed * enemy.slowMult;
  enemy.obj.pos.x += nx * effectiveSpeed * dt;
  enemy.obj.pos.y += ny * effectiveSpeed * dt;

  const nextFacing: "left" | "right" = nx < 0 ? "left" : "right";
  if (nextFacing !== enemy.facing) {
    enemy.facing = nextFacing;
    (enemy.obj as GameObj & { flipX?: boolean }).flipX = nextFacing === "left";
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

/**
 * Play a small death animation: flash white, shrink + spin, fade out, then destroy.
 */
export function playDeathAnim(k: KAPLAYCtx, enemy: Enemy): void {
  const obj = enemy.obj;
  const startScale = (obj as any).scale?.x ?? 2;
  let t = 0;
  const dur = 0.3;

  // flash white on death
  try {
    (obj as any).color = k.rgb(255, 255, 255);
  } catch { /* no color comp — skip */ }

  obj.onUpdate(() => {
    t += k.dt();
    const p = Math.min(t / dur, 1);

    // shrink
    const s = startScale * (1 - p * 0.8);
    (obj as any).scale = k.vec2(s, s);

    // spin
    (obj as any).angle = ((obj as any).angle ?? 0) + k.dt() * 600;

    // fade out
    (obj as any).opacity = 1 - p;

    if (p >= 1) obj.destroy();
  });
}

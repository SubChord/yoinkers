import type { KAPLAYCtx, GameObj } from "kaplay";
import { ENEMY_DAMAGE_SCALE_RATIO } from "../config/GameConfig";
import { ENEMY_DEFS, type EnemyDef, type EnemyId } from "../config/EnemyDefs";
import type { Player } from "./Player";

export interface LeaperState {
  phase: "approach" | "telegraph" | "lunge";
  timer: number;
  targetX: number;
  targetY: number;
}

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
  leaper?: LeaperState;
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
  const damageWaveScale = 1 + (waveScale - 1) * ENEMY_DAMAGE_SCALE_RATIO;
  const enemy: Enemy = {
    obj,
    hp,
    maxHp: hp,
    speed: def.speed * waveScale * eliteSpeed,
    damage: Math.floor(def.damage * eliteDmg * damageWaveScale),
    xpValue: Math.floor(def.xpValue * (opts.elite ? 1.8 : 1)),
    area: def.area,
    typeId: def.id,
    isBoss: def.boss,
    isElite: !!opts.elite,
    facing: "right",
    slowMult: 1,
    slowExpiresMs: 0,
  };

  if (defId === "leaper") {
    enemy.leaper = { phase: "approach", timer: 0, targetX: 0, targetY: 0 };
  }

  return enemy;
}

export type EnemyEvent = "none" | "explode";

const LEAPER_LUNGE_RANGE = 340;
const LEAPER_TELEGRAPH_S = 0.85;
const LEAPER_LUNGE_SPEED = 580;
const LEAPER_LUNGE_MAX_S = 0.8;

export function updateEnemy(enemy: Enemy, player: Player, dt: number): EnemyEvent {
  if (enemy.slowExpiresMs && Date.now() >= enemy.slowExpiresMs) {
    enemy.slowMult = 1;
    enemy.slowExpiresMs = 0;
  }

  if (enemy.leaper) {
    return updateLeaper(enemy, player, dt);
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
  return "none";
}

function updateLeaper(enemy: Enemy, player: Player, dt: number): EnemyEvent {
  const lp = enemy.leaper!;
  const dx = player.obj.pos.x - enemy.obj.pos.x;
  const dy = player.obj.pos.y - enemy.obj.pos.y;
  const dist = Math.hypot(dx, dy) || 1;

  switch (lp.phase) {
    case "approach": {
      // Walk toward player slowly
      const nx = dx / dist;
      const ny = dy / dist;
      const spd = enemy.speed * enemy.slowMult;
      enemy.obj.pos.x += nx * spd * dt;
      enemy.obj.pos.y += ny * spd * dt;

      // Face player
      const face: "left" | "right" = nx < 0 ? "left" : "right";
      if (face !== enemy.facing) {
        enemy.facing = face;
        (enemy.obj as any).flipX = face === "left";
      }

      // When close enough, start telegraph
      if (dist < LEAPER_LUNGE_RANGE) {
        lp.phase = "telegraph";
        lp.timer = 0;
        lp.targetX = player.obj.pos.x;
        lp.targetY = player.obj.pos.y;
      }
      return "none";
    }

    case "telegraph": {
      // Stand still, flash red rapidly as warning
      lp.timer += dt;
      const flash = Math.sin(lp.timer * 30) > 0;
      try {
        (enemy.obj as any).color = flash
          ? { r: 255, g: 50, b: 50 }
          : { r: 80, g: 220, b: 80 };
      } catch { /* skip */ }

      // Pulsing scale as visual cue
      const pulse = 1 + Math.sin(lp.timer * 20) * 0.15;
      const baseScale = (enemy.obj as any).scale?.x ?? 2;
      try { (enemy.obj as any).scaleTo(baseScale > 3 ? baseScale : 2.2 * pulse); } catch { /* skip */ }

      // Lock target to player's current position (tracks until lunge)
      lp.targetX = player.obj.pos.x;
      lp.targetY = player.obj.pos.y;

      if (lp.timer >= LEAPER_TELEGRAPH_S) {
        lp.phase = "lunge";
        lp.timer = 0;
        // Restore tint
        try { (enemy.obj as any).color = { r: 80, g: 220, b: 80 }; } catch { /* skip */ }
        try { (enemy.obj as any).scaleTo(2.2); } catch { /* skip */ }
      }
      return "none";
    }

    case "lunge": {
      lp.timer += dt;
      const tx = lp.targetX - enemy.obj.pos.x;
      const ty = lp.targetY - enemy.obj.pos.y;
      const tDist = Math.hypot(tx, ty);

      if (tDist < 20 || lp.timer >= LEAPER_LUNGE_MAX_S) {
        return "explode";
      }

      // Fly toward locked target
      const nx = tx / tDist;
      const ny = ty / tDist;
      enemy.obj.pos.x += nx * LEAPER_LUNGE_SPEED * dt;
      enemy.obj.pos.y += ny * LEAPER_LUNGE_SPEED * dt;

      // Spin while lunging
      (enemy.obj as any).angle = ((enemy.obj as any).angle ?? 0) + dt * 900;
      return "none";
    }
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
    (obj as any).scaleTo(s);

    // spin
    (obj as any).angle = ((obj as any).angle ?? 0) + k.dt() * 600;

    // fade out
    (obj as any).opacity = 1 - p;

    if (p >= 1) obj.destroy();
  });
}

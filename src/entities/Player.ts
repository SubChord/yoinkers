import type { KAPLAYCtx, GameObj } from "kaplay";
import { PLAYER_BASE_HP, PLAYER_BASE_SPEED, WORLD_SIZE } from "../config/GameConfig";
import type { Facing, PlayerStats } from "../types/GameTypes";

export interface Player {
  obj: GameObj;
  stats: PlayerStats;
  facing: Facing;
  lastHitMs: number;
  regenCarry: number;
}

export function createPlayer(k: KAPLAYCtx): Player {
  const obj = k.add([
    k.sprite("player-walk", { frame: 0, anim: "idle-down" }),
    k.pos(0, 0),
    k.anchor("center"),
    k.scale(2),
    k.z(10),
  ]);

  const stats: PlayerStats = {
    hp: PLAYER_BASE_HP,
    maxHp: PLAYER_BASE_HP,
    speed: PLAYER_BASE_SPEED,
    xp: 0,
    level: 0,
    regenPerSec: 0,
    magnetMult: 1,
    damageMult: 1,
    cooldownMult: 1,
    xpMult: 1,
    damageBuffMult: 1,
    speedBuffMult: 1,
    damageBuffExpiresMs: 0,
    speedBuffExpiresMs: 0,
    weapons: ["shuriken"],
    upgrades: {},
    gear: {},
  };

  return {
    obj,
    stats,
    facing: "down",
    lastHitMs: -1000,
    regenCarry: 0,
  };
}

export function updatePlayer(k: KAPLAYCtx, player: Player, dt: number): void {
  const dir = k.vec2(0, 0);
  if (k.isButtonDown("left")) dir.x -= 1;
  if (k.isButtonDown("right")) dir.x += 1;
  if (k.isButtonDown("up")) dir.y -= 1;
  if (k.isButtonDown("down")) dir.y += 1;

  const moving = dir.x !== 0 || dir.y !== 0;

  const now = Date.now();
  if (player.stats.damageBuffExpiresMs && now >= player.stats.damageBuffExpiresMs) {
    player.stats.damageBuffMult = 1;
    player.stats.damageBuffExpiresMs = 0;
  }
  if (player.stats.speedBuffExpiresMs && now >= player.stats.speedBuffExpiresMs) {
    player.stats.speedBuffMult = 1;
    player.stats.speedBuffExpiresMs = 0;
  }

  if (moving) {
    const effectiveSpeed = player.stats.speed * player.stats.speedBuffMult;
    const step = dir.unit().scale(effectiveSpeed * dt);
    const p = player.obj.pos.add(step);
    p.x = k.clamp(p.x, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
    p.y = k.clamp(p.y, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
    player.obj.pos = p;

    if (Math.abs(dir.x) > Math.abs(dir.y)) {
      player.facing = dir.x < 0 ? "left" : "right";
    } else {
      player.facing = dir.y < 0 ? "up" : "down";
    }
  }

  applyAnimation(player, moving);

  if (player.stats.regenPerSec > 0 && player.stats.hp < player.stats.maxHp) {
    player.regenCarry += player.stats.regenPerSec * dt;
    if (player.regenCarry >= 1) {
      const heal = Math.floor(player.regenCarry);
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + heal);
      player.regenCarry -= heal;
    }
  }
}

function applyAnimation(player: Player, moving: boolean): void {
  const prefix = moving ? "walk" : "idle";
  const animKey = `${prefix}-${player.facing}`;
  const current = (player.obj as GameObj & { curAnim?: () => string | null }).curAnim?.();
  if (current !== animKey) {
    (player.obj as GameObj & { play: (key: string) => void }).play(animKey);
  }
}

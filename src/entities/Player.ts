import type { KAPLAYCtx, GameObj } from "kaplay";
import { PLAYER_BASE_HP, PLAYER_BASE_SPEED, WORLD_SIZE } from "../config/GameConfig";
import type { WeaponId } from "../config/WeaponDefs";
import { getMobileInput } from "../systems/MobileInput";
import type { CharacterId, Facing, PlayerStats } from "../types/GameTypes";

const CHARACTER_SPRITES: Record<CharacterId, string> = {
  ninja: "player-walk",
  jesus: "jesus-walk",
};

const CHARACTER_STARTING_WEAPONS: Record<CharacterId, WeaponId> = {
  ninja: "shuriken",
  jesus: "holyBeam",
};

export interface Player {
  obj: GameObj;
  stats: PlayerStats;
  facing: Facing;
  lastHitMs: number;
  regenCarry: number;
  animTimer: number;
}

export function createPlayer(k: KAPLAYCtx, character: CharacterId = "ninja"): Player {
  const obj = k.add([
    k.sprite(CHARACTER_SPRITES[character], { frame: 0 }),
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
    activeItem: null,
    activeItemCooldownMs: 0,
    weapons: [CHARACTER_STARTING_WEAPONS[character]],
    upgrades: {},
    gear: {},
  };

  return {
    obj,
    stats,
    facing: "down",
    lastHitMs: -1000,
    regenCarry: 0,
    animTimer: 0,
  };
}

export function updatePlayer(k: KAPLAYCtx, player: Player, dt: number): void {
  const dir = k.vec2(0, 0);
  if (k.isButtonDown("left")) dir.x -= 1;
  if (k.isButtonDown("right")) dir.x += 1;
  if (k.isButtonDown("up")) dir.y -= 1;
  if (k.isButtonDown("down")) dir.y += 1;

  const mobile = getMobileInput();
  const useMobile = mobile.active && (mobile.dirX !== 0 || mobile.dirY !== 0);
  const moveX = useMobile ? mobile.dirX : dir.x;
  const moveY = useMobile ? mobile.dirY : dir.y;
  const moving = moveX !== 0 || moveY !== 0;

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
    let stepX: number;
    let stepY: number;
    if (useMobile) {
      const mag = Math.min(1, Math.hypot(moveX, moveY));
      stepX = moveX * effectiveSpeed * dt;
      stepY = moveY * effectiveSpeed * dt;
      void mag;
    } else {
      const step = k.vec2(moveX, moveY).unit().scale(effectiveSpeed * dt);
      stepX = step.x;
      stepY = step.y;
    }
    const px = k.clamp(player.obj.pos.x + stepX, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
    const py = k.clamp(player.obj.pos.y + stepY, -WORLD_SIZE / 2 + 24, WORLD_SIZE / 2 - 24);
    player.obj.pos.x = px;
    player.obj.pos.y = py;

    if (Math.abs(moveX) > Math.abs(moveY)) {
      player.facing = moveX < 0 ? "left" : "right";
    } else if (Math.abs(moveY) > Math.abs(moveX)) {
      player.facing = moveY < 0 ? "up" : "down";
    }
    // on exact diagonal, keep the current facing
  }

  applyAnimation(player, moving, dt);

  if (player.stats.regenPerSec > 0 && player.stats.hp < player.stats.maxHp) {
    player.regenCarry += player.stats.regenPerSec * dt;
    if (player.regenCarry >= 1) {
      const heal = Math.floor(player.regenCarry);
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + heal);
      player.regenCarry -= heal;
    }
  }
}

// First frame of each row in the 4x4 walk spritesheet
const FACING_ROW: Record<Facing, number> = {
  down: 0,
  up: 4,
  left: 8,
  right: 12,
};

const WALK_FPS = 8;
const WALK_FRAMES = 4;

function applyAnimation(player: Player, moving: boolean, dt: number): void {
  const row = FACING_ROW[player.facing];
  if (moving) {
    player.animTimer += dt * WALK_FPS;
    const frameIndex = Math.floor(player.animTimer) % WALK_FRAMES;
    (player.obj as any).frame = row + frameIndex;
  } else {
    player.animTimer = 0;
    (player.obj as any).frame = row;
  }
}

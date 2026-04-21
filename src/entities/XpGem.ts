import type { KAPLAYCtx, GameObj } from "kaplay";
import { BASE_GEM_MAGNET_RANGE, BASE_PICKUP_RANGE } from "../config/GameConfig";
import type { Player } from "./Player";

export type GemTier = "small" | "medium" | "large" | "huge";

export interface XpGem {
  obj: GameObj;
  xpValue: number;
  tier: GemTier;
}

interface TierConfig {
  sprite: string;
  scale: number;
}

const TIER_CONFIG: Record<GemTier, TierConfig> = {
  small: { sprite: "gem-small", scale: 1.5 },
  medium: { sprite: "gem-medium", scale: 1.9 },
  large: { sprite: "gem-large", scale: 2.2 },
  huge: { sprite: "gem-huge", scale: 2.6 },
};

export function tierFor(xpValue: number): GemTier {
  if (xpValue >= 60) return "huge";
  if (xpValue >= 18) return "large";
  if (xpValue >= 9) return "medium";
  return "small";
}

export function spawnXpGem(
  k: KAPLAYCtx,
  x: number,
  y: number,
  xpValue: number,
): XpGem {
  const tier = tierFor(xpValue);
  const cfg = TIER_CONFIG[tier];
  const obj = k.add([
    k.sprite(cfg.sprite),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(cfg.scale),
    k.z(3),
  ]);
  return { obj, xpValue, tier };
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
    player.stats.xp += gem.xpValue * player.stats.xpMult;
    gem.obj.destroy();
    return "collected";
  }

  return "idle";
}

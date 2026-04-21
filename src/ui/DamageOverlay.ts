import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";

const FADE_MS = 220;

export interface DamageOverlay {
  flash: () => void;
}

export function mountDamageOverlay(k: KAPLAYCtx): DamageOverlay {
  const overlay = k.add([
    k.rect(GAME_WIDTH, GAME_HEIGHT),
    k.pos(0, 0),
    k.color(220, 40, 40),
    k.opacity(0),
    k.fixed(),
    k.z(200),
  ]) as GameObj & { opacity: number };

  let triggeredAt = 0;

  overlay.onUpdate(() => {
    if (triggeredAt === 0) return;
    const elapsed = Date.now() - triggeredAt;
    const progress = Math.min(1, elapsed / FADE_MS);
    overlay.opacity = 0.38 * (1 - progress);
    if (progress >= 1) {
      triggeredAt = 0;
      overlay.opacity = 0;
    }
  });

  return {
    flash: () => {
      triggeredAt = Date.now();
      overlay.opacity = 0.38;
    },
  };
}

import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";

const TOTAL_MS = 3200;
const ENTER_MS = 600;
const EXIT_MS = 500;

export interface EvolutionPopupOpts {
  title: string;
  subtitle: string;
  spriteKey: string;
  onDone?: () => void;
}

export function showEvolutionPopup(k: KAPLAYCtx, opts: EvolutionPopupOpts): void {
  const cx = GAME_WIDTH / 2;
  const cy = GAME_HEIGHT / 2;
  const created: GameObj[] = [];
  const add = <T extends GameObj>(obj: T): T => {
    created.push(obj);
    return obj;
  };

  const backdrop = add(
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.pos(0, 0),
      k.color(8, 12, 16),
      k.opacity(0),
      k.fixed(),
      k.z(600),
    ]),
  ) as GameObj & { opacity: number };

  const rays = add(
    k.add([
      k.circle(320),
      k.pos(cx, cy + 10),
      k.anchor("center"),
      k.color(255, 230, 140),
      k.opacity(0),
      k.scale(0.3),
      k.fixed(),
      k.z(601),
    ]),
  ) as GameObj & { opacity: number };

  const panel = add(
    k.add([
      k.rect(560, 280, { radius: 14 }),
      k.pos(cx, cy + 10),
      k.anchor("center"),
      k.color(30, 48, 40),
      k.outline(3, k.rgb(255, 220, 110)),
      k.opacity(0),
      k.scale(0.6),
      k.fixed(),
      k.z(602),
    ]),
  ) as GameObj & { opacity: number };

  const flash = add(
    k.add([
      k.text("EVOLUTION!", { size: 34 }),
      k.pos(cx, cy - 90),
      k.anchor("center"),
      k.color(255, 236, 140),
      k.opacity(0),
      k.scale(0.6),
      k.fixed(),
      k.z(603),
    ]),
  ) as GameObj & { opacity: number };

  const sprite = add(
    k.add([
      k.sprite(opts.spriteKey, { frame: 0 }),
      k.pos(cx, cy - 10),
      k.anchor("center"),
      k.scale(0.1),
      k.rotate(0),
      k.opacity(0),
      k.fixed(),
      k.z(603),
    ]),
  ) as GameObj & { opacity: number; angle: number };

  const title = add(
    k.add([
      k.text(opts.title, { size: 30, width: 500, align: "center" }),
      k.pos(cx, cy + 70),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.opacity(0),
      k.fixed(),
      k.z(603),
    ]),
  ) as GameObj & { opacity: number };

  const subtitle = add(
    k.add([
      k.text(opts.subtitle, { size: 16, width: 480, align: "center" }),
      k.pos(cx, cy + 110),
      k.anchor("center"),
      k.color(220, 232, 220),
      k.opacity(0),
      k.fixed(),
      k.z(603),
    ]),
  ) as GameObj & { opacity: number };

  const startedAt = Date.now();
  const rayScale = { value: 0.3 };
  const panelScale = { value: 0.6 };
  const spriteScale = { value: 0.1 };

  backdrop.onUpdate(() => {
    const elapsed = Date.now() - startedAt;
    const progress = Math.min(1, elapsed / TOTAL_MS);

    if (elapsed < ENTER_MS) {
      const t = elapsed / ENTER_MS;
      const eased = easeOutCubic(t);
      backdrop.opacity = eased * 0.75;
      rays.opacity = eased * 0.35;
      panel.opacity = eased;
      flash.opacity = eased;
      sprite.opacity = eased;
      title.opacity = t > 0.4 ? (t - 0.4) / 0.6 : 0;
      subtitle.opacity = t > 0.6 ? (t - 0.6) / 0.4 : 0;

      rayScale.value = 0.3 + eased * 0.95;
      panelScale.value = 0.6 + easeOutBack(t) * 0.4;
      spriteScale.value = 0.1 + easeOutBack(t) * 2.9;
    } else if (elapsed > TOTAL_MS - EXIT_MS) {
      const t = (elapsed - (TOTAL_MS - EXIT_MS)) / EXIT_MS;
      const eased = 1 - easeInCubic(t);
      backdrop.opacity = eased * 0.75;
      rays.opacity = eased * 0.35;
      panel.opacity = eased;
      flash.opacity = eased;
      sprite.opacity = eased;
      title.opacity = eased;
      subtitle.opacity = eased;
    }

    const pulse = 1 + Math.sin(elapsed * 0.012) * 0.05;
    (rays as any).scaleTo(rayScale.value * pulse);
    (panel as any).scaleTo(panelScale.value);
    (sprite as any).scaleTo(spriteScale.value * pulse);
    sprite.angle = ((sprite.angle ?? 0) + k.dt() * 540) % 360;
    (flash as any).scaleTo(1 + Math.sin(elapsed * 0.018) * 0.05);

    if (progress >= 1) {
      for (const obj of created) obj.destroy();
      opts.onDone?.();
    }
  });
}

function easeOutCubic(t: number): number {
  const c = 1 - t;
  return 1 - c * c * c;
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";

const BTN_SIZE = 44;
const PANEL_WIDTH_GUESS = 260;
const PANEL_MARGIN = 16;

export interface PauseButton {
  setPaused: (paused: boolean) => void;
}

export interface PauseButtonOpts {
  onToggle: () => void;
}

export function mountPauseButton(k: KAPLAYCtx, opts: PauseButtonOpts): PauseButton {
  const x = GAME_WIDTH - PANEL_WIDTH_GUESS - PANEL_MARGIN - BTN_SIZE - 8;
  const y = GAME_HEIGHT - 44 - PANEL_MARGIN;

  const btn = k.add([
    k.rect(BTN_SIZE, BTN_SIZE, { radius: 8 }),
    k.pos(x, y),
    k.color(48, 88, 62),
    k.outline(2, k.rgb(170, 210, 180)),
    k.opacity(0.9),
    k.area(),
    k.fixed(),
    k.z(100),
  ]);

  const glyph = k.add([
    k.text("II", { size: 18 }),
    k.pos(x + BTN_SIZE / 2, y + BTN_SIZE / 2),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(101),
  ]);

  const pausedOverlay = k.add([
    k.rect(GAME_WIDTH, GAME_HEIGHT),
    k.pos(0, 0),
    k.color(0, 0, 0),
    k.opacity(0),
    k.fixed(),
    k.z(400),
  ]) as GameObj & { opacity: number };

  const pausedLabel = k.add([
    k.text("PAUSED", { size: 64 }),
    k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2),
    k.anchor("center"),
    k.color(255, 236, 160),
    k.opacity(0),
    k.fixed(),
    k.z(401),
  ]) as GameObj & { opacity: number };

  const hint = k.add([
    k.text("Click pause again or press Esc to resume", { size: 18 }),
    k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60),
    k.anchor("center"),
    k.color(220, 232, 220),
    k.opacity(0),
    k.fixed(),
    k.z(401),
  ]) as GameObj & { opacity: number };

  btn.onClick(() => opts.onToggle());
  btn.onHover(() => {
    (btn as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(72, 120, 88);
  });
  btn.onHoverEnd(() => {
    (btn as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(48, 88, 62);
  });

  return {
    setPaused: (paused) => {
      (glyph as unknown as { text: string }).text = paused ? "▶" : "II";
      pausedOverlay.opacity = paused ? 0.55 : 0;
      pausedLabel.opacity = paused ? 1 : 0;
      hint.opacity = paused ? 1 : 0;
    },
  };
}

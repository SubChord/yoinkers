import type { KAPLAYCtx } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";

export function registerMenuScene(k: KAPLAYCtx): void {
  k.scene("menu", () => {
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(12, 24, 18), k.fixed()]);

    k.add([
      k.text("Yoinkers", { size: 72 }),
      k.color(242, 244, 204),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180),
      k.fixed(),
    ]);

    k.add([
      k.text("Yoink XP, grab chests, survive the swarm.", { size: 22 }),
      k.color(200, 220, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120),
      k.fixed(),
    ]);

    const subtitle = k.add([
      k.text("Press SPACE / ENTER or click Start", { size: 28 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10),
      k.fixed(),
    ]);

    k.add([
      k.text("Move: WASD or Arrow Keys • Auto-attack", { size: 20 }),
      k.color(188, 232, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30),
      k.fixed(),
    ]);

    k.add([
      k.text("Pick upgrades on level up (click or press 1 / 2 / 3)", { size: 20 }),
      k.color(188, 232, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60),
      k.fixed(),
    ]);

    k.add([
      k.text("Switch music any time from the bottom-right selector", { size: 20 }),
      k.color(188, 232, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90),
      k.fixed(),
    ]);

    const startButton = k.add([
      k.rect(260, 64, { radius: 8 }),
      k.color(44, 90, 66),
      k.outline(2, k.rgb(210, 238, 196)),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140),
      k.area(),
      k.fixed(),
    ]);

    k.add([
      k.text("START", { size: 28 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140),
      k.fixed(),
    ]);

    let didStart = false;
    const start = () => {
      if (didStart) return;
      didStart = true;
      k.go("game");
    };

    startButton.onClick(start);
    k.onClick(start);
    k.onKeyPress("space", start);
    k.onKeyPress("enter", start);
    k.onKeyPress(() => start());

    subtitle.onUpdate(() => {
      const pulse = 0.5 + Math.sin(k.time() * 4) * 0.5;
      (subtitle as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(
        220 + pulse * 35,
        220 + pulse * 35,
        220 + pulse * 35,
      );
    });
  });
}

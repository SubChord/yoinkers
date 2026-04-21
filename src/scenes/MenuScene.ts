import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { isCharacterUnlocked, loadSave, setSelectedCharacter } from "../systems/SaveStore";
import type { CharacterId } from "../types/GameTypes";

export function registerMenuScene(k: KAPLAYCtx): void {
  k.scene("menu", () => {
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(12, 24, 18), k.fixed()]);

    k.add([
      k.text("Yoinkers", { size: 72 }),
      k.color(242, 244, 204),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 140),
      k.fixed(),
    ]);

    k.add([
      k.text("Yoink XP, grab chests, survive the swarm.", { size: 22 }),
      k.color(200, 220, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 200),
      k.fixed(),
    ]);

    const subtitle = k.add([
      k.text("Press SPACE / ENTER to Start", { size: 24 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 260),
      k.fixed(),
    ]);

    const hints = [
      "Move: WASD or Arrow Keys • Auto-attack",
      "Pick upgrades on level up (click or press 1 / 2 / 3)",
      "Switch music any time from the bottom-right selector",
    ];
    hints.forEach((line, i) => {
      k.add([
        k.text(line, { size: 18 }),
        k.color(188, 232, 196),
        k.anchor("center"),
        k.pos(GAME_WIDTH / 2, 310 + i * 26),
        k.fixed(),
      ]);
    });

    const save = loadSave();
    let didStart = false;
    const start = () => {
      if (didStart) return;
      didStart = true;
      k.go("game", { mapId: save.lastMapId });
    };

    const startBtn = makeMenuButton(k, `START — ${prettyMap(save.lastMapId)}`, 360, 64, GAME_WIDTH / 2, 430, {
      bg: [60, 120, 86],
      outline: [210, 238, 196],
      size: 24,
    });
    startBtn.onClick(start);

    const mapsBtn = makeMenuButton(k, "MAPS", 140, 46, GAME_WIDTH / 2 - 225, 510, {
      bg: [64, 96, 130],
      outline: [180, 210, 244],
    });
    mapsBtn.onClick(() => k.go("maps"));

    const shopBtn = makeMenuButton(k, "SHOP", 140, 46, GAME_WIDTH / 2 - 75, 510, {
      bg: [110, 88, 42],
      outline: [244, 220, 150],
    });
    shopBtn.onClick(() => k.go("shop"));

    const statsBtn = makeMenuButton(k, "STATS", 140, 46, GAME_WIDTH / 2 + 75, 510, {
      bg: [44, 80, 100],
      outline: [180, 210, 230],
    });
    statsBtn.onClick(() => k.go("stats"));

    const guideBtn = makeMenuButton(k, "GUIDE", 140, 46, GAME_WIDTH / 2 + 225, 510, {
      bg: [90, 62, 118],
      outline: [210, 180, 230],
    });
    guideBtn.onClick(() => k.go("guide"));

    const jesusUnlocked = isCharacterUnlocked(save, "jesus");
    const charLabel = k.add([
      k.text(characterLine(save.selectedCharacter, jesusUnlocked), { size: 18 }),
      k.color(232, 232, 232),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 565),
      k.fixed(),
    ]);
    const toggleCharacter = () => {
      if (!jesusUnlocked) return;
      const next: CharacterId = save.selectedCharacter === "jesus" ? "ninja" : "jesus";
      setSelectedCharacter(next);
      save.selectedCharacter = next;
      (charLabel as unknown as { text: string }).text = characterLine(next, true);
    };
    if (jesusUnlocked) {
      const charBtn = makeMenuButton(k, "SWITCH", 110, 32, GAME_WIDTH / 2 + 180, 565, {
        bg: [70, 90, 120],
        outline: [190, 210, 240],
        size: 16,
      });
      charBtn.onClick(toggleCharacter);
      k.onKeyPress("c", toggleCharacter);
    }

    k.add([
      k.text(`Yoinks: ${save.yoinks.toLocaleString()} ¥`, { size: 20 }),
      k.color(255, 232, 140),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 600),
      k.fixed(),
    ]);

    k.onKeyPress("space", start);
    k.onKeyPress("enter", start);
    k.onKeyPress("m", () => k.go("maps"));
    k.onKeyPress("h", () => k.go("shop"));
    k.onKeyPress("s", () => k.go("stats"));
    k.onKeyPress("g", () => k.go("guide"));

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

function characterLine(id: CharacterId, jesusUnlocked: boolean): string {
  const name = id === "jesus" ? "Jesus Christ" : "Ninja";
  return jesusUnlocked
    ? `Character: ${name}   [C / SWITCH]`
    : `Character: ${name}   (Jesus Christ locked — buy in Shop for 500 ¥)`;
}

function prettyMap(id: string): string {
  switch (id) {
    case "grove": return "Bamboo Grove";
    case "desert": return "Sunken Desert";
    case "darkforest": return "Cursed Forest";
    case "tundra": return "Frozen Tundra";
    default: return id;
  }
}

interface ButtonStyle {
  bg: [number, number, number];
  outline: [number, number, number];
  size?: number;
}

function makeMenuButton(
  k: KAPLAYCtx,
  label: string,
  width: number,
  height: number,
  cx: number,
  cy: number,
  style: ButtonStyle,
): GameObj {
  const btn = k.add([
    k.rect(width, height, { radius: 8 }),
    k.color(style.bg[0], style.bg[1], style.bg[2]),
    k.outline(2, k.rgb(style.outline[0], style.outline[1], style.outline[2])),
    k.anchor("center"),
    k.pos(cx, cy),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text(label, { size: style.size ?? 24 }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.pos(cx, cy),
    k.fixed(),
  ]);
  return btn;
}

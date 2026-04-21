import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { MAP_DEFS, MAP_ORDER, type MapDef, type MapId } from "../config/MapDefs";
import { loadSave, setLastMap } from "../systems/SaveStore";

const CARD_WIDTH = 280;
const CARD_HEIGHT = 180;
const CARD_GAP = 28;

export function registerMapSelectScene(k: KAPLAYCtx): void {
  k.scene("maps", () => {
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(12, 24, 18), k.fixed()]);

    k.add([
      k.text("Select Map", { size: 48 }),
      k.color(242, 244, 204),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 70),
      k.fixed(),
    ]);

    const save = loadSave();

    k.add([
      k.text(
        `${save.unlockedMaps.length} / ${MAP_ORDER.length} maps unlocked  •  ${save.clearedMaps.length} cleared`,
        { size: 18 },
      ),
      k.color(190, 220, 196),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 110),
      k.fixed(),
    ]);

    const totalWidth = MAP_ORDER.length * CARD_WIDTH + (MAP_ORDER.length - 1) * CARD_GAP;
    const startX = (GAME_WIDTH - totalWidth) / 2;
    const cardY = 180;

    MAP_ORDER.forEach((id, i) => {
      const def = MAP_DEFS[id];
      const x = startX + i * (CARD_WIDTH + CARD_GAP);
      const unlocked = save.unlockedMaps.includes(id);
      const cleared = save.clearedMaps.includes(id);
      drawMapCard(k, def, x, cardY, { unlocked, cleared });
    });

    const backBtn = k.add([
      k.rect(220, 52, { radius: 8 }),
      k.color(44, 90, 66),
      k.outline(2, k.rgb(210, 238, 196)),
      k.pos(GAME_WIDTH / 2 - 110, GAME_HEIGHT - 80),
      k.area(),
      k.fixed(),
    ]);
    k.add([
      k.text("Back (Esc)", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT - 80 + 26),
      k.fixed(),
    ]);
    backBtn.onClick(() => k.go("menu"));
    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("backspace", () => k.go("menu"));
  });
}

function drawMapCard(
  k: KAPLAYCtx,
  def: MapDef,
  x: number,
  y: number,
  state: { unlocked: boolean; cleared: boolean },
): void {
  const bgColor = def.palette.ground;
  const outlineColor = state.unlocked ? def.palette.treeCanopyHighlight : [60, 60, 60];

  const card = k.add([
    k.rect(CARD_WIDTH, CARD_HEIGHT, { radius: 10 }),
    k.pos(x, y),
    k.color(bgColor[0], bgColor[1], bgColor[2]),
    k.outline(3, k.rgb(outlineColor[0], outlineColor[1], outlineColor[2])),
    k.opacity(state.unlocked ? 1 : 0.55),
    k.area(),
    k.fixed(),
  ]);

  k.add([
    k.text(def.label, { size: 22, width: CARD_WIDTH - 32, align: "center" }),
    k.pos(x + CARD_WIDTH / 2, y + 34),
    k.anchor("center"),
    k.color(
      def.palette.treeCanopyHighlight[0],
      def.palette.treeCanopyHighlight[1],
      def.palette.treeCanopyHighlight[2],
    ),
    k.fixed(),
  ]);

  k.add([
    k.text(def.subtitle, { size: 14, width: CARD_WIDTH - 32, align: "center" }),
    k.pos(x + CARD_WIDTH / 2, y + 74),
    k.anchor("center"),
    k.color(240, 248, 232),
    k.opacity(state.unlocked ? 1 : 0.75),
    k.fixed(),
  ]);

  drawPalettePreview(k, def, x + 24, y + 108, CARD_WIDTH - 48);

  if (state.cleared) {
    k.add([
      k.text("CLEARED", { size: 14 }),
      k.pos(x + CARD_WIDTH - 16, y + 14),
      k.anchor("topright"),
      k.color(120, 220, 130),
      k.fixed(),
    ]);
  }

  if (!state.unlocked) {
    k.add([
      k.text("🔒 Clear previous map", { size: 14 }),
      k.pos(x + CARD_WIDTH / 2, y + CARD_HEIGHT - 20),
      k.anchor("center"),
      k.color(230, 230, 230),
      k.fixed(),
    ]);
    return;
  }

  const playBtn = k.add([
    k.rect(CARD_WIDTH - 48, 36, { radius: 6 }),
    k.pos(x + 24, y + CARD_HEIGHT - 46),
    k.color(44, 90, 66),
    k.outline(1, k.rgb(210, 238, 196)),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text("Play", { size: 18 }),
    k.pos(x + CARD_WIDTH / 2, y + CARD_HEIGHT - 46 + 18),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.fixed(),
  ]);
  playBtn.onClick(() => {
    setLastMap(def.id);
    k.go("game", { mapId: def.id });
  });
  card.onClick(() => {
    setLastMap(def.id);
    k.go("game", { mapId: def.id });
  });
  void (card as GameObj);
}

function drawPalettePreview(k: KAPLAYCtx, def: MapDef, x: number, y: number, width: number): void {
  const swatches = [
    def.palette.ground,
    def.palette.treeCanopy,
    def.palette.bushLight,
    def.palette.rockLight,
    def.palette.flowers[0] ?? def.palette.grass,
  ];
  const size = 20;
  const gap = Math.max(2, (width - swatches.length * size) / Math.max(1, swatches.length - 1));
  swatches.forEach((c, i) => {
    k.add([
      k.rect(size, size, { radius: 4 }),
      k.pos(x + i * (size + gap), y),
      k.color(c[0], c[1], c[2]),
      k.outline(1, k.rgb(220, 230, 220)),
      k.fixed(),
    ]);
  });
}

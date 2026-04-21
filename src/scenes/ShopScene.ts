import type { GameObj, KAPLAYCtx } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import {
  META_UPGRADE_DEFS,
  META_UPGRADE_ORDER,
  metaUpgradeCost,
  type MetaUpgradeId,
} from "../config/MetaUpgradeDefs";
import { loadSave, purchaseMetaUpgrade, refundMetaUpgrades } from "../systems/SaveStore";

const CARD_WIDTH = 360;
const CARD_HEIGHT = 150;
const COLS = 3;
const GAP_X = 24;
const GAP_Y = 22;

export function registerShopScene(k: KAPLAYCtx): void {
  k.scene("shop", () => {
    drawShop(k);
  });
}

function drawShop(k: KAPLAYCtx): void {
  k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(14, 20, 30), k.fixed()]);

  k.add([
    k.text("Yoink Shop", { size: 44 }),
    k.anchor("center"),
    k.pos(GAME_WIDTH / 2, 50),
    k.color(244, 220, 150),
    k.fixed(),
  ]);

  const save = loadSave();
  k.add([
    k.text(`Yoinks: ${save.yoinks.toLocaleString()}`, { size: 24 }),
    k.anchor("center"),
    k.pos(GAME_WIDTH / 2, 92),
    k.color(255, 232, 140),
    k.fixed(),
  ]);

  k.add([
    k.text(`Lifetime earned: ${save.lifetimeYoinks.toLocaleString()}`, { size: 14 }),
    k.anchor("center"),
    k.pos(GAME_WIDTH / 2, 116),
    k.color(180, 196, 220),
    k.fixed(),
  ]);

  const gridStartX = (GAME_WIDTH - (COLS * CARD_WIDTH + (COLS - 1) * GAP_X)) / 2;
  const gridStartY = 150;

  META_UPGRADE_ORDER.forEach((id, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = gridStartX + col * (CARD_WIDTH + GAP_X);
    const y = gridStartY + row * (CARD_HEIGHT + GAP_Y);
    drawUpgradeCard(k, id, x, y, save);
  });

  const backBtn = k.add([
    k.rect(220, 48, { radius: 8 }),
    k.color(44, 70, 100),
    k.outline(2, k.rgb(196, 216, 244)),
    k.pos(40, GAME_HEIGHT - 70),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text("Back (Esc)", { size: 20 }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.pos(40 + 110, GAME_HEIGHT - 70 + 24),
    k.fixed(),
  ]);
  backBtn.onClick(() => k.go("menu"));

  const respecBtn = k.add([
    k.rect(220, 48, { radius: 8 }),
    k.color(110, 60, 60),
    k.outline(2, k.rgb(244, 196, 196)),
    k.pos(GAME_WIDTH - 260, GAME_HEIGHT - 70),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text("Respec (refund)", { size: 18 }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.pos(GAME_WIDTH - 260 + 110, GAME_HEIGHT - 70 + 24),
    k.fixed(),
  ]);
  respecBtn.onClick(() => {
    refundMetaUpgrades();
    k.go("shop");
  });

  k.onKeyPress("escape", () => k.go("menu"));
  k.onKeyPress("backspace", () => k.go("menu"));
}

function drawUpgradeCard(
  k: KAPLAYCtx,
  id: MetaUpgradeId,
  x: number,
  y: number,
  save: ReturnType<typeof loadSave>,
): void {
  const def = META_UPGRADE_DEFS[id];
  const level = save.metaUpgrades[id] ?? 0;
  const maxed = level >= def.maxLevel;
  const cost = maxed ? 0 : metaUpgradeCost(def, level);
  const affordable = !maxed && save.yoinks >= cost;

  const card = k.add([
    k.rect(CARD_WIDTH, CARD_HEIGHT, { radius: 10 }),
    k.pos(x, y),
    k.color(24, 34, 50),
    k.outline(2, maxed ? k.rgb(120, 200, 140) : k.rgb(80, 110, 150)),
    k.area(),
    k.fixed(),
  ]);

  if (def.icon) {
    k.add([
      k.sprite(def.icon),
      k.pos(x + 20, y + 20),
      k.scale(2),
      k.fixed(),
    ]);
  }

  k.add([
    k.text(def.label, { size: 20 }),
    k.pos(x + 76, y + 16),
    k.color(244, 232, 200),
    k.fixed(),
  ]);

  k.add([
    k.text(`Lv ${level} / ${def.maxLevel}`, { size: 14 }),
    k.pos(x + CARD_WIDTH - 16, y + 18),
    k.anchor("topright"),
    k.color(200, 220, 240),
    k.fixed(),
  ]);

  k.add([
    k.text(def.description, { size: 14, width: CARD_WIDTH - 32 }),
    k.pos(x + 16, y + 50),
    k.color(210, 220, 232),
    k.fixed(),
  ]);

  const buyLabel = maxed ? "MAXED" : `Buy — ${cost} ¥`;
  const buyBg: [number, number, number] = maxed
    ? [60, 90, 70]
    : affordable
      ? [60, 110, 80]
      : [80, 60, 60];
  const buyOutline: [number, number, number] = maxed
    ? [160, 220, 180]
    : affordable
      ? [180, 230, 190]
      : [200, 160, 160];

  const buyBtn: GameObj = k.add([
    k.rect(CARD_WIDTH - 24, 34, { radius: 6 }),
    k.pos(x + 12, y + CARD_HEIGHT - 44),
    k.color(buyBg[0], buyBg[1], buyBg[2]),
    k.outline(1, k.rgb(buyOutline[0], buyOutline[1], buyOutline[2])),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text(buyLabel, { size: 16 }),
    k.anchor("center"),
    k.pos(x + CARD_WIDTH / 2, y + CARD_HEIGHT - 44 + 17),
    k.color(255, 255, 255),
    k.fixed(),
  ]);

  if (!maxed && affordable) {
    buyBtn.onClick(() => {
      purchaseMetaUpgrade(id, cost);
      k.go("shop");
    });
  }

  void card;
}

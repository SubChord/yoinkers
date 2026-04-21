import type { KAPLAYCtx } from "kaplay";
import { CHARACTER_DEFS, CHARACTER_ORDER, type CharacterDef } from "../config/CharacterDefs";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { WEAPON_DEFS } from "../config/WeaponDefs";
import {
  isCharacterUnlocked,
  loadSave,
  POOPHOOD_COST,
  purchaseCharacterUnlock,
  purchasePoophood,
  setSelectedCharacter,
  togglePoophood,
} from "../systems/SaveStore";

const CARD_WIDTH = 420;
const CARD_HEIGHT = 440;
const CARD_GAP = 40;
const CARD_Y = 120;

export function registerCharactersScene(k: KAPLAYCtx): void {
  k.scene("characters", () => {
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.pos(0, 0),
      k.color(12, 24, 18),
      k.fixed(),
    ]);

    k.add([
      k.text("Characters", { size: 48 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 60),
      k.color(242, 244, 204),
      k.fixed(),
    ]);

    const save = loadSave();
    const totalW = CHARACTER_ORDER.length * CARD_WIDTH + (CHARACTER_ORDER.length - 1) * CARD_GAP;
    const firstX = (GAME_WIDTH - totalW) / 2;

    const yoinksLabel = k.add([
      k.text(`Yoinks: ${save.yoinks.toLocaleString()} ¥`, { size: 20 }),
      k.color(255, 232, 140),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 94),
      k.fixed(),
    ]);

    CHARACTER_ORDER.forEach((id, idx) => {
      const def = CHARACTER_DEFS[id];
      drawCharacterCard(k, def, firstX + idx * (CARD_WIDTH + CARD_GAP), CARD_Y, yoinksLabel);
    });

    const backBtn = k.add([
      k.rect(220, 52, { radius: 8 }),
      k.color(44, 90, 66),
      k.outline(2, k.rgb(210, 238, 196)),
      k.pos(60, GAME_HEIGHT - 80),
      k.area(),
      k.fixed(),
    ]);
    k.add([
      k.text("Back (Esc)", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(60 + 110, GAME_HEIGHT - 80 + 26),
      k.fixed(),
    ]);
    backBtn.onClick(() => k.go("menu"));

    drawPoophoodRow(k, save);

    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("backspace", () => k.go("menu"));
  });
}

function drawPoophoodRow(k: KAPLAYCtx, save: ReturnType<typeof loadSave>): void {
  const rowY = GAME_HEIGHT - 80;
  const rowCx = GAME_WIDTH - 340;

  // Preview sprite
  k.add([
    k.sprite("cosmetic-poophood"),
    k.anchor("center"),
    k.pos(rowCx - 210, rowY + 26),
    k.scale(1.6),
    k.fixed(),
  ]);

  k.add([
    k.text("Poophood (cosmetic head)", { size: 18 }),
    k.color(255, 232, 180),
    k.anchor("left"),
    k.pos(rowCx - 170, rowY + 16),
    k.fixed(),
  ]);
  k.add([
    k.text(
      save.poophoodUnlocked
        ? save.wearingPoophood
          ? "Currently worn. Click to remove."
          : "Unlocked. Click to wear."
        : `Unlock for ${POOPHOOD_COST} ¥`,
      { size: 14 },
    ),
    k.color(210, 224, 210),
    k.anchor("left"),
    k.pos(rowCx - 170, rowY + 40),
    k.fixed(),
  ]);

  const label = !save.poophoodUnlocked
    ? save.yoinks >= POOPHOOD_COST
      ? `UNLOCK — ${POOPHOOD_COST} ¥`
      : `NEED ${POOPHOOD_COST} ¥`
    : save.wearingPoophood
      ? "REMOVE"
      : "WEAR";
  const bgColor: [number, number, number] = !save.poophoodUnlocked
    ? save.yoinks >= POOPHOOD_COST
      ? [110, 88, 42]
      : [70, 54, 54]
    : save.wearingPoophood
      ? [80, 140, 96]
      : [60, 108, 80];
  const outlineColor: [number, number, number] = !save.poophoodUnlocked
    ? save.yoinks >= POOPHOOD_COST
      ? [244, 220, 150]
      : [180, 160, 160]
    : [210, 238, 196];

  const btn = k.add([
    k.rect(160, 44, { radius: 8 }),
    k.color(bgColor[0], bgColor[1], bgColor[2]),
    k.outline(2, k.rgb(outlineColor[0], outlineColor[1], outlineColor[2])),
    k.pos(GAME_WIDTH - 200, rowY + 4),
    k.anchor("center"),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text(label, { size: 16 }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.pos(GAME_WIDTH - 200, rowY + 4),
    k.fixed(),
  ]);

  btn.onClick(() => {
    if (!save.poophoodUnlocked) {
      const next = purchasePoophood();
      if (next.yoinks === save.yoinks) return;
    } else {
      togglePoophood();
    }
    k.go("characters");
  });
}

function drawCharacterCard(
  k: KAPLAYCtx,
  def: CharacterDef,
  x: number,
  y: number,
  yoinksLabel: ReturnType<KAPLAYCtx["add"]>,
): void {
  const bg = k.add([
    k.rect(CARD_WIDTH, CARD_HEIGHT, { radius: 12 }),
    k.color(20, 38, 28),
    k.outline(2, k.rgb(130, 170, 146)),
    k.pos(x, y),
    k.fixed(),
    k.z(0),
  ]);

  // Portrait — use frame 0 of the walk sheet (facing down)
  k.add([
    k.sprite(def.spriteKey, { frame: 0 }),
    k.pos(x + CARD_WIDTH / 2, y + 70),
    k.anchor("center"),
    k.scale(5),
    k.fixed(),
  ]);

  k.add([
    k.text(def.label, { size: 28 }),
    k.color(255, 245, 200),
    k.anchor("center"),
    k.pos(x + CARD_WIDTH / 2, y + 170),
    k.fixed(),
  ]);

  k.add([
    k.text(def.description, { size: 16, width: CARD_WIDTH - 40, align: "center" }),
    k.color(220, 232, 220),
    k.anchor("center"),
    k.pos(x + CARD_WIDTH / 2, y + 212),
    k.fixed(),
  ]);

  const startingWeapon = WEAPON_DEFS[def.startingWeapon];
  k.add([
    k.text(`Starts with: ${startingWeapon.label}`, { size: 16 }),
    k.color(180, 220, 200),
    k.anchor("center"),
    k.pos(x + CARD_WIDTH / 2, y + 272),
    k.fixed(),
  ]);

  // Action button at the bottom of the card
  const btnX = x + CARD_WIDTH / 2;
  const btnY = y + CARD_HEIGHT - 52;

  const save = loadSave();
  const unlocked = isCharacterUnlocked(save, def.id);
  const selected = save.selectedCharacter === def.id;

  const label = selected
    ? "SELECTED"
    : unlocked
      ? "SELECT"
      : save.yoinks >= def.unlockCost
        ? `UNLOCK — ${def.unlockCost} ¥`
        : `NEED ${def.unlockCost} ¥`;

  const bgColor: [number, number, number] = selected
    ? [80, 140, 96]
    : unlocked
      ? [60, 108, 80]
      : save.yoinks >= def.unlockCost
        ? [110, 88, 42]
        : [70, 54, 54];
  const outlineColor: [number, number, number] = selected
    ? [210, 238, 196]
    : save.yoinks >= def.unlockCost
      ? [244, 220, 150]
      : [180, 160, 160];

  const btn = k.add([
    k.rect(CARD_WIDTH - 60, 44, { radius: 8 }),
    k.color(bgColor[0], bgColor[1], bgColor[2]),
    k.outline(2, k.rgb(outlineColor[0], outlineColor[1], outlineColor[2])),
    k.pos(btnX, btnY),
    k.anchor("center"),
    k.area(),
    k.fixed(),
  ]);
  k.add([
    k.text(label, { size: 18 }),
    k.color(255, 255, 255),
    k.anchor("center"),
    k.pos(btnX, btnY),
    k.fixed(),
  ]);

  btn.onClick(() => {
    if (selected) return;
    if (unlocked) {
      setSelectedCharacter(def.id);
    } else {
      const next = purchaseCharacterUnlock(def.id, def.unlockCost);
      if (next.yoinks === save.yoinks) return; // purchase failed (not enough yoinks)
      setSelectedCharacter(def.id);
    }
    // Rebuild the scene to reflect the new state.
    k.go("characters");
  });

  void bg;
  void yoinksLabel;
}

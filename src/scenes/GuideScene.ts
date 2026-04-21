import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { ENEMY_DEFS, type EnemyDef, type EnemyId } from "../config/EnemyDefs";
import { ITEM_DEFS, type ItemDef } from "../config/ItemDefs";
import { WEAPON_DEFS, type WeaponDef } from "../config/WeaponDefs";

type Tab = "weapons" | "enemies" | "items";

export function registerGuideScene(k: KAPLAYCtx): void {
  k.scene("guide", () => {
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(12, 24, 18), k.fixed()]);

    k.add([
      k.text("Guide", { size: 48 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 52),
      k.color(242, 244, 204),
      k.fixed(),
    ]);

    let activeTab: Tab = "weapons";
    let contentObjects: GameObj[] = [];

    const renderContent = () => {
      for (const o of contentObjects) o.destroy();
      contentObjects = [];
      if (activeTab === "weapons") renderWeapons(k, contentObjects);
      else if (activeTab === "enemies") renderEnemies(k, contentObjects);
      else renderItems(k, contentObjects);
    };

    const tabButtons: Array<{ tab: Tab; bg: GameObj; label: GameObj }> = [];

    const refreshTabs = () => {
      for (const t of tabButtons) {
        const active = t.tab === activeTab;
        (t.bg as unknown as { color: ReturnType<typeof k.rgb> }).color = active
          ? k.rgb(72, 130, 94)
          : k.rgb(32, 56, 42);
        (t.label as unknown as { color: ReturnType<typeof k.rgb> }).color = active
          ? k.rgb(255, 255, 255)
          : k.rgb(200, 220, 200);
      }
    };

    const makeTab = (tab: Tab, label: string, x: number) => {
      const bg = k.add([
        k.rect(150, 42, { radius: 8 }),
        k.pos(x, 110),
        k.color(32, 56, 42),
        k.outline(1, k.rgb(140, 190, 150)),
        k.area(),
        k.fixed(),
      ]);
      const text = k.add([
        k.text(label, { size: 18 }),
        k.pos(x + 75, 131),
        k.anchor("center"),
        k.color(200, 220, 200),
        k.fixed(),
      ]);
      bg.onClick(() => {
        activeTab = tab;
        refreshTabs();
        renderContent();
      });
      tabButtons.push({ tab, bg, label: text });
    };

    const tabStartX = GAME_WIDTH / 2 - 250;
    makeTab("weapons", "Weapons", tabStartX);
    makeTab("enemies", "Enemies", tabStartX + 170);
    makeTab("items", "Items", tabStartX + 340);

    refreshTabs();
    renderContent();

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
    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("backspace", () => k.go("menu"));
  });
}

const GRID_TOP = 180;
const COL_WIDTH = 570;
const ROW_HEIGHT = 70;

function renderWeapons(k: KAPLAYCtx, collect: GameObj[]): void {
  const defs = Object.values(WEAPON_DEFS) as WeaponDef[];
  renderGrid(k, collect, defs.length, (col, row, index) => {
    const def = defs[index];
    drawCard(k, collect, col, row, {
      sprite: def.spriteKey,
      title: def.label,
      body: def.description,
    });
  });
}

function renderEnemies(k: KAPLAYCtx, collect: GameObj[]): void {
  const defs = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter((d) => !d.boss);
  const bosses = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter((d) => d.boss);
  const ordered = [...defs, ...bosses];
  renderGrid(k, collect, ordered.length, (col, row, index) => {
    const def = ordered[index];
    const body = def.boss
      ? `BOSS — HP ${def.hp}, DMG ${def.damage}, unlocks at wave ${def.minWave}`
      : `HP ${def.hp}, DMG ${def.damage}, unlocks at wave ${def.minWave}`;
    drawCard(k, collect, col, row, {
      sprite: def.spriteKey,
      spriteTint: def.tint,
      spriteScale: def.boss ? 1.6 : 1.2,
      title: prettyEnemyLabel(def.id),
      body,
    });
  });
}

function renderItems(k: KAPLAYCtx, collect: GameObj[]): void {
  const defs = Object.values(ITEM_DEFS) as ItemDef[];
  renderGrid(k, collect, defs.length, (col, row, index) => {
    const def = defs[index];
    drawCard(k, collect, col, row, {
      sprite: def.spriteKey,
      title: def.label,
      body: def.pickupText,
      spriteScale: 2.2,
    });
  });
}

function renderGrid(
  _k: KAPLAYCtx,
  _collect: GameObj[],
  count: number,
  draw: (col: number, row: number, index: number) => void,
): void {
  for (let i = 0; i < count; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    draw(col, row, i);
  }
}

interface CardOpts {
  sprite: string;
  spriteScale?: number;
  spriteTint?: [number, number, number];
  title: string;
  body: string;
}

function drawCard(
  k: KAPLAYCtx,
  collect: GameObj[],
  col: number,
  row: number,
  opts: CardOpts,
): void {
  const x = 40 + col * (COL_WIDTH + 30);
  const y = GRID_TOP + row * ROW_HEIGHT;

  const bg = k.add([
    k.rect(COL_WIDTH, ROW_HEIGHT - 8, { radius: 8 }),
    k.pos(x, y),
    k.color(20, 36, 28),
    k.outline(1, k.rgb(90, 130, 100)),
    k.fixed(),
  ]);
  collect.push(bg);

  const spriteComps: Parameters<typeof k.add>[0] = [
    k.sprite(opts.sprite, { frame: 0 }),
    k.pos(x + 34, y + (ROW_HEIGHT - 8) / 2),
    k.anchor("center"),
    k.scale(opts.spriteScale ?? 1.5),
    k.fixed(),
  ];
  if (opts.spriteTint) {
    spriteComps.push(k.color(opts.spriteTint[0], opts.spriteTint[1], opts.spriteTint[2]));
  }
  const sprite = k.add(spriteComps);
  collect.push(sprite);

  const title = k.add([
    k.text(opts.title, { size: 18 }),
    k.pos(x + 80, y + 8),
    k.color(242, 244, 204),
    k.fixed(),
  ]);
  collect.push(title);

  const body = k.add([
    k.text(opts.body, { size: 14, width: COL_WIDTH - 110 }),
    k.pos(x + 80, y + 32),
    k.color(210, 222, 210),
    k.fixed(),
  ]);
  collect.push(body);
}

function prettyEnemyLabel(id: EnemyId): string {
  if (id.startsWith("boss-")) {
    return `Boss ${capitalize(id.slice("boss-".length))}`;
  }
  return capitalize(id);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

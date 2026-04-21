import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { ENEMY_DEFS, type EnemyDef, type EnemyId } from "../config/EnemyDefs";
import { GEAR_DEFS, type GearDef } from "../config/GearDefs";
import { ITEM_DEFS, type ItemDef } from "../config/ItemDefs";
import { WEAPON_DEFS, type WeaponDef } from "../config/WeaponDefs";

type Tab = "weapons" | "enemies" | "items" | "gear";

const GRID_TOP = 180;
const COL_WIDTH = 570;
const ROW_HEIGHT = 70;
const VIEWPORT_BOTTOM = GAME_HEIGHT - 100; // clear the Back button
const VIEWPORT_HEIGHT = VIEWPORT_BOTTOM - GRID_TOP;
const CHROME_Z = 10;
const SCROLL_KEY_STEP = ROW_HEIGHT;

export function registerGuideScene(k: KAPLAYCtx): void {
  k.scene("guide", () => {
    k.add([k.rect(GAME_WIDTH, GAME_HEIGHT), k.pos(0, 0), k.color(12, 24, 18), k.fixed()]);

    k.add([
      k.text("Guide", { size: 48 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 52),
      k.color(242, 244, 204),
      k.fixed(),
      k.z(CHROME_Z),
    ]);

    let activeTab: Tab = "weapons";
    let contentObjects: GameObj[] = [];
    let scrollY = 0;
    let maxScroll = 0;
    let scrollHint: GameObj | null = null;

    const renderContent = () => {
      for (const o of contentObjects) o.destroy();
      contentObjects = [];
      const rowCount = rowCountFor(activeTab);
      const contentHeight = rowCount * ROW_HEIGHT;
      maxScroll = Math.max(0, contentHeight - VIEWPORT_HEIGHT);
      if (scrollY > maxScroll) scrollY = maxScroll;
      if (scrollY < 0) scrollY = 0;

      if (activeTab === "weapons") renderWeapons(k, contentObjects, scrollY);
      else if (activeTab === "enemies") renderEnemies(k, contentObjects, scrollY);
      else if (activeTab === "items") renderItems(k, contentObjects, scrollY);
      else renderGear(k, contentObjects, scrollY);

      if (scrollHint) {
        scrollHint.destroy();
        scrollHint = null;
      }
      if (maxScroll > 0) {
        scrollHint = k.add([
          k.text(scrollHintText(scrollY, maxScroll), { size: 14 }),
          k.pos(GAME_WIDTH - 40, GRID_TOP - 26),
          k.anchor("right"),
          k.color(160, 200, 170),
          k.fixed(),
          k.z(CHROME_Z),
        ]);
      }
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
        k.z(CHROME_Z),
      ]);
      const text = k.add([
        k.text(label, { size: 18 }),
        k.pos(x + 75, 131),
        k.anchor("center"),
        k.color(200, 220, 200),
        k.fixed(),
        k.z(CHROME_Z),
      ]);
      bg.onClick(() => {
        if (activeTab === tab) return;
        activeTab = tab;
        scrollY = 0;
        refreshTabs();
        renderContent();
      });
      tabButtons.push({ tab, bg, label: text });
    };

    const tabWidth = 150;
    const tabGap = 14;
    const tabs: Array<[Tab, string]> = [
      ["weapons", "Weapons"],
      ["enemies", "Enemies"],
      ["items", "Items"],
      ["gear", "Gear"],
    ];
    const totalTabsWidth = tabs.length * tabWidth + (tabs.length - 1) * tabGap;
    const tabStartX = (GAME_WIDTH - totalTabsWidth) / 2;
    tabs.forEach(([tab, label], i) => {
      makeTab(tab, label, tabStartX + i * (tabWidth + tabGap));
    });

    refreshTabs();
    renderContent();

    // Cover strips so scrolled cards don't poke into the header / back-button areas.
    k.add([
      k.rect(GAME_WIDTH, GRID_TOP),
      k.pos(0, 0),
      k.color(12, 24, 18),
      k.fixed(),
      k.z(CHROME_Z - 1),
    ]);
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT - VIEWPORT_BOTTOM),
      k.pos(0, VIEWPORT_BOTTOM),
      k.color(12, 24, 18),
      k.fixed(),
      k.z(CHROME_Z - 1),
    ]);

    const backBtn = k.add([
      k.rect(220, 52, { radius: 8 }),
      k.color(44, 90, 66),
      k.outline(2, k.rgb(210, 238, 196)),
      k.pos(60, GAME_HEIGHT - 80),
      k.area(),
      k.fixed(),
      k.z(CHROME_Z),
    ]);
    k.add([
      k.text("Back (Esc)", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(60 + 110, GAME_HEIGHT - 80 + 26),
      k.fixed(),
      k.z(CHROME_Z),
    ]);
    backBtn.onClick(() => k.go("menu"));
    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("backspace", () => k.go("menu"));

    const scrollBy = (delta: number) => {
      if (maxScroll <= 0) return;
      const next = Math.max(0, Math.min(maxScroll, scrollY + delta));
      if (next === scrollY) return;
      scrollY = next;
      renderContent();
    };

    k.onScroll((delta) => scrollBy(delta.y));
    k.onKeyPressRepeat("down", () => scrollBy(SCROLL_KEY_STEP));
    k.onKeyPressRepeat("up", () => scrollBy(-SCROLL_KEY_STEP));
    k.onKeyPressRepeat("pagedown", () => scrollBy(VIEWPORT_HEIGHT));
    k.onKeyPressRepeat("pageup", () => scrollBy(-VIEWPORT_HEIGHT));
    k.onKeyPress("home", () => scrollBy(-maxScroll));
    k.onKeyPress("end", () => scrollBy(maxScroll));
  });
}

function rowCountFor(tab: Tab): number {
  const count =
    tab === "weapons"
      ? Object.values(WEAPON_DEFS).length
      : tab === "enemies"
        ? Object.values(ENEMY_DEFS).length
        : tab === "items"
          ? Object.values(ITEM_DEFS).length
          : Object.values(GEAR_DEFS).length;
  return Math.ceil(count / 2);
}

function scrollHintText(scrollY: number, maxScroll: number): string {
  if (scrollY <= 0) return "Scroll ↓ / ↑ / PgDn — more below";
  if (scrollY >= maxScroll) return "Scroll ↓ / ↑ / PgUp — at bottom";
  return "Scroll ↓ / ↑ / PgDn / PgUp";
}

function renderWeapons(k: KAPLAYCtx, collect: GameObj[], scrollY: number): void {
  const defs = Object.values(WEAPON_DEFS) as WeaponDef[];
  renderGrid(defs.length, (col, row, index) => {
    const def = defs[index];
    drawCard(k, collect, col, row, scrollY, {
      sprite: def.spriteKey,
      title: def.label,
      body: def.description,
    });
  });
}

function renderEnemies(k: KAPLAYCtx, collect: GameObj[], scrollY: number): void {
  const defs = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter((d) => !d.boss);
  const bosses = (Object.values(ENEMY_DEFS) as EnemyDef[]).filter((d) => d.boss);
  const ordered = [...defs, ...bosses];
  renderGrid(ordered.length, (col, row, index) => {
    const def = ordered[index];
    const body = def.boss
      ? `BOSS — HP ${def.hp}, DMG ${def.damage}, unlocks at wave ${def.minWave}`
      : `HP ${def.hp}, DMG ${def.damage}, unlocks at wave ${def.minWave}`;
    drawCard(k, collect, col, row, scrollY, {
      sprite: def.spriteKey,
      spriteTint: def.tint,
      spriteScale: def.boss ? 1.6 : 1.2,
      title: prettyEnemyLabel(def.id),
      body,
    });
  });
}

function renderItems(k: KAPLAYCtx, collect: GameObj[], scrollY: number): void {
  const defs = Object.values(ITEM_DEFS) as ItemDef[];
  renderGrid(defs.length, (col, row, index) => {
    const def = defs[index];
    drawCard(k, collect, col, row, scrollY, {
      sprite: def.spriteKey,
      title: def.label,
      body: def.pickupText,
      spriteScale: 2.2,
    });
  });
}

function renderGear(k: KAPLAYCtx, collect: GameObj[], scrollY: number): void {
  const defs = Object.values(GEAR_DEFS) as GearDef[];
  renderGrid(defs.length, (col, row, index) => {
    const def = defs[index];
    drawCard(k, collect, col, row, scrollY, {
      sprite: def.spriteKey,
      title: def.label,
      body: def.description,
      spriteScale: 2.2,
    });
  });
}

function renderGrid(
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
  scrollY: number,
  opts: CardOpts,
): void {
  const x = 40 + col * (COL_WIDTH + 30);
  const y = GRID_TOP + row * ROW_HEIGHT - scrollY;

  // Cull rows fully outside the viewport to keep the scene light on large lists.
  if (y + ROW_HEIGHT < GRID_TOP || y > VIEWPORT_BOTTOM) return;

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

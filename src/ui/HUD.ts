import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_WIDTH, SCORE_WAVE_MULTIPLIER, xpForLevel } from "../config/GameConfig";
import { GEAR_DEFS, GEAR_IDS, type GearId } from "../config/GearDefs";
import type { Player } from "../entities/Player";
import type { ActiveItemId } from "../types/GameTypes";

const ACTIVE_ITEM_LABELS: Record<ActiveItemId, string> = {
  redBull: "Red Bull",
  novaBlast: "Allahu akbar",
};

interface GearIconRef {
  id: GearId;
  sprite: GameObj;
  count: GameObj;
}

export interface HudRefs {
  k: KAPLAYCtx;
  hpText: GameObj;
  xpText: GameObj;
  waveText: GameObj;
  timerText: GameObj;
  scoreText: GameObj;
  weaponsText: GameObj;
  gearIcons: Map<GearId, GearIconRef>;
  activeItemIcon: GameObj;
  activeItemText: GameObj;
}

export function createHud(k: KAPLAYCtx): HudRefs {
  const hpText = k.add([k.text("HP: 100 / 100", { size: 22 }), k.pos(20, 20), k.fixed(), k.z(100)]);
  const xpText = k.add([k.text("XP: 0 / 50  Lv 1", { size: 20 }), k.pos(20, 52), k.fixed(), k.z(100)]);
  const waveText = k.add([
    k.text("Wave 1", { size: 24 }),
    k.pos(GAME_WIDTH - 220, 20),
    k.color(255, 255, 255),
    k.fixed(),
    k.z(100),
  ]);
  const timerText = k.add([k.text("15:00", { size: 24 }), k.pos(GAME_WIDTH / 2 - 44, 20), k.fixed(), k.z(100)]);
  const scoreText = k.add([k.text("Score: 0", { size: 20 }), k.pos(GAME_WIDTH / 2 - 52, 52), k.fixed(), k.z(100)]);
  const weaponsText = k.add([
    k.text("Shuriken", { size: 18 }),
    k.pos(20, 84),
    k.color(210, 238, 196),
    k.fixed(),
    k.z(100),
  ]);

  const gearIcons = new Map<GearId, GearIconRef>();
  const gearIconSize = 32;
  const gearSpacing = 36;
  const gearStartX = 20;
  const gearY = 114;
  const gearStripWidth = GEAR_IDS.length * gearSpacing + 8;

  // Dark backing panel so gear icons don't blend into the game world.
  k.add([
    k.rect(gearStripWidth, gearIconSize + 16, { radius: 6 }),
    k.pos(gearStartX - 6, gearY - 8),
    k.color(0, 0, 0),
    k.opacity(0.55),
    k.fixed(),
    k.z(99),
  ]);

  GEAR_IDS.forEach((id, index) => {
    const x = gearStartX + index * gearSpacing;
    // Patrick is a 32x32 sprite while every other gear is 16x16; render at
    // half scale to keep its on-screen size consistent with the rest.
    const iconScale = id === "patrick" ? 1 : 2;
    const sprite = k.add([
      k.sprite(GEAR_DEFS[id].spriteKey),
      k.pos(x, gearY),
      k.scale(iconScale),
      k.opacity(0.25),
      k.fixed(),
      k.z(100),
    ]);
    const count = k.add([
      k.text("", { size: 12 }),
      k.pos(x + 22, gearY + 20),
      k.color(255, 236, 160),
      k.fixed(),
      k.z(101),
    ]);
    gearIcons.set(id, { id, sprite, count });
  });

  // Active item indicator (hidden until one is picked)
  const activeItemIcon = k.add([
    k.sprite("item-redbull"),
    k.pos(GAME_WIDTH - 220, 54),
    k.scale(2),
    k.opacity(0),
    k.fixed(),
    k.z(100),
  ]);
  const activeItemText = k.add([
    k.text("", { size: 16 }),
    k.pos(GAME_WIDTH - 186, 58),
    k.color(255, 220, 40),
    k.fixed(),
    k.z(100),
  ]);

  return { k, hpText, xpText, waveText, timerText, scoreText, weaponsText, gearIcons, activeItemIcon, activeItemText };
}

export interface HudState {
  player: Player;
  wave: number;
  enemiesKilled: number;
  remainingMs: number;
}

export function updateHud(refs: HudRefs, state: HudState): void {
  const s = state.player.stats;
  const nextThreshold = xpForLevel(s.level);

  setText(refs.hpText, `HP: ${Math.ceil(s.hp)} / ${s.maxHp}`);
  setText(refs.xpText, `XP: ${Math.floor(s.xp)} / ${nextThreshold}  Lv ${s.level + 1}`);
  const isBossWave = state.wave > 0 && state.wave % 5 === 0;
  setText(refs.waveText, isBossWave ? `Wave ${state.wave}  BOSS!` : `Wave ${state.wave}`);
  (refs.waveText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color = isBossWave
    ? refs.k.rgb(255, 130, 130)
    : refs.k.rgb(255, 255, 255);
  setText(
    refs.scoreText,
    `Score: ${state.enemiesKilled * Math.max(1, state.wave) * SCORE_WAVE_MULTIPLIER}`,
  );
  setText(refs.weaponsText, s.weapons.map(prettyWeapon).join("  •  "));

  const seconds = Math.max(0, Math.floor(state.remainingMs / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  setText(refs.timerText, `${mm}:${ss}`);

  for (const icon of refs.gearIcons.values()) {
    const count = s.gear[icon.id] ?? 0;
    (icon.sprite as unknown as { opacity: number }).opacity = count > 0 ? 1 : 0.25;
    setText(icon.count, count > 1 ? `x${count}` : count === 1 ? "" : "");
  }

  // Active item cooldown (Mario Kart style — 1 slot)
  if (s.activeItem) {
    (refs.activeItemIcon as unknown as { opacity: number }).opacity = 1;
    const now = Date.now();
    const cooldownLeft = Math.max(0, s.activeItemCooldownMs - now);
    const label = ACTIVE_ITEM_LABELS[s.activeItem] ?? s.activeItem;

    if (cooldownLeft > 0) {
      setText(refs.activeItemText, `(SPACE) ${label} ${Math.ceil(cooldownLeft / 1000)}s`);
      (refs.activeItemText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color =
        refs.k.rgb(160, 160, 160);
    } else {
      setText(refs.activeItemText, `(SPACE) ${label}`);
      (refs.activeItemText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color =
        refs.k.rgb(255, 220, 40);
    }
  } else {
    (refs.activeItemIcon as unknown as { opacity: number }).opacity = 0;
    setText(refs.activeItemText, "");
  }
}

function setText(obj: GameObj, value: string): void {
  (obj as unknown as { text: string }).text = value;
}

function prettyWeapon(id: string): string {
  switch (id) {
    case "shuriken":
      return "Shuriken";
    case "magicOrb":
      return "Magic Orb";
    case "boomerang":
      return "Kunai";
    case "arrow":
      return "Arrow Volley";
    case "bomb":
      return "Bomb";
    case "caltrop":
      return "Caltrops";
    case "fireTrail":
      return "Fire Trail";
    default:
      return id;
  }
}

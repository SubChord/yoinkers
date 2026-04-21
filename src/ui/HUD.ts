import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_WIDTH, SCORE_WAVE_MULTIPLIER, XP_PER_LEVEL } from "../config/GameConfig";
import { GEAR_DEFS, GEAR_IDS, type GearId } from "../config/GearDefs";
import type { Player } from "../entities/Player";

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
  redBullIcon: GameObj;
  redBullText: GameObj;
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
  GEAR_IDS.forEach((id, index) => {
    const x = 20 + index * 44;
    const sprite = k.add([
      k.sprite(GEAR_DEFS[id].spriteKey),
      k.pos(x, 114),
      k.scale(2),
      k.opacity(0.15),
      k.fixed(),
      k.z(100),
    ]);
    const count = k.add([
      k.text("", { size: 12 }),
      k.pos(x + 28, 134),
      k.color(255, 236, 160),
      k.fixed(),
      k.z(101),
    ]);
    gearIcons.set(id, { id, sprite, count });
  });

  // Red Bull cooldown indicator (hidden until unlocked)
  const redBullIcon = k.add([
    k.sprite("item-redbull"),
    k.pos(GAME_WIDTH - 220, 54),
    k.scale(2),
    k.opacity(0),
    k.fixed(),
    k.z(100),
  ]);
  const redBullText = k.add([
    k.text("", { size: 16 }),
    k.pos(GAME_WIDTH - 186, 58),
    k.color(255, 220, 40),
    k.fixed(),
    k.z(100),
  ]);

  return { k, hpText, xpText, waveText, timerText, scoreText, weaponsText, gearIcons, redBullIcon, redBullText };
}

export interface HudState {
  player: Player;
  wave: number;
  enemiesKilled: number;
  remainingMs: number;
}

export function updateHud(refs: HudRefs, state: HudState): void {
  const s = state.player.stats;
  const nextThreshold = XP_PER_LEVEL[Math.min(s.level, XP_PER_LEVEL.length - 1)];

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
    (icon.sprite as unknown as { opacity: number }).opacity = count > 0 ? 1 : 0.15;
    setText(icon.count, count > 1 ? `x${count}` : count === 1 ? "" : "");
  }

  // Red Bull cooldown
  if (s.hasRedBull) {
    (refs.redBullIcon as unknown as { opacity: number }).opacity = 1;
    const now = Date.now();
    const cooldownLeft = Math.max(0, s.redBullCooldownMs - now);
    const isActive = s.speedBuffExpiresMs > now && s.speedBuffMult > 1.5;
    if (isActive) {
      const activeLeft = Math.ceil((s.speedBuffExpiresMs - now) / 1000 * 10) / 10;
      setText(refs.redBullText, `BOOST! ${activeLeft.toFixed(1)}s`);
      (refs.redBullText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color =
        refs.k.rgb(255, 255, 100);
    } else if (cooldownLeft > 0) {
      setText(refs.redBullText, `[SPACE] ${Math.ceil(cooldownLeft / 1000)}s`);
      (refs.redBullText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color =
        refs.k.rgb(160, 160, 160);
    } else {
      setText(refs.redBullText, "[SPACE] Ready!");
      (refs.redBullText as unknown as { color: ReturnType<KAPLAYCtx["rgb"]> }).color =
        refs.k.rgb(255, 220, 40);
    }
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

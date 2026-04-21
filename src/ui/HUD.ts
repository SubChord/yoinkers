import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_WIDTH, SCORE_WAVE_MULTIPLIER, XP_PER_LEVEL } from "../config/GameConfig";
import type { Player } from "../entities/Player";

export interface HudRefs {
  hpText: GameObj;
  xpText: GameObj;
  waveText: GameObj;
  timerText: GameObj;
  scoreText: GameObj;
  weaponsText: GameObj;
}

export function createHud(k: KAPLAYCtx): HudRefs {
  const hpText = k.add([k.text("HP: 100 / 100", { size: 22 }), k.pos(20, 20), k.fixed(), k.z(100)]);
  const xpText = k.add([k.text("XP: 0 / 50  Lv 1", { size: 20 }), k.pos(20, 52), k.fixed(), k.z(100)]);
  const waveText = k.add([k.text("Wave 1", { size: 24 }), k.pos(GAME_WIDTH - 180, 20), k.fixed(), k.z(100)]);
  const timerText = k.add([k.text("15:00", { size: 24 }), k.pos(GAME_WIDTH / 2 - 44, 20), k.fixed(), k.z(100)]);
  const scoreText = k.add([k.text("Score: 0", { size: 20 }), k.pos(GAME_WIDTH / 2 - 52, 52), k.fixed(), k.z(100)]);
  const weaponsText = k.add([
    k.text("Shuriken", { size: 18 }),
    k.pos(20, 84),
    k.color(210, 238, 196),
    k.fixed(),
    k.z(100),
  ]);

  return { hpText, xpText, waveText, timerText, scoreText, weaponsText };
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
  setText(refs.waveText, `Wave ${state.wave}`);
  setText(
    refs.scoreText,
    `Score: ${state.enemiesKilled * Math.max(1, state.wave) * SCORE_WAVE_MULTIPLIER}`,
  );
  setText(refs.weaponsText, s.weapons.map(prettyWeapon).join("  •  "));

  const seconds = Math.max(0, Math.floor(state.remainingMs / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  setText(refs.timerText, `${mm}:${ss}`);
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
    default:
      return id;
  }
}

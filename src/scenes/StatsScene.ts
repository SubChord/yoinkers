import type { KAPLAYCtx } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { WEAPON_DEFS, type WeaponId } from "../config/WeaponDefs";
import { loadSave, resetSave } from "../systems/SaveStore";

export function registerStatsScene(k: KAPLAYCtx): void {
  k.scene("stats", () => {
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.pos(0, 0),
      k.color(12, 24, 18),
      k.fixed(),
    ]);

    k.add([
      k.text("Stats", { size: 48 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 60),
      k.color(242, 244, 204),
      k.fixed(),
    ]);

    const save = loadSave();
    const timeMmSs = (ms: number) => {
      const secs = Math.max(0, Math.floor(ms / 1000));
      return `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
    };
    const winRate = save.runsPlayed > 0 ? Math.round((save.winCount / save.runsPlayed) * 100) : 0;

    const rows: Array<[string, string]> = [
      ["Runs played", `${save.runsPlayed}`],
      ["Victories", `${save.winCount}  (${winRate}% win rate)`],
      ["Total enemies defeated", save.totalEnemiesKilled.toLocaleString()],
      ["Total damage dealt", save.totalDamage.toLocaleString()],
      ["Total time survived", timeMmSs(save.totalTimeMs)],
      ["Best wave reached", `${save.bestWave}`],
      ["Best level reached", `${save.bestLevel}`],
      ["Best enemies in a run", save.bestEnemies.toLocaleString()],
      ["Longest survival", timeMmSs(save.bestTimeMs)],
    ];

    rows.forEach(([label, value], index) => {
      const y = 130 + index * 28;
      k.add([k.text(label, { size: 18 }), k.pos(80, y), k.color(220, 232, 220), k.fixed()]);
      k.add([
        k.text(value, { size: 18 }),
        k.pos(460, y),
        k.color(255, 255, 255),
        k.fixed(),
      ]);
    });

    const damageEntries = Object.entries(save.allTimeDamage)
      .filter(([_, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    k.add([
      k.text("All-time damage by weapon", { size: 22 }),
      k.pos(GAME_WIDTH / 2 + 40, 130),
      k.color(240, 230, 170),
      k.fixed(),
    ]);

    if (damageEntries.length === 0) {
      k.add([
        k.text("Play a run to see weapon stats.", { size: 16 }),
        k.pos(GAME_WIDTH / 2 + 40, 170),
        k.color(200, 212, 200),
        k.fixed(),
      ]);
    } else {
      const max = damageEntries[0][1];
      damageEntries.forEach(([weapon, dmg], index) => {
        const y = 170 + index * 30;
        const def = WEAPON_DEFS[weapon as WeaponId];
        const label = def?.label ?? weapon;
        const pct = Math.max(0.04, dmg / max);

        k.add([
          k.text(label, { size: 16 }),
          k.pos(GAME_WIDTH / 2 + 40, y),
          k.color(240, 248, 232),
          k.fixed(),
        ]);
        k.add([
          k.rect(380, 14, { radius: 3 }),
          k.pos(GAME_WIDTH / 2 + 180, y + 2),
          k.color(28, 48, 36),
          k.fixed(),
        ]);
        k.add([
          k.rect(380 * pct, 14, { radius: 3 }),
          k.pos(GAME_WIDTH / 2 + 180, y + 2),
          k.color(110, 190, 120),
          k.fixed(),
        ]);
        k.add([
          k.text(dmg.toLocaleString(), { size: 14 }),
          k.pos(GAME_WIDTH / 2 + 180 + 385, y + 3),
          k.color(240, 248, 232),
          k.fixed(),
        ]);
      });
    }

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

    const resetBtn = k.add([
      k.rect(220, 52, { radius: 8 }),
      k.color(110, 52, 52),
      k.outline(2, k.rgb(244, 196, 196)),
      k.pos(GAME_WIDTH - 280, GAME_HEIGHT - 80),
      k.area(),
      k.fixed(),
    ]);
    k.add([
      k.text("Reset Stats", { size: 22 }),
      k.color(255, 255, 255),
      k.anchor("center"),
      k.pos(GAME_WIDTH - 280 + 110, GAME_HEIGHT - 80 + 26),
      k.fixed(),
    ]);
    resetBtn.onClick(() => {
      resetSave();
      k.go("stats");
    });

    k.onKeyPress("escape", () => k.go("menu"));
    k.onKeyPress("backspace", () => k.go("menu"));
  });
}

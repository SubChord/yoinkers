import type { KAPLAYCtx } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
import { WEAPON_DEFS, type WeaponId } from "../config/WeaponDefs";
import { loadSave } from "../systems/SaveStore";
import type { EndStats } from "../types/GameTypes";

export function registerEndScene(k: KAPLAYCtx): void {
  k.scene("end", (data: EndStats) => {
    k.add([
      k.rect(GAME_WIDTH, GAME_HEIGHT),
      k.pos(0, 0),
      k.color(data.won ? 12 : 34, data.won ? 36 : 16, 18),
      k.fixed(),
    ]);

    k.add([
      k.text(data.won ? "Victory" : "Game Over", { size: 60 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 90),
      k.color(data.won ? 216 : 255, data.won ? 255 : 186, 186),
      k.fixed(),
    ]);

    const seconds = Math.floor(data.timeSurvivedMs / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    k.add([
      k.text(
        `Enemies killed: ${data.enemiesKilled}\nLevel reached: ${data.level}\nWave reached: ${data.wave}\nTime survived: ${mm}:${ss}\nTotal damage: ${data.totalDamage.toLocaleString()}`,
        { size: 24, align: "center" },
      ),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 230),
      k.fixed(),
    ]);

    const save = loadSave();
    k.add([
      k.rect(360, 54, { radius: 10 }),
      k.pos(GAME_WIDTH / 2 - 180, 152),
      k.color(30, 40, 52),
      k.outline(2, k.rgb(244, 220, 150)),
      k.fixed(),
    ]);
    k.add([
      k.text(`+${save.lastYoinksEarned.toLocaleString()} yoinks earned`, { size: 20 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 170),
      k.color(255, 232, 140),
      k.fixed(),
    ]);
    k.add([
      k.text(`Total: ${save.yoinks.toLocaleString()} ¥`, { size: 14 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 192),
      k.color(200, 216, 232),
      k.fixed(),
    ]);

    drawDamageBreakdown(k, data);

    const prompt = k.add([
      k.text("Click or press SPACE / ENTER to return to menu  •  H for Shop", { size: 22 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, GAME_HEIGHT - 40),
      k.color(255, 255, 255),
      k.fixed(),
    ]);

    const restart = () => k.go("menu");
    k.onClick(restart);
    k.onKeyPress("space", restart);
    k.onKeyPress("enter", restart);
    k.onKeyPress("h", () => k.go("shop"));

    prompt.onUpdate(() => {
      const pulse = 0.5 + Math.sin(k.time() * 4) * 0.5;
      (prompt as unknown as { color: ReturnType<typeof k.rgb> }).color = k.rgb(
        210 + pulse * 45,
        210 + pulse * 45,
        210 + pulse * 45,
      );
    });
  });
}

function drawDamageBreakdown(k: KAPLAYCtx, data: EndStats): void {
  const entries = Object.entries(data.damageByWeapon)
    .map(([weapon, damage]) => ({ weapon: weapon as WeaponId, damage }))
    .filter((e) => e.damage > 0)
    .sort((a, b) => b.damage - a.damage);

  if (entries.length === 0) return;

  const maxDamage = entries[0].damage;
  const panelX = GAME_WIDTH / 2 - 260;
  const panelY = 380;
  const panelWidth = 520;
  const rowHeight = 34;
  const panelHeight = 60 + entries.length * rowHeight;

  k.add([
    k.rect(panelWidth, panelHeight, { radius: 10 }),
    k.pos(panelX, panelY),
    k.color(18, 30, 24),
    k.outline(2, k.rgb(140, 190, 150)),
    k.fixed(),
  ]);

  k.add([
    k.text("Damage by Weapon", { size: 20 }),
    k.pos(panelX + 20, panelY + 18),
    k.color(240, 230, 170),
    k.fixed(),
  ]);

  entries.forEach((entry, index) => {
    const y = panelY + 54 + index * rowHeight;
    const def = WEAPON_DEFS[entry.weapon];
    const label = def?.label ?? entry.weapon;
    const pct = Math.max(0.04, entry.damage / maxDamage);

    k.add([
      k.rect(panelWidth - 200, 18, { radius: 4 }),
      k.pos(panelX + 140, y + 2),
      k.color(30, 52, 40),
      k.fixed(),
    ]);

    k.add([
      k.rect((panelWidth - 200) * pct, 18, { radius: 4 }),
      k.pos(panelX + 140, y + 2),
      k.color(110, 190, 120),
      k.fixed(),
    ]);

    k.add([
      k.text(label, { size: 16 }),
      k.pos(panelX + 20, y + 4),
      k.color(240, 248, 232),
      k.fixed(),
    ]);

    k.add([
      k.text(entry.damage.toLocaleString(), { size: 16 }),
      k.pos(panelX + panelWidth - 30, y + 4),
      k.anchor("topright"),
      k.color(240, 248, 232),
      k.fixed(),
    ]);
  });
}

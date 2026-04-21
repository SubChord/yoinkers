import type { KAPLAYCtx } from "kaplay";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/GameConfig";
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
      k.text(data.won ? "Victory" : "Game Over", { size: 64 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 140),
      k.color(data.won ? 216 : 255, data.won ? 255 : 186, 186),
      k.fixed(),
    ]);

    const seconds = Math.floor(data.timeSurvivedMs / 1000);
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");

    k.add([
      k.text(
        `Enemies killed: ${data.enemiesKilled}\nLevel reached: ${data.level}\nWave reached: ${data.wave}\nTime survived: ${mm}:${ss}`,
        { size: 28, align: "center" },
      ),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 320),
      k.fixed(),
    ]);

    const prompt = k.add([
      k.text("Press SPACE / ENTER or Click to Play Again", { size: 24 }),
      k.anchor("center"),
      k.pos(GAME_WIDTH / 2, 560),
      k.color(255, 255, 255),
      k.fixed(),
    ]);

    const restart = () => k.go("menu");
    k.onClick(restart);
    k.onKeyPress("space", restart);
    k.onKeyPress("enter", restart);

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

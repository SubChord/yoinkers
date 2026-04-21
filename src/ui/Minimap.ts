import type { KAPLAYCtx, GameObj } from "kaplay";
import { GAME_HEIGHT, WORLD_SIZE } from "../config/GameConfig";
import type { Chest } from "../entities/Chest";
import type { Enemy } from "../entities/Enemy";
import type { Item } from "../entities/Item";
import type { Player } from "../entities/Player";
import type { WallSnapshot } from "../systems/WallHazard";

const SIZE = 140;
const MARGIN = 20;

export interface MinimapContext {
  player: Player;
  enemies: Enemy[];
  items: Item[];
  chests: Chest[];
  wall?: WallSnapshot | null;
}

export interface Minimap {
  update: (ctx: MinimapContext) => void;
}

export function mountMinimap(k: KAPLAYCtx): Minimap {
  const originX = MARGIN;
  const originY = GAME_HEIGHT / 2 - SIZE / 2;

  k.add([
    k.rect(SIZE + 6, SIZE + 6, { radius: 6 }),
    k.pos(originX - 3, originY - 3),
    k.color(12, 22, 18),
    k.outline(2, k.rgb(180, 220, 180)),
    k.opacity(0.85),
    k.fixed(),
    k.z(99),
  ]);

  k.add([
    k.rect(SIZE, SIZE),
    k.pos(originX, originY),
    k.color(36, 60, 44),
    k.opacity(0.9),
    k.fixed(),
    k.z(99),
  ]);

  const playerDot = k.add([
    k.rect(6, 6, { radius: 2 }),
    k.pos(originX, originY),
    k.color(255, 240, 140),
    k.fixed(),
    k.z(101),
  ]);

  const dotPool: { enemies: GameObj[]; items: GameObj[]; chests: GameObj[] } = {
    enemies: [],
    items: [],
    chests: [],
  };

  const project = (worldX: number, worldY: number): { x: number; y: number } => ({
    x: originX + ((worldX + WORLD_SIZE / 2) / WORLD_SIZE) * SIZE,
    y: originY + ((worldY + WORLD_SIZE / 2) / WORLD_SIZE) * SIZE,
  });

  const drawDots = (
    pool: GameObj[],
    entries: Array<{ x: number; y: number }>,
    color: [number, number, number],
    radius: number,
  ) => {
    while (pool.length < entries.length) {
      const dot = k.add([
        k.rect(radius * 2, radius * 2, { radius: Math.max(1, radius) }),
        k.pos(0, 0),
        k.color(color[0], color[1], color[2]),
        k.opacity(1),
        k.fixed(),
        k.z(100),
      ]);
      pool.push(dot);
    }
    for (let i = 0; i < pool.length; i += 1) {
      const dot = pool[i];
      if (i < entries.length) {
        const proj = project(entries[i].x, entries[i].y);
        dot.pos.x = proj.x - radius;
        dot.pos.y = proj.y - radius;
        (dot as unknown as { opacity: number }).opacity = 1;
      } else {
        (dot as unknown as { opacity: number }).opacity = 0;
      }
    }
  };

  // Wall hazard segments on minimap (reuse up to 2)
  const wallDots: GameObj[] = [];
  for (let i = 0; i < 2; i++) {
    wallDots.push(k.add([
      k.rect(1, 1),
      k.pos(0, 0),
      k.color(255, 120, 20),
      k.opacity(0),
      k.fixed(),
      k.z(101),
    ]));
  }
  // Gap marker on minimap
  const gapDot = k.add([
    k.rect(1, 1),
    k.pos(0, 0),
    k.color(50, 255, 50),
    k.opacity(0),
    k.fixed(),
    k.z(101),
  ]);

  const toMinimap = (worldVal: number): number =>
    ((worldVal + WORLD_SIZE / 2) / WORLD_SIZE) * SIZE;

  return {
    update: ({ player, enemies, items, chests, wall }) => {
      const playerProj = project(player.obj.pos.x, player.obj.pos.y);
      playerDot.pos.x = playerProj.x - 3;
      playerDot.pos.y = playerProj.y - 3;

      drawDots(
        dotPool.enemies,
        enemies.map((e) => ({ x: e.obj.pos.x, y: e.obj.pos.y })),
        [230, 110, 110],
        2,
      );
      drawDots(
        dotPool.items,
        items.map((it) => ({ x: it.obj.pos.x, y: it.obj.pos.y })),
        [140, 230, 230],
        2,
      );
      drawDots(
        dotPool.chests,
        chests.map((c) => ({ x: c.obj.pos.x, y: c.obj.pos.y })),
        [246, 200, 90],
        3,
      );

      // Draw wall hazard on minimap
      if (wall) {
        const horiz = wall.direction === "right" || wall.direction === "left";
        const posM = toMinimap(wall.position);
        const gsM = toMinimap(wall.gapStart);
        const geM = toMinimap(wall.gapEnd);
        const thick = Math.max(3, Math.round((48 / WORLD_SIZE) * SIZE * 3));
        const flash = wall.phase === "telegraph" ? (Math.sin(Date.now() * 0.012) > 0 ? 1 : 0.4) : 1;

        if (horiz) {
          // Top segment
          const topH = gsM;
          wallDots[0].pos.x = originX + posM - thick / 2;
          wallDots[0].pos.y = originY;
          (wallDots[0] as any).width = thick;
          (wallDots[0] as any).height = Math.max(0, topH);
          (wallDots[0] as any).opacity = topH > 0 ? flash : 0;
          // Bottom segment
          const botH = SIZE - geM;
          wallDots[1].pos.x = originX + posM - thick / 2;
          wallDots[1].pos.y = originY + geM;
          (wallDots[1] as any).width = thick;
          (wallDots[1] as any).height = Math.max(0, botH);
          (wallDots[1] as any).opacity = botH > 0 ? flash : 0;
          // Gap
          gapDot.pos.x = originX + posM - thick / 2;
          gapDot.pos.y = originY + gsM;
          (gapDot as any).width = thick;
          (gapDot as any).height = Math.max(0, geM - gsM);
          (gapDot as any).opacity = flash;
        } else {
          // Left segment
          const leftW = gsM;
          wallDots[0].pos.x = originX;
          wallDots[0].pos.y = originY + posM - thick / 2;
          (wallDots[0] as any).width = Math.max(0, leftW);
          (wallDots[0] as any).height = thick;
          (wallDots[0] as any).opacity = leftW > 0 ? flash : 0;
          // Right segment
          const rightW = SIZE - geM;
          wallDots[1].pos.x = originX + geM;
          wallDots[1].pos.y = originY + posM - thick / 2;
          (wallDots[1] as any).width = Math.max(0, rightW);
          (wallDots[1] as any).height = thick;
          (wallDots[1] as any).opacity = rightW > 0 ? flash : 0;
          // Gap
          gapDot.pos.x = originX + gsM;
          gapDot.pos.y = originY + posM - thick / 2;
          (gapDot as any).width = Math.max(0, geM - gsM);
          (gapDot as any).height = thick;
          (gapDot as any).opacity = flash;
        }
      } else {
        for (const wd of wallDots) (wd as any).opacity = 0;
        (gapDot as any).opacity = 0;
      }
    },
  };
}

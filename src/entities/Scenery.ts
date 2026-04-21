import type { KAPLAYCtx } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import type { MapPalette } from "../config/MapDefs";

const GRASS_COUNT = 1400;
const FLOWER_COUNT = 220;
const MUSHROOM_COUNT = 80;
const BUSH_COUNT = 160;
const TREE_COUNT = 120;
const ROCK_COUNT = 110;
const LOG_COUNT = 40;

export function scatterScenery(k: KAPLAYCtx, palette: MapPalette): void {
  const half = WORLD_SIZE / 2;
  const rand = (min: number, max: number) => k.rand(min, max);

  for (let i = 0; i < GRASS_COUNT; i += 1) {
    k.add([
      k.rect(10, 10),
      k.pos(rand(-half, half), rand(-half, half)),
      k.color(palette.grass[0], palette.grass[1], palette.grass[2]),
      k.z(1),
    ]);
  }

  for (let i = 0; i < FLOWER_COUNT; i += 1) {
    const color = palette.flowers[Math.floor(rand(0, palette.flowers.length))];
    k.add([
      k.circle(3),
      k.pos(rand(-half, half), rand(-half, half)),
      k.color(color[0], color[1], color[2]),
      k.z(1),
    ]);
  }

  for (let i = 0; i < MUSHROOM_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    k.add([
      k.rect(4, 6),
      k.pos(cx - 2, cy - 1),
      k.color(220, 220, 210),
      k.z(2),
    ]);
    k.add([
      k.circle(5),
      k.pos(cx, cy - 4),
      k.anchor("center"),
      k.color(180, 60, 60),
      k.z(2),
    ]);
  }

  for (let i = 0; i < BUSH_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    const size = rand(10, 16);
    k.add([
      k.circle(size),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(palette.bushDark[0], palette.bushDark[1], palette.bushDark[2]),
      k.z(2),
    ]);
    k.add([
      k.circle(size * 0.7),
      k.pos(cx - size * 0.3, cy - size * 0.3),
      k.anchor("center"),
      k.color(palette.bushLight[0], palette.bushLight[1], palette.bushLight[2]),
      k.z(3),
    ]);
  }

  for (let i = 0; i < TREE_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    const canopy = rand(18, 28);
    k.add([
      k.rect(8, 14),
      k.pos(cx - 4, cy),
      k.color(palette.treeTrunk[0], palette.treeTrunk[1], palette.treeTrunk[2]),
      k.z(3),
    ]);
    k.add([
      k.circle(canopy),
      k.pos(cx, cy - 4),
      k.anchor("center"),
      k.color(palette.treeCanopy[0], palette.treeCanopy[1], palette.treeCanopy[2]),
      k.z(4),
    ]);
    k.add([
      k.circle(canopy * 0.8),
      k.pos(cx - canopy * 0.3, cy - 10),
      k.anchor("center"),
      k.color(
        palette.treeCanopyHighlight[0],
        palette.treeCanopyHighlight[1],
        palette.treeCanopyHighlight[2],
      ),
      k.z(5),
    ]);
  }

  for (let i = 0; i < ROCK_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    const size = rand(9, 18);
    k.add([
      k.circle(size),
      k.pos(cx, cy),
      k.anchor("center"),
      k.color(palette.rockDark[0], palette.rockDark[1], palette.rockDark[2]),
      k.z(2),
    ]);
    k.add([
      k.circle(size * 0.55),
      k.pos(cx - size * 0.3, cy - size * 0.3),
      k.anchor("center"),
      k.color(palette.rockLight[0], palette.rockLight[1], palette.rockLight[2]),
      k.z(3),
    ]);
  }

  for (let i = 0; i < LOG_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    k.add([
      k.rect(26, 10, { radius: 4 }),
      k.pos(cx - 13, cy - 5),
      k.color(palette.logLight[0], palette.logLight[1], palette.logLight[2]),
      k.z(2),
    ]);
    k.add([
      k.rect(22, 2),
      k.pos(cx - 11, cy - 1),
      k.color(palette.logDark[0], palette.logDark[1], palette.logDark[2]),
      k.z(3),
    ]);
  }
}

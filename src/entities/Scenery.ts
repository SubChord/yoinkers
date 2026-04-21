import type { KAPLAYCtx } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";

const GRASS_COUNT = 1400;
const FLOWER_COUNT = 220;
const MUSHROOM_COUNT = 80;
const BUSH_COUNT = 160;
const TREE_COUNT = 120;
const ROCK_COUNT = 110;
const LOG_COUNT = 40;

const FLOWER_COLORS: Array<[number, number, number]> = [
  [246, 202, 78],
  [238, 106, 144],
  [200, 180, 242],
  [244, 242, 218],
];

export function scatterScenery(k: KAPLAYCtx): void {
  const half = WORLD_SIZE / 2;
  const rand = (min: number, max: number) => k.rand(min, max);

  for (let i = 0; i < GRASS_COUNT; i += 1) {
    k.add([
      k.rect(10, 10),
      k.pos(rand(-half, half), rand(-half, half)),
      k.color(54, 96, 58),
      k.z(1),
    ]);
  }

  for (let i = 0; i < FLOWER_COUNT; i += 1) {
    const [r, g, b] = FLOWER_COLORS[Math.floor(rand(0, FLOWER_COLORS.length))];
    k.add([
      k.circle(3),
      k.pos(rand(-half, half), rand(-half, half)),
      k.color(r, g, b),
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
      k.color(34, 80, 44),
      k.z(2),
    ]);
    k.add([
      k.circle(size * 0.7),
      k.pos(cx - size * 0.3, cy - size * 0.3),
      k.anchor("center"),
      k.color(60, 116, 70),
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
      k.color(70, 48, 28),
      k.z(3),
    ]);
    k.add([
      k.circle(canopy),
      k.pos(cx, cy - 4),
      k.anchor("center"),
      k.color(24, 62, 34),
      k.z(4),
    ]);
    k.add([
      k.circle(canopy * 0.8),
      k.pos(cx - canopy * 0.3, cy - 10),
      k.anchor("center"),
      k.color(46, 90, 54),
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
      k.color(126, 126, 132),
      k.z(2),
    ]);
    k.add([
      k.circle(size * 0.55),
      k.pos(cx - size * 0.3, cy - size * 0.3),
      k.anchor("center"),
      k.color(170, 170, 178),
      k.z(3),
    ]);
  }

  for (let i = 0; i < LOG_COUNT; i += 1) {
    const cx = rand(-half, half);
    const cy = rand(-half, half);
    k.add([
      k.rect(26, 10, { radius: 4 }),
      k.pos(cx - 13, cy - 5),
      k.color(92, 62, 38),
      k.z(2),
    ]);
    k.add([
      k.rect(22, 2),
      k.pos(cx - 11, cy - 1),
      k.color(58, 38, 22),
      k.z(3),
    ]);
  }
}

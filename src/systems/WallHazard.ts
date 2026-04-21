import type { KAPLAYCtx, GameObj } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import type { Player } from "../entities/Player";

const WALL_THICKNESS = 48;
const BASE_GAP_SIZE = 240;
const MIN_GAP_SIZE = 160;
const GAP_SHRINK_PER_WAVE = 6;
const BASE_WALL_SPEED = 280;
const WALL_SPEED_PER_WAVE = 12;
const WALL_DAMAGE = 50;
const TELEGRAPH_DURATION_MS = 2500;
const FIRST_WALL_WAVE = 6;
const WALL_INTERVAL_MS = 25_000;

type SweepDir = "right" | "down" | "left" | "up";

interface ActiveWall {
  segments: GameObj[];
  direction: SweepDir;
  position: number;
  speed: number;
  gapStart: number;
  gapEnd: number;
}

interface Telegraph {
  objs: GameObj[];
  startMs: number;
  direction: SweepDir;
  gapStart: number;
  gapEnd: number;
  speed: number;
}

export class WallHazardSystem {
  private wall: ActiveWall | null = null;
  private telegraph: Telegraph | null = null;
  private lastWallMs = 0;
  private dirIdx = 0;
  private warning: GameObj;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private playSfx: (key: string) => void,
    private damageFlash: { flash: () => void },
  ) {
    this.warning = k.add([
      k.text("", { size: 28 }),
      k.pos(k.width() / 2, k.height() - 56),
      k.anchor("center"),
      k.fixed(),
      k.color(255, 80, 80),
      k.opacity(0),
      k.z(101),
    ]);
  }

  public update(nowMs: number, dt: number, wave: number): void {
    if (wave < FIRST_WALL_WAVE) return;

    if (!this.wall && !this.telegraph) {
      if (this.lastWallMs === 0) this.lastWallMs = nowMs;
      if (nowMs - this.lastWallMs >= WALL_INTERVAL_MS) {
        this.beginTelegraph(nowMs, wave);
      }
      (this.warning as any).opacity = 0;
    }

    if (this.telegraph) this.tickTelegraph(nowMs);
    if (this.wall) this.tickWall(dt, nowMs);
  }

  /* ---- telegraph ---- */

  private beginTelegraph(nowMs: number, wave: number): void {
    const dirs: SweepDir[] = ["right", "down", "left", "up"];
    const dir = dirs[this.dirIdx % dirs.length];
    this.dirIdx += 1;

    const half = WORLD_SIZE / 2;
    const gapSize = Math.max(
      MIN_GAP_SIZE,
      BASE_GAP_SIZE - (wave - FIRST_WALL_WAVE) * GAP_SHRINK_PER_WAVE,
    );
    const horiz = dir === "right" || dir === "left";

    // Place gap near player on the perpendicular axis
    const playerPerp = horiz ? this.player.obj.pos.y : this.player.obj.pos.x;
    const offset = this.k.rand(-180, 180);
    const gapCenter = Math.max(
      -half + gapSize / 2 + 20,
      Math.min(half - gapSize / 2 - 20, playerPerp + offset),
    );
    const gapStart = gapCenter - gapSize / 2;
    const gapEnd = gapCenter + gapSize / 2;

    const speed = BASE_WALL_SPEED + (wave - FIRST_WALL_WAVE) * WALL_SPEED_PER_WAVE;

    // Flashing edge markers
    const objs: GameObj[] = [];
    const edgePos = (dir === "right" || dir === "down") ? -half : half;

    if (horiz) {
      if (gapStart + half > 0) {
        objs.push(this.k.add([
          this.k.rect(6, gapStart + half),
          this.k.pos(edgePos - 3, -half),
          this.k.color(255, 50, 50), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      if (half - gapEnd > 0) {
        objs.push(this.k.add([
          this.k.rect(6, half - gapEnd),
          this.k.pos(edgePos - 3, gapEnd),
          this.k.color(255, 50, 50), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      objs.push(this.k.add([
        this.k.rect(18, gapEnd - gapStart),
        this.k.pos(edgePos - 9, gapStart),
        this.k.color(50, 255, 50), this.k.opacity(0.5), this.k.z(8),
      ]));
    } else {
      if (gapStart + half > 0) {
        objs.push(this.k.add([
          this.k.rect(gapStart + half, 6),
          this.k.pos(-half, edgePos - 3),
          this.k.color(255, 50, 50), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      if (half - gapEnd > 0) {
        objs.push(this.k.add([
          this.k.rect(half - gapEnd, 6),
          this.k.pos(gapEnd, edgePos - 3),
          this.k.color(255, 50, 50), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      objs.push(this.k.add([
        this.k.rect(gapEnd - gapStart, 18),
        this.k.pos(gapStart, edgePos - 9),
        this.k.color(50, 255, 50), this.k.opacity(0.5), this.k.z(8),
      ]));
    }

    const labels: Record<SweepDir, string> = {
      right: "<<< WALL INCOMING",
      left: "WALL INCOMING >>>",
      down: "^^^ WALL INCOMING",
      up: "WALL INCOMING vvv",
    };
    (this.warning as any).text = labels[dir];

    this.telegraph = { objs, startMs: nowMs, direction: dir, gapStart, gapEnd, speed };
  }

  private tickTelegraph(nowMs: number): void {
    const t = this.telegraph!;
    const elapsed = nowMs - t.startMs;
    const flash = Math.sin(elapsed * 0.012) > 0;
    for (const obj of t.objs) (obj as any).opacity = flash ? 0.8 : 0.25;
    (this.warning as any).opacity = flash ? 1 : 0.4;

    if (elapsed >= TELEGRAPH_DURATION_MS) {
      for (const obj of t.objs) obj.destroy();
      this.spawnWall(t);
      this.telegraph = null;
      this.lastWallMs = nowMs;
    }
  }

  /* ---- active wall ---- */

  private spawnWall(t: Telegraph): void {
    const { direction, gapStart, gapEnd, speed } = t;
    const half = WORLD_SIZE / 2;
    const horiz = direction === "right" || direction === "left";
    const startPos = (direction === "right" || direction === "down") ? -half : half;

    const segments: GameObj[] = [];

    if (horiz) {
      if (gapStart + half > 0) {
        segments.push(this.k.add([
          this.k.rect(WALL_THICKNESS, gapStart + half),
          this.k.pos(startPos - WALL_THICKNESS / 2, -half),
          this.k.color(180, 30, 30), this.k.opacity(0.9), this.k.z(8),
          this.k.outline(3, this.k.rgb(255, 80, 80)),
        ]));
      }
      if (half - gapEnd > 0) {
        segments.push(this.k.add([
          this.k.rect(WALL_THICKNESS, half - gapEnd),
          this.k.pos(startPos - WALL_THICKNESS / 2, gapEnd),
          this.k.color(180, 30, 30), this.k.opacity(0.9), this.k.z(8),
          this.k.outline(3, this.k.rgb(255, 80, 80)),
        ]));
      }
    } else {
      if (gapStart + half > 0) {
        segments.push(this.k.add([
          this.k.rect(gapStart + half, WALL_THICKNESS),
          this.k.pos(-half, startPos - WALL_THICKNESS / 2),
          this.k.color(180, 30, 30), this.k.opacity(0.9), this.k.z(8),
          this.k.outline(3, this.k.rgb(255, 80, 80)),
        ]));
      }
      if (half - gapEnd > 0) {
        segments.push(this.k.add([
          this.k.rect(half - gapEnd, WALL_THICKNESS),
          this.k.pos(gapEnd, startPos - WALL_THICKNESS / 2),
          this.k.color(180, 30, 30), this.k.opacity(0.9), this.k.z(8),
          this.k.outline(3, this.k.rgb(255, 80, 80)),
        ]));
      }
    }

    this.playSfx("sfx-hit");
    this.k.shake(6);

    this.wall = { segments, direction, position: startPos, speed, gapStart, gapEnd };
  }

  private tickWall(dt: number, nowMs: number): void {
    const w = this.wall!;
    const half = WORLD_SIZE / 2;
    const horiz = w.direction === "right" || w.direction === "left";
    const sign = (w.direction === "right" || w.direction === "down") ? 1 : -1;

    w.position += sign * w.speed * dt;

    for (const seg of w.segments) {
      if (horiz) seg.pos.x = w.position - WALL_THICKNESS / 2;
      else seg.pos.y = w.position - WALL_THICKNESS / 2;
    }

    // Off-world → clean up
    if (
      (sign > 0 && w.position > half + WALL_THICKNESS) ||
      (sign < 0 && w.position < -half - WALL_THICKNESS)
    ) {
      for (const seg of w.segments) seg.destroy();
      this.wall = null;
      (this.warning as any).opacity = 0;
      return;
    }

    // Flash HUD warning while wall sweeps
    const flash = Math.sin(nowMs * 0.01) > 0;
    (this.warning as any).opacity = flash ? 0.9 : 0.3;

    // Player-wall collision
    const px = this.player.obj.pos.x;
    const py = this.player.obj.pos.y;

    if (horiz) {
      const inX = px >= w.position - WALL_THICKNESS / 2 && px <= w.position + WALL_THICKNESS / 2;
      const inGap = py >= w.gapStart && py <= w.gapEnd;
      if (inX && !inGap) this.hurtPlayer(nowMs);
    } else {
      const inY = py >= w.position - WALL_THICKNESS / 2 && py <= w.position + WALL_THICKNESS / 2;
      const inGap = px >= w.gapStart && px <= w.gapEnd;
      if (inY && !inGap) this.hurtPlayer(nowMs);
    }
  }

  private hurtPlayer(nowMs: number): void {
    if (nowMs - this.player.lastHitMs < 300) return;
    this.player.lastHitMs = nowMs;
    this.player.stats.hp = Math.max(0, this.player.stats.hp - WALL_DAMAGE);
    this.playSfx("sfx-hit");
    this.damageFlash.flash();
    this.k.shake(6);
  }
}

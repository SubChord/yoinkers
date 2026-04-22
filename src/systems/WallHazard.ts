import type { KAPLAYCtx, GameObj } from "kaplay";
import { WORLD_SIZE } from "../config/GameConfig";
import type { Player } from "../entities/Player";

const WALL_THICKNESS = 48;
const BASE_GAP_SIZE = 240;
const MIN_GAP_SIZE = 160;
const GAP_SHRINK_PER_WAVE = 6;
const WALL_DAMAGE = 50;
const TELEGRAPH_DURATION_MS = 2500;
const FIRST_WALL_WAVE = 6;

// Interval shrinks with each wall
const BASE_WALL_INTERVAL_MS = 28_000;
const MIN_WALL_INTERVAL_MS = 16_000;
const INTERVAL_SHRINK_PER_WALL = 2000;

// Speed ramps: first wall is slow so the player learns the mechanic
const WALL_BASE_SPEEDS = [180, 240, 280];
const WALL_SPEED_PER_WAVE = 12;

// Lava palette
const LAVA_CORE: [number, number, number] = [220, 60, 10];
const LAVA_BRIGHT: [number, number, number] = [255, 160, 30];
const LAVA_OUTLINE: [number, number, number] = [255, 200, 60];

type SweepDir = "right" | "down" | "left" | "up";

export interface WallSnapshot {
  direction: SweepDir;
  position: number;
  gapStart: number;
  gapEnd: number;
  phase: "telegraph" | "active";
}

interface ActiveWall {
  segments: GameObj[];
  glowSegments: GameObj[];
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
  private wallCount = 0;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private playSfx: (key: string) => void,
    private damageFlash: { flash: () => void },
  ) {}

  /** Snapshot for minimap rendering (null when inactive). */
  public snapshot(): WallSnapshot | null {
    if (this.telegraph) {
      const t = this.telegraph;
      const half = WORLD_SIZE / 2;
      const pos = (t.direction === "right" || t.direction === "down") ? -half : half;
      return { direction: t.direction, position: pos, gapStart: t.gapStart, gapEnd: t.gapEnd, phase: "telegraph" };
    }
    if (this.wall) {
      const w = this.wall;
      return { direction: w.direction, position: w.position, gapStart: w.gapStart, gapEnd: w.gapEnd, phase: "active" };
    }
    return null;
  }

  public update(nowMs: number, dt: number, wave: number): void {
    if (wave < FIRST_WALL_WAVE) return;

    if (!this.wall && !this.telegraph) {
      if (this.lastWallMs === 0) this.lastWallMs = nowMs;
      const interval = Math.max(
        MIN_WALL_INTERVAL_MS,
        BASE_WALL_INTERVAL_MS - this.wallCount * INTERVAL_SHRINK_PER_WALL,
      );
      if (nowMs - this.lastWallMs >= interval) {
        this.beginTelegraph(nowMs, wave);
      }
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

    const playerPerp = horiz ? this.player.obj.pos.y : this.player.obj.pos.x;
    const offset = this.k.rand(-180, 180);
    const gapCenter = Math.max(
      -half + gapSize / 2 + 20,
      Math.min(half - gapSize / 2 - 20, playerPerp + offset),
    );
    const gapStart = gapCenter - gapSize / 2;
    const gapEnd = gapCenter + gapSize / 2;

    const speedIdx = Math.min(this.wallCount, WALL_BASE_SPEEDS.length - 1);
    const speed = WALL_BASE_SPEEDS[speedIdx] + Math.max(0, wave - FIRST_WALL_WAVE) * WALL_SPEED_PER_WAVE;

    // Sound cue for incoming wall
    this.playSfx("sfx-hit");
    this.k.shake(3);

    // Flashing lava edge markers
    const objs: GameObj[] = [];
    const edgePos = (dir === "right" || dir === "down") ? -half : half;

    if (horiz) {
      if (gapStart + half > 0) {
        objs.push(this.k.add([
          this.k.rect(8, gapStart + half),
          this.k.pos(edgePos - 4, -half),
          this.k.color(...LAVA_BRIGHT), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      if (half - gapEnd > 0) {
        objs.push(this.k.add([
          this.k.rect(8, half - gapEnd),
          this.k.pos(edgePos - 4, gapEnd),
          this.k.color(...LAVA_BRIGHT), this.k.opacity(0.7), this.k.z(8),
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
          this.k.rect(gapStart + half, 8),
          this.k.pos(-half, edgePos - 4),
          this.k.color(...LAVA_BRIGHT), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      if (half - gapEnd > 0) {
        objs.push(this.k.add([
          this.k.rect(half - gapEnd, 8),
          this.k.pos(gapEnd, edgePos - 4),
          this.k.color(...LAVA_BRIGHT), this.k.opacity(0.7), this.k.z(8),
        ]));
      }
      objs.push(this.k.add([
        this.k.rect(gapEnd - gapStart, 18),
        this.k.pos(gapStart, edgePos - 9),
        this.k.color(50, 255, 50), this.k.opacity(0.5), this.k.z(8),
      ]));
    }

    this.telegraph = { objs, startMs: nowMs, direction: dir, gapStart, gapEnd, speed };
  }

  private tickTelegraph(nowMs: number): void {
    const t = this.telegraph!;
    const elapsed = nowMs - t.startMs;
    const flash = Math.sin(elapsed * 0.012) > 0;
    for (const obj of t.objs) (obj as any).opacity = flash ? 0.8 : 0.25;

    if (elapsed >= TELEGRAPH_DURATION_MS) {
      for (const obj of t.objs) obj.destroy();
      this.spawnWall(t);
      this.telegraph = null;
      this.lastWallMs = nowMs;
      this.wallCount += 1;
    }
  }

  /* ---- active wall ---- */

  private spawnWall(t: Telegraph): void {
    const { direction, gapStart, gapEnd, speed } = t;
    const half = WORLD_SIZE / 2;
    const horiz = direction === "right" || direction === "left";
    const startPos = (direction === "right" || direction === "down") ? -half : half;

    const segments: GameObj[] = [];
    const glowSegments: GameObj[] = [];
    const GLOW_EXTRA = 12;

    const addLavaSegment = (w: number, h: number, x: number, y: number) => {
      // Outer glow layer
      glowSegments.push(this.k.add([
        this.k.rect(w + GLOW_EXTRA, h + GLOW_EXTRA),
        this.k.pos(x - GLOW_EXTRA / 2, y - GLOW_EXTRA / 2),
        this.k.color(...LAVA_BRIGHT), this.k.opacity(0.35), this.k.z(7),
      ]));
      // Core lava
      segments.push(this.k.add([
        this.k.rect(w, h),
        this.k.pos(x, y),
        this.k.color(...LAVA_CORE), this.k.opacity(0.95), this.k.z(8),
        this.k.outline(3, this.k.rgb(...LAVA_OUTLINE)),
      ]));
    };

    if (horiz) {
      if (gapStart + half > 0) {
        addLavaSegment(WALL_THICKNESS, gapStart + half, startPos - WALL_THICKNESS / 2, -half);
      }
      if (half - gapEnd > 0) {
        addLavaSegment(WALL_THICKNESS, half - gapEnd, startPos - WALL_THICKNESS / 2, gapEnd);
      }
    } else {
      if (gapStart + half > 0) {
        addLavaSegment(gapStart + half, WALL_THICKNESS, -half, startPos - WALL_THICKNESS / 2);
      }
      if (half - gapEnd > 0) {
        addLavaSegment(half - gapEnd, WALL_THICKNESS, gapEnd, startPos - WALL_THICKNESS / 2);
      }
    }

    this.playSfx("sfx-hit");
    this.k.shake(6);

    this.wall = { segments, glowSegments, direction, position: startPos, speed, gapStart, gapEnd };
  }

  private tickWall(dt: number, nowMs: number): void {
    const w = this.wall!;
    const half = WORLD_SIZE / 2;
    const horiz = w.direction === "right" || w.direction === "left";
    const sign = (w.direction === "right" || w.direction === "down") ? 1 : -1;
    const GLOW_EXTRA = 12;

    w.position += sign * w.speed * dt;

    for (const seg of w.segments) {
      if (horiz) seg.pos.x = w.position - WALL_THICKNESS / 2;
      else seg.pos.y = w.position - WALL_THICKNESS / 2;
    }
    for (const glow of w.glowSegments) {
      if (horiz) glow.pos.x = w.position - WALL_THICKNESS / 2 - GLOW_EXTRA / 2;
      else glow.pos.y = w.position - WALL_THICKNESS / 2 - GLOW_EXTRA / 2;
    }

    // Animate lava glow pulse
    const pulse = 0.25 + Math.sin(nowMs * 0.006) * 0.15;
    for (const glow of w.glowSegments) (glow as any).opacity = pulse;
    // Animate core color flicker between LAVA_CORE and brighter
    const flicker = Math.sin(nowMs * 0.008);
    const r = LAVA_CORE[0] + Math.floor(flicker * 35);
    const g = LAVA_CORE[1] + Math.floor(flicker * 30);
    for (const seg of w.segments) {
      try { (seg as any).color = { r, g, b: LAVA_CORE[2] }; } catch { /* skip */ }
    }

    // Off-world → clean up
    if (
      (sign > 0 && w.position > half + WALL_THICKNESS) ||
      (sign < 0 && w.position < -half - WALL_THICKNESS)
    ) {
      for (const seg of w.segments) seg.destroy();
      for (const glow of w.glowSegments) glow.destroy();
      this.wall = null;
      return;
    }

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

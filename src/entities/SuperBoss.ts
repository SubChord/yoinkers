import type { KAPLAYCtx, GameObj } from "kaplay";
import type { Player } from "./Player";
import type { Enemy } from "./Enemy";
import { GAME_HEIGHT, GAME_WIDTH, PLAYER_IFRAME_MS } from "../config/GameConfig";

/* ── Constants ───────────────────────────────────────────────── */

const BOSS_HP = 50_000;
const BOSS_DAMAGE = 50;
const BOSS_VISUAL_SCALE = 25;
const BOSS_AREA = 280;

// Hop timing
const IDLE_DURATION = 1.2; // seconds between hops
const SQUAT_DURATION = 0.4;
const AIRBORNE_DURATION = 0.7;
const LAND_STUN = 0.3;

// Lava pools
const LAVA_LIFETIME_MS = 12_000;
const LAVA_DAMAGE = 12;
const LAVA_SLOW_MULT = 0.4;
const LAVA_SLOW_DURATION_MS = 800;
const LAVA_RADIUS = 80;
const LAVA_HIT_COOLDOWN_MS = 400;

// Landing impact
const LAND_IMPACT_RADIUS = 300;
const LAND_IMPACT_DAMAGE = 70;

// Enrage threshold
const ENRAGE_HP_RATIO = 0.35;
const ENRAGE_IDLE_MULT = 0.5;

/* ── Types ───────────────────────────────────────────────────── */

type BossPhase = "intro" | "idle" | "squat" | "airborne" | "land" | "dead";

export interface LavaPool {
  obj: GameObj;
  expiresMs: number;
  lastHitMs: number;
}

export interface SuperBoss {
  obj: GameObj;
  shadow: GameObj;
  hp: number;
  maxHp: number;
  phase: BossPhase;
  timer: number;
  targetX: number;
  targetY: number;
  jumpStartX: number;
  jumpStartY: number;
  lavaPools: LavaPool[];
  hpBar: { bg: GameObj; fill: GameObj; label: GameObj };
  enraged: boolean;
}

/* ── Spawn ───────────────────────────────────────────────────── */

export function spawnSuperBoss(k: KAPLAYCtx, player: Player): SuperBoss {
  const px = player.obj.pos.x;
  const py = player.obj.pos.y;

  // Spawn at edge of screen
  const angle = k.rand(0, Math.PI * 2);
  const x = px + Math.cos(angle) * 400;
  const y = py + Math.sin(angle) * 400;

  // Shadow on ground
  const shadow = k.add([
    k.circle(BOSS_AREA),
    k.pos(x, y),
    k.anchor("center"),
    k.color(0, 0, 0),
    k.opacity(0.3),
    k.z(3),
  ]);

  const obj = k.add([
    k.sprite("enemy-slime", { anim: "walk-down" }),
    k.pos(x, y),
    k.anchor("center"),
    k.scale(BOSS_VISUAL_SCALE),
    k.color(255, 100, 30),
    k.z(8),
  ]);

  // Boss HP bar (bottom of screen, fixed UI)
  const barWidth = GAME_WIDTH * 0.6;
  const barX = (GAME_WIDTH - barWidth) / 2;
  const barY = GAME_HEIGHT - 40;

  const bg = k.add([
    k.rect(barWidth + 4, 26),
    k.pos(barX - 2, barY - 2),
    k.color(30, 30, 30),
    k.opacity(0.85),
    k.fixed(),
    k.z(110),
  ]);

  const fill = k.add([
    k.rect(barWidth, 22),
    k.pos(barX, barY),
    k.color(255, 60, 20),
    k.opacity(0.95),
    k.fixed(),
    k.z(111),
  ]);

  const label = k.add([
    k.text("LAVA SLIME", { size: 18 }),
    k.pos(GAME_WIDTH / 2, barY - 20),
    k.anchor("center"),
    k.color(255, 180, 80),
    k.fixed(),
    k.z(112),
  ]);

  return {
    obj, shadow, hp: BOSS_HP, maxHp: BOSS_HP,
    phase: "intro", timer: 0,
    targetX: px, targetY: py,
    jumpStartX: x, jumpStartY: y,
    lavaPools: [],
    hpBar: { bg, fill, label },
    enraged: false,
  };
}

/* ── Absorb animation (suck up all mobs) ─────────────────────── */

export function absorbEnemies(
  k: KAPLAYCtx,
  boss: SuperBoss,
  enemies: Enemy[],
  onDone: () => void,
): void {
  const bx = boss.obj.pos.x;
  const by = boss.obj.pos.y;
  let remaining = enemies.length;

  if (remaining === 0) {
    onDone();
    return;
  }

  for (const enemy of enemies) {
    const startX = enemy.obj.pos.x;
    const startY = enemy.obj.pos.y;
    let t = 0;
    const dur = 0.5 + k.rand(0, 0.3);

    enemy.obj.onUpdate(() => {
      t += k.dt();
      const p = Math.min(t / dur, 1);
      const ease = p * p; // accelerate toward boss
      enemy.obj.pos.x = startX + (bx - startX) * ease;
      enemy.obj.pos.y = startY + (by - startY) * ease;
      try { (enemy.obj as any).scaleTo(2 * (1 - p)); } catch { /* skip */ }
      (enemy.obj as any).opacity = 1 - p;

      if (p >= 1) {
        enemy.obj.destroy();
        remaining -= 1;
        if (remaining <= 0) onDone();
      }
    });
  }
}

/* ── Update ──────────────────────────────────────────────────── */

export interface BossUpdateResult {
  landed: boolean;
  landX: number;
  landY: number;
  dead: boolean;
}

export function updateSuperBoss(
  k: KAPLAYCtx,
  boss: SuperBoss,
  player: Player,
  dt: number,
  nowMs: number,
): BossUpdateResult {
  const result: BossUpdateResult = { landed: false, landX: 0, landY: 0, dead: false };

  if (boss.phase === "dead") {
    result.dead = true;
    return result;
  }

  boss.timer += dt;
  const idleDur = boss.enraged ? IDLE_DURATION * ENRAGE_IDLE_MULT : IDLE_DURATION;

  // Enrage check
  if (!boss.enraged && boss.hp / boss.maxHp <= ENRAGE_HP_RATIO) {
    boss.enraged = true;
    try { (boss.obj as any).color = { r: 255, g: 40, b: 10 }; } catch { /* skip */ }
  }

  switch (boss.phase) {
    case "intro":
      // Brief pause before first hop
      if (boss.timer >= 1.5) {
        boss.phase = "idle";
        boss.timer = 0;
      }
      break;

    case "idle":
      // Pulsing glow while idle
      {
        const pulse = 1 + Math.sin(boss.timer * 4) * 0.05;
        try { (boss.obj as any).scaleTo(BOSS_VISUAL_SCALE * pulse); } catch { /* skip */ }
      }
      if (boss.timer >= idleDur) {
        boss.phase = "squat";
        boss.timer = 0;
        // Lock target to player position
        boss.targetX = player.obj.pos.x;
        boss.targetY = player.obj.pos.y;
        boss.jumpStartX = boss.obj.pos.x;
        boss.jumpStartY = boss.obj.pos.y;
      }
      break;

    case "squat":
      // Pulse down (telegraph) — uniform scale shrink
      {
        const p = Math.min(boss.timer / SQUAT_DURATION, 1);
        const s = BOSS_VISUAL_SCALE * (1 - p * 0.2);
        try { (boss.obj as any).scaleTo(s); } catch { /* skip */ }
      }
      if (boss.timer >= SQUAT_DURATION) {
        boss.phase = "airborne";
        boss.timer = 0;
      }
      break;

    case "airborne":
      // Arc toward target
      {
        const p = Math.min(boss.timer / AIRBORNE_DURATION, 1);
        const lerpX = boss.jumpStartX + (boss.targetX - boss.jumpStartX) * p;
        const lerpY = boss.jumpStartY + (boss.targetY - boss.jumpStartY) * p;
        // Parabolic height
        const height = Math.sin(p * Math.PI) * 400;
        boss.obj.pos.x = lerpX;
        boss.obj.pos.y = lerpY - height;
        boss.shadow.pos.x = lerpX;
        boss.shadow.pos.y = lerpY;
        // Shrink shadow when high
        const shadowScale = 1 - Math.sin(p * Math.PI) * 0.5;
        (boss.shadow as any).opacity = 0.3 * shadowScale;

        // Spin while airborne
        (boss.obj as any).angle = ((boss.obj as any).angle ?? 0) + dt * 400;
        try { (boss.obj as any).scaleTo(BOSS_VISUAL_SCALE); } catch { /* skip */ }
      }
      if (boss.timer >= AIRBORNE_DURATION) {
        boss.phase = "land";
        boss.timer = 0;
        boss.obj.pos.x = boss.targetX;
        boss.obj.pos.y = boss.targetY;
        boss.shadow.pos.x = boss.targetX;
        boss.shadow.pos.y = boss.targetY;
        (boss.obj as any).angle = 0;
        result.landed = true;
        result.landX = boss.targetX;
        result.landY = boss.targetY;
        // Spawn lava pool at landing
        spawnLavaPool(k, boss, boss.targetX, boss.targetY, nowMs);
      }
      break;

    case "land":
      // Bounce expand on landing — uniform scale
      {
        const p = Math.min(boss.timer / LAND_STUN, 1);
        const s = BOSS_VISUAL_SCALE * (1 + (1 - p) * 0.25);
        try { (boss.obj as any).scaleTo(s); } catch { /* skip */ }
      }
      if (boss.timer >= LAND_STUN) {
        boss.phase = "idle";
        boss.timer = 0;
      }
      break;
  }

  // Update lava pools (remove expired)
  for (let i = boss.lavaPools.length - 1; i >= 0; i -= 1) {
    const pool = boss.lavaPools[i];
    if (nowMs >= pool.expiresMs) {
      pool.obj.destroy();
      boss.lavaPools.splice(i, 1);
    } else {
      // Flicker effect
      const lifeRatio = 1 - (pool.expiresMs - nowMs) / LAVA_LIFETIME_MS;
      const flicker = 0.7 + 0.2 * Math.sin(nowMs * 0.01 + pool.obj.pos.x);
      (pool.obj as any).opacity = flicker * (1 - lifeRatio * 0.5);
    }
  }

  // Update HP bar
  const hpRatio = Math.max(0, boss.hp / boss.maxHp);
  const barWidth = GAME_WIDTH * 0.6;
  (boss.hpBar.fill as any).width = barWidth * hpRatio;
  // Color shifts as HP drops
  if (hpRatio < 0.3) {
    try { (boss.hpBar.fill as any).color = k.rgb(255, 30, 10); } catch { /* skip */ }
  }
  const hpText = `LAVA SLIME  ${Math.ceil(boss.hp)} / ${boss.maxHp}`;
  (boss.hpBar.label as any).text = hpText;

  return result;
}

/* ── Lava pool spawning ──────────────────────────────────────── */

function spawnLavaPool(k: KAPLAYCtx, boss: SuperBoss, x: number, y: number, nowMs: number): void {
  const obj = k.add([
    k.circle(LAVA_RADIUS),
    k.pos(x, y),
    k.anchor("center"),
    k.color(255, 80, 10),
    k.opacity(0.7),
    k.z(2),
  ]);
  boss.lavaPools.push({
    obj,
    expiresMs: nowMs + LAVA_LIFETIME_MS,
    lastHitMs: 0,
  });
}

/* ── Lava pool damage check ──────────────────────────────────── */

export function checkLavaPoolDamage(
  k: KAPLAYCtx,
  boss: SuperBoss,
  player: Player,
  nowMs: number,
  damageFlash: { flash: () => void },
): void {
  if (nowMs - player.lastHitMs < PLAYER_IFRAME_MS) return;

  for (const pool of boss.lavaPools) {
    if (nowMs - pool.lastHitMs < LAVA_HIT_COOLDOWN_MS) continue;
    const dx = player.obj.pos.x - pool.obj.pos.x;
    const dy = player.obj.pos.y - pool.obj.pos.y;
    if (dx * dx + dy * dy <= LAVA_RADIUS * LAVA_RADIUS) {
      pool.lastHitMs = nowMs;
      player.lastHitMs = nowMs;
      player.stats.hp = Math.max(0, player.stats.hp - LAVA_DAMAGE);
      // Apply slow
      player.stats.speedBuffMult = LAVA_SLOW_MULT;
      player.stats.speedBuffExpiresMs = nowMs + LAVA_SLOW_DURATION_MS;
      damageFlash.flash();
      k.shake(2);
      return;
    }
  }
}

/* ── Landing impact damage ───────────────────────────────────── */

export function checkLandingDamage(
  k: KAPLAYCtx,
  boss: SuperBoss,
  player: Player,
  landX: number,
  landY: number,
  nowMs: number,
  damageFlash: { flash: () => void },
): void {
  const dx = player.obj.pos.x - landX;
  const dy = player.obj.pos.y - landY;
  if (dx * dx + dy * dy <= LAND_IMPACT_RADIUS * LAND_IMPACT_RADIUS) {
    if (nowMs - player.lastHitMs >= PLAYER_IFRAME_MS) {
      player.lastHitMs = nowMs;
      player.stats.hp = Math.max(0, player.stats.hp - LAND_IMPACT_DAMAGE);
      damageFlash.flash();
    }
  }
  k.shake(10);
}

/* ── Boss touch damage ───────────────────────────────────────── */

export function checkBossTouchDamage(
  k: KAPLAYCtx,
  boss: SuperBoss,
  player: Player,
  nowMs: number,
  damageFlash: { flash: () => void },
): void {
  if (boss.phase === "airborne" || boss.phase === "dead") return;
  if (nowMs - player.lastHitMs < PLAYER_IFRAME_MS) return;

  const dx = player.obj.pos.x - boss.obj.pos.x;
  const dy = player.obj.pos.y - boss.obj.pos.y;
  const range = BOSS_AREA + 16;
  if (dx * dx + dy * dy <= range * range) {
    player.lastHitMs = nowMs;
    player.stats.hp = Math.max(0, player.stats.hp - BOSS_DAMAGE);
    damageFlash.flash();
    k.shake(5);
  }
}

/* ── Boss death ──────────────────────────────────────────────── */

export function killSuperBoss(k: KAPLAYCtx, boss: SuperBoss): void {
  boss.phase = "dead";

  // Destroy all lava pools
  for (const pool of boss.lavaPools) pool.obj.destroy();
  boss.lavaPools = [];

  // Death explosion VFX
  const bx = boss.obj.pos.x;
  const by = boss.obj.pos.y;
  k.shake(16);

  // Multiple shockwave rings
  for (let r = 0; r < 3; r++) {
    const delay = r * 0.12;
    const ring = k.add([
      k.circle(20),
      k.pos(bx, by),
      k.anchor("center"),
      k.color(255, 120 - r * 30, 10),
      k.opacity(0),
      k.scale(1),
      k.z(14),
    ]);
    let rt = 0;
    ring.onUpdate(() => {
      rt += k.dt();
      if (rt < delay) return;
      const t = rt - delay;
      const p = Math.min(t / 0.5, 1);
      try { (ring as any).scaleTo(1 + p * 12); } catch { /* skip */ }
      (ring as any).opacity = 0.8 * (1 - p);
      if (p >= 1) ring.destroy();
    });
  }

  // Boss shrink + spin + fade
  let t = 0;
  const startScale = BOSS_VISUAL_SCALE;
  boss.obj.onUpdate(() => {
    t += k.dt();
    const p = Math.min(t / 1.0, 1);
    try { (boss.obj as any).scaleTo(startScale * (1 - p)); } catch { /* skip */ }
    (boss.obj as any).opacity = 1 - p;
    (boss.obj as any).angle = ((boss.obj as any).angle ?? 0) + k.dt() * 800;
    if (p >= 1) {
      boss.obj.destroy();
      boss.shadow.destroy();
    }
  });

  // Fade HP bar
  let bt = 0;
  boss.hpBar.bg.onUpdate(() => {
    bt += k.dt();
    (boss.hpBar.bg as any).opacity = Math.max(0, 0.85 - bt);
    (boss.hpBar.fill as any).opacity = Math.max(0, 0.95 - bt);
    (boss.hpBar.label as any).opacity = Math.max(0, 1 - bt);
    if (bt >= 1) {
      boss.hpBar.bg.destroy();
      boss.hpBar.fill.destroy();
      boss.hpBar.label.destroy();
    }
  });

  // Lava sparks
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 150 + Math.random() * 300;
    const spark = k.add([
      k.circle(k.rand(3, 6)),
      k.pos(bx, by),
      k.anchor("center"),
      k.color(255, k.rand(60, 180) | 0, 20),
      k.opacity(1),
      k.z(14),
    ]);
    let st = 0;
    spark.onUpdate(() => {
      st += k.dt();
      spark.pos.x += Math.cos(angle) * spd * k.dt();
      spark.pos.y += Math.sin(angle) * spd * k.dt();
      (spark as any).opacity = Math.max(0, 1 - st / 0.6);
      if (st >= 0.6) spark.destroy();
    });
  }
}

export const SUPER_BOSS_XP = 800;

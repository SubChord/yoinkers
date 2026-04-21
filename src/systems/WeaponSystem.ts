import type { KAPLAYCtx } from "kaplay";
import { WEAPON_DEFS, type WeaponId, type WeaponStats } from "../config/WeaponDefs";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import { spawnProjectile, type Projectile } from "../entities/Projectile";
import type { EnemySpawner } from "./EnemySpawner";
import { impactVfx } from "./PickupVfx";
import type { StatsTracker } from "./StatsTracker";

const MAGIC_ORB_HIT_COOLDOWN_MS = 500;
const CALTROP_HIT_COOLDOWN_MS = 400;
const CALTROP_LIFETIME_MS = 6000;
const FIRE_TRAIL_HIT_COOLDOWN_MS = 300;
const FIRE_TRAIL_LIFETIME_MS = 4000;
const FIRE_TRAIL_DROP_DIST = 28;
const FIRE_ARROW_BONUS_MULT = 1.5;

const POISON_CLOUD_LIFETIME_MS = 7000;
const POISON_CLOUD_HIT_COOLDOWN_MS = 600;
const FROSTBOLT_SLOW_MS = 1500;
const FROSTBOLT_SLOW_MULT = 0.4;
const HOMING_TURN_RATE = 4.5; // how fast the shuriken steers toward its target
const CHAIN_RANGE = 180; // max distance between consecutive chain jumps

const SAMURAI_SPREAD = Math.PI * 0.9;
const SAMURAI_RADIUS = 52;
const SAMURAI_REACH = 88;

function samuraiSlashProgress(p: Projectile): number {
  return Math.min(1, p.lifetimeMs > 0 ? p.elapsedMs / p.lifetimeMs : 0);
}

interface WeaponState {
  lastFireMs: number;
}

import type { SuperBoss } from "../entities/SuperBoss";

const BOSS_AREA = 280;

export class WeaponSystem {
  public projectiles: Projectile[] = [];
  public superBoss: SuperBoss | null = null;
  private weaponStates: Map<WeaponId, WeaponState> = new Map();
  private lastFireDropX = 0;
  private lastFireDropY = 0;

  constructor(
    private k: KAPLAYCtx,
    private player: Player,
    private spawner: EnemySpawner,
    private onEnemyDeath: (enemy: Enemy, index: number) => void,
    private onEnemyHit: () => void,
    private stats: StatsTracker,
    private onDamageDealt: (amount: number) => void = () => {},
  ) {}

  public update(nowMs: number, dt: number): void {
    for (const weaponId of this.player.stats.weapons) {
      this.fireWeapon(weaponId, nowMs);
    }
    this.updateProjectiles(nowMs, dt);
  }

  private computeStats(weaponId: WeaponId): WeaponStats {
    const def = WEAPON_DEFS[weaponId];
    const upgrades = this.player.stats.upgrades;
    const level = upgrades[`${weaponId}-damage`] ?? 0;
    const cooldownLevel = upgrades[`${weaponId}-cooldown`] ?? 0;
    const countLevel = upgrades[`${weaponId}-count`] ?? 0;

    const damageBonus = damageBonusFor(weaponId) * level;
    const countBonus = countLevel;

    return {
      damage: Math.floor(
        (def.base.damage + damageBonus) *
          this.player.stats.damageMult *
          this.player.stats.damageBuffMult,
      ),
      cooldownMs: def.base.cooldownMs * Math.pow(0.85, cooldownLevel) * this.player.stats.cooldownMult,
      speed: def.base.speed,
      range: def.base.range,
      count: def.base.count + countBonus,
      area: def.base.area,
    };
  }

  private fireWeapon(weaponId: WeaponId, nowMs: number): void {
    const stats = this.computeStats(weaponId);
    const state = this.weaponStates.get(weaponId) ?? { lastFireMs: -Number.MAX_SAFE_INTEGER };
    this.weaponStates.set(weaponId, state);

    if (weaponId === "magicOrb") {
      this.ensureOrbit("magicOrb", stats, { radius: 60, speed: 2.4, scale: 1.5 });
      return;
    }
    if (weaponId === "dualKatana") {
      this.ensureOrbit("dualKatana", stats, { radius: 72, speed: 4.2, scale: 2.6 });
      return;
    }
    if (weaponId === "arcaneHalo") {
      this.ensureOrbit("arcaneHalo", stats, { radius: 96, speed: 3.6, scale: 2.2 });
      return;
    }

    if (weaponId === "fireTrail") {
      this.dropFireTrail(stats);
      return;
    }

    if (nowMs - state.lastFireMs < stats.cooldownMs) return;
    state.lastFireMs = nowMs;

    switch (weaponId) {
      case "shuriken":
        this.fireShuriken(stats, "shuriken");
        break;
      case "stormShuriken":
        this.fireShuriken(stats, "stormShuriken");
        break;
      case "boomerang":
        this.fireBoomerang(stats, "boomerang");
        break;
      case "warhammerKunai":
        this.fireBoomerang(stats, "warhammerKunai");
        break;
      case "arrow":
        this.fireArrow(stats, "arrow");
        break;
      case "arrowHail":
        this.fireArrowHail(stats);
        break;
      case "bomb":
        this.fireBomb(stats, "bomb");
        break;
      case "megaBomb":
        this.fireBomb(stats, "megaBomb");
        break;
      case "caltrop":
        this.dropCaltrops(stats, nowMs, "caltrop");
        break;
      case "bloodspikes":
        this.dropCaltrops(stats, nowMs, "bloodspikes");
        break;
      case "samuraiSword":
        this.fireSamuraiSlash(stats);
        break;
      case "holyBeam":
        this.fireHolyBeam(stats);
        break;
      case "holyWater":
        this.fireHolyWater(stats);
        break;
      case "judasPriest":
        this.fireJudasPriest(stats);
        break;
      case "laserPointer":
        this.fireLaserPointer(stats);
        break;
      case "frostbolt":
        this.fireFrostbolt(stats);
        break;
      case "poisonCloud":
        this.dropPoisonCloud(stats);
        break;
      case "crossbow":
        this.fireCrossbow(stats);
        break;
      case "chainLightning":
        this.fireChainLightning(stats, nowMs);
        break;
      case "homingShuriken":
        this.fireHomingShuriken(stats);
        break;
    }
  }

  private fireFrostbolt(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const baseDir = target
      ? this.k.vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y).unit()
      : this.k.vec2(1, 0);
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.18;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "linear",
          weapon: "frostbolt",
          sprite: WEAPON_DEFS.frostbolt.spriteKey,
          x: p.x,
          y: p.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
        }),
      );
    }
  }

  private dropPoisonCloud(stats: WeaponStats): void {
    const cx = this.player.obj.pos.x;
    const cy = this.player.obj.pos.y;
    for (let i = 0; i < stats.count; i += 1) {
      const jitter = stats.count > 1 ? 40 : 0;
      const ox = stats.count === 1 ? 0 : this.k.rand(-jitter, jitter);
      const oy = stats.count === 1 ? 0 : this.k.rand(-jitter, jitter);
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "ground",
          weapon: "poisonCloud",
          sprite: WEAPON_DEFS.poisonCloud.spriteKey,
          x: cx + ox,
          y: cy + oy,
          dir: this.k.vec2(1, 0),
          speed: 0,
          damage: stats.damage,
          area: stats.area,
          maxRange: 0,
          lifetimeMs: POISON_CLOUD_LIFETIME_MS,
          scale: 2.5,
        }),
      );
    }
  }

  private fireCrossbow(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    if (!target) return;
    const baseDir = this.k
      .vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y)
      .unit();
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.1;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "pierce",
          weapon: "crossbow",
          sprite: WEAPON_DEFS.crossbow.spriteKey,
          x: p.x,
          y: p.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          piercesLeft: 2,
          rotationOffset: 0,
          scale: 2.2,
        }),
      );
    }
  }

  private fireHomingShuriken(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const baseDir = target
      ? this.k.vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y).unit()
      : this.k.vec2(1, 0);
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.6;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "linear",
          weapon: "homingShuriken",
          sprite: WEAPON_DEFS.homingShuriken.spriteKey,
          x: p.x,
          y: p.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
        }),
      );
    }
  }

  private fireChainLightning(stats: WeaponStats, nowMs: number): void {
    const p = this.player.obj.pos;
    const first = this.spawner.nearest(p.x, p.y);
    if (!first) return;

    const maxJumps = 2 + stats.count; // base 2 count + upgrades
    const hit = new Set<number>();
    let prevX = p.x;
    let prevY = p.y;
    let next: Enemy | null = first;

    for (let jump = 0; jump < maxJumps && next; jump += 1) {
      const enemyIndex = this.spawner.enemies.indexOf(next);
      if (enemyIndex < 0) break;

      // Diminishing damage on each jump
      const damage = Math.floor(stats.damage * Math.pow(0.8, jump));
      this.dealInstantDamage("chainLightning", damage, enemyIndex, [255, 230, 120]);
      hit.add(enemyIndex);

      this.spawnChainArc(prevX, prevY, next.obj.pos.x, next.obj.pos.y);

      prevX = next.obj.pos.x;
      prevY = next.obj.pos.y;
      next = this.findNextChainTarget(prevX, prevY, hit);
    }

    void nowMs;
  }

  private findNextChainTarget(
    fromX: number,
    fromY: number,
    excluded: Set<number>,
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestD2 = CHAIN_RANGE * CHAIN_RANGE;
    for (let j = 0; j < this.spawner.enemies.length; j += 1) {
      if (excluded.has(j)) continue;
      const e = this.spawner.enemies[j];
      const dx = e.obj.pos.x - fromX;
      const dy = e.obj.pos.y - fromY;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = e;
      }
    }
    return best;
  }

  private spawnChainArc(x1: number, y1: number, x2: number, y2: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const arc = this.k.add([
      this.k.rect(len, 3),
      this.k.pos(x1, y1),
      this.k.anchor("left"),
      this.k.rotate(angle),
      this.k.color(255, 235, 140),
      this.k.opacity(0.9),
      this.k.z(6),
    ]);
    let t = 0;
    arc.onUpdate(() => {
      t += this.k.dt();
      (arc as unknown as { opacity: number }).opacity = Math.max(0, 0.9 - t * 5);
      if (t > 0.18) arc.destroy();
    });
  }

  private dealInstantDamage(
    weapon: WeaponId,
    damage: number,
    enemyIndex: number,
    color: [number, number, number],
  ): void {
    const enemy = this.spawner.enemies[enemyIndex];
    if (!enemy) return;
    const applied = Math.min(enemy.hp, damage);
    enemy.hp -= damage;
    this.stats.record(weapon, applied);
    this.onDamageDealt(applied);
    const killed = enemy.hp <= 0;
    impactVfx(this.k, {
      x: enemy.obj.pos.x,
      y: enemy.obj.pos.y,
      color,
      kill: killed,
    });
    if (killed) this.onEnemyDeath(enemy, enemyIndex);
    else this.onEnemyHit();
  }

  private fireJudasPriest(stats: WeaponStats): void {
    const count = Math.max(8, stats.count);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + this.k.rand(-0.04, 0.04);
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "pierce",
          weapon: "judasPriest",
          sprite: WEAPON_DEFS.judasPriest.spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          piercesLeft: 99,
          rotationOffset: 0,
        }),
      );
    }
  }

  private fireLaserPointer(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const baseDir = target
      ? this.k.vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y).unit()
      : this.k.vec2(1, 0);
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.22;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "pierce",
          weapon: "laserPointer",
          sprite: WEAPON_DEFS.laserPointer.spriteKey,
          x: p.x,
          y: p.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          piercesLeft: 99,
          rotationOffset: 0,
          scale: 2,
        }),
      );
    }
  }

  private fireHolyBeam(stats: WeaponStats): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    const baseDir = target
      ? this.k
          .vec2(
            target.obj.pos.x - this.player.obj.pos.x,
            target.obj.pos.y - this.player.obj.pos.y,
          )
          .unit()
      : this.k.vec2(1, 0);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.14;
      const baseAngle = Math.atan2(baseDir.y, baseDir.x) + offset;
      const dir = this.k.vec2(Math.cos(baseAngle), Math.sin(baseAngle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "pierce",
          weapon: "holyBeam",
          sprite: WEAPON_DEFS.holyBeam.spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: 1400,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          piercesLeft: 99,
          rotationOffset: 0,
        }),
      );
    }
  }

  private fireHolyWater(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const dir = target
      ? this.k.vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y).unit()
      : this.k.vec2(1, 0);
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.35;
      const a = Math.atan2(dir.y, dir.x) + offset;
      const d = this.k.vec2(Math.cos(a), Math.sin(a));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "bomb",
          weapon: "holyWater",
          sprite: WEAPON_DEFS.holyWater.spriteKey,
          x: p.x,
          y: p.y,
          dir: d,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
        }),
      );
    }
  }

  private updateSamuraiSlash(p: Projectile): void {
    const t = samuraiSlashProgress(p);
    const spread = SAMURAI_SPREAD;
    const baseAngle = Math.atan2(p.dir.y, p.dir.x);
    const angle = baseAngle - spread / 2 + spread * t;
    const radius = SAMURAI_RADIUS;
    const playerPos = this.player.obj.pos;
    p.obj.pos.x = playerPos.x + Math.cos(angle) * radius;
    p.obj.pos.y = playerPos.y + Math.sin(angle) * radius;
    (p.obj as { angle?: number }).angle = (angle * 180) / Math.PI + 90;
  }

  private checkSamuraiSlashHits(p: Projectile): void {
    // Swept-arc hit detection. Every enemy within the blade's reach and
    // within the part of the arc the blade has already swept through takes
    // one hit per swing (tracked via hitCooldownsMs).
    const t = samuraiSlashProgress(p);
    const baseAngle = Math.atan2(p.dir.y, p.dir.x);
    const sweptFrom = -SAMURAI_SPREAD / 2;
    const sweptTo = sweptFrom + SAMURAI_SPREAD * t;
    const playerPos = this.player.obj.pos;

    for (let i = this.spawner.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.spawner.enemies[i];
      const key = enemyId(enemy);
      if (p.hitCooldownsMs.has(key)) continue;

      const dx = enemy.obj.pos.x - playerPos.x;
      const dy = enemy.obj.pos.y - playerPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4 || dist > SAMURAI_REACH + enemy.area) continue;

      let rel = Math.atan2(dy, dx) - baseAngle;
      while (rel > Math.PI) rel -= Math.PI * 2;
      while (rel < -Math.PI) rel += Math.PI * 2;
      if (rel < sweptFrom || rel > sweptTo) continue;

      p.hitCooldownsMs.set(key, 1);
      this.applyHit(p, i);
    }
  }

  private fireSamuraiSlash(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const rawDx = target ? target.obj.pos.x - p.x : 1;
    const rawDy = target ? target.obj.pos.y - p.y : 0;
    const len = Math.hypot(rawDx, rawDy) || 1;
    const dir = this.k.vec2(rawDx / len, rawDy / len);

    const startAngle = Math.atan2(dir.y, dir.x) - SAMURAI_SPREAD / 2;
    const startX = p.x + Math.cos(startAngle) * SAMURAI_RADIUS;
    const startY = p.y + Math.sin(startAngle) * SAMURAI_RADIUS;

    this.projectiles.push(
      spawnProjectile(this.k, {
        kind: "ground",
        weapon: "samuraiSword",
        sprite: WEAPON_DEFS.samuraiSword.spriteKey,
        x: startX,
        y: startY,
        dir,
        speed: 0,
        damage: stats.damage,
        area: stats.area,
        maxRange: 0,
        lifetimeMs: 420,
        scale: 5,
      }),
    );
  }

  private fireShuriken(stats: WeaponStats, weapon: WeaponId): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    if (!target) return;
    const baseDir = this.k
      .vec2(target.obj.pos.x - this.player.obj.pos.x, target.obj.pos.y - this.player.obj.pos.y)
      .unit();
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);

    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.25;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "linear",
          weapon,
          sprite: WEAPON_DEFS[weapon].spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
        }),
      );
    }
  }

  private fireBoomerang(stats: WeaponStats, weapon: WeaponId): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    const baseDir = target
      ? this.k
          .vec2(
            target.obj.pos.x - this.player.obj.pos.x,
            target.obj.pos.y - this.player.obj.pos.y,
          )
          .unit()
      : this.k.vec2(1, 0);

    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    const scale = weapon === "warhammerKunai" ? 2.4 : 1;
    for (let i = 0; i < stats.count; i += 1) {
      const angle = baseAngle + (i - (stats.count - 1) / 2) * 0.6;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "boomerang",
          weapon,
          sprite: WEAPON_DEFS[weapon].spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          scale,
        }),
      );
    }
  }

  private fireArrow(stats: WeaponStats, weapon: WeaponId): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    const baseDir = target
      ? this.k
          .vec2(
            target.obj.pos.x - this.player.obj.pos.x,
            target.obj.pos.y - this.player.obj.pos.y,
          )
          .unit()
      : this.k.vec2(1, 0);
    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    const pierceLevel = this.player.stats.upgrades["arrow-pierce"] ?? 0;

    const hasFireSynergy =
      this.player.stats.weapons.includes("fireTrail") && pierceLevel > 0;
    const damage = hasFireSynergy
      ? stats.damage * FIRE_ARROW_BONUS_MULT
      : stats.damage;

    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.12;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      const proj = spawnProjectile(this.k, {
        kind: "pierce",
        weapon,
        sprite: WEAPON_DEFS[weapon].spriteKey,
        x: this.player.obj.pos.x,
        y: this.player.obj.pos.y,
        dir,
        speed: stats.speed,
        damage,
        area: stats.area,
        maxRange: stats.range,
        piercesLeft: 2 + pierceLevel,
        rotationOffset: 45,
      });

      if (hasFireSynergy) {
        proj.obj.color = this.k.rgb(255, 140, 30);
      }

      this.projectiles.push(proj);
    }
  }

  private fireArrowHail(stats: WeaponStats): void {
    const pierceLevel = this.player.stats.upgrades["arrow-pierce"] ?? 0;
    const hasFireSynergy =
      this.player.stats.weapons.includes("fireTrail") && pierceLevel > 0;
    const damage = hasFireSynergy ? stats.damage * FIRE_ARROW_BONUS_MULT : stats.damage;
    const count = Math.max(8, stats.count);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      const proj = spawnProjectile(this.k, {
        kind: "pierce",
        weapon: "arrowHail",
        sprite: WEAPON_DEFS.arrowHail.spriteKey,
        x: this.player.obj.pos.x,
        y: this.player.obj.pos.y,
        dir,
        speed: stats.speed,
        damage,
        area: stats.area,
        maxRange: stats.range,
        piercesLeft: 3 + pierceLevel,
        rotationOffset: 45,
      });

      if (hasFireSynergy) {
        proj.obj.color = this.k.rgb(255, 140, 30);
      }

      this.projectiles.push(proj);
    }
  }

  private fireBomb(stats: WeaponStats, weapon: WeaponId): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    const baseDir = target
      ? this.k
          .vec2(
            target.obj.pos.x - this.player.obj.pos.x,
            target.obj.pos.y - this.player.obj.pos.y,
          )
          .unit()
      : this.k.vec2(1, 0);

    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    const scale = weapon === "megaBomb" ? 4 : 2.5;
    for (let i = 0; i < stats.count; i += 1) {
      const angle = baseAngle + (i - (stats.count - 1) / 2) * 0.3;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "bomb",
          weapon,
          sprite: WEAPON_DEFS[weapon].spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          scale,
        }),
      );
    }
  }

  private dropCaltrops(stats: WeaponStats, nowMs: number, weapon: WeaponId): void {
    const lifetime = weapon === "bloodspikes" ? CALTROP_LIFETIME_MS * 1.5 : CALTROP_LIFETIME_MS;
    const scale = weapon === "bloodspikes" ? 1.6 : 1;
    for (let i = 0; i < stats.count; i += 1) {
      const angle = (Math.PI * 2 * i) / stats.count + this.k.rand(-0.3, 0.3);
      const distance = this.k.rand(stats.range * 0.4, stats.range);
      const x = this.player.obj.pos.x + Math.cos(angle) * distance;
      const y = this.player.obj.pos.y + Math.sin(angle) * distance;
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "ground",
          weapon,
          sprite: WEAPON_DEFS[weapon].spriteKey,
          x,
          y,
          dir: this.k.vec2(1, 0),
          speed: 0,
          damage: stats.damage,
          area: stats.area,
          maxRange: 0,
          lifetimeMs: lifetime,
          scale,
        }),
      );
    }
    void nowMs;
  }

  private dropFireTrail(stats: WeaponStats): void {
    const px = this.player.obj.pos.x;
    const py = this.player.obj.pos.y;
    const dx = px - this.lastFireDropX;
    const dy = py - this.lastFireDropY;
    if (dx * dx + dy * dy < FIRE_TRAIL_DROP_DIST * FIRE_TRAIL_DROP_DIST) return;

    this.lastFireDropX = px;
    this.lastFireDropY = py;

    const areaLevel = this.player.stats.upgrades["fireTrail-area"] ?? 0;
    const area = stats.area * Math.pow(1.2, areaLevel);
    const scale = 0.9 + areaLevel * 0.15;

    const obj = this.k.add([
      this.k.sprite("fire-ground"),
      this.k.pos(px, py),
      this.k.anchor("center"),
      this.k.scale(scale),
      this.k.opacity(0.85),
      this.k.z(2),
    ]);

    const proj: Projectile = {
      obj,
      kind: "ground",
      weapon: "fireTrail",
      dir: this.k.vec2(0, 0),
      speed: 0,
      damage: stats.damage,
      area,
      distance: 0,
      maxRange: 0,
      returning: false,
      originX: px,
      originY: py,
      orbitAngle: 0,
      orbitRadius: 0,
      orbitSpeed: 0,
      piercesLeft: 0,
      lifetimeMs: FIRE_TRAIL_LIFETIME_MS,
      elapsedMs: 0,
      rotationOffset: 0,
      hitCooldownsMs: new Map(),
    };
    this.projectiles.push(proj);
  }

  private ensureOrbit(
    weaponId: WeaponId,
    stats: WeaponStats,
    opts: { radius: number; speed: number; scale: number },
  ): void {
    const existing = this.projectiles.filter((p) => p.kind === "orbit" && p.weapon === weaponId);
    const target = Math.max(1, stats.count);

    for (let i = existing.length; i > target; i -= 1) {
      const toRemove = this.projectiles.findIndex(
        (p) => p.kind === "orbit" && p.weapon === weaponId,
      );
      if (toRemove >= 0) {
        this.projectiles[toRemove].obj.destroy();
        this.projectiles.splice(toRemove, 1);
      }
    }

    for (let i = existing.length; i < target; i += 1) {
      const angle = (Math.PI * 2 * i) / target;
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "orbit",
          weapon: weaponId,
          sprite: WEAPON_DEFS[weaponId].spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir: this.k.vec2(1, 0),
          speed: 0,
          damage: stats.damage,
          area: stats.area,
          maxRange: 0,
          orbitAngle: angle,
          orbitRadius: opts.radius,
          orbitSpeed: opts.speed,
          scale: opts.scale,
        }),
      );
    }

    for (const orb of this.projectiles) {
      if (orb.kind === "orbit" && orb.weapon === weaponId) {
        orb.damage = stats.damage;
        orb.orbitRadius = opts.radius;
        orb.orbitSpeed = opts.speed;
      }
    }
  }

  private updateProjectiles(nowMs: number, dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];

      if (p.kind === "orbit") {
        this.updateOrbit(p, dt);
        this.checkPersistentHits(p, nowMs, MAGIC_ORB_HIT_COOLDOWN_MS);
        this.checkBossHit(p);
        continue;
      }

      if (p.kind === "ground") {
        p.elapsedMs += dt * 1000;
        if (p.weapon === "samuraiSword") {
          this.updateSamuraiSlash(p);
          this.checkSamuraiSlashHits(p);
          this.checkBossHit(p);
        } else {
          const cooldown =
            p.weapon === "fireTrail"
              ? FIRE_TRAIL_HIT_COOLDOWN_MS
              : p.weapon === "poisonCloud"
                ? POISON_CLOUD_HIT_COOLDOWN_MS
                : CALTROP_HIT_COOLDOWN_MS;
          this.checkPersistentHits(p, nowMs, cooldown);
          this.checkBossHit(p);
        }

        if (p.weapon === "fireTrail") {
          const lifeRatio = p.elapsedMs / (p.lifetimeMs || 1);
          const flicker = 0.6 + 0.25 * Math.sin(nowMs * 0.012 + p.originX);
          p.obj.opacity = flicker * (1 - lifeRatio * 0.7);
        } else if (p.weapon === "poisonCloud") {
          const lifeRatio = p.elapsedMs / (p.lifetimeMs || 1);
          const pulse = 0.75 + 0.15 * Math.sin(nowMs * 0.006 + p.originX);
          p.obj.opacity = pulse * (1 - lifeRatio * 0.9);
        }

        if (p.lifetimeMs > 0 && p.elapsedMs >= p.lifetimeMs) {
          p.obj.destroy();
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      if (p.kind === "bomb") {
        this.updateBomb(p, dt);
        if (p.distance >= p.maxRange) {
          this.explodeBomb(p);
          p.obj.destroy();
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      if (p.kind === "boomerang") {
        this.updateBoomerang(p, dt);
      } else if (p.kind === "pierce") {
        const step = p.dir.scale(p.speed * dt);
        p.obj.pos = p.obj.pos.add(step);
        p.distance += step.len();
        (p.obj as { angle?: number }).angle =
          Math.atan2(p.dir.y, p.dir.x) * (180 / Math.PI) + p.rotationOffset;
      } else {
        if (p.weapon === "homingShuriken") {
          const t = this.spawner.nearest(p.obj.pos.x, p.obj.pos.y);
          if (t) {
            const tx = t.obj.pos.x - p.obj.pos.x;
            const ty = t.obj.pos.y - p.obj.pos.y;
            const len = Math.hypot(tx, ty) || 1;
            const desiredX = tx / len;
            const desiredY = ty / len;
            const blend = Math.min(1, HOMING_TURN_RATE * dt);
            const blended = this.k.vec2(
              p.dir.x * (1 - blend) + desiredX * blend,
              p.dir.y * (1 - blend) + desiredY * blend,
            );
            const blendedLen = Math.hypot(blended.x, blended.y) || 1;
            p.dir = this.k.vec2(blended.x / blendedLen, blended.y / blendedLen);
          }
        }
        const step = p.dir.scale(p.speed * dt);
        p.obj.pos = p.obj.pos.add(step);
        p.distance += step.len();
        (p.obj as { angle?: number }).angle = ((p.obj as { angle?: number }).angle ?? 0) + dt * 720;
      }

      if (p.kind === "pierce") {
        this.handlePierceHits(p, nowMs);
        this.checkBossHit(p);
        if (p.piercesLeft <= 0 || p.distance >= p.maxRange) {
          p.obj.destroy();
          this.projectiles.splice(i, 1);
        }
        continue;
      }

      const hitIndex = this.findEnemyHit(p);
      if (hitIndex >= 0) {
        this.applyHit(p, hitIndex);
        if (p.kind === "linear") {
          p.obj.destroy();
          this.projectiles.splice(i, 1);
          continue;
        }
        if (p.kind === "boomerang") {
          p.returning = true;
        }
      } else {
        this.checkBossHit(p);
      }

      if (p.kind === "linear" && p.distance >= p.maxRange) {
        p.obj.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.kind === "boomerang" && p.returning) {
        const dx = this.player.obj.pos.x - p.obj.pos.x;
        const dy = this.player.obj.pos.y - p.obj.pos.y;
        if (Math.hypot(dx, dy) < 24) {
          p.obj.destroy();
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private applyHit(p: Projectile, enemyIndex: number): void {
    const enemy = this.spawner.enemies[enemyIndex];
    const damage = Math.min(enemy.hp, p.damage);
    enemy.hp -= p.damage;
    this.stats.record(p.weapon, damage);
    this.onDamageDealt(damage);
    const killed = enemy.hp <= 0;

    if (p.weapon === "frostbolt" && !killed) {
      enemy.slowMult = FROSTBOLT_SLOW_MULT;
      enemy.slowExpiresMs = Date.now() + FROSTBOLT_SLOW_MS;
    }

    impactVfx(this.k, {
      x: enemy.obj.pos.x,
      y: enemy.obj.pos.y,
      color: WEAPON_HIT_COLORS[p.weapon] ?? [255, 255, 255],
      kill: killed,
    });

    if (killed) {
      this.onEnemyDeath(enemy, enemyIndex);
    } else {
      this.onEnemyHit();
    }
  }

  private handlePierceHits(p: Projectile, nowMs: number): void {
    for (let j = this.spawner.enemies.length - 1; j >= 0; j -= 1) {
      const enemy = this.spawner.enemies[j];
      const range = p.area + enemy.area * 0.5;
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      if (dx * dx + dy * dy > range * range) continue;

      const last = p.hitCooldownsMs.get(enemyId(enemy)) ?? -Number.MAX_SAFE_INTEGER;
      if (nowMs - last < 150) continue;
      p.hitCooldownsMs.set(enemyId(enemy), nowMs);

      this.applyHit(p, j);
      p.piercesLeft -= 1;
      if (p.piercesLeft <= 0) break;
    }
  }

  private checkPersistentHits(p: Projectile, nowMs: number, cooldownMs: number): void {
    for (let i = this.spawner.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.spawner.enemies[i];
      const range = p.area + enemy.area * 0.5;
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      if (dx * dx + dy * dy > range * range) continue;

      const last = p.hitCooldownsMs.get(enemyId(enemy)) ?? -Number.MAX_SAFE_INTEGER;
      if (nowMs - last < cooldownMs) continue;
      p.hitCooldownsMs.set(enemyId(enemy), nowMs);

      this.applyHit(p, i);
    }
  }

  private explodeBomb(p: Projectile): void {
    this.k.shake(p.weapon === "holyWater" ? 3 : 6);
    const [r, g, b] = p.weapon === "holyWater" ? [140, 220, 255] : [255, 180, 80];
    const flash = this.k.add([
      this.k.circle(p.area),
      this.k.pos(p.obj.pos.x, p.obj.pos.y),
      this.k.anchor("center"),
      this.k.color(r, g, b),
      this.k.opacity(0.7),
      this.k.z(6),
    ]);
    let t = 0;
    flash.onUpdate(() => {
      t += this.k.dt();
      (flash as unknown as { opacity: number }).opacity = Math.max(0, 0.7 - t * 2);
      if (t > 0.35) flash.destroy();
    });

    for (let i = this.spawner.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.spawner.enemies[i];
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      if (dx * dx + dy * dy > p.area * p.area) continue;
      this.applyHit(p, i);
    }
    this.checkBossHit(p);
  }

  private updateBomb(p: Projectile, dt: number): void {
    const step = p.dir.scale(p.speed * dt);
    p.obj.pos = p.obj.pos.add(step);
    p.distance += step.len();
    (p.obj as { angle?: number }).angle = ((p.obj as { angle?: number }).angle ?? 0) + dt * 360;
  }

  private updateBoomerang(p: Projectile, dt: number): void {
    if (!p.returning) {
      const step = p.dir.scale(p.speed * dt);
      p.obj.pos = p.obj.pos.add(step);
      p.distance += step.len();
      if (p.distance >= p.maxRange) p.returning = true;
    } else {
      const dx = this.player.obj.pos.x - p.obj.pos.x;
      const dy = this.player.obj.pos.y - p.obj.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      p.obj.pos.x += (dx / len) * p.speed * dt;
      p.obj.pos.y += (dy / len) * p.speed * dt;
    }
    (p.obj as { angle?: number }).angle = ((p.obj as { angle?: number }).angle ?? 0) + dt * 540;
  }

  private updateOrbit(p: Projectile, dt: number): void {
    p.orbitAngle += p.orbitSpeed * dt;
    p.obj.pos.x = this.player.obj.pos.x + Math.cos(p.orbitAngle) * p.orbitRadius;
    p.obj.pos.y = this.player.obj.pos.y + Math.sin(p.orbitAngle) * p.orbitRadius;
    if (p.weapon === "dualKatana") {
      (p.obj as { angle?: number }).angle =
        ((p.obj as { angle?: number }).angle ?? 0) + dt * 1400;
    }
  }

  private findEnemyHit(p: Projectile): number {
    for (let j = 0; j < this.spawner.enemies.length; j += 1) {
      const enemy = this.spawner.enemies[j];
      const range = p.area + enemy.area * 0.5;
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      if (dx * dx + dy * dy <= range * range) return j;
    }
    return -1;
  }

  /** Check if a projectile hits the super boss and apply damage. */
  private checkBossHit(p: Projectile): void {
    const boss = this.superBoss;
    if (!boss || boss.phase === "dead" || boss.phase === "airborne") return;
    const range = p.area + BOSS_AREA;
    const dx = boss.obj.pos.x - p.obj.pos.x;
    const dy = boss.obj.pos.y - p.obj.pos.y;
    if (dx * dx + dy * dy > range * range) return;

    // Cooldown for persistent projectiles (orbit, ground, etc.)
    const BOSS_HIT_ID = -999;
    const lastHit = p.hitCooldownsMs.get(BOSS_HIT_ID) ?? -Infinity;
    const now = performance.now();
    if (now - lastHit < 150) return;
    p.hitCooldownsMs.set(BOSS_HIT_ID, now);

    const bonus = this.player.stats.damageMult * this.player.stats.damageBuffMult;
    const dmg = Math.floor(p.damage * bonus);
    boss.hp -= dmg;
    this.stats.record(p.weapon, dmg);
    this.onDamageDealt(dmg);
    impactVfx(this.k, {
      x: boss.obj.pos.x, y: boss.obj.pos.y,
      color: WEAPON_HIT_COLORS[p.weapon] ?? [255, 255, 255],
    });
    this.onEnemyHit();
  }
}

const WEAPON_HIT_COLORS: Partial<Record<WeaponId, [number, number, number]>> = {
  shuriken: [220, 220, 255],
  magicOrb: [100, 160, 255],
  boomerang: [200, 200, 200],
  arrow: [255, 240, 180],
  bomb: [255, 160, 60],
  caltrop: [180, 220, 180],
  fireTrail: [255, 100, 20],
  holyBeam: [255, 245, 180],
  holyWater: [140, 220, 255],
  laserPointer: [255, 60, 60],
  frostbolt: [180, 230, 255],
  poisonCloud: [140, 220, 120],
  crossbow: [220, 200, 150],
  chainLightning: [255, 235, 120],
  homingShuriken: [220, 220, 255],
};

function enemyId(enemy: Enemy): number {
  const obj = enemy.obj as unknown as { id?: number };
  return obj.id ?? 0;
}

function damageBonusFor(weaponId: WeaponId): number {
  switch (weaponId) {
    case "shuriken": return 6;
    case "magicOrb": return 4;
    case "boomerang": return 8;
    case "arrow": return 6;
    case "bomb": return 20;
    case "caltrop": return 4;
    case "samuraiSword": return 10;
    case "dualKatana": return 8;
    case "stormShuriken": return 6;
    case "arcaneHalo": return 5;
    case "warhammerKunai": return 14;
    case "arrowHail": return 5;
    case "megaBomb": return 28;
    case "bloodspikes": return 5;
    case "fireTrail": return 5;
    case "holyBeam": return 8;
    case "holyWater": return 4;
    case "judasPriest": return 6;
    case "laserPointer": return 4;
    case "frostbolt": return 6;
    case "poisonCloud": return 3;
    case "crossbow": return 18;
    case "chainLightning": return 6;
    case "homingShuriken": return 8;
  }
}

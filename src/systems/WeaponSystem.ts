import type { KAPLAYCtx } from "kaplay";
import { WEAPON_DEFS, type WeaponId, type WeaponStats } from "../config/WeaponDefs";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import { spawnProjectile, type Projectile } from "../entities/Projectile";
import type { EnemySpawner } from "./EnemySpawner";
import type { StatsTracker } from "./StatsTracker";

const MAGIC_ORB_HIT_COOLDOWN_MS = 500;
const CALTROP_HIT_COOLDOWN_MS = 400;
const CALTROP_LIFETIME_MS = 6000;

interface WeaponState {
  lastFireMs: number;
}

export class WeaponSystem {
  public projectiles: Projectile[] = [];
  private weaponStates: Map<WeaponId, WeaponState> = new Map();

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

    if (nowMs - state.lastFireMs < stats.cooldownMs) return;
    state.lastFireMs = nowMs;

    switch (weaponId) {
      case "shuriken":
        this.fireShuriken(stats);
        break;
      case "boomerang":
        this.fireBoomerang(stats);
        break;
      case "arrow":
        this.fireArrow(stats);
        break;
      case "bomb":
        this.fireBomb(stats);
        break;
      case "caltrop":
        this.dropCaltrops(stats, nowMs);
        break;
      case "samuraiSword":
        this.fireSamuraiSlash(stats);
        break;
    }
  }

  private fireSamuraiSlash(stats: WeaponStats): void {
    const p = this.player.obj.pos;
    const target = this.spawner.nearest(p.x, p.y);
    const dir = target
      ? this.k.vec2(target.obj.pos.x - p.x, target.obj.pos.y - p.y).unit()
      : this.k.vec2(1, 0);
    const offset = 42;
    const sx = p.x + dir.x * offset;
    const sy = p.y + dir.y * offset;
    this.projectiles.push(
      spawnProjectile(this.k, {
        kind: "ground",
        weapon: "samuraiSword",
        sprite: WEAPON_DEFS.samuraiSword.spriteKey,
        x: sx,
        y: sy,
        dir,
        speed: 0,
        damage: stats.damage,
        area: stats.area,
        maxRange: 0,
        lifetimeMs: 320,
        scale: 4.5,
      }),
    );
  }

  private fireShuriken(stats: WeaponStats): void {
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
          weapon: "shuriken",
          sprite: WEAPON_DEFS.shuriken.spriteKey,
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

  private fireBoomerang(stats: WeaponStats): void {
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
    for (let i = 0; i < stats.count; i += 1) {
      const angle = baseAngle + (i - (stats.count - 1) / 2) * 0.6;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "boomerang",
          weapon: "boomerang",
          sprite: WEAPON_DEFS.boomerang.spriteKey,
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

  private fireArrow(stats: WeaponStats): void {
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

    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * 0.12;
      const angle = baseAngle + offset;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "pierce",
          weapon: "arrow",
          sprite: WEAPON_DEFS.arrow.spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          piercesLeft: 2 + pierceLevel,
          rotationOffset: 45,
        }),
      );
    }
  }

  private fireBomb(stats: WeaponStats): void {
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
    for (let i = 0; i < stats.count; i += 1) {
      const angle = baseAngle + (i - (stats.count - 1) / 2) * 0.3;
      const dir = this.k.vec2(Math.cos(angle), Math.sin(angle));
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "bomb",
          weapon: "bomb",
          sprite: WEAPON_DEFS.bomb.spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir,
          speed: stats.speed,
          damage: stats.damage,
          area: stats.area,
          maxRange: stats.range,
          scale: 2.5,
        }),
      );
    }
  }

  private dropCaltrops(stats: WeaponStats, nowMs: number): void {
    for (let i = 0; i < stats.count; i += 1) {
      const angle = (Math.PI * 2 * i) / stats.count + this.k.rand(-0.3, 0.3);
      const distance = this.k.rand(stats.range * 0.4, stats.range);
      const x = this.player.obj.pos.x + Math.cos(angle) * distance;
      const y = this.player.obj.pos.y + Math.sin(angle) * distance;
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "ground",
          weapon: "caltrop",
          sprite: WEAPON_DEFS.caltrop.spriteKey,
          x,
          y,
          dir: this.k.vec2(1, 0),
          speed: 0,
          damage: stats.damage,
          area: stats.area,
          maxRange: 0,
          lifetimeMs: CALTROP_LIFETIME_MS,
        }),
      );
    }
    void nowMs;
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
        continue;
      }

      if (p.kind === "ground") {
        p.elapsedMs += dt * 1000;
        if (p.weapon === "samuraiSword") {
          (p.obj as { angle?: number }).angle =
            ((p.obj as { angle?: number }).angle ?? 0) + dt * 1800;
          this.checkPersistentHits(p, nowMs, 500);
        } else {
          this.checkPersistentHits(p, nowMs, CALTROP_HIT_COOLDOWN_MS);
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
        const step = p.dir.scale(p.speed * dt);
        p.obj.pos = p.obj.pos.add(step);
        p.distance += step.len();
        (p.obj as { angle?: number }).angle = ((p.obj as { angle?: number }).angle ?? 0) + dt * 720;
      }

      if (p.kind === "pierce") {
        this.handlePierceHits(p, nowMs);
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
    if (enemy.hp <= 0) {
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
    this.k.shake(6);
    const flash = this.k.add([
      this.k.circle(p.area),
      this.k.pos(p.obj.pos.x, p.obj.pos.y),
      this.k.anchor("center"),
      this.k.color(255, 180, 80),
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
}

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
  }
}

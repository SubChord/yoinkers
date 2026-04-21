import type { KAPLAYCtx } from "kaplay";
import { WEAPON_DEFS, type WeaponId, type WeaponStats } from "../config/WeaponDefs";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import {
  spawnProjectile,
  type Projectile,
} from "../entities/Projectile";
import type { EnemySpawner } from "./EnemySpawner";

const MAGIC_ORB_HIT_COOLDOWN_MS = 500;

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

    const damageBonus =
      weaponId === "shuriken" ? level * 6 : weaponId === "boomerang" ? level * 8 : level * 4;
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
      this.ensureOrbs(stats);
      return;
    }

    if (nowMs - state.lastFireMs < stats.cooldownMs) {
      return;
    }
    state.lastFireMs = nowMs;

    if (weaponId === "shuriken") {
      this.fireShuriken(stats);
    } else if (weaponId === "boomerang") {
      this.fireBoomerang(stats);
    }
  }

  private fireShuriken(stats: WeaponStats): void {
    const target = this.spawner.nearest(this.player.obj.pos.x, this.player.obj.pos.y);
    if (!target) return;
    const baseDir = this.k
      .vec2(target.obj.pos.x - this.player.obj.pos.x, target.obj.pos.y - this.player.obj.pos.y)
      .unit();

    const baseAngle = Math.atan2(baseDir.y, baseDir.x);
    const spread = 0.25;
    for (let i = 0; i < stats.count; i += 1) {
      const offset = stats.count === 1 ? 0 : (i - (stats.count - 1) / 2) * spread;
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

  private ensureOrbs(stats: WeaponStats): void {
    const existing = this.projectiles.filter((p) => p.kind === "orbit" && p.weapon === "magicOrb");

    for (let i = existing.length; i < stats.count; i += 1) {
      const angle = (Math.PI * 2 * i) / Math.max(1, stats.count);
      this.projectiles.push(
        spawnProjectile(this.k, {
          kind: "orbit",
          weapon: "magicOrb",
          sprite: WEAPON_DEFS.magicOrb.spriteKey,
          x: this.player.obj.pos.x,
          y: this.player.obj.pos.y,
          dir: this.k.vec2(1, 0),
          speed: 0,
          damage: stats.damage,
          area: stats.area,
          maxRange: 0,
          orbitAngle: angle,
          orbitRadius: 60,
          orbitSpeed: 2.4,
        }),
      );
    }

    for (const orb of this.projectiles) {
      if (orb.kind === "orbit" && orb.weapon === "magicOrb") {
        orb.damage = stats.damage;
      }
    }
  }

  private updateProjectiles(nowMs: number, dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const p = this.projectiles[i];

      if (p.kind === "orbit") {
        this.updateOrbit(p, dt);
        this.checkOrbitHits(p, nowMs);
        continue;
      }

      if (p.kind === "boomerang") {
        this.updateBoomerang(p, dt);
      } else {
        const step = p.dir.scale(p.speed * dt);
        p.obj.pos = p.obj.pos.add(step);
        p.distance += step.len();
        (p.obj as { angle?: number }).angle = ((p.obj as { angle?: number }).angle ?? 0) + dt * 720;
      }

      const hitIndex = this.findEnemyHit(p);
      if (hitIndex >= 0) {
        const enemy = this.spawner.enemies[hitIndex];
        enemy.hp -= p.damage;
        if (enemy.hp <= 0) {
          this.onEnemyDeath(enemy, hitIndex);
        } else {
          this.onEnemyHit();
        }
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

  private updateBoomerang(p: Projectile, dt: number): void {
    if (!p.returning) {
      const step = p.dir.scale(p.speed * dt);
      p.obj.pos = p.obj.pos.add(step);
      p.distance += step.len();
      if (p.distance >= p.maxRange) {
        p.returning = true;
      }
    } else {
      const dx = this.player.obj.pos.x - p.obj.pos.x;
      const dy = this.player.obj.pos.y - p.obj.pos.y;
      const len = Math.hypot(dx, dy) || 1;
      p.obj.pos.x += (dx / len) * p.speed * dt;
      p.obj.pos.y += (dy / len) * p.speed * dt;
    }
    const angleDeg = Math.atan2(p.dir.y, p.dir.x) * (180 / Math.PI);
    (p.obj as { angle?: number }).angle = (angleDeg + p.distance) % 360;
  }

  private updateOrbit(p: Projectile, dt: number): void {
    p.orbitAngle += p.orbitSpeed * dt;
    p.obj.pos.x = this.player.obj.pos.x + Math.cos(p.orbitAngle) * p.orbitRadius;
    p.obj.pos.y = this.player.obj.pos.y + Math.sin(p.orbitAngle) * p.orbitRadius;
  }

  private checkOrbitHits(p: Projectile, nowMs: number): void {
    for (let i = this.spawner.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.spawner.enemies[i];
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      const range = p.area + enemy.area * 0.5;
      if (dx * dx + dy * dy > range * range) continue;

      const last = p.hitCooldownsMs.get(enemyId(enemy)) ?? -Number.MAX_SAFE_INTEGER;
      if (nowMs - last < MAGIC_ORB_HIT_COOLDOWN_MS) continue;
      p.hitCooldownsMs.set(enemyId(enemy), nowMs);

      enemy.hp -= p.damage;
      if (enemy.hp <= 0) {
        this.onEnemyDeath(enemy, i);
      } else {
        this.onEnemyHit();
      }
    }
  }

  private findEnemyHit(p: Projectile): number {
    for (let j = 0; j < this.spawner.enemies.length; j += 1) {
      const enemy = this.spawner.enemies[j];
      const dx = enemy.obj.pos.x - p.obj.pos.x;
      const dy = enemy.obj.pos.y - p.obj.pos.y;
      const range = p.area + enemy.area * 0.5;
      if (dx * dx + dy * dy <= range * range) {
        return j;
      }
    }
    return -1;
  }
}

function enemyId(enemy: Enemy): number {
  const obj = enemy.obj as unknown as { id?: number };
  return obj.id ?? 0;
}

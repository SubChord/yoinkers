import type { KAPLAYCtx, GameObj, Vec2 } from "kaplay";
import type { WeaponId } from "../config/WeaponDefs";

export type ProjectileKind =
  | "linear"
  | "boomerang"
  | "orbit"
  | "pierce"
  | "bomb"
  | "ground";

export interface Projectile {
  obj: GameObj;
  kind: ProjectileKind;
  weapon: WeaponId;
  dir: Vec2;
  speed: number;
  damage: number;
  area: number;
  distance: number;
  maxRange: number;
  returning: boolean;
  originX: number;
  originY: number;
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  piercesLeft: number;
  lifetimeMs: number;
  elapsedMs: number;
  hitCooldownsMs: Map<number, number>;
}

export interface ProjectileSpawnOpts {
  kind: ProjectileKind;
  weapon: WeaponId;
  sprite: string;
  x: number;
  y: number;
  dir: Vec2;
  speed: number;
  damage: number;
  area: number;
  maxRange: number;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  piercesLeft?: number;
  lifetimeMs?: number;
  scale?: number;
}

export function spawnProjectile(k: KAPLAYCtx, opts: ProjectileSpawnOpts): Projectile {
  const rotation = Math.atan2(opts.dir.y, opts.dir.x) * (180 / Math.PI);
  const rotatable =
    opts.kind === "linear" || opts.kind === "pierce" || opts.kind === "boomerang";

  const obj = k.add([
    k.sprite(opts.sprite, opts.kind === "orbit" ? { anim: "spin" } : { frame: 0 }),
    k.pos(opts.x, opts.y),
    k.anchor("center"),
    k.scale(opts.scale ?? (opts.kind === "orbit" ? 1.5 : 2)),
    k.rotate(rotatable ? rotation : 0),
    k.z(opts.kind === "ground" ? 2 : 7),
  ]);

  return {
    obj,
    kind: opts.kind,
    weapon: opts.weapon,
    dir: opts.dir,
    speed: opts.speed,
    damage: opts.damage,
    area: opts.area,
    distance: 0,
    maxRange: opts.maxRange,
    returning: false,
    originX: opts.x,
    originY: opts.y,
    orbitAngle: opts.orbitAngle ?? 0,
    orbitRadius: opts.orbitRadius ?? 48,
    orbitSpeed: opts.orbitSpeed ?? 2.5,
    piercesLeft: opts.piercesLeft ?? 0,
    lifetimeMs: opts.lifetimeMs ?? 0,
    elapsedMs: 0,
    hitCooldownsMs: new Map(),
  };
}

import type { GearId } from "../config/GearDefs";
import type { WeaponId } from "../config/WeaponDefs";

export type Facing = "down" | "up" | "left" | "right";

export interface PlayerStats {
  hp: number;
  maxHp: number;
  speed: number;
  xp: number;
  level: number;
  regenPerSec: number;
  magnetMult: number;
  damageMult: number;
  cooldownMult: number;
  xpMult: number;
  damageBuffMult: number;
  speedBuffMult: number;
  damageBuffExpiresMs: number;
  speedBuffExpiresMs: number;
  weapons: WeaponId[];
  upgrades: Record<string, number>;
  gear: Partial<Record<GearId, number>>;
}

export interface EndStats {
  won: boolean;
  enemiesKilled: number;
  level: number;
  wave: number;
  timeSurvivedMs: number;
  damageByWeapon: Record<string, number>;
  totalDamage: number;
}

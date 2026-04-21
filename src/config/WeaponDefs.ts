export type WeaponId = "shuriken" | "magicOrb" | "boomerang";

export interface WeaponStats {
  damage: number;
  cooldownMs: number;
  speed: number;
  range: number;
  count: number;
  area: number;
}

export interface WeaponDef {
  id: WeaponId;
  label: string;
  spriteKey: string;
  base: WeaponStats;
}

export const WEAPON_DEFS: Record<WeaponId, WeaponDef> = {
  shuriken: {
    id: "shuriken",
    label: "Shuriken",
    spriteKey: "shuriken",
    base: {
      damage: 20,
      cooldownMs: 800,
      speed: 360,
      range: 380,
      count: 1,
      area: 22,
    },
  },
  magicOrb: {
    id: "magicOrb",
    label: "Magic Orb",
    spriteKey: "magic-orb",
    base: {
      damage: 12,
      cooldownMs: 600,
      speed: 0,
      range: 90,
      count: 1,
      area: 26,
    },
  },
  boomerang: {
    id: "boomerang",
    label: "Kunai",
    spriteKey: "boomerang",
    base: {
      damage: 28,
      cooldownMs: 1600,
      speed: 320,
      range: 420,
      count: 1,
      area: 24,
    },
  },
};

export const WEAPON_IDS: WeaponId[] = Object.keys(WEAPON_DEFS) as WeaponId[];
